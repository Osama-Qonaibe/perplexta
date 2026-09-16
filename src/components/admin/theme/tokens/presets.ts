import { ThemePreset } from '../types';
import { DEFAULT_LIGHT_TOKENS, DEFAULT_DARK_TOKENS } from './defaultTokens';

/**
 * 🏛️ PERPLEXTA UNIFIED CANONICAL AI DESIGN SYSTEM
 * The single source of truth for the entire platform.
 */
export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'perplexta_unified_ai',
    nameEn: 'Perplexta Unified AI (Official)',
    nameAr: 'هوية بيربليكستا الموحدة (الرسمية)',
    descriptionEn: 'The canonical high-contrast Cyan & Deep Canvas design system with M3 geometry and audited WCAG AA contrast.',
    descriptionAr: 'الهوية المعمارية الرسمية لبيربليكستا: تباين فائق مع خلفيات داكنة عميقة، ورمزيات السيان للأزرار والإجراءات، مع التزام تام بقواعد الأبعاد.',
    author: 'Perplexta Core Team',
    version: '2.0.0',
    previewColors: {
      surface: '#080c14',
      card: '#0d131f',
      accent: '#06b6d4',
      text: '#f8fafc',
    },
    tokens: {
      light: { ...DEFAULT_LIGHT_TOKENS },
      dark: { ...DEFAULT_DARK_TOKENS },
    },
  },
];
