/**
 * ⚡ PERPLEXTA DESIGN SYSTEM — MOTION & PHYSICS CONSTITUTION
 * 
 * Single authoritative source of truth for all animation timings,
 * physics engines, bezier curves, and Framer Motion variants across Perplexta.
 */

import type { Transition, Variants } from 'motion/react';

// ============================================================
// 1. Core Timings & Easings
// ============================================================

export const MOTION_TIMINGS = {
  hover: 0.12,    // 120ms
  popover: 0.15,  // 150ms
  modal: 0.20,    // 200ms
  instant: 0.08,
  fast: 0.12,
  base: 0.18,
  slow: 0.24,
  deliberate: 0.35,
  cinematic: 0.5,
  slowMotion: 1.1, // Smooth session transitions
} as const;

export const EASING_CURVE = 'cubic-bezier(0.16, 1, 0.3, 1)';
export const POPOVER_TRANSITION_TOKENS = 'animate-in fade-in zoom-in-95 duration-150 ease-out';
export const TOAST_TRANSITION_TOKENS = 'animate-in fade-in slide-in-from-bottom-3 duration-200 ease-out';

export const MOTION_EASINGS = {
  standard: [0.16, 1, 0.3, 1] as [number, number, number, number],
  smooth: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
  accelerate: [0.4, 0, 1, 1] as [number, number, number, number],
  decelerate: [0, 0, 0.2, 1] as [number, number, number, number],
  bounce: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
  material: [0.2, 0, 0, 1] as [number, number, number, number],
  unified: [0.25, 1, 0.2, 1] as [number, number, number, number],
} as const;

export const UNIFIED_EASE = MOTION_EASINGS.unified;
export const UNIFIED_DURATION = 0.25;
export const GOOGLE_MATERIAL_EASE = MOTION_EASINGS.material;

export const SPRING_PHYSICS = {
  tight: { type: 'spring', stiffness: 450, damping: 35 },
  snappy: { type: 'spring', stiffness: 380, damping: 32 },
  gentle: { type: 'spring', stiffness: 220, damping: 26 },
  bouncy: { type: 'spring', stiffness: 300, damping: 20 },
} as const;

// ============================================================
// 2. Standard Transitions
// ============================================================

export const UNIFIED_TRANSITION: Transition = {
  type: 'tween',
  duration: UNIFIED_DURATION,
  ease: UNIFIED_EASE,
};

export const PERPLEXTA_TRANSITION = UNIFIED_TRANSITION;

export const SIDEBAR_DURATION = 0.2;
export const SIDEBAR_TRANSITION: Transition = {
  type: 'tween',
  duration: SIDEBAR_DURATION,
  ease: GOOGLE_MATERIAL_EASE,
};

export const CANVAS_EASE = GOOGLE_MATERIAL_EASE;
export const CANVAS_DURATION = 0;
export const CANVAS_TRANSITION: Transition = {
  duration: 0,
};
export const CSS_CANVAS_EASE = 'linear';
export const CSS_CANVAS_TRANSITION = '0ms';

export const STANDARD_TRANSITIONS: Record<string, Transition> = {
  fast: {
    duration: MOTION_TIMINGS.fast,
    ease: MOTION_EASINGS.standard,
  },
  base: {
    duration: MOTION_TIMINGS.base,
    ease: MOTION_EASINGS.standard,
  },
  slow: {
    duration: MOTION_TIMINGS.slow,
    ease: MOTION_EASINGS.standard,
  },
  spring: SPRING_PHYSICS.snappy as Transition,
};

// ============================================================
// 3. Motion Variants
// ============================================================

export const FADE: Variants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1, 
    transition: UNIFIED_TRANSITION 
  },
  exit: { 
    opacity: 0, 
    transition: UNIFIED_TRANSITION 
  },
};

export const FADE_UP: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0, 
    transition: UNIFIED_TRANSITION 
  },
  exit: { 
    opacity: 0, 
    y: -20, 
    transition: UNIFIED_TRANSITION 
  },
};

export const FADE_DOWN: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { 
    opacity: 1, 
    y: 0, 
    transition: UNIFIED_TRANSITION 
  },
  exit: { 
    opacity: 0, 
    y: 20, 
    transition: UNIFIED_TRANSITION 
  },
};

export const FADE_RIGHT: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { 
    opacity: 1, 
    x: 0, 
    transition: UNIFIED_TRANSITION 
  },
  exit: { 
    opacity: 0, 
    x: 20, 
    transition: UNIFIED_TRANSITION 
  },
};

export const FADE_LEFT: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { 
    opacity: 1, 
    x: 0, 
    transition: UNIFIED_TRANSITION 
  },
  exit: { 
    opacity: 0, 
    x: -20, 
    transition: UNIFIED_TRANSITION 
  },
};

export const SCALE_FADE: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    transition: UNIFIED_TRANSITION 
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    transition: UNIFIED_TRANSITION 
  },
};

export const PAGE_TRANSITION: Variants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1, 
    transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] } 
  },
  exit: { 
    opacity: 0, 
    transition: { duration: 0.18, ease: 'easeIn' } 
  },
};

export const perplextaPageTransition = PAGE_TRANSITION;
export const perplextaItemTransition = FADE;
export const FADE_IN = FADE;
export const FADE_IN_UP = FADE_UP;

export const DROPDOWN_VARIANTS: Variants = {
  closed: {
    opacity: 0,
    scale: 0.96,
    y: 10,
    transition: {
      duration: MOTION_TIMINGS.fast,
      ease: MOTION_EASINGS.smooth,
    },
  },
  open: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: MOTION_TIMINGS.base,
      ease: MOTION_EASINGS.standard,
    },
  },
};

export const MODAL_VARIANTS: Variants = {
  closed: {
    opacity: 0,
    scale: 0.98,
    y: 15,
    transition: {
      duration: MOTION_TIMINGS.base,
      ease: MOTION_EASINGS.smooth,
    },
  },
  open: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: MOTION_TIMINGS.slow,
      ease: MOTION_EASINGS.standard,
    },
  },
};

export const SLIDE_UP_FADE_IN: Variants = {
  closed: {
    opacity: 0,
    y: 12,
    transition: {
      duration: MOTION_TIMINGS.base,
      ease: MOTION_EASINGS.smooth,
    },
  },
  open: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_TIMINGS.base,
      ease: MOTION_EASINGS.standard,
    },
  },
};

export const BACKDROP_VARIANTS: Variants = {
  closed: {
    opacity: 0,
    transition: { duration: MOTION_TIMINGS.fast },
  },
  open: {
    opacity: 1,
    transition: { duration: MOTION_TIMINGS.base },
  },
};

export const TOAST_VARIANTS: Variants = {
  initial: { opacity: 0, y: -16, scale: 0.95 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1, 
    transition: { duration: MOTION_TIMINGS.base, ease: MOTION_EASINGS.standard } 
  },
  exit: { 
    opacity: 0, 
    scale: 0.92, 
    y: -8, 
    transition: { duration: MOTION_TIMINGS.fast, ease: MOTION_EASINGS.smooth } 
  },
};

// ============================================================
// 4. Legacy Object Compatibility
// ============================================================

export const motionTokens = {
  fast: MOTION_TIMINGS.fast,
  base: MOTION_TIMINGS.base,
  slow: MOTION_TIMINGS.slow,
  ease: MOTION_EASINGS.standard,
  spring: {
    type: 'spring' as const,
    stiffness: 380,
    damping: 32,
    mass: 0.8,
  },
};

export const motion = motionTokens;

export const variants = {
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: MOTION_TIMINGS.base, ease: MOTION_EASINGS.standard } },
  },
  fadeScale: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: MOTION_TIMINGS.base, ease: MOTION_EASINGS.standard } },
  },
  dialog: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: MOTION_TIMINGS.base, ease: MOTION_EASINGS.standard } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: MOTION_TIMINGS.fast, ease: MOTION_EASINGS.standard } },
  },
  sheet: {
    hidden: { y: '100%' },
    visible: { y: 0, transition: { duration: MOTION_TIMINGS.base, ease: MOTION_EASINGS.standard } },
    exit: { y: '100%', transition: { duration: MOTION_TIMINGS.fast, ease: MOTION_EASINGS.standard } },
  },
  toast: {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: MOTION_TIMINGS.base, ease: MOTION_EASINGS.standard } },
    exit: { opacity: 0, y: -20, transition: { duration: MOTION_TIMINGS.fast, ease: MOTION_EASINGS.standard } },
  },
  listItem: {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0, transition: { duration: MOTION_TIMINGS.base, ease: MOTION_EASINGS.standard } },
  },
  page: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: MOTION_TIMINGS.slow, ease: MOTION_EASINGS.standard } },
  },
};
