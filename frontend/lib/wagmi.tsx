import { createConfig, http } from "wagmi";
import { celo, celoAlfajores } from "wagmi/chains";
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";
import { 
  connectorsForWallets 
} from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  walletConnectWallet,
  coinbaseWallet,
  rainbowWallet,
  trustWallet,
  injectedWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { SUPPORTED_CHAINS } from "./networks";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [
        metaMaskWallet,
        coinbaseWallet,
        walletConnectWallet,
      ],
    },
    {
      groupName: "More",
      wallets: [
        rainbowWallet,
        trustWallet,
        injectedWallet,
      ],
    },
  ],
  {
    appName: "AdsBazaar",
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6", // fallback project id
  }
);

export const wagmiConfig = createConfig({
  chains: SUPPORTED_CHAINS,
  connectors: [
    farcasterFrame(),
    ...connectors,
  ],
  transports: {
    [celo.id]: http(
      process.env.NEXT_PUBLIC_RPC_URL || "https://forno.celo.org"
    ),
    [celoAlfajores.id]: http("https://alfajores-forno.celo-testnet.org"),
  },
});
