"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Clock, Database, ChevronRight, ChevronLeft, Terminal, MessageSquare, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { usePathname } from 'next/navigation';
import { useJarvisStore } from '@/hooks/useJarvisStore';
import { Button } from '@/components/ui/button';

export function ContextPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();
  const store = useJarvisStore();

  useEffect(() => {
    if (pathname === '/') {
      store.fetchConversations();
    }
  }, [pathname]);

  const isChatTab = pathname === '/';

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 320 : 0 }}
      className="h-screen relative flex flex-col border-l border-white/5 bg-black/40 backdrop-blur-xl z-40 overflow-hidden"
    >
      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -left-4 top-1/2 -translate-y-1/2 h-16 w-4 bg-white/5 border border-white/10 rounded-l-md flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors shadow-[-5px_0_15px_rgba(0,0,0,0.5)] z-50 backdrop-blur-md"
      >
        {isOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 w-[320px] flex flex-col overflow-hidden"
          >
            <div className="p-4 border-b border-white/5 flex items-center gap-2">
              {isChatTab ? (
                <>
                  <MessageSquare size={18} className="text-primary" />
                  <h2 className="text-sm font-semibold text-white tracking-wide">CHAT HISTORY</h2>
                  <Button variant="ghost" size="icon" className="ml-auto h-6 w-6" onClick={() => store.startNewChat()}>
                    <Plus size={14} />
                  </Button>
                </>
              ) : (
                <>
                  <Activity size={18} className="text-primary" />
                  <h2 className="text-sm font-semibold text-white tracking-wide">SYSTEM CONTEXT</h2>
                  <Badge variant="glass" className="ml-auto text-[10px]">LIVE</Badge>
                </>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
              {isChatTab ? (
                <div className="space-y-1">
                  {store.conversations.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center mt-4">No previous conversations</div>
                  ) : (
                    store.conversations.map((conv: any) => (
                      <div 
                        key={conv.id}
                        className={cn(
                          "p-3 rounded-lg transition-all border border-transparent group relative flex items-center justify-between",
                          store.activeConversationId === conv.id 
                            ? "bg-primary/10 border-primary/30 text-white" 
                            : "hover:bg-white/5 text-muted-foreground hover:text-white"
                        )}
                      >
                        <div className="flex-1 cursor-pointer overflow-hidden" onClick={() => store.fetchChatHistory(conv.id)}>
                          <h3 className="text-sm font-medium truncate pr-6">{conv.title || "New Conversation"}</h3>
                          <p className="text-[10px] opacity-60 mt-1">
                            {new Date(conv.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 absolute right-2 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 transition-opacity"
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
                  <section>
                    <h3 className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      <Terminal size={14} />
                      ACTIVE AGENTS
                    </h3>
                    <div className="space-y-3">
                      <div className="glass-card p-3 rounded-lg relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary shadow-[0_0_10px_rgba(0,216,255,0.8)]" />
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-medium text-white">Research Agent</span>
                          <span className="text-xs text-primary animate-pulse">Running</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          Scanning DuckDuckGo for latest framework updates...
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Memory Context Section */}
                  <section>
                    <h3 className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      <Database size={14} />
                      ACTIVE CONTEXT
                    </h3>
                    <div className="space-y-2">
                      <div className="bg-white/5 border border-white/10 p-2.5 rounded text-xs text-muted-foreground hover:text-white transition-colors cursor-default">
                        User prefers Next.js App Router.
                      </div>
                      <div className="bg-white/5 border border-white/10 p-2.5 rounded text-xs text-muted-foreground hover:text-white transition-colors cursor-default">
                        Current task involves UI restructuring.
                      </div>
                    </div>
                  </section>

                  {/* Audit Logs */}
                  <section className="mt-auto pt-4 border-t border-white/5">
                    <h3 className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      <Clock size={14} />
                      RECENT EVENTS
                    </h3>
                    <div className="space-y-3 relative before:absolute before:inset-0 before:ml-1.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                      <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-3 h-3 rounded-full border border-primary bg-background shrink-0 md:order-1 shadow-[0_0_10px_rgba(0,216,255,0.5)] z-10 -ml-1"></div>
                        <div className="w-[calc(100%-1.5rem)] ml-3">
                          <div className="text-[10px] text-muted-foreground">Just now</div>
                          <div className="text-xs text-white">Web Search Completed</div>
                        </div>
                      </div>
                      <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                        <div className="flex items-center justify-center w-3 h-3 rounded-full border border-white/20 bg-background shrink-0 md:order-1 z-10 -ml-1"></div>
                        <div className="w-[calc(100%-1.5rem)] ml-3">
                          <div className="text-[10px] text-muted-foreground">2 min ago</div>
                          <div className="text-xs text-muted-foreground">Agent Task Queued</div>
                        </div>
                      </div>
                    </div>
                  </section>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}
