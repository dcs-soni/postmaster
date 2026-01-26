import axios, { AxiosError } from "axios";
import { logger } from "../utils/logger";

export interface ProxyRequest {
  url: string;
  method: string;
  headers?: Record<string, string>;
  data?: any;
}

export class ProxyService {
  static async forwardRequest(payload: ProxyRequest) {
    const { url, method, headers, data } = payload;

    logger.info({ method, url }, "Forwarding request");

    try {
      const response = await axios({
        url,
        method,
        headers: headers || {},
        data: data || undefined,
        validateStatus: () => true, // want to capture all statuses
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
