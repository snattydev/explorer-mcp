/**
 * OpenScan MCP Server - Type Definitions
 *
 * Core types for the MCP server, RPC client, and x402 payment integration.
 */

// ============== JSON-RPC Types ==============

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params: unknown[];
}

export interface JsonRpcResponse<T = unknown> {
  jsonrpc: "2.0";
  id: number;
  result?: T;
  error?: JsonRpcError;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

// ============== Network Types ==============

export interface NetworkConfig {
  /** Network identifier in CAIP-2 format (e.g., "eip155:43114") */
  networkId: string;
  /** Chain ID */
  chainId: number;
  /** Human-readable name */
  name: string;
  /** Primary RPC URL */
  rpcUrl: string;
  /** Native currency symbol */
  currency: string;
  /** Block explorer URL (optional) */
  explorerUrl?: string;
}

// ============== Block Types ==============

export interface Block {
  number: string;
  hash: string;
  parentHash: string;
  nonce: string;
  sha3Uncles: string;
  logsBloom: string;
  transactionsRoot: string;
  stateRoot: string;
  receiptsRoot: string;
  miner: string;
  difficulty: string;
  totalDifficulty: string;
  extraData: string;
  size: string;
  gasLimit: string;
  gasUsed: string;
  timestamp: string;
  transactions: string[] | Transaction[];
  uncles: string[];
  baseFeePerGas?: string;
}

// ============== Transaction Types ==============

export interface Transaction {
  hash: string;
  nonce: string;
  blockHash: string | null;
  blockNumber: string | null;
  transactionIndex: string | null;
  from: string;
  to: string | null;
  value: string;
  gasPrice: string;
  gas: string;
  input: string;
  v: string;
  r: string;
  s: string;
  type?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  accessList?: AccessListEntry[];
}

export interface AccessListEntry {
  address: string;
  storageKeys: string[];
}

export interface TransactionReceipt {
  transactionHash: string;
  transactionIndex: string;
  blockHash: string;
  blockNumber: string;
  from: string;
  to: string | null;
  cumulativeGasUsed: string;
  gasUsed: string;
  contractAddress: string | null;
  logs: Log[];
  logsBloom: string;
  status: string;
  effectiveGasPrice: string;
  type?: string;
}

export interface Log {
  removed: boolean;
  logIndex: string;
  transactionIndex: string;
  transactionHash: string;
  blockHash: string;
  blockNumber: string;
  address: string;
  data: string;
  topics: string[];
}

// ============== Fee Types ==============

export interface FeeHistory {
  oldestBlock: string;
  baseFeePerGas: string[];
  gasUsedRatio: number[];
  reward?: string[][];
}

// ============== MCP Tool Types ==============

export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: ToolMetadata;
}

export interface ToolMetadata {
  network: string;
  chainId: number;
  tool: string;
  timestamp: number;
}

export interface ToolPricing {
  /** Price in USDC (human-readable, e.g., "0.001") */
  price: string;
  /** Price in atomic units (6 decimals for USDC) */
  priceAtomic: string;
  /** Tool description for pricing display */
  description: string;
  /** Whether this tool is free */
  isFree: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: unknown;
  pricing: ToolPricing;
}

// ============== x402 Payment Types ==============

export interface X402PaymentHeader {
  /** Base64-encoded payment payload */
  payload: string;
  /** Payment signature */
  signature: string;
  /** Payer address */
  payer: string;
  /** Payment amount in atomic units */
  amount: string;
  /** Token address */
  token: string;
  /** Chain ID */
  chainId: number;
}

export interface X402PaymentChallenge {
  version: string;
  network: {
    chainId: number;
    name: string;
  };
  payment: {
    token: string;
    symbol: string;
    decimals: number;
    amount: string;
    recipient: string;
  };
  facilitator: {
    url: string;
    type: string;
  };
  resource: {
    tool: string;
    description: string;
  };
}

export interface X402PaymentResult {
  valid: boolean;
  error?: string;
  txHash?: string;
  payer?: string;
  amount?: string;
}

// ============== Server Config Types ==============

export interface McpServerConfig {
  /** Server name */
  name?: string;
  /** Server version */
  version?: string;
  /** Whether to enable x402 payment verification */
  enablePayments?: boolean;
  /** Wallet address to receive payments */
  walletAddress?: string;
  /** x402 facilitator URL */
  facilitatorUrl?: string;
}
