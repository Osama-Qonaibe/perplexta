import React, { useState } from 'react';
import { Globe, Check, Copy, ExternalLink, X, ShieldCheck, RefreshCw } from 'lucide-react';

interface StudioPublishPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  isPublished: boolean;
  hasUnpublishedChanges?: boolean;
  publicUrl?: string;
  onTogglePublishStatus: () => void;
  onUpdatePublished?: () => void;
  language?: 'ar' | 'en';
}

export const StudioPublishPopover: React.FC<StudioPublishPopoverProps> = ({
  isOpen,
  onClose,
  projectName,
  isPublished,
  hasUnpublishedChanges = false,
  publicUrl,
  onTogglePublishStatus,
  onUpdatePublished,
  language = 'ar'
}) => {
  const [copied, setCopied] = useState(false);
  const isAr = language === 'ar';

  if (!isOpen) return null;

  const computedUrl =
    publicUrl ||
    `${window.location.origin}/preview/${projectName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'studio-app'}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(computedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 font-sans">
      <div className="w-full max-w-md bg-[var(--surface-card)] border border-[var(--border-default)] rounded-shape-md shadow-2xl p-4 space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2.5">
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
            <Globe size={16} className="text-blue-500" />
            <span>{isAr ? 'نشر ومشاركة التطبيق' : 'Publish & Live Hosting'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-shape-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        <div className="space-y-3">
          {/* Status Card */}
          <div className="flex items-center justify-between p-3 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)]">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isPublished
                      ? hasUnpublishedChanges
                        ? 'bg-amber-400'
                        : 'bg-green-500'
                      : 'bg-slate-400'
                  }`}
                />
                <p className="text-xs font-bold text-[var(--text-primary)]">
                  {isPublished
                    ? hasUnpublishedChanges
                      ? isAr
                        ? 'منشور (توجد تعديلات جديدة)'
                        : 'Published (Unpublished edits)'
                      : isAr
                        ? 'منشور ومباشر'
                        : 'Live on PERPLEXTA Cloud'
                    : isAr
                      ? 'وضع المسودة الخاصة'
                      : 'Private Draft Mode'}
                </p>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                {isPublished
                  ? isAr
                    ? 'التطبيق متاح عبر رابط المعاينة المباشر'
                    : 'Your app is accessible via the public preview link'
                  : isAr
                    ? 'انشر مشروعك لمشاركته عبر رابط مباشر'
                    : 'Publish your project to get a shareable live link'}
              </p>
            </div>

            <button
              type="button"
              onClick={onTogglePublishStatus}
              className={`px-3 py-1.5 rounded-shape-xs font-bold text-xs transition-all cursor-pointer shrink-0 ${
                isPublished
                  ? 'bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20'
                  : 'bg-blue-600 text-white hover:bg-blue-500'
              }`}
            >
              {isPublished ? (isAr ? 'إلغاء النشر' : 'Unpublish') : (isAr ? 'نشر الآن' : 'Publish Live')}
            </button>
          </div>

          {isPublished && (
            <div className="space-y-2.5 p-3 rounded-shape-xs bg-green-500/10 border border-green-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-green-500">
                  <ShieldCheck size={14} />
                  <span>{isAr ? 'الرابط المباشر نشط' : 'Live Endpoint Active'}</span>
                </div>
                {hasUnpublishedChanges && onUpdatePublished && (
                  <button
                    type="button"
                    onClick={onUpdatePublished}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-shape-xs bg-amber-500 text-slate-950 font-black text-[11px] cursor-pointer"
                  >
                    <RefreshCw size={11} />
                    <span>{isAr ? 'تحديث النسخة المنشورة' : 'Update Live App'}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 bg-[var(--surface-card)] border border-[var(--border-default)] rounded-shape-xs p-2 text-xs" dir="ltr">
                <span className="flex-1 font-mono text-[11px] text-[var(--text-primary)] truncate">
                  {computedUrl}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1.5 rounded-shape-xs hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                  title={isAr ? 'نسخ الرابط' : 'Copy link'}
                >
                  {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                </button>
                <a
                  href={computedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-shape-xs hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                  title={isAr ? 'فتح في تبويب جديد' : 'Open live app'}
                >
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
