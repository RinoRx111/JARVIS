"use client";

import React, { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { ContextPanel } from './ContextPanel';
import { ToastContainer } from './ToastContainer';
import { AuthOverlay } from '../auth/AuthOverlay';
import { wsService } from '@/services/websocket';
import { useJarvisStore } from '@/hooks/useJarvisStore';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const token = useJarvisStore((state) => state.token);

  useEffect(() => {
    if (token) {
      wsService.init();
    } else {
      wsService.close();
    }
  }, [token]);

  return (
    <>
      <AuthOverlay />
      <ToastContainer />
      <div className="flex h-screen w-full bg-[#0F0F0F] overflow-hidden">
        <Sidebar />
        <main className="flex-1 h-full overflow-hidden flex flex-col min-w-0">
          {children}
        </main>
        <ContextPanel />
      </div>
    </>
  );
}

