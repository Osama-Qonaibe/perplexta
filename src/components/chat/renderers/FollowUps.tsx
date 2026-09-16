import React from 'react';
import { CornerDownLeft, CornerDownRight } from 'lucide-react';

interface FollowUpsProps {
  followUps: string[];
  onSelect: (query: string) => void;
  dir: 'ltr' | 'rtl';
}

export const FollowUps: React.FC<FollowUpsProps> = ({ followUps, onSelect, dir }) => {
  if (!followUps || followUps.length === 0) return null;

  // Filter to max 3 items and clean up
  const items = followUps.slice(0, 3);

  return (
    <div className="mt-2 pt-1.5 border-t border-[var(--border-default)]/40 w-full select-none" id="follow-ups-container" dir={dir}>
      <div className="flex flex-wrap items-center gap-1.5 w-full">
        {items.map((q, idx) => (
          <button
            key={`follow-up-${idx}-${q.slice(0, 15)}`}
            onClick={() => onSelect(q)}
            id={`follow-up-${idx}`}
            className="group flex-1 min-w-[120px] max-w-full inline-flex items-center justify-between gap-1.5 px-2.5 py-1.5 bg-[var(--bg-followup-btn)] hover:bg-[var(--bg-followup-btn-hover)] active:bg-[var(--surface-inset)] border border-[var(--border-followup-btn)] hover:border-[var(--border-followup-btn-hover)] rounded-shape-sm text-start cursor-pointer transition-all duration-150 active:scale-[0.98]"
            style={{ transitionProperty: 'background-color, border-color, color, transform' }}
            title={q}
          >
            <span className="text-xs font-semibold text-[var(--fg-followup-btn)] group-hover:text-[var(--fg-followup-btn-hover)] transition-colors truncate">
              {q}
            </span>
            <span className="shrink-0 text-[var(--fg-followup-btn)] group-hover:text-[var(--fg-followup-btn-hover)] transition-colors">
              {dir === 'rtl' ? (
                <CornerDownLeft size={12} className="transition-transform group-hover:-translate-x-0.5" />
              ) : (
                <CornerDownRight size={12} className="transition-transform group-hover:translate-x-0.5" />
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

