import { createConfig, http, injected } from "wagmi";
import { celo, celoAlfajores } from "wagmi/chains";
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";
import { SUPPORTED_CHAINS, getCurrentNetworkConfig } from "./networks";

const currentConfig = getCurrentNetworkConfig();

export const wagmiConfig = createConfig({
  chains: SUPPORTED_CHAINS,
  connectors: [farcasterFrame(), injected()],
  transports: {
    [celo.id]: http(
      process.env.NEXT_PUBLIC_RPC_URL || "https://forno.celo.org"
    ),
    [celoAlfajores.id]: http("https://alfajores-forno.celo-testnet.org"),
  },
});
