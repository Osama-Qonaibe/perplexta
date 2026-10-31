import React from 'react';
import { RefreshCw } from 'lucide-react';

export type StudioSuggestionItem = string | { label: string; prompt: string };

interface StudioFollowUpsProps {
  suggestions: StudioSuggestionItem[];
  onSelectSuggestion?: (prompt: string, label?: string) => void;
  onSelectFollowUp?: (prompt: string, label?: string) => void;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  disabled?: boolean;
  language?: string;
}

/**
 * Mirrors `.chat-suggestions` in `@Osama-Qonaibe/builder` (`src/js/app.js` `renderContinueSuggestions`):
 * Clean horizontal/wrapping suggestion chips + a trailing "New ideas" (`أفكار جديدة`) refresh chip.
 */
export const StudioFollowUps: React.FC<StudioFollowUpsProps> = ({
  suggestions,
  onSelectSuggestion,
  onSelectFollowUp,
  onRegenerate,
  isRegenerating = false,
  disabled = false,
  language = 'ar'
}) => {
  if ((!suggestions || suggestions.length === 0) && !isRegenerating) return null;
  const isAr = language === 'ar';
  const handleSelect = onSelectSuggestion || onSelectFollowUp || (() => {});

  return (
    <div
      className="w-full flex flex-wrap items-center gap-1.5 py-1.5 font-sans"
      aria-label={isAr ? 'اقتراحات المتابعة' : 'Suggested next steps'}
    >
      {isRegenerating ? (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-shape-full bg-[var(--surface-card)] border border-[var(--border-default)] text-[11px] font-medium text-[var(--text-muted)] animate-pulse">
          <RefreshCw size={11} className="animate-spin text-blue-500" />
          <span>{isAr ? 'جاري توليد أفكار جديدة...' : 'Thinking of new ideas...'}</span>
        </span>
      ) : (
        <>
          {suggestions.map((sug, i) => {
            const label = typeof sug === 'string' ? sug : sug.label || sug.prompt;
            const prompt = typeof sug === 'string' ? sug : sug.prompt || sug.label;
            return (
              <button
                key={i}
                type="button"
                disabled={disabled}
                onClick={() => handleSelect(prompt, label)}
                title={prompt}
                className="px-3 py-1.5 rounded-shape-full bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:border-blue-500/40 text-[11.5px] text-[var(--text-primary)] hover:text-blue-500 font-medium transition-all text-start cursor-pointer shadow-2xs disabled:opacity-50"
              >
                {label}
              </button>
            );
          })}

          {onRegenerate && (
            <button
              type="button"
              disabled={disabled || isRegenerating}
              onClick={onRegenerate}
              title={isAr ? 'اقتراح أفكار مختلفة' : 'Suggest different ideas'}
              aria-label={isAr ? 'اقتراح أفكار مختلفة' : 'Suggest different ideas'}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-shape-full bg-transparent hover:bg-[var(--surface-card)] border border-dashed border-[var(--border-default)] hover:border-blue-500/40 text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={11} className={isRegenerating ? 'animate-spin text-blue-500' : ''} />
              <span>{isAr ? 'أفكار جديدة' : 'New ideas'}</span>
            </button>
          )}
        </>
      )}
    </div>
  );
};
