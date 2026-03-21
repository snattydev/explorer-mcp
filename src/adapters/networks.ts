import type { NetworkConfig } from "../types/index.js";

const AVALANCHE_RPC = process.env.AVALANCHE_RPC_URL || "https://api.avax.network/ext/bc/C/rpc";
const ETHEREUM_RPC = process.env.ETHEREUM_RPC_URL || "https://eth.llamarpc.com";
const BASE_RPC = process.env.BASE_RPC_URL || "https://mainnet.base.org";
const POLYGON_RPC = process.env.POLYGON_RPC_URL || "https://polygon-rpc.com";
const ARBITRUM_RPC = process.env.ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc";
const OPTIMISM_RPC = process.env.OPTIMISM_RPC_URL || "https://mainnet.optimism.io";

export const SUPPORTED_NETWORKS: Record<string, NetworkConfig> = {
  avalanche: {
    networkId: "eip155:43114",
    chainId: 43114,
    name: "Avalanche C-Chain",
    rpcUrl: AVALANCHE_RPC,
    currency: "AVAX",
    explorerUrl: "https://snowtrace.io",
  },
  ethereum: {
    networkId: "eip155:1",
    chainId: 1,
    name: "Ethereum Mainnet",
    rpcUrl: ETHEREUM_RPC,
    currency: "ETH",
    explorerUrl: "https://etherscan.io",
  },
  base: {
    networkId: "eip155:8453",
    chainId: 8453,
    name: "Base",
    rpcUrl: BASE_RPC,
    currency: "ETH",
    explorerUrl: "https://basescan.org",
  },
  polygon: {
    networkId: "eip155:137",
    chainId: 137,
    name: "Polygon",
    rpcUrl: POLYGON_RPC,
    currency: "MATIC",
    explorerUrl: "https://polygonscan.com",
  },
  arbitrum: {
    networkId: "eip155:42161",
    chainId: 42161,
    name: "Arbitrum One",
    rpcUrl: ARBITRUM_RPC,
    currency: "ETH",
    explorerUrl: "https://arbiscan.io",
  },
  optimism: {
    networkId: "eip155:10",
    chainId: 10,
    name: "Optimism",
    rpcUrl: OPTIMISM_RPC,
    currency: "ETH",
    explorerUrl: "https://optimistic.etherscan.io",
  },
};

export function resolveNetwork(identifier: string): NetworkConfig | null {
  const lower = identifier.toLowerCase();

  if (SUPPORTED_NETWORKS[lower]) {
    return SUPPORTED_NETWORKS[lower];
  }

  const chainId = Number.parseInt(identifier, 10);
  if (!Number.isNaN(chainId)) {
    for (const config of Object.values(SUPPORTED_NETWORKS)) {
      if (config.chainId === chainId) {
        return config;
      }
    }
  }

  for (const config of Object.values(SUPPORTED_NETWORKS)) {
    if (config.networkId === identifier) {
      return config;
    }
  }

  return null;
}

export function listNetworks(): NetworkConfig[] {
  return Object.values(SUPPORTED_NETWORKS);
}

export function getNetworkByChainId(chainId: number): NetworkConfig | null {
  for (const config of Object.values(SUPPORTED_NETWORKS)) {
    if (config.chainId === chainId) {
      return config;
    }
  }
  return null;
}
