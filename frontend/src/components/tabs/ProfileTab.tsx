"use client";

import React, { useEffect, useState } from 'react';
import { User, Mail, Save, Activity, ShieldCheck, Link2 } from 'lucide-react';
import HolographicPanel from '../HolographicPanel';
import { useJarvisStore } from '../../hooks/useJarvisStore';

export default function ProfileTab() {
  const store = useJarvisStore();
  const fetchPreferences = useJarvisStore((state) => state.fetchPreferences);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    nickname: ''
  });

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  useEffect(() => {
    if (store.userPreferences) {
      setProfile({
        full_name: store.userPreferences.full_name || '',
        nickname: store.userPreferences.nickname || ''
      });
    }
  }, [store.userPreferences]);

  const handleSaveProfile = async () => {
    setLoading(true);
    await store.updatePreferences(profile);
    setLoading(false);
  };

  const getActiveModelName = () => {
    return 'Groq Llama';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
      
      {/* LEFT COLUMN: User Profile */}
      <div className="space-y-6">
        <HolographicPanel title="User Identity" tag="SYS_USER">
          <div className="space-y-4">
            
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-cyan-500/20 border-2 border-cyan-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(0,216,255,0.2)]">
                <User size={32} className="text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg text-white font-bold tracking-wider">{store.userPreferences?.full_name || 'Operator'}</h3>
                <p className="text-xs text-cyan-400/80 font-mono">{store.userPreferences?.email}</p>
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-cyan-400/60 uppercase tracking-widest mb-1.5 flex items-center">
                <Mail size={12} className="mr-1"/> Email Address
              </label>
              <input
                type="email"
                disabled
                value={store.userPreferences?.email || ''}
                className="w-full bg-slate-950/40 border border-cyan-500/10 rounded px-3 py-2 text-xs text-white/50 focus:outline-none font-mono cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[10px] text-cyan-400/60 uppercase tracking-widest mb-1.5 flex items-center">
                <User size={12} className="mr-1"/> Full Name
              </label>
              <input
                type="text"
                placeholder="Enter full name"
                value={profile.full_name}
                onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                className="w-full bg-slate-950/80 border border-cyan-500/20 rounded px-3 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] text-cyan-400/60 uppercase tracking-widest mb-1.5 flex items-center">
                <User size={12} className="mr-1"/> System Nickname
              </label>
              <input
                type="text"
                placeholder="What should JARVIS call you?"
                value={profile.nickname}
                onChange={(e) => setProfile({...profile, nickname: e.target.value})}
                className="w-full bg-slate-950/80 border border-cyan-500/20 rounded px-3 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>
            
            <button
              onClick={handleSaveProfile}
              disabled={loading}
              className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-bold uppercase text-[10px] rounded py-2 tracking-wider flex justify-center items-center space-x-2 transition-all mt-4"
            >
              <Save size={14} />
              <span>{loading ? 'Updating Identity...' : 'Save Profile'}</span>
            </button>
          </div>
        </HolographicPanel>
      </div>

      {/* RIGHT COLUMN: API Telemetry */}
      <div className="space-y-6">
        <HolographicPanel title="API Telemetry" tag="SYS_API">
          <div className="space-y-6">
            
            <div className="p-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 blur-[30px] rounded-full pointer-events-none" />
              <h4 className="text-[10px] text-cyan-400/80 uppercase tracking-widest mb-1 flex items-center">
                <Activity size={12} className="mr-2" /> Active Reasoning Engine
              </h4>
              <p className="text-xl text-white font-mono">{getActiveModelName()}</p>
            </div>

            <div>
              <h4 className="text-[10px] text-cyan-400/80 uppercase tracking-widest mb-3 flex items-center">
                <ShieldCheck size={12} className="mr-2" /> Encrypted Vault Status
              </h4>
              <div className="space-y-2">
                
                <div className={`flex items-center justify-between p-2 rounded border ${store.userPreferences?.has_groq_key ? 'border-green-500/30 bg-green-500/10' : 'border-white/5 bg-white/5'}`}>
                  <span className="text-xs text-white/80 flex items-center"><Link2 size={12} className="mr-2 opacity-50"/> Groq Llama</span>
                  {store.userPreferences?.has_groq_key ? (
                    <span className="text-[10px] text-green-400 uppercase tracking-wider font-bold">Linked</span>
                  ) : (
                    <span className="text-[10px] text-white/30 uppercase tracking-wider">Unlinked</span>
                  )}
                </div>

              </div>
              <p className="text-[10px] text-cyan-500/50 mt-3 text-center">To modify keys, visit the LLM Settings tab.</p>
            </div>

          </div>
        </HolographicPanel>
      </div>

    </div>
  );
}
