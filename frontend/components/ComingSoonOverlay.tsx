'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, ArrowLeft } from 'lucide-react';
import { useNetwork } from '@/contexts/NetworkContext';

interface ComingSoonOverlayProps {
  children: React.ReactNode;
}

export const ComingSoonOverlay: React.FC<ComingSoonOverlayProps> = ({ children }) => {
  const { isBaseNetwork, setSelectedNetwork } = useNetwork();

  if (!isBaseNetwork) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Blurred background content */}
      <div className="filter blur-sm pointer-events-none opacity-30">
        {children}
      </div>

      {/* Coming Soon Overlay */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm"
      >
        <div className="max-w-md mx-auto p-8 text-center">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-2xl">
              <Clock className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-4">
              Base Network
            </h2>
            
            <p className="text-lg text-slate-300 mb-6">
              Coming Soon
            </p>
            
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              We're working hard to bring AdsBazaar to Base network with USDC and DEGEN token support. 
              Stay tuned for updates!
            </p>
          </motion.div>

          <motion.button
            onClick={() => setSelectedNetwork('celo')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors shadow-lg"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Celo
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};