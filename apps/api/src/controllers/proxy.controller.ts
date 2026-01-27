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
 * Handles proxy requests by forwarding them to the target URL
 */
export async function handleProxyRequest(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await forwardRequest(req.body);
    res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
}
