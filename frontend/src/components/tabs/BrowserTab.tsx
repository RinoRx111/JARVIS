import React, { useState } from 'react';
import { Play, Loader2, Globe } from 'lucide-react';
import HolographicPanel from '../HolographicPanel';
import { useJarvisStore } from '../../hooks/useJarvisStore';

export default function BrowserTab() {
  const store = useJarvisStore();
  const [browseUrlInput, setBrowseUrlInput] = useState('https://news.ycombinator.com');

  const handleRunBrowser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!browseUrlInput.trim()) return;
    store.runBrowserAutomation(browseUrlInput);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Controls */}
      <div className="space-y-6">
        <HolographicPanel title="Browser Navigation Console" tag="BROWSER_CMD">
          <form onSubmit={handleRunBrowser} className="space-y-4">
            <div>
              <label className="block text-[10px] text-cyan-400/60 uppercase tracking-widest mb-1">Target Address (URL)</label>
              <input
                type="url"
                placeholder="https://news.ycombinator.com"
                value={browseUrlInput}
                onChange={(e) => setBrowseUrlInput(e.target.value)}
                className="w-full bg-slate-950/80 border border-cyan-500/20 rounded px-3 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400"
                required
              />
            </div>
            <button
              type="submit"
              disabled={store.browserStatus === 'running'}
              className="w-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 py-2.5 rounded font-bold uppercase tracking-wider hover:bg-cyan-500/30 transition-all flex items-center justify-center space-x-2"
            >
              {store.browserStatus === 'running' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  <span>Automating...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Initialize Sandbox Navigation</span>
                </>
              )}
            </button>
          </form>
        </HolographicPanel>
        
        <HolographicPanel title="Playwright Execution Logs" tag="BROWSER_TTY">
          <div className="space-y-2 max-h-56 overflow-y-auto text-[10px] font-mono-digital text-cyan-400 leading-normal">
            {store.browserActionsLog.length === 0 ? (
              <p className="text-white/20 italic text-center py-12">Waiting for virtual display instructions...</p>
            ) : (
              store.browserActionsLog.map((act, i) => (
                <div key={i} className="flex items-center space-x-2 py-0.5 border-b border-white/5">
                  <span className="text-cyan-500/40">&gt;</span>
                  <span>{act}</span>
                </div>
              ))
            )}
          </div>
        </HolographicPanel>
      </div>

      {/* Browser Virtual Display screen */}
      <div className="lg:col-span-2">
        <HolographicPanel 
          title="Virtual Frame Display Monitor" 
          tag="PLAYWRIGHT_SCREEN"
          className="h-full min-h-[480px] flex flex-col justify-between"
        >
          {store.browserScreenshotUrl ? (
            <div className="space-y-4">
              {/* Screenshot visual container */}
              <div className="border border-cyan-500/30 rounded bg-slate-900/80 overflow-hidden relative group">
                <img
                  src={`http://localhost:8000${store.browserScreenshotUrl}`}
                  alt="Browser Virtual Viewport"
                  className="w-full h-auto max-h-[360px] object-top object-cover"
                />
                <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-all pointer-events-none" />
              </div>
              
              {/* Title and metadata details */}
              <div className="border-t border-cyan-500/10 pt-3">
                <span className="text-[9px] text-white/30 block mb-1">WEBPAGE_TITLE:</span>
                <span className="text-xs text-cyan-300 font-bold block">{store.browserTitle}</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[380px] text-center border border-dashed border-cyan-500/10 rounded-lg py-20 space-y-4">
              {store.browserStatus === 'running' ? (
                <>
                  <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                  <p className="text-cyan-400 font-bold uppercase tracking-widest animate-pulse">Navigating Virtual Grid Frame...</p>
                </>
              ) : (
                <>
                  <Globe className="w-10 h-10 text-cyan-500/20" />
                  <div>
                    <p className="text-white/40 uppercase tracking-widest">Virtual Stream Standby</p>
                    <p className="text-[9px] text-white/20 mt-1">Submit a URL to launch Playwright Chromium instance</p>
                  </div>
                </>
              )}
            </div>
          )}
        </HolographicPanel>
      </div>
    </div>
  );
}
