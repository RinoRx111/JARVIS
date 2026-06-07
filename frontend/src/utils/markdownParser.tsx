import React from 'react';

export function parseMarkdown(text: string) {
  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    if (part.startsWith('```')) {
      const match = part.match(/```(\w*)\n([\s\S]*?)```/);
      const language = match ? match[1] : '';
      const code = match ? match[2] : part.slice(3, -3);
      return (
        <div key={i} className="my-3 font-mono-digital text-[11px] bg-black/60 border border-cyan-500/20 rounded p-3 relative group">
          <div className="absolute top-1 right-2 text-[9px] text-cyan-500/40 uppercase font-sans font-bold">
            {language || 'code'}
          </div>
          <pre className="overflow-x-auto text-cyan-300 whitespace-pre-wrap">{code.trim()}</pre>
        </div>
      );
    }
    
    const inlineParts = part.split(/(`[^`\n]+`)/g);
    return (
      <p key={i} className="mb-2.5 leading-relaxed text-xs">
        {inlineParts.map((subPart, j) => {
          if (subPart.startsWith('`') && subPart.endsWith('`')) {
            return (
              <code key={j} className="px-1.5 py-0.5 bg-cyan-950/60 border border-cyan-500/25 rounded text-cyan-400 font-mono text-[10px]">
                {subPart.slice(1, -1)}
              </code>
            );
          }
          return subPart;
        })}
      </p>
    );
  });
}
