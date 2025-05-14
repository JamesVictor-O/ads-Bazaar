"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="bg-white shadow-lg rounded-lg max-w-md w-full p-6">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
        
        <div className="bg-red-50 p-4 rounded-md mb-6">
          <p className="text-red-700">
            {error === "CredentialsSignin" 
              ? "Failed to verify your Farcaster signature." 
              : error || "An error occurred during authentication"}
          </p>
        </div>
        
        <p className="text-gray-600 mb-6">
          There was a problem with your authentication attempt. This could be due to:
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Invalid or expired signature</li>
            <li>Domain mismatch in configuration</li>
            <li>Connection issues with Farcaster</li>
            <li>Server configuration problems</li>
          </ul>
        </p>
        
        <div className="flex justify-center">
          <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}