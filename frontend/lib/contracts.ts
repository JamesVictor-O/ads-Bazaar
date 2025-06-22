import { erc20Abi } from "viem";
import { CURRENT_NETWORK } from "./networks";

// 0x3df55Df1de82388F92D2B381ea511d247600825f

const CONTRACT_ADDRESSES = {
  // Celo Mainnet
  42220: {
    CUSD: "0x765DE816845861e75A25fCA122bb6898B8B1282a", // Mainnet cUSD
    ADS_BAZAAR: "0xB2Dbc7689F4C1E7310693bD19cbd33c6548B9a73", // deployed contract
    SELF_SCOPE: "AdsBazaar"
    
  },
  // Celo Alfajores Testnet
  44787: {
    CUSD: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1", // Alfajores cUSD
    ADS_BAZAAR: "0x4bA728E6613359EE82918491b5133CfB630FB024", // deployed contract
    SELF_SCOPE: "AdsBazaar"
  },
};

// Get current network addresses
const getCurrentAddresses = () => {
  return CONTRACT_ADDRESSES[
    CURRENT_NETWORK.id as keyof typeof CONTRACT_ADDRESSES
  ];
};

export const cUSDContractConfig = {
  address: getCurrentAddresses().CUSD as `0x${string}`,
  abi: erc20Abi,
};

export const CONTRACT_ADDRESS = getCurrentAddresses()
  .ADS_BAZAAR as `0x${string}`;

// Helper function to get explorer URL for transactions
export const getExplorerUrl = (txHash: string) => {
  const networkConfig = {
    42220: "https://celoscan.io",
    44787: "https://explorer.celo.org/alfajores",
  };

  const baseUrl =
    networkConfig[CURRENT_NETWORK.id as keyof typeof networkConfig];
  return `${baseUrl}/tx/${txHash}`;
};

export const SELF_SCOPE = getCurrentAddresses().SELF_SCOPE;
