import { erc20Abi } from "viem";
import { DEFAULT_NETWORK } from "./networks";

// Define contract address types
type CeloAddresses = {
  CUSD: string;
  CEUR: string;
  CREAL: string;
  CKES: string;
  EXOF: string;
  CNGN: string;
  ADS_BAZAAR: string;
  SELF_SCOPE: string;
};

type BaseAddresses = {
  USDC: string;
  DEGEN: string;
  ADS_BAZAAR: string;
};

const CONTRACT_ADDRESSES: {
  42220: CeloAddresses;
  44787: CeloAddresses; 
  8453: BaseAddresses;
  84532: BaseAddresses;
} = {
  // Celo Mainnet
  42220: {
    CUSD: "0x765DE816845861e75A25fCA122bb6898B8B1282a", // Mainnet cUSD
    CEUR: "0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73", // Mainnet cEUR
    CREAL: "0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787", // Mainnet cREAL
    CKES: "0x456a3D042C0DbD3db53D5489e98dFb038553B0d0", // Mainnet cKES
    EXOF: "0x73F93dcc49cB8A239e2032663e9475dd5ef29A08", // Mainnet eXOF
    CNGN: "0x17700282592D6917F6A73D0bF8AcCf4D578c131e", // Mainnet cNGN
    ADS_BAZAAR: "0x7bfaf4acf2f34a43041bde3f150adface7e4afce", // Multi-currency Diamond contract (MAINNET)
    SELF_SCOPE: "AdsBazaar"
  },
  // Celo Alfajores Testnet
  44787: {
    CUSD: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1", // Alfajores cUSD
    CEUR: "0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F", // Alfajores cEUR
    CREAL: "0xE4D517785D091D3c54818832dB6094bcc2744545", // Alfajores cREAL
    CKES: "0x456a3D042C0DbD3db53D5489e98dFb038553B0d0", // Placeholder (same as mainnet)
    EXOF: "0x73F93dcc49cB8A239e2032663e9475dd5ef29A08", // Placeholder (same as mainnet)
    CNGN: "0x17700282592D6917F6A73D0bF8AcCf4D578c131e", // Placeholder (same as mainnet)
    ADS_BAZAAR: "0x7bfaf4acf2f34a43041bde3f150adface7e4afce", // Multi-currency Diamond contract (use same for testnet)
    SELF_SCOPE: "AdsBazaar"
  },
  // Base Mainnet
  8453: {
    USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base USDC
    DEGEN: "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed", // DEGEN token
    ADS_BAZAAR: "0x0000000000000000000000000000000000000000", // TODO: Deploy contract
  },
  // Base Sepolia Testnet
  84532: {
    USDC: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Base Sepolia USDC
    DEGEN: "0x0000000000000000000000000000000000000000", // TODO: Deploy test DEGEN or use alternative
    ADS_BAZAAR: "0x0000000000000000000000000000000000000000", // TODO: Deploy contract
  },
};

// Get addresses for specific network
export const getContractAddresses = (chainId: number) => {
  return CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
};

// Get current network addresses (using default network)
const getCurrentAddresses = () => {
  return CONTRACT_ADDRESSES[
    DEFAULT_NETWORK.id as keyof typeof CONTRACT_ADDRESSES
  ];
};

export const cUSDContractConfig = {
  address: (getCurrentAddresses() as CeloAddresses).CUSD as `0x${string}`,
  abi: erc20Abi,
};

// Main AdsBazaar Diamond contract address
export const CONTRACT_ADDRESS = getCurrentAddresses().ADS_BAZAAR as `0x${string}`;

// Get token addresses for specific network
export const getTokenAddresses = (chainId: number) => {
  const addresses = getContractAddresses(chainId);
  if (!addresses) return null;

  // Celo networks - Mento tokens
  if (chainId === 42220 || chainId === 44787) {
    const celoAddresses = addresses as CeloAddresses;
    return {
      cUSD: celoAddresses.CUSD as `0x${string}`,
      cEUR: celoAddresses.CEUR as `0x${string}`,
      cREAL: celoAddresses.CREAL as `0x${string}`,
      cKES: celoAddresses.CKES as `0x${string}`,
      eXOF: celoAddresses.EXOF as `0x${string}`,
      cNGN: celoAddresses.CNGN as `0x${string}`
    };
  }

  // Base networks - USDC and DEGEN
  if (chainId === 8453 || chainId === 84532) {
    const baseAddresses = addresses as BaseAddresses;
    return {
      USDC: baseAddresses.USDC as `0x${string}`,
      DEGEN: baseAddresses.DEGEN as `0x${string}`
    };
  }

  return null;
};

// All Mento token addresses for current network (backward compatibility)
export const getMentoTokenAddresses = () => {
  const addresses = getCurrentAddresses() as CeloAddresses;
  return {
    cUSD: addresses.CUSD as `0x${string}`,
    cEUR: addresses.CEUR as `0x${string}`,
    cREAL: addresses.CREAL as `0x${string}`,
    cKES: addresses.CKES as `0x${string}`,
    eXOF: addresses.EXOF as `0x${string}`,
    cNGN: addresses.CNGN as `0x${string}`
  };
};

// Helper function to get explorer URL for transactions
export const getExplorerUrl = (txHash: string, chainId?: number) => {
  const networkConfig = {
    42220: "https://celoscan.io",
    44787: "https://explorer.celo.org/alfajores",
    8453: "https://basescan.org",
    84532: "https://sepolia.basescan.org",
  };

  const targetChainId = chainId || DEFAULT_NETWORK.id;
  const baseUrl = networkConfig[targetChainId as keyof typeof networkConfig];
  return `${baseUrl}/tx/${txHash}`;
};

export const SELF_SCOPE = (getCurrentAddresses() as CeloAddresses).SELF_SCOPE;
