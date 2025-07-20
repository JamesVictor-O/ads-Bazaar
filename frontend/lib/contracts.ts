import { erc20Abi } from "viem";
import { CURRENT_NETWORK } from "./networks";

// 0xe93D4E7aC180D7e23DEb8b123F8E040982E00d22

const CONTRACT_ADDRESSES = {
  // Celo Mainnet
  42220: {
    CUSD: "0x765DE816845861e75A25fCA122bb6898B8B1282a", // Mainnet cUSD
    CEUR: "0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73", // Mainnet cEUR
    CREAL: "0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787", // Mainnet cREAL
    CKES: "0x456a3D042C0DbD3db53D5489e98dFb038553B0d0", // Mainnet cKES
    EXOF: "0x73F93dcc49cB8A239e2032663e9475dd5ef29A08", // Mainnet eXOF
    CNGN: "0x17700282592D6917F6A73D0bF8AcCf4D578c131e", // Mainnet cNGN
    ADS_BAZAAR: "0x01d7deb320aac719128950fc6b86c0fe851ab0c3", // Legacy contract (cUSD only)
    ADS_BAZAAR_MULTICURRENCY: "0x2f00c10f7e0b6772a0d01d0f742590753edbe08b", // NEW: Multi-currency Diamond contract (MAINNET)
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
    ADS_BAZAAR: "0xe32DAF0A546a4bbe0e33EEeacb14CdC34B146BDf", // Legacy contract (cUSD only)
    ADS_BAZAAR_MULTICURRENCY: "0x2f00c10f7e0b6772a0d01d0f742590753edbe08b", // NEW: Multi-currency Diamond contract (Using mainnet for now)
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

// Legacy contract address (cUSD only)
export const LEGACY_CONTRACT_ADDRESS = getCurrentAddresses()
  .ADS_BAZAAR as `0x${string}`;

// Multi-currency contract address (new Diamond)
export const CONTRACT_ADDRESS = (() => {
  const addresses = getCurrentAddresses();
  return addresses.ADS_BAZAAR_MULTICURRENCY as `0x${string}`;
})();

// Use multi-currency contract by default, fallback to legacy if needed
export const MULTICURRENCY_CONTRACT_ADDRESS = () => {
  const addresses = getCurrentAddresses();
  return addresses.ADS_BAZAAR_MULTICURRENCY as `0x${string}`;
};

// All Mento token addresses for current network
export const getMentoTokenAddresses = () => {
  const addresses = getCurrentAddresses();
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
