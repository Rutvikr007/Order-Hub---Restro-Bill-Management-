import { z } from "zod";

export const orderItemSchema = z.object({
  item_id: z.string().min(1, "item_id is required"), // a foods.id
  qty: z.number().int().positive("qty must be a positive integer"),
});

export const createOrderSchema = z.object({
  store_id: z.string().min(1, "store_id is required"),
  customer_name: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  items: z.array(orderItemSchema).min(1, "at least one item is required"),
  // total_amount is intentionally NOT accepted from the client anymore -
  // it is computed server-side from the foods catalog so the bill always
  // matches the saved price, not whatever the browser sent.
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["PLACED", "PREPARING", "COMPLETED"]),
});

export const listOrdersQuerySchema = z.object({
  store_id: z.string().min(1, "store_id is required"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(["PLACED", "PREPARING", "COMPLETED"]).optional(),
});

export const topItemsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).default(5),
  store_id: z.string().min(1).optional(),
});

export const ordersPerDayQuerySchema = z.object({
  store_id: z.string().min(1).optional(),
  days: z.coerce.number().int().positive().max(365).default(30),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
