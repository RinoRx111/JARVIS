"use client";

import React, { useEffect, useState } from 'react';
import { useJarvisStore } from '@/hooks/useJarvisStore';
import { Settings, Cpu, HardDrive, Volume2, Shield, Key, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import api from '@/services/api';

export default function SettingsPage() {
  const store = useJarvisStore();
  const [keys, setKeys] = useState({
    openai: '',
    gemini: '',
    anthropic: '',
    groq: ''
  });
  const [requiredKey, setRequiredKey] = useState('');
  const [modalProvider, setModalProvider] = useState<string | null>(null);
  const [loadingLocalModels, setLoadingLocalModels] = useState(false);

  const fetchLocalModels = async () => {
    setLoadingLocalModels(true);
    await store.fetchLocalModels();
    setLoadingLocalModels(false);
  };

  const getRequiredKey = (model: string) => {
    const m = model.toLowerCase();
    if (m.includes('claude') || m.includes('anthropic')) return 'anthropic';
    if (m.includes('gpt') || m.includes('openai')) return 'openai';
    if (m.includes('gemini')) return 'gemini';
    if (m.includes('llama') || m.includes('groq')) return 'groq';
    return '';
  };

  useEffect(() => {
    store.fetchPreferences();
    fetchLocalModels();
  }, []);

  useEffect(() => {
    if (store.userPreferences) {
      const preferred = store.userPreferences.preferred_model || 'gpt-4o';
      const activeModel = preferred === 'ollama' ? (store.userPreferences.ollama_model || '') : preferred;
      setRequiredKey(getRequiredKey(activeModel));
    }
  }, [store.userPreferences]);

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
    setRequiredKey(getRequiredKey(model));
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
                {loadingLocalModels ? (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Detecting local Ollama models...
                  </p>
                ) : store.localModels.length === 0 ? (
                  <div className="mt-3 p-3 border border-yellow-500/20 bg-yellow-500/5 rounded-md text-xs text-yellow-500 space-y-2">
                    <p>No local Ollama models detected. Make sure Ollama is running at <code className="bg-black/45 px-1 rounded">localhost:11434</code>.</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={fetchLocalModels}
                      className="border-yellow-500/30 hover:bg-yellow-500/20 text-yellow-500 hover:text-yellow-400 text-[10px] uppercase font-bold py-1 h-auto"
                    >
                      Refresh Models
                    </Button>
                  </div>
                ) : null}
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
              {requiredKey && (
                <div className="border border-yellow-500/40 bg-yellow-500/10 text-yellow-500 text-xs rounded-md p-3 mb-2 flex items-center gap-2 animate-pulse">
                  <Key size={14} className="shrink-0" />
                  <span>An API key is required for your active model choice: <strong>{requiredKey.toUpperCase()}</strong></span>
                </div>
              )}
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
                { id: "google", name: "Google Workspace", desc: "Mail, Calendar, Drive", connected: !!store.userPreferences?.has_google_token },
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
                      if (integration.id === "google") {
                        try {
                          const res = await api.get('/auth/google/url');
                          if (res.data?.url) {
                            window.location.href = res.data.url;
                          }
                        } catch (e) {
                          alert("Google Workspace integration failed to initiate.");
                        }
                      } else {
                        setModalProvider(integration.name);
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
