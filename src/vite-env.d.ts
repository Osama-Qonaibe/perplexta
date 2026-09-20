/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

declare module 'ffprobe-static';

interface ImportMetaEnv {
  readonly VITE_ADMIN_EMAIL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  dataLayer?: any[];
  gtag?: (...args: any[]) => void;
}
