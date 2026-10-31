import React, { useState } from 'react';
import { Search, LayoutGrid, ArrowRight, X, Sparkles } from 'lucide-react';
import { STUDIO_TEMPLATES } from './templatesData';
import type { StudioTemplate } from './types';

interface StudioTemplateGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: StudioTemplate) => void;
  language?: 'ar' | 'en';
}

export const StudioTemplateGallery: React.FC<StudioTemplateGalleryProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  language = 'ar'
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const isAr = language === 'ar';

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: isAr ? `الكل (${STUDIO_TEMPLATES.length})` : `All (${STUDIO_TEMPLATES.length})` },
    {
      id: 'app',
      label: isAr
        ? `تطبيقات ويب (${STUDIO_TEMPLATES.filter((t) => t.category === 'app').length})`
        : `Web Apps (${STUDIO_TEMPLATES.filter((t) => t.category === 'app').length})`
    },
    {
      id: 'website',
      label: isAr
        ? `مواقع ومتاجر (${STUDIO_TEMPLATES.filter((t) => t.category === 'website').length})`
        : `Websites & Stores (${STUDIO_TEMPLATES.filter((t) => t.category === 'website').length})`
    }
  ];

  const filtered = STUDIO_TEMPLATES.filter((tmpl) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      tmpl.name.toLowerCase().includes(q) ||
      tmpl.description.toLowerCase().includes(q) ||
      tmpl.slug.toLowerCase().includes(q);
    const matchesCategory = selectedCategory === 'all' || tmpl.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 md:p-6 font-sans">
      <div className="w-full max-w-6xl h-[86vh] bg-[var(--surface-card)] border border-[var(--border-default)] rounded-shape-md shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-shape-xs bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <LayoutGrid size={18} />
            </div>
            <div>
              <h2 className="text-base font-black text-[var(--text-primary)]">
                {isAr ? 'معرض قوالب الاستوديو الاحترافية' : 'Studio Application Templates Gallery'}
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                {isAr
                  ? 'اختر من بين 46 قالباً وتطبيقاً متكاملاً للبدء والتعديل الفوري بالذكاء الاصطناعي'
                  : 'Choose from 46 production-ready starter apps and websites to customize in Studio'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-shape-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filters & Search Bar */}
        <div className="p-4 border-b border-[var(--border-default)] flex flex-col md:flex-row gap-3 items-center justify-between bg-[var(--surface-subtle)]/40">
          <div className="relative w-full md:w-80">
            <Search size={14} className="absolute left-3 top-2.5 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder={isAr ? 'ابحث في القوالب (CRM, متجر, لوحة تحكم...)' : 'Search 46 templates...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[var(--surface-card)] border border-[var(--border-default)] rounded-shape-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto custom-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-shape-xs text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-[var(--surface-card)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((tmpl) => (
                <div
                  key={tmpl.slug}
                  className="group flex flex-col bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:border-blue-500/50 rounded-shape-md overflow-hidden transition-all hover:shadow-lg"
                >
                  <div className="h-44 bg-slate-900 relative overflow-hidden border-b border-[var(--border-default)] cursor-pointer" onClick={() => onSelectTemplate(tmpl)}>
                    <img
                      src={tmpl.thumbnail}
                      alt={tmpl.name}
                      loading="lazy"
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-shape-full bg-slate-950/85 backdrop-blur-xs text-blue-400 font-bold text-[10px] uppercase tracking-wider border border-blue-500/30">
                      {tmpl.category === 'app' ? (isAr ? 'تطبيق' : 'App') : (isAr ? 'موقع' : 'Website')}
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="cursor-pointer" onClick={() => onSelectTemplate(tmpl)}>
                      <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-blue-500 transition-colors">
                        {tmpl.name}
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-1 line-clamp-2">
                        {tmpl.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[var(--border-default)]/60 gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectTemplate(tmpl)}
                        className="flex-1 py-1.5 px-2.5 rounded-shape-xs bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
                      >
                        <Sparkles size={12} />
                        <span>{isAr ? 'استخدام القالب' : 'Use Template'}</span>
                      </button>

                      <a
                        href={`/studio/template/${tmpl.slug}`}
                        target="_blank"
                        rel="opener"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="py-1.5 px-2.5 rounded-shape-xs bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-bold flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap"
                        title={isAr ? 'فتح صفحة التفاصيل الشاملة في تبويب جديد' : 'Open full details page in a new tab'}
                      >
                        <span>{isAr ? 'التفاصيل ↗' : 'Details ↗'}</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center space-y-3 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-shape-md bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center justify-center mx-auto text-[var(--text-muted)]">
                <Search size={22} />
              </div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                {isAr ? 'لم يتم العثور على قوالب مطابقة' : 'No matching templates found'}
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                {isAr
                  ? 'جرب البحث باسم آخر أو اختر فئة "الكل" لعرض كافة القوالب المتاحة'
                  : 'Try searching with a different term or select "All" category'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('all');
                }}
                className="px-4 py-1.5 rounded-shape-xs bg-blue-600 text-white font-bold text-xs cursor-pointer shadow-2xs"
              >
                {isAr ? 'إعادة ضبط البحث والتصفية' : 'Reset Search Filters'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
