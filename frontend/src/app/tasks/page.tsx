"use client";

import React, { useEffect } from 'react';
import { useJarvisStore } from '@/hooks/useJarvisStore';
import { CheckSquare, Loader2, Play, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function TasksPage() {
  const store = useJarvisStore();

  useEffect(() => {
    store.fetchAgentTasks();
  }, []);

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'running': return <Play size={16} className="text-blue-400" />;
      case 'completed': return <CheckCircle2 size={16} className="text-green-400" />;
      case 'failed': return <XCircle size={16} className="text-red-400" />;
      default: return <Clock size={16} className="text-yellow-400" />;
    }
  };

  return (
    <div className="p-6 md:p-12 w-full h-full flex flex-col gap-6 overflow-y-auto">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-primary/10 rounded-xl text-primary">
          <CheckSquare size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Background Tasks</h1>
          <p className="text-sm text-muted-foreground">Monitor autonomous agent operations</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4 mt-6">
        {store.agentTasks.length === 0 ? (
          <div className="text-center p-12 text-muted-foreground border border-dashed border-white/10 rounded-xl">
            No background tasks found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {store.agentTasks.map((task) => (
              <Card key={task.id} className="bg-white/5 border-white/5 hover:border-white/10 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-white">{task.title}</h3>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(task.status)}
                    </div>
                  </div>
                  {task.description && (
                    <p className="text-sm text-white/60 mb-4 line-clamp-2">{task.description}</p>
                  )}
                  <div className="flex justify-between items-center text-xs text-muted-foreground mt-4 pt-4 border-t border-white/5">
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
