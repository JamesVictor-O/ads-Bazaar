"use client";
import { useState } from "react";
import HeroSection from "@/components/landingPage/hero-section";
import GetStartedModal from "@/components/modals/GetStartedModal";
export default function Home() {


  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const closeModal = () => {
    setIsModalOpen(false);
  };

 

  return (
   <div>
     <HeroSection setIsModalOpen={setIsModalOpen}/>

      {/* Modal */}
      {isModalOpen && (
        <GetStartedModal isOpen={isModalOpen} onClose={closeModal} />
      )}
   </div>
  );
}
