import type { z } from "zod";
import type { ToolPricing, ToolResult } from "../types/index.js";
import { TOOL_PRICING } from "../x402/pricing.js";
import { logger } from "../logger.js";
import {
  handleGetAddressInfo,
  handleGetTransaction,
  handleGetTransactionTrace,
  handleGetBlock,
  handleGetBlockWithTransactions,
  handleGetLatestBlocks,
  handleGetNetworkStats,
  handleGetGasPrices,
  handleGetContractCode,
  handleCallContract,
  handleSearchLogs,
  handleListNetworks,
  handleGetPaymentInfo,
} from "./handlers.js";
import {
  getAddressInfoSchema,
  getTransactionSchema,
  getTransactionTraceSchema,
  getBlockSchema,
  getBlockWithTransactionsSchema,
  getLatestBlocksSchema,
  getNetworkStatsSchema,
  getGasPricesSchema,
  getContractCodeSchema,
  callContractSchema,
  searchLogsSchema,
  listNetworksSchema,
  getPaymentInfoSchema,
} from "./schemas.js";

function createHandler<TSchema extends z.ZodType>(
  toolName: string,
  schema: TSchema,
  handler: (input: z.output<TSchema>) => Promise<ToolResult> | ToolResult,
): (input: unknown) => Promise<ToolResult> | ToolResult {
  return async (input: unknown) => {
    const startTime = Date.now();
    const result = schema.safeParse(input);
    if (!result.success) {
      logger.tool(toolName, input, false, Date.now() - startTime);
      return { success: false, error: `Invalid input: ${result.error.message}` };
    }
    const handlerResult = await handler(result.data as z.output<TSchema>);
    logger.tool(toolName, input, handlerResult.success, Date.now() - startTime);
    return handlerResult;
  };
}

const DEFAULT_PRICING: ToolPricing = {
  price: "0.001",
  priceAtomic: "1000",
  description: "Default tool pricing",
  isFree: false,
};

function getPricing(toolName: string): ToolPricing {
  return TOOL_PRICING[toolName] ?? DEFAULT_PRICING;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodType<unknown>;
  handler: (input: unknown) => Promise<ToolResult> | ToolResult;
  pricing: ToolPricing;
}

export const TOOLS: ToolDefinition[] = [
  {
    name: "getAddressInfo",
    description:
      "Get blockchain address information including balance, transaction count, and whether it's a contract. Supports multiple networks.",
    inputSchema: getAddressInfoSchema,
    handler: createHandler("getAddressInfo", getAddressInfoSchema, handleGetAddressInfo),
    pricing: getPricing("getAddressInfo"),
  },
  {
    name: "getTransaction",
    description:
      "Get transaction details including sender, receiver, value, gas, status, and receipt information.",
    inputSchema: getTransactionSchema,
    handler: createHandler("getTransaction", getTransactionSchema, handleGetTransaction),
    pricing: getPricing("getTransaction"),
  },
  {
    name: "getTransactionTrace",
    description:
      "Get detailed execution trace for a transaction. Useful for debugging and understanding contract interactions.",
    inputSchema: getTransactionTraceSchema,
    handler: createHandler(
      "getTransactionTrace",
      getTransactionTraceSchema,
      handleGetTransactionTrace,
    ),
    pricing: getPricing("getTransactionTrace"),
  },
  {
    name: "getBlock",
    description:
      "Get block header and metadata by block number, tag (latest, earliest, pending), or hash.",
    inputSchema: getBlockSchema,
    handler: createHandler("getBlock", getBlockSchema, handleGetBlock),
    pricing: getPricing("getBlock"),
  },
  {
    name: "getBlockWithTransactions",
    description:
      "Get block with full transaction details. More expensive but provides complete transaction data.",
    inputSchema: getBlockWithTransactionsSchema,
    handler: createHandler(
      "getBlockWithTransactions",
      getBlockWithTransactionsSchema,
      handleGetBlockWithTransactions,
    ),
    pricing: getPricing("getBlockWithTransactions"),
  },
  {
    name: "getLatestBlocks",
    description:
      "Get the most recent blocks from the blockchain. Useful for monitoring chain activity.",
    inputSchema: getLatestBlocksSchema,
    handler: createHandler("getLatestBlocks", getLatestBlocksSchema, handleGetLatestBlocks),
    pricing: getPricing("getLatestBlocks"),
  },
  {
    name: "getNetworkStats",
    description: "Get network statistics including latest block, gas price, and base fee.",
    inputSchema: getNetworkStatsSchema,
    handler: createHandler("getNetworkStats", getNetworkStatsSchema, handleGetNetworkStats),
    pricing: getPricing("getNetworkStats"),
  },
  {
    name: "getGasPrices",
    description: "Get current gas price tiers (low, average, high) for transaction planning.",
    inputSchema: getGasPricesSchema,
    handler: createHandler("getGasPrices", getGasPricesSchema, handleGetGasPrices),
    pricing: getPricing("getGasPrices"),
  },
  {
    name: "getContractCode",
    description: "Get the deployed bytecode of a contract address.",
    inputSchema: getContractCodeSchema,
    handler: createHandler("getContractCode", getContractCodeSchema, handleGetContractCode),
    pricing: getPricing("getContractCode"),
  },
  {
    name: "callContract",
    description: "Execute a read-only contract call. Requires encoded function call data.",
    inputSchema: callContractSchema,
    handler: createHandler("callContract", callContractSchema, handleCallContract),
    pricing: getPricing("callContract"),
  },
  {
    name: "searchLogs",
    description: "Search event logs by block range, contract address, and topics.",
    inputSchema: searchLogsSchema,
    handler: createHandler("searchLogs", searchLogsSchema, handleSearchLogs),
    pricing: getPricing("searchLogs"),
  },
  {
    name: "listNetworks",
    description: "List all supported blockchain networks. FREE - no payment required.",
    inputSchema: listNetworksSchema,
    handler: createHandler("listNetworks", listNetworksSchema, () => handleListNetworks()),
    pricing: getPricing("listNetworks"),
  },
  {
    name: "getPaymentInfo",
    description:
      "Get x402 payment information including pricing for all tools and payment configuration. FREE - no payment required.",
    inputSchema: getPaymentInfoSchema,
    handler: createHandler("getPaymentInfo", getPaymentInfoSchema, () => handleGetPaymentInfo()),
    pricing: getPricing("getPaymentInfo"),
  },
];

export function getToolByName(name: string): ToolDefinition | undefined {
  return TOOLS.find((t) => t.name === name);
}

export async function executeTool(
  toolName: string,
  input: unknown,
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const tool = getToolByName(toolName);

  if (!tool) {
    return {
      success: false,
      error: `Unknown tool: ${toolName}`,
    };
  }

  const parseResult = tool.inputSchema.safeParse(input);
  if (!parseResult.success) {
    return {
      success: false,
      error: `Invalid input: ${parseResult.error.message}`,
    };
  }

  return tool.handler(parseResult.data);
}

export * from "./schemas.js";
export * from "./handlers.js";
