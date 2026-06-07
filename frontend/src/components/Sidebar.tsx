import React from 'react';
import { Cpu, Terminal, Bot, Globe, Database, Mail, Calendar, Settings } from 'lucide-react';
import clsx from 'clsx';
import { useJarvisStore } from '../hooks/useJarvisStore';

const TABS = [
  { id: 'dashboard', label: 'Systems Status', icon: Cpu },
  { id: 'chat', label: 'Conversational HUD', icon: Terminal },
  { id: 'agents', label: 'Agent Workspace', icon: Bot },
  { id: 'browser', label: 'Virtual Browser', icon: Globe },
  { id: 'memory', label: 'Cognitive Center', icon: Database },
  { id: 'gmail', label: 'Gmail Center', icon: Mail },
  { id: 'calendar', label: 'Calendar Hub', icon: Calendar },
  { id: 'settings', label: 'Core Configs', icon: Settings }
] as const;

export default function Sidebar() {
  const store = useJarvisStore();

  return (
    <aside className="w-18 md:w-56 border-r border-cyan-500/15 bg-slate-950/50 p-3 flex flex-col justify-between z-30 select-none">
      <div className="space-y-1">
        <div className="text-[9px] text-cyan-500/40 uppercase tracking-widest mb-3 hidden md:block px-2">Console Subsystems</div>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = store.activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => store.setActiveTab(tab.id as any)}
              className={clsx(
                'w-full flex items-center p-2.5 rounded transition-all duration-300 border',
                isActive 
                  ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 font-bold shadow-[inset_0_0_8px_rgba(0,243,255,0.08)]' 
                  : 'border-transparent hover:bg-cyan-950/15 text-cyan-500/60 hover:text-cyan-400'
              )}
            >
              <Icon className={clsx("w-4 h-4", isActive ? "text-cyan-400 animate-pulse" : "")} />
              <span className="ml-3 hidden md:inline text-xs uppercase tracking-wider">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Quick HUD Metrics */}
      <div className="hidden md:block border-t border-cyan-500/10 pt-4 space-y-3 font-mono-digital text-[9px] text-cyan-500/50">
        <div>
          <div className="flex justify-between mb-1">
            <span>MEM_FACTS:</span>
            <span className="text-cyan-400">{store.memories.length}</span>
          </div>
          <div className="w-full bg-slate-900 h-1 rounded overflow-hidden">
            <div className="bg-cyan-500 h-full" style={{ width: `${Math.min(store.memories.length * 10, 100)}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span>BG_TASKS:</span>
            <span className="text-cyan-400">
              {store.agentTasks.filter(t => t.status === 'running').length} RUNNING
            </span>
          </div>
          <div className="w-full bg-slate-900 h-1 rounded overflow-hidden">
            <div 
              className="bg-amber-500 h-full animate-pulse" 
              style={{ width: store.agentTasks.length > 0 ? `${(store.agentTasks.filter(t => t.status === 'completed').length / store.agentTasks.length) * 100}%` : '0%' }} 
            />
          </div>
        </div>
        <div className="text-[8px] text-center border border-cyan-500/10 p-1.5 bg-cyan-950/10 rounded uppercase">
          GRID VER: 1.0.0 (SECURE)
        </div>
      </div>
    </aside>
  );
}
