"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  BrainCircuit,
  CheckSquare,
  Bot,
  FolderSearch,
  Zap,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Activity,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useJarvisStore } from '@/hooks/useJarvisStore';

const navItems = [
  { name: 'Chat',        icon: MessageSquare, href: '/' },
  { name: 'Memory',      icon: BrainCircuit,  href: '/memory' },
  { name: 'Tasks',       icon: CheckSquare,   href: '/tasks' },
  { name: 'Agents',      icon: Bot,           href: '/agents' },
  { name: 'Files',       icon: FolderSearch,  href: '/files' },
  { name: 'Automations', icon: Zap,           href: '/automations' },
  { name: 'Analytics',   icon: Activity,      href: '/analytics' },
];

import { UserButton } from '@clerk/nextjs';

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const wsConnected = useJarvisStore((s) => s.wsConnected);
  const coreStatus = useJarvisStore((s) => s.coreStatus);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 56 : 220 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="h-screen flex flex-col shrink-0 border-r border-[#1F1F1F] bg-[#111111] z-50 overflow-hidden select-none"
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between px-3 border-b border-[#1F1F1F]">
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2.5 overflow-hidden"
            >
              <div className="h-6 w-6 rounded-md bg-indigo-500 flex items-center justify-center shrink-0">
                <Sparkles size={12} className="text-white" />
              </div>
              <span className="font-semibold text-[13px] text-[#EDEDED] tracking-tight whitespace-nowrap">
                JARVIS
              </span>
              {/* Status dot */}
              <span
                className={cn(
                  "ml-0.5 h-1.5 w-1.5 rounded-full shrink-0",
                  wsConnected ? "bg-emerald-400 pulse-dot" : "bg-[#3A3A3A]"
                )}
                title={wsConnected ? "Connected" : "Disconnected"}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {collapsed && (
          <div className="h-6 w-6 rounded-md bg-indigo-500 flex items-center justify-center mx-auto">
            <Sparkles size={12} className="text-white" />
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "p-1.5 rounded-md text-[#616161] hover:text-[#EDEDED] hover:bg-[#1C1C1C]",
            collapsed && "mx-auto mt-0 ml-auto"
          )}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 flex flex-col gap-0.5 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-2.5 py-2 rounded-md transition-colors relative group",
                  isActive
                    ? "bg-[#1C1C1C] text-[#EDEDED]"
                    : "text-[#8F8F8F] hover:bg-[#171717] hover:text-[#EDEDED]"
                )}
                title={collapsed ? item.name : undefined}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 bg-indigo-500 rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <item.icon
                  size={16}
                  className={cn("shrink-0", isActive ? "text-indigo-400" : "text-inherit")}
                />
                <AnimatePresence initial={false}>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -6 }}
                      transition={{ duration: 0.15 }}
                      className="text-[13px] font-medium whitespace-nowrap"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-[#1F1F1F] flex flex-col gap-2">
        <Link href="/settings">
          <div
            className={cn(
              "flex items-center gap-3 px-2.5 py-2 rounded-md transition-colors",
              pathname === '/settings'
                ? "bg-[#1C1C1C] text-[#EDEDED]"
                : "text-[#8F8F8F] hover:bg-[#171717] hover:text-[#EDEDED]"
            )}
            title={collapsed ? "Settings" : undefined}
          >
            <Settings size={16} className="shrink-0" />
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.15 }}
                  className="text-[13px] font-medium whitespace-nowrap"
                >
                  Settings
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </Link>
        <div className={cn("flex items-center px-2.5 py-2 transition-colors", collapsed ? "justify-center" : "justify-between border-t border-[#1F1F1F]/40 pt-2")}>
          <UserButton afterSignOutUrl="/" showName={!collapsed} appearance={{
            elements: {
              userButtonAvatarBox: "h-6 w-6",
              userButtonOuterIdentifier: "text-xs text-[#EDEDED] font-medium"
            }
          }} />
        </div>
      </div>
    </motion.aside>
  );
}
