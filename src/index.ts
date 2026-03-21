export { createMcpServer, startStdioServer, getToolDefinitions, executeTool } from "./server.js";

export {
  TOOL_PRICING,
  PAYMENT_CONFIG,
  getToolPricing,
  requiresPayment,
  toAtomicUnits,
  fromAtomicUnits,
} from "./x402/index.js";

export {
  parseX402Header,
  verifyAndSettlePayment,
  generatePaymentChallenge,
  createPaymentMiddleware,
  encodePaymentRequired,
} from "./x402/index.js";

export {
  SUPPORTED_NETWORKS,
  resolveNetwork,
  listNetworks,
  getNetworkByChainId,
} from "./adapters/index.js";

export { createRpcClient, RpcClient } from "./adapters/index.js";

export { TOOLS, getToolByName } from "./tools/index.js";

export type {
  McpServerConfig,
  NetworkConfig,
  ToolResult,
  ToolPricing,
  ToolMetadata,
  ToolDefinition,
  X402PaymentHeader,
  X402PaymentChallenge,
  X402PaymentResult,
  Block,
  Transaction,
  TransactionReceipt,
  Log,
  FeeHistory,
} from "./types/index.js";

const isMainModule = process.argv[1]?.endsWith("index.js") || process.argv[1]?.endsWith("index.ts");
const isStdioMode = process.argv.includes("--stdio");
const isStatsMode = process.argv.includes("--stats");

if (isMainModule) {
  if (isStatsMode) {
    import("./stats.js");
  } else if (isStdioMode) {
    import("./server.js").then(({ startStdioServer }) => {
      console.error("Starting OpenScan MCP Server in stdio mode...");
      startStdioServer().catch((error) => {
        console.error("Failed to start server:", error);
        process.exit(1);
      });
    });
  } else {
    console.log("OpenScan MCP Server");
    console.log("Usage:");
    console.log("  --stdio   Start MCP server in stdio mode");
    console.log("  --stats   Display server statistics");
  }
}
