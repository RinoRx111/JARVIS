"use client";

import React from 'react';
import { useJarvisStore } from '@/hooks/useJarvisStore';
import { Settings, Cpu, HardDrive, Volume2, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const store = useJarvisStore();

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
        <Card className="bg-white/5 border-white/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Cpu className="text-primary" size={20} />
              AI Core Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-white/80 block mb-2">Primary LLM Provider</label>
              <select 
                value={store.llmModel}
                onChange={(e) => store.setLlmModel(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-md p-2 text-white text-sm"
              >
                <option value="gpt-4o">OpenAI GPT-4o</option>
                <option value="claude-3-5-sonnet">Anthropic Claude 3.5</option>
                <option value="llama-3-70b">Groq Llama-3 70B</option>
                <option value="local-qwen">Local Qwen (Ollama)</option>
              </select>
            </div>
            
            <div className="pt-4 border-t border-white/10">
              <label className="text-sm font-medium text-white/80 block mb-2">TTS Voice ID (ElevenLabs)</label>
              <input 
                type="text" 
                value={store.ttsVoice}
                onChange={(e) => store.setTtsVoice(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-md p-2 text-white text-sm font-mono"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="text-green-400" size={20} />
              Security & Integrations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-white/5">
              <div>
                <p className="text-sm font-medium text-white">Google Workspace</p>
                <p className="text-xs text-muted-foreground">Mail, Calendar, Drive</p>
              </div>
              <Button variant="outline" size="sm">Connect</Button>
            </div>
            
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
  );
}
