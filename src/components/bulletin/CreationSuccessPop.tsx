import React, { useEffect, useState } from 'react';
import { Check, Sparkles, Clapperboard, Camera, ArrowUpRight, X } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

export interface CreationSuccessItem {
  type: 'story' | 'reel' | 'post';
  title?: string;
  description?: string;
  mediaUrl?: string;
  videoUrl?: string;
  gradientClass?: string;
  authorName?: string;
  authorAvatar?: string;
  id?: string | number;
}

interface CreationSuccessPopProps {
  item: CreationSuccessItem | null;
  onClose: () => void;
  onViewItem?: (item: CreationSuccessItem) => void;
  isRtl?: boolean;
}

export const CreationSuccessPop: React.FC<CreationSuccessPopProps> = ({
  item,
  onClose,
  onViewItem,
  isRtl = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (item) {
      setIsVisible(true);
      setIsClosing(false);
      triggerHaptic('success');

      // Auto dismiss after 2.8 seconds
      const timer = setTimeout(() => {
        handleDismiss();
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [item]);

  const handleDismiss = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      onClose();
    }, 250);
  };

  if (!item || !isVisible) return null;

  const isStory = item.type === 'story';
  const isReel = item.type === 'reel';
  const isPost = item.type === 'post';

  const typeConfig = {
    story: {
      badgeAr: 'قصة جديدة',
      badgeEn: 'New Story',
      headingAr: 'تم نشر قصتك بنجاح! 🎉',
      headingEn: 'Story Published! 🎉',
      subAr: 'قصتك متاحة الآن في شريط القصص لمدة 24 ساعة',
      subEn: 'Your story is now live in the stories bar for 24 hours',
      gradient: 'from-accent to-blue-600',
      icon: <Camera size={16} className="text-white" />,
    },
    reel: {
      badgeAr: 'ريلز جديد',
      badgeEn: 'New Reel',
      headingAr: 'تم نشر الريلز بنجاح! 🎬',
      headingEn: 'Reel Published! 🎬',
      subAr: 'المقطع متاح الآن في خلاصة الريلز واستكشاف الفيديو',
      subEn: 'Your reel is now live in the reels feed',
      gradient: 'from-purple-600 to-indigo-600',
      icon: <Clapperboard size={16} className="text-white" />,
    },
    post: {
      badgeAr: 'منشور جديد',
      badgeEn: 'New Post',
      headingAr: 'تم نشر منشورك بنجاح! ✨',
      headingEn: 'Post Published! ✨',
      subAr: 'منشورك أصبح حياً في الصفحة الرئيسية',
      subEn: 'Your post is now published on the main feed',
      gradient: 'from-emerald-500 to-teal-600',
      icon: <Sparkles size={16} className="text-white" />,
    },
  }[item.type];

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={handleDismiss}
      className={`fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition-opacity duration-250 select-none ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Pop Container with subtle spring pop animation */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-[340px] xs:max-w-[370px] sm:max-w-[400px] rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-default)] shadow-2xl overflow-hidden p-5 flex flex-col items-center text-center transition-all duration-300 ease-out transform ${
          isClosing
            ? 'scale-90 opacity-0 translate-y-4'
            : 'scale-100 opacity-100 translate-y-0 animate-[popIn_0.35s_cubic-bezier(0.175,0.885,0.32,1.275)]'
        }`}
      >
        {/* Subtle Ambient Glow */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 rounded-shape-full bg-gradient-to-b ${typeConfig.gradient} opacity-20 blur-2xl pointer-events-none`}
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="relative top-0 self-end -mt-1 -me-1 w-7 h-7 rounded-shape-full bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors cursor-pointer z-20 before:absolute before:-inset-1.5 before:content-['']"
          title={isRtl ? 'إغلاق' : 'Close'}
        >
          <X size={14} />
        </button>

        {/* Top Success Badge & Icon Ring */}
        <div className="relative mb-3 flex items-center justify-center -mt-2">
          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-shape-full bg-gradient-to-tr ${typeConfig.gradient} flex items-center justify-center shadow-lg shadow-accent/25 text-white animate-bounce-short`}>
            <Check size={26} className="stroke-[3] drop-shadow-sm" />
          </div>
          <div className="absolute -bottom-1 -end-1 w-6 h-6 rounded-shape-full bg-[var(--surface-card)] border border-[var(--border-default)] flex items-center justify-center shadow-sm">
            {typeConfig.icon}
          </div>
        </div>

        {/* Text Feedback */}
        <div className="space-y-1 mb-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-shape-full bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[10.5px] font-bold text-[var(--text-secondary)] mb-1">
            <span className="w-1.5 h-1.5 rounded-shape-full bg-emerald-500 animate-pulse" />
            <span>{isRtl ? typeConfig.badgeAr : typeConfig.badgeEn}</span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-[var(--text-primary)] leading-snug">
            {isRtl ? typeConfig.headingAr : typeConfig.headingEn}
          </h3>
          <p className="text-[11.5px] sm:text-xs text-[var(--text-muted)] max-w-xs leading-relaxed">
            {isRtl ? typeConfig.subAr : typeConfig.subEn}
          </p>
        </div>

        {/* Center Live Thumbnail Preview */}
        <div className="w-full flex justify-center mb-4">
          {isStory ? (
            /* 9:16 Centered Story Preview */
            <div
              className={`relative w-28 h-44 sm:w-32 sm:h-50 rounded-shape-md overflow-hidden shadow-lg border-2 border-white/20 flex flex-col justify-between p-2.5 text-white bg-gradient-to-br ${
                item.gradientClass || 'from-rose-500 to-orange-400'
              }`}
            >
              {item.mediaUrl && (
                <img
                  src={item.mediaUrl}
                  alt="Story preview"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              {item.videoUrl && (
                <video
                  src={item.videoUrl}
                  className="absolute inset-0 w-full h-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              )}
              {/* Header */}
              <div className="flex items-center gap-1.5 z-10">
                <div className="w-5 h-5 rounded-shape-full bg-white/30 backdrop-blur-xs flex items-center justify-center text-[8px] font-bold overflow-hidden border border-white/40">
                  {item.authorAvatar ? (
                    <img src={item.authorAvatar} alt="Author" className="w-full h-full object-cover" />
                  ) : (
                    item.authorName?.[0] || 'U'
                  )}
                </div>
                <span className="text-[9px] font-bold truncate drop-shadow">{item.authorName || 'Story'}</span>
              </div>

              {/* Text */}
              {item.description && (
                <div className="my-auto px-1 z-10 text-center">
                  <p className="text-[10px] sm:text-[11px] font-black line-clamp-4 leading-tight drop-shadow-md">
                    {item.description}
                  </p>
                </div>
              )}

              {/* Footer */}
              <div className="z-10 text-center">
                <span className="text-[7.5px] bg-black/40 px-1.5 py-0.5 rounded-shape-full backdrop-blur-xs">
                  24h Story
                </span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30 pointer-events-none" />
            </div>
          ) : isReel ? (
            /* Reel Card Preview */
            <div className="relative w-28 h-44 sm:w-32 sm:h-50 rounded-shape-md overflow-hidden shadow-lg border-2 border-white/20 bg-slate-900 flex flex-col justify-between p-2.5 text-white">
              {item.videoUrl ? (
                <video
                  src={item.videoUrl}
                  className="absolute inset-0 w-full h-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : item.mediaUrl ? (
                <img src={item.mediaUrl} alt="Reel preview" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-tr from-purple-700 to-indigo-600">
                  <Clapperboard size={32} className="text-white/80" />
                </div>
              )}
              <div className="z-10 flex items-center justify-between">
                <span className="text-[8px] font-bold bg-purple-600/80 px-1.5 py-0.5 rounded-shape-full backdrop-blur-xs flex items-center gap-1">
                  <Clapperboard size={8} /> Reel
                </span>
              </div>
              <div className="z-10">
                <p className="text-[9.5px] font-bold truncate drop-shadow">{item.title || item.description || 'New Reel'}</p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />
            </div>
          ) : (
            /* Post Card Preview */
            <div className="w-full max-w-[280px] rounded-shape-md bg-[var(--surface-subtle)] border border-[var(--border-default)] p-2.5 text-start flex items-center gap-2.5 shadow-xs">
              {item.mediaUrl ? (
                <img
                  src={item.mediaUrl}
                  alt="Post"
                  className="w-12 h-12 rounded-shape-sm object-cover shrink-0 border border-[var(--border-default)]"
                />
              ) : (
                <div className="w-12 h-12 rounded-shape-sm bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/25">
                  <Sparkles size={20} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-[var(--text-primary)] truncate">
                  {item.title || (isRtl ? 'منشور جديد' : 'New Post')}
                </h4>
                <p className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">
                  {item.description || (isRtl ? 'تمت إضافة المنشور للرئيسية' : 'Published to main feed')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="w-full flex items-center gap-2">
          {onViewItem && (
            <button
              type="button"
              onClick={() => {
                onViewItem(item);
                handleDismiss();
              }}
              className="flex-1 min-h-[38px] py-2 px-3 rounded-shape-sm bg-accent hover:opacity-90 text-[var(--text-primary)] text-xs font-bold transition-all duration-fast flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-xs border border-[var(--border-main)]"
            >
              <span>{isRtl ? 'مشاهدة الآن' : 'View Now'}</span>
              <ArrowUpRight size={13} />
            </button>
          )}

          <button
            type="button"
            onClick={handleDismiss}
            className={`min-h-[38px] py-2 px-3.5 rounded-shape-sm border border-[var(--border-default)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-bold transition-all duration-fast active:scale-95 cursor-pointer ${
              onViewItem ? '' : 'w-full'
            }`}
          >
            {isRtl ? 'رائع، حسناً' : 'Done'}
          </button>
        </div>

        {/* Progress Bar (Auto dismiss countdown) */}
        <div className="w-full h-1 bg-[var(--surface-subtle)] rounded-shape-full overflow-hidden mt-3">
          <div className="h-full bg-gradient-to-r from-accent to-emerald-500 animate-[progressCountdown_2.8s_linear_forwards]" />
        </div>
      </div>
    </div>
  );
};
