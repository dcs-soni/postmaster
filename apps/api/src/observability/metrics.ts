import { Request, Response, NextFunction } from "express";
import client, { Registry, Counter, Histogram, Gauge } from "prom-client";

// Create a dedicated registry for custom metrics
export const metricsRegistry = new Registry();

// Add default Node.js metrics (memory, CPU, event loop, etc.)
client.collectDefaultMetrics({ register: metricsRegistry });

// ============================================================================
// HTTP Request Metrics
// ============================================================================

/**
 * Histogram for HTTP request duration
 * Tracks latency distribution with percentiles
 */
export const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [metricsRegistry],
});

/**
 * Counter for total HTTP requests
 * Enables calculation of request rate and error rate
 */
export const httpRequestsTotal = new Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [metricsRegistry],
});

// ============================================================================
// Proxy-Specific Metrics
// ============================================================================

/**
 * Histogram for proxy request duration
 * Measures time to forward requests to external APIs
 */
export const proxyRequestDuration = new Histogram({
  name: "proxy_request_duration_seconds",
  help: "Duration of proxy requests to external APIs in seconds",
  labelNames: ["target_domain", "method", "status_code"],
  buckets: [0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30],
  registers: [metricsRegistry],
});

/**
 * Counter for total proxy requests
 * Track usage by target domain for analytics
 */
export const proxyRequestsTotal = new Counter({
  name: "proxy_requests_total",
  help: "Total number of proxy requests",
  labelNames: ["target_domain", "method", "status_code"],
  registers: [metricsRegistry],
});

/**
 * Counter for blocked SSRF attempts
 * Security monitoring metric
 */
export const blockedRequestsTotal = new Counter({
  name: "blocked_requests_total",
  help: "Total number of blocked requests (SSRF protection)",
  labelNames: ["reason"],
  registers: [metricsRegistry],
});

// ============================================================================
// Application Health Metrics
// ============================================================================

/**
 * Gauge for active connections
 */
export const activeConnections = new Gauge({
  name: "active_connections",
  help: "Number of active connections",
  registers: [metricsRegistry],
});

/**
 * Gauge for application uptime
 */
const startTime = Date.now();
export const uptimeGauge = new Gauge({
  name: "app_uptime_seconds",
  help: "Application uptime in seconds",
  registers: [metricsRegistry],
});

// Update uptime every 5 seconds
setInterval(() => {
  uptimeGauge.set((Date.now() - startTime) / 1000);
}, 5000);

// ============================================================================
// Metrics Collection Middleware
// ============================================================================

/**
 * Express middleware to collect HTTP metrics
 * Should be placed early in the middleware chain
 */
export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // Skip metrics endpoint to avoid recursion
  if (req.path === "/metrics") {
    return next();
  }

  const startTime = process.hrtime.bigint();

  // Increment active connections
  activeConnections.inc();

  // Hook into response finish event
  res.on("finish", () => {
    const endTime = process.hrtime.bigint();
    const durationInSeconds = Number(endTime - startTime) / 1e9;

    // Normalize route for cardinality control
    // e.g., /api/users/123 → /api/users/:id
    const route = normalizeRoute(req.route?.path || req.path);
    const statusCode = res.statusCode.toString();

    // Record metrics
    httpRequestDuration.observe(
      { method: req.method, route, status_code: statusCode },
      durationInSeconds,
    );
    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: statusCode,
    });

    // Decrement active connections
    activeConnections.dec();
  });

  next();
}

/**
 * Normalize route paths to prevent high cardinality
 * Replaces dynamic segments with placeholders
 */
function normalizeRoute(path: string): string {
  return path
    .replace(
      /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      "/:uuid",
    )
    .replace(/\/\d+/g, "/:id")
    .replace(/\/[0-9a-f]{24}/gi, "/:objectId");
}

/**
 * Get metrics in Prometheus format
 */
export async function getMetrics(): Promise<string> {
  return metricsRegistry.metrics();
}

/**
 * Get content type for metrics response
 */
export function getMetricsContentType(): string {
  return metricsRegistry.contentType;
}
