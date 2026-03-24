import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

const CORRELATION_HEADER = "x-correlation-id";

/**
 * Extends Express Request to include correlationId
 */
declare global {
  namespace Express {
    interface Request {
      correlationId: string;
    }
  }
}

/**
 * Correlation ID Middleware
 *
 * Injects or extracts a correlation ID for distributed tracing.
 * - If X-Correlation-ID header exists, use it
 * - Otherwise, generate a new UUID
 * - Attach to request object and response headers
 *
 * This enables end-to-end request tracing across frontend → backend → external APIs
 */
export function correlationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // Extract existing correlation ID or generate new one
  const correlationId =
    (req.headers[CORRELATION_HEADER] as string) || randomUUID();

  // Attach to request for downstream use
  req.correlationId = correlationId;

  // Include in response for frontend debugging
  res.setHeader("X-Correlation-ID", correlationId);

  next();
}
