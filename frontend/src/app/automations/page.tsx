"use client";

import React from 'react';
import { Zap, Play, Settings2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AutomationsPage() {
  const automations = [
    { id: 1, name: 'Daily Briefing Synthesis', trigger: 'Schedule: 08:00 AM', status: 'active', type: 'Report' },
    { id: 2, name: 'Inbox Triage & Sorting', trigger: 'Event: On New Email', status: 'active', type: 'Email' },
    { id: 3, name: 'Background Memory Compaction', trigger: 'Schedule: Weekly', status: 'paused', type: 'System' },
  ];

  return (
    <div className="p-6 md:p-12 w-full h-full flex flex-col gap-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl text-primary">
            <Zap size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide">Automations</h1>
            <p className="text-sm text-muted-foreground">Rule-based triggers and workflows</p>
          </div>
        </div>
        
        <Button variant="glass">New Routine</Button>
      </div>

      {/* Coming Soon Status Banner */}
      <div className="border border-yellow-500/30 bg-yellow-500/10 text-yellow-500 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-sm">Automations Scheduler Beta</h3>
          <p className="text-xs text-yellow-500/80 mt-1">This module is currently running in diagnostic mode. Workspace actions are simulated.</p>
        </div>
        <span className="text-[10px] uppercase font-mono tracking-widest bg-yellow-500/20 px-2.5 py-1 rounded border border-yellow-500/30 font-bold shrink-0">Development Phase</span>
      </div>

      <div className="flex-1 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {automations.map((auto) => (
            <Card key={auto.id} className={`bg-white/5 border-white/5 transition-colors ${auto.status === 'active' ? 'hover:border-primary/50' : 'opacity-60'}`}>
              <CardContent className="p-5 flex flex-col h-full relative overflow-hidden">
                {auto.status === 'active' && (
                  <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-bl-full -z-10" />
                )}
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-mono px-2 py-1 bg-white/10 rounded-md text-white/70">{auto.type}</span>
                  <div className={`w-2 h-2 rounded-full ${auto.status === 'active' ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]' : 'bg-white/20'}`} />
                </div>
                
                <h3 className="font-semibold text-white text-lg mb-2">{auto.name}</h3>
                <p className="text-sm text-primary/70 mb-6">{auto.trigger}</p>
                
                <div className="mt-auto flex gap-2">
                  <Button variant="secondary" size="sm" className="flex-1 bg-white/5 hover:bg-white/10 text-white">
                    <Settings2 size={14} className="mr-2" /> Configure
                  </Button>
                  <Button variant="ghost" size="icon" className="shrink-0" title={auto.status === 'active' ? "Pause" : "Start"}>
                    <Play size={16} className={auto.status === 'paused' ? 'fill-white/50 text-white/50' : 'fill-primary text-primary'} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
