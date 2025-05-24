import { createConfig, http } from "wagmi";
import { celoAlfajores } from "wagmi/chains";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { injectedWallet, metaMaskWallet } from "@rainbow-me/rainbowkit/wallets";
import { farcasterFrame as miniAppConnector } from "@farcaster/frame-wagmi-connector";

const projectId =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "YOUR_PROJECT_ID";

const rainbowKitConnectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [injectedWallet, metaMaskWallet],
    },
  ],
  {
    appName: "AdsBazaar",
    projectId,
  }
);

const farcasterConnector = miniAppConnector();

export const wagmiConfig = createConfig({
  chains: [celoAlfajores],
  connectors: [...rainbowKitConnectors, farcasterConnector],
  transports: {
    [celoAlfajores.id]: http("https://alfajores-forno.celo-testnet.org"),
  },
});
