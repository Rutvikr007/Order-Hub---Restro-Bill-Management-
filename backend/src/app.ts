import cors from "cors";
import express, { Request, Response } from "express";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import analyticsRoutes from "./routes/analyticsRoutes";
import archiveRoutes from "./routes/archiveRoutes";
import invoiceRoutes from "./routes/invoiceRoutes";
import foodRoutes from "./routes/foodRoutes";
import orderRoutes from "./routes/orderRoutes";

export function createApp() {
  const app = express();

  app.use(
    helmet({
      // The frontend (a different origin/port) needs to load food images
      // straight from /uploads via <img src>, which helmet's default
      // same-origin resource policy would otherwise block.
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );
  app.use(
    cors({
      origin: (process.env.CORS_ORIGIN ?? "*").split(","),
    })
  );
  app.use(express.json());
  app.use(morgan("dev"));

  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok" });
  });

  // Serves uploaded food images, e.g. GET /uploads/171999-burger.png
  app.use("/uploads", express.static(path.join(__dirname, "..", "public", "uploads")));

  app.use("/orders", orderRoutes);
  app.use("/invoice-configs", invoiceRoutes);
  app.use("/analytics", analyticsRoutes);
  app.use("/foods", foodRoutes);
  app.use("/", archiveRoutes); // exposes POST /archive-old-orders

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
