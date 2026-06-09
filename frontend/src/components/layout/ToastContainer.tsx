"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJarvisStore } from '@/hooks/useJarvisStore';
import { Info, X } from 'lucide-react';

export function ToastContainer() {
  const toasts = useJarvisStore((state) => state.activeToasts);
  const removeToast = useJarvisStore((state) => state.removeToast);

  return (
    <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none w-80">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, x: 100, y: -20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="pointer-events-auto w-full glass-card p-4 rounded-xl flex items-start gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition-all select-none"
          >
            <div className="text-[#00C2FF] mt-0.5 shrink-0">
              <Info size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono uppercase tracking-widest text-[#6B7F8E] mb-1 font-bold">SYSTEM ALERT</p>
              <p className="text-sm text-[#E8EDF2] leading-tight break-words">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#6B7F8E] hover:text-[#00C2FF] transition-colors shrink-0 p-0.5"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
