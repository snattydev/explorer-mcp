import { z } from "zod";

export const ethereumAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address format");

export const transactionHashSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash format");

export const blockHashSchema = z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid block hash format");

export const blockIdentifierSchema = z.union([
  z.number().int().nonnegative(),
  z.enum(["latest", "earliest", "pending", "finalized", "safe"]),
  blockHashSchema,
]);

export const networkSchema = z.string().default("avalanche-fuji");

export const getAddressInfoSchema = z.object({
  address: ethereumAddressSchema,
  network: networkSchema,
});

export const getTransactionSchema = z.object({
  hash: transactionHashSchema,
  network: networkSchema,
});

export const getTransactionTraceSchema = z.object({
  hash: transactionHashSchema,
  network: networkSchema,
  traceType: z.enum(["call", "prestate"]).default("call"),
});

export const getBlockSchema = z.object({
  block: blockIdentifierSchema,
  network: networkSchema,
});

export const getBlockWithTransactionsSchema = z.object({
  block: blockIdentifierSchema,
  network: networkSchema,
});

export const getLatestBlocksSchema = z.object({
  network: networkSchema,
  count: z.number().int().min(1).max(20).default(10),
});

export const getNetworkStatsSchema = z.object({
  network: networkSchema,
});

export const getGasPricesSchema = z.object({
  network: networkSchema,
});

export const getContractCodeSchema = z.object({
  address: ethereumAddressSchema,
  network: networkSchema,
});

export const callContractSchema = z.object({
  to: ethereumAddressSchema,
  data: z.string().regex(/^0x[a-fA-F0-9]*$/, "Invalid calldata format"),
  network: networkSchema,
  from: ethereumAddressSchema.optional(),
  value: z.string().optional(),
});

export const searchLogsSchema = z.object({
  network: networkSchema,
  fromBlock: z.number().int().nonnegative(),
  toBlock: z.number().int().nonnegative(),
  address: ethereumAddressSchema.optional(),
  topics: z.array(z.string().nullable()).optional(),
});

export const listNetworksSchema = z.object({});

export const getPaymentInfoSchema = z.object({});

export type GetAddressInfoInput = z.infer<typeof getAddressInfoSchema>;
export type GetTransactionInput = z.infer<typeof getTransactionSchema>;
export type GetTransactionTraceInput = z.infer<typeof getTransactionTraceSchema>;
export type GetBlockInput = z.infer<typeof getBlockSchema>;
export type GetBlockWithTransactionsInput = z.infer<typeof getBlockWithTransactionsSchema>;
export type GetLatestBlocksInput = z.infer<typeof getLatestBlocksSchema>;
export type GetNetworkStatsInput = z.infer<typeof getNetworkStatsSchema>;
export type GetGasPricesInput = z.infer<typeof getGasPricesSchema>;
export type GetContractCodeInput = z.infer<typeof getContractCodeSchema>;
export type CallContractInput = z.infer<typeof callContractSchema>;
export type SearchLogsInput = z.infer<typeof searchLogsSchema>;
