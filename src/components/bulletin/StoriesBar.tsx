import React from 'react';
import { Camera, Clapperboard, Plus, Video, CheckCircle2, Type } from 'lucide-react';
import { BulletinAvatar } from '../BulletinAvatar';
import { toast } from '@/design-system';

export interface StoriesBarProps {
  isRtl: boolean;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  token: string | null;
  user: any;
  setIsStoryModalOpen: (open: boolean) => void;
  onOpenUploadStory?: (mode?: 'media' | 'text') => void;
  onOpenUploadReel?: () => void;
  representativeStories: any[];
  orderedStories: any[];
  previewingVideoStoryId: any;
  setPreviewingVideoStoryId: (id: any) => void;
  setSelectedStoryIndex: (index: number) => void;
  setIsStoryViewerOpen: (open: boolean) => void;
  storyPressTimerRef: React.MutableRefObject<any>;
  getMediaUrl: (url?: string) => string;
}

export const StoriesBar: React.FC<StoriesBarProps> = ({
  isRtl,
  activeTab,
  setActiveTab,
  token,
  user,
  setIsStoryModalOpen,
  onOpenUploadStory,
  onOpenUploadReel,
  representativeStories,
  orderedStories,
  previewingVideoStoryId,
  setPreviewingVideoStoryId,
  setSelectedStoryIndex,
  setIsStoryViewerOpen,
  storyPressTimerRef,
  getMediaUrl,
}) => {
  return (
    <div className="p-2 sm:p-3.5 rounded-[var(--radius-md)] bg-[var(--surface-card)] border border-[var(--border-default)] shadow-xs space-y-2 sm:space-y-2.5">
      <div className="flex items-center gap-1.5 sm:gap-2 px-1 border-b border-[var(--border-default)] pb-1.5 sm:pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('board')}
          className={`h-6.5 sm:h-7 px-2 sm:px-2.5 rounded-shape-sm text-[11px] sm:text-xs font-bold transition-all duration-150 flex items-center gap-1 sm:gap-1.5 cursor-pointer shadow-2xs ${
            activeTab === 'board' ? 'bg-accent/10 text-accent border border-accent/25' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] border border-transparent'
          }`}
        >
          <Camera size={12} className="sm:size-[13px]" />
          <span>{isRtl ? 'قصص' : 'Stories'}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('reels')}
          className={`h-6.5 sm:h-7 px-2 sm:px-2.5 rounded-shape-sm text-[11px] sm:text-xs font-bold transition-all duration-150 flex items-center gap-1 sm:gap-1.5 cursor-pointer shadow-2xs ${
            activeTab === 'reels' ? 'bg-accent/10 text-accent border border-accent/25' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] border border-transparent'
          }`}
        >
          <Clapperboard size={12} className="sm:size-[13px]" />
          <span>{isRtl ? 'ريلز' : 'Reels'}</span>
        </button>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto scrollbar-none pb-0.5 pt-0.5 px-0.5 touch-pan-x snap-x snap-mandatory">
        {/* Partitioned Primary Create Card (Top: Story + Reel, Bottom: Text Story) */}
        <div className="relative w-22 h-34 xs:w-24 xs:h-38 sm:w-32 sm:h-52 rounded-[var(--radius-md)] overflow-hidden bg-[var(--surface-card)] border border-[var(--border-default)] hover:border-accent/50 shrink-0 snap-start flex flex-col shadow-2xs transition-all duration-200 ease-out hover:shadow-md select-none">
          {/* Upper Section: Split into 2 equal columns (Story with + button & Reel) */}
          <div className="flex-1 flex border-b border-[var(--border-default)] divide-x rtl:divide-x-reverse divide-[var(--border-default)]">
            {/* Button 1: رفع قصة (Story upload with plus icon) */}
            <button
              type="button"
              onClick={() => {
                if (!token) {
                  toast.error(isRtl ? 'يرجى تسجيل الدخول أولاً' : 'Please log in first');
                  return;
                }
                if (onOpenUploadStory) {
                  onOpenUploadStory('media');
                } else {
                  setIsStoryModalOpen(true);
                }
              }}
              className="flex-1 flex flex-col items-center justify-center p-0.5 sm:p-1.5 hover:bg-accent/10 active:bg-accent/20 transition-all duration-150 cursor-pointer group/story focus:outline-none"
              title={isRtl ? 'رفع قصة (صور أو فيديو)' : 'Upload Story (Photo/Video)'}
            >
              <div className="w-6.5 h-6.5 sm:w-9 sm:h-9 rounded-full bg-accent text-white flex items-center justify-center shadow-xs group-hover/story:scale-110 active:scale-95 transition-transform mb-0.5 sm:mb-1.5">
                <Plus size={13} className="sm:size-[17px] stroke-[2.5]" />
              </div>
              <span className="text-[9px] sm:text-[11px] font-bold text-[var(--text-primary)] group-hover/story:text-accent transition-colors text-center leading-tight">
                {isRtl ? 'قصة' : 'Story'}
              </span>
            </button>

            {/* Button 2: رفع ريلز (Reel upload) */}
            <button
              type="button"
              onClick={() => {
                if (!token) {
                  toast.error(isRtl ? 'يرجى تسجيل الدخول أولاً' : 'Please log in first');
                  return;
                }
                if (onOpenUploadReel) {
                  onOpenUploadReel();
                } else {
                  setActiveTab('reels');
                }
              }}
              className="flex-1 flex flex-col items-center justify-center p-0.5 sm:p-1.5 hover:bg-purple-500/10 active:bg-purple-500/20 transition-all duration-150 cursor-pointer group/reel focus:outline-none"
              title={isRtl ? 'رفع مقطع ريلز عمودي' : 'Upload Vertical Reel'}
            >
              <div className="w-6.5 h-6.5 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center shadow-xs group-hover/reel:scale-110 active:scale-95 transition-transform mb-0.5 sm:mb-1.5">
                <Clapperboard size={12} className="sm:size-[15px]" />
              </div>
              <span className="text-[9px] sm:text-[11px] font-bold text-[var(--text-primary)] group-hover/reel:text-purple-500 transition-colors text-center leading-tight">
                {isRtl ? 'ريلز' : 'Reel'}
              </span>
            </button>
          </div>

          {/* Lower Section: رفع قصة نص (Text Story) */}
          <button
            type="button"
            onClick={() => {
              if (!token) {
                toast.error(isRtl ? 'يرجى تسجيل الدخول أولاً' : 'Please log in first');
                return;
              }
              if (onOpenUploadStory) {
                onOpenUploadStory('text');
              } else {
                setIsStoryModalOpen(true);
              }
            }}
            className="h-9 sm:h-15 w-full flex items-center justify-center gap-1 sm:gap-1.5 px-1 sm:px-2 bg-[var(--surface-subtle)] hover:bg-emerald-500/10 active:bg-emerald-500/20 transition-all duration-150 cursor-pointer group/text focus:outline-none"
            title={isRtl ? 'إنشاء قصة نصية بخلفية ملونة' : 'Create text story with gradient background'}
          >
            <div className="w-4.5 h-4.5 sm:w-6 sm:h-6 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center shadow-2xs group-hover/text:scale-110 active:scale-95 transition-transform shrink-0">
              <Type size={10} className="sm:size-[13px] stroke-[2.5]" />
            </div>
            <div className="flex flex-col items-start rtl:items-start text-start min-w-0">
              <span className="text-[9px] sm:text-xs font-bold text-[var(--text-primary)] group-hover/text:text-emerald-500 transition-colors leading-tight truncate">
                {isRtl ? 'قصة نص' : 'Text'}
              </span>
              <span className="text-[7.5px] sm:text-[8.5px] text-[var(--text-muted)] leading-none mt-0.5 hidden xs:block">
                {isRtl ? 'ملونة' : 'Gradient'}
              </span>
            </div>
          </button>
        </div>

        {/* User & Merchant Stories (Full card size without division) */}
        {representativeStories.map((story: any, sIdx: number) => {
          const viewerStartIndex = orderedStories.findIndex((s: any) => s.id === story.id);

          return (
            <div
              key={`rep-story-${story.id || 'st'}-${sIdx}`}
              onClick={() => {
                if (previewingVideoStoryId === story.id) return;
                setSelectedStoryIndex(viewerStartIndex >= 0 ? viewerStartIndex : 0);
                setIsStoryViewerOpen(true);
              }}
              className="relative w-22 h-34 xs:w-24 xs:h-38 sm:w-32 sm:h-52 rounded-[var(--radius-md)] overflow-hidden bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:border-accent/50 shrink-0 snap-start cursor-pointer group transition-all duration-200 ease-out hover:shadow-md flex flex-col justify-center items-center shadow-2xs"
            >
              <div className="relative w-full h-full overflow-hidden bg-[var(--surface-inset)] flex flex-col justify-center items-center">
                {/* Ambient Blurred Background */}
                <img
                  src={getMediaUrl(story.image_url)}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover blur-xl opacity-40 scale-125 saturate-150"
                />

                {/* Centered Proper Image */}
                <img
                  src={getMediaUrl(story.image_url)}
                  alt={story.title || ''}
                  className="absolute inset-0 w-full h-full object-contain transition-transform group-hover:scale-105 duration-300 opacity-85 group-hover:opacity-100 z-0"
                />

                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/5 transition-colors pointer-events-none z-10" />

                {/* Video icon if it's a video story */}
                {story.video_url && (
                  <div className="absolute top-1.5 end-1.5 sm:top-2 sm:end-2 bg-black/50 p-0.5 sm:p-1 rounded-shape-sm backdrop-blur-md border border-white/10 shadow-xs pointer-events-auto z-20">
                    <Video size={9} className="sm:size-[11px] text-white" />
                  </div>
                )}

                {/* Top-Corner Story Ring Avatar */}
                <div className="absolute top-1.5 start-1.5 sm:top-2 sm:start-2 z-20 pointer-events-auto">
                  <div
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full p-[1.5px] sm:p-[2px] bg-gradient-to-tr from-accent via-accent/80 to-accent/60 shadow-md transition-transform group-hover:scale-110"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      storyPressTimerRef.current = setTimeout(() => {
                        if ('vibrate' in navigator) navigator.vibrate([40]);
                        setPreviewingVideoStoryId(story.id);
                      }, 400);
                    }}
                    onPointerUp={(e) => {
                      if (storyPressTimerRef.current) clearTimeout(storyPressTimerRef.current);
                      if (previewingVideoStoryId === story.id) {
                        e.stopPropagation();
                        setPreviewingVideoStoryId(null);
                      }
                    }}
                    onPointerLeave={() => {
                      if (storyPressTimerRef.current) clearTimeout(storyPressTimerRef.current);
                      setPreviewingVideoStoryId(null);
                    }}
                  >
                    <img
                      src={getMediaUrl(story.author_avatar)}
                      alt={story.author_name || ''}
                      className="w-full h-full rounded-full object-cover border-[1.5px] border-[var(--surface-card)]"
                    />
                  </div>
                </div>

                {/* Name positioned at the very bottom center */}
                <div className="absolute inset-x-0 bottom-0 p-1.5 sm:p-2.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-20 pointer-events-none flex flex-col justify-end items-center">
                  <div className="flex items-center gap-0.5 sm:gap-1 justify-center w-full">
                    <span className="text-[9px] sm:text-[10px] font-bold text-white truncate drop-shadow text-center max-w-[70px] sm:max-w-[80px]">
                      {story.page_id ? story.page_name : story.author_name}
                    </span>
                    {story.page_id && <CheckCircle2 size={9} className="sm:size-[10px] text-accent fill-accent/20 shrink-0" />}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
