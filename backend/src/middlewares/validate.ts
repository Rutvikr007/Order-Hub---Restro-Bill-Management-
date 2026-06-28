import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

type Source = "body" | "query" | "params";

/**
 * Validates req[source] against the given zod schema.
 * On success, replaces req[source] with the parsed (and coerced/defaulted) value.
 */
export function validate(schema: ZodSchema, source: Source = "body") {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      return res.status(400).json({
        error: "ValidationError",
        message: "Request validation failed",
        details: result.error.flatten(),
      });
    }

    (req as any)[source] = result.data;
    next();
  };
}
