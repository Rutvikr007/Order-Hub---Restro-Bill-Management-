import { Router } from "express";
import * as archiveController from "../controllers/archiveController";

const router = Router();

router.post("/archive-old-orders", archiveController.archiveOldOrders);

export default router;
