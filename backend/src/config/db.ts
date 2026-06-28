import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  // A background, idle client error should never crash the whole process.
  console.error("Unexpected error on idle PostgreSQL client", err);
});

export async function checkDbConnection(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
  } finally {
    client.release();
  }
}
