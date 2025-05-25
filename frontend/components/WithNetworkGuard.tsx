// withNetworkGuard.tsx
import { useEnsureNetwork } from "@/hooks/useEnsureNetwork";
import { toast } from "react-toastify";
import { ComponentType } from "react";

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

      if (!isCorrectChain) {
        const switched = await ensureNetwork();
        if (!switched) return;
      }

      await action();
    };

    return <WrappedComponent {...props} guardedAction={guardedAction} />;
  };

  // Add display name for debugging
  ComponentWithNetworkGuard.displayName = `withNetworkGuard(${
    WrappedComponent.displayName || WrappedComponent.name || "Component"
  })`;

  return ComponentWithNetworkGuard;
};
