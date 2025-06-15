"use client";
import { useState } from "react";
import { useAccount } from "wagmi";
import HeroSection from "@/components/landingPage/hero-section";
import GetStartedModal from "@/components/modals/GetStartedModal";
import { NetworkStatus } from "@/components/NetworkStatus";
import { useEnsureNetwork } from "@/hooks/useEnsureNetwork";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isConnected } = useAccount();
  const { isCorrectChain } = useEnsureNetwork();

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="relative">
      {isConnected && !isCorrectChain && (
        <div className="fixed top-20 sm:top-28 left-0 right-0 z-40 px-4 sm:px-6 md:px-8">
          <NetworkStatus className="max-w-4xl mx-auto bg-slate-800/95 backdrop-blur-md border-amber-500/50 shadow-lg" />
        </div>
      )}

      <HeroSection setIsModalOpen={setIsModalOpen} />

      {isModalOpen && (
        <GetStartedModal isOpen={isModalOpen} onClose={closeModal} />
      )}
    </div>
  );
}
