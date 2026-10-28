/**
 * TOKEN RESOLVER UTILITY
 * 
 * Standardized single point of resolution for CSS custom properties.
 * Resolves token values directly from document.documentElement or computed root style,
 * with fallback handling for canvas, chart SVGs, and iframe sandbox injections.
 */

export function resolveToken(tokenName: string, fallback?: string): string {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return fallback || '';
  }

  const normalized = tokenName.startsWith('--') ? tokenName : `--${tokenName}`;
  const value = getComputedStyle(document.documentElement).getPropertyValue(normalized).trim();
  
  if (value) {
    return value;
  }

  return fallback || '';
}

export default resolveToken;
