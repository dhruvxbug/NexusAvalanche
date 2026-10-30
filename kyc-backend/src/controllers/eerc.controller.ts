import { Request, Response } from "express";
import { EercService } from "../services/eerc.service";

export class EercController {
  private eercService: EercService;

  constructor() {
    this.eercService = new EercService();
  }

  async getStatus(req: Request, res: Response) {
    try {
      const network = (req.query.network as string) || "jurisdictionChain";
      const status = await this.eercService.getStatus(network);
      return res.status(200).json(status);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to get eERC status" });
    }
  }

  async getBalance(req: Request, res: Response) {
    try {
      const address = String(req.params.address);
      const network = (req.query.network as string) || "jurisdictionChain";
      const balance = await this.eercService.getBalance(address, network);
      return res.status(200).json(balance);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to get balance" });
    }
  }

  async transfer(req: Request, res: Response) {
    try {
      const { senderWallet = 1, receiverAddress, amount, network = "jurisdictionChain" } = req.body;
      if (!receiverAddress || !amount) {
        return res.status(400).json({ error: "receiverAddress and amount are required" });
      }
      const result = await this.eercService.transfer(senderWallet, receiverAddress, String(amount), network);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Transfer failed" });
    }
  }

  async mint(req: Request, res: Response) {
    try {
      const { recipientAddress, amount, network = "jurisdictionChain" } = req.body;
      if (!recipientAddress || !amount) {
        return res.status(400).json({ error: "recipientAddress and amount are required" });
      }
      const result = await this.eercService.mint(recipientAddress, String(amount), network);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Mint failed" });
    }
  }

  async getAllowlistRole(req: Request, res: Response) {
    try {
      const address = String(req.params.address);
      const network = (req.query.network as string) || "jurisdictionChain";
      const role = await this.eercService.getAllowlistRole(address, network);
      return res.status(200).json(role);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to get allowlist role" });
    }
  }

  async getTransactions(req: Request, res: Response) {
    try {
      const network = (req.query.network as string) || "jurisdictionChain";
      const txs = await this.eercService.getTransactions(network);
      return res.status(200).json(txs);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to get transactions" });
    }
  }
}
