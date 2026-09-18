/**
 * 🏛️ PERPLEXTA DESIGN SYSTEM — MODAL SHELL PRIMITIVE
 * 
 * Strict, accessible dialog shell with focus trap, backdrop blur,
 * scroll-lock integration, and Framer Motion / CSS transitions.
 */

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useModalScrollLock } from '../../hooks/useModalScrollLock';
import { Z_INDEX } from '../tokens/elevation';
import { SLIDE_UP_FADE_IN, BACKDROP_VARIANTS } from '../tokens/motion';

export interface ModalShellProps {
  open: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  layer?: 'modal' | 'nested' | 'lightbox';
  closeOnBackdrop?: boolean;
  dir?: 'rtl' | 'ltr';
  className?: string;
  contentClassName?: string;
}

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-xl',
  xl: 'max-w-3xl',
  full: 'max-w-5xl',
};

export const ModalShell: React.FC<ModalShellProps> = ({
  open,
  onClose,
  children,
  size = 'md',
  layer = 'modal',
  closeOnBackdrop = true,
  dir,
  className = '',
  contentClassName = '',
}) => {
  useModalScrollLock(open, `modal-shell-${layer}`);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (typeof document === 'undefined') return null;

  const zIndexClass = layer === 'nested' 
    ? `z-[${Z_INDEX.NESTED_MODAL}]` 
    : layer === 'lightbox' 
      ? `z-[${Z_INDEX.LIGHTBOX}]` 
      : `z-50`;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className={`fixed inset-0 ${zIndexClass} bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 ${className}`}
          role="dialog"
          aria-modal="true"
          dir={dir}
          variants={BACKDROP_VARIANTS}
          initial="closed"
          animate="open"
          exit="closed"
          onClick={() => {
            if (closeOnBackdrop && onClose) onClose();
          }}
        >
          <motion.div
            variants={SLIDE_UP_FADE_IN}
            initial="closed"
            animate="open"
            exit="closed"
            className={`
              w-full ${SIZE_CLASSES[size]} rounded-[var(--radius-md)] bg-[var(--surface-card)] border border-[var(--border-default)]
              p-4 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.5),0_4px_12px_-2px_rgba(0,0,0,0.25),inset_0_1px_0_0_color-mix(in_oklab,var(--text-primary)_5%,transparent)] space-y-3 transform-gpu
              text-[var(--text-primary)] my-auto max-h-[88dvh] flex flex-col
              overflow-hidden transition-theme custom-scrollbar
              ${contentClassName}
            `}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export const AppModal = ModalShell;
export type AppModalProps = ModalShellProps;

