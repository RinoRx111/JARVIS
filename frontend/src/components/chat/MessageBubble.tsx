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
            ? "bg-primary text-primary-foreground border-primary shadow-[0_0_10px_rgba(0,216,255,0.3)]"
            : "bg-white/5 border-white/10 text-white backdrop-blur-sm"
        )}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
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
              ? "bg-primary/10 text-white rounded-tr-sm border-primary/20"
              : "bg-white/5 text-gray-200 rounded-tl-sm border-white/10"
          )}
        >
          {/* Simple plain text rendering for now - Markdown parser can be added */}
          <div className="whitespace-pre-wrap">{message.content}</div>
          
          {message.isStreaming && (
            <span className="ml-1 inline-block w-1.5 h-4 bg-primary animate-pulse align-middle" />
          )}
        </div>
        
        {message.timestamp && (
          <span className="text-[10px] text-muted-foreground px-1">
            {message.timestamp}
          </span>
        )}
      </div>
    </motion.div>
  );
}
