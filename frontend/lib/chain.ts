import { celoAlfajores } from "wagmi/chains";
import { Chain } from "viem";

export const alfajores: Chain = {
  ...celoAlfajores,
};

export const SUPPORTED_CHAINS = [alfajores];
export const DEFAULT_CHAIN = alfajores;
