"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToolExecutionProps {
  toolName: string;
  status: "running" | "success" | "failed";
  durationMs?: number;
  input?: string;
  output?: string;
}

export function ToolExecutionNode({ tool }: { tool: ToolExecutionProps; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-1.5 ml-10 mr-auto max-w-sm"
    >
      <div className="rounded-lg border border-[#262626] bg-[#171717] overflow-hidden text-[12px]">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center justify-between px-3 py-2 hover:bg-[#1C1C1C] transition-colors"
        >
          <div className="flex items-center gap-2">
            {tool.status === "running" ? (
              <Loader2 size={12} className="animate-spin text-amber-400" />
            ) : tool.status === "success" ? (
              <CheckCircle2 size={12} className="text-emerald-400" />
            ) : (
              <XCircle size={12} className="text-red-400" />
            )}
            <span className="font-mono text-[#8F8F8F] tracking-wide">
              {tool.toolName}
            </span>
            {tool.durationMs && (
              <span className="text-[#616161] font-mono">{tool.durationMs}ms</span>
            )}
          </div>
          <span className="text-[#616161]">
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </span>
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              className="overflow-hidden border-t border-[#262626]"
            >
              <div className="p-3 font-mono text-[11px] text-[#616161] whitespace-pre-wrap max-h-64 overflow-y-auto custom-scrollbar">
                <div className="mb-2">
                  <span className="text-indigo-400/60 select-none">IN: </span>
                  {tool.input || "{}"}
                </div>
                <div>
                  <span className="text-emerald-400/60 select-none">OUT: </span>
                  {tool.output || "…"}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
