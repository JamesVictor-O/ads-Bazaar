// frontend/hooks/useFarcasterAuth.ts
import { useState, useCallback, useEffect } from 'react';
import { AuthKitProvider, useSignIn, StatusAPIResponse } from '@farcaster/auth-kit';

export interface FarcasterAuthState {
  isAuthenticated: boolean;
  user: {
    fid: number;
    username: string;
    displayName: string;
    pfpUrl: string;
    bio: string;
  } | null;
  isLoading: boolean;
  error: string | null;
}

export function useFarcasterAuth() {
  const [authState, setAuthState] = useState<FarcasterAuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: false,
    error: null,
  });

  const {
    signIn,
    connect,
    reconnect,
    isSuccess,
    isError,
    channelToken,
    url,
    data,
    validSignature,
  } = useSignIn({});

  const handleSignIn = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await signIn();
      setAuthState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      }));
    }
  }, [signIn]);

  // Handle authentication state changes
  useEffect(() => {
    if (isSuccess && data && validSignature) {
      setAuthState({
        isAuthenticated: true,
        user: {
          fid: data.fid ?? 0,
          username: data.username ?? '',
          displayName: data.displayName ?? '',
          pfpUrl: data.pfpUrl ?? '',
          bio: data.bio ?? '',
        },
        isLoading: false,
        error: null,
      });
    }
  }, [isSuccess, data, validSignature]);

  const handleConnect = useCallback(async () => {
    if (channelToken) {
      await connect();
    }
  }, [connect, channelToken]);

  const signOut = useCallback(() => {
    setAuthState({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,
    });
  }, []);

  return {
    isAuthenticated: authState.isAuthenticated,
    user: authState.user,
    isLoading: authState.isLoading,
    error: authState.error,
    signIn: handleSignIn,
    connect: handleConnect,
    reconnect,
    signOut,
    channelToken,
    url,
    validSignature,
    isError,
  };
}