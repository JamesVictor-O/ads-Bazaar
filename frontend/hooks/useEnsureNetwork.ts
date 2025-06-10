import { useAccount, useSwitchChain } from "wagmi";
import { toast } from "react-toastify";
import { celoAlfajores } from "wagmi/chains";

export const useEnsureNetwork = () => {
  const { isConnected, chain } = useAccount();
  const { switchChainAsync, isPending, error } = useSwitchChain();

  const ensureNetwork = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first", {
        position: "bottom-center",
      });
      return false;
    }

    if (chain?.id !== celoAlfajores.id) {
      try {
        await switchChainAsync({ chainId: celoAlfajores.id });
        toast.success("Switched to Celo", {
          position: "bottom-center",
        });
        return true;
      } catch (err: any) {
        console.error("Chain switch error:", err);
        if (err.code === 4902) {
          try {
            await window.ethereum?.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: `0x${celoAlfajores.id.toString(16)}`,
                  chainName: "Celo Mainnet",
                  rpcUrls: [process.env.NEXT_PUBLIC_RPC_URL],
                  nativeCurrency: {
                    name: "CELO",
                    symbol: "CELO",
                    decimals: 18,
                  },
                  blockExplorerUrls: ["https://celo.blockscout.com/"],
                },
              ],
            });
            await switchChainAsync({ chainId: celoAlfajores.id });
            toast.success("Added and switched to Celo", {
              position: "bottom-center",
            });
            return true;
          } catch (addErr) {
            toast.error("Failed to add Celo to wallet", {
              position: "bottom-center",
            });
            return false;
          }
        }
        toast.error(
          `Failed to switch to Celo: ${err.message || "Unknown error"}`,
          {
            position: "bottom-center",
          }
        );
        return false;
      }
    }
    return true;
  };

  return {
    ensureNetwork,
    isConnected,
    isCorrectChain: chain?.id === celoAlfajores.id,
    isSwitching: isPending,
    switchError: error,
  };
};
