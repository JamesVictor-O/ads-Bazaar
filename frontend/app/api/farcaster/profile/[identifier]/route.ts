// app/api/farcaster/profile/[identifier]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { neynarService } from "@/lib/neynar";

export async function GET(
  request: NextRequest,
  { params }: { params: { identifier: string } }
) {
  try {
    const identifier = params.identifier;

    // Only handle address lookup for simplicity
    const profile = await neynarService.getUserByVerifiedAddressServer(
      identifier
    );

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Error fetching Farcaster profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
