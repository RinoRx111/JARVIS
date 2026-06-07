"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJarvisStore } from '@/hooks/useJarvisStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, User as UserIcon, ShieldAlert, Loader2 } from 'lucide-react';

export function AuthOverlay() {
  const store = useJarvisStore();
  const [email, setEmail] = useState('local@jarvis.os');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check setup status on mount
  useEffect(() => {
    store.checkSetupStatus();
    store.checkAuth();
  }, []);

  if (store.authLoading) {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // If already authenticated, do not render overlay
  if (store.token && store.user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    setError('');

    let success = false;
    if (store.needsSetup) {
      success = await store.register(email, password);
    } else {
      success = await store.login(email, password);
    }

    setLoading(false);
    if (!success) {
      setError(store.needsSetup ? 'Registration failed.' : 'Invalid credentials.');
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xl"
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="w-full max-w-md p-8 glass-card border border-white/10 rounded-2xl shadow-2xl relative overflow-hidden"
        >
          {/* Cyberpunk accent lines */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(0,216,255,0.2)]">
              {store.needsSetup ? <ShieldAlert size={32} /> : <Lock size={32} />}
            </div>
          </div>

          <h2 className="text-2xl font-bold text-center text-white mb-2 tracking-wide">
            {store.needsSetup ? 'SYSTEM INITIALIZATION' : 'SECURE LOGIN'}
          </h2>
          <p className="text-sm text-center text-muted-foreground mb-8">
            {store.needsSetup 
              ? 'Set your Master Password to restrict access to this local instance.' 
              : 'Enter your credentials to access the JARVIS network.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive border border-destructive/30 bg-destructive/10 rounded-lg text-center">
                {error}
              </div>
            )}
            
            <div className="space-y-1 relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Admin Email"
                className="pl-10 bg-black/40 border-white/10 focus:border-primary/50 transition-colors"
                disabled={store.needsSetup} // Force local@jarvis.os for setup
                readOnly={store.needsSetup}
              />
            </div>

            <div className="space-y-1 relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={store.needsSetup ? "Enter a strong Master Password" : "Password"}
                className="pl-10 bg-black/40 border-white/10 focus:border-primary/50 transition-colors"
                autoFocus
              />
            </div>

            <Button type="submit" className="w-full mt-6 shadow-[0_0_15px_rgba(0,216,255,0.3)] hover:shadow-[0_0_25px_rgba(0,216,255,0.5)] transition-shadow" disabled={loading}>
              {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
              {store.needsSetup ? 'INITIALIZE SYSTEM' : 'ACCESS GRANTED'}
            </Button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
