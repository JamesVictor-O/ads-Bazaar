import { celo, celoAlfajores, base, baseSepolia } from "wagmi/chains";

// Default network - will be replaced by user selection
export const DEFAULT_NETWORK = celo;

export const NETWORK_CONFIG = {
  [celo.id]: {
    chain: celo,
    name: "Celo Mainnet",
    rpcUrl: "https://forno.celo.org",
    explorerUrl: "https://celoscan.io",
    nativeCurrency: {
      name: "CELO",
      symbol: "CELO",
      decimals: 18,
    },
    type: "celo" as const,
  },
  [celoAlfajores.id]: {
    chain: celoAlfajores,
    name: "Celo Alfajores Testnet",
    rpcUrl: "https://alfajores-forno.celo-testnet.org",
    explorerUrl: "https://explorer.celo.org/alfajores",
    nativeCurrency: {
      name: "CELO",
      symbol: "CELO",
      decimals: 18,
    },
    type: "celo" as const,
  },
  [base.id]: {
    chain: base,
    name: "Base Mainnet",
    rpcUrl: "https://mainnet.base.org",
    explorerUrl: "https://basescan.org",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    type: "base" as const,
  },
  [baseSepolia.id]: {
    chain: baseSepolia,
    name: "Base Sepolia Testnet",
    rpcUrl: "https://sepolia.base.org",
    explorerUrl: "https://sepolia.basescan.org",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    type: "base" as const,
  },
};

export const getNetworkConfig = (chainId: number) => {
  return NETWORK_CONFIG[chainId];
};

export const getCurrentNetworkConfig = () => {
  return NETWORK_CONFIG[DEFAULT_NETWORK.id];
};

export const isCorrectNetwork = (chainId?: number) => {
  return chainId === DEFAULT_NETWORK.id;
};

export const SUPPORTED_CHAINS = [celo, celoAlfajores, base, baseSepolia] as const;

export const CELO_CHAINS = [celo, celoAlfajores] as const;
export const BASE_CHAINS = [base, baseSepolia] as const;
