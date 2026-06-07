"use client";

import React, { useEffect, useState } from 'react';
import { useJarvisStore } from '@/hooks/useJarvisStore';
import { Mail, Send, Inbox, RefreshCw, PenSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function EmailPage() {
  const store = useJarvisStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    handleRefresh();
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    await store.fetchEmails();
    setLoading(false);
  };

  return (
    <div className="p-6 md:p-12 w-full h-full flex flex-col gap-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl text-primary">
            <Mail size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide">Secure Comm-Link</h1>
            <p className="text-sm text-muted-foreground">Gmail inbox and dispatch center</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={loading} className={loading ? "animate-spin" : ""}>
            <RefreshCw size={18} />
          </Button>
          <Button variant="glass">
            <PenSquare size={16} className="mr-2" />
            Compose
          </Button>
        </div>
      </div>

      <div className="flex-1 mt-6">
        {store.emails.length === 0 ? (
          <div className="text-center p-12 text-muted-foreground border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-4">
            <Inbox size={48} className="text-white/10" />
            <p>Inbox is empty or requires Google Auth token synchronization.</p>
            <Button variant="outline" size="sm">Connect Gmail API</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {store.emails.map((email) => (
              <Card key={email.id} className="bg-white/5 border-white/5 hover:border-primary/30 transition-colors cursor-pointer group">
                <CardContent className="p-4 flex gap-4 items-start">
                  <div className="p-2 bg-white/5 rounded-full mt-1">
                    <Mail size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="font-semibold text-white truncate">{email.subject}</h3>
                      <span className="text-xs text-muted-foreground ml-4 shrink-0">Today</span>
                    </div>
                    <p className="text-sm text-primary/70 mb-1">{email.from}</p>
                    <p className="text-sm text-white/50 truncate">{email.snippet}</p>
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
