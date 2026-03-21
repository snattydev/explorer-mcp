import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { McpServerConfig } from "./types/index.js";
import { TOOLS, executeTool } from "./tools/index.js";

export function createMcpServer(config: McpServerConfig = {}): McpServer {
  const { name = "openscan-mcp", version = "0.1.0" } = config;

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

export async function startStdioServer(config: McpServerConfig = {}): Promise<void> {
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
