import fs from "fs";
import path from "path";
import { pool } from "../config/db";
import { InvoiceConfig } from "../types";
import { InvoiceConfigInput } from "../validators/invoiceValidators";
import { UPLOADS_DIR } from "../middlewares/upload";

const INVOICE_COLUMNS =
  "store_id, restaurant_name, restaurant_address, gst_number, qr_image_path, footer_note, created_at, updated_at";
const DEFAULT_FOOTER_NOTE = "Thanks! Visit Again";

export async function getInvoiceConfigByStore(storeId: string): Promise<InvoiceConfig | null> {
  const { rows } = await pool.query<InvoiceConfig>(
    `SELECT ${INVOICE_COLUMNS}
     FROM invoice_configs
     WHERE store_id = $1`,
    [storeId]
  );

  return rows[0] ?? null;
}

export async function upsertInvoiceConfig(
  storeId: string,
  input: InvoiceConfigInput,
  qrImagePath?: string
): Promise<InvoiceConfig> {
  const existing = await getInvoiceConfigByStore(storeId);
  const nextFooterNote = input.footer_note ?? DEFAULT_FOOTER_NOTE;
  const nextQrImagePath = qrImagePath ?? null;

  const { rows } = await pool.query<InvoiceConfig>(
    `INSERT INTO invoice_configs (
       store_id, restaurant_name, restaurant_address, gst_number, qr_image_path, footer_note
     )
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (store_id) DO UPDATE
     SET restaurant_name = EXCLUDED.restaurant_name,
         restaurant_address = EXCLUDED.restaurant_address,
         gst_number = EXCLUDED.gst_number,
         qr_image_path = COALESCE(EXCLUDED.qr_image_path, invoice_configs.qr_image_path),
         footer_note = EXCLUDED.footer_note
     RETURNING ${INVOICE_COLUMNS}`,
    [
      storeId,
      input.restaurant_name,
      input.restaurant_address,
      input.gst_number,
      nextQrImagePath,
      nextFooterNote,
    ]
  );

  if (qrImagePath && existing?.qr_image_path && existing.qr_image_path !== qrImagePath) {
    deleteLocalImage(existing.qr_image_path);
  }

  return rows[0];
}

function deleteLocalImage(imagePath: string) {
  const filename = path.basename(imagePath);
  const fullPath = path.join(UPLOADS_DIR, filename);

  fs.unlink(fullPath, (error) => {
    if (error && error.code !== "ENOENT") {
      console.error(`Failed to remove invoice image ${fullPath}:`, error);
    }
  });
}
