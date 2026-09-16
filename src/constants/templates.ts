/**
 * SYSTEM TEMPLATE ENGINE (محرك القوالب الديناميكي المعتمد)
 * 
 * Allows instant, lossless switching between aesthetic color schemes by 
 * setting the `data-template` attribute on <html>.
 * Every card, input, button, and indicator in Perplexta listens to these tokens.
 */

export interface SovereignTemplate {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  accentColor: string;
  surfacePage: string;
  surfaceCard: string;
  previewGradient: string;
}

export const SOVEREIGN_TEMPLATES: SovereignTemplate[] = [
  {
    id: 'perplexta-classic',
    name: 'Perplexta Midnight',
    nameAr: 'بيربليكستا ميدنايت (الأزرق السماوي)',
    description: 'The canonical high-contrast midnight dark navy and sky blue palette.',
    descriptionAr: 'اللوحة الرسمية المعتمدة بخلفية الكحلي الداكن والأزرق السماوي.',
    accentColor: '#38bdf8',
    surfacePage: '#080c15',
    surfaceCard: '#0f172a',
    previewGradient: 'from-[#080c15] via-[#0f172a] to-[#38bdf8]',
  },
  {
    id: 'obsidian-titanium',
    name: 'Obsidian Titanium',
    nameAr: 'التيتانيوم الفحمي (البارد)',
    description: 'Ultra-clean deep obsidian with titanium silver accents.',
    descriptionAr: 'لوحة أوبسيديان العميقة مع لمسات التيتانيوم الفضي البارد.',
    accentColor: '#38bdf8',
    surfacePage: '#090a0f',
    surfaceCard: '#12141a',
    previewGradient: 'from-[#090a0f] via-[#12141a] to-[#38bdf8]',
  },
  {
    id: 'emerald-sovereign',
    name: 'Emerald Precision',
    nameAr: 'الزمرد التقني',
    description: 'Deep forest black fused with technical emerald highlights.',
    descriptionAr: 'أسود داكن مدمج بلمسات الزمرد التقني.',
    accentColor: '#10b981',
    surfacePage: '#0d1310',
    surfaceCard: '#141d18',
    previewGradient: 'from-[#0d1310] via-[#141d18] to-[#10b981]',
  },
  {
    id: 'royal-monarch',
    name: 'Royal Amber',
    nameAr: 'العنبر الملكي',
    description: 'Prestigious warm noir canvas with gold amber indicators.',
    descriptionAr: 'كانفاس ملكي فاخر مع مؤشرات العنبر الذهبي الصافي.',
    accentColor: '#f59e0b',
    surfacePage: '#14120e',
    surfaceCard: '#1c1914',
    previewGradient: 'from-[#14120e] via-[#1c1914] to-[#f59e0b]',
  }
];

export const applySovereignTemplate = (templateId: string) => {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-template', templateId);
  try {
    localStorage.setItem('perplexta_template', templateId);
  } catch {
    // Ignore storage errors in sandbox
  }
};

export const getSavedSovereignTemplate = (): string => {
  if (typeof window === 'undefined') return 'perplexta-classic';
  try {
    return localStorage.getItem('perplexta_template') || 'perplexta-classic';
  } catch {
    return 'perplexta-classic';
  }
};
