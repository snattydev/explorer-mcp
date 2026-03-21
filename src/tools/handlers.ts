import { createRpcClient } from "../adapters/rpc-client.js";
import { listNetworks } from "../adapters/networks.js";
import { PAYMENT_CONFIG, TOOL_PRICING } from "../x402/pricing.js";
import type { ToolResult, Transaction } from "../types/index.js";
import type {
  GetAddressInfoInput,
  GetTransactionInput,
  GetTransactionTraceInput,
  GetBlockInput,
  GetBlockWithTransactionsInput,
  GetLatestBlocksInput,
  GetNetworkStatsInput,
  GetGasPricesInput,
  GetContractCodeInput,
  CallContractInput,
  SearchLogsInput,
} from "./schemas.js";

function formatWeiToEther(wei: string): string {
  try {
    const weiValue = BigInt(wei);
    const etherValue = Number(weiValue) / 1e18;
    return etherValue.toFixed(18).replace(/\.?0+$/, "") || "0";
  } catch {
    return "0";
  }
}

function hexToNumber(hex: string): number {
  return Number.parseInt(hex, 16);
}

export async function handleGetAddressInfo(input: GetAddressInfoInput): Promise<ToolResult> {
  try {
    const client = createRpcClient(input.network);

    const [balance, nonce, code] = await Promise.all([
      client.getBalance(input.address),
      client.getTransactionCount(input.address),
      client.getCode(input.address),
    ]);

    const isContract = code !== "0x" && code.length > 2;

    return {
      success: true,
      data: {
        address: input.address,
        balance: {
          wei: balance,
          ether: formatWeiToEther(balance),
        },
        transactionCount: nonce,
        isContract,
        hasCode: isContract,
      },
      metadata: {
        network: client.networkName,
        chainId: client.chainId,
        tool: "getAddressInfo",
        timestamp: Date.now(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get address info",
    };
  }
}

export async function handleGetTransaction(input: GetTransactionInput): Promise<ToolResult> {
  try {
    const client = createRpcClient(input.network);

    const [tx, receipt] = await Promise.all([
      client.getTransaction(input.hash),
      client.getTransactionReceipt(input.hash),
    ]);

    if (!tx) {
      return {
        success: false,
        error: `Transaction not found: ${input.hash}`,
      };
    }

    return {
      success: true,
      data: {
        hash: tx.hash,
        blockHash: tx.blockHash,
        blockNumber: tx.blockNumber ? hexToNumber(tx.blockNumber) : null,
        from: tx.from,
        to: tx.to,
        value: {
          wei: tx.value,
          ether: formatWeiToEther(tx.value),
        },
        gas: tx.gas,
        gasPrice: tx.gasPrice,
        maxFeePerGas: tx.maxFeePerGas,
        maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
        input: tx.input,
        nonce: hexToNumber(tx.nonce),
        receipt: receipt
          ? {
              status: hexToNumber(receipt.status),
              gasUsed: receipt.gasUsed,
              contractAddress: receipt.contractAddress,
              logsCount: receipt.logs.length,
              effectiveGasPrice: receipt.effectiveGasPrice,
            }
          : null,
      },
      metadata: {
        network: client.networkName,
        chainId: client.chainId,
        tool: "getTransaction",
        timestamp: Date.now(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get transaction",
    };
  }
}

export async function handleGetTransactionTrace(
  input: GetTransactionTraceInput,
): Promise<ToolResult> {
  try {
    const client = createRpcClient(input.network);
    const trace = await client.traceTransaction(input.hash, input.traceType);

    if (!trace) {
      return {
        success: false,
        error: "Transaction trace not available. This network may not support debug methods.",
      };
    }

    return {
      success: true,
      data: {
        hash: input.hash,
        traceType: input.traceType,
        trace,
      },
      metadata: {
        network: client.networkName,
        chainId: client.chainId,
        tool: "getTransactionTrace",
        timestamp: Date.now(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get transaction trace",
    };
  }
}

export async function handleGetBlock(input: GetBlockInput): Promise<ToolResult> {
  try {
    const client = createRpcClient(input.network);

    const block =
      typeof input.block === "string" && input.block.startsWith("0x") && input.block.length === 66
        ? await client.getBlockByHash(input.block, false)
        : await client.getBlock(input.block as number | string, false);

    if (!block) {
      return {
        success: false,
        error: `Block not found: ${input.block}`,
      };
    }

    return {
      success: true,
      data: {
        number: hexToNumber(block.number),
        hash: block.hash,
        parentHash: block.parentHash,
        timestamp: hexToNumber(block.timestamp),
        miner: block.miner,
        gasUsed: block.gasUsed,
        gasLimit: block.gasLimit,
        transactionCount: block.transactions.length,
        baseFeePerGas: block.baseFeePerGas,
      },
      metadata: {
        network: client.networkName,
        chainId: client.chainId,
        tool: "getBlock",
        timestamp: Date.now(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get block",
    };
  }
}

export async function handleGetBlockWithTransactions(
  input: GetBlockWithTransactionsInput,
): Promise<ToolResult> {
  try {
    const client = createRpcClient(input.network);

    const block =
      typeof input.block === "string" && input.block.startsWith("0x") && input.block.length === 66
        ? await client.getBlockByHash(input.block, true)
        : await client.getBlock(input.block as number | string, true);

    if (!block) {
      return {
        success: false,
        error: `Block not found: ${input.block}`,
      };
    }

    const transactions = (block.transactions as Transaction[]).map((tx) => ({
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: formatWeiToEther(tx.value),
      gas: tx.gas,
    }));

    return {
      success: true,
      data: {
        block: {
          number: hexToNumber(block.number),
          hash: block.hash,
          parentHash: block.parentHash,
          timestamp: hexToNumber(block.timestamp),
          miner: block.miner,
          gasUsed: block.gasUsed,
          gasLimit: block.gasLimit,
          baseFeePerGas: block.baseFeePerGas,
        },
        transactions,
      },
      metadata: {
        network: client.networkName,
        chainId: client.chainId,
        tool: "getBlockWithTransactions",
        timestamp: Date.now(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get block with transactions",
    };
  }
}

export async function handleGetLatestBlocks(input: GetLatestBlocksInput): Promise<ToolResult> {
  try {
    const client = createRpcClient(input.network);
    const latestBlockNumber = await client.getBlockNumber();
    const blocks = [];

    for (let i = 0; i < input.count; i++) {
      const blockNumber = latestBlockNumber - i;
      if (blockNumber < 0) break;

      const block = await client.getBlock(blockNumber, false);
      if (block) {
        blocks.push({
          number: hexToNumber(block.number),
          hash: block.hash,
          timestamp: hexToNumber(block.timestamp),
          transactionCount: block.transactions.length,
          gasUsed: block.gasUsed,
        });
      }
    }

    return {
      success: true,
      data: {
        latestBlockNumber,
        blocks,
      },
      metadata: {
        network: client.networkName,
        chainId: client.chainId,
        tool: "getLatestBlocks",
        timestamp: Date.now(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get latest blocks",
    };
  }
}

export async function handleGetNetworkStats(input: GetNetworkStatsInput): Promise<ToolResult> {
  try {
    const client = createRpcClient(input.network);

    const [blockNumber, gasPrice, feeHistory] = await Promise.all([
      client.getBlockNumber(),
      client.getGasPrice(),
      client.getFeeHistory(20, "latest", [25, 50, 75]),
    ]);

    const latestBlock = await client.getBlock(blockNumber, false);

    return {
      success: true,
      data: {
        chainId: client.chainId,
        network: client.networkName,
        latestBlock: blockNumber,
        gasPrice: {
          wei: gasPrice,
          gwei: (hexToNumber(gasPrice) / 1e9).toFixed(2),
        },
        baseFee:
          feeHistory?.baseFeePerGas && feeHistory.baseFeePerGas.length > 0
            ? {
                wei: feeHistory.baseFeePerGas[feeHistory.baseFeePerGas.length - 1] ?? "0",
                gwei: (
                  hexToNumber(
                    feeHistory.baseFeePerGas[feeHistory.baseFeePerGas.length - 1] ?? "0",
                  ) / 1e9
                ).toFixed(2),
              }
            : null,
        blockTime: latestBlock
          ? new Date(hexToNumber(latestBlock.timestamp) * 1000).toISOString()
          : null,
      },
      metadata: {
        network: client.networkName,
        chainId: client.chainId,
        tool: "getNetworkStats",
        timestamp: Date.now(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get network stats",
    };
  }
}

export async function handleGetGasPrices(input: GetGasPricesInput): Promise<ToolResult> {
  try {
    const client = createRpcClient(input.network);

    const [gasPrice, feeHistory] = await Promise.all([
      client.getGasPrice(),
      client.getFeeHistory(20, "latest", [25, 50, 75]),
    ]);

    let gasTiers: Record<string, unknown>;
    if (feeHistory?.reward && feeHistory.reward.length > 0) {
      const avgRewards: [number, number, number] = [0, 0, 0];
      for (const rewards of feeHistory.reward) {
        if (rewards && rewards.length >= 3) {
          const r0 = rewards[0];
          const r1 = rewards[1];
          const r2 = rewards[2];
          if (r0) avgRewards[0] = avgRewards[0] + hexToNumber(r0);
          if (r1) avgRewards[1] = avgRewards[1] + hexToNumber(r1);
          if (r2) avgRewards[2] = avgRewards[2] + hexToNumber(r2);
        }
      }
      const count = feeHistory.reward.length;

      const lastBaseFee =
        feeHistory.baseFeePerGas && feeHistory.baseFeePerGas.length > 0
          ? feeHistory.baseFeePerGas[feeHistory.baseFeePerGas.length - 1]
          : undefined;
      const baseFee = lastBaseFee ? hexToNumber(lastBaseFee) : 0;

      const low = avgRewards[0] ?? 0;
      const avg = avgRewards[1] ?? 0;
      const high = avgRewards[2] ?? 0;

      gasTiers = {
        low: {
          maxFeePerGas: ((baseFee + low / count) / 1e9).toFixed(2),
          maxPriorityFeePerGas: (low / count / 1e9).toFixed(2),
        },
        average: {
          maxFeePerGas: ((baseFee + avg / count) / 1e9).toFixed(2),
          maxPriorityFeePerGas: (avg / count / 1e9).toFixed(2),
        },
        high: {
          maxFeePerGas: ((baseFee + high / count) / 1e9).toFixed(2),
          maxPriorityFeePerGas: (high / count / 1e9).toFixed(2),
        },
        baseFee: (baseFee / 1e9).toFixed(2),
      };
    } else {
      const gasPriceGwei = hexToNumber(gasPrice) / 1e9;
      gasTiers = {
        low: { gasPrice: (gasPriceGwei * 0.9).toFixed(2) },
        average: { gasPrice: gasPriceGwei.toFixed(2) },
        high: { gasPrice: (gasPriceGwei * 1.2).toFixed(2) },
      };
    }

    return {
      success: true,
      data: {
        ...gasTiers,
        unit: "gwei",
      },
      metadata: {
        network: client.networkName,
        chainId: client.chainId,
        tool: "getGasPrices",
        timestamp: Date.now(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get gas prices",
    };
  }
}

export async function handleGetContractCode(input: GetContractCodeInput): Promise<ToolResult> {
  try {
    const client = createRpcClient(input.network);
    const code = await client.getCode(input.address);
    const isContract = code !== "0x" && code.length > 2;

    return {
      success: true,
      data: {
        address: input.address,
        isContract,
        bytecodeLength: isContract ? (code.length - 2) / 2 : 0,
        bytecode: isContract ? code : null,
      },
      metadata: {
        network: client.networkName,
        chainId: client.chainId,
        tool: "getContractCode",
        timestamp: Date.now(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get contract code",
    };
  }
}

export async function handleCallContract(input: CallContractInput): Promise<ToolResult> {
  try {
    const client = createRpcClient(input.network);
    const result = await client.call(input.to, input.data, input.from, input.value);

    return {
      success: true,
      data: {
        to: input.to,
        data: input.data,
        result,
        resultLength: (result.length - 2) / 2,
      },
      metadata: {
        network: client.networkName,
        chainId: client.chainId,
        tool: "callContract",
        timestamp: Date.now(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to call contract",
    };
  }
}

export async function handleSearchLogs(input: SearchLogsInput): Promise<ToolResult> {
  try {
    const client = createRpcClient(input.network);
    const logs = await client.getLogs({
      fromBlock: input.fromBlock,
      toBlock: input.toBlock,
      address: input.address,
      topics: input.topics,
    });

    return {
      success: true,
      data: {
        logs,
        count: logs.length,
      },
      metadata: {
        network: client.networkName,
        chainId: client.chainId,
        tool: "searchLogs",
        timestamp: Date.now(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to search logs",
    };
  }
}

export function handleListNetworks(): ToolResult {
  const networks = listNetworks();

  return {
    success: true,
    data: {
      networks: networks.map((n) => ({
        name: n.name,
        chainId: n.chainId,
        networkId: n.networkId,
        currency: n.currency,
      })),
      count: networks.length,
    },
    metadata: {
      network: "all",
      chainId: 0,
      tool: "listNetworks",
      timestamp: Date.now(),
    },
  };
}

export function handleGetPaymentInfo(): ToolResult {
  const pricingInfo = Object.entries(TOOL_PRICING).map(([tool, pricing]) => ({
    tool,
    price: pricing.price,
    description: pricing.description,
    isFree: pricing.isFree,
  }));

  return {
    success: true,
    data: {
      protocol: "x402",
      version: "1.0",
      network: {
        name: PAYMENT_CONFIG.network,
        chainId: PAYMENT_CONFIG.chainId,
      },
      token: {
        symbol: PAYMENT_CONFIG.token.symbol,
        address: PAYMENT_CONFIG.token.address,
        decimals: PAYMENT_CONFIG.token.decimals,
      },
      facilitator: PAYMENT_CONFIG.facilitatorUrl,
      pricing: pricingInfo,
      documentation: "https://x402.org",
    },
    metadata: {
      network: "x402",
      chainId: PAYMENT_CONFIG.chainId,
      tool: "getPaymentInfo",
      timestamp: Date.now(),
    },
  };
}
