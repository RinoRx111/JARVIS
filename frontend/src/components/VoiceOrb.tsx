"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface VoiceOrbProps {
  status: 'STANDBY' | 'THINKING' | 'LISTENING' | 'SPEAKING';
  onClick?: () => void;
}

export default function VoiceOrb({ status, onClick }: VoiceOrbProps) {
  return (
    <div 
      onClick={onClick}
      className="relative w-20 h-20 flex items-center justify-center cursor-pointer select-none group"
      title="Click to interact"
    >
      {/* 1. Idle state (STANDBY) */}
      {status === 'STANDBY' && (
        <motion.div 
          className="w-full h-full rounded-full bg-[#00C2FF]/20 border border-[#00C2FF]/30 shadow-[0_0_15px_rgba(0,194,255,0.1)]"
          animate={{
            scale: [1, 1.06, 1],
            opacity: [0.7, 0.9, 0.7]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}

      {/* 2. Listening state (LISTENING) */}
      {status === 'LISTENING' && (
        <>
          {/* Expanding Ring */}
          <motion.div 
            className="absolute inset-0 rounded-full border-2 border-[#00C2FF]"
            initial={{ scale: 0.8, opacity: 0.8 }}
            animate={{ scale: 1.6, opacity: 0 }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeOut"
            }}
          />
          {/* Inner core pulsing faster */}
          <motion.div 
            className="w-full h-full rounded-full bg-[#00C2FF]/40 border border-[#00C2FF]"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.8, 1, 0.8]
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </>
      )}

      {/* 3. Thinking state (THINKING) */}
      {status === 'THINKING' && (
        <svg className="w-full h-full animate-spin" style={{ animationDuration: '1.2s' }} viewBox="0 0 100 100">
          <defs>
            <linearGradient id="thinkingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7B61FF" />
              <stop offset="100%" stopColor="#00C2FF" />
            </linearGradient>
          </defs>
          <circle 
            cx="50" 
            cy="50" 
            r="42" 
            stroke="url(#thinkingGradient)" 
            strokeWidth="4" 
            fill="none" 
            strokeLinecap="round"
            strokeDasharray="160 80"
          />
        </svg>
      )}

      {/* 4. Speaking state (SPEAKING) */}
      {status === 'SPEAKING' && (
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="20" fill="none" stroke="#00C2FF" strokeWidth="2" className="animate-pulse" />
          {/* Radial Waveform Bars */}
          {[...Array(12)].map((_, i) => {
            const angle = (i * 360) / 12;
            const radians = (angle * Math.PI) / 180;
            const cos = Math.cos(radians);
            const sin = Math.sin(radians);
            
            return (
              <motion.line
                key={i}
                x1={50 + 22 * cos}
                y1={50 + 22 * sin}
                stroke="#00C2FF"
                strokeWidth="3.5"
                strokeLinecap="round"
                animate={{
                  x2: [50 + 26 * cos, 50 + (32 + Math.random() * 14) * cos, 50 + 26 * cos],
                  y2: [50 + 26 * sin, 50 + (32 + Math.random() * 14) * sin, 50 + 26 * sin]
                }}
                transition={{
                  duration: 0.5 + (i % 4) * 0.08,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            );
          })}
        </svg>
      )}
    </div>
  );
}
