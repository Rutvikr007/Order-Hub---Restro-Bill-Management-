import { z } from "zod";

// Multipart form fields arrive as strings, so price is coerced from
// the "12.50" the <input type="number"> sends.
export const createFoodSchema = z.object({
  name: z.string().trim().min(1, "name is required"),
  price: z.coerce.number().nonnegative("price must be >= 0"),
  category: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
});

export const updateFoodSchema = z.object({
  name: z.string().trim().min(1).optional(),
  price: z.coerce.number().nonnegative().optional(),
  category: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  // Lets the client explicitly clear an image without uploading a new one.
  remove_image: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => v === "true"),
});

export const listFoodsQuerySchema = z.object({
  category: z.string().min(1).optional(),
});

export type CreateFoodInput = z.infer<typeof createFoodSchema>;
export type UpdateFoodInput = z.infer<typeof updateFoodSchema>;