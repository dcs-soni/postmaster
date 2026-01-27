import { Router } from "express";
import {
  handleProxyRequest,
  proxySchema,
} from "../controllers/proxy.controller";
import { validate } from "../middlewares/validate.middleware";

const router = Router();

router.post("/proxy", validate(proxySchema), handleProxyRequest);

export default router;
