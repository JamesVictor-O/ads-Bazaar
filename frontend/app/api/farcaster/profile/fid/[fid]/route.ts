
import { NextRequest, NextResponse } from "next/server";
import { neynarServerService } from "@/lib/neynar-server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fid: string }> }
) {
  try {
    const resolvedParams = await params;
    const fidString = resolvedParams.fid;

    // Validate the FID
    if (!fidString) {
      return NextResponse.json(
        { error: "FID is required" }, 
        { status: 400 }
      );
    }

    const fid = parseInt(fidString);
    if (isNaN(fid) || fid <= 0) {
      return NextResponse.json(
        { error: "Invalid FID format" }, 
        { status: 400 }
      );
    }

    // Check if API key is configured
    const apiKey = process.env.NEYNAR_API_KEY;
    if (!apiKey) {
      console.error("NEYNAR_API_KEY not configured");
      return NextResponse.json(
        { 
          error: "Neynar API key not configured",
          details: "Please set NEYNAR_API_KEY in environment variables"
        }, 
        { status: 500 }
      );
    }

    console.log(`Fetching Farcaster profile for FID: ${fid}`);

    // Handle FID lookup
    const profile = await neynarServerService.getUserByFid(fid);

    if (!profile) {
      console.log(`No Farcaster profile found for FID: ${fid}`);
      return NextResponse.json(
        { error: "Profile not found" }, 
        { status: 404 }
      );
    }

    console.log(`Found profile for FID ${fid}:`, {
      fid: profile.fid,
      username: profile.username,
      displayName: profile.displayName
    });

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Error fetching Farcaster profile by FID:", error);
    
    // Handle specific error types
    let errorMessage = "Failed to fetch profile";
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        errorMessage = "Invalid or missing API key";
        statusCode = 401;
      } else if (error.message.includes("not found")) {
        errorMessage = "Profile not found";
        statusCode = 404;
      } else if (error.message.includes("rate limit")) {
        errorMessage = "Rate limit exceeded";
        statusCode = 429;
      }
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: statusCode }
    );
  }
}