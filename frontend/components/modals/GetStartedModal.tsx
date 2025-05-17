"use client";

import { useState, useEffect } from "react";
import { X, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { signIn, getCsrfToken } from "next-auth/react";
import { SignInButton } from "@farcaster/auth-kit";
import "@farcaster/auth-kit/styles.css";
import { useAccount, useWriteContract } from "wagmi";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Smart contract ABI (generated after deployment)
const ADS_BAZER_ABI = [
  {
    inputs: [
      { name: "userType", type: "string" },
      { name: "niche", type: "string" },
      { name: "businessType", type: "string" },
      { name: "budget", type: "string" },
    ],
    name: "registerUser",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "isUserRegistered",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
];

interface GetStartedModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

type UserType = "influencer" | "advertiser";
type SocialPlatform = "farcaster";

interface UserDetails {
  userType: UserType | "";
  niche?: string;
  connectedPlatforms?: SocialPlatform[];
  businessType?: string;
  budget?: string;
  farcasterUsername?: string;
  farcasterPfp?: string;
  farcasterId?: string;
}

const GetStartedModal = ({ isOpen = true, onClose = () => {} }: GetStartedModalProps) => {
  const [userDetails, setUserDetails] = useState<UserDetails>({
    userType: "",
    connectedPlatforms: [],
  });
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { writeContract, isPending, error: txError } = useWriteContract();

  const [showNextStep, setShowNextStep] = useState(false);
  const [connecting, setConnecting] = useState<SocialPlatform | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFarcasterLoading, setIsFarcasterLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);


  useEffect(() => {
    const fetchCsrfToken = async () => {
      const token = await getCsrfToken();
      setCsrfToken(token ?? null);
    };
    fetchCsrfToken();
  }, []);

  useEffect(() => {
    if (txError) {
      toast.error(`Transaction failed: ${txError.message}`, { position: "bottom-center" });
    }
  }, [txError]);

  const handleSuccess = async (data: {
    message: string;
    signature: `0x${string}`;
    name: string;
    pfp: string;
    fid?: string;
  }) => {
    setIsFarcasterLoading(true);
    try {

      console.log("Farcaster data received:", {
        name: data.name || "No name received",
        signature: data.signature ? "Signature received" : "No signature",
        message: data.message ? "Message received" : "No message",
        pfp: data.pfp ? "Profile picture received" : "No profile picture",
        fid: data.fid || "No FID received",
      });

      // Use the name from data, or fallback to "Farcaster User + FID"
      const userName = data.name || (data.fid ? `Farcaster User ${data.fid}` : "Farcaster User");

      const result = await signIn("farcaster", {
        message: data.message,
        signature: data.signature,
        name: userName,
        pfp: data.pfp,
        fid: data.fid, // Pass FID to the auth provider
        callbackUrl: "/", 
        redirect: false, 
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      // Update user details with Farcaster info
      setUserDetails(prev => ({
        ...prev,
        connectedPlatforms: [...(prev.connectedPlatforms || []), "farcaster"],
        farcasterUsername: userName,
        farcasterPfp: data.pfp,
        farcasterId: data.fid
      }));
    } catch (err) {
      console.error("Farcaster auth error:", err);
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setIsFarcasterLoading(false);
    }
  };

  const handleUserTypeSelection = (type: UserType) => {
    setUserDetails({ ...userDetails, userType: type });
    setShowNextStep(true);
  };

  const handleBack = () => {
    setShowNextStep(false);
  };

  const handleConnect = (platform: SocialPlatform) => {
    setConnecting(platform);
    setTimeout(() => {
      const connectedPlatforms = userDetails.connectedPlatforms || [];
      if (!connectedPlatforms.includes(platform)) {
        setUserDetails({
          ...userDetails,
          connectedPlatforms: [...connectedPlatforms, platform],
        });
      }
      setConnecting(null);
    }, 1000);
  };

  const handleDisconnect = (platform: SocialPlatform) => {
    const connectedPlatforms = userDetails.connectedPlatforms || [];
    setUserDetails({
      ...userDetails,
      connectedPlatforms: connectedPlatforms.filter((p) => p !== platform),
      ...(platform === "farcaster" ? { 
        farcasterUsername: undefined, 
        farcasterPfp: undefined,
        farcasterId: undefined 
      } : {})
    });
  };
  const handleCompleteRegistration = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first", { position: "bottom-center" });
      return;
    }

    setIsLoading(true);
    try {
      await writeContract({
        address: "0xYourContractAddress", // Replace with deployed contract address
        abi: ADS_BAZER_ABI,
        functionName: "registerUser",
        args: [
          userDetails.userType,
          userDetails.niche || "",
          userDetails.businessType || "",
          userDetails.budget || "",
        ],
      });
      toast.success("Registration completed successfully!", { position: "bottom-center" });
      onClose();
      router.push(
        userDetails.userType === "influencer" ? "/influencersDashboard" : "/brandsDashBoard"
      );
    } catch (err) {
      console.error("Registration error:", err);
      toast.error("Failed to complete registration", { position: "bottom-center" });
    } finally {
      setIsLoading(false);
    }
  };
const isFormValid = () => {
  if (userDetails.userType === "influencer") {
    return (
      !!userDetails.niche && 
      Array.isArray(userDetails.connectedPlatforms) && 
      userDetails.connectedPlatforms.length > 0
    );
  }
  return !!userDetails.businessType && !!userDetails.budget;
};

  const getUserDisplayName = () => {
    if (userDetails.farcasterUsername && userDetails.farcasterUsername !== `Farcaster User ${userDetails.farcasterId}`) {
      return userDetails.farcasterUsername;
    } else if (userDetails.farcasterId) {
      return `Farcaster ID: ${userDetails.farcasterId}`;
    }
    return "Connected";
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Get Started</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {!showNextStep ? (
          <div className="space-y-6">
            <p className="text-gray-600">What best describes you?</p>
            <div className="space-y-4">
              <button
                onClick={() => handleUserTypeSelection("influencer")}
                className="w-full p-4 border-2 border-blue-500 rounded-lg flex items-center justify-between hover:bg-blue-50 transition-colors"
              >
                <div className="text-left">
                  <h3 className="font-medium text-lg text-gray-800">I'm an Influencer</h3>
                  <p className="text-gray-600 text-sm">I want to monetize my audience and work with brands</p>
                </div>
                <div className="w-6 h-6 rounded-full border-2 border-blue-500"></div>
              </button>
              <button
                onClick={() => handleUserTypeSelection("advertiser")}
                className="w-full p-4 border-2 border-blue-500 rounded-lg flex items-center justify-between hover:bg-blue-50 transition-colors"
              >
                <div className="text-left">
                  <h3 className="font-medium text-lg text-gray-800">I want to run ads</h3>
                  <p className="text-gray-600 text-sm">I'm looking to promote my business or product</p>
                </div>
                <div className="w-6 h-6 rounded-full border-2 border-blue-500"></div>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-gray-600">
              {userDetails.userType === "influencer"
                ? "Great! Let's set up your influencer profile"
                : "Great! Let's set up your advertising account"}
            </p>
            <div className="space-y-4 text-gray-600">
              {userDetails.userType === "influencer" ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Niche/Category</label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={userDetails.niche || ""}
                      onChange={(e) =>
                        setUserDetails({ ...userDetails, niche: e.target.value })
                      }
                    >
                      <option value="">Select a category</option>
                      <option value="fashion">Fashion & Style</option>
                      <option value="beauty">Beauty & Cosmetics</option>
                      <option value="fitness">Fitness & Health</option>
                      <option value="travel">Travel & Lifestyle</option>
                      <option value="food">Food & Cooking</option>
                      <option value="tech">Technology</option>
                      <option value="gaming">Gaming</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Connect Your Social Media</label>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center">
                          <div className="bg-purple-100 p-2 rounded-full mr-3">
                            <Share2 size={18} className="text-purple-600" />
                          </div>
                          <span className="font-medium">Farcaster</span>
                        </div>
                        
                        {error && (
                          <div className="mb-4 rounded-md bg-red-50 p-4 text-red-700">{error}</div>
                        )}
                        
                        {userDetails.connectedPlatforms?.includes("farcaster") ? (
                          <div className="flex items-center gap-3">
                            <div className="flex items-center">
                              {userDetails.farcasterPfp && (
                                <img 
                                  src={userDetails.farcasterPfp} 
                                  alt="Profile" 
                                  className="w-6 h-6 rounded-full mr-2"
                                />
                              )}
                              <span className="text-sm font-medium">
                                {getUserDisplayName()}
                              </span>
                            </div>
                            <button
                              onClick={() => handleDisconnect("farcaster")}
                              className="py-1 px-3 bg-gray-100 text-gray-600 text-sm rounded-md hover:bg-gray-200 transition-colors"
                            >
                              Disconnect
                            </button>
                          </div>
                        ) : isFarcasterLoading ? (
                          <div className="flex items-center">
                            <span className="text-sm text-gray-500">Connecting...</span>
                          </div>
                        ) : (
                          <SignInButton
                            onSuccess={handleSuccess}
                            onError={(error) => {
                              console.error("Farcaster auth error:", error);
                              setError("Failed to authenticate with Farcaster");
                            }}
                            domain="localhost:3000"
                            siweUri="http://localhost:3000"
                            nonce={csrfToken || undefined}
                            timeout={300000}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={userDetails.businessType || ""}
                      onChange={(e) =>
                        setUserDetails({ ...userDetails, businessType: e.target.value })
                      }
                    >
                      <option value="">Select business type</option>
                      <option value="ecommerce">E-commerce Store</option>
                      <option value="local">Local Business</option>
                      <option value="software">Software/App</option>
                      <option value="service">Service Provider</option>
                      <option value="personal">Personal Brand</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Ad Budget</label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={userDetails.budget || ""}
                      onChange={(e) =>
                        setUserDetails({ ...userDetails, budget: e.target.value })
                      }
                    >
                      <option value="">Select budget range</option>
                      <option value="under500">Less than $500</option>
                      <option value="500-2000">$500 - $2,000</option>
                      <option value="2000-5000">$2,000 - $5,000</option>
                      <option value="5000-10000">$5,000 - $10,000</option>
                      <option value="10000plus">$10,000+</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-between mt-6">
              <button
                onClick={handleBack}
                className="py-2 px-4 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCompleteRegistration}
                disabled={!isFormValid() || isLoading || isPending}
                className={`py-2 px-4 rounded-md text-white transition-colors ${
                  isFormValid() && !isLoading && !isPending
                    ? "bg-indigo-600 hover:bg-indigo-700"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                {isLoading || isPending ? (
                  <svg className="animate-spin h-5 w-5 mx-auto text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"></path>
                  </svg>
                ) : (
                  "Complete Registration"
                )}

              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GetStartedModal;