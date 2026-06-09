"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Terminal, CheckCircle2, CircleDashed } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToolExecutionProps {
  toolName: string;
  status: "running" | "success" | "failed";
  durationMs?: number;
  input?: string;
  output?: string;
}

export function ToolExecutionNode({ tool, index }: { tool: ToolExecutionProps; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="my-2 ml-12 mr-auto max-w-[70%]"
    >
      <div className="rounded-lg border border-[#1E2A35] bg-[#0E1318] overflow-hidden shadow-sm backdrop-blur-sm">
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "flex w-full items-center justify-between px-3 py-2 text-xs transition-colors hover:bg-white/[0.03]",
            tool.status === "running" ? "bg-primary/5" : "bg-transparent"
          )}
        >
          <div className="flex items-center gap-2">
            {tool.status === "running" ? (
              <CircleDashed size={14} className="animate-spin text-primary" />
            ) : tool.status === "success" ? (
              <CheckCircle2 size={14} className="text-[#00E5A0]" />
            ) : (
              <Terminal size={14} className="text-[#FF4D4D]" />
            )}
            
            <span className="font-mono text-muted-foreground uppercase tracking-wider">
              {tool.toolName}
            </span>
            
            {tool.durationMs && (
              <span className="text-xs text-muted-foreground/50 ml-2 font-mono">
                {tool.durationMs}ms
              </span>
            )}
          </div>
          
          <div className="text-muted-foreground hover:text-[#00C2FF] transition-colors">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              className="overflow-hidden border-t border-[#1E2A35]"
            >
              <div className="p-3 bg-[#141B22]/50 font-mono text-xs text-muted-foreground whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                <div className="mb-2">
                  <span className="text-primary/70 select-none">{'>'} INPUT: </span>
                  {tool.input || "{}"}
                </div>
                <div>
                  <span className="text-[#00E5A0]/70 select-none">{'>'} OUTPUT: </span>
                  {tool.output || "..."}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
