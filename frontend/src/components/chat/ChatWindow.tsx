"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Plus, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useJarvisStore } from '@/hooks/useJarvisStore';
import { wsService } from '@/services/websocket';
import { MessageBubble } from './MessageBubble';
import { ToolExecutionNode } from './ToolExecutionNode';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToolExecutionProps } from './ToolExecutionNode';

export function ChatWindow() {
  const store = useJarvisStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [store.messages]);

  useEffect(() => {
    wsService.init();
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    wsService.sendTextMessage(input);
    setInput('');
  };

  // Mock tools for UI demo if not connected yet
  const demoTool: ToolExecutionProps = {
    toolName: "duckduckgo_search",
    status: "success",
    durationMs: 450,
    input: '{"query": "Next.js updates"}',
    output: "Found 3 results..."
  };

  return (
    <div className="flex flex-col h-full w-full relative">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div>
          <h1 className="text-lg font-medium text-white">JARVIS Assistant</h1>
          <p className="text-xs text-primary">All systems online</p>
        </div>
        <Button variant="glass" size="sm" onClick={() => store.startNewChat()}>
          <Plus size={16} className="mr-2" />
          New Chat
        </Button>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 md:px-12 lg:px-24">
        {store.messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-4">
            <div className="w-16 h-16 rounded-full border border-primary/20 flex items-center justify-center text-primary/40 bg-primary/5">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <p className="text-sm font-medium">Awaiting input, Operator.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-w-4xl mx-auto">
            {store.messages.map((msg, idx) => (
              <React.Fragment key={msg.id || idx}>
                <MessageBubble message={msg as any} />
                {/* Randomly inject a tool execution for demo purposes if it's an assistant response */}
                {msg.role === 'assistant' && idx === store.messages.length - 1 && (
                  <ToolExecutionNode tool={demoTool} index={idx} />
                )}
              </React.Fragment>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 md:px-12 lg:px-24 max-w-5xl mx-auto w-full">
        <div className="relative">
          <form onSubmit={handleSend} className="relative flex items-end gap-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-lg focus-within:border-primary/50 focus-within:shadow-[0_0_15px_rgba(0,216,255,0.1)] transition-all">
            
            <button type="button" className="p-3 text-muted-foreground hover:text-white transition-colors shrink-0">
              <Mic size={20} />
            </button>
            
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message JARVIS..."
              className="w-full max-h-32 min-h-[44px] bg-transparent border-0 focus:ring-0 resize-none text-sm text-white placeholder-muted-foreground py-3"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
            />
            
            <Button 
              type="submit" 
              size="icon" 
              className="shrink-0 rounded-xl"
              disabled={!input.trim()}
            >
              <Send size={18} className="ml-1" />
            </Button>
          </form>
          <div className="text-center mt-2">
            <span className="text-[10px] text-muted-foreground">JARVIS OS v2.0 • AI can make mistakes. Consider verifying important information.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
