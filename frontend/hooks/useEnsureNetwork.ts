import { useAccount, useSwitchChain } from "wagmi";
import { toast } from "react-toastify";
import { alfajores } from "@/lib/chain";

export const useEnsureNetwork = () => {
  const { isConnected, chain } = useAccount();
  const { switchChain } = useSwitchChain();

  const ensureNetwork = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return false;
    }

    if (chain?.id !== alfajores.id) {
      try {
        await switchChain({ chainId: alfajores.id });
        return true;
      } catch (err) {
        toast.error("Failed to switch to Celo Alfajores network");
        console.error(err);
        return false;
      }
    }
    return true;
  };

  return {
    ensureNetwork,
    isConnected,
    isCorrectChain: chain?.id === alfajores.id,
  };
};
