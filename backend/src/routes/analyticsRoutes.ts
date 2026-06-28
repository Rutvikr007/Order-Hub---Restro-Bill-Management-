import { Router } from "express";
import * as analyticsController from "../controllers/analyticsController";
import { validate } from "../middlewares/validate";
import { ordersPerDayQuerySchema, topItemsQuerySchema } from "../validators/orderValidators";

const router = Router();

router.get("/orders-per-day", validate(ordersPerDayQuerySchema, "query"), analyticsController.ordersPerDay);
router.get("/revenue-per-store", analyticsController.revenuePerStore);
router.get("/top-items", validate(topItemsQuerySchema, "query"), analyticsController.topSellingItems);

export default router;
