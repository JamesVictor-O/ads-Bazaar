'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Network } from 'lucide-react';
import { useNetwork } from '@/contexts/NetworkContext';

interface NetworkToggleProps {
  className?: string;
}

export const NetworkToggle: React.FC<NetworkToggleProps> = ({ className = '' }) => {
  const { selectedNetwork, setSelectedNetwork, networkConfig } = useNetwork();
  const [isOpen, setIsOpen] = React.useState(false);

  const networks = [
    { id: 'celo' as const, name: 'Celo', color: 'bg-green-500', available: true },
    { id: 'base' as const, name: 'Base', color: 'bg-blue-500', available: false },
  ];

  return (
    <div className={`relative ${className}`}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg border border-slate-600/30 transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Network className="w-4 h-4 text-slate-300" />
        <span className="text-sm font-medium text-white">
          {networks.find(n => n.id === selectedNetwork)?.name}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </motion.div>
      </motion.button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 right-0 bg-slate-800 border border-slate-600/30 rounded-lg shadow-xl z-20 min-w-[180px]"
          >
            {networks.map((network) => (
              <button
                key={network.id}
                onClick={() => {
                  if (network.available) {
                    setSelectedNetwork(network.id);
                  }
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-700/50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                  selectedNetwork === network.id ? 'bg-slate-700/30' : ''
                } ${!network.available ? 'opacity-60 cursor-not-allowed' : ''}`}
                disabled={!network.available}
              >
                <div className={`w-3 h-3 rounded-full ${network.color}`} />
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">
                    {network.name}
                  </div>
                  {!network.available && (
                    <div className="text-xs text-slate-400 mt-1">
                      Coming Soon
                    </div>
                  )}
                </div>
                {selectedNetwork === network.id && (
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                )}
              </button>
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
};