import { Router } from "express";
import * as orderController from "../controllers/orderController";
import { validate } from "../middlewares/validate";
import {
  createOrderSchema,
  listOrdersQuerySchema,
  updateOrderStatusSchema,
} from "../validators/orderValidators";

const router = Router();

router.post("/", validate(createOrderSchema, "body"), orderController.createOrder);
router.get("/", validate(listOrdersQuerySchema, "query"), orderController.listOrders);
router.get("/:id", orderController.getOrder);
router.patch(
  "/:id/status",
  validate(updateOrderStatusSchema, "body"),
  orderController.updateOrderStatus
);

export default router;
