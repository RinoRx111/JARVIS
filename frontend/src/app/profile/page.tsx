import React from 'react';
import ProfileTab from '@/components/tabs/ProfileTab';
import { UserCircle } from 'lucide-react';

export default function ProfilePage() {
  return (
    <div className="p-6 md:p-12 w-full h-full flex flex-col gap-6 overflow-y-auto bg-background">
      <div className="flex items-center gap-4 border-b border-[#1E2A35]/30 pb-6 shrink-0">
        <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0">
          <UserCircle size={24} />
        </div>
        <div>
          <h1 className="text-lg font-mono uppercase tracking-widest text-[#E8EDF2] font-bold">Identity & Telemetry</h1>
          <p className="text-xs text-[#6B7F8E]">Manage your operator identity and view active grid APIs</p>
        </div>
      </div>
      
      <div className="flex-1 mt-4">
        <ProfileTab />
      </div>
    </div>
  );
}
