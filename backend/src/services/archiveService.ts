import { pool } from "../config/db";

export interface ArchiveResult {
  archived_count: number;
  cutoff_date: string;
}

/**
 * Moves every order older than `afterDays` into orders_archive.
 * Runs as a single transaction so a crash mid-way never leaves an order
 * duplicated in both tables or lost from both.
 */
export async function archiveOldOrders(afterDays: number): Promise<ArchiveResult> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const cutoffResult = await client.query<{ cutoff: string }>(
      `SELECT (now() - $1::interval)::text AS cutoff`,
      [`${afterDays} days`]
    );
    const cutoff = cutoffResult.rows[0].cutoff;

    const insertResult = await client.query(
      `INSERT INTO orders_archive (id, store_id, customer_name, items, total_amount, status, created_at, updated_at)
       SELECT id, store_id, customer_name, items, total_amount, status, created_at, updated_at
       FROM orders
       WHERE created_at < now() - $1::interval
       ON CONFLICT (id) DO NOTHING`,
      [`${afterDays} days`]
    );

    const deleteResult = await client.query(
      `DELETE FROM orders WHERE created_at < now() - $1::interval`,
      [`${afterDays} days`]
    );

    await client.query("COMMIT");

    return {
      archived_count: deleteResult.rowCount ?? insertResult.rowCount ?? 0,
      cutoff_date: cutoff,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}