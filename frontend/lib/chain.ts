import { celo } from "wagmi/chains";
import { Chain } from "viem";

export const celo_mainnet: Chain = {
  ...celo,
};

export const SUPPORTED_CHAINS = [celo_mainnet];
export const DEFAULT_CHAIN = celo_mainnet;
