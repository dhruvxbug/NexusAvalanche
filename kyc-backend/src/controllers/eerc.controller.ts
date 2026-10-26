import { Request, Response } from "express";
import { EercService } from "../services/eerc.service";

export class EercController {
  private eercService: EercService;

  constructor() {
    this.eercService = new EercService();
  }

  async getStatus(req: Request, res: Response) {
    try {
      const status = await this.eercService.getStatus();
      return res.status(200).json(status);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to get eERC status" });
    }
  }

  async getBalance(req: Request, res: Response) {
    try {
      const address = String(req.params.address);
      const balance = await this.eercService.getBalance(address);
      return res.status(200).json(balance);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to get balance" });
    }
  }

  async transfer(req: Request, res: Response) {
    try {
      const { senderWallet = 1, receiverAddress, amount } = req.body;
      if (!receiverAddress || !amount) {
        return res.status(400).json({ error: "receiverAddress and amount are required" });
      }
      const result = await this.eercService.transfer(senderWallet, receiverAddress, String(amount));
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Transfer failed" });
    }
  }

  async mint(req: Request, res: Response) {
    try {
      const { recipientAddress, amount } = req.body;
      if (!recipientAddress || !amount) {
        return res.status(400).json({ error: "recipientAddress and amount are required" });
      }
      const result = await this.eercService.mint(recipientAddress, String(amount));
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Mint failed" });
    }
  }

  async getAllowlistRole(req: Request, res: Response) {
    try {
      const address = String(req.params.address);
      const role = await this.eercService.getAllowlistRole(address);
      return res.status(200).json(role);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to get allowlist role" });
    }
  }
}
