import fs from "fs";
import path from "path";
import { pool } from "../config/db";
import { ApiError, Food } from "../types";
import { CreateFoodInput, UpdateFoodInput } from "../validators/foodValidators";
import { UPLOADS_DIR } from "../middlewares/upload";

const FOOD_COLUMNS = "id, name, price, category, image_path, created_at, updated_at";

export async function listFoods(category?: string): Promise<Food[]> {
  if (category) {
    const { rows } = await pool.query<Food>(
      `SELECT ${FOOD_COLUMNS} FROM foods WHERE category = $1 ORDER BY name ASC`,
      [category]
    );
    return rows;
  }

  const { rows } = await pool.query<Food>(`SELECT ${FOOD_COLUMNS} FROM foods ORDER BY name ASC`);
  return rows;
}

export async function getFoodById(id: string): Promise<Food> {
  const { rows } = await pool.query<Food>(`SELECT ${FOOD_COLUMNS} FROM foods WHERE id = $1`, [id]);

  if (rows.length === 0) {
    throw new ApiError(404, `Food item ${id} not found`);
  }

  return rows[0];
}

export async function createFood(input: CreateFoodInput, imagePath?: string): Promise<Food> {
  const { rows } = await pool.query<Food>(
    `INSERT INTO foods (name, price, category, image_path)
     VALUES ($1, $2, $3, $4)
     RETURNING ${FOOD_COLUMNS}`,
    [input.name, input.price, input.category ?? null, imagePath ?? null]
  );

  return rows[0];
}

export async function updateFood(id: string, input: UpdateFoodInput, imagePath?: string): Promise<Food> {
  const existing = await getFoodById(id);

  // A freshly uploaded image always wins. Otherwise honor an explicit
  // remove_image=true, otherwise keep whatever was already saved.
  let nextImagePath: string | null = existing.image_path;
  if (imagePath) {
    nextImagePath = imagePath;
  } else if (input.remove_image) {
    nextImagePath = null;
  }

  const { rows } = await pool.query<Food>(
    `UPDATE foods
     SET name = $1, price = $2, category = $3, image_path = $4
     WHERE id = $5
     RETURNING ${FOOD_COLUMNS}`,
    [
      input.name ?? existing.name,
      input.price ?? existing.price,
      input.category !== undefined ? input.category : existing.category,
      nextImagePath,
      id,
    ]
  );

  // Clean up the old file from disk if it was replaced or removed.
  if ((imagePath || input.remove_image) && existing.image_path) {
    deleteLocalImage(existing.image_path);
  }

  return rows[0];
}

export async function deleteFood(id: string): Promise<void> {
  const existing = await getFoodById(id);

  await pool.query(`DELETE FROM foods WHERE id = $1`, [id]);

  if (existing.image_path) {
    deleteLocalImage(existing.image_path);
  }
}

function deleteLocalImage(imagePath: string) {
  // image_path looks like "/uploads/<filename>" - only ever delete inside
  // the managed uploads directory, never an arbitrary path.
  const filename = path.basename(imagePath);
  const fullPath = path.join(UPLOADS_DIR, filename);

  fs.unlink(fullPath, (err) => {
    if (err && err.code !== "ENOENT") {
      console.error(`Failed to remove food image ${fullPath}:`, err);
    }
  });
}