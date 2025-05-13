
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, sepolia,celoAlfajores} from 'wagmi/chains';

export const wagmiConfig = getDefaultConfig({
  appName: 'Ads-bazzar', 
  projectId: "YOUR_PROJECT_ID", 
  chains: [mainnet, celoAlfajores], 
});