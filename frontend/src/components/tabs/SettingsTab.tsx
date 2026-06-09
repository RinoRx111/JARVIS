"use client";

import React, { useEffect, useState } from 'react';
import { Shield, Save, Key } from 'lucide-react';
import HolographicPanel from '../HolographicPanel';
import { useJarvisStore } from '../../hooks/useJarvisStore';
import api from '../../services/api';

export default function SettingsTab() {
  const store = useJarvisStore();
  const fetchPreferences = useJarvisStore((state) => state.fetchPreferences);
  const [loading, setLoading] = useState(false);
  const [prefs, setPrefs] = useState({
    token_limit: 8000,
    groq_api_key: ''
  });

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  useEffect(() => {
    if (store.userPreferences) {
      setPrefs(p => ({
        ...p,
        token_limit: store.userPreferences.token_limit !== undefined ? store.userPreferences.token_limit : 8000
      }));
    }
  }, [store.userPreferences]);

  const handleSave = async () => {
    setLoading(true);
    const payload: any = {
      token_limit: prefs.token_limit
    };
    if (prefs.groq_api_key) payload.groq_api_key = prefs.groq_api_key;

    await store.updatePreferences(payload);
    setPrefs(p => ({ ...p, groq_api_key: '' }));
    setLoading(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
      
      {/* LEFT COLUMN */}
      <div className="space-y-6">
        <HolographicPanel title="LLM Node Configuration" tag="SYS_PARITY">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] text-cyan-400/60 uppercase tracking-widest mb-1.5">Max Token Quota per Session</label>
              <select
                value={prefs.token_limit}
                onChange={(e) => setPrefs({...prefs, token_limit: parseInt(e.target.value)})}
                className="w-full bg-slate-950/80 border border-cyan-500/20 rounded px-3 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400 font-mono"
              >
                <option value={4000}>4,000 Tokens</option>
                <option value={8000}>8,000 Tokens</option>
                <option value={16000}>16,000 Tokens</option>
                <option value={32000}>32,000 Tokens</option>
                <option value={0}>Unlimited</option>
              </select>
              <p className="text-[9px] text-cyan-500/50 mt-1 uppercase">Set 0 for no limit</p>
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
      <HolographicPanel title="Groq API Credentials (Encrypted)" tag="CORE_KEYS">
        <div className="space-y-4">
          <p className="text-[10px] text-cyan-500/60 uppercase">Leave blank to keep existing keys. Keys are validated before saving.</p>
          
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
            <span>{loading ? 'Validating...' : 'Secure Vault Key'}</span>
          </button>
        </div>
      </HolographicPanel>

    </div>
  );
}
