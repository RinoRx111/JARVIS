"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Plus, Loader2, Volume2, VolumeX, Square } from 'lucide-react';
import { motion } from 'framer-motion';
import { useJarvisStore } from '@/hooks/useJarvisStore';
import { wsService } from '@/services/websocket';
import { MessageBubble } from './MessageBubble';
import { ToolExecutionNode } from './ToolExecutionNode';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToolExecutionProps } from './ToolExecutionNode';
import { useWakeWord } from '@/hooks/useWakeWord';

export function ChatWindow() {
  const store = useJarvisStore();
  const { isListeningForWakeWord } = useWakeWord();
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

      mediaRecorder.start(); // Record until stopped
      setIsRecording(true);
      store.setCoreStatus('LISTENING');
    } catch (err) {
      console.error("Microphone access denied:", err);
      store.addNotification("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      store.setCoreStatus('THINKING');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [store.messages]);



  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    store.setPlan([]);
    wsService.sendTextMessage(input);
    setInput('');
  };



  const handleStop = () => {
    // 1. Cancel local browser speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    // 2. Stop ElevenLabs playback by clearing the URL
    store.setVoicePlaybackUrl(null);
    
    // 3. Reset core status to standby
    store.setCoreStatus('STANDBY');
    
    // 4. Send cancellation event instead of disconnecting websocket
    wsService.sendTextMessage(JSON.stringify({ type: "cancel" }));
    store.addNotification("Generation interrupted by user.");
  };

  const isGenerating = store.coreStatus === 'THINKING' || store.coreStatus === 'SPEAKING';

  return (
    <div className="flex flex-col h-full w-full relative">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div>
          <h1 className="text-lg font-medium text-white">JARVIS Assistant</h1>
          <p className="text-xs text-primary">All systems online</p>
        </div>
        <div className="flex items-center gap-2">
          {isListeningForWakeWord && (
            <div className="hidden md:flex items-center gap-2 mr-2 bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs text-primary font-medium">Listening for "JARVIS"</span>
            </div>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => store.setVoiceActive(!store.isVoiceActive)}
            className="text-muted-foreground hover:text-white"
            title={store.isVoiceActive ? "Mute Voice" : "Unmute Voice"}
          >
            {store.isVoiceActive ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              store.setToken(null);
              store.setUser(null);
              localStorage.removeItem('jarvis_token');
            }}
            className="text-muted-foreground hover:text-destructive"
            title="Sign Out"
          >
            Sign Out
          </Button>
          <Button variant="glass" size="sm" onClick={() => store.startNewChat()}>
            <Plus size={16} className="mr-2" />
            New Chat
          </Button>
        </div>
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
          <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
            {/* Proactive Alerts */}
            {store.alerts && store.alerts.map((alert: any, idx: number) => (
              <div key={`alert-${idx}`} className="my-4 mx-auto max-w-[90%] border border-yellow-500/30 bg-yellow-500/10 rounded-lg p-4 backdrop-blur-md animate-in fade-in slide-in-from-top-4">
                <div className="flex items-center gap-2 mb-2 text-yellow-500">
                  <span className="text-sm font-bold uppercase tracking-wider">{alert.title}</span>
                </div>
                <div className="text-sm text-white/90 whitespace-pre-wrap">
                  {alert.message}
                </div>
              </div>
            ))}

            {/* Conversation Messages */}
            {store.messages.map((msg, idx) => (
              <React.Fragment key={msg.id || idx}>
                <MessageBubble message={msg as any} />
                {msg.toolCalls && msg.toolCalls.map((tool, tIdx) => (
                  <ToolExecutionNode key={tIdx} tool={tool} index={tIdx} />
                ))}
              </React.Fragment>
            ))}
            
            {store.currentPlan && store.currentPlan.length > 0 && (
              <div className="my-4 ml-12 mr-auto max-w-[80%] border border-white/10 bg-black/40 rounded-lg p-3 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center gap-2 mb-2 text-primary">
                  <span className="text-xs font-semibold tracking-wider uppercase">Execution Plan</span>
                </div>
                <div className="flex flex-col gap-2">
                  {store.currentPlan.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <div className="shrink-0 w-4 h-4 rounded-full border border-white/20 flex items-center justify-center text-[9px] mt-0.5">
                        {idx + 1}
                      </div>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 md:px-12 lg:px-24 max-w-5xl mx-auto w-full z-10">
        <div className="relative">
          <form onSubmit={handleSend} className="relative flex items-end gap-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-lg focus-within:border-primary/50 focus-within:shadow-[0_0_15px_rgba(0,216,255,0.1)] transition-all">
            
            <button 
              type="button" 
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              title="Hold to speak"
              className={`p-3 transition-colors shrink-0 ${isRecording ? 'text-red-500 animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'text-muted-foreground hover:text-white'}`}
            >
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
            
            {isGenerating ? (
              <Button 
                type="button" 
                size="icon" 
                variant="destructive"
                className="shrink-0 rounded-xl"
                onClick={handleStop}
                title="Stop Generation"
              >
                <Square size={16} className="fill-current" />
              </Button>
            ) : (
              <Button 
                type="submit" 
                size="icon" 
                className="shrink-0 rounded-xl"
                disabled={!input.trim()}
              >
                <Send size={18} className="ml-1" />
              </Button>
            )}
          </form>
          
          <div className="flex justify-between items-center mt-2 px-1">
            <span className="text-[10px] text-muted-foreground">JARVIS OS v2.0 • AI can make mistakes. Consider verifying important information.</span>
            
            {/* Token Counter Widget */}
            <div className="flex items-center space-x-3 text-[10px] font-mono text-cyan-500/60 uppercase tracking-widest bg-cyan-500/5 px-3 py-1 rounded-full border border-cyan-500/20">
              <span className="flex items-center" title="Tokens used in current chat">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse mr-1.5 shadow-[0_0_5px_rgba(0,216,255,0.8)]"></span>
                Tokens Used: <strong className="text-cyan-400 ml-1">{store.tokenUsage.total.toLocaleString()}</strong>
              </span>
              <span className="text-cyan-500/30">|</span>
              <span className="text-cyan-500/80 cursor-pointer hover:text-cyan-300 transition-colors" onClick={() => store.setActiveTab('settings')} title="View Limit">
                LIMIT: {store.userPreferences?.token_limit?.toLocaleString() || '8,000'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Presence Floating Panel */}
      <div className="absolute right-6 top-24 w-64 pointer-events-none z-50 hidden lg:block">
        <div className={`transition-all duration-500 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10 p-5 shadow-2xl ${isGenerating ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-3 h-3 rounded-full ${store.coreStatus === 'THINKING' ? 'bg-yellow-500 animate-pulse shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-primary animate-pulse shadow-[0_0_10px_rgba(0,216,255,0.5)]'}`} />
            <span className="text-sm font-semibold tracking-wider uppercase text-white/90">
              {store.coreStatus === 'THINKING' ? 'PROCESSING' : 'SPEAKING'}
            </span>
          </div>
          
          {store.currentPlan && store.currentPlan.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <span className="text-[10px] uppercase text-muted-foreground font-semibold mb-3 block tracking-widest">Execution Plan</span>
              <div className="flex flex-col gap-3">
                {store.currentPlan.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs text-white/80">
                    <div className="shrink-0 w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[9px] text-primary mt-0.5">
                      {idx + 1}
                    </div>
                    <span className="leading-snug">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
