import React, { useEffect, useState } from 'react';
import clsx from 'clsx';

interface VoiceOrbProps {
  status: 'STANDBY' | 'THINKING' | 'LISTENING' | 'SPEAKING';
  onClick?: () => void;
  isWebSocket?: boolean;
}

export default function VoiceOrb({ status, onClick, isWebSocket }: VoiceOrbProps) {
  const [rotation, setRotation] = useState(0);

  // Generate continuous rotation values for concentric rings when thinking
  useEffect(() => {
    let animationFrameId: number;
    const animate = () => {
      setRotation((prev) => (prev + 1.2) % 360);
      animationFrameId = requestAnimationFrame(animate);
    };

    if (status === 'THINKING') {
      animationFrameId = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(animationFrameId);
  }, [status]);

  // Visual highlights based on active core state
  const glowColor = clsx({
    'rgba(0, 243, 255, 0.45)': status === 'STANDBY',
    'rgba(255, 170, 0, 0.6)': status === 'THINKING',
    'rgba(0, 255, 136, 0.65)': status === 'LISTENING',
    'rgba(255, 0, 85, 0.65)': status === 'SPEAKING',
  });

  return (
    <div
      onClick={onClick}
      className="flex flex-col items-center justify-center p-6 relative select-none cursor-pointer"
    >
      <div
        className="w-64 h-64 flex items-center justify-center relative rounded-full transition-all duration-500"
        style={{
          boxShadow: `inset 0 0 30px ${glowColor}, 0 0 40px ${glowColor.replace('0.6', '0.1')}`,
          background: 'radial-gradient(circle, rgba(10,25,50,0.4) 0%, rgba(3,8,20,0.8) 70%)',
        }}
      >
        {/* Glow rings */}
        <div className="absolute inset-0 rounded-full border border-white/5 pointer-events-none" />

        {/* Concentric SVG HUD */}
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full absolute inset-0 pointer-events-none overflow-visible"
        >
          {/* Outer Ring */}
          <circle
            cx="100"
            cy="100"
            r="92"
            fill="none"
            stroke="rgba(0, 243, 255, 0.15)"
            strokeWidth="1"
            strokeDasharray="6 4"
            className={clsx({ 'animate-spin': status === 'STANDBY' })}
            style={{ animationDuration: '40s' }}
          />

          {/* Core Status specific rings */}
          {status === 'THINKING' ? (
            <>
              {/* Outer spin rings */}
              <circle
                cx="100"
                cy="100"
                r="84"
                fill="none"
                stroke="rgb(var(--neon-amber))"
                strokeWidth="2"
                strokeDasharray="80 30 10 30"
                style={{ transform: `rotate(${rotation}deg)`, transformOrigin: 'center' }}
              />
              <circle
                cx="100"
                cy="100"
                r="78"
                fill="none"
                stroke="rgba(var(--neon-amber), 0.5)"
                strokeWidth="1.5"
                strokeDasharray="40 10 50 15"
                style={{ transform: `rotate(${-rotation * 1.5}deg)`, transformOrigin: 'center' }}
              />
              <circle
                cx="100"
                cy="100"
                r="70"
                fill="none"
                stroke="rgb(var(--neon-amber))"
                strokeWidth="1"
                strokeDasharray="5 5"
                style={{ transform: `rotate(${rotation * 2}deg)`, transformOrigin: 'center' }}
              />
            </>
          ) : status === 'LISTENING' ? (
            <>
              {/* Expanding circular waves */}
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="rgb(var(--neon-green))"
                strokeWidth="2.5"
                className="animate-ping"
                style={{ animationDuration: '2s' }}
              />
              <circle
                cx="100"
                cy="100"
                r="65"
                fill="none"
                stroke="rgba(var(--neon-green), 0.5)"
                strokeWidth="1.5"
                className="animate-pulse"
                style={{ animationDuration: '1.2s' }}
              />
              {/* Target compass locks */}
              <path
                d="M 100 15 L 100 25 M 100 175 L 100 185 M 15 100 L 25 100 M 175 100 L 185 100"
                stroke="rgb(var(--neon-green))"
                strokeWidth="2"
              />
            </>
          ) : status === 'SPEAKING' ? (
            <>
              {/* Active vibrating circles */}
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="rgb(var(--neon-red))"
                strokeWidth="2"
                strokeDasharray="6 30 12 10"
                className="animate-spin"
                style={{ animationDuration: '10s' }}
              />
              <circle
                cx="100"
                cy="100"
                r="75"
                fill="none"
                stroke="rgba(var(--neon-red), 0.4)"
                strokeWidth="1"
                className="animate-pulse"
              />
              {/* Dynamic Equalizer Bar Rings */}
              {[...Array(16)].map((_, i) => {
                const angle = (i * 360) / 16;
                const radians = (angle * Math.PI) / 180;
                const rStart = 45;
                // Generate random bar height for voice frequency simulation
                const height = 12 + Math.floor(Math.sin((i + rotation) * 0.5) * 10);
                const x1 = 100 + rStart * Math.cos(radians);
                const y1 = 100 + rStart * Math.sin(radians);
                const x2 = 100 + (rStart + height) * Math.cos(radians);
                const y2 = 100 + (rStart + height) * Math.sin(radians);
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="rgb(var(--neon-red))"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    opacity="0.85"
                  />
                );
              })}
            </>
          ) : (
            <>
              {/* Standby resting rings */}
              <circle
                cx="100"
                cy="100"
                r="82"
                fill="none"
                stroke="rgba(0, 243, 255, 0.4)"
                strokeWidth="2"
                strokeDasharray="120 40 20 40"
                className="animate-spin"
                style={{ animationDuration: '25s' }}
              />
              <circle
                cx="100"
                cy="100"
                r="74"
                fill="none"
                stroke="rgba(0, 243, 255, 0.2)"
                strokeWidth="1"
                strokeDasharray="50 150"
                className="animate-spin"
                style={{ animationDuration: '15s', animationDirection: 'reverse' }}
              />
            </>
          )}

          {/* Central Reactor Core */}
          <circle
            cx="100"
            cy="100"
            r="35"
            fill="url(#reactorCoreGlow)"
            className={clsx('transition-all duration-300', {
              'animate-pulse': status === 'STANDBY' || status === 'LISTENING',
            })}
          />

          {/* Definitions */}
          <defs>
            <radialGradient id="reactorCoreGlow" cx="50%" cy="50%" r="50%">
              <stop
                offset="0%"
                stopColor={
                  status === 'STANDBY'
                    ? '#00f3ff'
                    : status === 'THINKING'
                    ? '#ffaa00'
                    : status === 'LISTENING'
                    ? '#00ff88'
                    : '#ff0055'
                }
                stopOpacity="1"
              />
              <stop
                offset="60%"
                stopColor={
                  status === 'STANDBY'
                    ? 'rgba(0, 243, 255, 0.5)'
                    : status === 'THINKING'
                    ? 'rgba(255, 170, 0, 0.5)'
                    : status === 'LISTENING'
                    ? 'rgba(0, 255, 136, 0.5)'
                    : 'rgba(255, 0, 85, 0.5)'
                }
                stopOpacity="0.6"
              />
              <stop offset="100%" stopColor="#030814" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>

        {/* Central visual text label */}
        <div className="flex flex-col items-center justify-center font-mono-digital z-10 pointer-events-none">
          <span
            className={clsx('text-[10px] uppercase tracking-[0.25em]', {
              'text-cyan-400': status === 'STANDBY',
              'text-amber-400': status === 'THINKING',
              'text-emerald-400': status === 'LISTENING',
              'text-rose-500 font-bold': status === 'SPEAKING',
            })}
          >
            {status}
          </span>
          <span className="text-[9px] text-white/30 tracking-widest mt-1">
            {isWebSocket ? 'WS_LIVE' : 'REST_API'}
          </span>
        </div>
      </div>

      <p className="text-xs font-mono-digital text-white/55 mt-6 tracking-widest uppercase">
        {status === 'STANDBY' && 'System standby. Click core to synthesize.'}
        {status === 'THINKING' && 'Processing cognitive graphs...'}
        {status === 'LISTENING' && 'Streaming voice buffer input...'}
        {status === 'SPEAKING' && 'Synthesizing voice response...'}
      </p>
    </div>
  );
}
