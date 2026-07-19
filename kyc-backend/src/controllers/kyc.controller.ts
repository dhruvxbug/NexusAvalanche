import { Request, Response } from "express";
import { z } from "zod";
import { KycService } from "../services/kyc.service";

const kycService = new KycService();

// Validation schemas
const SubmitKycSchema = z.object({
  userAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  jurisdiction: z.string().min(2),
  documentId: z.string().min(1),
});

const WebhookSchema = z.object({
  kycRequestId: z.string().uuid(),
  decision: z.enum(["APPROVED", "REJECTED"]),
});

export class KycController {
  
  public async submit(req: Request, res: Response): Promise<void> {
    try {
      const parsedBody = SubmitKycSchema.parse(req.body);
      const request = await kycService.submitKyc(parsedBody.userAddress, parsedBody.jurisdiction, parsedBody.documentId);
      
      res.status(202).json({
        success: true,
        message: "KYC submitted. Pending asynchronous verification.",
        kycRequestId: request.id
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.issues });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  }

  public async status(req: Request, res: Response): Promise<void> {
    try {
      const address = req.params.address as string;
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        res.status(400).json({ error: "Invalid address format" });
        return;
      }
      const statusData = await kycService.getStatus(address);
      res.status(200).json(statusData);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch status" });
    }
  }

  public async webhook(req: Request, res: Response): Promise<void> {
    try {
      // In production, we would verify a cryptographic signature from the provider here
      const parsedBody = WebhookSchema.parse(req.body);
      
      const updatedRequest = await kycService.processWebhook(parsedBody.kycRequestId, parsedBody.decision);
      
      res.status(200).json({
        success: true,
        status: updatedRequest.status,
        txHash: updatedRequest.txHash
      });
    } catch (error: any) {
       if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.issues });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  }
}
