export type ThemeMode = 'dark' | 'light' | 'system';

export const THEME_STORAGE_KEY = 'perplexta_theme';
export const THEME_BOOTSTRAP_STORAGE_KEY = 'perplexta.theme.bootstrap.v1';
export const THEME_MODE_STORAGE_KEY = 'perplexta.theme.mode.v1';

export type ThemeBootstrapPayload = {
  version: 1;
  mode: ThemeMode;
  resolvedMode: 'dark' | 'light';
  tokens: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
  updatedAt: number;
};

export const resolveThemeMode = (mode: ThemeMode): 'dark' | 'light' => {
  if (mode === 'dark') return 'dark';
  if (mode === 'light') return 'light';
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

let transitionTimeout: any = null;

export const applyThemeRoot = (
  resolvedMode: 'dark' | 'light',
  tokens?: Record<string, string>
) => {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;
  const isDark = resolvedMode === 'dark';

  // Apply crisp 150ms transition class during switch
  root.classList.add('theme-transitioning');
  if (transitionTimeout) clearTimeout(transitionTimeout);
  transitionTimeout = setTimeout(() => {
    root.classList.remove('theme-transitioning');
  }, 160);

  root.dataset.theme = resolvedMode;
  root.classList.toggle('dark', isDark);
  root.classList.toggle('light', !isDark);
  root.style.colorScheme = resolvedMode;

  const meta =
    document.getElementById('theme-color-meta') ||
    document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', isDark ? '#080c15' : '#f8fafc');
  }

  if (tokens && typeof tokens === 'object') {
    for (const [key, value] of Object.entries(tokens)) {
      if (
        typeof key === 'string' &&
        key.startsWith('--') &&
        typeof value === 'string' &&
        value.length <= 200
      ) {
        root.style.setProperty(key, value);
      }
    }
  }

  if (root.classList.contains('theme-booting')) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        root.classList.remove('theme-booting');
      });
    });
  }
};

export const getCachedBootstrapPayload = (): ThemeBootstrapPayload | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem(THEME_BOOTSTRAP_STORAGE_KEY);
    if (!raw) return null;
    if (raw === 'dark' || raw === 'light' || raw === 'system') {
      const mode = raw as ThemeMode;
      return {
        version: 1,
        mode,
        resolvedMode: resolveThemeMode(mode),
        tokens: { light: {}, dark: {} },
        updatedAt: Date.now()
      };
    }
    const parsed = JSON.parse(raw);
    if (parsed && parsed.version === 1) {
      return parsed as ThemeBootstrapPayload;
    }
  } catch {
    // Ignore storage parse error
  }
  return null;
};

export const persistBootstrapPayload = (payload: ThemeBootstrapPayload) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, payload.mode);
    localStorage.setItem(THEME_MODE_STORAGE_KEY, payload.mode);
  } catch {
    // Ignore storage quota error
  }
};

export const applyThemeWithRAF = (theme: ThemeMode) => {
  if (typeof window === 'undefined') return;

  const resolved = resolveThemeMode(theme);
  applyThemeRoot(resolved);

  persistBootstrapPayload({
    version: 1,
    mode: theme,
    resolvedMode: resolved,
    tokens: { light: {}, dark: {} },
    updatedAt: Date.now(),
  });
};

if (typeof window !== 'undefined') {
  window.addEventListener('perplexta_theme_updated', () => {
    const savedMode =
      (localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode) ||
      (localStorage.getItem(THEME_MODE_STORAGE_KEY) as ThemeMode) ||
      'light';
    applyThemeWithRAF(savedMode);
  });
}

export const ThemeSync = {
  apply: applyThemeWithRAF,
  resolve: resolveThemeMode,
  applyRoot: applyThemeRoot,
  syncWithServer: async () => {},
  persistPayload: persistBootstrapPayload,
};

export default ThemeSync;
