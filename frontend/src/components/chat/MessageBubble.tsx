"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";
import { motion } from "framer-motion";

export interface MessageProps {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
  isStreaming?: boolean;
}

export function MessageBubble({ message }: { message: MessageProps }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex w-full gap-4 py-4",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow-sm",
          isUser
            ? "bg-primary text-primary-foreground border-primary shadow-[0_0_10px_rgba(0,194,255,0.3)]"
            : isSystem
              ? "bg-[#FF4D4D]/10 border-[#FF4D4D]/20 text-[#FF4D4D]"
              : "bg-[#0E1318] border-[#1E2A35] text-[#E8EDF2] backdrop-blur-sm"
        )}
      >
        {isUser ? <User size={16} /> : isSystem ? <Bot size={16} className="text-[#FF4D4D]" /> : <Bot size={16} className="text-[#00C2FF]" />}
      </div>
      
      <div
        className={cn(
          "flex flex-col gap-2 max-w-[80%]",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-5 py-3 text-sm leading-relaxed glass-card",
            isUser
              ? "bg-primary/10 text-[#E8EDF2] rounded-tr-sm border-primary/20"
              : isSystem 
                ? "bg-[#FF4D4D]/10 text-[#E8EDF2] rounded-tl-sm border-[#FF4D4D]/20"
                : "bg-white/[0.03] text-[#E8EDF2] rounded-tl-sm border-[#1E2A35]"
          )}
        >
          <div className="whitespace-pre-wrap">{message.content}</div>
          
          {message.isStreaming && (
            <span className="ml-1 inline-block w-1.5 h-4 bg-primary animate-pulse align-middle" />
          )}
        </div>
        
        {message.timestamp && (
          <span className="text-xs text-muted-foreground px-1">
            {message.timestamp}
          </span>
        )}
      </div>
    </motion.div>
  );
}
