"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Plus, Volume2, VolumeX, Mic, MicOff, Send } from 'lucide-react';
import clsx from 'clsx';
import HolographicPanel from '../HolographicPanel';
import VoiceOrb from '../VoiceOrb';
import { useJarvisStore } from '../../hooks/useJarvisStore';
import { parseMarkdown } from '../../utils/markdownParser';
import { wsService } from '../../services/websocket';

export default function ChatTab() {
  const store = useJarvisStore();
  const [chatInput, setChatInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [store.messages]);


  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        wsService.sendVoiceChunk(audioBlob);
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
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      store.setCoreStatus('STANDBY');
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    wsService.sendTextMessage(chatInput);
    setChatInput('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 flex flex-col h-[520px]">
        <HolographicPanel 
          title="JARVIS Conversational Matrix" 
          tag="TEXT_VOICE_UPLINK"
          className="flex-1 flex flex-col h-full overflow-hidden"
          headerActions={
            <div className="flex items-center space-x-3 text-[10px]">
              <button
                onClick={() => store.startNewChat()}
                className="flex items-center space-x-1.5 px-2 py-1 rounded transition-all bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                title="Start New Chat"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>NEW CHAT</span>
              </button>
              <button
                onClick={() => store.setVoiceActive(!store.isVoiceActive)}
                className={clsx("flex items-center space-x-1.5 px-2 py-1 rounded transition-all", 
                  store.isVoiceActive 
                    ? "bg-cyan-500/20 border border-cyan-500/30 text-cyan-300" 
                    : "bg-red-500/20 border border-red-500/30 text-red-300"
                )}
                title="Mute/Unmute Audio"
              >
                {store.isVoiceActive ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span>TTS {store.isVoiceActive ? 'ON' : 'MUTE'}</span>
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
          <VoiceOrb status={store.coreStatus} />
        </div>
      </HolographicPanel>
    </div>
  );
}
