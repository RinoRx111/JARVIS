"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, Database, ChevronRight, ChevronLeft,
  MessageSquare, Plus, Trash2, GitBranch, Cpu, MemoryStick
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { useJarvisStore } from '@/hooks/useJarvisStore';

export function ContextPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();
  const store = useJarvisStore();
  const fetchConversations = useJarvisStore((s) => s.fetchConversations);

  useEffect(() => {
    if (pathname === '/') fetchConversations();
  }, [pathname, fetchConversations]);

  useEffect(() => {
    store.updateSystemStats();
    const id = setInterval(() => store.updateSystemStats(), 3000);
    return () => clearInterval(id);
  }, []);

  const isChatTab = pathname === '/';

  return (
    <div className="h-screen relative flex shrink-0">
      {/* Collapse toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -left-3 top-1/2 -translate-y-1/2 h-10 w-3 bg-[#111111] border border-[#1F1F1F] rounded-l-md flex items-center justify-center text-[#616161] hover:text-[#EDEDED] transition-colors z-50 shadow-sm"
        title={isOpen ? "Collapse panel" : "Expand panel"}
      >
        {isOpen ? <ChevronRight size={10} /> : <ChevronLeft size={10} />}
      </button>

      <motion.aside
        initial={false}
        animate={{ width: isOpen ? 260 : 0 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className="h-full flex flex-col border-l border-[#1F1F1F] bg-[#111111] overflow-hidden"
      >
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 w-[260px] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex h-14 items-center justify-between px-4 border-b border-[#1F1F1F] shrink-0">
                <div className="flex items-center gap-2">
                  {isChatTab
                    ? <MessageSquare size={14} className="text-indigo-400" />
                    : <Database size={14} className="text-indigo-400" />}
                  <span className="text-[12px] font-semibold text-[#8F8F8F] tracking-wider uppercase">
                    {isChatTab ? "History" : "Context"}
                  </span>
                </div>
                {isChatTab && (
                  <button
                    onClick={() => store.startNewChat()}
                    className="p-1.5 rounded-md text-[#616161] hover:text-[#EDEDED] hover:bg-[#1C1C1C] transition-colors"
                    title="New chat"
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-4">
                {isChatTab ? (
                  /* --- Conversation List --- */
                  <div className="flex flex-col gap-1">
                    {store.conversations.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                        <div className="h-10 w-10 rounded-full bg-[#1C1C1C] flex items-center justify-center">
                          <MessageSquare size={16} className="text-[#3A3A3A]" />
                        </div>
                        <p className="text-[12px] text-[#616161]">No conversations yet</p>
                      </div>
                    ) : (
                      store.conversations.map((conv: any) => (
                        <div
                          key={conv.id}
                          className={cn(
                            "group flex items-center justify-between rounded-md px-3 py-2.5 cursor-pointer transition-colors",
                            store.activeConversationId === conv.id
                              ? "bg-[#1C1C1C] text-[#EDEDED]"
                              : "text-[#8F8F8F] hover:bg-[#171717] hover:text-[#EDEDED]"
                          )}
                          onClick={() => store.fetchChatHistory(conv.id)}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium truncate leading-tight">
                              {conv.title || "New conversation"}
                            </p>
                            <p className="text-[11px] text-[#616161] mt-0.5">
                              {new Date(conv.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); store.deleteConversation(conv.id); }}
                            className="ml-2 p-1 rounded opacity-0 group-hover:opacity-100 text-[#616161] hover:text-red-400 hover:bg-red-400/10 transition-all"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  /* --- System Context --- */
                  <div className="flex flex-col gap-5">
                    {/* Active Context */}
                    <div>
                      <p className="text-label mb-2 flex items-center gap-1.5">
                        <Database size={11} /> Active Context
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {["Host files access authorized", "Python sandbox local"].map((item) => (
                          <div key={item} className="flex items-center gap-2 text-[12px] text-[#8F8F8F] bg-[#171717] rounded-md px-3 py-2 border border-[#1F1F1F]">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recent Events */}
                    <div>
                      <p className="text-label mb-2 flex items-center gap-1.5">
                        <Clock size={11} /> Recent Events
                      </p>
                      <div className="flex flex-col gap-2">
                        {[
                          { label: "Uplink synced", time: "Just now", active: true },
                          { label: "Workspace loaded", time: "2 min ago", active: false },
                        ].map((event) => (
                          <div key={event.label} className="flex items-center gap-3 text-[12px]">
                            <div className={cn(
                              "h-1.5 w-1.5 rounded-full shrink-0",
                              event.active ? "bg-indigo-400" : "bg-[#3A3A3A]"
                            )} />
                            <span className={event.active ? "text-[#EDEDED]" : "text-[#616161]"}>{event.label}</span>
                            <span className="ml-auto text-[11px] text-[#616161]">{event.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer — System Stats */}
              <div className="p-3 border-t border-[#1F1F1F] flex flex-col gap-3 shrink-0">
                {/* CPU */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-[#616161] flex items-center gap-1.5">
                      <Cpu size={10} /> CPU
                    </span>
                    <span className="text-[11px] font-medium text-[#8F8F8F]">{store.cpuUsage}%</span>
                  </div>
                  <div className="h-1 w-full bg-[#1F1F1F] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-indigo-500 rounded-full"
                      animate={{ width: `${store.cpuUsage}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* RAM */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-[#616161] flex items-center gap-1.5">
                      <MemoryStick size={10} /> RAM
                    </span>
                    <span className="text-[11px] font-medium text-[#8F8F8F]">{store.ramUsage}%</span>
                  </div>
                  <div className="h-1 w-full bg-[#1F1F1F] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-violet-500 rounded-full"
                      animate={{ width: `${store.ramUsage}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Git branch */}
                <div className="flex items-center justify-between pt-1 border-t border-[#1F1F1F]">
                  <span className="text-[11px] text-[#616161] flex items-center gap-1.5">
                    <GitBranch size={10} /> Branch
                  </span>
                  <span className="text-[11px] font-medium text-[#8F8F8F]">main</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>
    </div>
  );
}
