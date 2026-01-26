import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { logger } from "../utils/logger";

export const validate =
  (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn({ error: error.issues }, "Validation failed");
        res
          .status(400)
          .json({ error: "Validation failed", details: error.issues });
      } else {
        next(error);
      }
    }
  };
