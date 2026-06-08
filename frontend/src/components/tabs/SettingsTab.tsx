import React, { useEffect, useState } from 'react';
import { Shield, Save, Key, Cpu, AlertTriangle } from 'lucide-react';
import HolographicPanel from '../HolographicPanel';
import { useJarvisStore } from '../../hooks/useJarvisStore';
import api from '../../services/api';

export default function SettingsTab() {
  const store = useJarvisStore();
  const [loading, setLoading] = useState(false);
  const [prefs, setPrefs] = useState({
    preferred_model: 'gpt-4o',
    token_limit: 8000,
    ollama_model: '',
    openai_api_key: '',
    anthropic_api_key: '',
    gemini_api_key: '',
    groq_api_key: ''
  });

  useEffect(() => {
    store.fetchPreferences();
  }, []);

  useEffect(() => {
    if (store.userPreferences) {
      setPrefs(p => ({
        ...p,
        preferred_model: store.userPreferences.preferred_model || 'gpt-4o',
        token_limit: store.userPreferences.token_limit || 8000,
        ollama_model: store.userPreferences.ollama_model || ''
      }));
    }
  }, [store.userPreferences]);

  const handleSave = async () => {
    setLoading(true);
    // Only send API keys if they have been explicitly changed (they are empty by default here)
    const payload: any = {
      preferred_model: prefs.preferred_model,
      token_limit: prefs.token_limit,
      ollama_model: prefs.ollama_model
    };
    if (prefs.openai_api_key) payload.openai_api_key = prefs.openai_api_key;
    if (prefs.anthropic_api_key) payload.anthropic_api_key = prefs.anthropic_api_key;
    if (prefs.gemini_api_key) payload.gemini_api_key = prefs.gemini_api_key;
    if (prefs.groq_api_key) payload.groq_api_key = prefs.groq_api_key;

    await store.updatePreferences(payload);
    setPrefs(p => ({ ...p, openai_api_key: '', anthropic_api_key: '', gemini_api_key: '', groq_api_key: '' }));
    setLoading(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
      
      {/* LEFT COLUMN */}
      <div className="space-y-6">
        <HolographicPanel title="LLM Node Configuration" tag="SYS_PARITY">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] text-cyan-400/60 uppercase tracking-widest mb-1.5 flex items-center">
                <Cpu size={12} className="mr-1"/> Active Cognitive Node
              </label>
              <select
                value={prefs.preferred_model}
                onChange={(e) => setPrefs({...prefs, preferred_model: e.target.value})}
                className="w-full bg-slate-950/80 border border-cyan-500/20 rounded px-3 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400 font-mono"
              >
                <option value="gpt-4o">OpenAI GPT-4o</option>
                <option value="claude-3-5-sonnet">Anthropic Claude 3.5 Sonnet</option>
                <option value="gemini-2.5-pro">Google Gemini 2.5 Pro</option>
                <option value="llama-3.3-70b-versatile">Groq Llama 3.3 70B</option>
                <option value="ollama">Local Ollama</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-cyan-400/60 uppercase tracking-widest mb-1.5">Max Token Quota per Session</label>
              <input
                type="number"
                value={prefs.token_limit}
                onChange={(e) => setPrefs({...prefs, token_limit: parseInt(e.target.value) || 8000})}
                className="w-full bg-slate-950/80 border border-cyan-500/20 rounded px-3 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400 font-mono"
              />
              <p className="text-[9px] text-cyan-500/50 mt-1 uppercase">Exceeding triggers auto-compression</p>
            </div>

            <div>
              <label className="block text-[10px] text-cyan-400/60 uppercase tracking-widest mb-1.5 flex items-center">
                <AlertTriangle size={12} className="mr-1"/> Ollama Target Model (Local)
              </label>
              <input
                type="text"
                placeholder="e.g. qwen3.5:9b"
                value={prefs.ollama_model}
                onChange={(e) => setPrefs({...prefs, ollama_model: e.target.value})}
                className="w-full bg-slate-950/80 border border-cyan-500/20 rounded px-3 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>
            
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-bold uppercase text-[10px] rounded py-2 tracking-wider flex justify-center items-center space-x-2 transition-all mt-4"
            >
              <Save size={14} />
              <span>{loading ? 'Validating & Saving...' : 'Save LLM Preferences'}</span>
            </button>
          </div>
        </HolographicPanel>

        <HolographicPanel title="Google Workspace" tag="OAUTH">
          <div className="space-y-4">
            <div className="border border-white/5 p-3 rounded bg-slate-900/40 space-y-3">
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
                className="px-4 py-2 w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold uppercase text-[10px] rounded tracking-wider flex justify-center items-center space-x-2 transition-all"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Link Google Workspace Account</span>
              </button>
            </div>
          </div>
        </HolographicPanel>
      </div>

      {/* RIGHT COLUMN */}
      <HolographicPanel title="API Credentials (Encrypted)" tag="CORE_KEYS">
        <div className="space-y-4">
          <p className="text-[10px] text-cyan-500/60 uppercase">Leave blank to keep existing keys. Keys are validated before saving.</p>
          
          <div>
            <label className="flex items-center justify-between text-[10px] text-cyan-400/60 uppercase tracking-widest mb-1.5">
              <span>OpenAI API Key</span>
              {store.userPreferences?.has_openai_key && <span className="text-green-400 bg-green-400/10 px-1 rounded">SECURED</span>}
            </label>
            <div className="relative">
              <Key className="absolute left-2 top-2 w-4 h-4 text-cyan-500/40" />
              <input
                type="password"
                placeholder="sk-..."
                value={prefs.openai_api_key}
                onChange={(e) => setPrefs({...prefs, openai_api_key: e.target.value})}
                className="w-full pl-8 bg-slate-950/80 border border-cyan-500/20 rounded px-3 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center justify-between text-[10px] text-cyan-400/60 uppercase tracking-widest mb-1.5">
              <span>Anthropic API Key</span>
              {store.userPreferences?.has_anthropic_key && <span className="text-green-400 bg-green-400/10 px-1 rounded">SECURED</span>}
            </label>
            <div className="relative">
              <Key className="absolute left-2 top-2 w-4 h-4 text-cyan-500/40" />
              <input
                type="password"
                placeholder="sk-ant-..."
                value={prefs.anthropic_api_key}
                onChange={(e) => setPrefs({...prefs, anthropic_api_key: e.target.value})}
                className="w-full pl-8 bg-slate-950/80 border border-cyan-500/20 rounded px-3 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center justify-between text-[10px] text-cyan-400/60 uppercase tracking-widest mb-1.5">
              <span>Google Gemini API Key</span>
              {store.userPreferences?.has_gemini_key && <span className="text-green-400 bg-green-400/10 px-1 rounded">SECURED</span>}
            </label>
            <div className="relative">
              <Key className="absolute left-2 top-2 w-4 h-4 text-cyan-500/40" />
              <input
                type="password"
                placeholder="AIza..."
                value={prefs.gemini_api_key}
                onChange={(e) => setPrefs({...prefs, gemini_api_key: e.target.value})}
                className="w-full pl-8 bg-slate-950/80 border border-cyan-500/20 rounded px-3 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center justify-between text-[10px] text-cyan-400/60 uppercase tracking-widest mb-1.5">
              <span>Groq API Key</span>
              {store.userPreferences?.has_groq_key && <span className="text-green-400 bg-green-400/10 px-1 rounded">SECURED</span>}
            </label>
            <div className="relative">
              <Key className="absolute left-2 top-2 w-4 h-4 text-cyan-500/40" />
              <input
                type="password"
                placeholder="gsk_..."
                value={prefs.groq_api_key}
                onChange={(e) => setPrefs({...prefs, groq_api_key: e.target.value})}
                className="w-full pl-8 bg-slate-950/80 border border-cyan-500/20 rounded px-3 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-bold uppercase text-[10px] rounded py-2 tracking-wider flex justify-center items-center space-x-2 transition-all mt-4"
          >
            <Save size={14} />
            <span>{loading ? 'Validating...' : 'Secure Vault Keys'}</span>
          </button>
        </div>
      </HolographicPanel>

    </div>
  );
}
