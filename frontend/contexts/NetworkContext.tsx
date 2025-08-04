'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { celo, base } from 'wagmi/chains';
import { NETWORK_CONFIG, getNetworkConfig } from '@/lib/networks';

export type SupportedNetworkType = 'celo' | 'base';

interface NetworkContextType {
  selectedNetwork: SupportedNetworkType;
  selectedChainId: number;
  networkConfig: typeof NETWORK_CONFIG[keyof typeof NETWORK_CONFIG];
  setSelectedNetwork: (network: SupportedNetworkType) => void;
  isBaseNetwork: boolean;
  isCeloNetwork: boolean;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

interface NetworkProviderProps {
  children: ReactNode;
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  const [selectedNetwork, setSelectedNetworkState] = useState<SupportedNetworkType>('celo');

  // Get chain ID based on selected network
  const selectedChainId = selectedNetwork === 'celo' ? celo.id : base.id;
  const networkConfig = getNetworkConfig(selectedChainId);

  const setSelectedNetwork = (network: SupportedNetworkType) => {
    setSelectedNetworkState(network);
    // Store preference in localStorage
    localStorage.setItem('ads-bazaar-network', network);
  };

  // Load saved network preference on mount
  useEffect(() => {
    const savedNetwork = localStorage.getItem('ads-bazaar-network') as SupportedNetworkType;
    if (savedNetwork && (savedNetwork === 'celo' || savedNetwork === 'base')) {
      setSelectedNetworkState(savedNetwork);
    }
  }, []);

  const value: NetworkContextType = {
    selectedNetwork,
    selectedChainId,
    networkConfig,
    setSelectedNetwork,
    isBaseNetwork: selectedNetwork === 'base',
    isCeloNetwork: selectedNetwork === 'celo',
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};