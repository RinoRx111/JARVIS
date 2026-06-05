'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal, Cpu, Layers, Bot, Globe, Mail, Calendar, Database, Settings, 
  Send, Mic, MicOff, Volume2, VolumeX, Plus, Trash2, Loader2, Play, 
  LogOut, Clock, Sparkles, Shield, ArrowRight, Lock, RefreshCw, User, 
  FileText, CheckCircle2, XCircle, AlertCircle, Inbox, ChevronRight, Upload, Search
} from 'lucide-react';

import { useJarvisStore, Message } from '../hooks/useJarvisStore';
import HolographicPanel from '../components/HolographicPanel';
import VoiceOrb from '../components/VoiceOrb';
import KnowledgeGraph from '../components/KnowledgeGraph';
import clsx from 'clsx';
import api from '../services/api';

// Inline Markdown Parser for Code Blocks and Tags
function parseMarkdown(text: string) {
  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    if (part.startsWith('```')) {
      const match = part.match(/```(\w*)\n([\s\S]*?)```/);
      const language = match ? match[1] : '';
      const code = match ? match[2] : part.slice(3, -3);
      return (
        <div key={i} className="my-3 font-mono-digital text-[11px] bg-black/60 border border-cyan-500/20 rounded p-3 relative group">
          <div className="absolute top-1 right-2 text-[9px] text-cyan-500/40 uppercase font-sans font-bold">
            {language || 'code'}
          </div>
          <pre className="overflow-x-auto text-cyan-300 whitespace-pre-wrap">{code.trim()}</pre>
        </div>
      );
    }
    
    const inlineParts = part.split(/(`[^`\n]+`)/g);
    return (
      <p key={i} className="mb-2.5 leading-relaxed text-xs">
        {inlineParts.map((subPart, j) => {
          if (subPart.startsWith('`') && subPart.endsWith('`')) {
            return (
              <code key={j} className="px-1.5 py-0.5 bg-cyan-950/60 border border-cyan-500/25 rounded text-cyan-400 font-mono text-[10px]">
                {subPart.slice(1, -1)}
              </code>
            );
          }
          return subPart;
        })}
      </p>
    );
  });
}

export default function HomePage() {
  const store = useJarvisStore();
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [timeStr, setTimeStr] = useState('');

  // Audio elements & Recording states
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Form inputs
  const [chatInput, setChatInput] = useState('');
  const [agentTitle, setAgentTitle] = useState('');
  const [agentDesc, setAgentDesc] = useState('');
  const [browseUrlInput, setBrowseUrlInput] = useState('https://news.ycombinator.com');
  const [newMemoryInput, setNewMemoryInput] = useState('');
  const [memorySearchQuery, setMemorySearchQuery] = useState('');
  const [mailTo, setMailTo] = useState('');
  const [mailSubject, setMailSubject] = useState('');
  const [mailBody, setMailBody] = useState('');
  const [calSummary, setCalSummary] = useState('');
  const [calStart, setCalStart] = useState('');
  const [calEnd, setCalEnd] = useState('');
  const [calDesc, setCalDesc] = useState('');

  // Chat window auto-scroller
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Digital Clock and Stats ticker loop
  useEffect(() => {
    const clockTimer = setInterval(() => {
      const d = new Date();
      setTimeStr(d.toLocaleTimeString() + ' | ' + d.toLocaleDateString());
      store.updateSystemStats();
    }, 1000);

    store.checkAuth();

    return () => {
      clearInterval(clockTimer);
      store.closeWebSocket();
    };
  }, []);

  // Sync WebSocket on voice mode status change
  useEffect(() => {
    if (store.token && store.wsConnected === false) {
      store.initWebSocket();
    }
  }, [store.token]);

  // Voice output playback trigger
  useEffect(() => {
    if (store.voicePlaybackUrl && audioPlayerRef.current) {
      audioPlayerRef.current.src = `http://localhost:8000${store.voicePlaybackUrl}`;
      audioPlayerRef.current.play().catch(e => console.error("Playback failed", e));
    }
  }, [store.voicePlaybackUrl]);

  // Scroll chat list to bottom on message list updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [store.messages]);

  // Handle tab switching fetches
  useEffect(() => {
    if (!store.user) return;
    if (store.activeTab === 'agents') {
      store.fetchAgentTasks();
      store.fetchAuditLogs();
    } else if (store.activeTab === 'memory') {
      store.fetchMemories();
    } else if (store.activeTab === 'gmail') {
      store.fetchEmails();
    } else if (store.activeTab === 'calendar') {
      store.fetchEvents();
      store.fetchSuggestions();
    } else if (store.activeTab === 'dashboard') {
      store.fetchAgentTasks();
    }
  }, [store.activeTab, store.user]);

  // Microphone recording controller
  const startRecording = async () => {
    setIsRecording(true);
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        store.sendVoiceChunk(audioBlob);
      };

      recorder.start();
      store.setCoreStatus('LISTENING');
      store.addNotification("Voice recorder streaming buffer active.");
    } catch (err) {
      console.error("Mic access denied:", err);
      setIsRecording(false);
      store.addNotification("System error: Microphone access denied by client host.");
      store.setCoreStatus('STANDBY');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // MediaStream tracks release
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      store.setCoreStatus('STANDBY');
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    store.sendChatMessage(chatInput);
    setChatInput('');
  };

  const handleCreateAgentTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentTitle.trim()) return;
    store.createAgentTask(agentTitle, agentDesc);
    setAgentTitle('');
    setAgentDesc('');
  };

  const handleRunBrowser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!browseUrlInput.trim()) return;
    store.runBrowserAutomation(browseUrlInput);
  };

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryInput.trim()) return;
    store.addMemory(newMemoryInput);
    setNewMemoryInput('');
  };

  const handleSendMail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mailTo.trim() || !mailSubject.trim()) return;
    const success = await store.sendEmail(mailTo, mailSubject, mailBody);
    if (success) {
      setMailTo('');
      setMailSubject('');
      setMailBody('');
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calSummary.trim() || !calStart.trim() || !calEnd.trim()) return;
    const success = await store.createEvent(
      calSummary, 
      new Date(calStart).toISOString(), 
      new Date(calEnd).toISOString(), 
      calDesc
    );
    if (success) {
      setCalSummary('');
      setCalStart('');
      setCalEnd('');
      setCalDesc('');
    }
  };

  // Auth Submit
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) return;
    
    let success = false;
    if (authMode === 'login') {
      success = await store.login(emailInput, passwordInput);
    } else {
      success = await store.register(emailInput, passwordInput);
    }

    if (!success) {
      alert("System Authentication Denied. Check credentials.");
    }
  };

  // 1. UNAUTHENTICATED LOCK SCREEN
  if (!store.token && !store.authLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden font-mono-digital">
        {/* Background visual gradients */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-cyan-500 rounded-full filter blur-[130px] opacity-10 pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-500 rounded-full filter blur-[130px] opacity-5 pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="z-10 w-full max-w-md glass-panel rounded-xl p-8 border border-cyan-500/25 shadow-[0_0_60px_rgba(0,243,255,0.07)]"
        >
          {/* Header OS details */}
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-16 h-16 rounded-full border border-cyan-500/40 flex items-center justify-center animate-pulse mb-3 bg-cyan-950/25">
              <Terminal className="w-8 h-8 text-cyan-400" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-widest text-cyan-400 font-orbitron text-neon-cyan">JARVIS</h1>
            <p className="text-[10px] text-cyan-500/60 uppercase tracking-[0.3em] mt-1.5">Futuristic AI Operating System</p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] text-cyan-400/70 uppercase tracking-widest mb-1">Grid Identity (Email)</label>
              <input
                type="email"
                placeholder="stark@starkindustries.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full bg-slate-950/80 border border-cyan-500/20 rounded px-3 py-2 text-xs text-cyan-300 placeholder-cyan-900/60 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(0,243,255,0.1)]"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] text-cyan-400/70 uppercase tracking-widest mb-1">Passkey (Password)</label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-slate-950/80 border border-cyan-500/20 rounded px-3 py-2 text-xs text-cyan-300 placeholder-cyan-900/60 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(0,243,255,0.1)]"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-500/40 hover:border-cyan-400 text-cyan-400 hover:text-white py-2 rounded text-xs font-bold uppercase tracking-widest transition-all duration-300 mt-2 flex items-center justify-center space-x-2"
            >
              <span>{authMode === 'login' ? 'Establish Link' : 'Register Identity'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Toggle login vs register */}
          <div className="mt-6 border-t border-cyan-500/10 pt-4 text-center">
            <button
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              className="text-[10px] text-cyan-500/50 hover:text-cyan-400 uppercase tracking-widest transition-all"
            >
              {authMode === 'login' 
                ? 'Request new access identity index >' 
                : 'Already registered? Establish link >'}
            </button>
          </div>
        </motion.div>
      </main>
    );
  }

  // Loading spinner during authorization checks
  if (store.authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-cyan-400 font-mono-digital tracking-widest text-xs uppercase animate-pulse">
        <Loader2 className="w-6 h-6 animate-spin mr-3 text-cyan-500" />
        Synchronizing console authorization grid...
      </div>
    );
  }

  // 2. MAIN SECURED DASHBOARD LAYOUT
  return (
    <main className="flex flex-col min-h-screen relative font-mono-digital text-xs">
      
      {/* Invisible audio player for synth feedback */}
      <audio ref={audioPlayerRef} className="hidden" />

      {/* TOP HEADER CONSOLE BAR */}
      <header className="border-b border-cyan-500/15 bg-slate-950/80 backdrop-filter backdrop-blur-md px-6 py-3.5 flex justify-between items-center z-40 relative">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,243,255,0.7)] animate-pulse" />
            <h1 className="text-xl font-black font-orbitron tracking-widest text-neon-cyan select-none">JARVIS OS</h1>
          </div>
          <span className="text-white/20">|</span>
          <div className="flex items-center space-x-2 bg-cyan-950/35 border border-cyan-500/25 px-2.5 py-0.5 rounded-full">
            <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider">CORE: {store.coreStatus}</span>
          </div>
        </div>

        {/* Dynamic Digital Statuses */}
        <div className="hidden md:flex items-center space-x-6 text-[10px] text-cyan-500/60">
          <div className="flex space-x-2">
            <span>CPU:</span>
            <span className="text-cyan-400 font-bold">{store.cpuUsage}%</span>
          </div>
          <div className="flex space-x-2">
            <span>RAM:</span>
            <span className="text-cyan-400 font-bold">{store.ramUsage}%</span>
          </div>
          <div className="flex space-x-2">
            <span>UPLINK:</span>
            <span className={store.wsConnected ? "text-emerald-400 font-bold animate-pulse" : "text-amber-500"}>
              {store.wsConnected ? "ACTIVE" : "STANDBY"}
            </span>
          </div>
          <div className="flex space-x-1.5 items-center">
            <Clock className="w-3.5 h-3.5 text-cyan-500/40" />
            <span className="text-cyan-300 select-none">{timeStr}</span>
          </div>
        </div>

        {/* User context action button */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] text-cyan-200 select-all uppercase tracking-wider">{store.user?.email.split('@')[0]}</span>
            <span className="text-[8px] bg-cyan-950 border border-cyan-500/30 text-cyan-400 px-1 py-0.2 rounded font-bold uppercase tracking-widest">
              {store.user?.role}
            </span>
          </div>
          <button
            onClick={store.logout}
            className="p-1.5 bg-red-950/30 border border-red-500/20 hover:border-red-500/50 rounded text-red-400 hover:text-white transition-all"
            title="Disconnect operating system console"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* CORE WORKSPACE GRID */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* SIDEBAR NAVIGATION PANEL */}
        <aside className="w-18 md:w-56 border-r border-cyan-500/15 bg-slate-950/50 p-3 flex flex-col justify-between z-30 select-none">
          <div className="space-y-1">
            <div className="text-[9px] text-cyan-500/40 uppercase tracking-widest mb-3 hidden md:block px-2">Console Subsystems</div>
            {[
              { id: 'dashboard', label: 'Systems Status', icon: Cpu },
              { id: 'chat', label: 'Conversational HUD', icon: Terminal },
              { id: 'agents', label: 'Agent Workspace', icon: Bot },
              { id: 'browser', label: 'Virtual Browser', icon: Globe },
              { id: 'memory', label: 'Cognitive Center', icon: Database },
              { id: 'gmail', label: 'Gmail Center', icon: Mail },
              { id: 'calendar', label: 'Calendar Hub', icon: Calendar },
              { id: 'settings', label: 'Core Configs', icon: Settings }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = store.activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => store.setActiveTab(tab.id as any)}
                  className={clsx(
                    'w-full flex items-center p-2.5 rounded transition-all duration-300 border',
                    isActive 
                      ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 font-bold shadow-[inset_0_0_8px_rgba(0,243,255,0.08)]' 
                      : 'border-transparent hover:bg-cyan-950/15 text-cyan-500/60 hover:text-cyan-400'
                  )}
                >
                  <Icon className={clsx("w-4 h-4", isActive ? "text-cyan-400 animate-pulse" : "")} />
                  <span className="ml-3 hidden md:inline text-xs uppercase tracking-wider">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick HUD Metrics */}
          <div className="hidden md:block border-t border-cyan-500/10 pt-4 space-y-3 font-mono-digital text-[9px] text-cyan-500/50">
            <div>
              <div className="flex justify-between mb-1">
                <span>MEM_FACTS:</span>
                <span className="text-cyan-400">{store.memories.length}</span>
              </div>
              <div className="w-full bg-slate-900 h-1 rounded overflow-hidden">
                <div className="bg-cyan-500 h-full" style={{ width: `${Math.min(store.memories.length * 10, 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span>BG_TASKS:</span>
                <span className="text-cyan-400">
                  {store.agentTasks.filter(t => t.status === 'running').length} RUNNING
                </span>
              </div>
              <div className="w-full bg-slate-900 h-1 rounded overflow-hidden">
                <div 
                  className="bg-amber-500 h-full animate-pulse" 
                  style={{ width: store.agentTasks.length > 0 ? `${(store.agentTasks.filter(t => t.status === 'completed').length / store.agentTasks.length) * 100}%` : '0%' }} 
                />
              </div>
            </div>
            <div className="text-[8px] text-center border border-cyan-500/10 p-1.5 bg-cyan-950/10 rounded uppercase">
              GRID VER: 1.0.0 (SECURE)
            </div>
          </div>
        </aside>

        {/* CENTRAL DISPLAY STAGE */}
        <section className="flex-1 overflow-y-auto p-6 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={store.activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6 max-w-6xl mx-auto"
            >
              
              {/* ==================== 1. SYSTEMS STATUS DASHBOARD ==================== */}
              {store.activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Digital welcome ticker */}
                  <div className="flex items-center space-x-2 bg-cyan-950/20 border border-cyan-500/20 px-4 py-2.5 rounded-lg">
                    <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />
                    <span className="text-cyan-300 font-bold uppercase tracking-wider">JARVIS MAIN DECISIONS PANEL ACTIVE</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* System load dials */}
                    <HolographicPanel title="CPU Diagnostic Analyzer" tag="SYS_LOAD">
                      <div className="flex flex-col items-center justify-center py-6 space-y-4">
                        <div className="w-24 h-24 rounded-full border-4 border-dashed border-cyan-400/20 flex items-center justify-center animate-spin">
                          <div className="w-16 h-16 rounded-full border border-cyan-400/50 flex flex-col items-center justify-center">
                            <span className="text-lg font-bold text-cyan-400">{store.cpuUsage}%</span>
                          </div>
                        </div>
                        <div className="w-full space-y-1">
                          <div className="flex justify-between text-[10px] text-white/50">
                            <span>CORES ALLOCATED:</span>
                            <span>8 / 8 THREADS</span>
                          </div>
                          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-cyan-400 h-full transition-all duration-500" style={{ width: `${store.cpuUsage}%` }} />
                          </div>
                        </div>
                      </div>
                    </HolographicPanel>

                    <HolographicPanel title="RAM Memory Allocation" tag="RAM_STABLE">
                      <div className="flex flex-col items-center justify-center py-6 space-y-4">
                        <div className="w-24 h-24 rounded-full border-4 border-dashed border-cyan-500/20 flex items-center justify-center animate-spin" style={{ animationDirection: 'reverse' }}>
                          <div className="w-16 h-16 rounded-full border border-cyan-500/40 flex flex-col items-center justify-center">
                            <span className="text-lg font-bold text-cyan-400">{store.ramUsage}%</span>
                          </div>
                        </div>
                        <div className="w-full space-y-1">
                          <div className="flex justify-between text-[10px] text-white/50">
                            <span>COMMITTED INDEX:</span>
                            <span>6.4 GB / 16.0 GB</span>
                          </div>
                          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-cyan-400 h-full transition-all duration-500" style={{ width: `${store.ramUsage}%` }} />
                          </div>
                        </div>
                      </div>
                    </HolographicPanel>

                    {/* Active files drop and list */}
                    <HolographicPanel title="Files Storage Index" tag="CHROMA_VECTORS">
                      <div className="space-y-4">
                        <div className="flex space-x-2">
                          <label className="flex-1 bg-cyan-950/20 hover:bg-cyan-950/45 border border-dashed border-cyan-500/30 hover:border-cyan-500/60 rounded px-3 py-4 flex flex-col items-center justify-center cursor-pointer transition-all">
                            <Upload className="w-5 h-5 text-cyan-400 animate-bounce mb-1" />
                            <span className="text-[10px] text-cyan-300 font-bold uppercase">Load Document File</span>
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) store.uploadFile(file);
                              }}
                            />
                          </label>
                        </div>
                        <div className="max-h-28 overflow-y-auto space-y-1.5">
                          {store.files.length === 0 ? (
                            <p className="text-white/20 italic text-center py-4">No active document vectors tracked.</p>
                          ) : (
                            store.files.map((file) => (
                              <div key={file.id} className="flex justify-between items-center p-1.5 bg-slate-900/50 rounded border border-cyan-500/10">
                                <span className="text-[10px] text-cyan-300 font-bold truncate max-w-40">{file.filename}</span>
                                <span className={clsx("text-[8px] px-1 py-0.2 rounded font-bold uppercase", {
                                  'bg-emerald-950 border border-emerald-500/40 text-emerald-400': file.status === 'completed',
                                  'bg-amber-950 border border-amber-500/40 text-amber-400 animate-pulse': file.status === 'processing' || file.status === 'pending',
                                  'bg-red-950 border border-red-500/40 text-red-400': file.status === 'failed'
                                })}>
                                  {file.status}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </HolographicPanel>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Real-time floating console notifications logs */}
                    <div className="md:col-span-2">
                      <HolographicPanel title="Operating System Terminal Logs" tag="TTY_FEED">
                        <div className="bg-black/60 rounded border border-cyan-500/10 p-3 h-56 overflow-y-auto font-mono-digital text-[11px] space-y-1.5 text-cyan-300 leading-relaxed shadow-[inset_0_0_15px_rgba(0,0,0,0.5)]">
                          {store.notifications.map((log, index) => (
                            <div key={index} className="border-b border-white/5 pb-1 select-all hover:bg-cyan-950/10">
                              <span className="text-cyan-500/50 mr-1">&gt;</span>
                              {log}
                            </div>
                          ))}
                        </div>
                      </HolographicPanel>
                    </div>

                    {/* Active tasks scheduler status */}
                    <HolographicPanel title="Background Tasks Scheduler" tag="AGENT_JOBS">
                      <div className="space-y-3 h-56 overflow-y-auto pr-1">
                        {store.agentTasks.length === 0 ? (
                          <div className="text-white/20 italic text-center py-12">No active tasks in scheduler.</div>
                        ) : (
                          store.agentTasks.slice(0, 5).map((task) => (
                            <div key={task.id} className="border border-white/5 bg-slate-900/40 p-2.5 rounded hover:border-cyan-500/20 transition-all">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-cyan-300 text-[10px] truncate max-w-32 uppercase">{task.title}</span>
                                <span className={clsx("text-[8px] font-bold px-1.5 py-0.2 rounded uppercase", {
                                  'bg-emerald-950 text-emerald-400 border border-emerald-500/30': task.status === 'completed',
                                  'bg-amber-950 text-amber-400 border border-amber-500/30 animate-pulse': task.status === 'running',
                                  'bg-red-950 text-red-400 border border-red-500/30': task.status === 'failed',
                                  'bg-slate-800 text-white/50': task.status === 'pending'
                                })}>
                                  {task.status}
                                </span>
                              </div>
                              <span className="text-[9px] text-white/45 truncate block">{task.description || 'No detailed scope.'}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </HolographicPanel>
                  </div>
                </div>
              )}

              {/* ==================== 2. CONVERSATIONAL HUD & VOICE ORB ==================== */}
              {store.activeTab === 'chat' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Chat logs timeline */}
                  <div className="lg:col-span-2 flex flex-col h-[520px]">
                    <HolographicPanel 
                      title="JARVIS Conversational Matrix" 
                      tag="TEXT_VOICE_UPLINK"
                      className="flex-1 flex flex-col h-full overflow-hidden"
                      headerActions={
                        <div className="flex items-center space-x-3 text-[10px]">
                          <button
                            onClick={() => store.setVoiceActive(!store.isVoiceActive)}
                            className={clsx("flex items-center space-x-1.5 px-2 py-1 rounded transition-all", 
                              store.isVoiceActive 
                                ? "bg-cyan-500/20 border border-cyan-500/30 text-cyan-300" 
                                : "bg-white/5 border border-white/10 text-white/40"
                            )}
                          >
                            {store.isVoiceActive ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                            <span>TTS {store.isVoiceActive ? 'ON' : 'OFF'}</span>
                          </button>
                        </div>
                      }
                    >
                      {/* Message lists */}
                      <div className="flex-1 overflow-y-auto pr-1 space-y-4 mb-4 max-h-[390px] min-h-[350px]">
                        {store.messages.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-center py-20 space-y-4 select-none">
                            <div className="w-12 h-12 rounded-full border border-cyan-500/20 flex items-center justify-center text-cyan-500/40">
                              <Terminal className="w-6 h-6 animate-pulse" />
                            </div>
                            <div>
                              <p className="text-cyan-400 font-bold uppercase tracking-wider">Secure Speech Channel Offline</p>
                              <p className="text-[10px] text-white/40 mt-1 max-w-xs">Type a command or engage the voice recorder to compile your request.</p>
                            </div>
                          </div>
                        ) : (
                          store.messages.map((msg, i) => (
                            <div
                              key={msg.id || i}
                              className={clsx(
                                "flex flex-col max-w-[85%] p-3 rounded-lg border leading-relaxed relative",
                                msg.role === 'user'
                                  ? "ml-auto bg-cyan-950/20 border-cyan-500/20 text-cyan-100 rounded-br-none"
                                  : "bg-slate-950/50 border-white/5 text-cyan-200 rounded-bl-none"
                              )}
                            >
                              <div className="text-[9px] uppercase tracking-wider opacity-40 font-mono-digital mb-1.5 flex justify-between items-center">
                                <span>{msg.role === 'user' ? 'Operator' : 'JARVIS'}</span>
                                {msg.voice_url && (
                                  <Volume2 className="w-3 h-3 text-cyan-400 animate-pulse" />
                                )}
                              </div>
                              <div>{parseMarkdown(msg.content)}</div>
                            </div>
                          ))
                        )}
                        <div ref={chatEndRef} />
                      </div>

                      {/* Controls Footer */}
                      <form onSubmit={handleSendChat} className="border-t border-cyan-500/10 pt-3 flex space-x-2">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder={isRecording ? "Listening to voice stream..." : "Establish dialogue context..."}
                          disabled={isRecording}
                          className="flex-1 bg-slate-950/80 border border-cyan-500/20 rounded px-3.5 py-2 text-xs text-cyan-300 placeholder-cyan-900/60 focus:outline-none focus:border-cyan-400"
                        />
                        <button
                          type="button"
                          onClick={isRecording ? stopRecording : startRecording}
                          className={clsx(
                            "px-3 rounded border flex items-center justify-center transition-all",
                            isRecording 
                              ? "bg-rose-500/20 border-rose-500/50 text-rose-400 animate-pulse" 
                              : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20"
                          )}
                          title={isRecording ? "Stop listening voice feed" : "Stream speech mic feed"}
                        >
                          {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </button>
                        <button
                          type="submit"
                          className="bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:text-white px-4 rounded font-bold uppercase tracking-wider"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    </HolographicPanel>
                  </div>

                  {/* Dynamic HUD Voice Reactor Core */}
                  <HolographicPanel title="Core Consciousness Visualizer" tag="ARC_REACTOR_CORE">
                    <div className="flex flex-col items-center justify-center min-h-[400px] h-full">
                      <VoiceOrb status={store.coreStatus} isWebSocket={store.wsConnected} />
                    </div>
                  </HolographicPanel>
                </div>
              )}

              {/* ==================== 3. AGENT WORKSPACE TIMELINE ==================== */}
              {store.activeTab === 'agents' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Create task triggers */}
                  <div className="space-y-6">
                    <HolographicPanel title="Queue Cogitive Task" tag="AGENT_PLANNER">
                      <form onSubmit={handleCreateAgentTask} className="space-y-4">
                        <div>
                          <label className="block text-[10px] text-cyan-400/60 uppercase tracking-widest mb-1">Task Title / Query</label>
                          <input
                            type="text"
                            placeholder="Fetch recent tech news and log summary..."
                            value={agentTitle}
                            onChange={(e) => setAgentTitle(e.target.value)}
                            className="w-full bg-slate-950/80 border border-cyan-500/20 rounded px-3 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-cyan-400/60 uppercase tracking-widest mb-1">Detailed Context / Directives</label>
                          <textarea
                            placeholder="Check hacker news home layout, summarize top 3 posts, and save key findings to database memories."
                            rows={4}
                            value={agentDesc}
                            onChange={(e) => setAgentDesc(e.target.value)}
                            className="w-full bg-slate-950/80 border border-cyan-500/20 rounded px-3 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 py-2 rounded font-bold uppercase tracking-wider hover:bg-cyan-500/30 transition-all flex items-center justify-center space-x-2"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Dispatch Agent</span>
                        </button>
                      </form>
                    </HolographicPanel>
                    
                    <HolographicPanel title="Active Cognitive Core" tag="LANGGRAPH_AGENTS">
                      <div className="space-y-3 font-mono-digital text-[10px] text-cyan-300">
                        <div className="flex justify-between border-b border-white/5 pb-1">
                          <span className="text-white/40">Orchestrator Node:</span>
                          <span className="text-emerald-400 font-bold">ACTIVE</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-1">
                          <span className="text-white/40">ResearchAgent:</span>
                          <span className="text-emerald-400 font-bold">READY</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-1">
                          <span className="text-white/40">BrowserController:</span>
                          <span className="text-cyan-400">PLAYWRIGHT_UP</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/40">Tool Box Registry:</span>
                          <span className="text-cyan-400">12 TOOLS LOADED</span>
                        </div>
                      </div>
                    </HolographicPanel>
                  </div>

                  {/* Timeline logs of agent executions */}
                  <div className="lg:col-span-2">
                    <HolographicPanel title="Agent Executions & Audit Trails" tag="LANGGRAPH_AUDITS">
                      <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                        {store.auditLogs.length === 0 ? (
                          <div className="text-white/20 italic text-center py-24">No tool calls or audits logged.</div>
                        ) : (
                          store.auditLogs.map((log) => (
                            <div key={log.id} className="border border-cyan-500/15 bg-slate-900/30 p-3.5 rounded-lg space-y-2.5">
                              <div className="flex justify-between items-center text-[10px] border-b border-white/5 pb-1.5">
                                <div className="flex items-center space-x-2">
                                  <span className="font-bold text-cyan-400 uppercase tracking-wider">{log.agent_name || 'Agent'}</span>
                                  <span className="text-white/20">&gt;</span>
                                  <span className="text-white/60 font-mono">{log.action}</span>
                                </div>
                                <span className={clsx("text-[8px] font-bold px-1.5 py-0.2 rounded uppercase", {
                                  'bg-emerald-950 text-emerald-400 border border-emerald-500/30': log.status === 'success',
                                  'bg-red-950 text-red-400 border border-red-500/30': log.status === 'failure',
                                  'bg-amber-950 text-amber-400 border border-amber-500/30 animate-pulse': log.status === 'pending_user_consent'
                                })}>
                                  {log.status}
                                </span>
                              </div>
                              {log.parameters && (
                                <div>
                                  <span className="text-[9px] text-white/30 block mb-0.5">Parameters:</span>
                                  <pre className="text-[10px] text-amber-200/80 bg-black/40 rounded p-1.5 overflow-x-auto whitespace-pre-wrap">{log.parameters}</pre>
                                </div>
                              )}
                              {log.response && (
                                <div>
                                  <span className="text-[9px] text-white/30 block mb-0.5">Response:</span>
                                  <pre className="text-[10px] text-cyan-300/80 bg-black/40 rounded p-1.5 overflow-x-auto whitespace-pre-wrap">{log.response}</pre>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </HolographicPanel>
                  </div>
                </div>
              )}

              {/* ==================== 4. VIRTUAL BROWSER SANDBOX ==================== */}
              {store.activeTab === 'browser' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Controls */}
                  <div className="space-y-6">
                    <HolographicPanel title="Browser Navigation Console" tag="BROWSER_CMD">
                      <form onSubmit={handleRunBrowser} className="space-y-4">
                        <div>
                          <label className="block text-[10px] text-cyan-400/60 uppercase tracking-widest mb-1">Target Address (URL)</label>
                          <input
                            type="url"
                            placeholder="https://news.ycombinator.com"
                            value={browseUrlInput}
                            onChange={(e) => setBrowseUrlInput(e.target.value)}
                            className="w-full bg-slate-950/80 border border-cyan-500/20 rounded px-3 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400"
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={store.browserStatus === 'running'}
                          className="w-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 py-2.5 rounded font-bold uppercase tracking-wider hover:bg-cyan-500/30 transition-all flex items-center justify-center space-x-2"
                        >
                          {store.browserStatus === 'running' ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                              <span>Automating...</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5" />
                              <span>Initialize Sandbox Navigation</span>
                            </>
                          )}
                        </button>
                      </form>
                    </HolographicPanel>
                    
                    <HolographicPanel title="Playwright Execution Logs" tag="BROWSER_TTY">
                      <div className="space-y-2 max-h-56 overflow-y-auto text-[10px] font-mono-digital text-cyan-400 leading-normal">
                        {store.browserActionsLog.length === 0 ? (
                          <p className="text-white/20 italic text-center py-12">Waiting for virtual display instructions...</p>
                        ) : (
                          store.browserActionsLog.map((act, i) => (
                            <div key={i} className="flex items-center space-x-2 py-0.5 border-b border-white/5">
                              <span className="text-cyan-500/40">&gt;</span>
                              <span>{act}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </HolographicPanel>
                  </div>

                  {/* Browser Virtual Display screen */}
                  <div className="lg:col-span-2">
                    <HolographicPanel 
                      title="Virtual Frame Display Monitor" 
                      tag="PLAYWRIGHT_SCREEN"
                      className="h-full min-h-[480px] flex flex-col justify-between"
                    >
                      {store.browserScreenshotUrl ? (
                        <div className="space-y-4">
                          {/* Screenshot visual container */}
                          <div className="border border-cyan-500/30 rounded bg-slate-900/80 overflow-hidden relative group">
                            <img
                              src={`http://localhost:8000${store.browserScreenshotUrl}`}
                              alt="Browser Virtual Viewport"
                              className="w-full h-auto max-h-[360px] object-top object-cover"
                            />
                            <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-all pointer-events-none" />
                          </div>
                          
                          {/* Title and metadata details */}
                          <div className="border-t border-cyan-500/10 pt-3">
                            <span className="text-[9px] text-white/30 block mb-1">WEBPAGE_TITLE:</span>
                            <span className="text-xs text-cyan-300 font-bold block">{store.browserTitle}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center min-h-[380px] text-center border border-dashed border-cyan-500/10 rounded-lg py-20 space-y-4">
                          {store.browserStatus === 'running' ? (
                            <>
                              <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                              <p className="text-cyan-400 font-bold uppercase tracking-widest animate-pulse">Navigating Virtual Grid Frame...</p>
                            </>
                          ) : (
                            <>
                              <Globe className="w-10 h-10 text-cyan-500/20" />
                              <div>
                                <p className="text-white/40 uppercase tracking-widest">Virtual Stream Standby</p>
                                <p className="text-[9px] text-white/20 mt-1">Submit a URL to launch Playwright Chromium instance</p>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </HolographicPanel>
                  </div>
                </div>
              )}

              {/* ==================== 5. COGNITIVE MEMORY CENTER ==================== */}
              {store.activeTab === 'memory' && (
                <div className="space-y-6">
                  {/* Entity nodes diagram */}
                  <HolographicPanel title="Cognitive Association Graph Map" tag="KNOWLEDGE_WEB">
                    <KnowledgeGraph memories={store.memories} />
                  </HolographicPanel>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Add factual inputs */}
                    <HolographicPanel title="Register Cognitive Memory" tag="MEM_INSERT">
                      <form onSubmit={handleAddMemory} className="space-y-4">
                        <div>
                          <label className="block text-[10px] text-cyan-400/60 uppercase tracking-widest mb-1">Fact Content</label>
                          <textarea
                            placeholder="Operator prefers coding in Next.js Tailwind systems..."
                            rows={3}
                            value={newMemoryInput}
                            onChange={(e) => setNewMemoryInput(e.target.value)}
                            className="w-full bg-slate-950/80 border border-cyan-500/20 rounded px-3 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400"
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 py-2 rounded font-bold uppercase tracking-wider hover:bg-cyan-500/30 transition-all flex items-center justify-center space-x-2"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Index Memory</span>
                        </button>
                      </form>
                    </HolographicPanel>

                    {/* Search and grid lists */}
                    <div className="md:col-span-2">
                      <HolographicPanel 
                        title="Search Vector Memory Core" 
                        tag="CHROMA_FACTS_GRID"
                        headerActions={
                          <div className="flex items-center space-x-2 bg-black/40 border border-cyan-500/20 px-2 py-1 rounded">
                            <Search className="w-3.5 h-3.5 text-cyan-500/40" />
                            <input
                              type="text"
                              placeholder="Query memory..."
                              value={memorySearchQuery}
                              onChange={(e) => {
                                setMemorySearchQuery(e.target.value);
                                store.fetchMemories(e.target.value);
                              }}
                              className="bg-transparent text-[10px] text-cyan-300 focus:outline-none w-28 placeholder-cyan-900/60 font-mono-digital"
                            />
                          </div>
                        }
                      >
                        <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                          {store.memories.length === 0 ? (
                            <p className="text-white/20 italic text-center py-12">No memory units indexed matches query.</p>
                          ) : (
                            store.memories.map((mem) => (
                              <div key={mem.id} className="flex justify-between items-start p-2.5 bg-slate-900/40 rounded border border-cyan-500/10 hover:border-cyan-500/30 transition-all group">
                                <div className="space-y-1 max-w-[90%]">
                                  <span className="text-[10px] text-cyan-200 leading-normal block">{mem.content}</span>
                                  <span className="text-[8px] text-white/35 font-mono select-all">INDEX: {mem.id}</span>
                                </div>
                                <button
                                  onClick={() => store.deleteMemory(mem.id)}
                                  className="text-red-400/40 hover:text-red-400 p-1 bg-red-950/10 hover:bg-red-950/40 rounded border border-red-500/10 transition-all"
                                  title="Erase memory token"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </HolographicPanel>
                    </div>
                  </div>
                </div>
              )}

              {/* ==================== 6. GMAIL COMMUNICATIONS CENTER ==================== */}
              {store.activeTab === 'gmail' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Create email form */}
                  <HolographicPanel title="Draft Secure Dispatch" tag="GMAIL_SMTP">
                    <form onSubmit={handleSendMail} className="space-y-4">
                      <div>
                        <label className="block text-[10px] text-cyan-400/60 uppercase tracking-widest mb-1">To (Recipient)</label>
                        <input
                          type="email"
                          placeholder="pepper.potts@starkindustries.com"
                          value={mailTo}
                          onChange={(e) => setMailTo(e.target.value)}
                          className="w-full bg-slate-950/80 border border-cyan-500/20 rounded px-3 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-cyan-400/60 uppercase tracking-widest mb-1">Subject</label>
                        <input
                          type="text"
                          placeholder="Decoupled reactor thermal margins"
                          value={mailSubject}
                          onChange={(e) => setMailSubject(e.target.value)}
                          className="w-full bg-slate-950/80 border border-cyan-500/20 rounded px-3 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-cyan-400/60 uppercase tracking-widest mb-1">Body Context</label>
                        <textarea
                          placeholder="Write mail details..."
                          rows={5}
                          value={mailBody}
                          onChange={(e) => setMailBody(e.target.value)}
                          className="w-full bg-slate-950/80 border border-cyan-500/20 rounded px-3 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 py-2 rounded font-bold uppercase tracking-wider hover:bg-cyan-500/30 transition-all flex items-center justify-center space-x-2"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Mail</span>
                      </button>
                    </form>
                  </HolographicPanel>

                  {/* Mail inbox details */}
                  <div className="lg:col-span-2">
                    <HolographicPanel title="Decrypted Mail Inbox" tag="GMAIL_IMAP">
                      <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                        {store.emails.length === 0 ? (
                          <div className="text-white/20 italic text-center py-24">No messages parsed in inbox.</div>
                        ) : (
                          store.emails.map((mail) => (
                            <div key={mail.id} className="border border-cyan-500/10 bg-slate-900/40 p-3.5 rounded-lg space-y-2 hover:border-cyan-500/30 transition-all">
                              <div className="flex justify-between items-center text-[10px] border-b border-white/5 pb-1">
                                <span className="font-bold text-cyan-300 truncate max-w-xs">{mail.from}</span>
                                <span className="text-cyan-500/50 select-all font-mono">ID: {mail.id}</span>
                              </div>
                              <span className="text-[11px] text-cyan-100 font-bold block">{mail.subject}</span>
                              <p className="text-[10px] text-white/50 leading-relaxed">{mail.snippet}</p>
                              
                              {/* Smart Reply triggers */}
                              <div className="border-t border-cyan-500/5 pt-2 mt-2 flex justify-end">
                                <button
                                  onClick={async () => {
                                    const draft = await store.generateSmartReply(mail.id, mail.snippet);
                                    setMailTo(mail.from.match(/<([^>]+)>/)?.[1] || mail.from);
                                    setMailSubject(`Re: ${mail.subject}`);
                                    setMailBody(draft);
                                    store.addNotification("Smart Reply generated and loaded in editor.");
                                  }}
                                  className="flex items-center space-x-1 text-[9px] bg-cyan-500/10 hover:bg-cyan-500/25 border border-cyan-500/25 text-cyan-300 px-2 py-0.8 rounded tracking-wider uppercase transition-all"
                                >
                                  <Sparkles className="w-3 h-3 text-cyan-400" />
                                  <span>AI Smart Reply</span>
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </HolographicPanel>
                  </div>
                </div>
              )}

              {/* ==================== 7. CALENDAR AGENDA CENTER ==================== */}
              {store.activeTab === 'calendar' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Create calendar item */}
                  <HolographicPanel title="Synchronize Calendar Event" tag="CALENDAR_WRITE">
                    <form onSubmit={handleCreateEvent} className="space-y-4">
                      <div>
                        <label className="block text-[10px] text-cyan-400/60 uppercase tracking-widest mb-1">Event Summary</label>
                        <input
                          type="text"
                          placeholder="Reactor Core Calibration"
                          value={calSummary}
                          onChange={(e) => setCalSummary(e.target.value)}
                          className="w-full bg-slate-950/80 border border-cyan-500/20 rounded px-3 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-cyan-400/60 uppercase tracking-widest mb-1">Start Time</label>
                          <input
                            type="datetime-local"
                            value={calStart}
                            onChange={(e) => setCalStart(e.target.value)}
                            className="w-full bg-slate-950/80 border border-cyan-500/20 rounded px-2.5 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-cyan-400/60 uppercase tracking-widest mb-1">End Time</label>
                          <input
                            type="datetime-local"
                            value={calEnd}
                            onChange={(e) => setCalEnd(e.target.value)}
                            className="w-full bg-slate-950/80 border border-cyan-500/20 rounded px-2.5 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] text-cyan-400/60 uppercase tracking-widest mb-1">Event Description</label>
                        <textarea
                          placeholder="Log thermal margin configurations..."
                          rows={3}
                          value={calDesc}
                          onChange={(e) => setCalDesc(e.target.value)}
                          className="w-full bg-slate-950/80 border border-cyan-500/20 rounded px-3 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 py-2 rounded font-bold uppercase tracking-wider hover:bg-cyan-500/30 transition-all flex items-center justify-center space-x-2"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Schedule Event</span>
                      </button>
                    </form>
                  </HolographicPanel>

                  {/* Calendar details */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Event lists */}
                    <HolographicPanel title="Calibrated Agenda Timeline" tag="GOOGLE_EVENTS">
                      <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                        {store.events.length === 0 ? (
                          <div className="text-white/20 italic text-center py-12">No agenda events synchronizing.</div>
                        ) : (
                          store.events.map((ev) => (
                            <div key={ev.id} className="flex border-l-2 border-cyan-500 bg-slate-900/30 p-3 rounded hover:bg-slate-900/50 transition-all justify-between items-start">
                              <div className="space-y-1 max-w-[85%]">
                                <span className="font-bold text-cyan-300 text-[11px] block">{ev.summary}</span>
                                {ev.description && <span className="text-[10px] text-white/45 block leading-normal">{ev.description}</span>}
                              </div>
                              <div className="text-right text-[9px] text-cyan-400 font-bold shrink-0">
                                <span>{new Date(ev.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                <span className="text-white/30 block mt-0.5">{new Date(ev.start).toLocaleDateString()}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </HolographicPanel>

                    {/* AI Suggestions slots */}
                    <HolographicPanel title="AI Schedule Optimizations" tag="JARVIS_SCHEDULER">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {store.scheduleSuggestions.length === 0 ? (
                          <div className="text-white/20 italic text-center py-6 col-span-2">Suggestions matrix standby.</div>
                        ) : (
                          store.scheduleSuggestions.map((sug, i) => (
                            <div key={i} className="border border-amber-500/20 bg-amber-950/5 p-3 rounded hover:border-amber-500/40 transition-all space-y-1.5">
                              <div className="flex justify-between items-center text-[10px] border-b border-white/5 pb-1">
                                <span className="font-bold text-amber-400 uppercase tracking-wider">{sug.title}</span>
                                <span className="text-amber-500 font-bold">{sug.time_range}</span>
                              </div>
                              <p className="text-[10px] text-amber-200/80 leading-normal">{sug.reason}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </HolographicPanel>
                  </div>
                </div>
              )}

              {/* ==================== 8. CORE SETTINGS CONFIGS ==================== */}
              {store.activeTab === 'settings' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <HolographicPanel title="API Integration Credentials" tag="CORE_KEYS">
                    <div className="space-y-4">
                      <div className="border border-white/5 p-3 rounded bg-slate-900/40 space-y-3">
                        <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider mb-2">Google OAuth Configuration</div>
                        <p className="text-[10px] text-white/45 leading-relaxed mb-3">
                          Authenticate with Google to link your actual Gmail inbox, schedule and optimize calendar items.
                        </p>
                        <button
                          onClick={async () => {
                            try {
                              const res = await api.get('/auth/google/url');
                              if (res.data.url) {
                                store.addNotification("Google consent request generated. Redirecting...");
                                window.location.href = res.data.url;
                              }
                            } catch (e) {
                              alert("Google Client ID environment parameters missing.");
                            }
                          }}
                          className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-bold uppercase text-[10px] rounded tracking-wider flex items-center space-x-2 transition-all"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          <span>Link Google Workspace Account</span>
                        </button>
                      </div>

                      <div className="border border-white/5 p-3 rounded bg-slate-900/40 space-y-3">
                        <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider mb-2">Secure Sandbox Node status</div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/40">OLLAMA Llama 3 Core URL:</span>
                          <span className="text-cyan-300 select-all font-mono">http://localhost:11434</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-white/5 pt-2 mt-2">
                          <span className="text-white/40">Chroma Persistent Client:</span>
                          <span className="text-cyan-300 font-mono">LOCAL_FALLBACK_SQLITE</span>
                        </div>
                      </div>
                    </div>
                  </HolographicPanel>

                  <HolographicPanel title="Operating System Configuration" tag="SYS_PARITY">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] text-cyan-400/60 uppercase tracking-widest mb-1.5">Model Selector (LLM Node)</label>
                        <select
                          value={store.llmModel}
                          onChange={(e) => {
                            store.setLlmModel(e.target.value);
                            store.addNotification(`Active cognitive node set to ${e.target.value}`);
                          }}
                          className="w-full bg-slate-950/80 border border-cyan-500/20 rounded px-3 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400 font-mono"
                        >
                          <option value="gpt-4o">OpenAI GPT-4o (Avail: Cloud)</option>
                          <option value="claude-3-5-sonnet">Anthropic Claude 3.5 Sonnet</option>
                          <option value="llama3-local">Ollama Llama 3 (Avail: Local)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-cyan-400/60 uppercase tracking-widest mb-1.5">Voice Synthesis Node (ElevenLabs)</label>
                        <select
                          value={store.ttsVoice}
                          onChange={(e) => {
                            store.setTtsVoice(e.target.value);
                            store.addNotification(`Active voice synthesizer voice token updated.`);
                          }}
                          className="w-full bg-slate-950/80 border border-cyan-500/20 rounded px-3 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400 font-mono"
                        >
                          <option value="21m00Tcm4TlvDq8ikWAM">Rachel (Default ElevenLabs)</option>
                          <option value="AZnzlk1XhhjJs8mCsxsP">JARVIS Deep Synth (Male Baritone)</option>
                        </select>
                      </div>

                      <div className="border-t border-cyan-500/10 pt-4 mt-6">
                        <button
                          onClick={() => {
                            if (confirm("Reset current operating grid metrics? This logs out session.")) {
                              store.logout();
                            }
                          }}
                          className="w-full bg-red-500/10 hover:bg-red-500/25 border border-red-500/30 text-red-400 hover:text-white py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-all"
                        >
                          Erase System Local Cache & Logout
                        </button>
                      </div>
                    </div>
                  </HolographicPanel>

                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </section>
      </div>

      {/* FOOTER METRICS GRID */}
      <footer className="border-t border-cyan-500/15 bg-slate-950/90 py-2.5 px-6 flex justify-between items-center text-[10px] text-cyan-500/40 select-none z-40 relative">
        <div className="flex space-x-4">
          <span>SECURE OPERATING CHANNEL SHIELDED</span>
          <span>•</span>
          <span className="text-cyan-400/50">SECURE SOCKET STREAMING COMPILING</span>
        </div>
        <div>
          <span>© 2026 JARVIS CORE LABS • PHASE 3 FRONTEND READY</span>
        </div>
      </footer>

    </main>
  );
}
