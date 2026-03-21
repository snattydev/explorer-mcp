import type { NetworkConfig } from "../types/index.js";

const AVALANCHE_FUJI_RPC =
  process.env.AVALANCHE_FUJI_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc";
const SEPOLIA_RPC = process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org";
const BASE_SEPOLIA_RPC = process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";

export const SUPPORTED_NETWORKS: Record<string, NetworkConfig> = {
  "avalanche-fuji": {
    networkId: "eip155:43113",
    chainId: 43113,
    name: "Avalanche Fuji (Testnet)",
    rpcUrl: AVALANCHE_FUJI_RPC,
    currency: "AVAX",
    explorerUrl: "https://testnet.snowtrace.io",
  },
  sepolia: {
    networkId: "eip155:11155111",
    chainId: 11155111,
    name: "Sepolia (Testnet)",
    rpcUrl: SEPOLIA_RPC,
    currency: "ETH",
    explorerUrl: "https://sepolia.etherscan.io",
  },
  "base-sepolia": {
    networkId: "eip155:84532",
    chainId: 84532,
    name: "Base Sepolia (Testnet)",
    rpcUrl: BASE_SEPOLIA_RPC,
    currency: "ETH",
    explorerUrl: "https://sepolia.basescan.org",
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
