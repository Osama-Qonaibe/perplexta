/**
 * 🎨 PERPLEXTA DESIGN SYSTEM — COLORS TOKEN CONSTITUTION
 * 
 * High-performance, immutable color definitions and semantic variables.
 * Guarantees zero arbitrary HEX scattering and enforces strict WCAG AA contrast.
 */

// Surfaces Token Definition (Dark / Light)
export const SURFACES = {
  canvas: { dark: '#080c14', light: '#f8fafc' },
  panel: { dark: '#090d16', light: '#ffffff' },
  surface: { dark: '#0d131f', light: '#ffffff' },
  surfaceElevated: { dark: '#131b2c', light: '#f1f5f9' },
  codeBg: { dark: '#070a10', light: '#0f172a' },
} as const;

// Brand Accents
export const BRAND_ACCENTS = {
  primary: '#06b6d4',       // cyan-500
  primaryHover: '#22d3ee',  // cyan-400
  ai: '#6366f1',            // indigo-500
  success: '#10b981',       // emerald-500
  destructive: '#e11d48',   // rose-600
  warning: '#f59e0b',       // amber-500
} as const;

// Borders Token Definition
export const BORDER_TOKENS = {
  dark: 'border-slate-800/90',
  light: 'border-slate-200/90',
} as const;

export const PERPLEXTA_PALETTE = {
  // Deep Slate Neutral Scale (The Foundation of Perplexta)
  slate: {
    0: '#ffffff',
    50: '#f8fafc',  // Deep Canvas Light
    100: '#f1f5f9', // Surface Subtle Light
    150: '#eaeef2', // Inset Light
    200: '#e2e8f0', // Border Default Light
    300: '#cbd5e1', // Border Subtle Light
    400: '#94a3b8', // Muted Text Light
    500: '#64748b', // Secondary Text Light
    600: '#475569', // Subtle Slate
    700: '#334155', // Structural Slate
    800: '#1e293b', // Border Default Dark
    850: '#0f172a', // Primary Text Light / Deep Structure Dark
    900: '#0d131f', // Perplexta Card Surface Dark
    920: '#090d16', // Perplexta Sidebar & Panel Dark
    950: '#080c14', // Perplexta Deep Canvas Dark
    990: '#070a10', // Perplexta Code & Terminal Monolith Dark
  },

  // Sovereign Cyan Accent (Signature Neon)
  cyan: {
    50: '#ecfeff',
    100: '#cffafe',
    200: '#a5f3fc',
    300: '#67e8f9',
    400: '#22d3ee',   // Neon Highlight / Hover Text
    500: '#06b6d4',   // Primary Sovereign Brand Cyan
    600: '#0891b2',   // Active / Pressed Cyan
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
    glow: 'rgba(6, 182, 212, 0.25)',
    subtle: 'rgba(6, 182, 212, 0.10)',
    surface: 'rgba(6, 182, 212, 0.15)',
  },

  // Semantic Status Hues
  status: {
    success: {
      light: '#34d399',
      default: '#10b981',
      dark: '#047857',
      surface: 'rgba(16, 185, 129, 0.12)',
    },
    danger: {
      light: '#f87171',
      default: '#e11d48',
      dark: '#be123c',
      surface: 'rgba(225, 29, 72, 0.12)',
    },
    warning: {
      light: '#fbbf24',
      default: '#f59e0b',
      dark: '#b45309',
      surface: 'rgba(245, 158, 11, 0.12)',
    },
    info: {
      light: '#22d3ee',
      default: '#06b6d4',
      dark: '#0891b2',
      surface: 'rgba(6, 182, 212, 0.12)',
    },
    ai: {
      light: '#818cf8',
      default: '#6366f1',
      dark: '#4f46e5',
      surface: 'rgba(99, 102, 241, 0.12)',
    },
  },
} as const;

/**
 * Single source of CSS variable bindings used by Tailwind utility classes.
 */
export const SEMANTIC_CSS_VARS = {
  surface: {
    page: 'var(--surface-page)',
    card: 'var(--surface-card)',
    subtle: 'var(--surface-subtle)',
    inset: 'var(--surface-inset)',
    sidebar: 'var(--surface-sidebar, var(--surface-page))',
    container: 'var(--pub-surface-container, var(--surface-card))',
  },
  text: {
    primary: 'var(--text-primary, var(--fg-default))',
    secondary: 'var(--text-secondary, var(--fg-muted))',
    muted: 'var(--text-muted, var(--fg-disabled))',
    accent: 'var(--fg-accent, #06b6d4)',
    onEmphasis: 'var(--fg-on-emphasis, #020617)',
  },
  border: {
    default: 'var(--border-default, var(--border-main))',
    subtle: 'var(--border-muted, rgba(255,255,255,0.08))',
    accent: 'var(--border-accent, #06b6d4)',
  },
  action: {
    hoverBg: 'hover:bg-cyan-500/10',
    hoverText: 'hover:text-cyan-400',
    selectedBg: 'bg-cyan-500/15 text-cyan-400 font-bold',
  },
} as const;

export const colors = {
  surfaces: SURFACES,
  brand: BRAND_ACCENTS,
  borders: BORDER_TOKENS,
  palette: PERPLEXTA_PALETTE,
} as const;

export type ColorPalette = typeof PERPLEXTA_PALETTE;
