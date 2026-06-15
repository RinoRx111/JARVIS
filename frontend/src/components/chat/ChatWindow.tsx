"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Square, Paperclip, Volume2, VolumeX, Plus, ShieldAlert, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJarvisStore } from '@/hooks/useJarvisStore';
import { wsService } from '@/services/websocket';
import { MessageBubble } from './MessageBubble';
import { ToolExecutionNode } from './ToolExecutionNode';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const QUICK_PROMPTS = [
  "Summarize my recent tasks",
  "What files are on the desktop?",
  "Write a Python script to",
  "Search the web for",
];

export function ChatWindow() {
  const token              = useJarvisStore((s) => s.token);
  const messages           = useJarvisStore((s) => s.messages);
  const alerts             = useJarvisStore((s) => s.alerts);
  const currentPlan        = useJarvisStore((s) => s.currentPlan);
  const coreStatus         = useJarvisStore((s) => s.coreStatus);
  const isVoiceActive      = useJarvisStore((s) => s.isVoiceActive);
  const tokenUsage         = useJarvisStore((s) => s.tokenUsage);
  const userPreferences    = useJarvisStore((s) => s.userPreferences);
  const pendingToolApproval = useJarvisStore((s) => s.pendingToolApproval);
  const wsConnected        = useJarvisStore((s) => s.wsConnected);

  const setCoreStatus      = useJarvisStore((s) => s.setCoreStatus);
  const addNotification    = useJarvisStore((s) => s.addNotification);
  const setVoiceActive     = useJarvisStore((s) => s.setVoiceActive);
  const startNewChat       = useJarvisStore((s) => s.startNewChat);
  const fetchConversations = useJarvisStore((s) => s.fetchConversations);
  const fetchChatHistory   = useJarvisStore((s) => s.fetchChatHistory);
  const setPlan            = useJarvisStore((s) => s.setPlan);
  const setVoicePlaybackUrl = useJarvisStore((s) => s.setVoicePlaybackUrl);
  const uploadFile         = useJarvisStore((s) => s.uploadFile);
  const setActiveTab       = useJarvisStore((s) => s.setActiveTab);

  const [input, setInput]         = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef   = useRef<Blob[]>([]);
  const messagesEndRef   = useRef<HTMLDivElement>(null);
  const scrollAreaRef    = useRef<HTMLDivElement>(null);
  const textareaRef      = useRef<HTMLTextAreaElement>(null);
  const fileInputRef     = useRef<HTMLInputElement>(null);

  /* ---------- scroll helpers ---------- */
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleScroll = () => {
    const el = scrollAreaRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distFromBottom > 200);
  };

  /* ---------- init ---------- */
  useEffect(() => {
    if (token) { fetchConversations(); fetchChatHistory(); }
  }, [token, fetchConversations, fetchChatHistory]);

  /* ---------- cleanup media on unmount ---------- */
  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  /* ---------- auto-resize textarea ---------- */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  }, [input]);

  /* ---------- recording ---------- */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        wsService.sendVoiceChunk(blob);
      };
      mr.start();
      setIsRecording(true);
      setCoreStatus('LISTENING');
    } catch {
      addNotification("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      setIsRecording(false);
      setCoreStatus('THINKING');
    }
  };

  /* ---------- file upload ---------- */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    const ok = await uploadFile(file);
    addNotification(ok ? `Uploaded: ${file.name}` : `Upload failed: ${file.name}`);
  };

  /* ---------- send ---------- */
  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text) return;
    setPlan([]);
    wsService.sendTextMessage(text);
    setInput('');
  };

  const handleStop = () => {
    window.speechSynthesis?.cancel();
    setVoicePlaybackUrl(null);
    setCoreStatus('STANDBY');
    wsService.sendTextMessage(JSON.stringify({ type: "cancel" }));
  };

  const isGenerating = coreStatus === 'THINKING' || coreStatus === 'SPEAKING';
  const isEmpty = messages.length === 0;

  /* ---------- status label ---------- */
  const statusLabel = {
    STANDBY:  wsConnected ? 'Ready' : 'Offline',
    THINKING: 'Thinking…',
    LISTENING:'Listening…',
    SPEAKING: 'Speaking…',
  }[coreStatus];

  return (
    <div className="flex flex-col h-full w-full bg-[#0F0F0F] relative">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-5 h-14 border-b border-[#1F1F1F] shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                coreStatus === 'STANDBY'   && wsConnected  ? "bg-emerald-400 pulse-dot" : "",
                coreStatus === 'THINKING'                  ? "bg-amber-400 pulse-dot"   : "",
                coreStatus === 'LISTENING'                 ? "bg-blue-400 pulse-dot"    : "",
                coreStatus === 'SPEAKING'                  ? "bg-indigo-400 pulse-dot"  : "",
                !wsConnected                               ? "bg-[#3A3A3A]"              : "",
              )}
            />
            <span className="text-[13px] text-[#8F8F8F]">{statusLabel}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Voice toggle */}
          <button
            onClick={() => setVoiceActive(!isVoiceActive)}
            className="p-2 rounded-md text-[#616161] hover:text-[#EDEDED] hover:bg-[#1C1C1C] transition-colors"
            title={isVoiceActive ? "Mute voice" : "Unmute voice"}
          >
            {isVoiceActive ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>

          {/* New chat */}
          <button
            onClick={startNewChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] text-[#8F8F8F] hover:text-[#EDEDED] hover:bg-[#1C1C1C] transition-colors"
          >
            <Plus size={14} />
            New chat
          </button>
        </div>
      </div>

      {/* ── Messages area ── */}
      <div
        ref={scrollAreaRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto custom-scrollbar"
      >
        {isEmpty ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full gap-8 px-4 pb-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-indigo-400">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h2 className="text-[18px] font-semibold text-[#EDEDED] mb-1">How can I help?</h2>
                <p className="text-[13px] text-[#616161] max-w-xs">
                  Ask me anything — I can run scripts, search the web, manage files, and more.
                </p>
              </div>
            </div>

            {/* Quick prompts */}
            <div className="grid grid-cols-2 gap-2 w-full max-w-md">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => setInput(p)}
                  className="text-left px-4 py-3 rounded-lg bg-[#171717] border border-[#262626] text-[12px] text-[#8F8F8F] hover:text-[#EDEDED] hover:border-[#333] transition-colors leading-snug"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Messages */
          <div className="max-w-2xl mx-auto w-full px-4 py-6 flex flex-col gap-1">
            {/* Proactive Alerts */}
            {alerts?.map((alert: any, i: number) => (
              <div key={i} className="my-3 rounded-lg bg-amber-500/5 border border-amber-500/20 p-4 animate-fade-slide-up">
                <p className="text-[12px] font-semibold text-amber-400 mb-1">{alert.title}</p>
                <p className="text-[13px] text-[#8F8F8F] leading-relaxed">{alert.message}</p>
              </div>
            ))}

            {/* Messages */}
            {messages.map((msg, idx) => (
              <React.Fragment key={msg.id || idx}>
                <MessageBubble message={msg as any} />
                {msg.toolCalls?.map((tool, tIdx) => (
                  <ToolExecutionNode key={tIdx} tool={tool} index={tIdx} />
                ))}
              </React.Fragment>
            ))}

            {/* Execution plan */}
            {currentPlan && currentPlan.length > 0 && (
              <div className="ml-10 my-2 rounded-lg bg-[#171717] border border-[#262626] p-3">
                <p className="text-[11px] font-semibold text-[#8F8F8F] uppercase tracking-wider mb-2">Plan</p>
                <div className="flex flex-col gap-1.5">
                  {currentPlan.map((step, i) => (
                    <div key={i} className="flex items-start gap-2 text-[12px] text-[#8F8F8F]">
                      <span className="h-4 w-4 rounded-full bg-[#262626] text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-medium text-[#616161]">
                        {i + 1}
                      </span>
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Scroll-to-bottom button */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            onClick={() => scrollToBottom()}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1C1C1C] border border-[#2A2A2A] text-[12px] text-[#8F8F8F] hover:text-[#EDEDED] shadow-lg z-20"
          >
            <ChevronDown size={13} /> Scroll to bottom
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Tool Approval Banner ── */}
      <AnimatePresence>
        {pendingToolApproval && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="mx-4 mb-3 rounded-lg bg-[#171717] border border-amber-500/20 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert size={14} className="text-amber-400" />
              <span className="text-[12px] font-semibold text-amber-400">Permission Required</span>
            </div>
            <p className="text-[12px] text-[#8F8F8F] mb-3 leading-relaxed">
              JARVIS wants to execute a Python script on your system. Review the code below:
            </p>
            <pre className="text-[11px] font-mono text-[#a5b4fc] bg-[#0F0F0F] rounded-md p-3 max-h-32 overflow-y-auto border border-[#262626] mb-3 whitespace-pre-wrap">
              {pendingToolApproval.code}
            </pre>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => wsService.sendToolApprovalResponse(pendingToolApproval.tool_call_id, false)}
                className="px-3 py-1.5 rounded-md text-[12px] text-[#8F8F8F] hover:text-red-400 hover:bg-red-400/8 border border-[#262626] transition-colors"
              >
                Deny
              </button>
              <button
                onClick={() => wsService.sendToolApprovalResponse(pendingToolApproval.tool_call_id, true)}
                className="px-3 py-1.5 rounded-md text-[12px] bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
              >
                Allow
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Input bar ── */}
      <div className="px-4 pb-4 pt-2 shrink-0">
        <div className="max-w-2xl mx-auto">
          <form
            onSubmit={handleSend}
            className={cn(
              "relative flex items-end gap-2 bg-[#171717] border rounded-xl p-2 transition-colors",
              "border-[#262626] focus-within:border-[#3A3A3A]"
            )}
          >
            {/* Mic button */}
            <button
              type="button"
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              title="Hold to speak"
              className={cn(
                "p-2 rounded-lg shrink-0 transition-colors",
                isRecording
                  ? "text-red-400 bg-red-400/10"
                  : "text-[#616161] hover:text-[#EDEDED] hover:bg-[#1C1C1C]"
              )}
            >
              <Mic size={16} />
            </button>

            {/* File attach */}
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Attach file"
              className="p-2 rounded-lg shrink-0 text-[#616161] hover:text-[#EDEDED] hover:bg-[#1C1C1C] transition-colors"
            >
              <Paperclip size={16} />
            </button>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message JARVIS…"
              rows={1}
              className="flex-1 resize-none bg-transparent text-[14px] text-[#EDEDED] placeholder-[#3A3A3A] py-2 focus:outline-none leading-relaxed min-h-[36px] max-h-[140px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />

            {/* Token count */}
            {tokenUsage.total > 0 && (
              <span className="text-[11px] text-[#616161] shrink-0 pb-2 pr-1 hidden sm:block">
                {tokenUsage.total.toLocaleString()} tokens
              </span>
            )}

            {/* Send / Stop */}
            {isGenerating ? (
              <button
                type="button"
                onClick={handleStop}
                title="Stop"
                className="p-2 rounded-lg shrink-0 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
              >
                <Square size={14} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                title="Send"
                className="p-2 rounded-lg shrink-0 bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={14} />
              </button>
            )}
          </form>

          <p className="text-center text-[11px] text-[#3A3A3A] mt-2">
            AI can make mistakes. Always review important actions.
          </p>
        </div>
      </div>
    </div>
  );
}
