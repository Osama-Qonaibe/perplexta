import React, { useState } from 'react';
import { ArrowRight, X, Sparkles, CheckCircle2, FileCode, Loader2 } from 'lucide-react';
import type { StudioTemplate } from './types';

interface StudioTemplateDetailsProps {
  template: StudioTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onUseTemplate: (template: StudioTemplate) => Promise<void> | void;
  language?: 'ar' | 'en';
}

export const StudioTemplateDetails: React.FC<StudioTemplateDetailsProps> = ({
  template,
  isOpen,
  onClose,
  onUseTemplate,
  language = 'ar'
}) => {
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const isAr = language === 'ar';

  if (!isOpen || !template) return null;

  const handleUse = async () => {
    try {
      setIsLoadingFiles(true);
      await onUseTemplate(template);
      onClose();
    } finally {
      setIsLoadingFiles(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-sans">
      <div className="w-full max-w-3xl bg-[var(--surface-card)] border border-[var(--border-default)] rounded-shape-md shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-blue-500" />
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              {isAr ? 'تفاصيل القالب وميزاته' : 'Template Details & Features'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-shape-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[72vh] custom-scrollbar">
          <div className="h-64 bg-slate-900 rounded-shape-sm overflow-hidden border border-[var(--border-default)] relative">
            <img
              src={template.thumbnail}
              alt={template.name}
              className="w-full h-full object-cover object-top"
            />
            <span className="absolute top-3 right-3 px-2.5 py-1 rounded-shape-full bg-slate-950/85 text-blue-400 text-[10px] font-bold uppercase tracking-wider border border-blue-500/30">
              {template.category}
            </span>
          </div>

          <div>
            <h3 className="text-lg font-black text-[var(--text-primary)]">{template.name}</h3>
            <p className="text-xs md:text-sm text-[var(--text-secondary)] leading-relaxed mt-1">
              {template.description}
            </p>
          </div>

          {/* Features from template.js */}
          {template.features && template.features.length > 0 && (
            <div className="space-y-2.5 pt-3 border-t border-[var(--border-default)]">
              <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                {isAr ? 'الميزات المتضمنة في القالب' : 'Included Template Features'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {template.features.map((feat, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-start gap-2"
                  >
                    <CheckCircle2 size={14} className="text-green-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-[var(--text-primary)]">{feat.title}</div>
                      {(feat.description || feat.body) && (
                        <div className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-relaxed">
                          {feat.description || feat.body}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Included Files */}
          {template.filePaths && template.filePaths.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-[var(--border-default)]">
              <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                {isAr ? 'ملفات القالب البرمجية' : 'Template Source Files'}
              </h4>
              <div className="flex flex-wrap gap-1.5" dir="ltr">
                {template.filePaths
                  .filter((p) => !p.startsWith('photos/'))
                  .map((path, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[11px] font-mono text-blue-500"
                    >
                      <FileCode size={11} />
                      <span>{path}</span>
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* Pre-configured AI Suggestions */}
          {template.suggestions && template.suggestions.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-[var(--border-default)]">
              <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                {isAr ? 'اقتراحات التطوير السريع لهذا القالب' : 'Ready-to-Use Customization Prompts'}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {template.suggestions.map((sug, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-shape-xs bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-500 font-medium"
                  >
                    {typeof sug === 'string' ? sug : sug.label || sug.prompt}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border-default)] flex items-center justify-between gap-3 bg-[var(--surface-subtle)]">
          <a
            href={`/studio/template/${template.slug}`}
            target="_blank"
            rel="opener"
            className="px-3.5 py-2 rounded-shape-xs bg-[var(--surface-card)] hover:bg-[var(--surface-page)] border border-[var(--border-default)] text-xs font-bold text-[var(--text-secondary)] hover:text-blue-500 transition-colors cursor-pointer"
          >
            {isAr ? 'صفحة التفاصيل الكاملة ↗' : 'Full Details Page ↗'}
          </a>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-shape-xs bg-transparent text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="button"
              disabled={isLoadingFiles}
              onClick={handleUse}
              className="px-5 py-2 rounded-shape-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              {isLoadingFiles ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>{isAr ? 'جاري تحميل ملفات القالب...' : 'Loading Template Files...'}</span>
                </>
              ) : (
                <>
                  <span>{isAr ? 'فتح القالب في الاستوديو' : 'Use This Template in Studio'}</span>
                  <ArrowRight size={14} className={isAr ? 'rotate-180' : ''} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
