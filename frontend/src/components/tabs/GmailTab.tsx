"use client";

import React, { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import HolographicPanel from '../HolographicPanel';
import { useJarvisStore } from '../../hooks/useJarvisStore';

export default function GmailTab() {
  const store = useJarvisStore();
  const [mailTo, setMailTo] = useState('');
  const [mailSubject, setMailSubject] = useState('');
  const [mailBody, setMailBody] = useState('');

  const handleSendMail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mailTo.trim() || !mailSubject.trim()) return;
    const success = await store.sendEmail(mailTo, mailSubject, mailBody);
    if (success) {
      setMailTo('');
      setMailSubject('');
      setMailBody('');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Create email form */}
      <HolographicPanel title="Draft Secure Dispatch" tag="GMAIL_SMTP">
        <form onSubmit={handleSendMail} className="space-y-4">
          <div>
            <label className="block text-[10px] text-cyan-400/60 uppercase tracking-widest mb-1">To (Recipient)</label>
            <input
              type="email"
              placeholder="pepper.potts@starkindustries.com"
              value={mailTo}
              onChange={(e) => setMailTo(e.target.value)}
              className="w-full bg-slate-950/80 border border-cyan-500/20 rounded px-3 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] text-cyan-400/60 uppercase tracking-widest mb-1">Subject</label>
            <input
              type="text"
              placeholder="Decoupled reactor thermal margins"
              value={mailSubject}
              onChange={(e) => setMailSubject(e.target.value)}
              className="w-full bg-slate-950/80 border border-cyan-500/20 rounded px-3 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] text-cyan-400/60 uppercase tracking-widest mb-1">Body Context</label>
            <textarea
              placeholder="Write mail details..."
              rows={5}
              value={mailBody}
              onChange={(e) => setMailBody(e.target.value)}
              className="w-full bg-slate-950/80 border border-cyan-500/20 rounded px-3 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 py-2 rounded font-bold uppercase tracking-wider hover:bg-cyan-500/30 transition-all flex items-center justify-center space-x-2"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Mail</span>
          </button>
        </form>
      </HolographicPanel>

      {/* Mail inbox details */}
      <div className="lg:col-span-2">
        <HolographicPanel title="Decrypted Mail Inbox" tag="GMAIL_IMAP">
          <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
            {store.emails.length === 0 ? (
              <div className="text-white/20 italic text-center py-24">No messages parsed in inbox.</div>
            ) : (
              store.emails.map((mail) => (
                <div key={mail.id} className="border border-cyan-500/10 bg-slate-900/40 p-3.5 rounded-lg space-y-2 hover:border-cyan-500/30 transition-all">
                  <div className="flex justify-between items-center text-[10px] border-b border-white/5 pb-1">
                    <span className="font-bold text-cyan-300 truncate max-w-xs">{mail.from}</span>
                    <span className="text-cyan-500/50 select-all font-mono">ID: {mail.id}</span>
                  </div>
                  <span className="text-[11px] text-cyan-100 font-bold block">{mail.subject}</span>
                  <p className="text-[10px] text-white/50 leading-relaxed">{mail.snippet}</p>
                  
                  {/* Smart Reply triggers */}
                  <div className="border-t border-cyan-500/5 pt-2 mt-2 flex justify-end">
                    <button
                      onClick={async () => {
                        const draft = await store.generateSmartReply(mail.id, mail.snippet);
                        setMailTo(mail.from.match(/<([^>]+)>/)?.[1] || mail.from);
                        setMailSubject(`Re: ${mail.subject}`);
                        setMailBody(draft);
                        store.addNotification("Smart Reply generated and loaded in editor.");
                      }}
                      className="flex items-center space-x-1 text-[9px] bg-cyan-500/10 hover:bg-cyan-500/25 border border-cyan-500/25 text-cyan-300 px-2 py-0.8 rounded tracking-wider uppercase transition-all"
                    >
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      <span>AI Smart Reply</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </HolographicPanel>
      </div>
    </div>
  );
}
