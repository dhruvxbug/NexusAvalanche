import { Router } from "express";
import { KycController } from "../controllers/kyc.controller";

const router = Router();
const kycController = new KycController();

// Wrap async routes to catch errors
const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ─── Existing KYC Routes ───────────────────────────────────────────────
router.post("/verify", asyncHandler(kycController.submit.bind(kycController)));
router.get("/status/:address", asyncHandler(kycController.status.bind(kycController)));
router.post("/webhook", asyncHandler(kycController.webhook.bind(kycController)));

// ─── DID Routes ────────────────────────────────────────────────────────
router.get("/did/:address", asyncHandler(kycController.resolveDid.bind(kycController)));

// ─── Verifiable Credential Routes ──────────────────────────────────────
router.get("/vc/:address", asyncHandler(kycController.getVc.bind(kycController)));
router.post("/vc/verify", asyncHandler(kycController.verifyVc.bind(kycController)));

export default router;
