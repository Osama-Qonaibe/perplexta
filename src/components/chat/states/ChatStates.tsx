import React from 'react';
import { Loader2 } from 'lucide-react';

interface ChatLoadingProps {
  dir: 'rtl' | 'ltr';
  message?: string;
}

export const ChatLoadingState: React.FC<ChatLoadingProps> = ({ dir, message }) => (
  <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] py-12">
    <div className="relative w-10 h-10 mb-3.5 flex items-center justify-center">
      <div className="absolute inset-0 border-2 border-[var(--border-default)] rounded-full" />
      <Loader2 size={36} className="text-[var(--fg-accent)] animate-spin" />
    </div>
    <p className="text-[11px] font-bold tracking-wider text-[var(--text-muted)] uppercase">
      {message || (dir === 'rtl' ? 'جاري تحميل المحتوى...' : 'Loading Content...')}
    </p>
  </div>
);
