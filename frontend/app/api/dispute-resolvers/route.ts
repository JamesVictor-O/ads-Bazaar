import { NextResponse } from "next/server";

import { CONTRACT_ADDRESS } from "@/lib/contracts";
import ABI from "@/lib/AdsBazaar.json";

import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(),
});

export async function GET() {
  try {
    // Get list of dispute resolvers
    const resolvers = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: ABI.abi,
      functionName: "getDisputeResolvers",
    });

    return NextResponse.json({ resolvers: resolvers || [] });
  } catch (error) {
    console.error("Error fetching dispute resolvers:", error);
    return NextResponse.json(
      { error: "Failed to fetch dispute resolvers" },
      { status: 500 }
    );
  }
}
