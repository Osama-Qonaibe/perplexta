import React, { useState, useRef, useEffect } from 'react';
import { Send, Square, Paperclip, Sparkles, X, Clock, Crosshair } from 'lucide-react';
import type { StudioEditTarget } from './types';

interface StudioComposerProps {
  onSendMessage: (text: string, files?: File[]) => void;
  onQueueMessage?: (text: string, files?: File[]) => void;
  isStreaming?: boolean;
  onStopStreaming?: () => void;
  initialValue?: string;
  placeholder?: string;
  editTargetName?: string;
  editTarget?: StudioEditTarget | null;
  onClearEditTarget?: () => void;
  language?: 'ar' | 'en';
}

export const StudioComposer: React.FC<StudioComposerProps> = ({
  onSendMessage,
  onQueueMessage,
  isStreaming = false,
  onStopStreaming,
  initialValue = '',
  placeholder,
  editTargetName,
  editTarget,
  onClearEditTarget,
  language = 'ar'
}) => {
  const [text, setText] = useState(initialValue);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isAr = language === 'ar';

  useEffect(() => {
    if (initialValue !== undefined) {
      setText(initialValue);
    }
  }, [initialValue]);

  const activeTargetLabel = editTarget
    ? `<${editTarget.tag.toLowerCase()}${editTarget.id ? `#${editTarget.id}` : ''}> ${editTarget.text ? `"${editTarget.text.slice(0, 32)}"` : ''}`
    : editTargetName;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() && attachedFiles.length === 0) return;

    if (isStreaming && onQueueMessage) {
      onQueueMessage(text.trim(), attachedFiles);
    } else {
      onSendMessage(text.trim(), attachedFiles);
    }
    setText('');
    setAttachedFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      setAttachedFiles((prev) => [...prev, ...selected]);
      e.target.value = '';
    }
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
    }
  }, [text]);

  const hasInput = text.trim().length > 0 || attachedFiles.length > 0;

  return (
    <div className="w-full flex flex-col space-y-2 font-sans">
      {/* Target element chip captured from visual inspect mode */}
      {activeTargetLabel && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-shape-xs bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-bold">
          <div className="flex items-center gap-2 truncate">
            <Crosshair size={13} className="shrink-0" />
            <span className="truncate font-mono text-[11px]">
              {isAr ? 'العنصر المحدد:' : 'Target:'} {activeTargetLabel}
            </span>
          </div>
          {onClearEditTarget && (
            <button
              type="button"
              onClick={onClearEditTarget}
              className="p-0.5 hover:bg-amber-500/20 rounded-shape-xs text-amber-500 cursor-pointer shrink-0"
              title={isAr ? 'إلغاء تحديد العنصر' : 'Clear target'}
            >
              <X size={13} />
            </button>
          )}
        </div>
      )}

      {/* Attachment previews */}
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-1">
          {attachedFiles.map((file, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)]"
            >
              <Paperclip size={12} className="text-blue-500" />
              <span className="truncate max-w-[130px]">{file.name}</span>
              <button
                type="button"
                onClick={() => setAttachedFiles((prev) => prev.filter((_, idx) => idx !== i))}
                className="hover:text-red-500 text-[var(--text-muted)] p-0.5 cursor-pointer"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Composer Input Box */}
      <div className="relative flex flex-col bg-[var(--surface-card)] border border-[var(--border-default)] rounded-shape-md p-2.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/15 transition-all shadow-xs">
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            placeholder ||
            (isStreaming
              ? isAr
                ? 'اكتب رسالة لإضافتها لقائمة الانتظار...'
                : 'Type to queue next message...'
              : isAr
                ? 'اطلب ميزة، تعديل، أو إصلاح...'
                : 'Ask for changes, new features, or fixes...')
          }
          className="w-full bg-transparent border-none outline-none text-xs md:text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] px-1.5 py-1 resize-none custom-scrollbar leading-relaxed"
        />

        <div className="flex items-center justify-between pt-2 border-t border-[var(--border-default)]/60 mt-1">
          {/* Action Left: Attach */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-2 py-1 rounded-shape-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer text-xs"
              title={isAr ? 'إرفاق ملفات أو صور' : 'Attach files or images'}
            >
              <Paperclip size={14} />
              <span className="text-[11px] font-medium hidden sm:inline">
                {isAr ? 'إرفاق' : 'Attach'}
              </span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              className="hidden"
            />
          </div>

          {/* Action Right: Send / Queue / Stop */}
          <div className="flex items-center gap-1.5">
            {isStreaming && hasInput && onQueueMessage && (
              <button
                type="button"
                onClick={() => handleSubmit()}
                className="px-2.5 py-1.5 rounded-shape-xs bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-500 font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer"
                title={isAr ? 'إضافة إلى قائمة الانتظار' : 'Queue message'}
              >
                <Clock size={12} />
                <span>{isAr ? 'إضافة للانتظار' : 'Queue'}</span>
              </button>
            )}

            {isStreaming ? (
              <button
                type="button"
                onClick={onStopStreaming}
                className="px-2.5 py-1.5 rounded-shape-xs bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                title={isAr ? 'إيقاف التوليد' : 'Stop generation'}
              >
                <Square size={12} className="fill-current" />
                <span className="text-[11px]">{isAr ? 'إيقاف' : 'Stop'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!hasInput}
                className="px-3 py-1.5 rounded-shape-xs bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-35 font-bold text-xs transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                title={isAr ? 'إرسال (Enter)' : 'Send (Enter)'}
              >
                <span>{isAr ? 'إرسال' : 'Send'}</span>
                <Send size={13} className={isAr ? 'rotate-180' : ''} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
