"use client";

import React, { useEffect, useState } from 'react';
import { useJarvisStore } from '@/hooks/useJarvisStore';
import { Settings, Shield, Key } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const store = useJarvisStore();
  const fetchPreferences = useJarvisStore((state) => state.fetchPreferences);
  const [keys, setKeys] = useState({
    groq: ''
  });
  const [modalProvider, setModalProvider] = useState<string | null>(null);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const handleSaveKeys = async () => {
    if (keys.groq) {
      await store.updatePreferences({ groq_api_key: keys.groq });
      setKeys({ groq: '' });
    }
  };

  return (
    <div className="p-6 md:p-12 w-full h-full flex flex-col gap-6 overflow-y-auto bg-background text-[#E8EDF2]">
      <div className="flex items-center gap-4 border-b border-[#1E2A35]/30 pb-6 shrink-0">
        <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0">
          <Settings size={24} />
        </div>
        <div>
          <h1 className="text-lg font-mono uppercase tracking-widest text-[#E8EDF2] font-bold">System Configuration</h1>
          <p className="text-xs text-[#6B7F8E]">Core engine parameters and permissions</p>
        </div>
      </div>

      <div className="flex-1 mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="space-y-6">
          <Card className="bg-[#0E1318] border-[#1E2A35] rounded-xl hover:shadow-[0_0_12px_rgba(0,194,255,0.15)] transition-all">
            <CardHeader className="border-b border-[#1E2A35]/30 pb-4">
              <CardTitle className="text-sm font-mono uppercase tracking-wider text-[#E8EDF2] flex items-center gap-2 font-bold">
                <Key className="text-[#00C2FF]" size={16} />
                Groq API Key Vault (Encrypted)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-wider text-[#6B7F8E]">Groq API Key</label>
                <input 
                  type="password" 
                  value={keys.groq}
                  onChange={(e) => setKeys({...keys, groq: e.target.value})}
                  placeholder={store.userPreferences?.has_groq_key ? "•••••••••••••••• (Configured)" : "gsk_..."}
                  className="w-full bg-[#141B22] border border-[#1E2A35] rounded-lg p-2 text-[#E8EDF2] text-sm font-mono focus:outline-none focus:border-[#00C2FF] transition-all"
                />
              </div>
              <Button onClick={handleSaveKeys} className="w-full mt-2 bg-[#00C2FF] text-[#080B0F] hover:bg-[#00C2FF]/85 border-0 font-bold uppercase text-xs rounded-lg py-2 transition-all">
                Save & Encrypt Key
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-[#0E1318] border-[#1E2A35] rounded-xl hover:shadow-[0_0_12px_rgba(0,194,255,0.15)] transition-all">
            <CardHeader className="border-b border-[#1E2A35]/30 pb-4">
              <CardTitle className="text-sm font-mono uppercase tracking-wider text-[#E8EDF2] flex items-center gap-2 font-bold">
                <Shield className="text-[#00E5A0]" size={16} />
                Security & Integrations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[600px] overflow-y-auto pt-4">
              {[
                { id: "github", name: "GitHub", desc: "Repositories, PRs, Issues", connected: !!store.userPreferences?.has_github_token },
                { id: "notion", name: "Notion", desc: "Workspace, Pages, Databases", connected: !!store.userPreferences?.has_notion_token },
                { id: "linkedin", name: "LinkedIn", desc: "Profile Insights, Resume Sync", connected: !!store.userPreferences?.has_linkedin_token },
                { id: "microsoft", name: "Microsoft", desc: "Outlook, OneDrive, Teams", connected: !!store.userPreferences?.has_microsoft_token },
                { id: "slack", name: "Slack", desc: "Channels, Messages", connected: !!store.userPreferences?.has_slack_token },
                { id: "discord", name: "Discord", desc: "Servers, Messages", connected: !!store.userPreferences?.has_discord_token },
                { id: "jira", name: "Jira", desc: "Tickets, Sprints", connected: !!store.userPreferences?.has_jira_token },
                { id: "trello", name: "Trello", desc: "Boards, Cards", connected: !!store.userPreferences?.has_trello_token },
              ].map(integration => (
                <div key={integration.id} className="flex items-center justify-between p-3 bg-[#141B22]/40 rounded-lg border border-[#1E2A35]">
                  <div>
                    <p className="text-sm font-medium text-[#E8EDF2]">{integration.name}</p>
                    <p className="text-xs text-[#6B7F8E] font-mono">{integration.desc}</p>
                  </div>
                  <Button 
                    variant="ghost"
                    size="sm"
                    className={`text-xs uppercase font-mono tracking-wider px-3 h-8 border rounded-lg transition-all ${integration.connected ? "bg-[#00E5A0] text-[#080B0F] border-0 hover:bg-[#00E5A0]/80 font-bold" : "border-[#1E2A35] text-[#6B7F8E] hover:text-[#00C2FF] hover:border-[#00C2FF]"}`}
                    onClick={async () => {
                      if (integration.connected) return;
                      setModalProvider(integration.name);
                    }}
                  >
                    {integration.connected ? "Linked" : "Link"}
                  </Button>
                </div>
              ))}
              
              <div className="flex items-center justify-between p-3 bg-[#141B22]/40 rounded-lg border border-[#1E2A35]">
                <div>
                  <p className="text-sm font-medium text-[#E8EDF2]">ElevenLabs API</p>
                  <p className="text-xs text-[#6B7F8E] font-mono">High-fidelity Voice Synthesis</p>
                </div>
                <Button variant="ghost" size="sm" className="text-xs uppercase font-mono tracking-wider px-3 h-8 border border-[#1E2A35] text-[#6B7F8E] hover:text-[#00C2FF] hover:border-[#00C2FF] rounded-lg transition-all">Configure</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {modalProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#080B0F]/80 backdrop-blur-sm">
          <div className="bg-[#0E1318] border border-[#1E2A35] rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-[#E8EDF2] mb-2">{modalProvider} Integration</h3>
            <p className="text-xs text-[#6B7F8E] mb-6 font-mono leading-relaxed">
              The {modalProvider} integration is currently offline and will be compiled in a future patch.
            </p>
            <div className="flex justify-end">
              <Button 
                onClick={() => setModalProvider(null)}
                className="bg-[#00C2FF] hover:bg-[#00C2FF]/90 text-[#080B0F] border-0 font-bold uppercase text-xs rounded-lg px-4 py-2 transition-all"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
