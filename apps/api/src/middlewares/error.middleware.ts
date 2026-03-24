import { Request, Response, NextFunction } from "express";
import { createChildLogger } from "../utils/logger";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
) => {
  // Use correlation-aware logger
  const logger = createChildLogger(req.correlationId || "unknown");

  logger.error(
    {
      err: {
        message: err.message,
        stack: err.stack,
        name: err.name,
      },
      request: {
        method: req.method,
        path: req.path,
        query: req.query,
      },
    },
    "Unhandled exception",
  );

  const status = err.status || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({
    error: message,
    correlationId: req.correlationId,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
