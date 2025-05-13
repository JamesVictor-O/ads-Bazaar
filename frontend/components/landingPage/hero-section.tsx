"use client";
import { useState } from "react";
import {
  ArrowRight,
  CheckCircle,
  TrendingUp,
  DollarSign,
  Shield,
} from "lucide-react";

interface HeroSectionProps {
  setIsModalOpen: (isOpen: boolean) => void;
}

export default function HeroSection({ setIsModalOpen }: HeroSectionProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleGetStartedClick = () => {
    setIsModalOpen(true);
  };

  return (
    <section className="relative md:min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 px-4 sm:px-6 lg:px-16 py-10 sm:py-12 lg:py-16 overflow-hidden">
      <div className=" flex flex-col lg:flex-row items-center justify-between gap-8  md:mt-40 lg:gap-12">
        {/* Left Content */}
        <div className="w-full lg:w-[60%] space-y-6 text-center lg:text-left mt-8 sm:mt-12 lg:mt-0">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
              Connecting{" "}
              <span className="text-emerald-400">Brands, Businesses</span> with{" "}
              <span className="text-emerald-400">
                Influencers, Content Creators
              </span>
              <br className="hidden sm:block" />{" "}
              <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl block mt-2">
                For Measurable Growth & Guaranteed Earnings
              </span>
            </h1>
            <p className="mt-4 sm:mt-6 text-lg sm:text-xl md:text-2xl text-slate-300">
              The trusted marketplace where verified creators help brands
              increase visibility and sales, with transparent campaigns, secure
              payments, and performance tracking.
            </p>
          </div>

          <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-2">
            <button
              className="px-6 sm:px-8 py-3 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 transition shadow-lg flex items-center group"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onClick={handleGetStartedClick}
            >
              Get Started
              <ArrowRight
                size={18}
                className={`ml-2 transition-transform duration-300 ${
                  isHovered ? "transform translate-x-1" : ""
                }`}
              />
            </button>
            <button className="px-6 sm:px-8 py-3 bg-transparent border border-slate-600 text-slate-200 font-medium rounded-lg hover:bg-slate-700/50 transition">
              Learn More
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 pt-6 md:pt-8 max-w-lg mx-auto lg:mx-0">
            <div className="text-center border rounded-lg py-2 sm:py-3 px-1 sm:px-2">
              <div className="flex justify-center mb-1 sm:mb-2">
                <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-emerald-400 border rounded-full p-1" />
              </div>
              <p className="text-xs sm:text-sm text-slate-300">
                Verified Influencers
              </p>
            </div>
            <div className="text-center border rounded-lg py-2 sm:py-3 px-1 sm:px-2">
              <div className="flex justify-center mb-1 sm:mb-2">
                <DollarSign className="h-4 w-4 sm:h-6 sm:w-6 text-emerald-400 border rounded-full p-1" />
              </div>
              <p className="text-xs sm:text-sm text-slate-300">
                Crypto Payments
              </p>
            </div>
            <div className="text-center border rounded-lg py-2 sm:py-3 px-1 sm:px-2">
              <div className="flex justify-center mb-1 sm:mb-2">
                <Shield className="h-4 w-4 sm:h-6 sm:w-6 text-emerald-400 border rounded-full p-1" />
              </div>
              <p className="text-xs sm:text-sm text-slate-300">
                Blockchain Secured
              </p>
            </div>
          </div>
        </div>

        {/* Right Content - Campaign Card */}
        <div className="w-full lg:w-1/3 flex justify-center mt-10 lg:mt-0">
          <div className="relative w-full max-w-sm sm:max-w-md">
            {/* Decorative Elements */}
            <div className="absolute -top-6 -left-6 w-48 h-48 md:w-64 md:h-64 bg-emerald-500/10 rounded-full filter blur-3xl"></div>
            <div className="absolute -bottom-10 -right-10 w-48 h-48 md:w-64 md:h-64 bg-indigo-500/10 rounded-full filter blur-3xl"></div>

            {/* Campaign Card */}
            <div className="bg-white dark:bg-slate-800 border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden z-10 relative">
              {/* Card Header */}
              <div className="bg-gradient-to-r from-slate-700 to-slate-800 p-4 sm:p-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg sm:text-xl font-bold text-white">
                    Featured Campaigns
                  </h3>
                  <span className="text-emerald-400 text-xs sm:text-sm font-medium">
                    For Influencers
                  </span>
                </div>
              </div>

              {/* Campaign List */}
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Campaign 1 */}
                <div className="bg-slate-100 dark:bg-slate-700/40 rounded-xl p-4 sm:p-6 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-3 sm:mb-4">
                    <div>
                      <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded">
                        PREMIUM
                      </span>
                      <h3 className="text-base sm:text-lg font-semibold mt-2 text-slate-800 dark:text-slate-100">
                        Tech Product Launch
                      </h3>
                    </div>
                    <span className="text-emerald-500 font-bold text-sm sm:text-base">
                      1,500 cUSD
                    </span>
                  </div>
                  <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                    <div className="flex items-center text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                      <CheckCircle
                        size={14}
                        className="text-emerald-500 mr-2 flex-shrink-0"
                      />
                      <span>10+ influencers needed</span>
                    </div>
                    <div className="flex items-center text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                      <CheckCircle
                        size={14}
                        className="text-emerald-500 mr-2 flex-shrink-0"
                      />
                      <span>Tech audience focus</span>
                    </div>
                  </div>
                  <button className="w-full bg-emerald-500 text-white py-2 px-4 rounded-lg hover:bg-emerald-600 transition flex items-center justify-center text-sm sm:text-base">
                    Apply Now
                  </button>
                </div>

                {/* Campaign 2 - Partial View */}
                <div className="bg-slate-100 dark:bg-slate-700/40 rounded-xl p-4 sm:p-6 opacity-70">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="bg-slate-500 text-white text-xs font-bold px-2 py-1 rounded">
                        NEW
                      </span>
                      <h3 className="text-base sm:text-lg font-semibold mt-2 text-slate-800 dark:text-slate-100">
                        Fashion Brand Promo
                      </h3>
                    </div>
                    <span className="text-emerald-500 font-bold text-sm sm:text-base">
                      800 cUSD
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
