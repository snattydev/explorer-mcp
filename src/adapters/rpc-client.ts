import type {
  Block,
  FeeHistory,
  JsonRpcRequest,
  JsonRpcResponse,
  NetworkConfig,
  Transaction,
  TransactionReceipt,
} from "../types/index.js";
import { resolveNetwork } from "./networks.js";
import { logger } from "../logger.js";

let requestId = 0;

async function rpcCall<T>(
  rpcUrl: string,
  method: string,
  params: unknown[] = [],
  timeout = 30000,
): Promise<T> {
  const request: JsonRpcRequest = {
    jsonrpc: "2.0",
    id: ++requestId,
    method,
    params,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  const startTime = Date.now();

  try {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;

    if (!response.ok) {
      logger.error("RPC", `Request failed: ${method}`, { status: response.status, rpcUrl });
      throw new Error(`RPC request failed with status ${response.status}`);
    }

    const json = (await response.json()) as JsonRpcResponse<T>;

    if (json.error) {
      logger.error("RPC", `Error: ${method}`, json.error);
      throw new Error(`RPC error: ${json.error.message} (code: ${json.error.code})`);
    }

    logger.rpc(method, params, duration);

    return json.result as T;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      logger.error("RPC", `Timeout: ${method}`, { timeout });
      throw new Error(`RPC request timed out after ${timeout}ms`);
    }
    throw error;
  }
}

export class RpcClient {
  private config: NetworkConfig;

  constructor(networkIdentifier: string) {
    const config = resolveNetwork(networkIdentifier);
    if (!config) {
      throw new Error(`Unsupported network: ${networkIdentifier}`);
    }
    this.config = config;
  }

  get chainId(): number {
    return this.config.chainId;
  }

  get networkName(): string {
    return this.config.name;
  }

  get rpcUrl(): string {
    return this.config.rpcUrl;
  }

  async getBlockNumber(): Promise<number> {
    const result = await rpcCall<string>(this.config.rpcUrl, "eth_blockNumber");
    return Number.parseInt(result, 16);
  }

  async getBlock(
    blockNumberOrTag: number | string,
    includeTransactions = false,
  ): Promise<Block | null> {
    const blockParam =
      typeof blockNumberOrTag === "number"
        ? `0x${blockNumberOrTag.toString(16)}`
        : blockNumberOrTag;

    return rpcCall<Block | null>(this.config.rpcUrl, "eth_getBlockByNumber", [
      blockParam,
      includeTransactions,
    ]);
  }

  async getBlockByHash(blockHash: string, includeTransactions = false): Promise<Block | null> {
    return rpcCall<Block | null>(this.config.rpcUrl, "eth_getBlockByHash", [
      blockHash,
      includeTransactions,
    ]);
  }

  async getTransaction(txHash: string): Promise<Transaction | null> {
    return rpcCall<Transaction | null>(this.config.rpcUrl, "eth_getTransactionByHash", [txHash]);
  }

  async getTransactionReceipt(txHash: string): Promise<TransactionReceipt | null> {
    return rpcCall<TransactionReceipt | null>(this.config.rpcUrl, "eth_getTransactionReceipt", [
      txHash,
    ]);
  }

  async getBalance(address: string, blockTag = "latest"): Promise<string> {
    return rpcCall<string>(this.config.rpcUrl, "eth_getBalance", [address, blockTag]);
  }

  async getTransactionCount(address: string, blockTag = "latest"): Promise<number> {
    const result = await rpcCall<string>(this.config.rpcUrl, "eth_getTransactionCount", [
      address,
      blockTag,
    ]);
    return Number.parseInt(result, 16);
  }

  async getCode(address: string, blockTag = "latest"): Promise<string> {
    return rpcCall<string>(this.config.rpcUrl, "eth_getCode", [address, blockTag]);
  }

  async call(
    to: string,
    data: string,
    from?: string,
    value?: string,
    blockTag = "latest",
  ): Promise<string> {
    const callObject: Record<string, string> = { to, data };
    if (from) callObject.from = from;
    if (value) callObject.value = value;

    return rpcCall<string>(this.config.rpcUrl, "eth_call", [callObject, blockTag]);
  }

  async getGasPrice(): Promise<string> {
    return rpcCall<string>(this.config.rpcUrl, "eth_gasPrice");
  }

  async getFeeHistory(
    blockCount: number,
    newestBlock: string | number = "latest",
    rewardPercentiles: number[] = [25, 50, 75],
  ): Promise<FeeHistory | null> {
    const blockCountHex = `0x${blockCount.toString(16)}`;
    const blockParam =
      typeof newestBlock === "number" ? `0x${newestBlock.toString(16)}` : newestBlock;

    try {
      return await rpcCall<FeeHistory>(this.config.rpcUrl, "eth_feeHistory", [
        blockCountHex,
        blockParam,
        rewardPercentiles,
      ]);
    } catch {
      return null;
    }
  }

  async traceTransaction(
    txHash: string,
    tracerType: "call" | "prestate" = "call",
  ): Promise<unknown | null> {
    try {
      const tracer = tracerType === "call" ? "callTracer" : "prestateTracer";
      return await rpcCall<unknown>(this.config.rpcUrl, "debug_traceTransaction", [
        txHash,
        { tracer },
      ]);
    } catch {
      return null;
    }
  }

  async getLogs(filter: {
    fromBlock?: string | number;
    toBlock?: string | number;
    address?: string;
    topics?: (string | null)[];
  }): Promise<unknown[]> {
    const params: Record<string, unknown> = {};

    if (filter.fromBlock !== undefined) {
      params.fromBlock =
        typeof filter.fromBlock === "number"
          ? `0x${filter.fromBlock.toString(16)}`
          : filter.fromBlock;
    }
    if (filter.toBlock !== undefined) {
      params.toBlock =
        typeof filter.toBlock === "number" ? `0x${filter.toBlock.toString(16)}` : filter.toBlock;
    }
    if (filter.address) params.address = filter.address;
    if (filter.topics) params.topics = filter.topics;

    return rpcCall<unknown[]>(this.config.rpcUrl, "eth_getLogs", [params]);
  }
}

export function createRpcClient(network: string): RpcClient {
  return new RpcClient(network);
}
