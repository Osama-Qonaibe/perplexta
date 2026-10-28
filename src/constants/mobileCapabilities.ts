/**
 * PERPLEXTA MOBILE CAPABILITIES & ROUTE GUARD REGISTRY
 * Single source of truth for features and routes allowed or restricted on mobile.
 */

export const DESKTOP_ONLY_ROUTES = [
  '/admin',
  '/admin/dashboard',
  '/admin/sections',
  '/admin/system',
  '/admin/users',
  '/admin/orchestrator',
  '/admin/gpu',
  '/admin/api-keys',
  '/admin/seo',
  '/admin/logs',
  '/admin/broadcast',
  '/admin/database',
  '/admin/financials',
  '/admin/developer-portal',
  '/settings/developer',
  '/settings/developers',
  '/developer-portal',
  '/developer',
  '/image-studio',
  '/app',
  '/audio-studio',
  '/video-studio',
  '/canvas',
];

export const isDesktopOnlyRoute = (pathname: string): boolean => {
  if (!pathname) return false;
  const cleanPath = pathname.toLowerCase();
  return DESKTOP_ONLY_ROUTES.some((route) => cleanPath === route || cleanPath.startsWith(route + '/'));
};
