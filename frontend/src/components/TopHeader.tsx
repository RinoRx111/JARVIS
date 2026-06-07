import React from 'react';
import { User, Clock } from 'lucide-react';
import clsx from 'clsx';
import { useJarvisStore } from '../hooks/useJarvisStore';

export default function TopHeader({ timeStr }: { timeStr: string }) {
  const store = useJarvisStore();

  return (
    <header className="border-b border-cyan-500/15 bg-slate-950/80 backdrop-filter backdrop-blur-md px-6 py-3.5 flex justify-between items-center z-40 relative">
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,243,255,0.7)] animate-pulse" />
          <h1 className="text-xl font-black font-orbitron tracking-widest text-neon-cyan select-none">JARVIS OS</h1>
        </div>
        <span className="text-white/20">|</span>
        <div className="flex items-center space-x-2 bg-cyan-950/35 border border-cyan-500/25 px-2.5 py-0.5 rounded-full">
          <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider">CORE: {store.coreStatus}</span>
        </div>
      </div>

      <div className="hidden md:flex items-center space-x-6 text-[10px] text-cyan-500/60">
        <div className="flex space-x-2">
          <span>CPU:</span>
          <span className="text-cyan-400 font-bold">{store.cpuUsage}%</span>
        </div>
        <div className="flex space-x-2">
          <span>RAM:</span>
          <span className="text-cyan-400 font-bold">{store.ramUsage}%</span>
        </div>
        <div className="flex space-x-2">
          <span>UPLINK:</span>
          <span className={store.wsConnected ? "text-emerald-400 font-bold animate-pulse" : "text-amber-500"}>
            {store.wsConnected ? "ACTIVE" : "STANDBY"}
          </span>
        </div>
        <div className="flex space-x-1.5 items-center">
          <Clock className="w-3.5 h-3.5 text-cyan-500/40" />
          <span className="text-cyan-300 select-none">{timeStr}</span>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1">
          <User className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[10px] text-cyan-200 select-all uppercase tracking-wider">{store.user?.email.split('@')[0]}</span>
          <span className="text-[8px] bg-cyan-950 border border-cyan-500/30 text-cyan-400 px-1 py-0.2 rounded font-bold uppercase tracking-widest">
            {store.user?.role}
          </span>
        </div>
      </div>
    </header>
  );
}
