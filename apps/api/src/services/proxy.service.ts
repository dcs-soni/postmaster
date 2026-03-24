import axios, { AxiosError } from "axios";
import { createChildLogger, logger } from "../utils/logger";
import {
  proxyRequestDuration,
  proxyRequestsTotal,
  blockedRequestsTotal,
} from "../observability/metrics";

const REQUEST_TIMEOUT_MS = 30000;
const MAX_CONTENT_LENGTH = 10 * 1024 * 1024;
const MAX_REDIRECTS = 0; // Disable redirects to prevent SSRF bypass via redirect chains

export interface ProxyRequest {
  url: string;
  method: string;
  headers?: Record<string, string>;
  data?: unknown;
  correlationId?: string;
}

export interface ProxyResponse {
  status: number;
  data: unknown;
  headers?: Record<string, unknown>;
}

const LOCALHOST_PATTERNS = ["localhost", "127.0.0.1", "::1", "0.0.0.0"];

const BLOCKED_IP_PATTERNS = [
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/, // 10.0.0.0/8
  /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/, // 172.16.0.0/12
  /^192\.168\.\d{1,3}\.\d{1,3}$/, // 192.168.0.0/16
  /^169\.254\.\d{1,3}\.\d{1,3}$/, // Link-local / AWS metadata
  /^0\.0\.0\.0$/, // All interfaces
  /^\[?fe80:/i, // IPv6 link-local
  /^\[?fc00:/i, // IPv6 private
  /^\[?fd00:/i, // IPv6 private
  /^\[?::ffff:/i, // IPv4-mapped IPv6 (bracket notation)
];

const BLOCKED_HOSTNAMES = [
  "metadata.google.internal",
  "metadata.goog",
  "169.254.169.254",
];

/**
 * Validates URL to prevent SSRF attacks
 * Blocks: localhost, private IPs, link-local addresses, cloud metadata endpoints
 */
function isAllowedUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);

    if (!["http:", "https:"].includes(url.protocol)) {
      return false;
    }

    const hostname = url.hostname.toLowerCase();

    if (LOCALHOST_PATTERNS.includes(hostname)) {
      return false;
    }

    // Block IPv4-mapped IPv6 addresses (e.g., ::ffff:127.0.0.1)
    if (hostname.startsWith("::ffff:")) {
      const ipv4Part = hostname.slice(7);
      if (
        LOCALHOST_PATTERNS.includes(ipv4Part) ||
        /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ipv4Part) ||
        /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(ipv4Part) ||
        /^192\.168\.\d{1,3}\.\d{1,3}$/.test(ipv4Part) ||
        /^169\.254\.\d{1,3}\.\d{1,3}$/.test(ipv4Part)
      ) {
        return false;
      }
    }

    if (BLOCKED_IP_PATTERNS.some((pattern) => pattern.test(hostname))) {
      return false;
    }

    if (BLOCKED_HOSTNAMES.includes(hostname)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Extract domain from URL for metrics labeling
 */
function extractDomain(urlString: string): string {
  try {
    const url = new URL(urlString);
    return url.hostname;
  } catch {
    return "unknown";
  }
}

/**
 * Forwards an HTTP request to the target URL
 * Includes metrics instrumentation for observability
 */
export async function forwardRequest(
  payload: ProxyRequest,
): Promise<ProxyResponse> {
  const { url, method, headers, data, correlationId } = payload;
  const log = correlationId ? createChildLogger(correlationId) : logger;
  const targetDomain = extractDomain(url);

  // SSRF Protection - validate URL before making request
  if (!isAllowedUrl(url)) {
    log.warn({ url, targetDomain }, "Blocked request to disallowed URL");
    blockedRequestsTotal.inc({ reason: "ssrf_protection" });
    throw new Error(
      "Request blocked: URL points to a restricted or internal address",
    );
  }

  log.info({ method, url, targetDomain }, "Forwarding proxy request");

  const startTime = process.hrtime.bigint();

  try {
    const response = await axios({
      url,
      method,
      headers: headers || {},
      data: data || undefined,
      validateStatus: () => true,
      timeout: REQUEST_TIMEOUT_MS,
      maxContentLength: MAX_CONTENT_LENGTH,
      maxBodyLength: MAX_CONTENT_LENGTH,
      maxRedirects: MAX_REDIRECTS,
    });

    const endTime = process.hrtime.bigint();
    const durationInSeconds = Number(endTime - startTime) / 1e9;
    const statusCode = response.status.toString();

    // Record metrics
    proxyRequestDuration.observe(
      { target_domain: targetDomain, method, status_code: statusCode },
      durationInSeconds,
    );
    proxyRequestsTotal.inc({
      target_domain: targetDomain,
      method,
      status_code: statusCode,
    });

    log.info(
      {
        method,
        url,
        targetDomain,
        statusCode: response.status,
        durationMs: Math.round(durationInSeconds * 1000),
      },
      "Proxy request completed",
    );

    return {
      status: response.status,
      data: response.data,
      headers: response.headers as Record<string, unknown>,
    };
  } catch (error) {
    const endTime = process.hrtime.bigint();
    const durationInSeconds = Number(endTime - startTime) / 1e9;

    // Record failed request metrics
    proxyRequestDuration.observe(
      { target_domain: targetDomain, method, status_code: "error" },
      durationInSeconds,
    );
    proxyRequestsTotal.inc({
      target_domain: targetDomain,
      method,
      status_code: "error",
    });

    if (error instanceof AxiosError) {
      log.error(
        {
          error: error.message,
          code: error.code,
          targetDomain,
          durationMs: Math.round(durationInSeconds * 1000),
        },
        "Proxy request failed",
      );
      if (error.response) {
        return {
          status: error.response.status,
          data: error.response.data,
        };
      }
      throw new Error(error.message || "Network Error");
    }
    throw error;
  }
}
