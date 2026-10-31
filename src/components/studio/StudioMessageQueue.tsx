import React from 'react';
import { Clock, Send, Trash2, Edit2, Sparkles } from 'lucide-react';
import type { StudioEditTarget } from './types';

export interface StudioQueuedMessage {
  id: string;
  text: string;
  timestamp?: string;
  createdAt?: string;
  editTarget?: StudioEditTarget | null;
}

export type StudioQueuedMessageItem = StudioQueuedMessage;

interface StudioMessageQueueProps {
  queue?: StudioQueuedMessage[];
  queuedMessages?: StudioQueuedMessage[];
  onEdit?: (id: string) => void;
  onEditQueued?: (id: string, newText: string) => void;
  onRemove?: (id: string) => void;
  onRemoveQueued?: (id: string) => void;
  onSendNow?: (id: string) => void;
  onSendImmediate?: (id: string) => void;
  language?: string;
}

export const StudioMessageQueue: React.FC<StudioMessageQueueProps> = ({
  queue,
  queuedMessages,
  onEdit,
  onEditQueued,
  onRemove,
  onRemoveQueued,
  onSendNow,
  onSendImmediate,
  language = 'ar'
}) => {
  const items = queue || queuedMessages || [];
  if (items.length === 0) return null;
  const isAr = language === 'ar';
  const handleRemove = onRemove || onRemoveQueued || (() => {});
  const handleSendNow = onSendNow || onSendImmediate || (() => {});
  const handleEdit = onEdit || (onEditQueued ? (id: string) => onEditQueued(id, '') : undefined);

  return (
    <div
      role="list"
      aria-label={isAr ? 'الرسائل المنتظرة في الطابور' : 'Queued messages'}
      className="w-full bg-amber-500/10 border border-amber-500/25 rounded-shape-md p-3 space-y-2 font-sans shadow-xs my-2"
    >
      <div className="flex items-center justify-between text-xs font-bold text-amber-500 pb-1 border-b border-amber-500/20">
        <div className="flex items-center gap-1.5">
          <Clock size={13} />
          <span>
            {isAr ? `الرسائل المنتظرة (${items.length})` : `Queued Messages (${items.length})`}
          </span>
        </div>
        <span className="text-[10px] font-normal text-amber-400/80">
          {isAr ? 'ستُرسل تلقائياً فور انتهاء المهمة الحالية' : 'Will send after current task finishes'}
        </span>
      </div>

      <div className="space-y-2">
        {items.map(item => (
          <div
            key={item.id}
            role="listitem"
            className="flex flex-col gap-1.5 p-2.5 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-default)] text-xs"
          >
            <p className="text-[var(--text-primary)] font-medium whitespace-pre-wrap break-words">
              {item.text}
            </p>

            {item.editTarget && (
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-shape-xs bg-blue-500/10 text-blue-400 text-[10px] font-mono self-start">
                <Sparkles size={10} />
                <span>
                  Editing &lt;{item.editTarget.tag}&gt;
                  {item.editTarget.id ? ` #${item.editTarget.id}` : ''}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1.5 border-t border-[var(--border-default)]/50">
              <span className="inline-flex items-center gap-1 text-[10px] text-amber-500 font-semibold">
                <Clock size={10} />
                <span>{isAr ? 'في الانتظار' : 'Queued'} • {item.timestamp || item.createdAt}</span>
              </span>

              <div className="flex items-center gap-1.5">
                {handleEdit && (
                  <button
                    type="button"
                    onClick={() => handleEdit(item.id)}
                    className="p-1 rounded-shape-xs hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-accent cursor-pointer"
                    title={isAr ? 'تعديل الرسالة' : 'Edit queued message'}
                  >
                    <Edit2 size={12} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  className="p-1 rounded-shape-xs hover:bg-rose-500/15 text-[var(--text-muted)] hover:text-rose-400 cursor-pointer"
                  title={isAr ? 'حذف من الطابور' : 'Remove queued message'}
                >
                  <Trash2 size={12} />
                </button>

                <button
                  type="button"
                  onClick={() => handleSendNow(item.id)}
                  className="px-2.5 py-1 rounded-shape-xs bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                  title={
                    isAr
                      ? 'إيقاف الرد الحالي وإرسال هذه الرسالة فوراً'
                      : 'Stop current reply and send this now'
                  }
                >
                  <Send size={10} />
                  <span>{isAr ? 'إرسال الآن' : 'Send now'}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
