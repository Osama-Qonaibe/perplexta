import React from 'react';
import { motion } from 'motion/react';
import { 
  Globe, 
  Code2, 
  BookOpen, 
  Megaphone, 
  ArrowUpRight 
} from 'lucide-react';

export interface StarterPromptItem {
  id: string;
  tool: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  promptAr: string;
  promptEn: string;
  tagAr: string;
  tagEn: string;
}

export const STARTER_PROMPTS: StarterPromptItem[] = [
  {
    id: 'search',
    tool: 'perplexta_analysis',
    icon: Globe,
    promptAr: 'استخرج أحدث التطورات العلمية في أمان الشبكات السحابية مع التوثيق المرجعي الكامل',
    promptEn: 'Synthesize the latest research in cloud network security with full citation verification',
    tagAr: 'بحث متقدم',
    tagEn: 'Search'
  },
  {
    id: 'code',
    tool: 'code',
    icon: Code2,
    promptAr: 'صمم معمارية برمجية متكاملة للمصادقة وإدارة الجلسات في بيئة TypeScript موزعة',
    promptEn: 'Architect an end-to-end authentication and session engine for a distributed TypeScript system',
    tagAr: 'برمجة وهندسة',
    tagEn: 'Code'
  },
  {
    id: 'research_studies',
    tool: 'sovereign_search',
    icon: BookOpen,
    promptAr: 'قدم تركيباً أدبياً وتفكيكاً منهجياً لإطار عمل بحثي أكاديمي حول استراتيجيات البيانات الموزعة',
    promptEn: 'Provide a structured academic literature review and thesis framework for distributed data strategies',
    tagAr: 'بحوث ودراسات',
    tagEn: 'Research'
  },
  {
    id: 'ads_copilot',
    tool: 'ads_copilot',
    icon: Megaphone,
    promptAr: 'صمم لي استراتيجية إعلانية متكاملة ونص إعلاني جذاب لإطلاق منتجي عبر فيرال بوك، فيسبوك، وتيك توك',
    promptEn: 'Design an end-to-end ad strategy and high-converting copy for my product launch across ViralBook, Meta & TikTok',
    tagAr: 'مساعد الإعلانات',
    tagEn: 'Ads Copilot'
  }
];

interface StarterPromptsProps {
  dir: 'ltr' | 'rtl';
  onSelectPrompt: (prompt: string, toolId?: string) => void;
}

export const StarterPrompts: React.FC<StarterPromptsProps> = ({ dir, onSelectPrompt }) => {
  const isAr = dir === 'rtl';

  return (
    <div className="w-full max-w-4xl mx-auto px-1">
      <div className="flex items-center justify-between mb-2.5 px-0.5">
        <span className="text-[11px] font-bold text-[var(--text-muted)] tracking-wider">
          {isAr ? 'محاور مقترحة' : 'Suggested Topics'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {STARTER_PROMPTS.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.id}
              type="button"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.04 }}
              onClick={() => onSelectPrompt(isAr ? item.promptAr : item.promptEn, item.tool)}
              className="group relative flex flex-col justify-between text-start p-3.5 min-h-[110px] rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] hover:border-[var(--fg-accent)]/50 hover:bg-[var(--surface-subtle)] transition-all duration-200 cursor-pointer shadow-xs"
            >
              <div className="flex items-center justify-between w-full mb-2.5">
                <div className="w-7 h-7 rounded-shape-xs flex items-center justify-center bg-[var(--surface-subtle)] text-[var(--fg-accent)] group-hover:scale-105 transition-transform duration-200">
                  <Icon size={14} className="stroke-[2.2]" />
                </div>
                
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold tracking-wider text-[var(--text-muted)] group-hover:text-[var(--fg-accent)] transition-colors uppercase">
                    {isAr ? item.tagAr : item.tagEn}
                  </span>
                  <ArrowUpRight 
                    size={13} 
                    className="text-[var(--text-muted)] group-hover:text-[var(--fg-accent)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200 shrink-0" 
                  />
                </div>
              </div>

              <p className="text-[12px] leading-relaxed font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors line-clamp-3">
                {isAr ? item.promptAr : item.promptEn}
              </p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
