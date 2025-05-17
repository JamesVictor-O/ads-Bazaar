import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { celoAlfajores } from "wagmi/chains";

export const wagmiConfig = getDefaultConfig({
  appName: "Ads-bazzar",
  projectId: "YOUR_PROJECT_ID",
  chains: [celoAlfajores],
});
