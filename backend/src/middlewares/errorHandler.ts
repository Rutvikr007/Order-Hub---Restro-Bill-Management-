import { NextFunction, Request, Response } from "express";
import { ApiError } from "../types";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: "NotFound", message: `Route ${req.method} ${req.path} not found` });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: err.name,
      message: err.message,
      details: err.details,
    });
  }

  console.error("Unhandled error:", err);
  return res.status(500).json({
    error: "InternalServerError",
    message: "Something went wrong. Please try again later.",
  });
}

// Wraps an async route handler so rejected promises reach errorHandler
// instead of crashing the process.
export function asyncHandler<T extends (...args: any[]) => Promise<any>>(fn: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
