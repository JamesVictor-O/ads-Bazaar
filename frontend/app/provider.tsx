"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { wagmiConfig } from "@/lib/wagmi";
import "@rainbow-me/rainbowkit/styles.css";
import { ReactNode, useState } from "react";
import { SessionProvider } from "next-auth/react";
import { AuthKitProvider } from "@farcaster/auth-kit";
import "@farcaster/auth-kit/styles.css";

const farcasterConfig = {
  relay: "https://relay.farcaster.xyz",
  rpcUrl: "https://mainnet.optimism.io",
  domain: process.env.NEXT_PUBLIC_APP_DOMAIN || "localhost:3000",
  siweUri: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
};

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <AuthKitProvider config={farcasterConfig}>
            <SessionProvider refetchInterval={60 * 5}>
              {children}
            </SessionProvider>
          </AuthKitProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
