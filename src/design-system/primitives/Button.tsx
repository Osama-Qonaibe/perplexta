/**
 * 🏛️ PERPLEXTA DESIGN SYSTEM — BUTTON PRIMITIVE
 * 
 * Complies strictly with Perplexta Design System Constitution:
 * - Standard action height: h-8 (32px), text-xs font-semibold
 * - Primary, Secondary, Icon, Destructive, Outline, Ghost variants
 * - Interactive inputs & buttons geometry: rounded-lg (8px)
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'icon' | 'destructive' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children?: React.ReactNode;
}

const VARIANT_STYLES: Record<string, string> = {
  primary: 'h-8 px-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg shadow-xs shadow-cyan-500/20 active:scale-[0.98] transition-all duration-150 ease-out font-semibold text-xs',
  secondary: 'h-8 px-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-lg active:scale-[0.98] transition-all duration-150 ease-out text-xs font-semibold',
  icon: 'w-8 h-8 flex items-center justify-center bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-lg active:scale-[0.98] transition-all duration-150 ease-out',
  destructive: 'h-8 px-3 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg active:scale-[0.98] transition-all duration-150 ease-out',
  danger: 'h-8 px-3 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg active:scale-[0.98] transition-all duration-150 ease-out',
  outline: 'h-8 px-3 text-xs font-semibold bg-transparent text-slate-200 hover:bg-slate-800 border border-slate-800 rounded-lg active:scale-[0.98] transition-all duration-150 ease-out',
  ghost: 'h-8 px-2.5 text-xs font-semibold bg-transparent text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 rounded-lg active:scale-[0.98] transition-all duration-150 ease-out',
};

const SIZE_OVERRIDES: Record<string, string> = {
  sm: 'h-7 px-2 text-[11px]',
  md: '', // Default h-8
  lg: 'h-10 px-4 text-sm',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading = false, disabled, className = '', children, ...props }, ref) => {
    const isIconOnly = variant === 'icon';

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`
          inline-flex items-center justify-center gap-2 select-none
          disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
          ${VARIANT_STYLES[variant] || VARIANT_STYLES.primary}
          ${size !== 'md' && !isIconOnly ? SIZE_OVERRIDES[size] : ''}
          ${className}
        `}
        {...props}
      >
        {isLoading && <Loader2 size={14} className="animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
