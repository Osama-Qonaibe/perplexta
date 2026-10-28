/**
 * 🎯 SEMANTIC TOKENS
 * 
 * Intent-based aliases that work in both light and dark modes.
 * Use ONLY these in components, never primitives.
 */

export const SEMANTIC_COLORS = {
  // Surfaces
  surface: {
    page: 'var(--surface-page)',
    card: 'var(--surface-card)',
    subtle: 'var(--surface-subtle)',
    inset: 'var(--surface-inset)',
  },

  // Foreground (Text)
  text: {
    primary: 'var(--text-primary)',
    secondary: 'var(--text-secondary)',
    muted: 'var(--text-muted)',
    disabled: 'var(--fg-disabled)',
    onEmphasis: 'var(--fg-on-emphasis)',
    accent: 'var(--fg-accent)',
  },

  // Background
  bg: {
    primary: 'var(--bg-default)',
    secondary: 'var(--bg-muted)',
    accent: 'var(--bg-accent-emphasis)',
    accentMuted: 'var(--bg-accent-muted)',
    inset: 'var(--bg-inset)',
  },

  // Borders
  border: {
    main: 'var(--border-main)',
    default: 'var(--border-main)',
    subtle: 'var(--border-subtle)',
    muted: 'var(--border-muted)',
    accent: 'var(--border-accent)',
  },

  // Status (Semantic)
  success: {
    fg: 'var(--fg-success)',
    bg: 'var(--bg-success-muted)',
    bgEmphasis: 'var(--bg-success-emphasis)',
  },
  danger: {
    fg: 'var(--fg-danger)',
    bg: 'var(--bg-danger-muted)',
    bgEmphasis: 'var(--bg-danger-emphasis)',
  },
  warning: {
    fg: 'var(--fg-warning)',
    bg: 'var(--bg-warning-muted)',
    bgEmphasis: 'var(--bg-warning-emphasis)',
    attentionFg: 'var(--fg-warning)',
    attentionBg: 'var(--bg-warning-muted)',
  },
  info: {
    fg: 'var(--fg-info)',
    bg: 'var(--bg-info-muted)',
  },
} as const;

export type SemanticToken = typeof SEMANTIC_COLORS;

export const SEMANTIC_CLASSES = {
  danger: {
    text: 'text-[var(--fg-danger)]',
    bgMuted: 'bg-[var(--bg-danger-muted)]',
    bgEmphasis: 'bg-[var(--bg-danger-emphasis)] text-white',
    border: 'border-[var(--fg-danger)]',
    badge: 'text-[var(--fg-danger)] bg-[var(--bg-danger-muted)] border border-[var(--fg-danger)]/20',
    button: 'bg-[var(--bg-btn-danger)] text-white hover:opacity-90 transition-opacity',
  },
  success: {
    text: 'text-[var(--fg-success)]',
    bgMuted: 'bg-[var(--bg-success-muted)]',
    bgEmphasis: 'bg-[var(--bg-success-emphasis)] text-white',
    border: 'border-[var(--fg-success)]',
    badge: 'text-[var(--fg-success)] bg-[var(--bg-success-muted)] border border-[var(--fg-success)]/20',
    button: 'bg-[var(--bg-btn-success)] text-white hover:opacity-90 transition-opacity',
  },
  warning: {
    text: 'text-[var(--fg-warning)]',
    bgMuted: 'bg-[var(--bg-warning-muted)]',
    bgEmphasis: 'bg-[var(--bg-warning-emphasis)] text-white',
    border: 'border-[var(--fg-warning)]',
    badge: 'text-[var(--fg-warning)] bg-[var(--bg-warning-muted)] border border-[var(--fg-warning)]/20',
  },
  info: {
    text: 'text-[var(--fg-info)]',
    bgMuted: 'bg-[var(--bg-info-muted)]',
    bgEmphasis: 'bg-[var(--bg-accent-emphasis)] text-white',
    border: 'border-[var(--fg-info)]',
    badge: 'text-[var(--fg-info)] bg-[var(--bg-info-muted)] border border-[var(--fg-info)]/20',
  },
  surface: {
    page: 'bg-[var(--surface-page)]',
    card: 'bg-[var(--surface-card)] border border-[var(--border-default)]',
    modal: 'bg-[var(--surface-card)] border border-[var(--border-default)] shadow-lg',
    subtle: 'bg-[var(--surface-subtle)]',
    inset: 'bg-[var(--surface-inset)]',
  }
} as const;

/**
 * 🏛️ MATERIAL 3 ELEVATION SCALE
 * Structured elevation levels replacing arbitrary opacities (/90, /95, /80)
 */
export const ELEVATION = {
  level0: 'shadow-none',
  level1: 'shadow-sm bg-opacity-95',   // Cards & Content Blocks
  level2: 'shadow-md bg-opacity-90',   // Sticky Header / Footer / Toolbars
  level3: 'shadow-lg bg-opacity-85',   // Modals & Floating Dialogs
  level4: 'shadow-xl bg-opacity-80',   // Drawers, Sheets & Action Bars
  level5: 'shadow-2xl',                // Floating System Toasts
} as const;

/**
 * 📐 MATERIAL 3 SHAPE SCALE
 * Exactly 5 discrete radii replacing ad-hoc rounded-[Npx]
 */
export const SHAPE = {
  xs: 'rounded-shape-xs',     // 4px - Micro badges & tags
  sm: 'rounded-shape-sm',     // 8px - Buttons & input fields (replaces rounded-[8px])
  md: 'rounded-shape-md',     // 12px - Standard cards & dialogs (default)
  lg: 'rounded-shape-lg',     // 16px - Large modals & drawers (replaces rounded-2xl)
  full: 'rounded-shape-full', // 9999px - Capsule navigation, pills & circular avatars
} as const;

/**
 * 👆 MANDATORY TOUCH TARGET STANDARDS (WCAG AA & Material 3)
 * Enforces minimum 44x44px interactive physical touch boundaries
 */
export const TOUCH_TARGET = {
  min: 'min-w-[44px] min-h-[44px]',
  hitBox: 'relative before:absolute before:-inset-1.5 before:content-[\'\']',
} as const;
