/**
 * 🪟 PERPLEXTA DESIGN SYSTEM — POP CARD PRIMITIVE
 * 
 * Auto-fitting, frosted-glass container shell for floating menus, dropdowns,
 * context menus, and toolbars.
 * 
 * Zero Dead-Space Protocol:
 * - Auto-fitting container: w-max min-w-[170px] max-w-[260px] p-1.5
 * - Surface style: bg-[#0d131f]/95 border border-slate-800/90 rounded-xl shadow-2xl backdrop-blur-md ring-1 ring-white/5 space-y-0.5 transform-gpu
 */

import React, { forwardRef, useEffect, useRef, useImperativeHandle } from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { SLIDE_UP_FADE_IN } from '../tokens/motion';

export interface PopCardProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  dir?: 'rtl' | 'ltr';
  className?: string;
  originClass?: string;
  onClose?: () => void;
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
}

export const PopCard = forwardRef<HTMLDivElement, PopCardProps>(({
  children,
  header,
  footer,
  dir,
  className = '',
  originClass = 'origin-top-left',
  onClose,
  closeOnEscape = true,
  closeOnOutsideClick = true,
  ...motionProps
}, ref) => {
  const localRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => localRef.current as HTMLDivElement);

  useEffect(() => {
    if (!onClose) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') {
        onClose();
      }
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (closeOnOutsideClick && localRef.current && !localRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [onClose, closeOnEscape, closeOnOutsideClick]);

  return (
    <motion.div
      ref={localRef}
      dir={dir}
      variants={SLIDE_UP_FADE_IN}
      initial="closed"
      animate="open"
      exit="closed"
      className={`
        ${className.includes('w-full') ? 'w-full min-w-full max-w-full' : 'w-max min-w-[170px] max-w-[260px]'} p-1.5
        rounded-xl border border-slate-800/90 bg-[#0d131f]/95
        shadow-2xl backdrop-blur-md ring-1 ring-white/5
        space-y-0.5 transform-gpu flex flex-col select-none text-slate-100
        custom-scrollbar overflow-hidden ${originClass}
        ${className}
      `}
      {...motionProps}
    >
      {header && (
        <div className="px-2 py-1 border-b border-slate-800/80 text-xs font-semibold text-slate-400">
          {header}
        </div>
      )}

      <div className="flex flex-col gap-0.5 w-full overflow-y-auto max-h-inherit custom-scrollbar">
        {children}
      </div>

      {footer && (
        <div className="pt-1 mt-0.5 border-t border-slate-800/60 px-1 text-[11px] text-slate-400">
          {footer}
        </div>
      )}
    </motion.div>
  );
});

PopCard.displayName = 'PopCard';

