import { Router } from "express";
import { EercController } from "../controllers/eerc.controller";

const router = Router();
const eercController = new EercController();

const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.get("/status", asyncHandler(eercController.getStatus.bind(eercController)));
router.get("/balance/:address", asyncHandler(eercController.getBalance.bind(eercController)));
router.post("/transfer", asyncHandler(eercController.transfer.bind(eercController)));
router.post("/mint", asyncHandler(eercController.mint.bind(eercController)));
router.get("/allowlist/:address", asyncHandler(eercController.getAllowlistRole.bind(eercController)));

export default router;
