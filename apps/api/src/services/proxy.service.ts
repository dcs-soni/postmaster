import axios, { AxiosError } from "axios";
import { logger } from "../utils/logger";

const REQUEST_TIMEOUT_MS = 30000;
const MAX_CONTENT_LENGTH = 10 * 1024 * 1024;
const MAX_REDIRECTS = 0; // Disable redirects to prevent SSRF bypass via redirect chains

export interface ProxyRequest {
  url: string;
  method: string;
  headers?: Record<string, string>;
  data?: unknown;
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
 * Forwards an HTTP request to the target URL
 */
export async function forwardRequest(
  payload: ProxyRequest,
): Promise<ProxyResponse> {
  const { url, method, headers, data } = payload;

  // SSRF Protection - validate URL before making request
  if (!isAllowedUrl(url)) {
    logger.warn({ url }, "Blocked request to disallowed URL");
    throw new Error(
      "Request blocked: URL points to a restricted or internal address",
    );
  }

  logger.info({ method, url }, "Forwarding request");

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

    return {
      status: response.status,
      data: response.data,
      headers: response.headers as Record<string, unknown>,
    };
  } catch (error) {
    if (error instanceof AxiosError) {
      logger.error({ error: error.message }, "Proxy request failed");
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
