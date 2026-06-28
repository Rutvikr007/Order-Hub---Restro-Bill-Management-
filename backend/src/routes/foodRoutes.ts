import { NextFunction, Request, Response, Router } from "express";
import * as foodController from "../controllers/foodController";
import { validate } from "../middlewares/validate";
import { uploadFoodImage } from "../middlewares/upload";
import { ApiError } from "../types";
import { createFoodSchema, listFoodsQuerySchema, updateFoodSchema } from "../validators/foodValidators";

const router = Router();

// Wraps multer so a rejected file (bad type / too large) becomes a clean
// 400 through the existing error handler instead of a generic 500.
function handleUpload(req: Request, res: Response, next: NextFunction) {
  uploadFoodImage(req, res, (err: unknown) => {
    if (err) {
      const message = err instanceof Error ? err.message : "Image upload failed";
      return next(new ApiError(400, message));
    }
    next();
  });
}

router.get("/", validate(listFoodsQuerySchema, "query"), foodController.listFoods);
router.get("/:id", foodController.getFood);

router.post(
  "/",
  handleUpload,
  validate(createFoodSchema, "body"),
  foodController.createFood
);

router.patch(
  "/:id",
  handleUpload,
  validate(updateFoodSchema, "body"),
  foodController.updateFood
);

router.delete("/:id", foodController.deleteFood);

export default router;