import { pool } from "../config/db";

/**
 * Analytics intentionally read from both `orders` and `orders_archive`
 * (via UNION ALL) so that archiving old orders never makes historical
 * reporting numbers drop. Each query is a single aggregation pass with
 * no N+1 pattern.
 */
const COMBINED_ORDERS_CTE = `
  WITH all_orders AS (
    SELECT store_id, items, total_amount, status, created_at FROM orders
    UNION ALL
    SELECT store_id, items, total_amount, status, created_at FROM orders_archive
  )
`;

export interface OrdersPerDayRow {
  day: string;
  order_count: number;
}

export async function getOrdersPerDay(storeId: string | undefined, days: number): Promise<OrdersPerDayRow[]> {
  const params: unknown[] = [days];
  let storeFilter = "";

  if (storeId) {
    params.push(storeId);
    storeFilter = `AND store_id = $2`;
  }

  const { rows } = await pool.query<OrdersPerDayRow>(
    `${COMBINED_ORDERS_CTE}
     SELECT
       date_trunc('day', created_at)::date::text AS day,
       COUNT(*)::int AS order_count
     FROM all_orders
     WHERE created_at >= now() - ($1::text || ' days')::interval
     ${storeFilter}
     GROUP BY day
     ORDER BY day ASC`,
    params
  );

  return rows;
}

export interface RevenuePerStoreRow {
  store_id: string;
  total_revenue: string;
  order_count: number;
}

export async function getRevenuePerStore(): Promise<RevenuePerStoreRow[]> {
  const { rows } = await pool.query<RevenuePerStoreRow>(
    `${COMBINED_ORDERS_CTE}
     SELECT
       store_id,
       SUM(total_amount)::numeric(14,2)::text AS total_revenue,
       COUNT(*)::int AS order_count
     FROM all_orders
     GROUP BY store_id
     ORDER BY SUM(total_amount) DESC`
  );

  return rows;
}

export interface TopItemRow {
  item_id: string;
  total_qty: number;
}

export async function getTopSellingItems(limit: number, storeId?: string): Promise<TopItemRow[]> {
  const params: unknown[] = [limit];
  let storeFilter = "";

  if (storeId) {
    params.push(storeId);
    storeFilter = "WHERE store_id = $2";
  }

  // jsonb_array_elements expands each order's items array into rows so
  // quantities can be summed per item_id across all orders.
  const { rows } = await pool.query<TopItemRow>(
    `${COMBINED_ORDERS_CTE}
     SELECT
       (elem->>'item_id') AS item_id,
       SUM((elem->>'qty')::int)::int AS total_qty
     FROM all_orders, jsonb_array_elements(items) AS elem
     ${storeFilter}
     GROUP BY item_id
     ORDER BY total_qty DESC
     LIMIT $1`,
    params
  );

  return rows;
}
