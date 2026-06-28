import { NextFunction, Request, Response, Router } from "express";
import * as invoiceController from "../controllers/invoiceController";
import { ApiError } from "../types";
import { validate } from "../middlewares/validate";
import { uploadInvoiceQrImage } from "../middlewares/upload";
import { invoiceConfigBodySchema, invoiceConfigParamsSchema } from "../validators/invoiceValidators";

const router = Router();

function handleUpload(req: Request, res: Response, next: NextFunction) {
  uploadInvoiceQrImage(req, res, (error: unknown) => {
    if (error) {
      const message = error instanceof Error ? error.message : "Image upload failed";
      return next(new ApiError(400, message));
    }

    next();
  });
}

router.get("/:storeId", validate(invoiceConfigParamsSchema, "params"), invoiceController.getInvoiceConfig);
router.put(
  "/:storeId",
  validate(invoiceConfigParamsSchema, "params"),
  handleUpload,
  validate(invoiceConfigBodySchema, "body"),
  invoiceController.upsertInvoiceConfig
);

export default router;
