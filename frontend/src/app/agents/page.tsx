"use client";
import React, { useEffect } from "react";
import { AgentCard } from "@/components/agents/AgentCard";
import { ActivityTimeline, TimelineEvent } from "@/components/agents/ActivityTimeline";
import { useJarvisStore } from "@/hooks/useJarvisStore";

export default function AgentsPage() {
  const store = useJarvisStore();
  
  useEffect(() => {
    store.fetchAgentConfig();
  }, []);

  const config = store.agentConfig || {};
  
  const toggleAgent = async (key: string, currentValue: boolean) => {
    await store.updateAgentConfig({
      ...config,
      [key]: !currentValue
    });
  };

  const agentsList = [
    { id: "research_agent_enabled", name: "Research Agent", desc: "Autonomous web searches and information synthesis", icon: "🔍" },
    { id: "coding_agent_enabled", name: "Coding Agent", desc: "Write, review, and execute Python/JS code", icon: "💻" },
    { id: "github_agent_enabled", name: "GitHub Agent", desc: "Manage PRs, read repos, create issues", icon: "🐙" },
    { id: "email_agent_enabled", name: "Email Agent", desc: "Read and compose emails via Gmail", icon: "✉️" },
    { id: "calendar_agent_enabled", name: "Calendar Agent", desc: "Schedule events and query Google Calendar", icon: "📅" },
    { id: "resume_agent_enabled", name: "Resume Agent", desc: "Parse and tailor resumes to job descriptions", icon: "📄" },
    { id: "linkedin_agent_enabled", name: "LinkedIn Agent", desc: "Analyze profiles and craft messages", icon: "💼" },
    { id: "automation_agent_enabled", name: "Automation Agent", desc: "Desktop macros and scheduled scripts", icon: "⚙️" },
  ];
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
            <h2 className="text-sm font-semibold tracking-widest text-primary uppercase">Agent Marketplace</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agentsList.map((agent) => (
                <div key={agent.id} className="glass-card p-4 rounded-xl flex items-center justify-between border border-white/5 transition hover:border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{agent.icon}</div>
                    <div>
                      <h3 className="text-sm font-medium text-white">{agent.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 max-w-[200px] leading-relaxed">{agent.desc}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => toggleAgent(agent.id, config[agent.id])}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-black ${config[agent.id] ? 'bg-primary' : 'bg-white/20'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config[agent.id] ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-6">
            <h2 className="text-sm font-semibold tracking-widest text-primary uppercase">Global Activity Feed</h2>
            <div className="glass-card p-6 rounded-xl">
              <ActivityTimeline events={[
                { id: "1", title: "Thinking", description: "Analyzing request intent and required context", status: "completed", type: "thinking", time: "10:41 AM" },
                { id: "2", title: "Web Search", description: "Query: 'Next.js 14 App Router best practices'", status: "completed", type: "search", time: "10:42 AM" },
                { id: "3", title: "Code Generation", description: "Drafting React components with Tailwind CSS", status: "running", type: "code", time: "10:42 AM" },
                { id: "4", title: "File Execution", description: "Writing changes to frontend/src/app/page.tsx", status: "pending", type: "action" }
              ]} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
