import React from 'react';
import clsx from 'clsx';

interface HolographicPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  tag?: string;
  variant?: 'cyan' | 'amber' | 'red';
  headerActions?: React.ReactNode;
}

export default function HolographicPanel({
  children,
  title,
  tag,
  variant = 'cyan',
  className,
  headerActions,
  ...props
}: HolographicPanelProps) {
  
  const borderClass = clsx({
    'border-cyan-500/30 shadow-[0_0_15px_rgba(0,243,255,0.05)]': variant === 'cyan',
    'border-amber-500/30 shadow-[0_0_15px_rgba(255,170,0,0.05)]': variant === 'amber',
    'border-red-500/30 shadow-[0_0_15px_rgba(255,0,85,0.05)]': variant === 'red',
  });

  const textClass = clsx({
    'text-cyan-400': variant === 'cyan',
    'text-amber-400': variant === 'amber',
    'text-red-400': variant === 'red',
  });

  const decorationBg = clsx({
    'bg-cyan-500/50': variant === 'cyan',
    'bg-amber-500/50': variant === 'amber',
    'bg-red-500/50': variant === 'red',
  });

  return (
    <div
      className={clsx(
        'glass-panel rounded-lg border p-4 relative overflow-hidden transition-all duration-300',
        borderClass,
        className
      )}
      {...props}
    >
      {/* Visual background grid ticks */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-inherit opacity-65" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-inherit opacity-65" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-inherit opacity-65" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-inherit opacity-65" />

      {/* Panel header */}
      {(title || tag) && (
        <div className="flex justify-between items-center border-b border-white/5 pb-2.5 mb-3 font-mono-digital text-xs">
          <div className="flex items-center space-x-2">
            <span className={clsx("w-1 h-3", decorationBg)} />
            <span className={clsx("font-bold tracking-wider uppercase", textClass)}>{title}</span>
            {tag && (
              <span className="text-[10px] text-white/40 uppercase tracking-widest px-1.5 py-0.5 bg-white/5 rounded">
                [{tag}]
              </span>
            )}
          </div>
          {headerActions && <div className="flex items-center">{headerActions}</div>}
        </div>
      )}

      {/* Children content wrapper */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
