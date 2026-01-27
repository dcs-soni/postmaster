import axios, { AxiosError } from "axios";
import { logger } from "../utils/logger";

const REQUEST_TIMEOUT_MS = 30000;
const MAX_CONTENT_LENGTH = 10 * 1024 * 1024;
const MAX_REDIRECTS = 5;

export interface ProxyRequest {
  url: string;
  method: string;
  headers?: Record<string, string>;
  data?: any;
}

export class ProxyService {
  /**
   * Blocks: localhost, private IPs, link-local addresses, cloud metadata endpoints
   */
  private static isAllowedUrl(urlString: string): boolean {
    try {
      const url = new URL(urlString);

      if (!["http:", "https:"].includes(url.protocol)) {
        return false;
      }

      const hostname = url.hostname.toLowerCase();

      const localhostPatterns = ["localhost", "127.0.0.1", "::1", "0.0.0.0"];
      if (localhostPatterns.includes(hostname)) {
        return false;
      }

      // Block private IP ranges and cloud metadata endpoints
      const blockedPatterns = [
        /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/, // 10.0.0.0/8
        /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/, // 172.16.0.0/12
        /^192\.168\.\d{1,3}\.\d{1,3}$/, // 192.168.0.0/16
        /^169\.254\.\d{1,3}\.\d{1,3}$/, // Link-local / AWS metadata
        /^0\.0\.0\.0$/, // All interfaces
        /^\[?fe80:/i, // IPv6 link-local
        /^\[?fc00:/i, // IPv6 private
        /^\[?fd00:/i, // IPv6 private
      ];

      if (blockedPatterns.some((pattern) => pattern.test(hostname))) {
        return false;
      }

      const blockedHostnames = [
        "metadata.google.internal",
        "metadata.goog",
        "169.254.169.254",
      ];
      if (blockedHostnames.includes(hostname)) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  static async forwardRequest(payload: ProxyRequest) {
    const { url, method, headers, data } = payload;

    // SSRF Protection - validate URL before making request
    if (!this.isAllowedUrl(url)) {
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
        validateStatus: () => true, // want to capture all statuses
        timeout: REQUEST_TIMEOUT_MS,
        maxContentLength: MAX_CONTENT_LENGTH,
        maxBodyLength: MAX_CONTENT_LENGTH,
        maxRedirects: MAX_REDIRECTS,
      });

      return {
        status: response.status,
        data: response.data,
        headers: response.headers,
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
}
