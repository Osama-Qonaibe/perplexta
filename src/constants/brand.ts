/**
 * 🎨 PERPLEXTA BRAND TOKENS
 * 
 * Re-exports tokens originating from src/design-system/tokens/colors.ts
 */

import { PERPLEXTA_PALETTE } from '../design-system/tokens/colors';

export const PRIMITIVE_TOKENS = {
  gray: PERPLEXTA_PALETTE.slate,
  accent: {
    cyan: {
      light: PERPLEXTA_PALETTE.cyan[400],
      default: PERPLEXTA_PALETTE.cyan[500],
      dark: PERPLEXTA_PALETTE.cyan[600],
      hover: PERPLEXTA_PALETTE.cyan[400],
      active: PERPLEXTA_PALETTE.cyan[600],
      glow: PERPLEXTA_PALETTE.cyan.glow,
    },
    slate: {
      light: PERPLEXTA_PALETTE.slate[300],
      default: PERPLEXTA_PALETTE.slate[700],
      hover: PERPLEXTA_PALETTE.slate[800],
      active: PERPLEXTA_PALETTE.slate[850],
    },
    emerald: {
      light: PERPLEXTA_PALETTE.status.success.light,
      default: PERPLEXTA_PALETTE.status.success.default,
      dark: PERPLEXTA_PALETTE.status.success.dark,
    },
  },
  status: {
    success: {
      light: PERPLEXTA_PALETTE.status.success.light,
      default: PERPLEXTA_PALETTE.status.success.default,
      muted: PERPLEXTA_PALETTE.status.success.surface,
    },
    danger: {
      light: PERPLEXTA_PALETTE.status.danger.light,
      default: PERPLEXTA_PALETTE.status.danger.default,
      muted: PERPLEXTA_PALETTE.status.danger.surface,
    },
    warning: {
      light: PERPLEXTA_PALETTE.status.warning.light,
      default: PERPLEXTA_PALETTE.status.warning.default,
      muted: PERPLEXTA_PALETTE.status.warning.surface,
    },
    info: {
      light: PERPLEXTA_PALETTE.status.info.light,
      default: PERPLEXTA_PALETTE.status.info.default,
      muted: PERPLEXTA_PALETTE.status.info.surface,
    },
  },
} as const;

export type PrimitiveTokenType = typeof PRIMITIVE_TOKENS;

export const LIGHT_MODE = {
  surface: {
    page: PERPLEXTA_PALETTE.slate[50],
    card: PERPLEXTA_PALETTE.slate[0],
    subtle: PERPLEXTA_PALETTE.slate[100],
    inset: PERPLEXTA_PALETTE.slate[100],
    sidebar: PERPLEXTA_PALETTE.slate[0],
    code: PERPLEXTA_PALETTE.slate[990],
  },
  fg: {
    default: PERPLEXTA_PALETTE.slate[850],
    muted: PERPLEXTA_PALETTE.slate[500],
    disabled: PERPLEXTA_PALETTE.slate[300],
    onEmphasis: '#020617',
    accent: PERPLEXTA_PALETTE.cyan[500],
  },
  bg: {
    accent: PERPLEXTA_PALETTE.cyan[500],
    accentMuted: 'rgba(6, 182, 212, 0.12)',
  },
  border: {
    default: PERPLEXTA_PALETTE.slate[200],
    accent: PERPLEXTA_PALETTE.cyan[500],
    subtle: 'rgba(226, 232, 240, 0.8)',
  },
} as const;

export const DARK_MODE = {
  surface: {
    page: PERPLEXTA_PALETTE.slate[950],
    card: PERPLEXTA_PALETTE.slate[900],
    subtle: PERPLEXTA_PALETTE.slate[920],
    inset: PERPLEXTA_PALETTE.slate[990],
    sidebar: PERPLEXTA_PALETTE.slate[920],
    code: PERPLEXTA_PALETTE.slate[990],
  },
  fg: {
    default: PERPLEXTA_PALETTE.slate[50],
    muted: PERPLEXTA_PALETTE.slate[400],
    disabled: PERPLEXTA_PALETTE.slate[600],
    onEmphasis: '#020617',
    accent: PERPLEXTA_PALETTE.cyan[400],
  },
  bg: {
    accent: PERPLEXTA_PALETTE.cyan[500],
    accentMuted: 'rgba(34, 211, 238, 0.15)',
  },
  border: {
    default: PERPLEXTA_PALETTE.slate[800],
    accent: PERPLEXTA_PALETTE.cyan[500],
    subtle: 'rgba(30, 41, 59, 0.8)',
  },
} as const;
