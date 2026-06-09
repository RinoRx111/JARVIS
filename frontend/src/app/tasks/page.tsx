"use client";

import React, { useEffect } from 'react';
import { useJarvisStore } from '@/hooks/useJarvisStore';
import { CheckSquare, Play, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function TasksPage() {
  const store = useJarvisStore();
  const fetchAgentTasks = useJarvisStore((state) => state.fetchAgentTasks);

  useEffect(() => {
    fetchAgentTasks();
  }, [fetchAgentTasks]);

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'running': return <Play size={16} className="text-[#00C2FF]" />;
      case 'completed': return <CheckCircle2 size={16} className="text-[#00E5A0]" />;
      case 'failed': return <XCircle size={16} className="text-[#FF4D4D]" />;
      default: return <Clock size={16} className="text-[#F5A623]" />;
    }
  };

  return (
    <div className="p-6 md:p-12 w-full h-full flex flex-col gap-6 overflow-y-auto bg-background">
      <div className="flex items-center gap-4 border-b border-[#1E2A35]/30 pb-6">
        <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0">
          <CheckSquare size={24} />
        </div>
        <div>
          <h1 className="text-lg font-mono uppercase tracking-widest text-[#E8EDF2] font-bold">Background Tasks</h1>
          <p className="text-xs text-[#6B7F8E]">Monitor autonomous agent operations</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4 mt-4">
        {store.agentTasks.length === 0 ? (
          <div className="text-center p-12 text-[#6B7F8E] border border-dashed border-[#1E2A35] rounded-xl text-xs font-mono uppercase tracking-wider">
            No active agent tasks.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {store.agentTasks.map((task) => (
              <Card key={task.id} className="bg-[#0E1318] border-[#1E2A35] hover:shadow-[0_0_12px_rgba(0,194,255,0.15)] transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-[#E8EDF2] text-sm">{task.title}</h3>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(task.status)}
                    </div>
                  </div>
                  {task.description && (
                    <p className="text-xs text-[#6B7F8E] mb-4 line-clamp-2">{task.description}</p>
                  )}
                  <div className="flex justify-between items-center text-xs text-muted-foreground mt-4 pt-4 border-t border-[#1E2A35]">
                    <span>Task #{task.id}</span>
                    <span>{new Date(task.created_at).toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
