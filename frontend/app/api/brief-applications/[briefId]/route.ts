import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { celo } from "viem/chains";
import { CONTRACT_ADDRESS } from "@/lib/contracts";
import ABI from "@/lib/AdsBazaar.json";

const publicClient = createPublicClient({
  chain: celo,
  transport: http(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { briefId: string } }
) {
  try {
    const briefId = params.briefId as `0x${string}`;

    // Get applications for this brief
    const applicationsData = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: ABI.abi,
      functionName: "getBriefApplications",
      args: [briefId],
    });

    if (!applicationsData || typeof applicationsData !== "object") {
      return NextResponse.json({ applications: [] });
    }

    const rawData = applicationsData as any;
    const applications = (rawData.influencers as string[]).map(
      (influencer, index) => ({
        influencer,
        message: rawData.messages[index],
        timestamp: Number(rawData.timestamps[index]),
        isSelected: rawData.isSelected[index],
        hasClaimed: rawData.hasClaimed[index],
        proofLink: rawData.proofLinks[index],
        isApproved: rawData.isApproved[index],
      })
    );

    return NextResponse.json({ applications });
  } catch (error) {
    console.error("Error fetching brief applications:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}
