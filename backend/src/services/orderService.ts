import { pool } from "../config/db";
import { ApiError, Order, Paginated } from "../types";
import { CreateOrderInput, ListOrdersQuery, UpdateOrderStatusInput } from "../validators/orderValidators";

const ORDER_COLUMNS = "id, store_id, customer_name, items, total_amount, status, created_at, updated_at";

function getStoreNumber(storeId: string): string {
  const match = storeId.match(/(\d+)$/);
  if (!match) {
    throw new ApiError(400, `store_id must end with a numeric store number`);
  }

  return String(Number(match[1]));
}

function formatTrackingNumber(storeId: string, dateCode: string, sequence: number): string {
  return `#S${getStoreNumber(storeId)}-${dateCode}${String(sequence).padStart(5, "0")}`;
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const { store_id, customer_name, items } = input;

  // Look up each item's saved price from the food catalog rather than
  // trusting a client-supplied total - this is also what lets the order
  // screen skip asking for price entirely.
  const foodIds = items.map((i) => i.item_id);
  const { rows: foodRows } = await pool.query<{ id: string; price: string }>(
    `SELECT id, price FROM foods WHERE id = ANY($1::uuid[])`,
    [foodIds]
  );

  const priceById = new Map(foodRows.map((f) => [f.id, Number(f.price)]));
  const missing = foodIds.filter((id) => !priceById.has(id));
  if (missing.length > 0) {
    throw new ApiError(400, `Unknown food item(s): ${missing.join(", ")}`);
  }

  const totalAmount = items.reduce((sum, item) => sum + priceById.get(item.item_id)! * item.qty, 0);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const sequenceResult = await client.query<{ sequence_date: string; last_sequence: number }>(
      `INSERT INTO order_tracking_sequences (store_id, sequence_date, last_sequence)
       VALUES ($1, CURRENT_DATE, 1)
       ON CONFLICT (store_id, sequence_date)
       DO UPDATE SET last_sequence = order_tracking_sequences.last_sequence + 1
       RETURNING to_char(sequence_date, 'DDMMYYYY') AS sequence_date, last_sequence`,
      [store_id]
    );

    const { sequence_date, last_sequence } = sequenceResult.rows[0];
    const trackingNumber = formatTrackingNumber(store_id, sequence_date, last_sequence);

    const { rows } = await client.query<Order>(
      `INSERT INTO orders (id, store_id, customer_name, items, total_amount)
       VALUES ($1, $2, $3, $4::jsonb, $5)
       RETURNING ${ORDER_COLUMNS}`,
      [trackingNumber, store_id, customer_name ?? null, JSON.stringify(items), totalAmount]
    );

    await client.query("COMMIT");
    return rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Fetches a page of orders for a store, newest first.
 * Uses the (store_id, created_at DESC) composite index, and runs the
 * count query in parallel with the data query to keep latency low.
 */
export async function listOrdersByStore(query: ListOrdersQuery): Promise<Paginated<Order>> {
  const { store_id, page, limit, status } = query;
  const offset = (page - 1) * limit;

  const whereClauses = ["store_id = $1"];
  const params: unknown[] = [store_id];

  if (status) {
    params.push(status);
    whereClauses.push(`status = $${params.length}`);
  }

  const whereSql = whereClauses.join(" AND ");

  const dataParams = [...params, limit, offset];
  const dataQuery = `
    SELECT ${ORDER_COLUMNS}
    FROM orders
    WHERE ${whereSql}
    ORDER BY created_at DESC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;

  const countQuery = `SELECT COUNT(*)::int AS total FROM orders WHERE ${whereSql}`;

  const [dataResult, countResult] = await Promise.all([
    pool.query<Order>(dataQuery, dataParams),
    pool.query<{ total: number }>(countQuery, params),
  ]);

  const total = countResult.rows[0]?.total ?? 0;

  return {
    data: dataResult.rows,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function getOrderById(id: string): Promise<Order> {
  const { rows } = await pool.query<Order>(
    `SELECT ${ORDER_COLUMNS}
     FROM orders WHERE id = $1`,
    [id]
  );

  if (rows.length === 0) {
    throw new ApiError(404, `Order ${id} not found`);
  }

  return rows[0];
}

export async function updateOrderStatus(id: string, input: UpdateOrderStatusInput): Promise<Order> {
  const { rows } = await pool.query<Order>(
    `UPDATE orders
     SET status = $1
     WHERE id = $2
     RETURNING ${ORDER_COLUMNS}`,
    [input.status, id]
  );

  if (rows.length === 0) {
    throw new ApiError(404, `Order ${id} not found`);
  }

  return rows[0];
}
