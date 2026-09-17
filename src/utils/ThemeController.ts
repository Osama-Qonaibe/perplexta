/**
 * Perplexta Platform - Unified Theme Controller Script
 * 
 * Explicitly maps semantic variables '--surface-*', '--text-*', and '--border-*' to 
 * legacy '--pub-*' design tokens to guarantee 100% consistency across legacy and 
 * modern stylesheets.
 * 
 * Author: Perplexta Core Architecture Team
 * Version: 4.0.0
 */

// Explicit mapping dictionary from legacy '--pub-*' variables to semantic system tokens
export const LEGACY_THEME_MAP: Record<string, string> = {
  // 1. Surface Mapping
  '--pub-surface-canvas': '--surface-page',
  '--pub-surface-panel': '--surface-card',
  '--pub-surface-container': '--surface-card',
  '--pub-surface-card': '--surface-card',
  '--pub-surface-subtle': '--surface-subtle',
  '--pub-surface-inset': '--surface-inset',
  '--pub-surface-overlay': '--surface-overlay',

  // 2. Outlines & Borders Mapping
  '--pub-border-subtle': '--border-subtle',
  '--pub-border-default': '--border-default',
  '--pub-border-strong': '--border-strong',
  '--pub-border-focus': '--border-accent',

  // 3. Typography Mapping
  '--pub-text-primary': '--fg-primary',
  '--pub-text-secondary': '--fg-secondary',
  '--pub-text-muted': '--fg-muted',
  '--pub-text-disabled': '--fg-disabled',

  // 4. Accent & Brand Mapping
  '--pub-accent-primary': '--accent',
  '--pub-accent-on-primary': '--fg-on-emphasis',
  '--pub-accent-muted': '--bg-accent-muted',
  '--pub-accent-glow': '--shadow-accent',

  // 5. Status Colors Mapping
  '--pub-status-emerald': '--fg-success',
  '--pub-status-amber': '--fg-warning',
  '--pub-status-rose': '--fg-danger',

  // 6. Geometry Mapping
  '--pub-radius-container': '--radius-md',
  '--pub-radius-control': '--radius-sm',
  '--pub-radius-pill': '--radius-full',
  '--pub-radius-micro': '--radius-xs',
};

/**
 * Dynamically binds legacy '--pub-*' properties to the semantic variables on the root.
 * Utilizes CSS variable indirection (var(--semantic-token)) so that browser-native 
 * inheritance propagates all runtime customization or active presets automatically.
 * 
 * @param rootElement The target HTML element (defaults to document.documentElement)
 */
export function syncLegacyThemeTokens(rootElement: HTMLElement = document.documentElement): void {
  if (typeof window === 'undefined' || !rootElement) return;

  // Set the CSS variable redirection alias for each mapping
  Object.entries(LEGACY_THEME_MAP).forEach(([legacyVar, semanticVar]) => {
    rootElement.style.setProperty(legacyVar, `var(${semanticVar})`);
  });

  // Supplement standard CSS mapping for dual-aliasing consistency in legacy files
  rootElement.style.setProperty('--pub-text-primary-alt', 'var(--text-primary)');
  rootElement.style.setProperty('--pub-text-secondary-alt', 'var(--text-secondary)');
  rootElement.style.setProperty('--pub-text-muted-alt', 'var(--text-muted)');
  
  // Custom tracking to ensure developers know tokens are bound
  rootElement.setAttribute('data-pub-legacy-sync', 'active-v4');
}

/**
 * Global API Interface for Legacy Theme Coordination
 */
export const LegacyThemeController = {
  sync: syncLegacyThemeTokens,
  mapping: LEGACY_THEME_MAP,
};

export default LegacyThemeController;
