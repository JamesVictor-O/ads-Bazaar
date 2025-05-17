import { erc20Abi } from "viem";

export const cUSDContractConfig = {
  address: process.env.NEXT_PUBLIC_CUSD_ADDRESS as `0x${string}`,
  abi: erc20Abi,
};
