import { ThemeTokensMap } from '../types';

export const DEFAULT_LIGHT_TOKENS: ThemeTokensMap = {
  // Surfaces & Canvases (Perplexta Rule 1)
  '--surface-page': '#f8fafc',       // Slate-50 Deep Canvas Light
  '--surface-canvas': '#f8fafc',
  '--surface-card': '#ffffff',       // Pure White Card (95% layer)
  '--surface-raised': '#ffffff',
  '--surface-subtle': '#f1f5f9',     // Slate-100 Panel / Inset
  '--surface-inset': '#f1f5f9',
  '--surface-sidebar': '#ffffff',    // White Sidebar
  '--surface-code': '#070a10',       // Monolith Terminal Dark
  '--surface-overlay': 'rgba(15, 23, 42, 0.4)',

  // Typography & Foreground (Perplexta Rule 5)
  '--fg-primary': '#0f172a',         // Slate-900 Primary Text
  '--fg-secondary': '#334155',       // Slate-700
  '--fg-muted': '#64748b',           // Slate-500
  '--fg-disabled': '#cbd5e1',
  '--fg-on-emphasis': '#020617',     // Slate-950 on Cyan CTA
  '--font-display': '"Tajawal", "Inter", sans-serif',
  '--font-sans': '"Tajawal", "Inter", ui-sans-serif, system-ui, sans-serif',
  '--font-mono': '"JetBrains Mono", ui-monospace, monospace',

  // Brand & Accent (Perplexta Rule 3 - Cyan)
  '--accent': '#06b6d4',             // Cyan-500 Primary
  '--accent-hover': '#22d3ee',       // Cyan-400 Hover
  '--fg-accent': '#06b6d4',
  '--bg-accent-emphasis': '#06b6d4',
  '--bg-accent-muted': 'rgba(6, 182, 212, 0.12)',
  '--border-accent-emphasis': '#06b6d4',
  '--focus-outline': '#06b6d4',

  // Borders & Dividers
  '--border-default': '#e2e8f0',     // Slate-200
  '--border-outer-input': '#cbd5e1',
  '--border-inner-input': '#e2e8f0',
  '--border-subtle': 'rgba(226, 232, 240, 0.8)',
  '--border-strong': '#94a3b8',
  '--border-accent': '#06b6d4',

  // Buttons & Controls (Perplexta Rule 2 & 3)
  '--bg-btn-primary': '#06b6d4',     // Cyan-500
  '--fg-btn-primary': '#020617',     // Slate-950 Bold Text
  '--bg-btn-secondary': '#f1f5f9',   // Slate-100
  '--border-btn-secondary': '#e2e8f0', // Slate-200
  '--fg-btn-secondary': '#334155',
  '--bg-btn-danger': '#e11d48',      // Rose-600
  '--fg-btn-danger': '#ffffff',
  '--bg-btn-success': '#059669',     // Emerald-600
  '--fg-btn-success': '#ffffff',
  '--bg-btn-page': '#f1f5f9',
  '--fg-btn-page': '#0f172a',
  '--border-btn-page': '#e2e8f0',
  '--bg-followup-btn': 'transparent',
  '--fg-followup-btn': '#64748b',
  '--border-followup-btn': 'transparent',
  '--bg-followup-btn-hover': '#ffffff',
  '--fg-followup-btn-hover': '#0f172a',
  '--border-followup-btn-hover': '#e2e8f0',
  '--control-active-bg': '#06b6d4',
  '--control-active-fg': '#020617',

  // Zone-Specific Buttons (Perplexta Rule 2 Dimensions: h-8 / 32px, rounded-lg / 8px)
  '--btn-header-size': '32px',
  '--btn-header-radius': '8px',
  '--btn-header-border': '#e2e8f0',
  '--btn-header-bg': 'transparent',
  '--btn-header-hover': '#f1f5f9',

  '--btn-input-size': '32px',
  '--btn-input-radius': '8px',
  '--btn-input-border': '#e2e8f0',
  '--btn-input-bg': 'transparent',
  '--btn-input-hover': '#f1f5f9',

  '--btn-tool-size': '32px',
  '--btn-tool-radius': '8px',
  '--btn-tool-border': '#e2e8f0',
  '--btn-tool-bg': 'transparent',
  '--btn-tool-hover': '#f1f5f9',

  '--btn-action-size': '32px',
  '--btn-action-radius': '8px',
  '--btn-action-border': '#e2e8f0',
  '--btn-action-bg': 'transparent',
  '--btn-action-hover': '#f1f5f9',

  // Inputs & Forms
  '--bg-input': '#ffffff',
  '--border-focus': '#06b6d4',

  // Admin & Layout
  '--admin-nav-bg': '#ffffff',
  '--admin-nav-item-active': '#f1f5f9',
  '--admin-header-bg': '#ffffff',
  '--admin-card-border': '#e2e8f0',
  '--admin-table-header-bg': '#f8fafc',
  '--admin-table-row-hover': '#f1f5f9',

  // Chat & Messaging
  '--chat-bubble-user': '#f1f5f9',
  '--chat-bubble-assistant': 'transparent',
  '--chat-bubble-user-text': '#0f172a',
  '--chat-bubble-assistant-text': '#0f172a',

  // Status & Alerts
  '--fg-success': '#059669',
  '--fg-warning': '#d97706',
  '--fg-danger': '#e11d48',
  '--fg-info': '#06b6d4',
  '--status-success-subtle': 'rgba(5, 150, 105, 0.12)',
  '--status-warning-subtle': 'rgba(217, 119, 6, 0.12)',
  '--status-danger-subtle': 'rgba(225, 29, 72, 0.12)',
  '--status-info-subtle': 'rgba(6, 182, 212, 0.12)',

  // Geometry & Elevation (Perplexta M3 Scale)
  '--radius-xs': '4px',
  '--radius-sm': '8px',              // Standard Button/Input Radius
  '--radius-md': '12px',             // Standard Card Radius
  '--radius-lg': '16px',             // Dialog / Modal Radius
  '--radius-xl': '16px',
  '--radius-full': '9999px',
  '--shadow-sm': 'none',
  '--shadow-md': 'none',
  '--shadow-lg': 'none'
};

export const DEFAULT_DARK_TOKENS: ThemeTokensMap = {
  // Surfaces & Canvases (Perplexta Rule 1 - Deep Midnight Palette)
  '--surface-page': '#080c14',       // Perplexta Deep Canvas Dark
  '--surface-canvas': '#080c14',
  '--surface-card': '#0d131f',       // Perplexta Card Dark
  '--surface-raised': '#0d131f',
  '--surface-subtle': '#090d16',     // Perplexta Sidebar & Panel Dark
  '--surface-inset': '#070a10',      // Perplexta Code & Terminal Monolith
  '--surface-sidebar': '#090d16',
  '--surface-code': '#070a10',
  '--surface-overlay': 'rgba(8, 12, 20, 0.92)',

  // Typography & Foreground (Perplexta Rule 5)
  '--fg-primary': '#f8fafc',         // Slate-50 Primary Text Dark
  '--fg-secondary': '#cbd5e1',       // Slate-300
  '--fg-muted': '#94a3b8',           // Slate-400
  '--fg-disabled': '#475569',
  '--fg-on-emphasis': '#020617',     // Slate-950 on Cyan CTA
  '--font-display': '"Tajawal", "Inter", sans-serif',
  '--font-sans': '"Tajawal", "Inter", ui-sans-serif, system-ui, sans-serif',
  '--font-mono': '"JetBrains Mono", ui-monospace, monospace',

  // Brand & Accent (Perplexta Rule 3 - Cyan)
  '--accent': '#06b6d4',             // Cyan-500
  '--accent-hover': '#22d3ee',       // Cyan-400
  '--fg-accent': '#22d3ee',
  '--bg-accent-emphasis': '#06b6d4',
  '--bg-accent-muted': 'rgba(34, 211, 238, 0.15)',
  '--border-accent-emphasis': '#06b6d4',
  '--focus-outline': '#22d3ee',

  // Borders & Dividers
  '--border-default': '#1e293b',     // Slate-800
  '--border-outer-input': '#1e293b',
  '--border-inner-input': '#1e293b',
  '--border-subtle': 'rgba(30, 41, 59, 0.8)',
  '--border-strong': '#475569',
  '--border-accent': '#06b6d4',

  // Buttons & Controls (Perplexta Rule 2 & 3)
  '--bg-btn-primary': '#06b6d4',     // Cyan-500
  '--fg-btn-primary': '#020617',     // Slate-950 Bold Text
  '--bg-btn-secondary': '#0f172a',   // Slate-900/90
  '--border-btn-secondary': '#1e293b', // Slate-800
  '--fg-btn-secondary': '#cbd5e1',
  '--bg-btn-danger': '#e11d48',      // Rose-600
  '--fg-btn-danger': '#ffffff',
  '--bg-btn-success': '#059669',     // Emerald-600
  '--fg-btn-success': '#ffffff',
  '--bg-btn-page': '#090d16',
  '--fg-btn-page': '#f8fafc',
  '--border-btn-page': '#1e293b',
  '--bg-followup-btn': 'transparent',
  '--fg-followup-btn': '#94a3b8',
  '--border-followup-btn': 'transparent',
  '--bg-followup-btn-hover': '#0d131f',
  '--fg-followup-btn-hover': '#f8fafc',
  '--border-followup-btn-hover': '#1e293b',
  '--control-active-bg': '#06b6d4',
  '--control-active-fg': '#020617',

  // Zone-Specific Buttons (Perplexta Rule 2 Dimensions: h-8 / 32px, rounded-lg / 8px)
  '--btn-header-size': '32px',
  '--btn-header-radius': '8px',
  '--btn-header-border': '#1e293b',
  '--btn-header-bg': 'transparent',
  '--btn-header-hover': '#090d16',

  '--btn-input-size': '32px',
  '--btn-input-radius': '8px',
  '--btn-input-border': '#1e293b',
  '--btn-input-bg': 'transparent',
  '--btn-input-hover': '#090d16',

  '--btn-tool-size': '32px',
  '--btn-tool-radius': '8px',
  '--btn-tool-border': '#1e293b',
  '--btn-tool-bg': 'transparent',
  '--btn-tool-hover': '#090d16',

  '--btn-action-size': '32px',
  '--btn-action-radius': '8px',
  '--btn-action-border': '#1e293b',
  '--btn-action-bg': 'transparent',
  '--btn-action-hover': '#090d16',

  // Inputs & Forms
  '--bg-input': '#0d131f',
  '--border-focus': '#22d3ee',

  // Admin & Layout
  '--admin-nav-bg': '#090d16',
  '--admin-nav-item-active': '#080c14',
  '--admin-header-bg': '#080c14',
  '--admin-card-border': '#1e293b',
  '--admin-table-header-bg': '#090d16',
  '--admin-table-row-hover': '#0d131f',

  // Chat & Messaging
  '--chat-bubble-user': '#090d16',
  '--chat-bubble-assistant': 'transparent',
  '--chat-bubble-user-text': '#f8fafc',
  '--chat-bubble-assistant-text': '#f8fafc',

  // Status & Alerts
  '--fg-success': '#34d399',
  '--fg-warning': '#fbbf24',
  '--fg-danger': '#f87171',
  '--fg-info': '#22d3ee',
  '--status-success-subtle': 'rgba(52, 211, 153, 0.15)',
  '--status-warning-subtle': 'rgba(251, 191, 36, 0.12)',
  '--status-danger-subtle': 'rgba(248, 113, 113, 0.15)',
  '--status-info-subtle': 'rgba(34, 211, 238, 0.15)',

  // Geometry & Elevation (Perplexta M3 Scale)
  '--radius-xs': '4px',
  '--radius-sm': '8px',              // Standard Button/Input Radius
  '--radius-md': '12px',             // Standard Card Radius
  '--radius-lg': '16px',             // Dialog / Modal Radius
  '--radius-xl': '16px',
  '--radius-full': '9999px',
  '--shadow-sm': 'none',
  '--shadow-md': 'none',
  '--shadow-lg': 'none'
};
