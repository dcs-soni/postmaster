import type { HttpMethod } from "../contexts/RequestContext";

export interface ProxyRequestPayload {
  url: string;
  method: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
}

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  time: number;
  size: number;
  headers?: Record<string, string>;
}

export class ApiService {
  // Configurable proxy URL via environment variable for deployment flexibility
  private static readonly PROXY_URL =
    import.meta.env.VITE_PROXY_URL || "http://localhost:3000/api/proxy";

  /**
   * Safely parse response based on content type
   */
  private static async parseResponse(res: Response): Promise<unknown> {
    const contentType = res.headers.get("content-type") || "";

    // Handle empty responses (e.g., 204 No Content)
    if (res.status === 204 || res.headers.get("content-length") === "0") {
      return null;
    }

    try {
      if (contentType.includes("application/json")) {
        return await res.json();
      } else {
        return await res.text();
      }
    } catch {
      // If parsing fails, return null
      return null;
    }
  }

  static async sendRequest(
    payload: ProxyRequestPayload,
    useProxy: boolean = true,
  ): Promise<ApiResponse> {
    const startTime = performance.now();
    let responseData;
    let status;

    try {
      if (useProxy) {
        const res = await fetch(this.PROXY_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: payload.url,
            method: payload.method,
            headers: payload.headers,
            data: payload.body,
          }),
        });

        responseData = await this.parseResponse(res);
        status = res.status;
      } else {
        // Skip body for GET/HEAD requests
        const shouldIncludeBody = !["GET", "HEAD"].includes(payload.method);

        const options: RequestInit = {
          method: payload.method,
          headers: payload.headers,
        };

        if (shouldIncludeBody && payload.body !== undefined) {
          // Stringify body if it's an object and set Content-Type
          if (typeof payload.body === "string") {
            options.body = payload.body;
          } else {
            options.body = JSON.stringify(payload.body);
            // Ensure Content-Type is set for JSON bodies
            options.headers = {
              ...options.headers,
              "Content-Type": "application/json",
            };
          }
        }

        const res = await fetch(payload.url, options);
        responseData = await this.parseResponse(res);
        status = res.status;
      }

      const endTime = performance.now();
      const responseSize = responseData
        ? JSON.stringify(responseData).length
        : 0;

      return {
        data: responseData,
        status,
        time: Math.round(endTime - startTime),
        size: responseSize,
      };
    } catch (error) {
      const endTime = performance.now();
      return {
        data: { error: "Network Error", details: String(error) },
        status: 0,
        time: Math.round(endTime - startTime),
        size: 0,
      };
    }
  }
}
