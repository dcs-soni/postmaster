import pino, { Logger } from "pino";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Base logger configuration
 *
 * Production: JSON output for log aggregation (Loki, CloudWatch, etc.)
 * Development: Pretty-printed output for readability
 */
export const logger: Logger = pino({
  level: process.env.LOG_LEVEL || "info",
  base: {
    service: "postmaster-api",
    version: process.env.npm_package_version || "1.0.0",
  },
  ...(isProduction
    ? {
        // Production: JSON format for log aggregation
        formatters: {
          level: (label) => ({ level: label }),
        },
        timestamp: pino.stdTimeFunctions.isoTime,
      }
    : {
        // Development: Pretty-printed output
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        },
      }),
});

/**
 * Create a child logger with correlation ID bound
 *
 * Usage:
 *   const log = createChildLogger(req.correlationId);
 *   log.info({ userId: 123 }, "User logged in");
 *
 * All log entries will include the correlationId field
 */
export function createChildLogger(correlationId: string): Logger {
  return logger.child({ correlationId });
}
