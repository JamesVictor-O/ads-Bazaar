import { useAccount, useSwitchChain } from "wagmi";
import { toast } from "react-hot-toast";
import {
  DEFAULT_NETWORK,
  getCurrentNetworkConfig,
  isCorrectNetwork,
} from "../lib/networks";

export const useEnsureNetwork = () => {
  const { isConnected, chain } = useAccount();
  const { switchChainAsync, isPending, error } = useSwitchChain();

  const currentNetworkConfig = getCurrentNetworkConfig();

  const ensureNetwork = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return false;
    }

    if (!isCorrectNetwork(chain?.id)) {
      try {
        await switchChainAsync({ chainId: DEFAULT_NETWORK.id });
        toast.success(`Switched to ${currentNetworkConfig.name}`);
        return true;
      } catch (err: any) {
        console.error("Chain switch error:", err);

        // Error code 4902 means the chain is not added to the wallet
        if (err.code === 4902 || err.code === -32603) {
          try {
            // Add the network to the wallet
            await window.ethereum?.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: `0x${DEFAULT_NETWORK.id.toString(16)}`,
                  chainName: currentNetworkConfig.name,
                  rpcUrls: [currentNetworkConfig.rpcUrl],
                  nativeCurrency: currentNetworkConfig.nativeCurrency,
                  blockExplorerUrls: [currentNetworkConfig.explorerUrl],
                },
              ],
            });

            // Try switching again after adding
            await switchChainAsync({ chainId: DEFAULT_NETWORK.id });
            toast.success(`Added and switched to ${currentNetworkConfig.name}`);
            return true;
          } catch (addErr: any) {
            console.error("Failed to add network:", addErr);
            toast.error(`Failed to add ${currentNetworkConfig.name} to wallet`);
            return false;
          }
        }

        // Handle user rejection
        if (err.code === 4001) {
          toast.error("Network switch was cancelled by user");
          return false;
        }

        // Generic error handling
        toast.error(
          `Failed to switch to ${currentNetworkConfig.name}: ${
            err.message || "Unknown error"
          }`
        );
        return false;
      }
    }

    return true;
  };

  return {
    ensureNetwork,
    isConnected,
    isCorrectChain: isCorrectNetwork(chain?.id),
    isSwitching: isPending,
    switchError: error,
    currentNetwork: currentNetworkConfig,
    requiredNetwork: DEFAULT_NETWORK,
  };
};
