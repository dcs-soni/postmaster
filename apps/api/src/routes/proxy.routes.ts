import { Router } from "express";
import { ProxyController, proxySchema } from "../controllers/proxy.controller";
import { validate } from "../middlewares/validate.middleware";

const router = Router();

router.post("/proxy", validate(proxySchema), ProxyController.handleRequest);

export default router;
