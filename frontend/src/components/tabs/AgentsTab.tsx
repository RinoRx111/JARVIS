"use client";

import React, { useState } from 'react';
import { Play } from 'lucide-react';
import clsx from 'clsx';
import HolographicPanel from '../HolographicPanel';
import { useJarvisStore } from '../../hooks/useJarvisStore';

export default function AgentsTab() {
  const store = useJarvisStore();
  const [agentTitle, setAgentTitle] = useState('');
  const [agentDesc, setAgentDesc] = useState('');

  const handleCreateAgentTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentTitle.trim()) return;
    store.createAgentTask(agentTitle, agentDesc);
    setAgentTitle('');
    setAgentDesc('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Create task triggers */}
      <div className="space-y-6">
        <HolographicPanel title="Queue Cogitive Task" tag="AGENT_PLANNER">
          <form onSubmit={handleCreateAgentTask} className="space-y-4">
            <div>
              <label className="block text-[10px] text-cyan-400/60 uppercase tracking-widest mb-1">Task Title / Query</label>
              <input
                type="text"
                placeholder="Fetch recent tech news and log summary..."
                value={agentTitle}
                onChange={(e) => setAgentTitle(e.target.value)}
                className="w-full bg-slate-950/80 border border-cyan-500/20 rounded px-3 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] text-cyan-400/60 uppercase tracking-widest mb-1">Detailed Context / Directives</label>
              <textarea
                placeholder="Check hacker news home layout, summarize top 3 posts, and save key findings to database memories."
                rows={4}
                value={agentDesc}
                onChange={(e) => setAgentDesc(e.target.value)}
                className="w-full bg-slate-950/80 border border-cyan-500/20 rounded px-3 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 py-2 rounded font-bold uppercase tracking-wider hover:bg-cyan-500/30 transition-all flex items-center justify-center space-x-2"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Dispatch Agent</span>
            </button>
          </form>
        </HolographicPanel>
        
        <HolographicPanel title="Active Cognitive Core" tag="LANGGRAPH_AGENTS">
          <div className="space-y-3 font-mono-digital text-[10px] text-cyan-300">
            <div className="flex justify-between border-b border-white/5 pb-1">
              <span className="text-white/40">Orchestrator Node:</span>
              <span className="text-emerald-400 font-bold">ACTIVE</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-1">
              <span className="text-white/40">ResearchAgent:</span>
              <span className="text-emerald-400 font-bold">READY</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-1">
              <span className="text-white/40">BrowserController:</span>
              <span className="text-cyan-400">PLAYWRIGHT_UP</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Tool Box Registry:</span>
              <span className="text-cyan-400">12 TOOLS LOADED</span>
            </div>
          </div>
        </HolographicPanel>
      </div>

      {/* Timeline logs of agent executions */}
      <div className="lg:col-span-2">
        <HolographicPanel title="Agent Executions & Audit Trails" tag="LANGGRAPH_AUDITS">
          <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
            {store.auditLogs.length === 0 ? (
              <div className="text-white/20 italic text-center py-24">No tool calls or audits logged.</div>
            ) : (
              store.auditLogs.map((log) => (
                <div key={log.id} className="border border-cyan-500/15 bg-slate-900/30 p-3.5 rounded-lg space-y-2.5">
                  <div className="flex justify-between items-center text-[10px] border-b border-white/5 pb-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-cyan-400 uppercase tracking-wider">{log.agent_name || 'Agent'}</span>
                      <span className="text-white/20">&gt;</span>
                      <span className="text-white/60 font-mono">{log.action}</span>
                    </div>
                    <span className={clsx("text-[8px] font-bold px-1.5 py-0.2 rounded uppercase", {
                      'bg-emerald-950 text-emerald-400 border border-emerald-500/30': log.status === 'success',
                      'bg-red-950 text-red-400 border border-red-500/30': log.status === 'failure',
                      'bg-amber-950 text-amber-400 border border-amber-500/30 animate-pulse': log.status === 'pending_user_consent'
                    })}>
                      {log.status}
                    </span>
                  </div>
                  {log.parameters && (
                    <div>
                      <span className="text-[9px] text-white/30 block mb-0.5">Parameters:</span>
                      <pre className="text-[10px] text-amber-200/80 bg-black/40 rounded p-1.5 overflow-x-auto whitespace-pre-wrap">{log.parameters}</pre>
                    </div>
                  )}
                  {log.response && (
                    <div>
                      <span className="text-[9px] text-white/30 block mb-0.5">Response:</span>
                      <pre className="text-[10px] text-cyan-300/80 bg-black/40 rounded p-1.5 overflow-x-auto whitespace-pre-wrap">{log.response}</pre>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </HolographicPanel>
      </div>
    </div>
  );
}
