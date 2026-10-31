import React, { useState, useRef, useMemo } from 'react';
import { Sparkles, ArrowRight, Wand2, Paperclip, X, RefreshCw, LayoutGrid } from 'lucide-react';
import { STARTER_PROMPTS, STUDIO_TEMPLATES, TEMPLATE_CATEGORIES } from './templatesData';
import type { StudioTemplate } from './types';

interface StudioStartScreenProps {
  language: 'ar' | 'en';
  onSendPrompt: (prompt: string, files?: File[]) => void;
  templates?: StudioTemplate[];
  onSelectTemplate?: (template: StudioTemplate) => void;
  onOpenAllTemplates?: () => void;
}

export const StudioStartScreen: React.FC<StudioStartScreenProps> = ({
  language,
  onSendPrompt,
  templates = STUDIO_TEMPLATES,
  onSelectTemplate,
  onOpenAllTemplates
}) => {
  const [query, setQuery] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isAr = language === 'ar';

  // Exact match to Builder's pickRandomStarters (3 random starter chips with shuffle button)
  const visibleStarters = useMemo(() => {
    const copy = [...STARTER_PROMPTS];
    let s = shuffleSeed + 1;
    for (let i = copy.length - 1; i > 0; i--) {
      s = (s * 16807) % 2147483647;
      const j = s % (i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, 4);
  }, [shuffleSeed]);

  const filteredTemplates = useMemo(() => {
    if (selectedCategory === 'All') return templates;
    return templates.filter(
      t => t.category.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [templates, selectedCategory]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() && attachedFiles.length === 0) return;
    onSendPrompt(query.trim(), attachedFiles);
    setQuery('');
    setAttachedFiles([]);
  };

  const handleStarterClick = (promptText: string) => {
    setQuery(promptText);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="w-full h-full overflow-y-auto flex flex-col items-center justify-start p-5 sm:p-8 md:p-10 bg-[var(--surface-page)] text-[var(--text-primary)] font-sans custom-scrollbar selection:bg-accent selection:text-white"
    >
      <div className="max-w-5xl w-full space-y-8 text-center py-4 sm:py-8">
        {/* Hero Tagline (matches Builder's .home-hero #heroTagline) */}
        <div className="space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-shape-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs font-bold tracking-wide">
            <Sparkles size={14} className="animate-pulse" />
            <span>{isAr ? 'استوديو بناء التطبيقات والمواقع بالذكاء الاصطناعي' : 'AI App & Website Studio'}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-[42px] font-black tracking-tight text-[var(--text-primary)] leading-tight">
            {isAr ? 'ابنِ تطبيقات ومواقع الويب بالذكاء الاصطناعي' : 'Build Apps and Websites With AI'}
          </h1>
          <p className="text-[var(--text-muted)] text-xs md:text-sm max-w-xl mx-auto leading-relaxed">
            {isAr
              ? 'صف ما تريد بناءه بلغة طبيعية — سيقوم المساعد بتخطيط وتصميم وبناء المشروع مع معاينة حية فورية.'
              : 'Describe what you want to build in plain language — your assistant will plan, design, and build it with a live interactive preview.'}
          </p>
        </div>

        {/* Hero Composer Box (matches Builder's .home-hero .input-container) */}
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto w-full text-start">
          <div className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-shape-md shadow-xl p-3.5 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all space-y-2.5">
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pb-1">
                {attachedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)]"
                  >
                    <Paperclip size={11} className="text-blue-500 shrink-0" />
                    <span className="truncate max-w-[140px]">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== idx))}
                      className="text-[var(--text-muted)] hover:text-rose-500 p-0.5 cursor-pointer"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <textarea
              ref={textareaRef}
              rows={3}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={
                isAr
                  ? 'صف التطبيق أو الموقع الذي ترغب في بنائه اليوم...'
                  : 'What can we build for you today?'
              }
              className="w-full bg-transparent border-none outline-none text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] px-1 py-1 resize-none custom-scrollbar leading-relaxed"
            />

            <div className="flex items-center justify-between pt-2 border-t border-[var(--border-default)]/60">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-9 px-2.5 rounded-shape-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] inline-flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer"
                  title={isAr ? 'إرفاق ملفات أو صور' : 'Attach files from your computer'}
                >
                  <Paperclip size={14} />
                  <span className="hidden sm:inline">{isAr ? 'إرفاق ملفات' : 'Attach'}</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              <button
                type="submit"
                disabled={!query.trim() && attachedFiles.length === 0}
                className="h-9 px-5 rounded-shape-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-35 text-white font-bold text-xs inline-flex items-center gap-2 transition-all shadow-xs cursor-pointer"
              >
                <span>{isAr ? 'ابدأ البناء' : 'Start Building'}</span>
                <Wand2 size={14} />
              </button>
            </div>
          </div>
        </form>

        {/* Starter Prompts Section (matches Builder's #starterSection) */}
        <div className="space-y-2.5 max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs font-semibold text-[var(--text-muted)]">
              {isAr ? 'تبحث عن فكرة؟' : 'Looking for an idea?'}
            </span>
            <button
              type="button"
              onClick={() => setShuffleSeed(s => s + 1)}
              className="p-1 rounded-shape-xs text-[var(--text-muted)] hover:text-blue-500 hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
              title={isAr ? 'اقتراح أفكار أخرى' : 'Shuffle ideas'}
              aria-label={isAr ? 'اقتراح أفكار أخرى' : 'Shuffle ideas'}
            >
              <RefreshCw size={12} />
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {visibleStarters.map((item, idx) => {
              const chipLabel = isAr ? (item.labelAr || item.label) : item.label;
              const chipPrompt = isAr ? (item.promptAr || item.prompt) : item.prompt;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleStarterClick(chipPrompt)}
                  onDoubleClick={() => onSendPrompt(chipPrompt)}
                  className="px-3.5 py-1.5 rounded-shape-full bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:border-blue-500/40 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-medium transition-all cursor-pointer shadow-2xs active:scale-95"
                >
                  {chipLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Start from a Template Feed (matches Builder's #templateFeed) */}
        {templates.length > 0 && (
          <section
            aria-label={isAr ? 'قوالب المشاريع' : 'Project templates'}
            className="pt-6 border-t border-[var(--border-default)] text-start space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
              <div className="flex items-center gap-2">
                <LayoutGrid size={16} className="text-blue-500" />
                <h2 className="text-sm md:text-base font-black text-[var(--text-primary)]">
                  {isAr ? 'ابدأ من قالب احترافي جاهز' : 'Start from a template'}
                </h2>
                <span className="text-xs font-mono text-[var(--text-muted)]">
                  ({filteredTemplates.length})
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {TEMPLATE_CATEGORIES.map((cat) => {
                  const isActive = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-shape-full text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-default)]'
                      }`}
                    >
                      {cat === 'All' ? (isAr ? 'الكل' : 'All') : cat}
                    </button>
                  );
                })}
                {onOpenAllTemplates && (
                  <button
                    type="button"
                    onClick={onOpenAllTemplates}
                    className="px-3 py-1 rounded-shape-full text-xs font-bold text-blue-500 hover:bg-blue-500/10 transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>{isAr ? 'معرض القوالب الكامل' : 'Full Gallery'}</span>
                    <ArrowRight size={12} className={isAr ? 'rotate-180' : ''} />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.slice(0, 12).map((tmpl) => (
                <div
                  key={tmpl.slug}
                  onClick={() => onSelectTemplate && onSelectTemplate(tmpl)}
                  className="group bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:border-blue-500/40 rounded-shape-md overflow-hidden transition-all cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-md"
                >
                  <div className="h-36 bg-slate-900 relative overflow-hidden border-b border-[var(--border-default)]">
                    <img
                      src={tmpl.thumbnail}
                      alt={tmpl.name}
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80';
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 end-2 text-[9px] font-bold px-2 py-0.5 rounded-shape-full bg-slate-950/80 text-blue-400 border border-blue-500/30 uppercase tracking-wider">
                      {tmpl.category}
                    </span>
                  </div>

                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                    <div>
                      <h3 className="text-xs sm:text-[13px] font-black text-[var(--text-primary)] group-hover:text-blue-500 transition-colors truncate">
                        {tmpl.name}
                      </h3>
                      <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed mt-1">
                        {tmpl.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-bold text-blue-500 pt-2 border-t border-[var(--border-default)]/50 gap-2">
                      <span className="inline-flex items-center gap-1">
                        <span>{isAr ? 'استخدام القالب' : 'Use template'}</span>
                        <ArrowRight size={12} className={isAr ? 'rotate-180' : ''} />
                      </span>
                      <a
                        href={`/studio/template/${tmpl.slug}`}
                        target="_blank"
                        rel="opener"
                        onClick={(e) => e.stopPropagation()}
                        className="px-2 py-0.5 rounded-shape-xs bg-[var(--surface-subtle)] hover:bg-blue-500/10 border border-[var(--border-default)] text-[10px] font-bold text-[var(--text-secondary)] hover:text-blue-500 transition-colors"
                      >
                        {isAr ? 'التفاصيل ↗' : 'Details ↗'}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
