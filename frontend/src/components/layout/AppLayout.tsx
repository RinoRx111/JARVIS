"use client";

import React, { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { ContextPanel } from './ContextPanel';
import { AuthOverlay } from '../auth/AuthOverlay';
import { wsService } from '@/services/websocket';
interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  useEffect(() => {
    wsService.init();
  }, []);

  return (
    <>
      <AuthOverlay />
      <div className="flex h-screen w-full bg-background overflow-hidden selection:bg-primary/30 relative">
        <Sidebar />
        <main className="flex-1 h-full overflow-hidden flex flex-col relative z-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background -z-10" />
          {children}
        </main>
        <ContextPanel />
      </div>
    </>
  );
}
