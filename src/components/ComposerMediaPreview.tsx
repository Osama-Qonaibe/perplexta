import React from 'react';
import { Edit3, X, Play, Film, Image as ImageIcon, Plus } from 'lucide-react';
import { MediaGalleryItem } from '../../server/db/types';
import { getMediaUrl } from '../utils/mediaUtils';

interface ComposerMediaPreviewProps {
  mediaItems: MediaGalleryItem[];
  onOpenMediaManager: () => void;
  onClearAll: () => void;
  onAddMoreClick: () => void;
  isRtl: boolean;
}

export const ComposerMediaPreview: React.FC<ComposerMediaPreviewProps> = ({
  mediaItems,
  onOpenMediaManager,
  onClearAll,
  onAddMoreClick,
  isRtl
}) => {
  if (!mediaItems || mediaItems.length === 0) return null;

  const totalCount = mediaItems.length;

  const renderMediaThumbnail = (item: MediaGalleryItem, index: number, isLastWithMore = false, remainingCount = 0) => {
    const isVideo = item.type === 'video';
    const mediaSrc = getMediaUrl(item.url);
    const hasCustomThumbnail = Boolean(item.thumbnailUrl && item.thumbnailUrl !== item.url);
    const posterUrl = hasCustomThumbnail ? getMediaUrl(item.thumbnailUrl!) : undefined;
    const videoSrcWithTime = mediaSrc.includes('#') ? mediaSrc : `${mediaSrc}#t=0.5`;
    const displayUrl = hasCustomThumbnail ? getMediaUrl(item.thumbnailUrl!) : mediaSrc;

    return (
      <div
        key={item.id || index}
        onClick={onOpenMediaManager}
        className="relative w-full h-full overflow-hidden bg-[var(--surface-subtle)] cursor-pointer group select-none"
      >
        {isVideo ? (
          <>
            <video
              src={videoSrcWithTime}
              poster={posterUrl}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
              muted
              playsInline
              preload="metadata"
            />
            {/* Play Badge Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
              <div className="w-10 h-10 rounded-[var(--radius-xs)] bg-black/60 text-white flex items-center justify-center backdrop-blur-xs border border-white/20 shadow-md">
                <Play size={18} className="fill-white translate-x-0.5" />
              </div>
            </div>
            <span className="absolute bottom-2 start-2 px-1.5 py-0.5 rounded-[var(--radius-xs)] bg-black/70 text-white text-[10px] font-medium flex items-center gap-1">
              <Film size={10} />
              <span>{isRtl ? 'فيديو' : 'Video'}</span>
            </span>
          </>
        ) : (
          <img
            src={displayUrl}
            alt="Media preview"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        )}

        {/* Hover highlight */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Overflow +N Overlay (Facebook Style) */}
        {isLastWithMore && (
          <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px] flex flex-col items-center justify-center text-white z-10">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-wide font-mono">+{remainingCount}</span>
            <span className="text-[11px] font-semibold text-white/90 mt-0.5">
              {isRtl ? 'عناصر أخرى' : 'more'}
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderCollageLayout = () => {
    // 1 Item
    if (totalCount === 1) {
      return (
        <div className="w-full h-[180px] xs:h-[220px] sm:h-[320px] md:h-[340px]">
          {renderMediaThumbnail(mediaItems[0], 0)}
        </div>
      );
    }

    // 2 Items: 2 equal columns
    if (totalCount === 2) {
      return (
        <div className="grid grid-cols-2 gap-1 w-full h-[170px] xs:h-[200px] sm:h-[300px] md:h-[320px]">
          {renderMediaThumbnail(mediaItems[0], 0)}
          {renderMediaThumbnail(mediaItems[1], 1)}
        </div>
      );
    }

    // 3 Items: 1 large on top/side, 2 smaller
    if (totalCount === 3) {
      return (
        <div className="grid grid-cols-2 grid-rows-2 gap-1 w-full h-[180px] xs:h-[220px] sm:h-[320px] md:h-[340px]">
          <div className="row-span-2 col-span-1">
            {renderMediaThumbnail(mediaItems[0], 0)}
          </div>
          <div className="col-span-1 row-span-1">
            {renderMediaThumbnail(mediaItems[1], 1)}
          </div>
          <div className="col-span-1 row-span-1">
            {renderMediaThumbnail(mediaItems[2], 2)}
          </div>
        </div>
      );
    }

    // 4 Items: 2x2 grid
    if (totalCount === 4) {
      return (
        <div className="grid grid-cols-2 grid-rows-2 gap-1 w-full h-[180px] xs:h-[220px] sm:h-[320px] md:h-[340px]">
          {renderMediaThumbnail(mediaItems[0], 0)}
          {renderMediaThumbnail(mediaItems[1], 1)}
          {renderMediaThumbnail(mediaItems[2], 2)}
          {renderMediaThumbnail(mediaItems[3], 3)}
        </div>
      );
    }

    // 5 or more Items: Facebook 4-quadrant layout with +N on the 4th item
    return (
      <div className="grid grid-cols-2 grid-rows-2 gap-1 w-full h-[180px] xs:h-[220px] sm:h-[320px] md:h-[340px]">
        {renderMediaThumbnail(mediaItems[0], 0)}
        {renderMediaThumbnail(mediaItems[1], 1)}
        {renderMediaThumbnail(mediaItems[2], 2)}
        {renderMediaThumbnail(mediaItems[3], 3, true, totalCount - 4)}
      </div>
    );
  };

  return (
    <div className="relative w-full rounded-[var(--radius-lg)] overflow-hidden border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm mt-2 sm:mt-3 group/box transition-theme">
      {/* Top Floating Action Bar */}
      <div className="absolute top-2 sm:top-3 inset-x-2 sm:inset-x-3 z-20 flex items-center justify-between pointer-events-auto">
        {/* Left Side: "تعديل الكل" (Edit All) Button + Count */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onOpenMediaManager}
            className="platform-action-btn inline-flex items-center gap-1 px-2.5 sm:px-3.5 py-1 sm:py-1.5 min-h-[30px] sm:min-h-[36px] rounded-[var(--radius-md)] bg-[var(--surface-card)]/90 hover:bg-[var(--surface-subtle)] text-[var(--text-primary)] text-[11px] sm:text-xs font-bold shadow-md backdrop-blur-md border border-[var(--border-default)] transition-all cursor-pointer active:scale-95 focus:outline-none"
            title={isRtl ? 'تعديل الصور والفيديوهات وإضافة شرح توضيحي' : 'Edit photos & videos'}
          >
            <Edit3 size={12} className="sm:size-[14px] text-[var(--fg-accent)]" />
            <span>{isRtl ? 'تعديل الكل' : 'Edit All'}</span>
          </button>

          <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 min-h-[30px] sm:min-h-[36px] inline-flex items-center rounded-[var(--radius-md)] bg-[var(--surface-inset)]/90 text-[var(--text-primary)] text-[10px] sm:text-[11px] font-extrabold backdrop-blur-md border border-[var(--border-subtle)] shadow-xs">
            {totalCount} {isRtl ? (totalCount === 1 ? 'عنصر' : 'عناصر') : (totalCount === 1 ? 'item' : 'items')}
          </span>
        </div>

        {/* Right Side: Add more & Remove all */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onAddMoreClick}
            className="platform-icon-btn p-1 sm:p-1.5 min-h-[30px] min-w-[30px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center rounded-[var(--radius-md)] bg-[var(--surface-card)]/90 hover:bg-[var(--surface-subtle)] text-[var(--text-primary)] text-xs shadow-md backdrop-blur-md border border-[var(--border-default)] transition-all cursor-pointer active:scale-95"
            title={isRtl ? 'إضافة المزيد من الوسائط' : 'Add more media'}
          >
            <Plus size={14} className="sm:size-[16px]" />
          </button>

          <button
            type="button"
            onClick={onClearAll}
            className="p-1 sm:p-1.5 min-h-[30px] min-w-[30px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center rounded-[var(--radius-md)] bg-[var(--surface-inset)]/90 hover:bg-[var(--fg-danger)] text-[var(--text-primary)] hover:text-white shadow-md backdrop-blur-md border border-[var(--border-default)] transition-all cursor-pointer active:scale-95"
            title={isRtl ? 'حذف جميع الوسائط المرفوعة' : 'Clear all media'}
          >
            <X size={14} className="sm:size-[16px]" />
          </button>
        </div>
      </div>

      {/* Collage Display */}
      {renderCollageLayout()}
    </div>
  );
};
