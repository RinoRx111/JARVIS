"use client";

import React, { useEffect, useState } from 'react';
import { useJarvisStore } from '@/hooks/useJarvisStore';
import { BrainCircuit, Search, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

export default function MemoryPage() {
  const store = useJarvisStore();
  const fetchMemories = useJarvisStore((state) => state.fetchMemories);
  const [query, setQuery] = useState('');
  const [newFact, setNewFact] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchMemories().finally(() => setLoading(false));
  }, [fetchMemories]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    store.fetchMemories(query).finally(() => setLoading(false));
  };

  const handleAddFact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFact.trim()) return;
    setAdding(true);
    await store.addMemory(newFact);
    setNewFact('');
    setAdding(false);
  };

  return (
    <div className="p-6 md:p-12 w-full h-full flex flex-col gap-6 overflow-y-auto bg-background text-[#E8EDF2]">
      <div className="flex items-center gap-4 border-b border-[#1E2A35]/30 pb-6 shrink-0">
        <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0">
          <BrainCircuit size={24} />
        </div>
        <div>
          <h1 className="text-lg font-mono uppercase tracking-widest text-[#E8EDF2] font-bold">Long-term Memory</h1>
          <p className="text-xs text-[#6B7F8E]">JARVIS persistent fact database</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 shrink-0 mt-4">
        <Card className="bg-[#0E1318] border-[#1E2A35] flex-1 rounded-xl">
          <CardContent className="p-4">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7F8E]" size={16} />
                <Input 
                  placeholder="Search extracted facts..." 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10 bg-[#141B22] border-[#1E2A35] text-[#E8EDF2] focus:border-[#00C2FF] focus:ring-0 text-sm h-10 rounded-lg"
                />
              </div>
              <Button type="submit" variant="ghost" className="text-xs font-mono uppercase tracking-wider border border-[#1E2A35] text-[#6B7F8E] hover:text-[#00C2FF] hover:border-[#00C2FF] h-10 px-4 rounded-lg transition-all">Search</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-[#0E1318] border-[#1E2A35] flex-1 rounded-xl">
          <CardContent className="p-4">
            <form onSubmit={handleAddFact} className="flex gap-4">
              <Input 
                placeholder="E.g., I prefer Next.js over React, or My name is Aditi." 
                value={newFact}
                onChange={(e) => setNewFact(e.target.value)}
                className="bg-[#141B22] border-[#1E2A35] text-[#E8EDF2] placeholder-[#6B7F8E] focus:border-[#00C2FF] focus:ring-0 text-sm h-10 rounded-lg"
              />
              <Button type="submit" className="bg-[#00C2FF] text-[#080B0F] hover:bg-[#00C2FF]/85 border-0 font-bold uppercase text-xs rounded-lg h-10 px-4 transition-all" disabled={adding}>
                {adding ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                Add Detail
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 mt-4">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-[#00C2FF]">
            <Loader2 className="animate-spin w-8 h-8" />
          </div>
        ) : store.memories.length === 0 ? (
          <div className="text-center p-12 text-[#6B7F8E] border border-dashed border-[#1E2A35] rounded-xl text-xs font-mono uppercase tracking-wider">
            No memories found matching your query.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {store.memories.map((mem) => (
              <Card key={mem.id} className="bg-[#0E1318] border-[#1E2A35] hover:shadow-[0_0_12px_rgba(0,194,255,0.15)] transition-all group relative overflow-hidden">
                <CardContent className="p-5">
                  <p className="text-sm text-[#E8EDF2] leading-relaxed mb-4">{mem.content}</p>
                  <div className="flex justify-between items-center text-xs text-[#6B7F8E]">
                    <span>{new Date(mem.created_at).toLocaleDateString()}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => store.deleteMemory(mem.id)}
                      className="h-8 w-8 text-[#FF4D4D] hover:bg-[#FF4D4D]/10 hover:text-[#FF4D4D] opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </Button>
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
