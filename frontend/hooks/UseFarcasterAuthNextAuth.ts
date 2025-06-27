// frontend/hooks/UseFarcasterAuthNextAuth.ts
import { useState, useCallback, useEffect } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useSignIn } from '@farcaster/auth-kit';

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

  // Use auth-kit for QR generation but NextAuth for session management
  const {
    signIn: authKitSignIn,
    connect: authKitConnect,
    reconnect,
    isSuccess: authKitIsSuccess,
    isError: authKitIsError,
    channelToken,
    url,
    data: authKitData,
    validSignature: authKitValidSignature,
  } = useSignIn({
    nonce: undefined,
    timeout: 120000,
    onError: (error) => {
      console.error('Auth-kit error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error?.message || 'Authentication failed',
      }));
    },
    onSuccess: (data) => {
      console.log('Auth-kit success:', data);
    }
  });

  const handleSignIn = useCallback(() => {
    console.log('Starting NextAuth Farcaster sign-in process...');
    
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      authKitSignIn();
      console.log('Auth-kit signIn initiated');
    } catch (error) {
      console.error('SignIn error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      }));
    }
  }, [authKitSignIn]);

  // Handle auth-kit success and sign in with NextAuth
  useEffect(() => {
    if (authKitIsSuccess && authKitData && authKitValidSignature) {
      console.log('Auth-kit authentication successful, updating state');
      
      setAuthState({
        isAuthenticated: true,
        user: {
          fid: authKitData.fid ?? 0,
          username: authKitData.username ?? '',
          displayName: authKitData.displayName ?? '',
          pfpUrl: authKitData.pfpUrl ?? '',
          bio: authKitData.bio ?? '',
        },
        isLoading: false,
        error: null,
      });
    }
  }, [authKitIsSuccess, authKitData, authKitValidSignature]);

  // Handle auth-kit errors
  useEffect(() => {
    if (authKitIsError) {
      console.log('Auth-kit error detected');
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Authentication failed',
      }));
    }
  }, [authKitIsError]);

  const handleConnect = useCallback(async () => {
    console.log('Attempting to connect with NextAuth...');
    
    if (!authKitData || !authKitValidSignature) {
      console.warn('Missing required data for NextAuth connection');
      try {
        await authKitConnect();
        console.log('Auth-kit connect successful');
      } catch (error) {
        console.error('Auth-kit connect error:', error);
        setAuthState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Connection failed',
        }));
      }
      return;
    }

    try {
      // Sign in with NextAuth using the Farcaster credentials
      const result = await signIn('farcaster', {
        message: 'Farcaster auth', // Placeholder message
        signature: 'placeholder', // Placeholder signature
        name: authState.user?.displayName || authState.user?.username || 'Farcaster User',
        pfp: authState.user?.pfpUrl || '',
        fid: authState.user?.fid?.toString() || '0',
        userType: 'influencer',
        redirect: false,
      });

      console.log('NextAuth signIn result:', result);

      if (result?.ok) {
        console.log('NextAuth connection successful');
        
        // Verify session was created
        const session = await getSession();
        console.log('Session created:', session);
        
        return true;
      } else {
        throw new Error(result?.error || 'NextAuth connection failed');
      }
    } catch (error) {
      console.error('Connect error:', error);
      setAuthState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Connection failed',
      }));
      return false;
    }
  }, [authKitData, authKitValidSignature, authKitConnect, authState.user]);

  const signOut = useCallback(() => {
    setAuthState({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,
    });
  }, []);

  // Maintain the same interface as the original hook
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
    validSignature: authKitValidSignature,
    isError: authKitIsError,
    isSuccess: authKitIsSuccess,
    data: authState.user, // For compatibility with original interface
  };
}