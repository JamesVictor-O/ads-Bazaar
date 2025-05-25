import { useEnsureNetwork } from "@/hooks/useEnsureNetwork";
import { toast } from "react-toastify";

export const withNetworkGuard = (
  WrappedComponent: React.ComponentType<any>
) => {
  return (props: any) => {
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
};
