
import { NextRequest, NextResponse } from "next/server";
import { neynarServerService } from "@/lib/neynar-server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ identifier: string }> }
) {
  try {
    const resolvedParams = await params;
    const identifier = resolvedParams.identifier;

    // Validate the identifier
    if (!identifier) {
      return NextResponse.json(
        { error: "Identifier is required" }, 
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

    console.log(`Fetching Farcaster profile for: ${identifier}`);

    let profile = null;

    // Check if identifier is a FID (numeric)
    if (/^\d+$/.test(identifier)) {
      const fid = parseInt(identifier);
      profile = await neynarServerService.getUserByFid(fid);
    } else {
      // Assume it's an Ethereum address
      profile = await neynarServerService.getUserByVerifiedAddress(identifier);
    }

    if (!profile) {
      console.log(`No Farcaster profile found for identifier: ${identifier}`);
      return NextResponse.json(
        { error: "Profile not found" }, 
        { status: 404 }
      );
    }

    console.log(`Found profile for ${identifier}:`, {
      fid: profile.fid,
      username: profile.username,
      displayName: profile.displayName,
      twitterUsername: profile.twitterUsername
    });

    return NextResponse.json({ 
      profile,
      success: true
    });
  } catch (error) {
    console.error("Error fetching Farcaster profile:", error);
    
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
        details: error instanceof Error ? error.message : "Unknown error",
        success: false
      },
      { status: statusCode }
    );
  }
}