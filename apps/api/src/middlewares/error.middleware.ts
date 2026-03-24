import { Request, Response, NextFunction } from "express";
import { createChildLogger } from "../utils/logger";

const ALLOWED_QUERY_KEYS = ["page", "limit", "sort", "order", "filter"];

function sanitizeQuery(query: any): Record<string, unknown> {
  if (typeof query !== "object" || query === null) return {};
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(query)) {
    if (ALLOWED_QUERY_KEYS.includes(key.toLowerCase())) {
      sanitized[key] = value;
    } else {
      sanitized[key] = "[REDACTED]";
    }
  }
  return sanitized;
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
) => {
  // Use correlation-aware logger
  const logger = createChildLogger(req.correlationId || "unknown");

  // Normalize error to prevent crashes and extract safe values
  const isObject = typeof err === "object" && err !== null;
  const safeErr = {
    name: isObject && err.name ? String(err.name) : "Error",
    message: isObject && err.message ? String(err.message) : String(err),
    stack: isObject && err.stack ? String(err.stack) : undefined,
  };

  // Coerce and validate status
  let status = isObject && err.status ? Number(err.status) : 500;
  if (!Number.isInteger(status) || status < 400 || status > 599) {
    status = 500;
  }

  // Compute response message (expose original message only for trusted 4xx)
  const responseMessage =
    status >= 400 && status < 500 ? safeErr.message : "Internal Server Error";

  logger.error(
    {
      err: safeErr,
      request: {
        method: req.method,
        path: req.path,
        query: sanitizeQuery(req.query),
      },
    },
    "Unhandled exception",
  );

  res.status(status).json({
    error: responseMessage,
    correlationId: req.correlationId,
    ...(process.env.NODE_ENV === "development" && { stack: safeErr.stack }),
  });
};
