import React from 'react';

export default function HomePage() {
  return (
    <main className="flex min-height-screen flex-col items-center justify-center p-8 md:p-24 relative overflow-hidden">
      {/* Background visual element */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full filter blur-[150px] opacity-10 animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-400 rounded-full filter blur-[150px] opacity-10 animate-pulse pointer-events-none"></div>

      {/* Main Console */}
      <div className="z-10 w-full max-w-5xl items-center justify-between text-sm glass-panel rounded-2xl p-8 md:p-12 border border-cyan-500/20 relative shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        
        {/* Top bar */}
        <div className="flex justify-between items-center border-b border-cyan-500/10 pb-6 mb-8">
          <div>
            <h1 className="text-4xl font-extrabold tracking-wider text-cyan-400 text-neon">JARVIS</h1>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-500/60 mt-1">AI Operating System</p>
          </div>
          <div className="flex items-center space-x-2 bg-cyan-950/40 border border-cyan-500/30 px-3 py-1.5 rounded-full">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-xs font-mono text-emerald-400 tracking-wide uppercase">Core Online</span>
          </div>
        </div>

        {/* Content body */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Visualizer Panel */}
          <div className="md:col-span-2 flex flex-col justify-between min-h-[300px] border border-cyan-500/10 p-6 rounded-xl bg-slate-950/40">
            <div className="flex justify-between items-center text-xs font-mono text-cyan-500/60">
              <span>[SYSTEM LOGS]</span>
              <span>STANDBY MODE</span>
            </div>
            
            <div className="flex flex-col items-center justify-center my-8 space-y-4">
              {/* Circular Hologram Visualizer */}
              <div className="w-28 h-28 rounded-full border-2 border-dashed border-cyan-400/30 flex items-center justify-center animate-spin">
                <div className="w-20 h-20 rounded-full border border-cyan-400/50 flex items-center justify-center animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-cyan-400/20 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-cyan-400"></div>
                  </div>
                </div>
              </div>
              <p className="text-xs font-mono text-cyan-400 animate-pulse uppercase tracking-wider">Listening for initialization...</p>
            </div>

            <div className="border-t border-cyan-500/10 pt-4 flex space-x-2">
              <input 
                type="text" 
                placeholder="Initialize console connection..." 
                disabled 
                className="flex-1 bg-slate-950/80 border border-cyan-500/20 rounded-lg px-4 py-2 text-xs text-cyan-400 placeholder-cyan-700/50 focus:outline-none"
              />
              <button disabled className="bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider">
                Send
              </button>
            </div>
          </div>

          {/* Side Info Panel */}
          <div className="flex flex-col space-y-6">
            {/* System Specs */}
            <div className="border border-cyan-500/10 p-5 rounded-xl bg-slate-950/40 space-y-4">
              <h2 className="text-xs font-mono text-cyan-500/60 uppercase tracking-widest border-b border-cyan-500/10 pb-2">Modules Status</h2>
              <div className="space-y-2.5 font-mono text-xs text-cyan-300">
                <div className="flex justify-between">
                  <span>Voice Transcriber:</span>
                  <span className="text-emerald-400 font-bold">READY</span>
                </div>
                <div className="flex justify-between">
                  <span>Voice Synthesizer:</span>
                  <span className="text-emerald-400 font-bold">READY</span>
                </div>
                <div className="flex justify-between">
                  <span>Agent Graph:</span>
                  <span className="text-cyan-400">CONFIGURED</span>
                </div>
                <div className="flex justify-between">
                  <span>Chroma Memory:</span>
                  <span className="text-cyan-400">PERSISTED</span>
                </div>
                <div className="flex justify-between">
                  <span>Sandboxed Env:</span>
                  <span className="text-amber-400">DISCONNECTED</span>
                </div>
              </div>
            </div>

            {/* Quick Actions Placeholder */}
            <div className="border border-cyan-500/10 p-5 rounded-xl bg-slate-950/40 space-y-3">
              <h2 className="text-xs font-mono text-cyan-500/60 uppercase tracking-widest border-b border-cyan-500/10 pb-2">Core Commands</h2>
              <div className="space-y-2">
                <button disabled className="w-full text-left bg-cyan-950/20 border border-cyan-500/20 rounded p-2 text-[11px] font-mono text-cyan-400/80 hover:bg-cyan-950/40">
                  &gt; jarvis --status
                </button>
                <button disabled className="w-full text-left bg-cyan-950/20 border border-cyan-500/20 rounded p-2 text-[11px] font-mono text-cyan-400/80 hover:bg-cyan-950/40">
                  &gt; jarvis --test-sandbox
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex justify-between items-center border-t border-cyan-500/10 mt-8 pt-6 text-[10px] font-mono text-cyan-700/85">
          <span>JARVIS OS CONFIGURATION LOADED</span>
          <span>© 2026 JARVIS CORE LABS</span>
        </div>
      </div>
    </main>
  );
}
