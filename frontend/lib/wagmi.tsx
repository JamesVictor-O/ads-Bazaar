import { createConfig, http } from 'wagmi';
import { celoAlfajores } from 'wagmi/chains';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { injectedWallet, metaMaskWallet } from '@rainbow-me/rainbowkit/wallets';

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'YOUR_PROJECT_ID';

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
    appName: 'AdsBazaar',
    projectId,
  }
);

export const wagmiConfig = createConfig({
  chains: [celoAlfajores],
  connectors, // Pass custom connectors directly
  transports: {
    [celoAlfajores.id]: http('https://alfajores-forno.celo-testnet.org'),
  },
});