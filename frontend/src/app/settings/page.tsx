"use client";

import React, { useEffect, useState } from 'react';
import { useJarvisStore } from '@/hooks/useJarvisStore';
import { Settings, Cpu, HardDrive, Volume2, Shield, Key } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const store = useJarvisStore();
  const [keys, setKeys] = useState({
    openai: '',
    gemini: '',
    anthropic: '',
    groq: ''
  });

  useEffect(() => {
    store.fetchPreferences();
    store.fetchLocalModels();
  }, []);

  const handleSaveKeys = async () => {
    const prefs: any = {};
    if (keys.openai) prefs.openai_api_key = keys.openai;
    if (keys.gemini) prefs.gemini_api_key = keys.gemini;
    if (keys.anthropic) prefs.anthropic_api_key = keys.anthropic;
    if (keys.groq) prefs.groq_api_key = keys.groq;
    
    if (Object.keys(prefs).length > 0) {
      await store.updatePreferences(prefs);
      setKeys({ openai: '', gemini: '', anthropic: '', groq: '' });
    }
  };

  const handleModelChange = async (model: string) => {
    // If it's a local model from the list, we set ollama_model and preferred_model="ollama"
    if (store.localModels.includes(model)) {
      await store.updatePreferences({ preferred_model: "ollama", ollama_model: model });
    } else {
      await store.updatePreferences({ preferred_model: model });
    }
  };

  const currentProvider = store.userPreferences?.preferred_model || 'gpt-4o';
  const currentOllama = store.userPreferences?.ollama_model || '';
  const displayModel = currentProvider === 'ollama' ? currentOllama : currentProvider;

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
                <Cpu className="text-primary" size={20} />
                Multi-Model Router
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-white/80 block mb-2">Primary LLM Provider</label>
                <select 
                  value={displayModel}
                  onChange={(e) => handleModelChange(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-md p-2 text-white text-sm"
                >
                  <optgroup label="Cloud Models">
                    <option value="gpt-4o">OpenAI GPT-4o</option>
                    <option value="claude-3-5-sonnet">Anthropic Claude 3.5</option>
                    <option value="llama-3-70b">Groq Llama-3 70B</option>
                    <option value="gemini-1.5-pro">Google Gemini 1.5 Pro</option>
                  </optgroup>
                  <optgroup label="Local Models (Ollama)">
                    {store.localModels.length === 0 && <option disabled>No local models detected</option>}
                    {store.localModels.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </optgroup>
                </select>
                <p className="text-xs text-muted-foreground mt-2">
                  JARVIS will automatically fallback to other providers if the primary fails.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Key className="text-yellow-500" size={20} />
                API Key Vault (Encrypted)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-white/60">OpenAI API Key</label>
                <input 
                  type="password" 
                  value={keys.openai}
                  onChange={(e) => setKeys({...keys, openai: e.target.value})}
                  placeholder={store.userPreferences?.has_openai_key ? "•••••••••••••••• (Configured)" : "sk-..."}
                  className="w-full bg-black/50 border border-white/10 rounded-md p-2 text-white text-sm font-mono"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-white/60">Anthropic API Key</label>
                <input 
                  type="password" 
                  value={keys.anthropic}
                  onChange={(e) => setKeys({...keys, anthropic: e.target.value})}
                  placeholder={store.userPreferences?.has_anthropic_key ? "•••••••••••••••• (Configured)" : "sk-ant-..."}
                  className="w-full bg-black/50 border border-white/10 rounded-md p-2 text-white text-sm font-mono"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-white/60">Google Gemini API Key</label>
                <input 
                  type="password" 
                  value={keys.gemini}
                  onChange={(e) => setKeys({...keys, gemini: e.target.value})}
                  placeholder={store.userPreferences?.has_gemini_key ? "•••••••••••••••• (Configured)" : "AIzaSy..."}
                  className="w-full bg-black/50 border border-white/10 rounded-md p-2 text-white text-sm font-mono"
                />
              </div>
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
                Save & Encrypt Keys
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
                { id: "google", name: "Google Workspace", desc: "Mail, Calendar, Drive", connected: !!store.userPreferences?.google_oauth_token },
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
                    onClick={() => {
                      if (!integration.connected) {
                         // Redirect to our generic oauth URL endpoint to start flow
                         window.location.href = `/api/v1/auth/oauth/${integration.id}/url`;
                      }
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
    </div>
  );
}
