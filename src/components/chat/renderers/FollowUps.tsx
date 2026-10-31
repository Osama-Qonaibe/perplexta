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
    <div className="mt-4 pt-1 border-t border-[var(--border-default)]/40 w-full select-none" id="follow-ups-container" dir={dir}>
      <div className="flex flex-col divide-y divide-[var(--border-default)]/35 w-full">
        {items.map((q, idx) => (
          <button
            key={`follow-up-${idx}-${q.slice(0, 15)}`}
            type="button"
            onClick={() => onSelect(q)}
            id={`follow-up-${idx}`}
            className="group w-full min-h-[44px] py-2.5 px-1 flex items-center justify-between gap-3 bg-transparent hover:bg-[var(--surface-subtle)]/35 active:bg-[var(--surface-subtle)]/60 border-0 text-start cursor-pointer transition-colors duration-fast box-border"
            title={q}
          >
            <span className="text-[13.5px] font-normal text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors truncate font-sans">
              {q}
            </span>
            <span className="shrink-0 text-[var(--text-muted)]/75 group-hover:text-[var(--text-primary)] transition-colors">
              {dir === 'rtl' ? (
                <CornerDownLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
              ) : (
                <CornerDownRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

