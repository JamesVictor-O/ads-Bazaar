import { erc20Abi } from "viem";

// Contract address for cUSD
export const cUSDContractConfig = {
  address: process.env.NEXT_PUBLIC_CUSD_ADDRESS as `0x${string}`,
  abi: erc20Abi,
};
