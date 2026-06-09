"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  BrainCircuit, 
  CheckSquare, 
  Bot, 
  FolderSearch, 
  Zap, 
  Settings,
  Menu,
  ChevronLeft,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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

  return (
    <motion.aside
      initial={false}
      animate={{ width: isExpanded ? 220 : 64 }}
      className="h-screen relative flex flex-col border-r border-[#1E2A35] bg-[#0E1318] z-50 overflow-hidden"
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-[#1E2A35]">
        <motion.div 
          animate={{ opacity: isExpanded ? 1 : 0 }}
          className={cn("flex items-center gap-2", !isExpanded && "hidden")}
        >
          <div className="h-6 w-6 rounded-md bg-gradient-to-tr from-[#00C2FF] to-[#7B61FF] shadow-[0_0_15px_rgba(0,194,255,0.3)]" />
          <span className="font-mono-style font-bold tracking-widest text-[#E8EDF2] text-xs uppercase">
            JARVIS
          </span>
        </motion.div>
        
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 rounded-md hover:bg-white/[0.03] transition-colors text-muted-foreground hover:text-[#E8EDF2]"
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
                  "flex items-center gap-3 px-3 py-2.5 transition-all duration-200 group relative rounded-lg",
                  isActive 
                    ? "text-primary bg-transparent" 
                    : "text-muted-foreground hover:bg-white/[0.03] hover:text-[#E8EDF2]"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute left-0 top-0 h-full w-[2px] bg-[#00C2FF] shadow-[0_0_8px_rgba(0,194,255,0.5)]"
                  />
                )}
                <item.icon size={20} className={cn("min-w-[20px]", isActive ? "text-[#00C2FF]" : "group-hover:text-[#E8EDF2]")} />
                
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

      <div className="p-3 border-t border-[#1E2A35]">
        <Link href="/settings">
          <div className={cn(
            "flex items-center gap-3 px-3 py-2.5 transition-all duration-200 group relative rounded-lg",
            pathname === '/settings'
              ? "text-primary bg-transparent"
              : "text-muted-foreground hover:bg-white/[0.03] hover:text-[#E8EDF2]"
          )}>
            {pathname === '/settings' && (
              <motion.div
                layoutId="activeTab"
                className="absolute left-0 top-0 h-full w-[2px] bg-[#00C2FF] shadow-[0_0_8px_rgba(0,194,255,0.5)]"
              />
            )}
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
