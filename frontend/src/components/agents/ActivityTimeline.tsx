import React from "react";
import { Check, Loader2, BrainCircuit, Search, Code, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

export type TimelineEventStatus = "pending" | "running" | "completed" | "failed";

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  status: TimelineEventStatus;
  type: "thinking" | "search" | "code" | "action";
  time?: string;
}

const iconMap = {
  thinking: BrainCircuit,
  search: Search,
  code: Code,
  action: Terminal,
};

export function ActivityTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="relative space-y-4 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
      {events.map((event, index) => {
        const Icon = iconMap[event.type];
        
        return (
          <div key={event.id} className="relative flex items-start gap-4">
            <div 
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full border shrink-0 z-10 backdrop-blur-sm transition-all duration-300",
                event.status === "completed" ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]" :
                event.status === "running" ? "bg-primary/20 border-primary/50 text-primary shadow-[0_0_15px_rgba(0,216,255,0.4)] animate-pulse" :
                event.status === "failed" ? "bg-destructive/20 border-destructive/50 text-destructive shadow-[0_0_15px_rgba(255,0,0,0.2)]" :
                "bg-black/50 border-white/10 text-muted-foreground"
              )}
            >
              {event.status === "running" ? (
                <Loader2 size={18} className="animate-spin" />
              ) : event.status === "completed" ? (
                <Check size={18} />
              ) : (
                <Icon size={18} />
              )}
            </div>
            
            <div className="flex flex-col flex-1 pt-1">
              <div className="flex items-center justify-between">
                <h4 className={cn(
                  "text-sm font-semibold tracking-wide",
                  event.status === "completed" ? "text-white" :
                  event.status === "running" ? "text-primary" :
                  "text-muted-foreground"
                )}>
                  {event.title}
                </h4>
                {event.time && (
                  <span className="text-[10px] text-muted-foreground font-mono">{event.time}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {event.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
