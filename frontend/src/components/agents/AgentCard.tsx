import React from "react";
import { Bot, Play, Square, Settings2, Activity } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface AgentCardProps {
  name: string;
  status: "idle" | "running" | "completed" | "failed";
  task: string;
  progress: number;
  runtime: string;
}

export function AgentCard({ name, status, task, progress, runtime }: AgentCardProps) {
  const isRunning = status === "running";

  return (
    <Card className="group relative overflow-hidden transition-all duration-500 hover:shadow-[0_0_30px_rgba(0,216,255,0.15)] hover:border-primary/30">
      {isRunning && (
        <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
          <div 
            className="h-full bg-primary shadow-[0_0_10px_rgba(0,216,255,0.8)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg border ${isRunning ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-white/5 border-white/10 text-muted-foreground'}`}>
            <Bot size={20} className={isRunning ? 'animate-pulse' : ''} />
          </div>
          <CardTitle className="text-base">{name}</CardTitle>
        </div>
        <Badge 
          variant={isRunning ? "default" : status === "completed" ? "success" : status === "failed" ? "destructive" : "secondary"}
          className="uppercase tracking-wider text-[10px]"
        >
          {status}
        </Badge>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4 mt-2">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground font-medium uppercase tracking-wider">Current Task</span>
              <span className="text-muted-foreground font-mono">{runtime}</span>
            </div>
            <p className="text-sm text-white/90 line-clamp-2 min-h-[40px] leading-relaxed">
              {task}
            </p>
          </div>
          
          {isRunning && (
            <div className="flex items-center gap-2 text-xs text-primary font-mono">
              <Activity size={14} className="animate-pulse" />
              <span>{progress}% COMPLETED</span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="pt-2 gap-2">
        <Button variant={isRunning ? "destructive" : "default"} size="sm" className="w-full font-bold tracking-widest text-[10px]">
          {isRunning ? (
            <><Square size={12} className="mr-2" /> STOP</>
          ) : (
            <><Play size={12} className="mr-2" /> START</>
          )}
        </Button>
        <Button variant="outline" size="sm" className="w-10 px-0 shrink-0">
          <Settings2 size={14} />
        </Button>
      </CardFooter>
    </Card>
  );
}
