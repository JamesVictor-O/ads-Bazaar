"use client";

import { useState, useEffect } from "react";
import { X, Share2, User, Target, CheckCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { signIn, getCsrfToken } from "next-auth/react";
import { SignInButton } from "@farcaster/auth-kit";
import "@farcaster/auth-kit/styles.css";
import { useAccount } from "wagmi";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRegisterUser } from "../../hooks/adsBazaar";
import Image from "next/image";

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

const GetStartedModal = ({
  isOpen = true,
  onClose = () => {},
}: GetStartedModalProps) => {
  const [userDetails, setUserDetails] = useState<UserDetails>({
    userType: "",
    connectedPlatforms: [],
  });
  const router = useRouter();
  const { isConnected } = useAccount();

  // Use the registration hook
  const { register, isPending, isSuccess, isError, error } = useRegisterUser();

  const [showNextStep, setShowNextStep] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_connecting, setConnecting] = useState<SocialPlatform | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isFarcasterLoading, setIsFarcasterLoading] = useState(false);

  useEffect(() => {
    const fetchCsrfToken = async () => {
      const token = await getCsrfToken();
      setCsrfToken(token ?? null);
    };
    fetchCsrfToken();
  }, []);

  useEffect(() => {
    if (isError && error) {
      toast.error(`Transaction failed: ${error.message}`, {
        position: "bottom-center",
      });
    }
  }, [isError, error]);

  useEffect(() => {
    if (isSuccess) {
      toast.success("Registration completed successfully!", {
        position: "bottom-center",
      });
      onClose();
      // Redirect based on user type
      router.push(
        userDetails.userType === "influencer"
          ? "/influencersDashboard"
          : "/brandsDashBoard"
      );
    }
  }, [isSuccess, userDetails.userType, router, onClose]);

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
      const userName =
        data.name ||
        (data.fid ? `Farcaster User ${data.fid}` : "Farcaster User");

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
      setUserDetails((prev) => ({
        ...prev,
        connectedPlatforms: [...(prev.connectedPlatforms || []), "farcaster"],
        farcasterUsername: userName,
        farcasterPfp: data.pfp,
        farcasterId: data.fid,
      }));
    } catch (err) {
      console.error("Farcaster auth error:", err);
      setAuthError(err instanceof Error ? err.message : "Sign in failed");
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

  
  const handleDisconnect = (platform: SocialPlatform) => {
    const connectedPlatforms = userDetails.connectedPlatforms || [];
    setUserDetails({
      ...userDetails,
      connectedPlatforms: connectedPlatforms.filter((p) => p !== platform),
      ...(platform === "farcaster"
        ? {
            farcasterUsername: undefined,
            farcasterPfp: undefined,
            farcasterId: undefined,
          }
        : {}),
    });
  };

  const handleCompleteRegistration = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first", {
        position: "bottom-center",
      });
      return;
    }

    try {
      // Prepare profile data as JSON string
      const profileData = JSON.stringify({
        userType: userDetails.userType,
        ...(userDetails.userType === "influencer"
          ? {
              niche: userDetails.niche || "",
              farcasterUsername: userDetails.farcasterUsername || "",
              farcasterId: userDetails.farcasterId || "",
            }
          : {
              businessType: userDetails.businessType || "",
              budget: userDetails.budget || "",
            }),
      });

      // Call register with the appropriate parameters
      await register(
        userDetails.userType === "advertiser", // isBusiness
        userDetails.userType === "influencer", // isInfluencer
        profileData // profileData as string
      );

      // The redirect is handled in the useEffect for isSuccess
    } catch (err) {
      console.error("Registration error:", err);
      toast.error("Failed to complete registration", {
        position: "bottom-center",
      });
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
    if (
      userDetails.farcasterUsername &&
      userDetails.farcasterUsername !==
        `Farcaster User ${userDetails.farcasterId}`
    ) {
      return userDetails.farcasterUsername;
    } else if (userDetails.farcasterId) {
      return `Farcaster ID: ${userDetails.farcasterId}`;
    }
    return "Connected";
  };

  if (!isOpen) return null;

  return (
  <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300">
    <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 w-full max-w-2xl mx-auto max-h-[85vh] overflow-hidden flex flex-col shadow-2xl shadow-emerald-500/10">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Get Started
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {!showNextStep 
              ? "Choose your path and start your journey" 
              : userDetails.userType === "influencer"
                ? "Set up your influencer profile"
                : "Set up your advertising account"
            }
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
          disabled={isPending}
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {!showNextStep ? (
        /* User Type Selection */
        <div className="flex-grow">
          <h3 className="text-sm font-medium text-slate-400 mb-6 uppercase tracking-wide">
            What best describes you?
          </h3>
          
          <div className="space-y-4">
            <button
              onClick={() => handleUserTypeSelection("influencer")}
              className="w-full p-6 bg-slate-900/50 border border-slate-700/50 rounded-xl hover:border-emerald-500/50 hover:bg-slate-900/70 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 group-hover:border-emerald-500/40 transition-all duration-200">
                    <User className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-medium text-white group-hover:text-emerald-300 transition-colors duration-200">
                      Im an Influencer
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                      I want to monetize my audience and work with brands
                    </p>
                  </div>
                </div>
                <div className="w-5 h-5 rounded-full border-2 border-slate-600 group-hover:border-emerald-500 transition-colors duration-200"></div>
              </div>
            </button>

            <button
              onClick={() => handleUserTypeSelection("advertiser")}
              className="w-full p-6 bg-slate-900/50 border border-slate-700/50 rounded-xl hover:border-emerald-500/50 hover:bg-slate-900/70 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 group-hover:border-emerald-500/40 transition-all duration-200">
                    <Target className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-medium text-white group-hover:text-emerald-300 transition-colors duration-200">
                      I want to run ads
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                      Im looking to promote my business or product
                    </p>
                  </div>
                </div>
                <div className="w-5 h-5 rounded-full border-2 border-slate-600 group-hover:border-emerald-500 transition-colors duration-200"></div>
              </div>
            </button>
          </div>
        </div>
      ) : (
        /* Profile Setup */
        <div className="flex-grow">
          {userDetails.userType === "influencer" ? (
            /* Influencer Setup */
            <div className="space-y-6">
              {/* Niche Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Niche/Category
                  <span className="text-red-400 ml-1">*</span>
                </label>
                <select
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 text-sm text-slate-300 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
                  value={userDetails.niche || ""}
                  onChange={(e) =>
                    setUserDetails({
                      ...userDetails,
                      niche: e.target.value,
                    })
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

              {/* Social Media Connection */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Connect Your Social Media
                </label>
                
                {authError && (
                  <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-sm text-red-400">{authError}</p>
                  </div>
                )}

                <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center border border-purple-500/20">
                        <Share2 className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-white">Farcaster</p>
                        <p className="text-xs text-slate-400">Connect your profile</p>
                      </div>
                    </div>

                    {userDetails.connectedPlatforms?.includes("farcaster") ? (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center">
                          {userDetails.farcasterPfp && (
                            <Image src={userDetails.farcasterPfp} alt="Profile" className="w-6 h-6 rounded-full mr-2" />
                          )}
                          <span className="text-sm font-medium text-slate-300">
                            {getUserDisplayName()}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDisconnect("farcaster")}
                          className="px-3 py-1 bg-slate-700/50 text-slate-400 text-sm rounded-lg border border-slate-600/50 hover:bg-slate-700 hover:text-white transition-all duration-200"
                        >
                          Disconnect
                        </button>
                      </div>
                    ) : isFarcasterLoading ? (
                      <div className="flex items-center">
                        <Loader2 className="animate-spin w-4 h-4 text-slate-400 mr-2" />
                        <span className="text-sm text-slate-400">Connecting...</span>
                      </div>
                    ) : (
                      <SignInButton
                       // @ts-expect-error:Brief ID should be typed but API currently accepts any string
                        onSuccess={handleSuccess}
                        onError={(error) => {
                          console.error("Farcaster auth error:", error);
                          setAuthError("Failed to authenticate with Farcaster");
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
            /* Advertiser Setup */
            <div className="space-y-6">
              {/* Business Type */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Business Type
                  <span className="text-red-400 ml-1">*</span>
                </label>
                <select
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 text-sm text-slate-300 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
                  value={userDetails.businessType || ""}
                  onChange={(e) =>
                    setUserDetails({
                      ...userDetails,
                      businessType: e.target.value,
                    })
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

              {/* Budget */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Monthly Ad Budget
                  <span className="text-red-400 ml-1">*</span>
                </label>
                <select
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 text-sm text-slate-300 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
                  value={userDetails.budget || ""}
                  onChange={(e) =>
                    setUserDetails({
                      ...userDetails,
                      budget: e.target.value,
                    })
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
      )}

      {/* Loading State */}
      {isPending && (
        <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start">
          <Loader2 className="animate-spin text-emerald-400 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-400">
              Setting up your account
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Please wait while we complete your registration...
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {showNextStep && (
        <div className="mt-6 flex justify-end pt-4 border-t border-slate-700/50 gap-4">
          <button
            onClick={handleBack}
            disabled={isPending}
            className="px-6 py-3 text-sm font-medium text-slate-300 bg-slate-700/50 rounded-xl border border-slate-600/50 hover:bg-slate-700 hover:border-slate-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
          <button
            onClick={handleCompleteRegistration}
            disabled={!isFormValid() || isPending}
            className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md shadow-emerald-500/25"
          >
            {isPending ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="animate-spin h-4 w-4" />
                <span>Processing...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>Complete Registration</span>
              </div>
            )}
          </button>
        </div>
      )}
    </div>
  </div>
);
};

export default GetStartedModal;
