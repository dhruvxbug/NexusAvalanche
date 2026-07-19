import { Router } from "express";
import { KycController } from "../controllers/kyc.controller";

const router = Router();
const kycController = new KycController();

// Wrap async routes to catch errors
const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.post("/verify", asyncHandler(kycController.submit.bind(kycController)));
router.get("/status/:address", asyncHandler(kycController.status.bind(kycController)));
router.post("/webhook", asyncHandler(kycController.webhook.bind(kycController)));

export default router;
