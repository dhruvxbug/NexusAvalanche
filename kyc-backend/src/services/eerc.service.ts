import { exec } from "child_process";
import path from "path";
import util from "util";

const execAsync = util.promisify(exec);

/** Short TTL cache for read-only eERC calls (status/balance/allowlist-role)
 *  so dashboard polling doesn't spawn overlapping Hardhat processes. */
const CACHE_TTL_MS = 10_000;
const cache = new Map<string, { at: number; value: any }>();

function getCached(key: string): any | null {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;
  return null;
}

function setCached(key: string, value: any) {
  cache.set(key, { at: Date.now(), value });
  if (cache.size > 50) {
    const oldest = [...cache.entries()].sort((a, b) => a[1].at - b[1].at)[0];
    if (oldest) cache.delete(oldest[0]);
  }
}

/** Simple mutex so only one Hardhat process runs at a time. */
let inflight: Promise<void> = Promise.resolve();

export class EercService {
  private projectRoot = path.resolve(process.cwd(), "..");
  private eercDir = path.resolve(this.projectRoot, "eerc-backend-converter");
  private cachedRpcUrl: string | null = null;

  private async getRpcUrl(): Promise<string> {
    if (this.cachedRpcUrl) return this.cachedRpcUrl;
    if (process.env.L1_RPC_URL) {
      this.cachedRpcUrl = process.env.L1_RPC_URL;
      return this.cachedRpcUrl;
    }
    try {
      const { stdout } = await execAsync(`node network/resolve-rpc.mjs`, { cwd: this.projectRoot });
      const url = stdout.trim();
      if (url.startsWith("http")) {
        this.cachedRpcUrl = url;
        return url;
      }
    } catch (e) {
      console.error("Failed to resolve RPC in eerc.service:", e);
    }
    return "http://127.0.0.1:9654";
  }

  private async runEercAction(action: string, arg1 = "", arg2 = "", arg3 = "", useCache = false): Promise<any> {
    const cacheKey = `${action}|${arg1}|${arg2}|${arg3}`;
    if (useCache) {
      const hit = getCached(cacheKey);
      if (hit) return hit;
    }

    const rpcUrl = await this.getRpcUrl();
    const env = {
      ...process.env,
      L1_RPC_URL: rpcUrl,
      EERC_ACTION: action,
      EERC_ARG1: arg1,
      EERC_ARG2: arg2,
      EERC_ARG3: arg3,
    };

    // Serialize Hardhat invocations to avoid resource contention
    const run = inflight.then(async () => {
      const cmd = `npx hardhat run scripts/eerc-api-runner.ts --network jurisdictionChain --no-compile`;
      let stdout = "";
      let stderr = "";
      try {
        const res = await execAsync(cmd, {
          cwd: this.eercDir,
          env,
          timeout: 120000,
        });
        stdout = res.stdout;
        stderr = res.stderr;
      } catch (err: any) {
        stdout = err.stdout || "";
        stderr = err.stderr || "";
        // Check if JSON was printed in stdout before exit
        const lines = stdout.trim().split("\n");
        for (let i = lines.length - 1; i >= 0; i--) {
          const line = lines[i].trim();
          if (line.startsWith("{") && line.endsWith("}")) {
            try {
              return JSON.parse(line);
            } catch {}
          }
        }
        throw new Error(`eERC error: ${err.message}. ${stderr}`);
      }

      // Parse the JSON line from stdout
      const lines = stdout.trim().split("\n");
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (line.startsWith("{") && line.endsWith("}")) {
          try {
            return JSON.parse(line);
          } catch {}
        }
      }

      throw new Error(`Failed to parse action output. stderr: ${stderr}, stdout: ${stdout}`);
    });

    inflight = run.catch(() => {}); // keep the chain alive on errors
    const result = await run;
    if (useCache) setCached(cacheKey, result);
    return result;
  }

  async getStatus(): Promise<any> {
    return this.runEercAction("status", "", "", "", true);
  }

  async getBalance(target: string): Promise<any> {
    return this.runEercAction("balance", target, "", "", true);
  }

  async transfer(senderWallet: number, receiverAddress: string, amount: string): Promise<any> {
    return this.runEercAction("transfer", String(senderWallet), receiverAddress, amount);
  }

  async mint(recipientAddress: string, amount: string): Promise<any> {
    return this.runEercAction("mint", recipientAddress, amount);
  }

  async getAllowlistRole(address: string): Promise<any> {
    return this.runEercAction("allowlist-role", address, "", "", true);
  }
}
