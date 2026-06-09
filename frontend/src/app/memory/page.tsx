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
    <div className="p-6 md:p-12 w-full h-full flex flex-col gap-6 overflow-y-auto">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-primary/10 rounded-xl text-primary">
          <BrainCircuit size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Long-term Memory</h1>
          <p className="text-sm text-muted-foreground">JARVIS persistent fact database</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 shrink-0">
        <Card className="bg-black/40 border-white/5 backdrop-blur-xl flex-1">
          <CardContent className="p-4">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input 
                  placeholder="Search extracted facts..." 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10 bg-black/40 border-white/10"
                />
              </div>
              <Button type="submit" variant="glass">Search</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20 backdrop-blur-xl flex-1">
          <CardContent className="p-4">
            <form onSubmit={handleAddFact} className="flex gap-4">
              <Input 
                placeholder="E.g., I prefer Next.js over React, or My name is Aditi." 
                value={newFact}
                onChange={(e) => setNewFact(e.target.value)}
                className="bg-black/40 border-primary/20 placeholder:text-primary/40"
              />
              <Button type="submit" variant="default" disabled={adding}>
                {adding ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                Add Detail
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 flex flex-col gap-4">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-primary/50">
            <Loader2 className="animate-spin w-8 h-8" />
          </div>
        ) : store.memories.length === 0 ? (
          <div className="text-center p-12 text-muted-foreground border border-dashed border-white/10 rounded-xl">
            No memories found matching your query.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {store.memories.map((mem) => (
              <Card key={mem.id} className="bg-white/5 border-white/5 hover:border-primary/30 transition-colors group relative overflow-hidden">
                <CardContent className="p-5">
                  <p className="text-sm text-white/90 leading-relaxed mb-4">{mem.content}</p>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>{new Date(mem.created_at).toLocaleDateString()}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => store.deleteMemory(mem.id)}
                      className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
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
