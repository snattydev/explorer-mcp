import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { McpServerConfig } from "./types/index.js";
import { TOOLS, executeTool } from "./tools/index.js";
import { createPaymentMiddleware, requiresPayment, getPaymentDetails } from "./x402/index.js";

interface PaymentEnabledConfig extends McpServerConfig {
  enablePayments?: boolean;
  walletAddress?: string;
}

export function createMcpServer(config: PaymentEnabledConfig = {}): McpServer {
  const {
    name = "openscan-mcp",
    version = "0.1.0",
    enablePayments = false,
    walletAddress,
  } = config;

  const paymentMiddleware =
    enablePayments && walletAddress ? createPaymentMiddleware(walletAddress) : null;

  const server = new McpServer({
    name,
    version,
  });

  for (const tool of TOOLS) {
    const jsonSchema = zodToJsonSchema(tool.inputSchema, {
      $refStrategy: "none",
    });

    const { $schema: _schema, ...inputSchema } = jsonSchema as Record<string, unknown>;

    const description = tool.pricing.isFree
      ? tool.description
      : `${tool.description} [Cost: $${tool.pricing.price} USDC]`;

    server.tool(tool.name, description, inputSchema, async (args: Record<string, unknown>) => {
      const parseResult = tool.inputSchema.safeParse(args);
      if (!parseResult.success) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                success: false,
                error: `Invalid input: ${parseResult.error.message}`,
              }),
            },
          ],
        };
      }

      if (paymentMiddleware && requiresPayment(tool.name)) {
        const paymentHeader = (args.x402_payment as string) || null;
        const verification = await paymentMiddleware.verifyPayment(
          tool.name,
          tool.pricing.priceAtomic,
          paymentHeader,
        );

        if (!verification.allowed) {
          const paymentDetails = getPaymentDetails(tool.name);
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  success: false,
                  error: verification.error || "Payment required",
                  paymentRequired: true,
                  challenge: verification.challenge,
                  paymentDetails,
                }),
              },
            ],
          };
        }
      }

      const result = await tool.handler(parseResult.data);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    });
  }

  return server;
}

export async function startStdioServer(config: PaymentEnabledConfig = {}): Promise<void> {
  const server = createMcpServer(config);
  const transport = new StdioServerTransport();

  await server.connect(transport);

  process.on("SIGINT", async () => {
    await server.close();
    process.exit(0);
  });
}

export function getToolDefinitions() {
  return TOOLS.map((tool) => {
    const jsonSchema = zodToJsonSchema(tool.inputSchema, {
      $refStrategy: "none",
    });
    const { $schema: _schema, ...inputSchema } = jsonSchema as Record<string, unknown>;

    return {
      name: tool.name,
      description: tool.description,
      inputSchema,
      pricing: tool.pricing,
    };
  });
}

export { executeTool };
