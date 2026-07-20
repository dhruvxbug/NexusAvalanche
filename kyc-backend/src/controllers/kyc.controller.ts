import { Request, Response } from "express";
import { z } from "zod";
import crypto from "crypto";
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
});

const VERIFF_API_SECRET = process.env.VERIFF_API_SECRET || "";

export class KycController {
  
  public async submit(req: Request, res: Response): Promise<void> {
    try {
      const parsedBody = SubmitKycSchema.parse(req.body);
      const { request, veriffSessionUrl } = await kycService.submitKyc(parsedBody.userAddress, parsedBody.jurisdiction, parsedBody.documentId);
      
      res.status(202).json({
        success: true,
        message: "KYC submitted. Pending asynchronous verification.",
        kycRequestId: request.id,
        veriffSessionUrl
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
    const signature = req.headers['x-hmac-signature'];
    const rawBody = req.body; // In express, ensure this is a raw buffer or string for strict verification

    try {
      if (VERIFF_API_SECRET && signature) {
         const calculatedDigest = crypto.createHmac('sha256', VERIFF_API_SECRET)
             .update(rawBody)
             .digest('hex');
         
         if (calculatedDigest !== signature) {
             res.status(401).send("Unauthorized: Invalid signature");
             return;
         }
      }

      // Parse payload
      const payload = typeof rawBody === 'string' || Buffer.isBuffer(rawBody) ? JSON.parse(rawBody.toString()) : rawBody;
      
      await kycService.processVeriffWebhook(payload);
      res.json({received: true});
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
