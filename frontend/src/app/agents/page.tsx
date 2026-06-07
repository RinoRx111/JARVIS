import React from "react";
import { AgentCard } from "@/components/agents/AgentCard";
import { ActivityTimeline, TimelineEvent } from "@/components/agents/ActivityTimeline";

const dummyAgents = [
  { name: "Research Agent", status: "running" as const, task: "Scanning DuckDuckGo for Next.js 14 server actions patterns...", progress: 65, runtime: "04:12" },
  { name: "Coding Agent", status: "idle" as const, task: "Awaiting next directive", progress: 0, runtime: "00:00" },
  { name: "Memory Agent", status: "completed" as const, task: "Extracted 15 key entities from recent chat", progress: 100, runtime: "00:45" },
];

const dummyTimeline: TimelineEvent[] = [
  { id: "1", title: "Thinking", description: "Analyzing request intent and required context", status: "completed", type: "thinking", time: "10:41 AM" },
  { id: "2", title: "Web Search", description: "Query: 'Next.js 14 App Router best practices'", status: "completed", type: "search", time: "10:42 AM" },
  { id: "3", title: "Code Generation", description: "Drafting React components with Tailwind CSS", status: "running", type: "code", time: "10:42 AM" },
  { id: "4", title: "File Execution", description: "Writing changes to frontend/src/app/page.tsx", status: "pending", type: "action" }
];

export default function AgentsPage() {
  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <header className="h-16 flex items-center px-6 border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div>
          <h1 className="text-lg font-medium text-white">Agent Command Center</h1>
          <p className="text-xs text-muted-foreground">Monitor and control autonomous subagents</p>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          <div className="xl:col-span-2 space-y-6">
            <h2 className="text-sm font-semibold tracking-widest text-primary uppercase">Active Fleet</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dummyAgents.map((agent, i) => (
                <AgentCard key={i} {...agent} />
              ))}
            </div>
          </div>
          
          <div className="space-y-6">
            <h2 className="text-sm font-semibold tracking-widest text-primary uppercase">Global Activity Feed</h2>
            <div className="glass-card p-6 rounded-xl">
              <ActivityTimeline events={dummyTimeline} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
