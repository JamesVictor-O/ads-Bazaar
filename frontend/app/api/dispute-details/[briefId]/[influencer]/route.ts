import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { celo } from "viem/chains";
import { CONTRACT_ADDRESS } from "@/lib/contracts";
import ABI from "@/lib/AdsBazaar.json";

import { getCurrentNetworkConfig } from "@/lib/networks";

const currentNetwork = getCurrentNetworkConfig();

export async function GET(
  request: NextRequest,
  { params }: { params: { briefId: string; influencer: string } }
) {
  try {
    const briefId = params.briefId as `0x${string}`;
    const influencer = params.influencer as `0x${string}`;

    const publicClient = createPublicClient({
      chain: currentNetwork.chain,
      transport: http(currentNetwork.rpcUrl),
    });

    // Get dispute details for this application
    const disputeDetails = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: ABI.abi,
      functionName: "getApplicationDispute",
      args: [briefId, influencer],
    });

    if (!disputeDetails || !Array.isArray(disputeDetails)) {
      return NextResponse.json({
        disputeStatus: 0, // NONE
        disputeReason: "",
        resolvedBy: "0x0000000000000000000000000000000000000000",
      });
    }

    return NextResponse.json({
      disputeStatus: Number(disputeDetails[0]),
      disputeReason: disputeDetails[1] as string,
      resolvedBy: disputeDetails[2] as string,
    });
  } catch (error) {
    console.error("Error fetching dispute details:", error);
    return NextResponse.json(
      { error: "Failed to fetch dispute details" },
      { status: 500 }
    );
  }
}
