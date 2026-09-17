/**
 * ⚡ PERPLEXTA DESIGN SYSTEM — THEME CONFIGURATION
 * Single source of truth for high-level component themes, IDE styling tokens, and visitor shells.
 */
export const themeConfig = {
  // Brand / Aesthetic Identity
  aesthetic: 'Professional AI Sandbox',
  
  // Font Families & Weights
  fonts: {
    display: 'font-display',
    sans: 'font-sans',
    mono: 'font-mono',
    weight: {
      light: 'font-light',
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
      black: 'font-black',
    }
  },

  // Corner Radii (Matching M3 / Perplexta standard rules)
  radius: {
    xs: 'rounded-shape-xs',     // 4px - tiny tags, badges
    sm: 'rounded-shape-sm',     // 8px - standard buttons/inputs/chips
    md: 'rounded-shape-md',     // 12px - cards, dialogs, dropdowns, overlays
    lg: 'rounded-shape-lg',     // 16px - large modals, banners
    full: 'rounded-shape-full', // pill/circular shapes
  },

  // Background Opacities & Blurs
  glass: {
    subtle: 'backdrop-blur-md bg-[var(--surface-card)]/90',
    deep: 'backdrop-blur-lg bg-[var(--surface-card)]/95',
    overlay: 'backdrop-blur-sm bg-black/40',
  },

  // Navbar / Header Styles
  navbar: {
    container: 'h-12 border-b border-[var(--border-default)] bg-[var(--surface-page)]/90 backdrop-blur-md',
    button: 'h-8 px-2.5 rounded-shape-sm text-xs font-bold transition-theme border border-[var(--border-default)] bg-transparent hover:border-[var(--border-accent)]/60 hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer active:scale-95',
    buttonActive: 'h-8 px-2.5 rounded-shape-sm text-xs font-bold transition-theme border border-[var(--border-accent)]/40 bg-[var(--bg-accent-muted)] text-[var(--fg-accent)] cursor-pointer active:scale-95',
  },

  // Sidebar Styles
  sidebar: {
    container: 'border-r border-[var(--border-default)] bg-[var(--surface-page)]/95',
    item: 'flex items-center gap-2 px-3 py-2 rounded-shape-sm text-xs font-bold transition-theme cursor-pointer',
    itemActive: 'bg-[var(--bg-accent-muted)] border-r-2 border-[var(--fg-accent)] text-[var(--fg-accent)] rounded-shape-sm',
    itemInactive: 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]',
  },

  // Chat Panel Styles (Modern Developer IDE Style - Single Source of Truth)
  chat: {
    panel: 'bg-[var(--pub-surface-canvas)]',
    messageUser: 'bg-[var(--pub-surface-subtle)] text-[var(--pub-text-primary)] border border-[var(--pub-border-default)] rounded-shape-md',
    messageAI: 'bg-transparent text-[var(--pub-text-primary)]',
    inputBox: 'ide-input-box p-4 shadow-lg',
    chip: 'ide-chip',
    chipActive: 'ide-chip-active',
    chipInactive: '',
    sendButton: 'ide-send-button',
  },

  // File System Explorer Styles
  fileExplorer: {
    container: 'bg-[var(--surface-page)] border border-[var(--border-default)] rounded-shape-md p-3',
    item: 'flex items-center gap-2 py-1.5 px-2 rounded-shape-sm text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)] transition-theme cursor-pointer',
    itemActive: 'bg-[var(--bg-accent-muted)] text-[var(--fg-accent)] font-bold rounded-shape-sm',
    fileIcon: 'text-[var(--text-muted)]',
    folderIcon: 'text-[var(--fg-accent)]',
  },

  // Modal / Dialog Styles
  modal: {
    overlay: 'fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4',
    content: 'w-full max-w-lg rounded-shape-md border border-[var(--border-default)] bg-[var(--surface-card)] p-6 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-200',
    title: 'text-lg font-black text-[var(--text-primary)] font-display',
    description: 'text-sm text-[var(--text-muted)] mt-1.5 font-sans leading-relaxed',
    footer: 'flex items-center justify-end gap-3 mt-6',
    closeButton: 'w-8 h-8 flex items-center justify-center rounded-shape-sm border border-[var(--border-default)] bg-transparent hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-theme cursor-pointer active:scale-95',
  },

  // Button Styles
  button: {
    base: 'h-8 px-4 rounded-shape-sm text-xs font-bold transition-theme flex items-center justify-center gap-2 cursor-pointer select-none active:scale-95',
    primary: 'bg-[var(--sys-color-primary)] text-[var(--sys-color-on-primary)] hover:opacity-90 active:scale-95 shadow-xs',
    secondary: 'bg-transparent border border-[var(--border-default)] hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]',
    danger: 'bg-[var(--sys-color-danger)] text-[var(--sys-color-on-primary)] hover:opacity-90 active:scale-95',
    success: 'bg-[var(--sys-color-success)] text-[var(--sys-color-on-primary)] hover:opacity-90 active:scale-95',
  },

  // Auth Card & Modal Styles (Modern Developer IDE Style - Single Source of Truth)
  auth: {
    overlay: 'fixed inset-0 z-[200] overflow-y-auto flex items-center justify-center p-4 py-8 md:py-12 bg-black/75 backdrop-blur-md',
    card: 'relative w-full max-w-[360px] md:max-w-[390px] p-6 md:p-7 rounded-shape-lg shadow-2xl border bg-[var(--pub-surface-container)] border-[var(--pub-border-default)] mx-auto flex flex-col justify-between backdrop-blur-md',
    title: 'text-base md:text-lg font-black text-[var(--pub-text-primary)] font-sans',
    input: 'w-full py-2.5 px-3 rounded-shape-sm border outline-none transition-theme bg-[var(--pub-surface-subtle)] border-[var(--pub-border-default)] text-[var(--pub-text-primary)] placeholder:text-[var(--pub-text-muted)] focus:border-[var(--pub-accent-primary)]/60 text-xs font-sans',
    submitButton: 'w-full h-10 min-h-[40px] px-3 bg-[var(--pub-accent-primary)] hover:opacity-90 text-[var(--pub-surface-canvas)] font-bold rounded-shape-sm transition-theme shadow-sm flex items-center justify-center gap-2 text-xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
    googleButton: 'w-full h-10 min-h-[40px] px-3 flex items-center justify-center gap-2 rounded-shape-sm border transition-theme bg-[var(--pub-surface-subtle)] border-[var(--pub-border-default)] hover:border-[var(--pub-accent-primary)]/40 hover:bg-[var(--pub-surface-container)] text-[var(--pub-text-primary)] shadow-sm text-xs font-bold active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
    checkboxBox: 'w-3.5 h-3.5 rounded-shape-xs border border-[var(--pub-border-default)] bg-[var(--pub-surface-subtle)] peer-checked:bg-[var(--pub-accent-primary)] peer-checked:border-[var(--pub-accent-primary)] transition-theme flex items-center justify-center',
    error: 'p-2 rounded-shape-xs bg-[var(--pub-status-rose)]/10 border border-[var(--pub-status-rose)]/25 text-[var(--pub-status-rose)] text-xs text-center font-sans overflow-hidden',
    success: 'p-2 rounded-shape-xs bg-[var(--pub-status-emerald)]/10 border border-[var(--pub-status-emerald)]/25 text-[var(--pub-status-emerald)] text-xs text-center font-sans overflow-hidden',
  },

  // Visitor Page / Shell Styles (Modern Developer IDE Style - Single Source of Truth)
  visitor: {
    shell: 'flex-1 flex flex-col justify-between w-full h-full relative z-10 box-border bg-transparent text-[var(--text-primary)] overflow-y-auto custom-scrollbar',
    content: 'flex-1 flex flex-col justify-center items-center w-full text-[var(--text-primary)]',
    footer: 'w-full pt-2.5 sm:pt-4 pb-[calc(8px+env(safe-area-inset-bottom,0px))] sm:pb-3 border-t border-[var(--border-subtle)] select-none flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 text-[9.5px] sm:text-[11px] text-[var(--text-secondary)] px-4 sm:px-8 bg-transparent max-w-7xl mx-auto',
    footerNav: 'flex items-center gap-2 sm:gap-4 font-medium text-[10px] sm:text-xs',
    footerLink: 'cursor-pointer hover:underline bg-transparent border-0 p-0 text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-inherit transition-colors duration-150',
    footerCopyright: 'font-sans tracking-wide leading-relaxed text-[var(--text-muted)] text-[9px] sm:text-[11px]',
  },

  // Theme Toggle Button Styles (Modern Developer IDE Style - Single Source of Truth)
  themeToggle: {
    buttonSm: 'flex items-center justify-center w-8 h-8 rounded-shape-sm bg-transparent border border-[var(--pub-border-default)] hover:bg-cyan-500/10 hover:border-cyan-500/20 text-[var(--pub-text-muted)] hover:text-cyan-400 transition-all duration-150 group shrink-0 cursor-pointer',
    buttonMd: 'flex items-center justify-center w-9 h-9 rounded-shape-sm bg-transparent border border-[var(--pub-border-default)] hover:bg-cyan-500/10 hover:border-cyan-500/20 text-[var(--pub-text-muted)] hover:text-cyan-400 transition-all duration-150 group shrink-0 cursor-pointer',
    buttonLg: 'flex items-center justify-center w-10 h-10 rounded-shape-sm bg-transparent border border-[var(--pub-border-default)] hover:bg-cyan-500/10 hover:border-cyan-500/20 text-[var(--pub-text-muted)] hover:text-cyan-400 transition-all duration-150 group shrink-0 cursor-pointer',
    icon: 'text-[var(--pub-text-muted)] group-hover:text-cyan-400 transition-all duration-150',
    segmentedContainer: 'flex items-center gap-1 p-1 bg-[var(--pub-surface-subtle)] rounded-shape-sm border border-[var(--pub-border-default)] transition-theme',
    segmentedItem: 'flex items-center justify-center gap-1 px-3 py-1.5 rounded-shape-xs text-[11px] font-bold uppercase tracking-wider transition-theme cursor-pointer select-none',
    segmentedActive: 'bg-[var(--pub-surface-container)] text-cyan-400 border border-cyan-500/30 shadow-xs font-black',
    segmentedInactive: 'text-[var(--pub-text-secondary)] hover:text-cyan-400 hover:bg-cyan-500/10',
  }
};

export const THEME_CONFIG = themeConfig;
