import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/errorHandler";
import * as archiveService from "../services/archiveService";

export const archiveOldOrders = asyncHandler(async (req: Request, res: Response) => {
  const afterDays = Number(process.env.ARCHIVE_AFTER_DAYS ?? 30);
  const result = await archiveService.archiveOldOrders(afterDays);

  res.status(200).json({
    message: `Archived ${result.archived_count} order(s) created before ${result.cutoff_date}`,
    ...result,
  });
});
