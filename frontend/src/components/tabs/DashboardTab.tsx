"use client";

import React from 'react';
import { Cpu, Upload, Sparkles } from 'lucide-react';
import HolographicPanel from '../HolographicPanel';
import { useJarvisStore } from '../../hooks/useJarvisStore';
import clsx from 'clsx';

export default function DashboardTab() {
  const store = useJarvisStore();

  return (
    <div className="space-y-6">
      {/* Digital welcome ticker */}
      <div className="flex items-center space-x-2 bg-cyan-950/20 border border-cyan-500/20 px-4 py-2.5 rounded-lg">
        <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />
        <span className="text-cyan-300 font-bold uppercase tracking-wider">JARVIS MAIN DECISIONS PANEL ACTIVE</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* System load dials */}
        <HolographicPanel title="CPU Diagnostic Analyzer" tag="SYS_LOAD">
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="w-24 h-24 rounded-full border-4 border-dashed border-cyan-400/20 flex items-center justify-center animate-spin">
              <div className="w-16 h-16 rounded-full border border-cyan-400/50 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-cyan-400">{store.cpuUsage}%</span>
              </div>
            </div>
            <div className="w-full space-y-1">
              <div className="flex justify-between text-[10px] text-white/50">
                <span>CORES ALLOCATED:</span>
                <span>8 / 8 THREADS</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                <div className="bg-cyan-400 h-full transition-all duration-500" style={{ width: `${store.cpuUsage}%` }} />
              </div>
            </div>
          </div>
        </HolographicPanel>

        <HolographicPanel title="RAM Memory Allocation" tag="RAM_STABLE">
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="w-24 h-24 rounded-full border-4 border-dashed border-cyan-500/20 flex items-center justify-center animate-spin" style={{ animationDirection: 'reverse' }}>
              <div className="w-16 h-16 rounded-full border border-cyan-500/40 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-cyan-400">{store.ramUsage}%</span>
              </div>
            </div>
            <div className="w-full space-y-1">
              <div className="flex justify-between text-[10px] text-white/50">
                <span>COMMITTED INDEX:</span>
                <span>6.4 GB / 16.0 GB</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                <div className="bg-cyan-400 h-full transition-all duration-500" style={{ width: `${store.ramUsage}%` }} />
              </div>
            </div>
          </div>
        </HolographicPanel>

        {/* Active files drop and list */}
        <HolographicPanel title="Files Storage Index" tag="CHROMA_VECTORS">
          <div className="space-y-4">
            <div className="flex space-x-2">
              <label className="flex-1 bg-cyan-950/20 hover:bg-cyan-950/45 border border-dashed border-cyan-500/30 hover:border-cyan-500/60 rounded px-3 py-4 flex flex-col items-center justify-center cursor-pointer transition-all">
                <Upload className="w-5 h-5 text-cyan-400 animate-bounce mb-1" />
                <span className="text-[10px] text-cyan-300 font-bold uppercase">Load Document File</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) store.uploadFile(file);
                  }}
                />
              </label>
            </div>
            <div className="max-h-28 overflow-y-auto space-y-1.5">
              {store.files.length === 0 ? (
                <p className="text-white/20 italic text-center py-4">No active document vectors tracked.</p>
              ) : (
                store.files.map((file) => (
                  <div key={file.id} className="flex justify-between items-center p-1.5 bg-slate-900/50 rounded border border-cyan-500/10">
                    <span className="text-[10px] text-cyan-300 font-bold truncate max-w-40">{file.filename}</span>
                    <span className={clsx("text-[8px] px-1 py-0.2 rounded font-bold uppercase", {
                      'bg-emerald-950 border border-emerald-500/40 text-emerald-400': file.status === 'completed',
                      'bg-amber-950 border border-amber-500/40 text-amber-400 animate-pulse': file.status === 'processing' || file.status === 'pending',
                      'bg-red-950 border border-red-500/40 text-red-400': file.status === 'failed'
                    })}>
                      {file.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </HolographicPanel>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Real-time floating console notifications logs */}
        <div className="md:col-span-2">
          <HolographicPanel title="Operating System Terminal Logs" tag="TTY_FEED">
            <div className="bg-black/60 rounded border border-cyan-500/10 p-3 h-56 overflow-y-auto font-mono-digital text-[11px] space-y-1.5 text-cyan-300 leading-relaxed shadow-[inset_0_0_15px_rgba(0,0,0,0.5)]">
              {store.notifications.map((log, index) => (
                <div key={index} className="border-b border-white/5 pb-1 select-all hover:bg-cyan-950/10">
                  <span className="text-cyan-500/50 mr-1">&gt;</span>
                  {log}
                </div>
              ))}
            </div>
          </HolographicPanel>
        </div>

        {/* Active tasks scheduler status */}
        <HolographicPanel title="Background Tasks Scheduler" tag="AGENT_JOBS">
          <div className="space-y-3 h-56 overflow-y-auto pr-1">
            {store.agentTasks.length === 0 ? (
              <div className="text-white/20 italic text-center py-12">No active tasks in scheduler.</div>
            ) : (
              store.agentTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="border border-white/5 bg-slate-900/40 p-2.5 rounded hover:border-cyan-500/20 transition-all">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-cyan-300 text-[10px] truncate max-w-32 uppercase">{task.title}</span>
                    <span className={clsx("text-[8px] font-bold px-1.5 py-0.2 rounded uppercase", {
                      'bg-emerald-950 text-emerald-400 border border-emerald-500/30': task.status === 'completed',
                      'bg-amber-950 text-amber-400 border border-amber-500/30 animate-pulse': task.status === 'running',
                      'bg-red-950 text-red-400 border border-red-500/30': task.status === 'failed',
                      'bg-slate-800 text-white/50': task.status === 'pending'
                    })}>
                      {task.status}
                    </span>
                  </div>
                  <span className="text-[9px] text-white/45 truncate block">{task.description || 'No detailed scope.'}</span>
                </div>
              ))
            )}
          </div>
        </HolographicPanel>
      </div>
    </div>
  );
}
