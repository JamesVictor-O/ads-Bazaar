import { useEnsureNetwork } from "@/hooks/useEnsureNetwork";
import { toast } from "react-hot-toast";
import { ComponentType } from "react";
import { sdk } from "@farcaster/frame-sdk";

type WithNetworkGuardProps = {
  guardedAction?: (action: () => Promise<void>) => Promise<void>;
};

export const withNetworkGuard = <P extends object>(
  WrappedComponent: ComponentType<P & WithNetworkGuardProps>
) => {
  const ComponentWithNetworkGuard = (props: P) => {
    const { ensureNetwork, isConnected, isCorrectChain, currentNetwork } =
      useEnsureNetwork();

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
          toast.error(
            `Please switch to ${currentNetwork.name} in your wallet`,
            {
              duration: 5000,
            }
          );
          return;
        } else {
          const switched = await ensureNetwork();
          if (!switched) return;
        }
      }

      try {
        await action();
      } catch (error) {
        console.error("Guarded action failed:", error);
        // The individual hooks will handle their own error toasts
      }
    };

    return <WrappedComponent {...props} guardedAction={guardedAction} />;
  };

  return ComponentWithNetworkGuard;
};
