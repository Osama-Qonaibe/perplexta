/**
 * Client-Side Asset Management Utility
 * Handles dynamic favicon injection and Apple Touch icon sync.
 */

export const BUILD_VERSION = '1.0.0';

export function getAssetUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }
  return path.startsWith('/') ? path : `/${path}`;
}

export function updateDocumentHeadIcons(iconSource?: string | null): void {
  if (typeof document === 'undefined') return;

  const resolvedHref = iconSource || '/favicon.ico';
  const timestamp = Date.now();

  const faviconTypes = [
    { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico', sizes: 'any' },
    { rel: 'icon', type: 'image/png', href: '/favicon-32x32.png', sizes: '32x32' },
    { rel: 'icon', type: 'image/png', href: '/favicon-16x16.png', sizes: '16x16' },
    { rel: 'apple-touch-icon', type: 'image/png', href: '/apple-touch-icon.png', sizes: '180x180' }
  ];

  faviconTypes.forEach(def => {
    let el = document.querySelector(`link[rel="${def.rel}"][sizes="${def.sizes || ''}"]`) as HTMLLinkElement;
    if (!el && def.sizes === 'any') {
      el = document.querySelector(`link[rel="${def.rel}"]:not([sizes])`) as HTMLLinkElement;
    }

    if (!el) {
      el = document.createElement('link');
      el.rel = def.rel;
      if (def.type) el.type = def.type;
      if (def.sizes && def.sizes !== 'any') el.sizes = def.sizes;
      document.head.appendChild(el);
    }

    if (resolvedHref.startsWith('data:')) {
      el.href = resolvedHref;
    } else {
      el.href = `${def.href}?v=${timestamp}`;
    }
  });

  let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
  if (!manifestLink) {
    manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    manifestLink.href = '/manifest.json';
    document.head.appendChild(manifestLink);
  } else {
    manifestLink.href = '/manifest.json';
  }
}

