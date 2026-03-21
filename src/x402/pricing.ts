import type { ToolPricing } from "../types/index.js";

export const PAYMENT_CONFIG = {
  network: "base-sepolia",
  chainId: 84532,
  token: {
    symbol: "USDC",
    address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    decimals: 6,
  },
  facilitatorUrl: process.env.X402_FACILITATOR_URL || "https://x402.org/facilitator",
  isTestnet: true,
} as const;

export function toAtomicUnits(amount: string): string {
  const [whole, decimal = ""] = amount.split(".");
  const paddedDecimal = decimal.padEnd(6, "0").slice(0, 6);
  return BigInt(whole + paddedDecimal).toString();
}

export function fromAtomicUnits(atomic: string): string {
  const value = BigInt(atomic);
  const whole = value / BigInt(1_000_000);
  const decimal = (value % BigInt(1_000_000)).toString().padStart(6, "0");
  return `${whole}.${decimal}`.replace(/\.?0+$/, "") || "0";
}

export const TOOL_PRICING: Record<string, ToolPricing> = {
  getAddressInfo: {
    price: "0.001",
    priceAtomic: toAtomicUnits("0.001"),
    description: "Get address balance, transaction count, and type",
    isFree: false,
  },
  getTransaction: {
    price: "0.002",
    priceAtomic: toAtomicUnits("0.002"),
    description: "Get transaction details and receipt",
    isFree: false,
  },
  getTransactionTrace: {
    price: "0.01",
    priceAtomic: toAtomicUnits("0.01"),
    description: "Get detailed transaction execution trace",
    isFree: false,
  },
  getBlock: {
    price: "0.002",
    priceAtomic: toAtomicUnits("0.002"),
    description: "Get block header and metadata",
    isFree: false,
  },
  getBlockWithTransactions: {
    price: "0.005",
    priceAtomic: toAtomicUnits("0.005"),
    description: "Get block with all transaction details",
    isFree: false,
  },
  getLatestBlocks: {
    price: "0.003",
    priceAtomic: toAtomicUnits("0.003"),
    description: "Get recent blocks",
    isFree: false,
  },
  getNetworkStats: {
    price: "0.001",
    priceAtomic: toAtomicUnits("0.001"),
    description: "Get network statistics and gas prices",
    isFree: false,
  },
  getGasPrices: {
    price: "0.001",
    priceAtomic: toAtomicUnits("0.001"),
    description: "Get current gas price tiers",
    isFree: false,
  },
  getContractCode: {
    price: "0.002",
    priceAtomic: toAtomicUnits("0.002"),
    description: "Get contract bytecode",
    isFree: false,
  },
  callContract: {
    price: "0.003",
    priceAtomic: toAtomicUnits("0.003"),
    description: "Execute a read-only contract call",
    isFree: false,
  },
  searchLogs: {
    price: "0.005",
    priceAtomic: toAtomicUnits("0.005"),
    description: "Search event logs by filter",
    isFree: false,
  },
  listNetworks: {
    price: "0",
    priceAtomic: "0",
    description: "List supported blockchain networks",
    isFree: true,
  },
  getPaymentInfo: {
    price: "0",
    priceAtomic: "0",
    description: "Get x402 payment information and pricing",
    isFree: true,
  },
};

export function getToolPricing(toolName: string): ToolPricing | undefined {
  return TOOL_PRICING[toolName];
}

export function requiresPayment(toolName: string): boolean {
  const pricing = TOOL_PRICING[toolName];
  return pricing ? !pricing.isFree : true;
}

/**
 * Get x402 payment details for response headers
 * Used by autonomous agents to understand payment requirements
 */
export function getPaymentDetails(toolName: string): Record<string, string> | null {
  const pricing = getToolPricing(toolName);
  if (!pricing || pricing.isFree) {
    return null;
  }

  return {
    "x-payment-required": "true",
    "x-payment-amount": pricing.priceAtomic,
    "x-payment-token": PAYMENT_CONFIG.token.address,
    "x-payment-network": PAYMENT_CONFIG.chainId.toString(),
    "x-payment-facilitator": PAYMENT_CONFIG.facilitatorUrl,
  };
}
