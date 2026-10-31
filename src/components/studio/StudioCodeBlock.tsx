import React, { useState } from 'react';
import { Copy, Check, Code2, ExternalLink } from 'lucide-react';

interface StudioCodeBlockProps {
  language?: string;
  code: string;
  onOpenInEditor?: (code: string, lang: string) => void;
}

export const StudioCodeBlock: React.FC<StudioCodeBlockProps> = ({
  language = 'typescript',
  code,
  onOpenInEditor
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.trimEnd().split('\n');

  return (
    <div className="my-2.5 rounded-shape-sm overflow-hidden border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-primary)] font-mono text-xs shadow-2xs" dir="ltr">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--surface-subtle)] border-b border-[var(--border-default)] text-[11px] font-sans">
        <div className="flex items-center gap-2 text-[var(--text-secondary)] font-semibold">
          <Code2 size={13} className="text-blue-500" />
          <span className="uppercase tracking-wider">{language || 'code'}</span>
          <span className="text-[10px] text-[var(--text-muted)] font-mono">({lines.length} lines)</span>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenInEditor && (
            <button
              type="button"
              onClick={() => onOpenInEditor(code, language)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-shape-xs bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition-colors cursor-pointer"
            >
              <ExternalLink size={11} />
              <span>Open</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-0.5 rounded-shape-xs bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition-colors cursor-pointer"
            title="Copy code"
          >
            {copied ? (
              <>
                <Check size={11} className="text-green-400" />
                <span className="text-green-400">Copied</span>
              </>
            ) : (
              <>
                <Copy size={11} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Scrollable Code Content */}
      <pre className="p-3 overflow-x-auto max-h-80 custom-scrollbar leading-relaxed text-[11.5px] text-slate-100 select-text">
        <code>{code}</code>
      </pre>
    </div>
  );
};
