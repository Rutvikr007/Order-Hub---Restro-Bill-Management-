import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/errorHandler";
import { toImagePath } from "../middlewares/upload";
import * as invoiceService from "../services/invoiceService";
import { InvoiceConfigInput } from "../validators/invoiceValidators";

export const getInvoiceConfig = asyncHandler(async (req: Request, res: Response) => {
  const config = await invoiceService.getInvoiceConfigByStore(req.params.storeId);
  res.status(200).json({ data: config });
});

export const upsertInvoiceConfig = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as InvoiceConfigInput;
  const qrImagePath = toImagePath(req.file);
  const config = await invoiceService.upsertInvoiceConfig(req.params.storeId, input, qrImagePath);

  res.status(200).json({ data: config });
});
