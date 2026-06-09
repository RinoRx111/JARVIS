"use client";

import React, { useEffect, useState } from 'react';
import { User, Mail, Save, Activity, ShieldCheck, Link2 } from 'lucide-react';
import HolographicPanel from '../HolographicPanel';
import { useJarvisStore } from '../../hooks/useJarvisStore';
import { Button } from '@/components/ui/button';

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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20 bg-background text-[#E8EDF2]">
      
      {/* LEFT COLUMN: User Profile */}
      <div className="space-y-6">
        <HolographicPanel title="User Identity" tag="SYS_USER">
          <div className="space-y-4 p-2">
            
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-[#00C2FF]/10 border border-[#1E2A35] flex items-center justify-center shadow-[0_0_12px_rgba(0,194,255,0.1)]">
                <User size={28} className="text-[#00C2FF]" />
              </div>
              <div>
                <h3 className="text-lg text-[#E8EDF2] font-bold tracking-wider">{store.userPreferences?.full_name || 'Operator'}</h3>
                <p className="text-xs text-[#6B7F8E] font-mono">{store.userPreferences?.email}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#6B7F8E] uppercase tracking-widest mb-1.5 flex items-center font-mono">
                <Mail size={12} className="mr-1"/> Email Address
              </label>
              <input
                type="email"
                disabled
                value={store.userPreferences?.email || ''}
                className="w-full bg-[#141B22]/50 border border-[#1E2A35] rounded-lg px-3 py-2 text-xs text-[#6B7F8E] focus:outline-none font-mono cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs text-[#6B7F8E] uppercase tracking-widest mb-1.5 flex items-center font-mono">
                <User size={12} className="mr-1"/> Full Name
              </label>
              <input
                type="text"
                placeholder="Enter full name"
                value={profile.full_name}
                onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                className="w-full bg-[#0E1318] border border-[#1E2A35] rounded-lg px-3 py-2 text-sm text-[#E8EDF2] focus:outline-none focus:border-[#00C2FF] font-mono transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-xs text-[#6B7F8E] uppercase tracking-widest mb-1.5 flex items-center font-mono">
                <User size={12} className="mr-1"/> System Nickname
              </label>
              <input
                type="text"
                placeholder="What should JARVIS call you?"
                value={profile.nickname}
                onChange={(e) => setProfile({...profile, nickname: e.target.value})}
                className="w-full bg-[#0E1318] border border-[#1E2A35] rounded-lg px-3 py-2 text-sm text-[#E8EDF2] focus:outline-none focus:border-[#00C2FF] font-mono transition-all duration-200"
              />
            </div>
            
            <Button
              onClick={handleSaveProfile}
              disabled={loading}
              className="w-full bg-[#00C2FF] hover:bg-[#00C2FF]/80 text-[#080B0F] border-0 font-bold uppercase text-xs rounded-lg py-2 tracking-wider flex justify-center items-center gap-2 transition-all mt-4"
            >
              <Save size={14} />
              <span>{loading ? 'Updating Identity...' : 'Save Profile'}</span>
            </Button>
          </div>
        </HolographicPanel>
      </div>

      {/* RIGHT COLUMN: API Telemetry */}
      <div className="space-y-6">
        <HolographicPanel title="API Telemetry" tag="SYS_API">
          <div className="space-y-6 p-2">
            
            <div className="p-4 rounded-lg border border-[#1E2A35] bg-[#0E1318] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#00C2FF]/5 blur-[30px] rounded-full pointer-events-none" />
              <h4 className="text-xs text-[#6B7F8E] uppercase tracking-widest mb-1.5 flex items-center font-mono">
                <Activity size={12} className="mr-2" /> Active Reasoning Engine
              </h4>
              <p className="text-lg text-[#E8EDF2] font-mono">{getActiveModelName()}</p>
            </div>

            <div>
              <h4 className="text-xs text-[#6B7F8E] uppercase tracking-widest mb-3 flex items-center font-mono">
                <ShieldCheck size={12} className="mr-2" /> Encrypted Vault Status
              </h4>
              <div className="space-y-2">
                <div className={`flex items-center justify-between p-3 rounded-lg border ${store.userPreferences?.has_groq_key ? 'border-[#00E5A0]/30 bg-[#00E5A0]/5' : 'border-[#1E2A35] bg-[#0E1318]'}`}>
                  <span className="text-xs text-[#E8EDF2] flex items-center"><Link2 size={12} className="mr-2 opacity-50"/> Groq Llama</span>
                  {store.userPreferences?.has_groq_key ? (
                    <span className="text-xs text-[#00E5A0] uppercase tracking-wider font-bold">Linked</span>
                  ) : (
                    <span className="text-xs text-[#6B7F8E] uppercase tracking-wider">Unlinked</span>
                  )}
                </div>
              </div>
              <p className="text-xs text-[#6B7F8E]/60 mt-3 text-center">To modify keys, visit the LLM Settings tab.</p>
            </div>

          </div>
        </HolographicPanel>
      </div>

    </div>
  );
}
