import React from 'react';
import { Shield } from 'lucide-react';
import HolographicPanel from '../HolographicPanel';
import { useJarvisStore } from '../../hooks/useJarvisStore';
import api from '../../services/api';

export default function SettingsTab() {
  const store = useJarvisStore();

  return (
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
  );
}
