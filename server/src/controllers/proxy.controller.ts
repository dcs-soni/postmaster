import { Request, Response, NextFunction } from "express";
import { ProxyService } from "../services/proxy.service";
import { z } from "zod";

export const proxySchema = z.object({
  url: z.string().url(),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  headers: z.record(z.string(), z.string()).optional(),
  data: z.any().optional(),
});

export class ProxyController {
  static async handleRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ProxyService.forwardRequest(req.body);
      res.status(result.status).json(result.data); // We generally just return data, headers might be tricky due to CORS
    } catch (error) {
      next(error);
    }
  }
}
