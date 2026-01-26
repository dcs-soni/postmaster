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
  private static readonly PROXY_URL = "http://localhost:3000/api/proxy";

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

        responseData = await res.json();
        status = res.status;
        // Identify if the proxy returned an error wrapper or the actual response
        // in our implementation, the proxy returns the target data directly and status matches target.
        // However, if the proxy fails (500), it returns { error: ... }
      } else {
        const options: RequestInit = {
          method: payload.method,
          headers: payload.headers,
          body: payload.body as BodyInit | null,
        };

        const res = await fetch(payload.url, options);
        responseData = await res.json();
        status = res.status;
      }

      const endTime = performance.now();

      return {
        data: responseData,
        status,
        time: Math.round(endTime - startTime),
        size: JSON.stringify(responseData).length,
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
