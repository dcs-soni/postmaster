import { Request, Response, NextFunction } from "express";
import { forwardRequest } from "../services/proxy.service";
import { z } from "zod";

export const proxySchema = z.object({
  url: z.string().url(),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  headers: z.record(z.string(), z.string()).optional(),
  data: z.any().optional(),
});

/**
 * Headers that should not be forwarded (hop-by-hop headers)
 */
const HOP_BY_HOP_HEADERS = [
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
];

/**
 * Handles proxy requests by forwarding them to the target URL
 */
export async function handleProxyRequest(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await forwardRequest(req.body);

    // Forward safe headers from upstream response
    if (result.headers) {
      Object.entries(result.headers).forEach(([key, value]) => {
        const lowerKey = key.toLowerCase();
        if (!HOP_BY_HOP_HEADERS.includes(lowerKey) && value !== undefined) {
          res.set(key, String(value));
        }
      });
    }

    // Using send() to preserve raw response (works for JSON, text, binary)
    res.status(result.status).send(result.data);
  } catch (error) {
    next(error);
  }
}
