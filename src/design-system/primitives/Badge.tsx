/**
 * 🏷️ PERPLEXTA DESIGN SYSTEM — BADGE PRIMITIVE
 * 
 * Status badges, tier labels, and animated pulse indicators.
 */

import React from 'react';
import { cn } from '../../lib/utils';

export type BadgeVariant = 
  | 'cyan' 
  | 'indigo' 
  | 'emerald' 
  | 'rose' 
  | 'default' 
  | 'accent' 
  | 'success' 
  | 'danger' 
  | 'warning' 
  | 'info';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: 'xs' | 'sm' | 'md';
  hasPulse?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'cyan',
  size = 'xs',
  hasPulse = false,
  children,
  className,
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    // Aliases & fallbacks
    accent: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    info: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    danger: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    default: 'bg-slate-800/60 text-slate-300 border-slate-700/60',
  };

  const sizeStyles = {
    xs: 'rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border',
    sm: 'rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border',
    md: 'rounded-md px-2.5 py-1 text-xs font-bold border',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 select-none whitespace-nowrap leading-none',
        variantStyles[variant] || variantStyles.cyan,
        sizeStyles[size] || sizeStyles.xs,
        className
      )}
    >
      {hasPulse && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0 animate-pulse',
            (variant === 'cyan' || variant === 'accent' || variant === 'info') && 'bg-cyan-500 shadow-[0_0_6px_rgba(6,182,212,0.6)]',
            (variant === 'emerald' || variant === 'success') && 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]',
            (variant === 'rose' || variant === 'danger') && 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]',
            (variant === 'indigo') && 'bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.6)]',
            (variant === 'warning') && 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]',
            variant === 'default' && 'bg-slate-400'
          )}
        />
      )}
      {children}
    </span>
  );
};
