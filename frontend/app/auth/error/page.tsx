// app/auth/error/page.tsx
"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 max-w-md w-full text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-4">Authentication Error</h1>
        
        <div className="bg-red-900/20 border border-red-800/50 p-4 rounded-lg mb-6">
          <p className="text-red-400">
            {error === "CredentialsSignin"
              ? "Failed to verify your Farcaster signature."
              : error
                ? decodeURIComponent(error)
                : "An error occurred during authentication."}
          </p>
        </div>
        
        <p className="text-slate-400 mb-8">
          There was a problem with your authentication attempt. This could be due to:
          <ul className="list-disc list-inside mt-2 space-y-1 text-left">
            <li>Invalid or expired Farcaster signature</li>
            <li>Domain mismatch in configuration</li>
            <li>Connection issues with Farcaster</li>
            <li>Server configuration problems</li>
          </ul>
        </p>
        
        <Link href="/">
          <button className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold py-2 px-6 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-lg shadow-emerald-500/25">
            Return to Home
          </button>
        </Link>
      </div>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto"></div>
            <p className="text-slate-400 mt-4">Loading error details...</p>
          </div>
        </div>
      }
    >
      <ErrorContent />
    </Suspense>
  );
}