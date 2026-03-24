import { Request, Response, NextFunction } from "express";
import { createChildLogger } from "../utils/logger";

/**
 * Headers that should be redacted in logs for security
 */
const SENSITIVE_HEADERS = [
  "authorization",
  "cookie",
  "x-api-key",
  "api-key",
  "x-auth-token",
  "x-access-token",
];

/**
 * Redact sensitive header values
 */
function sanitizeHeaders(
  headers: Record<string, unknown>,
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(headers)) {
    if (SENSITIVE_HEADERS.includes(key.toLowerCase())) {
      sanitized[key] = "[REDACTED]";
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * HTTP Request Logger Middleware
 *
 * Logs incoming requests and outgoing responses with:
 * - Correlation ID for distributed tracing
 * - Request method, path, and sanitized headers
 * - Response status code and duration
 * - Sensitive headers are automatically redacted
 */
export function requestLoggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // Skip logging for health checks and metrics to reduce noise
  if (req.path === "/health" || req.path === "/metrics") {
    return next();
  }

  const startTime = process.hrtime.bigint();
  const logger = createChildLogger(req.correlationId);

  // Log incoming request
  logger.info(
    {
      type: "request",
      method: req.method,
      path: req.path,
      ...(process.env.NODE_ENV !== "production" && { query: req.query }),
      headers: sanitizeHeaders(req.headers as Record<string, unknown>),
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.get("user-agent"),
    },
    `→ ${req.method} ${req.path}`,
  );

  // Hook into response finish event
  res.on("finish", () => {
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1e6;

    const logData = {
      type: "response",
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
      contentLength: res.get("content-length"),
    };

    // Use appropriate log level based on status code
    if (res.statusCode >= 500) {
      logger.error(
        logData,
        `← ${res.statusCode} ${req.method} ${req.path} (${durationMs.toFixed(2)}ms)`,
      );
    } else if (res.statusCode >= 400) {
      logger.warn(
        logData,
        `← ${res.statusCode} ${req.method} ${req.path} (${durationMs.toFixed(2)}ms)`,
      );
    } else {
      logger.info(
        logData,
        `← ${res.statusCode} ${req.method} ${req.path} (${durationMs.toFixed(2)}ms)`,
      );
    }
  });

  next();
}
