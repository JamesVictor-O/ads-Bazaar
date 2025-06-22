
// debug address lookup issues

import { NextRequest, NextResponse } from "next/server";
import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const resolvedParams = await params;
    const address = resolvedParams.address;

    const apiKey = process.env.NEYNAR_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const config = new Configuration({ apiKey });
    const client = new NeynarAPIClient(config);

    console.log(`DEBUG: Testing address lookup for: ${address}`);

    // Test with a known working address (Dan Romero's)
    const knownWorkingAddress = "0xd7029bdea1c17493893aafe29aad69ef892b8ff2";
    
    try {
      console.log("Testing with known working address...");
      const testResponse = await client.fetchBulkUsersByEthOrSolAddress({ 
        addresses: [knownWorkingAddress] 
      });
      
      console.log("Known address test response:", JSON.stringify(testResponse, null, 2));
      
      // Now test with the provided address
      console.log(`Testing with provided address: ${address}`);
      const userResponse = await client.fetchBulkUsersByEthOrSolAddress({ 
        addresses: [address] 
      });
      
      console.log("User address test response:", JSON.stringify(userResponse, null, 2));
      
      return NextResponse.json({
        debug: true,
        testedAddress: address,
        knownWorkingTest: {
          address: knownWorkingAddress,
          response: testResponse,
          hasUsers: !!(testResponse.users && testResponse.users.length > 0),
          responseKeys: Object.keys(testResponse),
        },
        userAddressTest: {
          address: address,
          response: userResponse,
          hasUsers: !!(userResponse.users && userResponse.users.length > 0),
          responseKeys: Object.keys(userResponse),
        },
        suggestions: [
          "Check if the address has a verified Farcaster account",
          "Try with Dan Romero's address: 0xd7029bdea1c17493893aafe29aad69ef892b8ff2",
          "Check the exact response structure in the logs above",
        ]
      });
      
    } catch (apiError) {
      console.error("API Error:", apiError);
      return NextResponse.json({
        debug: true,
        error: "API call failed",
        details: apiError instanceof Error ? apiError.message : "Unknown error",
        address: address,
      });
    }

  } catch (error) {
    console.error("Debug route error:", error);
    return NextResponse.json(
      { 
        debug: true,
        error: "Debug route failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}