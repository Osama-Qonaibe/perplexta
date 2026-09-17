import { ThemePreset } from '../types';
import { DEFAULT_LIGHT_TOKENS, DEFAULT_DARK_TOKENS } from './defaultTokens';

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'perplexa_canonical_primer',
    nameEn: 'Perplexa Primer v4.0.0 (Canonical Sovereign)',
    nameAr: 'بيربليكسا برايمر الإصدار 4 (الرسمي المعتمد)',
    descriptionEn: 'The sovereign canonical standard: GitHub Green #1a7f37/#238636 CTA, GitHub Blue #0969da/#58a6ff links & rings, #ffffff/#0d1117 canvases, and crisp structural borders.',
    descriptionAr: 'المعيار السيادي المعتمد: أخضر جيت هب #1a7f37/#238636 للأزرار الأساسية، وأزرق جيت هب #0969da/#58a6ff للروابط وحلقات التركيز، مع خطوط كايرو وجيست عالية الوضوح.',
    author: 'Perplexa Core Team',
    version: '4.0.0',
    previewColors: {
      surface: '#ffffff',
      card: '#ffffff',
      accent: '#0969da',
      text: '#1f2328',
    },
    tokens: {
      light: {
        ...DEFAULT_LIGHT_TOKENS,
      },
      dark: {
        ...DEFAULT_DARK_TOKENS,
      },
    },
  },
  {
    id: 'perplexa_terminal_dark',
    nameEn: 'Perplexa Terminal Dark (Monolith Pro)',
    nameAr: 'بيربليكسا تيرمينال الاحترافي (Dark Mode)',
    descriptionEn: 'High-contrast dark canvas #0d1117 with #161b22 cards, #010409 deep terminal insets, vibrant GitHub Green actions and Geist typography.',
    descriptionAr: 'السطح الداكن الاحترافي #0d1117 مع بطاقات #161b22، ومجاري كود #010409 غائرة، وأزرار خضراء سيادية مع خطوط جيست وكايرو.',
    author: 'Perplexa Core Team',
    version: '4.0.0',
    previewColors: {
      surface: '#0d1117',
      card: '#161b22',
      accent: '#58a6ff',
      text: '#e6edf3',
    },
    tokens: {
      light: {
        ...DEFAULT_LIGHT_TOKENS,
      },
      dark: {
        ...DEFAULT_DARK_TOKENS,
      },
    },
  },
  {
    id: 'perplexa_pure_light',
    nameEn: 'Perplexa Pristine Light (Editorial)',
    nameAr: 'بيربليكسا الفاتح الناصع (عالي التباين)',
    descriptionEn: 'Pristine pure-white editorial surface with generous spacing, high-contrast typography #1f2328, and rich GitHub Green CTA #1a7f37.',
    descriptionAr: 'تصميم تحريري ناصع البياض بأسطح نقية #ffffff وخطوط داكنة عالية التباين #1f2328 مع زر الإجراءات الأخضر السيادي #1a7f37.',
    author: 'Perplexa Core Team',
    version: '4.0.0',
    previewColors: {
      surface: '#ffffff',
      card: '#ffffff',
      accent: '#0969da',
      text: '#1f2328',
    },
    tokens: {
      light: {
        ...DEFAULT_LIGHT_TOKENS,
      },
      dark: {
        ...DEFAULT_DARK_TOKENS,
      },
    },
  },
];
