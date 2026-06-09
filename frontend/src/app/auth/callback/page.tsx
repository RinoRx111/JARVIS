"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useJarvisStore } from '@/hooks/useJarvisStore';
import { Loader2 } from 'lucide-react';
import api from '@/services/api';

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const store = useJarvisStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    
    if (!code) {
      setError("No authorization code found in URL.");
      return;
    }

    const processOAuth = async () => {
      try {
        const res = await api.post('/auth/google/callback', { code });
        const data = res.data;
        // Store access and refresh tokens in Zustand and LocalStorage
        store.setToken(data.access_token, data.refresh_token);
        // Fetch user details immediately to verify login
        await store.checkAuth();
        // Redirect to the main chat interface
        router.push('/');
      } catch (err: any) {
        setError(err.response?.data?.detail || "Google authentication failed or communication error occurred.");
      }
    };

    processOAuth();
  }, [searchParams, router, store]);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="p-8 border border-destructive/30 bg-destructive/10 rounded-xl text-center">
          <h2 className="text-destructive font-bold mb-2">Authentication Error</h2>
          <p className="text-white/80 text-sm mb-4">{error}</p>
          <button 
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen items-center justify-center bg-black">
      <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
      <h2 className="text-xl font-bold text-white tracking-widest">SYNCHRONIZING WORKSPACE</h2>
      <p className="text-primary/70 text-sm mt-2">Authenticating credentials with Google...</p>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="flex flex-col h-screen items-center justify-center bg-black">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <h2 className="text-xl font-bold text-white tracking-widest">LOADING AUTHENTICATOR</h2>
      </div>
    }>
      <AuthCallbackInner />
    </Suspense>
  );
}
