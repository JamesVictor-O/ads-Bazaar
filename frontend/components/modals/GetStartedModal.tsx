"use client";

import { useState, useEffect } from "react";
import {
  X,
  User,
  Target,
  CheckCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

import { useRegisterUser } from "../../hooks/adsBazaar";
import { withNetworkGuard } from "../WithNetworkGuard";
import { NetworkStatus } from "../NetworkStatus";
import { useEnsureNetwork } from "@/hooks/useEnsureNetwork";
import { useDivviIntegration } from "@/hooks/useDivviIntegration";

interface GetStartedModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  guardedAction?: (action: () => Promise<void>) => Promise<void>;
}

type UserType = "influencer" | "advertiser";

interface UserDetails {
  userType: UserType | "";
  niche?: string;
  businessType?: string;
  budget?: string;
}

const GetStartedModal = ({
  isOpen = true,
  onClose = () => {},
  guardedAction,
}: GetStartedModalProps) => {
  const [userDetails, setUserDetails] = useState<UserDetails>({ userType: "" });
  const [showNextStep, setShowNextStep] = useState(false);

  const router = useRouter();
  const { isConnected } = useAccount();
  const { register, isPending, isSuccess, isError, error, hash } = useRegisterUser();
  const { isCorrectChain, currentNetwork } = useEnsureNetwork();
  const { generateDivviReferralTag, trackTransaction } = useDivviIntegration();

  // Handle registration errors
  useEffect(() => {
    if (isError && error) {
      toast.error(`Registration failed: ${error.message}`, {
        duration: 5000,
      });
    }
  }, [isError, error]);

  // Handle successful registration
  useEffect(() => {
    if (isSuccess) {
      toast.success("Registration completed successfully!");
      onClose();
      router.push(
        userDetails.userType === "influencer"
          ? "/influencersDashboard"
          : "/brandsDashBoard"
      );
    }
  }, [isSuccess, userDetails.userType, router, onClose]);

  // Track transaction when hash becomes available
  useEffect(() => {
    if (hash) {
      console.log('DIVVI: Hash available from registration:', hash);
      trackTransaction(hash);
    }
  }, [hash, trackTransaction]);

  const handleUserTypeSelection = (type: UserType) => {
    setUserDetails({ ...userDetails, userType: type });
    setShowNextStep(true);
  };

  const handleBack = () => {
    setShowNextStep(false);
  };

  const handleCompleteRegistration = async () => {
    if (!guardedAction) {
      toast.error("Network configuration error. Please refresh and try again.");
      return;
    }

    if (!isFormValid()) {
      toast.error("Please fill in all required fields");
      return;
    }

    await guardedAction(async () => {
      // Create profile data
      const profileData = JSON.stringify({
        userType: userDetails.userType,
        ...(userDetails.userType === "influencer"
          ? { niche: userDetails.niche || "" }
          : {
              businessType: userDetails.businessType || "",
              budget: userDetails.budget || "",
            }),
      });

      // Generate Divvi referral tag to append to transaction calldata
      const referralTag = generateDivviReferralTag();
      console.log('DIVVI: About to call register with referral tag:', referralTag);

      // Call register with referral tag as dataSuffix
      await register(
        userDetails.userType === "advertiser",
        userDetails.userType === "influencer",
        profileData,
        referralTag // This appends referral tag to transaction calldata
      );
    });
  };

  const isFormValid = () => {
    if (userDetails.userType === "influencer") {
      return !!userDetails.niche;
    }
    return !!userDetails.businessType && !!userDetails.budget;
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
          {/* Network Status */}
          {isConnected && (
            <div className="mb-4">
              <NetworkStatus className="bg-slate-900/30 border-slate-600/50" />
            </div>
          )}

          {/* Wallet Not Connected */}
          {!isConnected && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start">
              <AlertTriangle className="text-amber-400 mr-3 mt-0.5 flex-shrink-0 w-5 h-5" />
              <div>
                <p className="text-sm font-medium text-amber-400">
                  Wallet Not Connected
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Please connect your wallet to continue with registration
                </p>
              </div>
            </div>
          )}

          {/* Wrong Network Warning */}
          {isConnected && !isCorrectChain && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start">
              <AlertTriangle className="text-red-400 mr-3 mt-0.5 flex-shrink-0 w-5 h-5" />
              <div>
                <p className="text-sm font-medium text-red-400">
                  Wrong Network
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Switch to {currentNetwork.name} to complete registration
                </p>
              </div>
            </div>
          )}

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
                    disabled={!isConnected}
                    className="w-full p-4 sm:p-6 bg-slate-900/50 border border-slate-700/50 rounded-xl hover:border-emerald-500/50 hover:bg-slate-900/70 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-slate-700/50 disabled:hover:bg-slate-900/50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 group-hover:border-emerald-500/40 group-disabled:group-hover:border-emerald-500/20 transition-all duration-200">
                          <User className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-base sm:text-lg font-medium text-white group-hover:text-emerald-300 group-disabled:group-hover:text-white transition-colors duration-200">
                            I&apos;m an Influencer
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-400 mt-1">
                            Monetize your audience with brands
                          </p>
                        </div>
                      </div>
                      <div className="w-5 h-5 rounded-full border-2 border-slate-600 group-hover:border-emerald-500 group-disabled:group-hover:border-slate-600 transition-colors duration-200"></div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleUserTypeSelection("advertiser")}
                    disabled={!isConnected}
                    className="w-full p-4 sm:p-6 bg-slate-900/50 border border-slate-700/50 rounded-xl hover:border-emerald-500/50 hover:bg-slate-900/70 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-slate-700/50 disabled:hover:bg-slate-900/50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 group-hover:border-emerald-500/40 group-disabled:group-hover:border-emerald-500/20 transition-all duration-200">
                          <Target className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-base sm:text-lg font-medium text-white group-hover:text-emerald-300 group-disabled:group-hover:text-white transition-colors duration-200">
                            I want to run ads
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-400 mt-1">
                            Promote my business or product
                          </p>
                        </div>
                      </div>
                      <div className="w-5 h-5 rounded-full border-2 border-slate-600 group-hover:border-emerald-500 group-disabled:group-hover:border-slate-600 transition-colors duration-200"></div>
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
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Niche/Category{" "}
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
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Business Type{" "}
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
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Monthly Ad Budget{" "}
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

          {/* Transaction Status */}
          {isPending && (
            <div className="mt-6 p-3 sm:p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start">
              <Loader2 className="animate-spin text-emerald-400 mr-3 mt-0.5 flex-shrink-0 w-5 h-5" />
              <div>
                <p className="text-sm font-medium text-emerald-400">
                  Processing Registration
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Please confirm the transaction in your wallet and wait for it
                  to be processed...
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
              disabled={
                !isConnected || !isCorrectChain || !isFormValid() || isPending
              }
              className="px-4 sm:px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md shadow-emerald-500/25 order-1 sm:order-2"
              whileTap={{ scale: 0.95 }}
            >
              {isPending ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="animate-spin h-4 w-4" />
                  <span>Processing...</span>
                </div>
              ) : !isConnected ? (
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Connect Wallet First</span>
                </div>
              ) : !isCorrectChain ? (
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Switch Network First</span>
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

export default withNetworkGuard(GetStartedModal);