"use client";
import React, { useEffect } from "react";
import { ActivityTimeline } from "@/components/agents/ActivityTimeline";
import { useJarvisStore } from "@/hooks/useJarvisStore";
import { Bot } from "lucide-react";

export default function AgentsPage() {
  const store = useJarvisStore();
  const fetchAgentConfig = useJarvisStore((state) => state.fetchAgentConfig);
  
  useEffect(() => {
    fetchAgentConfig();
  }, [fetchAgentConfig]);

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
    <div className="p-6 md:p-12 w-full h-full flex flex-col gap-6 overflow-y-auto bg-background">
      <div className="flex items-center gap-4 border-b border-[#1E2A35]/30 pb-6 shrink-0">
        <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0">
          <Bot size={24} />
        </div>
        <div>
          <h1 className="text-lg font-mono uppercase tracking-widest text-[#E8EDF2] font-bold">Agent Command Center</h1>
          <p className="text-xs text-[#6B7F8E]">Monitor and control autonomous subagents</p>
        </div>
      </div>
      
      <div className="flex-1 mt-4">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          <div className="xl:col-span-2 space-y-6">
            <h2 className="text-xs font-mono font-bold tracking-widest text-[#00C2FF] uppercase">Agent Marketplace</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agentsList.map((agent) => (
                <div key={agent.id} className="glass-card p-4 rounded-xl flex items-center justify-between border border-[#1E2A35] transition hover:shadow-[0_0_12px_rgba(0,194,255,0.15)] bg-[#0E1318]/50">
                  <div className="flex items-center gap-3">
                    <div className="text-lg">{agent.icon}</div>
                    <div>
                      <h3 className="text-sm font-medium text-[#E8EDF2]">{agent.name}</h3>
                      <p className="text-xs text-[#6B7F8E] mt-0.5 max-w-[200px] leading-relaxed">{agent.desc}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => toggleAgent(agent.id, config[agent.id])}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[#080B0F] ${config[agent.id] ? 'bg-primary' : 'bg-[#1E2A35]'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-[#080B0F] transition-transform ${config[agent.id] ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-6">
            <h2 className="text-xs font-mono font-bold tracking-widest text-[#00C2FF] uppercase">Global Activity Feed</h2>
            <div className="glass-card p-6 rounded-xl border border-[#1E2A35] bg-[#0E1318]/50">
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
