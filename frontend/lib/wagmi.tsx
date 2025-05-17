

import { getDefaultConfig, connectorsForWallets } from '@rainbow-me/rainbowkit';
import { celoAlfajores } from 'wagmi/chains';
import { injectedWallet, metaMaskWallet } from '@rainbow-me/rainbowkit/wallets';
import { http } from 'wagmi';


const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [
        injectedWallet, // Browser-injected wallets (e.g., MetaMask)
        metaMaskWallet, // MetaMask specifically
      
      ],
    },
  ],
  {
    appName: 'Ads-bazzar',
    projectId: "YOUR_PROJECT_ID",
  }
);

export const wagmiConfig = getDefaultConfig({
  appName: 'Ads-bazzar',
  projectId: "YOUR_PROJECT_ID",
  chains: [celoAlfajores],
  connectors, // Use the custom connectors list
  reconnect: false, // Still disable reconnect for safety,
  transports: {
    [celoAlfajores.id]: http("https://alfajores-forno.celo-testnet.org"),
  }
});

