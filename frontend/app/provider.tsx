"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { wagmiConfig } from "@/lib/wagmi";
import "@rainbow-me/rainbowkit/styles.css";
import { ReactNode, useEffect, useState, PropsWithChildren } from "react";
import { SessionProvider } from "next-auth/react";
import { AuthKitProvider } from "@farcaster/auth-kit";
import "@farcaster/auth-kit/styles.css";
import { sdk } from "@farcaster/frame-sdk";
import { connect } from "wagmi/actions";
import farcasterFrame from "@farcaster/frame-wagmi-connector";

const farcasterConfig = {
  relay: "https://relay.farcaster.xyz",
  rpcUrl: "https://alfajores-forno.celo-testnet.org",
  domain: process.env.NEXT_PUBLIC_APP_DOMAIN || "ads-bazaar.vercel.app",
  siweUri: process.env.NEXT_PUBLIC_APP_URL || "https://ads-bazaar.vercel.app",
};

function FarcasterFrameProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    const init = async () => {
      const context = await sdk.context;

      // Autoconnect if running in a frame
      if (context?.client.clientFid) {
        try {
          await connect(wagmiConfig, { 
            connector: farcasterFrame()
          });
        } catch (error) {
          console.error("Failed to connect Farcaster frame:", error);
        }
      }

      // Hide splash screen after UI renders
      setTimeout(() => {
        sdk.actions.ready();
      }, 500);
    };
    init();
  }, []);

  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <AuthKitProvider config={farcasterConfig}>
            <SessionProvider refetchInterval={60 * 5}>
              <FarcasterFrameProvider>{children}</FarcasterFrameProvider>
            </SessionProvider>
          </AuthKitProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
