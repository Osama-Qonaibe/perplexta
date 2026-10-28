import type { Variants, Transition } from 'motion/react';

/**
 * ============================================================================
 * PERPLEXTA PLATFORM — UNIFIED MOTION & ANIMATION DESIGN TOKENS
 * Single Source of Truth for Durations, Easings, Micro-Interactions & Transitions
 * ============================================================================
 * All animations strictly respect:
 * 1. 60 FPS Compositor-only properties (transform, opacity, filter).
 * 2. Mobile-first tactile feedback (touch target >= 44px, active:scale damping).
 * 3. Anti-flicker and zero-layout-shift guarantees.
 */

// 1. Precise Duration Standards (Seconds for Motion / Framer Motion)
export const MOTION_DURATIONS = {
  fast: 0.15,    // 150ms — Micro-interactions, button taps, icon states, toggles
  normal: 0.25,  // 250ms — Standard UI transitions, dialogs, drawers, cards
  slow: 0.40,    // 400ms — Complex layout changes, full page transitions, hero reveals
} as const;

// Millisecond integer representations for setTimeout, debounce, or CSS-in-JS
export const MOTION_DURATIONS_MS = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;

// 2. Unified Easing Curves (Cubic Bezier Coordinates)
export const MOTION_EASINGS = {
  // Standard: Fast initial acceleration with gentle settling — primary system curve
  standard: [0.16, 1, 0.3, 1] as [number, number, number, number],
  // Decelerate (Ease-Out): Used for incoming / entering elements (modals, toasts)
  decelerate: [0.0, 0, 0.2, 1] as [number, number, number, number],
  // Accelerate (Ease-In): Used for exiting / leaving elements
  accelerate: [0.4, 0, 1, 1] as [number, number, number, number],
  // Subtle Organic Bounce: Micro-elements settling into position
  subtleBounce: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
} as const;

// Easing strings for standard CSS transition-timing-function
export const MOTION_EASINGS_CSS = {
  standard: 'cubic-bezier(0.16, 1, 0.3, 1)',
  decelerate: 'cubic-bezier(0.0, 0, 0.2, 1)',
  accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
  subtleBounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

// 3. Centralized Transitions Presets
export const MOTION_TRANSITIONS: Record<string, Transition> = {
  fast: {
    duration: MOTION_DURATIONS.fast,
    ease: MOTION_EASINGS.standard,
  },
  normal: {
    duration: MOTION_DURATIONS.normal,
    ease: MOTION_EASINGS.standard,
  },
  slow: {
    duration: MOTION_DURATIONS.slow,
    ease: MOTION_EASINGS.standard,
  },
  entering: {
    duration: MOTION_DURATIONS.normal,
    ease: MOTION_EASINGS.decelerate,
  },
  exiting: {
    duration: MOTION_DURATIONS.fast,
    ease: MOTION_EASINGS.accelerate,
  },
};

// 4. Unified Modal & Dialog Variants
export const MODAL_BACKDROP_VARIANTS: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: MOTION_DURATIONS.fast,
      ease: MOTION_EASINGS.standard,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: MOTION_DURATIONS.fast,
      ease: MOTION_EASINGS.standard,
    },
  },
};

export const MODAL_DIALOG_VARIANTS: Variants = {
  initial: {
    opacity: 0,
    scale: 0.96,
    y: 8,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATIONS.normal,
      ease: MOTION_EASINGS.standard,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 6,
    transition: {
      duration: MOTION_DURATIONS.fast,
      ease: MOTION_EASINGS.standard,
    },
  },
};

// 5. Mobile Drawer & Bottom Sheet Variants
export const MOBILE_DRAWER_VARIANTS: Variants = {
  initial: {
    opacity: 0,
    y: '100%',
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATIONS.normal,
      ease: MOTION_EASINGS.standard,
    },
  },
  exit: {
    opacity: 0,
    y: '100%',
    transition: {
      duration: MOTION_DURATIONS.fast,
      ease: MOTION_EASINGS.accelerate,
    },
  },
};

// 6. Route, Tab, and View Transition Variants (Anti-Flicker)
export const PAGE_TRANSITION_VARIANTS: Variants = {
  initial: {
    opacity: 0,
    y: 4,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATIONS.fast,
      ease: MOTION_EASINGS.standard,
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: {
      duration: MOTION_DURATIONS.fast,
      ease: MOTION_EASINGS.standard,
    },
  },
};

export const TAB_CONTENT_VARIANTS: Variants = {
  initial: {
    opacity: 0,
    scale: 0.99,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: MOTION_DURATIONS.fast,
      ease: MOTION_EASINGS.standard,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.99,
    transition: {
      duration: MOTION_DURATIONS.fast,
      ease: MOTION_EASINGS.standard,
    },
  },
};

// 7. Skeleton-to-Content Crossfade Variants
export const SKELETON_CROSSFADE_VARIANTS: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: MOTION_DURATIONS.normal,
      ease: MOTION_EASINGS.standard,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: MOTION_DURATIONS.fast,
      ease: MOTION_EASINGS.standard,
    },
  },
};

// 8. Micro-Interactions & Tactile Feedback
export const TACTILE_MICRO_PROPS = {
  // Standard interactive button press (0.98 scale)
  button: {
    whileTap: { scale: 0.98 },
    transition: { duration: MOTION_DURATIONS.fast, ease: MOTION_EASINGS.standard },
  },
  // Compact icon button press (0.94 scale)
  iconButton: {
    whileTap: { scale: 0.94 },
    transition: { duration: MOTION_DURATIONS.fast, ease: MOTION_EASINGS.standard },
  },
  // Card hover elevation
  cardHover: {
    whileHover: { y: -2 },
    transition: { duration: MOTION_DURATIONS.normal, ease: MOTION_EASINGS.standard },
  },
} as const;

// 9. Standard Tailwind CSS Motion Class Helpers
export const UNIFIED_MOTION_CLASSES = {
  // Buttons
  interactiveButton: 'transition-all duration-[var(--motion-fast)] ease-[var(--motion-ease)] active:scale-[0.98] cursor-pointer select-none',
  // Icon Buttons
  interactiveIconButton: 'transition-all duration-[var(--motion-fast)] ease-[var(--motion-ease)] active:scale-95 cursor-pointer select-none',
  // Cards & Containers
  interactiveCard: 'transition-transform duration-[var(--motion-normal)] ease-[var(--motion-ease)] hover:-translate-y-0.5 active:translate-y-0 select-none',
  // Smooth Skeleton Crossfade
  crossfade: 'transition-opacity duration-[var(--motion-normal)] ease-[var(--motion-ease)]',
  // Fast Tab Switch
  tabSwitch: 'transition-all duration-[var(--motion-fast)] ease-[var(--motion-ease)]',
} as const;
