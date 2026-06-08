"use client";

import React, { useState } from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';
import HolographicPanel from '../HolographicPanel';
import KnowledgeGraph from '../KnowledgeGraph';
import { useJarvisStore } from '../../hooks/useJarvisStore';

export default function MemoryTab() {
  const store = useJarvisStore();
  const [newMemoryInput, setNewMemoryInput] = useState('');
  const [memorySearchQuery, setMemorySearchQuery] = useState('');

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryInput.trim()) return;
    store.addMemory(newMemoryInput);
    setNewMemoryInput('');
  };

  return (
    <div className="space-y-6">
      {/* Entity nodes diagram */}
      <HolographicPanel title="Cognitive Association Graph Map" tag="KNOWLEDGE_WEB">
        <KnowledgeGraph memories={store.memories} />
      </HolographicPanel>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Add factual inputs */}
        <HolographicPanel title="Register Cognitive Memory" tag="MEM_INSERT">
          <form onSubmit={handleAddMemory} className="space-y-4">
            <div>
              <label className="block text-[10px] text-cyan-400/60 uppercase tracking-widest mb-1">Fact Content</label>
              <textarea
                placeholder="Operator prefers coding in Next.js Tailwind systems..."
                rows={3}
                value={newMemoryInput}
                onChange={(e) => setNewMemoryInput(e.target.value)}
                className="w-full bg-slate-950/80 border border-cyan-500/20 rounded px-3 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 py-2 rounded font-bold uppercase tracking-wider hover:bg-cyan-500/30 transition-all flex items-center justify-center space-x-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Index Memory</span>
            </button>
          </form>
        </HolographicPanel>

        {/* Search and grid lists */}
        <div className="md:col-span-2">
          <HolographicPanel 
            title="Search Vector Memory Core" 
            tag="CHROMA_FACTS_GRID"
            headerActions={
              <div className="flex items-center space-x-2 bg-black/40 border border-cyan-500/20 px-2 py-1 rounded">
                <Search className="w-3.5 h-3.5 text-cyan-500/40" />
                <input
                  type="text"
                  placeholder="Query memory..."
                  value={memorySearchQuery}
                  onChange={(e) => {
                    setMemorySearchQuery(e.target.value);
                    store.fetchMemories(e.target.value);
                  }}
                  className="bg-transparent text-[10px] text-cyan-300 focus:outline-none w-28 placeholder-cyan-900/60 font-mono-digital"
                />
              </div>
            }
          >
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {store.memories.length === 0 ? (
                <p className="text-white/20 italic text-center py-12">No memory units indexed matches query.</p>
              ) : (
                store.memories.map((mem) => (
                  <div key={mem.id} className="flex justify-between items-start p-2.5 bg-slate-900/40 rounded border border-cyan-500/10 hover:border-cyan-500/30 transition-all group">
                    <div className="space-y-1 max-w-[90%]">
                      <span className="text-[10px] text-cyan-200 leading-normal block">{mem.content}</span>
                      <span className="text-[8px] text-white/35 font-mono select-all">INDEX: {mem.id}</span>
                    </div>
                    <button
                      onClick={() => store.deleteMemory(mem.id)}
                      className="text-red-400/40 hover:text-red-400 p-1 bg-red-950/10 hover:bg-red-950/40 rounded border border-red-500/10 transition-all"
                      title="Erase memory token"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </HolographicPanel>
        </div>
      </div>
    </div>
  );
}
