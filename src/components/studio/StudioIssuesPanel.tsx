import React, { useState } from 'react';
import { AlertTriangle, Wand2, X, Terminal, Plus, CheckCircle2, Trash2 } from 'lucide-react';

export interface StudioIssueItem {
  id: string;
  message: string;
  source?: string;
  line?: number;
  resolved?: boolean;
  type?: 'runtime' | 'user';
}

interface StudioIssuesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  issues: StudioIssueItem[];
  onTriggerAiFix: (issueMessage?: string) => void;
  onAddUserIssue?: (message: string) => void;
  onToggleResolveIssue?: (id: string) => void;
  onClearResolved?: () => void;
  language?: 'ar' | 'en';
}

export const StudioIssuesPanel: React.FC<StudioIssuesPanelProps> = ({
  isOpen,
  onClose,
  issues,
  onTriggerAiFix,
  onAddUserIssue,
  onToggleResolveIssue,
  onClearResolved,
  language = 'ar'
}) => {
  const [noteInput, setNoteInput] = useState('');
  const isAr = language === 'ar';

  if (!isOpen) return null;

  const openIssues = issues.filter((i) => !i.resolved);
  const resolvedCount = issues.length - openIssues.length;

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim() || !onAddUserIssue) return;
    onAddUserIssue(noteInput.trim());
    setNoteInput('');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--surface-card)] border-t border-[var(--border-default)] shadow-2xl font-sans max-h-[340px] flex flex-col">
      {/* Header */}
      <div className="p-2.5 border-b border-[var(--border-default)] flex items-center justify-between px-4">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-500">
          <AlertTriangle size={15} />
          <span>
            {isAr
              ? `سجل الأخطاء وقائمة الملاحظات (${openIssues.length})`
              : `Preview Console & Punch List (${openIssues.length})`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {resolvedCount > 0 && onClearResolved && (
            <button
              type="button"
              onClick={onClearResolved}
              className="px-2 py-1 rounded-shape-xs bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <Trash2 size={11} />
              <span>{isAr ? 'مسح المنجزة' : 'Clear Resolved'}</span>
            </button>
          )}

          {openIssues.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const combined = openIssues.map((i) => `- ${i.message}`).join('\n');
                onTriggerAiFix(combined);
                onClose();
              }}
              className="px-2.5 py-1 rounded-shape-xs bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 hover:opacity-90 transition-all cursor-pointer shadow-xs"
            >
              <Wand2 size={12} />
              <span>{isAr ? 'إصلاح الكل بالذكاء الاصطناعي' : 'Fix All with AI'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-shape-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Add User Note / Issue Form */}
      {onAddUserIssue && (
        <form onSubmit={handleAddNote} className="px-4 py-2 bg-[var(--surface-subtle)] border-b border-[var(--border-default)] flex items-center gap-2">
          <input
            type="text"
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder={
              isAr
                ? 'أضف ملاحظة أو مشكلة ليقوم المساعد بإصلاحها...'
                : 'Add a bug note or UI tweak to the punch list...'
            }
            className="flex-1 px-3 py-1 text-xs bg-[var(--surface-card)] border border-[var(--border-default)] rounded-shape-xs text-[var(--text-primary)] outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            disabled={!noteInput.trim()}
            className="px-3 py-1 rounded-shape-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <Plus size={12} />
            <span>{isAr ? 'إضافة' : 'Add'}</span>
          </button>
        </form>
      )}

      {/* Issues List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar text-xs bg-[var(--surface-subtle)] text-[var(--text-primary)]">
        {issues.length === 0 ? (
          <div className="py-6 text-center text-xs text-[var(--text-muted)] flex items-center justify-center gap-2">
            <Terminal size={14} />
            <span>
              {isAr
                ? 'لا توجد أخطاء تشغيلية أو ملاحظات مسجلة حالياً'
                : 'No console errors or punch-list notes reported'}
            </span>
          </div>
        ) : (
          issues.map((iss) => (
            <div
              key={iss.id}
              className={`flex items-start justify-between gap-3 p-2.5 rounded-shape-xs border ${
                iss.resolved
                  ? 'bg-[var(--surface-card)]/50 border-[var(--border-default)] opacity-60'
                  : iss.type === 'user'
                    ? 'bg-amber-500/10 border-amber-500/25 text-amber-500'
                    : 'bg-red-500/10 border-red-500/25 text-red-500'
              }`}
            >
              <div className="flex items-start gap-2 min-w-0 flex-1">
                {onToggleResolveIssue && (
                  <button
                    type="button"
                    onClick={() => onToggleResolveIssue(iss.id)}
                    className="mt-0.5 text-[var(--text-muted)] hover:text-green-500 cursor-pointer shrink-0"
                    title={iss.resolved ? 'Mark unresolved' : 'Mark resolved'}
                  >
                    <CheckCircle2 size={14} className={iss.resolved ? 'text-green-500' : ''} />
                  </button>
                )}
                <div className="space-y-0.5 min-w-0 flex-1">
                  <p className={`font-bold font-mono break-words ${iss.resolved ? 'line-through' : ''}`}>
                    {iss.message}
                  </p>
                  {iss.source && (
                    <p className="text-[10px] opacity-75 font-mono">
                      Source: {iss.source} {iss.line !== undefined && `line ${iss.line}`}
                    </p>
                  )}
                </div>
              </div>

              {!iss.resolved && (
                <button
                  type="button"
                  onClick={() => {
                    onTriggerAiFix(iss.message);
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded-shape-xs bg-amber-500 text-slate-950 hover:bg-amber-400 text-[10px] font-black shrink-0 cursor-pointer flex items-center gap-1"
                >
                  <Wand2 size={11} />
                  <span>{isAr ? 'إصلاح' : 'Fix'}</span>
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
