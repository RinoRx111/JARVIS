"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Sparkles, User } from "lucide-react";

export interface MessageProps {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
  isStreaming?: boolean;
}

export function MessageBubble({ message }: { message: MessageProps }) {
  const isUser   = message.role === "user";
  const isSystem = message.role === "system";
  const isEmpty  = !message.content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn("flex gap-3 py-2 w-full", isUser ? "flex-row-reverse" : "flex-row")}
    >
      {/* Avatar */}
      <div
        className={cn(
          "h-7 w-7 rounded-lg shrink-0 flex items-center justify-center mt-0.5",
          isUser
            ? "bg-[#1C1C1C] border border-[#2A2A2A] text-[#8F8F8F]"
            : isSystem
              ? "bg-red-500/10 border border-red-500/20 text-red-400"
              : "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400"
        )}
      >
        {isUser ? <User size={13} /> : <Sparkles size={13} />}
      </div>

      {/* Bubble */}
      <div className={cn("flex flex-col gap-1 max-w-[82%]", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-xl px-4 py-2.5 text-[13.5px] leading-relaxed",
            isUser
              ? "bg-indigo-500/10 text-[#EDEDED] rounded-tr-sm border border-indigo-500/15"
              : isSystem
                ? "bg-red-500/5 text-[#8F8F8F] rounded-tl-sm border border-red-500/10"
                : "bg-[#171717] text-[#EDEDED] rounded-tl-sm border border-[#262626]"
          )}
        >
          {/* Thinking indicator — show when assistant message is empty (streaming about to start) */}
          {isEmpty && !isUser ? (
            <span className="flex items-center gap-1 h-5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#616161] dot-1" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#616161] dot-2" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#616161] dot-3" />
            </span>
          ) : (
            <div className="prose-minimal whitespace-pre-wrap">
              {message.content}
              {message.isStreaming && (
                <span className="ml-0.5 inline-block w-0.5 h-4 bg-indigo-400 cursor-blink align-middle" />
              )}
            </div>
          )}
        </div>

        {message.timestamp && (
          <span className="text-[11px] text-[#616161] px-1">{message.timestamp}</span>
        )}
      </div>
    </motion.div>
  );
}
