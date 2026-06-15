"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface VoiceOrbProps {
  status: 'STANDBY' | 'THINKING' | 'LISTENING' | 'SPEAKING';
  onClick?: () => void;
}

export default function VoiceOrb({ status, onClick }: VoiceOrbProps) {
  return (
    <div
      onClick={onClick}
      className="relative w-12 h-12 flex items-center justify-center cursor-pointer select-none"
      title="Click to interact"
    >
      {/* STANDBY — gentle pulse ring */}
      {status === 'STANDBY' && (
        <motion.div
          className="w-full h-full rounded-full bg-[#1C1C1C] border border-[#2A2A2A]"
          animate={{ scale: [1, 1.04, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* LISTENING — expanding ring */}
      {status === 'LISTENING' && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full border border-blue-400"
            initial={{ scale: 0.9, opacity: 0.7 }}
            animate={{ scale: 1.7, opacity: 0 }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeOut" }}
          />
          <div className="w-full h-full rounded-full bg-blue-500/15 border border-blue-400/30" />
        </>
      )}

      {/* THINKING — spinning arc */}
      {status === 'THINKING' && (
        <svg
          className="w-full h-full animate-spin"
          style={{ animationDuration: '1.1s' }}
          viewBox="0 0 40 40"
        >
          <circle
            cx="20" cy="20" r="16"
            stroke="#6366f1"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="55 30"
            opacity="0.8"
          />
        </svg>
      )}

      {/* SPEAKING — simple waveform bars */}
      {status === 'SPEAKING' && (
        <div className="flex items-center gap-0.5 px-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={cn(
                "w-0.5 rounded-full bg-indigo-400",
                i === 0 && "animate-speaking-bar-1 h-2",
                i === 1 && "animate-speaking-bar-2 h-4",
                i === 2 && "animate-speaking-bar-3 h-5",
                i === 3 && "animate-speaking-bar-4 h-3",
                i === 4 && "animate-speaking-bar-5 h-2",
              )}
            />
          ))}
        </div>
      )}

      {/* Center dot (for standby only) */}
      {status === 'STANDBY' && (
        <div className="absolute h-2 w-2 rounded-full bg-[#616161]" />
      )}
    </div>
  );
}
