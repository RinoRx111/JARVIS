"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  BrainCircuit, 
  CheckSquare, 
  Bot, 
  FolderSearch, 
  Mail, 
  CalendarDays, 
  Zap, 
  Settings,
  Menu,
  ChevronLeft,
  LogOut,
  UserCircle,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useJarvisStore } from '@/hooks/useJarvisStore';

const navItems = [
  { name: 'AI Chat', icon: MessageSquare, href: '/' },
  { name: 'Memory', icon: BrainCircuit, href: '/memory' },
  { name: 'Tasks', icon: CheckSquare, href: '/tasks' },
  { name: 'Agents', icon: Bot, href: '/agents' },
  { name: 'Files', icon: FolderSearch, href: '/files' },
  { name: 'Automations', icon: Zap, href: '/automations' },
  { name: 'Analytics', icon: Activity, href: '/analytics' },
];

export function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(true);
  const pathname = usePathname();
  const store = useJarvisStore();

  return (
    <motion.aside
      initial={false}
      animate={{ width: isExpanded ? 240 : 72 }}
      className="h-screen relative flex flex-col border-r border-white/5 bg-black/40 backdrop-blur-xl z-50 overflow-hidden"
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-white/5">
        <motion.div 
          animate={{ opacity: isExpanded ? 1 : 0 }}
          className={cn("flex items-center gap-2", !isExpanded && "hidden")}
        >
          <div className="h-6 w-6 rounded-md bg-gradient-to-tr from-cyan-500 to-blue-500 shadow-[0_0_15px_rgba(0,216,255,0.4)]" />
          <span className="font-orbitron font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
            JARVIS
          </span>
        </motion.div>
        
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-muted-foreground hover:text-white"
        >
          {isExpanded ? <ChevronLeft size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <nav className="flex-1 py-6 px-3 flex flex-col gap-2 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                  isActive 
                    ? "bg-primary/10 text-primary shadow-[inset_0_0_20px_rgba(0,216,255,0.05)]" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_10px_rgba(0,216,255,0.6)]"
                  />
                )}
                <item.icon size={20} className={cn("min-w-[20px]", isActive ? "text-primary" : "group-hover:text-white")} />
                
                <motion.span 
                  animate={{ opacity: isExpanded ? 1 : 0, x: isExpanded ? 0 : -10 }}
                  className={cn("font-medium text-sm whitespace-nowrap", !isExpanded && "hidden")}
                >
                  {item.name}
                </motion.span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/5">
        <Link href="/settings">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-muted-foreground hover:bg-white/5 hover:text-white">
            <Settings size={20} className="min-w-[20px]" />
            <motion.span 
              animate={{ opacity: isExpanded ? 1 : 0 }}
              className={cn("font-medium text-sm whitespace-nowrap", !isExpanded && "hidden")}
            >
              Settings
            </motion.span>
          </div>
        </Link>
      </div>
    </motion.aside>
  );
}
