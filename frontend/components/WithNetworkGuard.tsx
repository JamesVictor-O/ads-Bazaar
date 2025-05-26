// withNetworkGuard.tsx
import { useEnsureNetwork } from "@/hooks/useEnsureNetwork";
import { toast } from "react-toastify";
import { ComponentType } from "react";
import { sdk } from "@farcaster/frame-sdk";

type WithNetworkGuardProps = {
  guardedAction?: (action: () => Promise<void>) => Promise<void>;
};

export const withNetworkGuard = <P extends object>(
  WrappedComponent: ComponentType<P & WithNetworkGuardProps>
) => {
  const ComponentWithNetworkGuard = (props: P) => {
    const { ensureNetwork, isConnected, isCorrectChain } = useEnsureNetwork();

    const guardedAction = async (action: () => Promise<void>) => {
      if (!isConnected) {
        toast.error("Please connect your wallet first");
        return;
      }

      // Special handling for Farcaster frame
      const context = await sdk.context;
      const isFarcasterFrame = context?.client.clientFid;

      if (!isCorrectChain) {
        if (isFarcasterFrame) {
          // Farcaster frames might not support chain switching
          toast.error("Please switch to Celo in your wallet");
          return;
        } else {
          const switched = await ensureNetwork();
          if (!switched) return;
        }
      }

      await action();
    };

    return <WrappedComponent {...props} guardedAction={guardedAction} />;
  };

  return ComponentWithNetworkGuard;
};
