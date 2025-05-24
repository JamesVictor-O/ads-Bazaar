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
import { motion, AnimatePresence } from "framer-motion";

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
  const { register, isPending, isSuccess, isError, error } = useRegisterUser();
  const [showNextStep, setShowNextStep] = useState(false);
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
      const userName =
        data.name ||
        (data.fid ? `Farcaster User ${data.fid}` : "Farcaster User");

      const result = await signIn("farcaster", {
        message: data.message,
        signature: data.signature,
        name: userName,
        pfp: data.pfp,
        fid: data.fid,
        callbackUrl: "/",
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

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

      await register(
        userDetails.userType === "advertiser",
        userDetails.userType === "influencer",
        profileData
      );
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
    <motion.div
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="bg-slate-800/90 backdrop-blur-md border border-slate-700/50 rounded-2xl w-full max-w-md sm:max-w-2xl mx-auto max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl shadow-emerald-500/10"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-700/50">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Get Started
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {!showNextStep
                ? "Choose your path to start"
                : userDetails.userType === "influencer"
                ? "Set up your influencer profile"
                : "Set up your advertising account"}
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

        {/* Content */}
        <div className="p-4 sm:p-6 flex-grow">
          <AnimatePresence mode="wait">
            {!showNextStep ? (
              <motion.div
                key="user-type"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <h3 className="text-xs sm:text-sm font-medium text-slate-400 mb-4 sm:mb-6 uppercase tracking-wide">
                  What best describes you?
                </h3>
                <div className="space-y-4">
                  <button
                    onClick={() => handleUserTypeSelection("influencer")}
                    className="w-full p-4 sm:p-6 bg-slate-900/50 border border-slate-700/50 rounded-xl hover:border-emerald-500/50 hover:bg-slate-900/70 transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 group-hover:border-emerald-500/40 transition-all duration-200">
                          <User className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-base sm:text-lg font-medium text-white group-hover:text-emerald-300 transition-colors duration-200">
                            I’m an Influencer
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-400 mt-1">
                            Monetize your audience with brands
                          </p>
                        </div>
                      </div>
                      <div className="w-5 h-5 rounded-full border-2 border-slate-600 group-hover:border-emerald-500 transition-colors duration-200"></div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleUserTypeSelection("advertiser")}
                    className="w-full p-4 sm:p-6 bg-slate-900/50 border border-slate-700/50 rounded-xl hover:border-emerald-500/50 hover:bg-slate-900/70 transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 group-hover:border-emerald-500/40 transition-all duration-200">
                          <Target className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-base sm:text-lg font-medium text-white group-hover:text-emerald-300 transition-colors duration-200">
                            I want to run ads
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-400 mt-1">
                            Promote my business or product
                          </p>
                        </div>
                      </div>
                      <div className="w-5 h-5 rounded-full border-2 border-slate-600 group-hover:border-emerald-500 transition-colors duration-200"></div>
                    </div>
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="profile-setup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {userDetails.userType === "influencer" ? (
                  <>
                    {/* Niche Selection */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Niche/Category
                        <span className="text-red-400 ml-1">*</span>
                      </label>
                      <select
                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 sm:p-4 text-sm text-slate-300 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
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
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Connect Your Social Media
                        <span className="text-red-400 ml-1">*</span>
                      </label>

                      {authError && (
                        <div className="mb-4 p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                          <p className="text-xs sm:text-sm text-red-400">{authError}</p>
                        </div>
                      )}

                      <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-500/10 rounded-full flex items-center justify-center border border-purple-500/20">
                              <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                            </div>
                            <div>
                              <p className="text-base sm:text-lg font-medium text-white">Farcaster</p>
                              <p className="text-xs text-slate-400">Connect your profile</p>
                            </div>
                          </div>

                          {userDetails.connectedPlatforms?.includes("farcaster") ? (
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="flex items-center">
                                {userDetails.farcasterPfp && (
                                  <Image
                                    src={userDetails.farcasterPfp}
                                    alt="Profile"
                                    width={24}
                                    height={24}
                                    className="w-6 h-6 rounded-full mr-2"
                                  />
                                )}
                                <span className="text-xs sm:text-sm font-medium text-slate-300">
                                  {getUserDisplayName()}
                                </span>
                              </div>
                              <button
                                onClick={() => handleDisconnect("farcaster")}
                                className="px-2 sm:px-3 py-1 bg-slate-700/50 text-slate-400 text-xs sm:text-sm rounded-lg border border-slate-600/50 hover:bg-slate-700 hover:text-white transition-all duration-200"
                              >
                                Disconnect
                              </button>
                            </div>
                          ) : isFarcasterLoading ? (
                            <div className="flex items-center">
                              <Loader2 className="animate-spin w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 mr-2" />
                              <span className="text-xs sm:text-sm text-slate-400">Connecting...</span>
                            </div>
                          ) : (
                            <SignInButton
                              // @ts-expect-error: FID should be typed but API accepts any string
                              onSuccess={handleSuccess}
                              onError={(error) => {
                                console.error("Farcaster auth error:", error);
                                setAuthError("Failed to authenticate with Farcaster");
                              }}
                              domain="localhost:3000"
                              siweUri="http://localhost:3000"
                              nonce={csrfToken || undefined}
                              timeout={300000}
                            >
                              <button className="px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 flex items-center gap-2">
                                <Share2 className="w-4 h-4" />
                                Connect Farcaster
                              </button>
                            </SignInButton>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Business Type */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Business Type
                        <span className="text-red-400 ml-1">*</span>
                      </label>
                      <select
                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 sm:p-4 text-sm text-slate-300 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
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
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Monthly Ad Budget
                        <span className="text-red-400 ml-1">*</span>
                      </label>
                      <select
                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 sm:p-4 text-sm text-slate-300 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
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
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading State */}
          {isPending && (
            <div className="mt-6 p-3 sm:p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start">
              <Loader2 className="animate-spin text-emerald-400 mr-3 mt-0.5 flex-shrink-0 w-5 h-5" />
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
        </div>

        {/* Action Buttons */}
        {showNextStep && (
          <div className="p-4 sm:p-6 border-t border-slate-700/50 flex flex-col sm:flex-row justify-between gap-3 sm:gap-4">
            <motion.button
              onClick={handleBack}
              disabled={isPending}
              className="px-4 sm:px-6 py-3 text-sm font-medium text-slate-300 bg-slate-700/50 rounded-xl border border-slate-600/50 hover:bg-slate-700 hover:border-slate-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed order-2 sm:order-1"
              whileTap={{ scale: 0.95 }}
            >
              Back
            </motion.button>
            <motion.button
              onClick={handleCompleteRegistration}
              disabled={!isFormValid() || isPending}
              className="px-4 sm:px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md shadow-emerald-500/25 order-1 sm:order-2"
              whileTap={{ scale: 0.95 }}
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
            </motion.button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default GetStartedModal;