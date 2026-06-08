import React from 'react';
import ProfileTab from '@/components/tabs/ProfileTab';

export default function ProfilePage() {
  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <header className="h-16 flex items-center px-6 border-b border-white/5 bg-black/20 backdrop-blur-md shrink-0">
        <h1 className="text-lg font-medium text-white">Operator Profile</h1>
      </header>
      
      <div className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-12 custom-scrollbar">
        <div className="max-w-5xl mx-auto w-full">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white tracking-wide">Identity & Telemetry</h2>
            <p className="text-sm text-muted-foreground mt-1">Manage your operator identity and view active grid APIs.</p>
          </div>
          
          <ProfileTab />
        </div>
      </div>
    </div>
  );
}
