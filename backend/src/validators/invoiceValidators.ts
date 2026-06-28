import { z } from "zod";

export const invoiceConfigParamsSchema = z.object({
  storeId: z.string().min(1, "storeId is required"),
});

export const invoiceConfigBodySchema = z.object({
  restaurant_name: z.string().trim().min(1, "restaurant_name is required"),
  restaurant_address: z.string().trim().min(1, "restaurant_address is required"),
  gst_number: z.string().trim().min(1, "gst_number is required"),
  footer_note: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
});

export type InvoiceConfigParams = z.infer<typeof invoiceConfigParamsSchema>;
export type InvoiceConfigInput = z.infer<typeof invoiceConfigBodySchema>;
