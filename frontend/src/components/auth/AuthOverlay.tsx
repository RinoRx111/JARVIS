"use client";

import React from 'react';
import { SignIn, useUser } from '@clerk/nextjs';
import { Loader2 } from 'lucide-react';
import { dark } from '@clerk/themes';

export function AuthOverlay() {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#070707] text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-cyan-400" />
          <p className="text-sm font-medium tracking-wider text-neutral-400 uppercase">
            Loading Jarvis Core...
          </p>
        </div>
      </div>
    );
  }

  if (isSignedIn) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#070707]/90 backdrop-blur-xl">
      <div className="relative w-full max-w-md p-6 flex flex-col items-center">
        {/* Decorative background glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl -z-10" />
        <div className="absolute top-1/3 left-1/4 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl -z-10" />
        
        <div className="mb-8 text-center select-none">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-teal-400 to-indigo-500 bg-clip-text text-transparent">
            JARVIS
          </h1>
          <p className="text-xs font-semibold text-cyan-400/80 tracking-[0.2em] uppercase mt-2">
            AI Operating System
          </p>
        </div>
        
        <SignIn 
          routing="hash"
          appearance={{
            baseTheme: dark,
            variables: {
              colorPrimary: '#06b6d4',
              colorBackground: '#121212',
              colorInputBackground: '#1e1e1e',
              colorInputText: '#ffffff',
              colorText: '#ffffff',
              colorTextSecondary: '#a3a3a3',
            },
            elements: {
              card: 'bg-[#121212] border border-neutral-800 shadow-2xl rounded-2xl',
              headerTitle: 'hidden',
              headerSubtitle: 'hidden',
              footerActionLink: 'text-cyan-400 hover:text-cyan-300',
              formButtonPrimary: 'bg-cyan-500 hover:bg-cyan-600 text-black font-semibold',
            }
          }}
        />
      </div>
    </div>
  );
}
