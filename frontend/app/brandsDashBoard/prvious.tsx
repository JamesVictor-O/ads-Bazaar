export function useCreateAdBrief() {
  const tx = useHandleTransaction();
  const { writeContract: approveCUSD } = useWriteContract();
  const { address } = useAccount();

  const createBrief = async (
    name: string,
    description: string,
    requirements: string,
    budget: string, // In cUSD with decimals (e.g. "100.50")
    promotionDuration: number, // In seconds
    maxInfluencers: number,
    targetAudience: number // uint8 value
  ) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    try {
      // Convert budget to wei (18 decimals for cUSD)
      const budgetInWei = parseUnits(budget, 18);

      // Approve cUSD transfer
      await approveCUSD({
        address: cUSDContractConfig.address,
        abi: cUSDContractConfig.abi,
        functionName: 'approve',
        args: [CONTRACT_ADDRESS, budgetInWei],
      });

      // Create the ad brief
      await tx.writeContract({
        address: CONTRACT_ADDRESS,
        abi: ABI.abi,
        functionName: 'createAdBrief',
        args: [
          name,
          description,
          requirements,
          budgetInWei,
          BigInt(promotionDuration),
          BigInt(maxInfluencers),
          targetAudience
        ],
      });
    } catch (error) {
      console.error('Error creating ad brief:', error);
      throw error;
    }
  };

  return {
    createBrief,
    ...tx,
  };
}
