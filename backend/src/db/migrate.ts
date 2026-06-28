import fs from "fs";
import path from "path";
import { pool } from "../config/db";

type OrderRow = {
  source: "orders" | "orders_archive";
  id: string;
  store_id: string;
  created_date_key: string;
  created_date_code: string;
  created_at: string;
};

const TRACKING_NUMBER_RE = /^#S(\d+)-(\d{8})(\d{5})$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getStoreNumber(storeId: string): string {
  const match = storeId.match(/(\d+)$/);
  if (!match) {
    throw new Error(`store_id must end with a numeric store number: ${storeId}`);
  }

  return String(Number(match[1]));
}

function buildTrackingNumber(storeId: string, dateCode: string, sequence: number): string {
  return `#S${getStoreNumber(storeId)}-${dateCode}${String(sequence).padStart(5, "0")}`;
}

function parseTrackingSequence(id: string): number | null {
  const match = id.match(TRACKING_NUMBER_RE);
  return match ? Number(match[3]) : null;
}

async function migrate() {
  const schemaPath = path.join(__dirname, "schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf-8");

  console.log("Applying schema.sql ...");
  await pool.query(sql);
  console.log("Normalising order tracking numbers ...");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query<OrderRow>(`
      SELECT 'orders' AS source, id, store_id, to_char(created_at::date, 'DDMMYYYY') AS created_date_code,
             created_at::date::text AS created_date_key, created_at::text AS created_at
      FROM orders
      UNION ALL
      SELECT 'orders_archive' AS source, id, store_id, to_char(created_at::date, 'DDMMYYYY') AS created_date_code,
             created_at::date::text AS created_date_key, created_at::text AS created_at
      FROM orders_archive
      ORDER BY store_id, created_date_key, created_at, id
    `);

    const rowsByGroup = new Map<string, OrderRow[]>();
    for (const row of rows) {
      const key = `${row.store_id}|${row.created_date_key}`;
      const group = rowsByGroup.get(key) ?? [];
      group.push(row);
      rowsByGroup.set(key, group);
    }

    const updates: Array<{ source: "orders" | "orders_archive"; oldId: string; newId: string }> = [];
    const sequenceUpdates: Array<{ storeId: string; sequenceDate: string; lastSequence: number }> = [];

    for (const [groupKey, groupRows] of rowsByGroup.entries()) {
      const [storeId, sequenceDate] = groupKey.split("|");
      const dateCode = groupRows[0]?.created_date_code;
      if (!dateCode) continue;

      const existingSequences = groupRows
        .map((row) => parseTrackingSequence(row.id))
        .filter((value): value is number => value !== null);
      let nextSequence = existingSequences.length > 0 ? Math.max(...existingSequences) + 1 : 1;

      const uuidRows = groupRows
        .filter((row) => UUID_RE.test(row.id))
        .sort((left, right) => {
          const leftTime = new Date(left.created_at).getTime();
          const rightTime = new Date(right.created_at).getTime();
          if (leftTime !== rightTime) return leftTime - rightTime;
          return left.id.localeCompare(right.id);
        });

      for (const row of uuidRows) {
        updates.push({
          source: row.source,
          oldId: row.id,
          newId: buildTrackingNumber(storeId, dateCode, nextSequence),
        });
        nextSequence += 1;
      }

      sequenceUpdates.push({
        storeId,
        sequenceDate,
        lastSequence: Math.max(nextSequence - 1, ...existingSequences, 0),
      });
    }

    for (const update of updates) {
      const tableName = update.source === "orders" ? "orders" : "orders_archive";
      await client.query(`UPDATE ${tableName} SET id = $1 WHERE id = $2`, [update.newId, update.oldId]);
    }

    for (const sequenceUpdate of sequenceUpdates) {
      await client.query(
        `INSERT INTO order_tracking_sequences (store_id, sequence_date, last_sequence)
         VALUES ($1, $2::date, $3)
         ON CONFLICT (store_id, sequence_date)
         DO UPDATE SET last_sequence = GREATEST(order_tracking_sequences.last_sequence, EXCLUDED.last_sequence)`,
        [sequenceUpdate.storeId, sequenceUpdate.sequenceDate, sequenceUpdate.lastSequence]
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
  console.log("Migration complete.");
  await pool.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
