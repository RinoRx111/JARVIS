"use client";

import React, { useEffect, useState } from 'react';
import { useJarvisStore } from '@/hooks/useJarvisStore';
import { Settings, HardDrive, Volume2, Shield, Key } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import api from '@/services/api';

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
    <div className="p-6 md:p-12 w-full h-full flex flex-col gap-6 overflow-y-auto">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-primary/10 rounded-xl text-primary">
          <Settings size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">System Configuration</h1>
          <p className="text-sm text-muted-foreground">Core engine parameters and parameters</p>
        </div>
      </div>

      <div className="flex-1 mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="space-y-6">
          <Card className="bg-white/5 border-white/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Key className="text-yellow-500" size={20} />
                Groq API Key Vault (Encrypted)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-white/60">Groq API Key</label>
                <input 
                  type="password" 
                  value={keys.groq}
                  onChange={(e) => setKeys({...keys, groq: e.target.value})}
                  placeholder={store.userPreferences?.has_groq_key ? "•••••••••••••••• (Configured)" : "gsk_..."}
                  className="w-full bg-black/50 border border-white/10 rounded-md p-2 text-white text-sm font-mono"
                />
              </div>
              <Button onClick={handleSaveKeys} className="w-full mt-2">
                Save & Encrypt Key
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-white/5 border-white/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="text-green-400" size={20} />
                Security & Integrations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
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
                <div key={integration.id} className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-white/5">
                  <div>
                    <p className="text-sm font-medium text-white">{integration.name}</p>
                    <p className="text-xs text-muted-foreground">{integration.desc}</p>
                  </div>
                  <Button 
                    variant={integration.connected ? "default" : "outline"} 
                    size="sm"
                    className={integration.connected ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                    onClick={async () => {
                      if (integration.connected) return;
                      setModalProvider(integration.name);
                    }}
                  >
                    {integration.connected ? "Connected" : "Connect"}
                  </Button>
                </div>
              ))}
              
              <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-white/5">
                <div>
                  <p className="text-sm font-medium text-white">ElevenLabs API</p>
                  <p className="text-xs text-muted-foreground">High-fidelity Voice Synthesis</p>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {modalProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-white mb-2">{modalProvider} Integration</h3>
            <p className="text-sm text-muted-foreground mb-6">
              The {modalProvider} integration is currently under development and will be available in a future update.
            </p>
            <div className="flex justify-end">
              <Button 
                onClick={() => setModalProvider(null)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-md px-4 py-2"
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
