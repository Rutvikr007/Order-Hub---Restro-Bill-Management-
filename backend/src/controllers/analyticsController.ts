import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/errorHandler";
import * as analyticsService from "../services/analyticsService";

export const ordersPerDay = asyncHandler(async (req: Request, res: Response) => {
  const { store_id, days } = req.query as unknown as { store_id?: string; days: number };
  const data = await analyticsService.getOrdersPerDay(store_id, days);
  res.status(200).json({ data });
});

export const revenuePerStore = asyncHandler(async (_req: Request, res: Response) => {
  const data = await analyticsService.getRevenuePerStore();
  res.status(200).json({ data });
});

export const topSellingItems = asyncHandler(async (req: Request, res: Response) => {
  const { limit, store_id } = req.query as unknown as { limit: number; store_id?: string };
  const data = await analyticsService.getTopSellingItems(limit, store_id);
  res.status(200).json({ data });
});
