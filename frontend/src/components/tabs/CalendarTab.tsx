import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import HolographicPanel from '../HolographicPanel';
import { useJarvisStore } from '../../hooks/useJarvisStore';

export default function CalendarTab() {
  const store = useJarvisStore();
  const [calSummary, setCalSummary] = useState('');
  const [calStart, setCalStart] = useState('');
  const [calEnd, setCalEnd] = useState('');
  const [calDesc, setCalDesc] = useState('');

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calSummary.trim() || !calStart.trim() || !calEnd.trim()) return;
    const success = await store.createEvent(
      calSummary, 
      new Date(calStart).toISOString(), 
      new Date(calEnd).toISOString(), 
      calDesc
    );
    if (success) {
      setCalSummary('');
      setCalStart('');
      setCalEnd('');
      setCalDesc('');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Create calendar item */}
      <HolographicPanel title="Synchronize Calendar Event" tag="CALENDAR_WRITE">
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <div>
            <label className="block text-[10px] text-cyan-400/60 uppercase tracking-widest mb-1">Event Summary</label>
            <input
              type="text"
              placeholder="Reactor Core Calibration"
              value={calSummary}
              onChange={(e) => setCalSummary(e.target.value)}
              className="w-full bg-slate-950/80 border border-cyan-500/20 rounded px-3 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-cyan-400/60 uppercase tracking-widest mb-1">Start Time</label>
              <input
                type="datetime-local"
                value={calStart}
                onChange={(e) => setCalStart(e.target.value)}
                className="w-full bg-slate-950/80 border border-cyan-500/20 rounded px-2.5 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] text-cyan-400/60 uppercase tracking-widest mb-1">End Time</label>
              <input
                type="datetime-local"
                value={calEnd}
                onChange={(e) => setCalEnd(e.target.value)}
                className="w-full bg-slate-950/80 border border-cyan-500/20 rounded px-2.5 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] text-cyan-400/60 uppercase tracking-widest mb-1">Event Description</label>
            <textarea
              placeholder="Log thermal margin configurations..."
              rows={3}
              value={calDesc}
              onChange={(e) => setCalDesc(e.target.value)}
              className="w-full bg-slate-950/80 border border-cyan-500/20 rounded px-3 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 py-2 rounded font-bold uppercase tracking-wider hover:bg-cyan-500/30 transition-all flex items-center justify-center space-x-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Event</span>
          </button>
        </form>
      </HolographicPanel>

      {/* Calendar details */}
      <div className="lg:col-span-2 space-y-6">
        {/* Event lists */}
        <HolographicPanel title="Calibrated Agenda Timeline" tag="GOOGLE_EVENTS">
          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {store.events.length === 0 ? (
              <div className="text-white/20 italic text-center py-12">No agenda events synchronizing.</div>
            ) : (
              store.events.map((ev) => (
                <div key={ev.id} className="flex border-l-2 border-cyan-500 bg-slate-900/30 p-3 rounded hover:bg-slate-900/50 transition-all justify-between items-start">
                  <div className="space-y-1 max-w-[85%]">
                    <span className="font-bold text-cyan-300 text-[11px] block">{ev.summary}</span>
                    {ev.description && <span className="text-[10px] text-white/45 block leading-normal">{ev.description}</span>}
                  </div>
                  <div className="text-right text-[9px] text-cyan-400 font-bold shrink-0">
                    <span>{new Date(ev.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    <span className="text-white/30 block mt-0.5">{new Date(ev.start).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </HolographicPanel>

        {/* AI Suggestions slots */}
        <HolographicPanel title="AI Schedule Optimizations" tag="JARVIS_SCHEDULER">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {store.scheduleSuggestions.length === 0 ? (
              <div className="text-white/20 italic text-center py-6 col-span-2">Suggestions matrix standby.</div>
            ) : (
              store.scheduleSuggestions.map((sug, i) => (
                <div key={i} className="border border-amber-500/20 bg-amber-950/5 p-3 rounded hover:border-amber-500/40 transition-all space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] border-b border-white/5 pb-1">
                    <span className="font-bold text-amber-400 uppercase tracking-wider">{sug.title}</span>
                    <span className="text-amber-500 font-bold">{sug.time_range}</span>
                  </div>
                  <p className="text-[10px] text-amber-200/80 leading-normal">{sug.reason}</p>
                </div>
              ))
            )}
          </div>
        </HolographicPanel>
      </div>
    </div>
  );
}
