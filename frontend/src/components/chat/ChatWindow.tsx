"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Plus, Loader2, Volume2, VolumeX, Square, Paperclip } from 'lucide-react';
import { motion } from 'framer-motion';
import { useJarvisStore } from '@/hooks/useJarvisStore';
import { wsService } from '@/services/websocket';
import { MessageBubble } from './MessageBubble';
import { ToolExecutionNode } from './ToolExecutionNode';
import { Button } from '@/components/ui/button';
import VoiceOrb from '@/components/VoiceOrb';

export function ChatWindow() {
  const token = useJarvisStore((state) => state.token);
  const messages = useJarvisStore((state) => state.messages);
  const alerts = useJarvisStore((state) => state.alerts);
  const currentPlan = useJarvisStore((state) => state.currentPlan);
  const coreStatus = useJarvisStore((state) => state.coreStatus);
  const isVoiceActive = useJarvisStore((state) => state.isVoiceActive);
  const tokenUsage = useJarvisStore((state) => state.tokenUsage);
  const userPreferences = useJarvisStore((state) => state.userPreferences);
  
  const setCoreStatus = useJarvisStore((state) => state.setCoreStatus);
  const addNotification = useJarvisStore((state) => state.addNotification);
  const setVoiceActive = useJarvisStore((state) => state.setVoiceActive);
  const startNewChat = useJarvisStore((state) => state.startNewChat);
  const fetchConversations = useJarvisStore((state) => state.fetchConversations);
  const fetchChatHistory = useJarvisStore((state) => state.fetchChatHistory);
  const setPlan = useJarvisStore((state) => state.setPlan);
  const setVoicePlaybackUrl = useJarvisStore((state) => state.setVoicePlaybackUrl);
  const uploadFile = useJarvisStore((state) => state.uploadFile);
  const setActiveTab = useJarvisStore((state) => state.setActiveTab);

  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatFileInputRef = useRef<HTMLInputElement>(null);
  const handleChatFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const success = await uploadFile(file);
      if (success) {
        addNotification(`Uploaded file: ${file.name} to assistant workspace.`);
      } else {
        addNotification(`Failed to upload file: ${file.name}.`);
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        wsService.sendVoiceChunk(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setCoreStatus('LISTENING');
    } catch (err) {
      console.error("Microphone access denied:", err);
      addNotification("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setCoreStatus('THINKING');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (token) {
      fetchConversations();
      fetchChatHistory();
    }
  }, [token, fetchConversations, fetchChatHistory]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setPlan([]);
    wsService.sendTextMessage(input);
    setInput('');
  };

  const handleStop = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setVoicePlaybackUrl(null);
    setCoreStatus('STANDBY');
    wsService.sendTextMessage(JSON.stringify({ type: "cancel" }));
    addNotification("Generation interrupted by user.");
  };

  const isGenerating = coreStatus === 'THINKING' || coreStatus === 'SPEAKING';

  return (
    <div className="flex flex-col h-full w-full relative bg-background">
      {/* Scrollable chat body */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 custom-scrollbar">
        <div className="max-w-[780px] w-full mx-auto flex flex-col min-h-full">
          {/* Header/Title block inside the content area */}
          <div className="flex items-center justify-between pb-6 border-b border-[#1E2A35]/30 mb-6 shrink-0">
            <div className="flex flex-col">
              <h1 className="text-lg font-mono uppercase tracking-widest text-[#E8EDF2] font-bold">JARVIS Assistant</h1>
              <p className="text-xs text-[#00C2FF] font-mono tracking-wider">SECURE GRID ONLINE</p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setVoiceActive(!isVoiceActive)}
                className="text-[#6B7F8E] hover:text-[#00C2FF] h-8 px-2 border border-[#1E2A35] transition-all duration-200"
                title={isVoiceActive ? "Mute Voice" : "Unmute Voice"}
              >
                {isVoiceActive ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => startNewChat()}
                className="text-[#6B7F8E] hover:text-[#00C2FF] text-xs font-mono uppercase tracking-wider border border-[#1E2A35] h-8 px-2.5 rounded-md transition-all duration-200"
              >
                NEW CHAT
              </Button>
            </div>
          </div>

          {messages.length === 0 ? (
            /* Empty State: Centerpiece 80px Voice Orb */
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
              <VoiceOrb 
                status={coreStatus} 
                onClick={() => isRecording ? stopRecording() : startRecording()} 
              />
              <div className="space-y-1.5">
                <h2 className="text-lg font-mono uppercase tracking-[0.2em] text-[#E8EDF2] font-bold">Awaiting Link Uplink</h2>
                <p className="text-xs text-[#6B7F8E] tracking-wider font-mono">Operator terminal standby. Speak or write a compiler target.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 max-w-md w-full pt-4">
                {[
                  "List files on desktop",
                  "Write a script to count files",
                  "Create git issue tool target",
                  "Summarize target spreadsheet"
                ].map((promptText) => (
                  <button
                    key={promptText}
                    onClick={() => setInput(promptText)}
                    className="glass-card p-3 text-left hover:text-[#00C2FF] transition-all text-xs font-mono uppercase tracking-wider text-[#6B7F8E] font-medium"
                  >
                    &gt; {promptText}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Message Stream */
            <div className="flex-1 flex flex-col">
              {/* Proactive Alerts */}
              {alerts && alerts.map((alert: any, idx: number) => (
                <div key={`alert-${idx}`} className="my-4 border border-[#F5A623]/30 bg-[#F5A623]/5 rounded-lg p-4 backdrop-blur-md animate-in fade-in">
                  <div className="flex items-center gap-2 mb-2 text-[#F5A623]">
                    <span className="text-xs font-bold uppercase tracking-wider font-mono">{alert.title}</span>
                  </div>
                  <div className="text-sm text-[#E8EDF2]/90 whitespace-pre-wrap">
                    {alert.message}
                  </div>
                </div>
              ))}

              {/* Conversation Messages */}
              <div className="space-y-2">
                {messages.map((msg, idx) => (
                  <React.Fragment key={msg.id || idx}>
                    <MessageBubble message={msg as any} />
                    {msg.toolCalls && msg.toolCalls.map((tool, tIdx) => (
                      <ToolExecutionNode key={tIdx} tool={tool} index={tIdx} />
                    ))}
                  </React.Fragment>
                ))}
              </div>
              
              {currentPlan && currentPlan.length > 0 && (
                <div className="my-4 ml-12 border border-[#1E2A35] bg-[#0E1318] rounded-xl p-3 backdrop-blur-md">
                  <div className="flex items-center gap-2 mb-2 text-[#00C2FF]">
                    <span className="text-xs font-semibold tracking-wider uppercase font-mono">Execution Plan</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {currentPlan.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-[#6B7F8E]">
                        <div className="shrink-0 w-4 h-4 rounded-full border border-[#1E2A35] flex items-center justify-center text-xs mt-0.5 font-mono">
                          {idx + 1}
                        </div>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area (pinned to bottom, max-width 780px) */}
      <div className="p-4 md:p-6 w-full shrink-0 border-t border-[#1E2A35]/30 bg-[#080B0F]/90 backdrop-blur-md z-10">
        <div className="max-w-[780px] w-full mx-auto relative">
          <form onSubmit={handleSend} className="relative flex items-end gap-2 bg-[#0E1318] border border-[#1E2A35] rounded-xl p-2 focus-within:border-[#00C2FF]/50 focus-within:shadow-[0_0_12px_rgba(0,194,255,0.15)] transition-all">
            
            <button 
              type="button" 
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              title="Hold to speak"
              className={`p-2 transition-colors shrink-0 rounded-lg ${isRecording ? 'text-[#FF4D4D] animate-pulse' : 'text-[#6B7F8E] hover:text-[#00C2FF]'}`}
            >
              <Mic size={18} />
            </button>
            
            <input
              type="file"
              ref={chatFileInputRef}
              onChange={handleChatFileUpload}
              className="hidden"
            />

            <button 
              type="button" 
              onClick={() => chatFileInputRef.current?.click()}
              title="Attach a file"
              className="p-2 text-[#6B7F8E] hover:text-[#00C2FF] transition-colors shrink-0 rounded-lg"
            >
              <Paperclip size={18} />
            </button>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message JARVIS..."
              className="w-full max-h-32 min-h-[40px] bg-transparent border-0 focus:ring-0 resize-none text-sm text-[#E8EDF2] placeholder-[#6B7F8E] py-2 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
            />
            
            {isGenerating ? (
              <Button 
                type="button" 
                size="icon" 
                className="shrink-0 rounded-lg h-9 w-9 bg-[#FF4D4D] hover:bg-[#FF4D4D]/80 border-0 text-[#E8EDF2]"
                onClick={handleStop}
                title="Stop Generation"
              >
                <Square size={14} className="fill-current" />
              </Button>
            ) : (
              <Button 
                type="submit" 
                size="icon" 
                className="shrink-0 rounded-lg h-9 w-9 bg-[#00C2FF] text-[#080B0F] hover:bg-[#00C2FF]/80 border-0"
                disabled={!input.trim()}
              >
                <Send size={14} />
              </Button>
            )}
          </form>
          
          <div className="flex justify-between items-center mt-2 px-1 gap-4">
            <span className="text-xs text-[#6B7F8E] truncate">JARVIS Assistant &bull; AI can make mistakes.</span>
            
            {/* Token Counter Widget */}
            <div className="flex items-center space-x-2 text-xs font-mono text-[#00C2FF] bg-[#00C2FF]/5 px-2.5 py-0.5 rounded border border-[#00C2FF]/20 shrink-0">
              <span className="flex items-center" title="Tokens used in current chat">
                <span className="w-1.5 h-1.5 bg-[#00C2FF] rounded-full animate-pulse mr-1"></span>
                Tokens: <strong className="text-[#00C2FF] ml-0.5">{tokenUsage.total.toLocaleString()}</strong>
              </span>
              <span className="text-[#00C2FF]/30">|</span>
              <span className="text-[#00C2FF]/80 cursor-pointer hover:text-[#00C2FF] transition-colors" onClick={() => setActiveTab('settings')} title="View Limit">
                LIMIT: {userPreferences?.token_limit === 0 ? 'UNLIMITED' : (userPreferences?.token_limit?.toLocaleString() || '8,000')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Presence Floating Panel */}
      {isGenerating && (
        <div className="absolute right-6 top-6 w-64 pointer-events-none z-50 hidden lg:block">
          <div className="transition-all duration-500 rounded-xl bg-[#0E1318] border border-[#1E2A35] p-4 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                {/* Mini Voice Orb indicator */}
                <div className="w-8 h-8 flex items-center justify-center scale-50">
                  <VoiceOrb status={coreStatus} />
                </div>
              </div>
              <span className="text-xs font-mono font-semibold tracking-wider uppercase text-[#E8EDF2]">
                {coreStatus === 'THINKING' ? 'PROCESSING' : 'SPEAKING'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
