import { celo, celoAlfajores } from "wagmi/chains";

export const CURRENT_NETWORK = celoAlfajores; // Change to celo for mainnet

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
  },
};

export const getCurrentNetworkConfig = () => {
  return NETWORK_CONFIG[CURRENT_NETWORK.id];
};

export const isCorrectNetwork = (chainId?: number) => {
  return chainId === CURRENT_NETWORK.id;
};

export const SUPPORTED_CHAINS = [celo, celoAlfajores] as const;
