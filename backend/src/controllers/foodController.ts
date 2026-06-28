import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/errorHandler";
import { toImagePath } from "../middlewares/upload";
import * as foodService from "../services/foodService";
import { CreateFoodInput, UpdateFoodInput } from "../validators/foodValidators";

export const listFoods = asyncHandler(async (req: Request, res: Response) => {
  const { category } = req.query as { category?: string };
  const data = await foodService.listFoods(category);
  res.status(200).json({ data });
});

export const getFood = asyncHandler(async (req: Request, res: Response) => {
  const food = await foodService.getFoodById(req.params.id);
  res.status(200).json({ data: food });
});

export const createFood = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as CreateFoodInput;
  const imagePath = toImagePath(req.file);

  const food = await foodService.createFood(input, imagePath);
  res.status(201).json({ data: food });
});

export const updateFood = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as UpdateFoodInput;
  const imagePath = toImagePath(req.file);

  const food = await foodService.updateFood(req.params.id, input, imagePath);
  res.status(200).json({ data: food });
});

export const deleteFood = asyncHandler(async (req: Request, res: Response) => {
  await foodService.deleteFood(req.params.id);
  res.status(204).send();
});