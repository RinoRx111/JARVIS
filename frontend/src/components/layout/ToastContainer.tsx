"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJarvisStore } from '@/hooks/useJarvisStore';
import { X } from 'lucide-react';

export function ToastContainer() {
  const toasts = useJarvisStore((s) => s.activeToasts);
  const removeToast = useJarvisStore((s) => s.removeToast);

  return (
    <div className="fixed bottom-6 right-5 z-[100] flex flex-col gap-2 pointer-events-none w-72">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="pointer-events-auto w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl px-4 py-3 flex items-start gap-3 shadow-xl select-none"
          >
            {/* Accent bar */}
            <div className="h-full w-0.5 bg-indigo-500 rounded-full shrink-0 self-stretch" />
            <p className="flex-1 text-[12.5px] text-[#EDEDED] leading-snug break-words">
              {toast.message}
            </p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#616161] hover:text-[#EDEDED] transition-colors shrink-0 p-0.5 -mr-1 mt-0.5"
            >
              <X size={13} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
