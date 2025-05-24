"use client";
import { useState } from "react";
import HeroSection from "@/components/landingPage/hero-section";
import GetStartedModal from "@/components/modals/GetStartedModal";
import Head from "next/head";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div>
      <Head>
        <meta
          name="fc:frame"
          content='{
      "version": "next",
      "imageUrl": "https://ads-bazaar.vercel.app/adsBazaar-heroPage.png",
      "button":{
        "title": "AdsBazaar",
        "action": {
          "type": "launch_frame",
          "name": "Ads-Bazaar",
          "url": "https://ads-bazaar.vercel.app/",
          "splashImageUrl": "https://ads-bazaar.vercel.app/adsBazaar-logo.png",
          "splashBackgroundColor": "#059669"
        }
      }
    }'
          data-rh="true"
        ></meta>
      </Head>
      <HeroSection setIsModalOpen={setIsModalOpen} />

      {/* Modal */}
      {isModalOpen && (
        <GetStartedModal isOpen={isModalOpen} onClose={closeModal} />
      )}
    </div>
  );
}
