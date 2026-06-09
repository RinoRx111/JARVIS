"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Clock, Database, ChevronRight, ChevronLeft, Terminal, MessageSquare, Plus, Trash2, GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { usePathname } from 'next/navigation';
import { useJarvisStore } from '@/hooks/useJarvisStore';
import { Button } from '@/components/ui/button';

export function ContextPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();
  const store = useJarvisStore();
  const fetchConversations = useJarvisStore((state) => state.fetchConversations);

  useEffect(() => {
    if (pathname === '/') {
      fetchConversations();
    }
  }, [pathname, fetchConversations]);

  // Telemetry loop: fluctuation stats update every 3 seconds
  useEffect(() => {
    store.updateSystemStats();
    const interval = setInterval(() => {
      store.updateSystemStats();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const isChatTab = pathname === '/';

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 320 : 0 }}
      className="h-screen relative flex flex-col border-l border-[#1E2A35] bg-[#0E1318] z-40 overflow-hidden text-[#E8EDF2]"
    >
      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -left-4 top-1/2 -translate-y-1/2 h-16 w-4 bg-[#0E1318] border border-[#1E2A35] rounded-l-md flex items-center justify-center text-[#6B7F8E] hover:text-[#00C2FF] transition-colors shadow-2xl z-50 pointer-events-auto"
      >
        {isOpen ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 w-[320px] flex flex-col overflow-hidden"
          >
            {/* Panel Header */}
            <div className="p-4 border-b border-[#1E2A35] flex items-center gap-2 shrink-0">
              {isChatTab ? (
                <>
                  <MessageSquare size={16} className="text-primary" />
                  <h2 className="text-xs font-mono font-bold tracking-wider text-[#E8EDF2] uppercase">CHAT HISTORY</h2>
                  <Button variant="ghost" size="icon" className="ml-auto h-6 w-6 text-[#6B7F8E] hover:text-[#00C2FF]" onClick={() => store.startNewChat()}>
                    <Plus size={14} />
                  </Button>
                </>
              ) : (
                <>
                  <Activity size={16} className="text-primary" />
                  <h2 className="text-xs font-mono font-bold tracking-wider text-[#E8EDF2] uppercase">SYSTEM CONTEXT</h2>
                  <Badge variant="glass" className="ml-auto text-xs bg-[#00C2FF]/10 text-[#00C2FF] border border-[#00C2FF]/20 px-2 rounded font-mono font-normal">LIVE</Badge>
                </>
              )}
            </div>

            {/* Scrollable primary content */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 custom-scrollbar">
              {isChatTab ? (
                <div className="space-y-2">
                  {store.conversations.length === 0 ? (
                    <div className="text-xs text-[#6B7F8E] text-center mt-4 font-mono uppercase">No previous conversations</div>
                  ) : (
                    store.conversations.map((conv: any) => (
                      <div 
                        key={conv.id}
                        className={cn(
                          "p-3 rounded-lg transition-all border group relative flex items-center justify-between",
                          store.activeConversationId === conv.id 
                            ? "bg-[#00C2FF]/5 border-[#00C2FF]/25 text-[#00C2FF]" 
                            : "bg-[#141B22]/20 border-[#1E2A35]/30 hover:border-[#1E2A35] text-[#6B7F8E] hover:text-[#E8EDF2]"
                        )}
                      >
                        <div className="flex-1 cursor-pointer overflow-hidden" onClick={() => store.fetchChatHistory(conv.id)}>
                          <h3 className="text-sm font-medium truncate pr-6 font-mono uppercase tracking-wide">{conv.title || "New Conversation"}</h3>
                          <p className="text-xs opacity-60 mt-1 font-mono">
                            {new Date(conv.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 absolute right-2 opacity-0 group-hover:opacity-100 text-[#FF4D4D] hover:bg-[#FF4D4D]/10 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            store.deleteConversation(conv.id);
                          }}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <>
                  {/* Agent Activity Section */}
                  <section className="space-y-3">
                    <h3 className="text-xs font-mono font-bold tracking-widest text-[#6B7F8E] flex items-center gap-2">
                      <Terminal size={14} />
                      ACTIVE AGENTS
                    </h3>
                    <div className="space-y-3">
                      <div className="glass-card p-3 rounded-lg border border-[#1E2A35] bg-[#0E1318]/50 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-[2px] h-full bg-[#00C2FF] shadow-[0_0_8px_rgba(0,194,255,0.5)]" />
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-medium text-[#E8EDF2]">Research Agent</span>
                          <span className="text-xs text-[#00E5A0] animate-pulse">Running</span>
                        </div>
                        <p className="text-xs text-[#6B7F8E] line-clamp-2 leading-relaxed font-mono">
                          Scanning host workspace for git repository targets...
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Memory Context Section */}
                  <section className="space-y-3">
                    <h3 className="text-xs font-mono font-bold tracking-widest text-[#6B7F8E] flex items-center gap-2">
                      <Database size={14} />
                      ACTIVE CONTEXT
                    </h3>
                    <div className="space-y-2">
                      <div className="bg-[#141B22]/50 border border-[#1E2A35] p-2.5 rounded-lg text-xs text-[#6B7F8E] font-mono leading-relaxed">
                        &gt; Host files access authorized
                      </div>
                      <div className="bg-[#141B22]/50 border border-[#1E2A35] p-2.5 rounded-lg text-xs text-[#6B7F8E] font-mono leading-relaxed">
                        &gt; Python sandbox runs locally
                      </div>
                    </div>
                  </section>

                  {/* Audit Logs */}
                  <section className="space-y-3">
                    <h3 className="text-xs font-mono font-bold tracking-widest text-[#6B7F8E] flex items-center gap-2">
                      <Clock size={14} />
                      RECENT EVENTS
                    </h3>
                    <div className="space-y-3 relative before:absolute before:inset-0 before:ml-1.5 before:h-full before:w-[1px] before:bg-[#1E2A35]/50">
                      <div className="relative flex items-center justify-between group">
                        <div className="flex items-center justify-center w-3 h-3 rounded-full border border-[#00C2FF] bg-[#080B0F] shrink-0 z-10 -ml-0.5 shadow-[0_0_5px_rgba(0,194,255,0.5)]"></div>
                        <div className="w-[calc(100%-1.5rem)] ml-3">
                          <div className="text-xs text-[#6B7F8E] font-mono">Just now</div>
                          <div className="text-xs text-[#E8EDF2] font-mono">Uplink Synced</div>
                        </div>
                      </div>
                      <div className="relative flex items-center justify-between group">
                        <div className="flex items-center justify-center w-3 h-3 rounded-full border border-[#1E2A35] bg-[#080B0F] shrink-0 z-10 -ml-0.5"></div>
                        <div className="w-[calc(100%-1.5rem)] ml-3">
                          <div className="text-xs text-[#6B7F8E] font-mono">2 min ago</div>
                          <div className="text-xs text-[#6B7F8E] font-mono">Workspace Loaded</div>
                        </div>
                      </div>
                    </div>
                  </section>
                </>
              )}
            </div>

            {/* Permanent Diagnostics HUD at the bottom */}
            <div className="p-4 border-t border-[#1E2A35] bg-[#0E1318]/90 flex flex-col gap-4 shrink-0">
              {/* CPU / RAM Telemetry */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-bold tracking-widest text-[#00C2FF] uppercase">System Telemetry</h4>
                <div className="space-y-2.5">
                  {/* CPU Meter */}
                  <div>
                    <div className="flex justify-between text-xs font-mono text-[#6B7F8E] mb-1">
                      <span>CPU USAGE</span>
                      <span className="text-[#00C2FF] font-bold">{store.cpuUsage}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#141B22] rounded-full overflow-hidden border border-[#1E2A35]/30">
                      <motion.div 
                        className="h-full bg-[#00C2FF]"
                        animate={{ width: `${store.cpuUsage}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                  {/* RAM Meter */}
                  <div>
                    <div className="flex justify-between text-xs font-mono text-[#6B7F8E] mb-1">
                      <span>RAM USAGE</span>
                      <span className="text-[#7B61FF] font-bold">{store.ramUsage}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#141B22] rounded-full overflow-hidden border border-[#1E2A35]/30">
                      <motion.div 
                        className="h-full bg-[#7B61FF]"
                        animate={{ width: `${store.ramUsage}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Git Repository Status */}
              <div className="pt-3 border-t border-[#1E2A35]/30 space-y-2">
                <h4 className="text-xs font-mono font-bold tracking-widest text-[#00E5A0] uppercase flex items-center gap-1.5">
                  <GitBranch size={12} />
                  Git Workspace
                </h4>
                <div className="flex items-center justify-between text-xs font-mono text-[#6B7F8E]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00E5A0] animate-pulse"></span>
                    BRANCH
                  </span>
                  <span className="text-[#E8EDF2] font-semibold">main</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono text-[#6B7F8E]">
                  <span>PENDING DIFFS</span>
                  <span className="text-[#F5A623] font-bold">4 files</span>
                </div>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}
