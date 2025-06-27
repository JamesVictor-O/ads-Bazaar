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
  } = useSignIn({
    nonce: undefined,
    timeout: 120000, // 2 minutes timeout
    onError: (error) => {
      console.error('useSignIn error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error?.message || 'Authentication failed',
      }));
    },
    onSuccess: (data) => {
      console.log('useSignIn success:', data);
    }
  });

  // Log all state changes from useSignIn hook
  useEffect(() => {
    console.log('useSignIn state update:', {
      isSuccess,
      isError,
      channelToken,
      url,
      data,
      validSignature
    });
  }, [isSuccess, isError, channelToken, url, data, validSignature]);

  const handleSignIn = useCallback(() => {
    console.log('Starting Farcaster sign-in process...');
    console.log('signIn function:', signIn);
    console.log('signIn type:', typeof signIn);
    
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = signIn();
      console.log('SignIn result:', result);
      console.log('SignIn initiated');
      
      // Check if signIn is actually a function
      if (typeof signIn !== 'function') {
        console.error('signIn is not a function!');
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: 'SignIn function not available',
        }));
        return;
      }
      
      // Set a timeout to reset loading state if no response comes
      setTimeout(() => {
        setAuthState(prev => {
          if (prev.isLoading && !prev.isAuthenticated) {
            console.log('Resetting loading state after timeout - no response from auth-kit');
            return { ...prev, isLoading: false, error: 'No response from Farcaster auth service' };
          }
          return prev;
        });
      }, 5000); // 5 second timeout
    } catch (error) {
      console.error('SignIn error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      }));
    }
  }, [signIn]);

  // Handle authentication state changes
  useEffect(() => {
    console.log('Auth state change:', { isSuccess, data, validSignature, isError });
    
    if (isSuccess && data && validSignature) {
      console.log('Authentication successful, updating state');
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
    } else if (isError) {
      console.log('Authentication error detected');
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Authentication failed',
      }));
    }
  }, [isSuccess, data, validSignature, isError]);

  const handleConnect = useCallback(async () => {
    console.log('Attempting to connect with channelToken:', channelToken);
    if (channelToken) {
      try {
        await connect();
        console.log('Connect successful');
      } catch (error) {
        console.error('Connect error:', error);
        setAuthState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Connection failed',
        }));
      }
    } else {
      console.warn('No channelToken available for connection');
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
    error: authState.error || (isError ? 'Authentication failed' : null),
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