import express from "express";
import cors from "cors";
import proxyRoutes from "./routes/proxy.routes";
import metricsRoutes from "./routes/metrics.routes";
import { errorHandler } from "./middlewares/error.middleware";
import { correlationMiddleware } from "./middlewares/correlation.middleware";
import { requestLoggerMiddleware } from "./middlewares/request-logger.middleware";
import { metricsMiddleware } from "./observability/metrics";

const app = express();

// ============================================================================
// Observability Middleware (must be first)
// ============================================================================

// 1. Correlation ID - generates/extracts X-Correlation-ID
app.use(correlationMiddleware);

// 2. Metrics collection - tracks request duration and counts
app.use(metricsMiddleware);

// 3. Request logging - logs with correlation ID
app.use(requestLoggerMiddleware);

// ============================================================================
// Core Middleware
// ============================================================================

app.use(cors());
app.use(express.json());

// ============================================================================
// Routes
// ============================================================================

// API routes
app.use("/api", proxyRoutes);

// Metrics endpoint (Prometheus scraping)
app.use(metricsRoutes);

// Health check with extended info
app.get("/health", (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();

  // Prefer runtime env APP_VERSION, fallback to npm_package_version
  const appVersion = process.env.APP_VERSION || process.env.npm_package_version;

  res.json({
    status: "ok",
    service: "postmaster-proxy",
    version: appVersion,
    uptime: {
      seconds: Math.floor(uptime),
      formatted: formatUptime(uptime),
    },
    memory: {
      heapUsed: formatBytes(memoryUsage.heapUsed),
      heapTotal: formatBytes(memoryUsage.heapTotal),
      rss: formatBytes(memoryUsage.rss),
    },
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// Error Handling
// ============================================================================

app.use(errorHandler);

// ============================================================================
// Helpers
// ============================================================================

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(" ");
}

function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let unitIndex = 0;
  let size = bytes;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

export default app;
