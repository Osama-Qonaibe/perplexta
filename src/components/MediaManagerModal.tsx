import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash2, Play, Film, Image as ImageIcon, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { MediaGalleryItem } from '../../server/db/types';
import { getMediaUrl } from '../utils/mediaUtils';
import { Button } from '@/design-system';

interface MediaManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaItems: MediaGalleryItem[];
  onChangeMediaItems: (items: MediaGalleryItem[]) => void;
  onAddMoreFiles: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isRtl: boolean;
}

export const MediaManagerModal: React.FC<MediaManagerModalProps> = ({
  isOpen,
  onClose,
  mediaItems,
  onChangeMediaItems,
  onAddMoreFiles,
  isRtl
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const replaceIndexRef = useRef<number | null>(null);

  // Lock body scroll when modal is open to prevent background scrolling
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleUpdateCaption = (index: number, caption: string) => {
    const updated = [...mediaItems];
    updated[index] = { ...updated[index], caption };
    onChangeMediaItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    const updated = mediaItems.filter((_, i) => i !== index);
    onChangeMediaItems(updated);
  };

  const handleMoveItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= mediaItems.length) return;
    const updated = [...mediaItems];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    onChangeMediaItems(updated);
  };

  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const index = replaceIndexRef.current;
    if (!file || index === null || index === undefined || !mediaItems[index]) return;
    onAddMoreFiles(e);
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-[var(--surface-overlay)] backdrop-blur-md overflow-hidden select-none"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl my-auto max-h-[88vh] flex flex-col bg-[var(--surface-card)] text-[var(--text-primary)] rounded-shape-lg shadow-2xl border border-[var(--border-default)] overflow-hidden transition-theme transform-gpu no-flicker"
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            {/* Modal Top Header */}
            <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-[var(--border-default)] bg-[var(--surface-subtle)] shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-2 sm:p-2.5 rounded-shape-sm bg-accent/10 text-accent border border-accent/20 shrink-0">
                  <Film size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)] truncate">
                      {isRtl ? 'بطاقة تعديل الوسائط' : 'Media Gallery Editor'}
                    </h3>
                    <span className="px-2 py-0.5 rounded-shape-xs text-[10px] font-bold bg-accent/20 text-accent shrink-0">
                      {mediaItems.length} {isRtl ? (mediaItems.length === 1 ? 'عنصر' : 'عناصر') : (mediaItems.length === 1 ? 'item' : 'items')}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] font-medium pt-0.5 truncate">
                    {isRtl
                      ? 'إدارة الصور والمقاطع وتغيير الترتيب وإضافة شرح توضيحي'
                      : 'Manage photos/videos, reorder items & add custom captions'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label={isRtl ? 'إغلاق' : 'Close'}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-shape-sm bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all border border-[var(--border-default)] flex items-center justify-center cursor-pointer shrink-0 ms-2"
              >
                <X size={17} />
              </button>
            </div>

            {/* Media Items Grid Container */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[var(--surface-page)]">
              {mediaItems.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-shape-md bg-[var(--surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)] mb-3 shadow-inner">
                    <ImageIcon size={32} />
                  </div>
                  <p className="text-base font-bold text-[var(--text-primary)]">
                    {isRtl ? 'لا توجد وسائط مرفوعة بعد' : 'No media items uploaded yet'}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm">
                    {isRtl ? 'انقر على زر "إضافة صور/مقاطع فيديو" بالأسفل لرفع الوسائط' : 'Click "Add photos/videos" below to attach media items'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {mediaItems.map((item, idx) => {
                    const isVideo = item.type === 'video';
                    const displayUrl = getMediaUrl(item.thumbnailUrl || item.url);

                    return (
                      <div
                        key={item.id || `media-${idx}`}
                        className="group relative flex flex-col rounded-shape-md overflow-hidden border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm hover:border-[var(--border-accent)] transition-all duration-200"
                      >
                        {/* Media Preview Box */}
                        <div className="relative w-full aspect-video sm:aspect-square bg-[var(--surface-inset)] overflow-hidden flex items-center justify-center">
                          {isVideo ? (
                            <>
                              <video
                                src={getMediaUrl(item.url)}
                                poster={displayUrl}
                                className="w-full h-full object-cover"
                                muted
                                playsInline
                                preload="metadata"
                              />
                              {/* Centered Play Indicator */}
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/25">
                                <div className="w-11 h-11 rounded-shape-sm bg-black/60 text-white flex items-center justify-center backdrop-blur-xs border border-white/20 shadow-lg">
                                  <Play size={20} className="fill-white translate-x-0.5" />
                                </div>
                              </div>
                              <span className="absolute bottom-2 start-2 px-2 py-0.5 rounded-shape-xs bg-black/75 text-white text-[10px] font-bold flex items-center gap-1 backdrop-blur-xs">
                                <Film size={11} />
                                <span>{isRtl ? 'فيديو' : 'Video'}</span>
                              </span>
                            </>
                          ) : (
                            <img
                              src={displayUrl}
                              alt={`Media item ${idx + 1}`}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          )}

                          {/* Top Action Badge */}
                          <div className="absolute top-2 inset-x-2 flex items-center justify-between pointer-events-auto">
                            {/* Item Number Badge */}
                            <span className="px-2 py-0.5 rounded-shape-xs bg-black/75 text-white text-[11px] font-extrabold font-mono backdrop-blur-xs border border-white/10 shadow-xs">
                              #{idx + 1}
                            </span>

                            {/* Reorder & Remove Controls */}
                            <div className="flex items-center gap-1">
                              {idx > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleMoveItem(idx, idx - 1)}
                                  aria-label={isRtl ? 'تحريك للأمام' : 'Move left'}
                                  className="w-7 h-7 min-h-[36px] min-w-[36px] rounded-shape-full bg-black/70 hover:bg-black text-white flex items-center justify-center backdrop-blur-xs transition-all cursor-pointer"
                                  title={isRtl ? 'تقديم الترتيب' : 'Move left'}
                                >
                                  {isRtl ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
                                </button>
                              )}
                              {idx < mediaItems.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleMoveItem(idx, idx + 1)}
                                  aria-label={isRtl ? 'تحريك للخلف' : 'Move right'}
                                  className="w-7 h-7 min-h-[36px] min-w-[36px] rounded-shape-full bg-black/70 hover:bg-black text-white flex items-center justify-center backdrop-blur-xs transition-all cursor-pointer"
                                  title={isRtl ? 'تأخير الترتيب' : 'Move right'}
                                >
                                  {isRtl ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                aria-label={isRtl ? 'حذف هذه الوسيطة' : 'Remove this media'}
                                className="w-7 h-7 min-h-[36px] min-w-[36px] rounded-shape-full bg-red-600/85 hover:bg-red-600 text-white flex items-center justify-center transition-all cursor-pointer shadow-sm"
                                title={isRtl ? 'حذف هذا العنصر' : 'Delete item'}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Caption Input Section */}
                        <div className="p-3 flex-1 flex flex-col justify-between bg-[var(--surface-card)] border-t border-[var(--border-subtle)]">
                          <div>
                            <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">
                              {isRtl ? 'شرح توضيحي (اختياري)' : 'Caption (Optional)'}
                            </label>
                            <textarea
                              value={item.caption || ''}
                              onChange={(e) => handleUpdateCaption(idx, e.target.value)}
                              placeholder={isRtl ? 'أضف وصفاً توضيحياً...' : 'Add a caption...'}
                              rows={2}
                              className="ide-textarea h-20"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Hidden inputs for addition */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={onAddMoreFiles}
            />
            <input
              ref={replaceInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleReplaceFile}
            />

            {/* Footer Bar */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border-default)] bg-[var(--surface-subtle)] shrink-0 gap-3">
              {/* Add More Media Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 min-h-[44px] rounded-shape-sm font-bold text-xs transition-all duration-200 border border-[var(--border-default)] flex items-center justify-center gap-2 cursor-pointer bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] text-[var(--text-primary)] hover:border-[var(--border-accent)]/50 active:scale-95 select-none"
              >
                <Plus size={16} className="text-accent" />
                <span>{isRtl ? 'إضافة صور/مقاطع فيديو' : 'Add photos/videos'}</span>
              </button>

              {/* Confirm / Done Button */}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 min-h-[44px] rounded-shape-sm font-black text-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer bg-accent hover:bg-accent/90 text-slate-950 active:scale-95 select-none shadow-xs"
              >
                <Check size={16} />
                <span>{isRtl ? 'تم وحفظ التعديلات' : 'Done & Save'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
