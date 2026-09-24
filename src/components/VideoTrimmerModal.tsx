import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Play, Pause, Check, Volume2, VolumeX, RotateCcw, Music } from 'lucide-react';
import { AppModal, toast } from '@/design-system';
import { triggerHaptic } from '../utils/haptics';
import { AudioLibraryPickerModal, AudioTrackItem } from './bulletin/AudioLibraryPickerModal';

export interface VideoTrimmerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  videoDuration?: number;
  isRtl?: boolean;
  token?: string | null;
  onOpenAudioPicker?: () => void;
  onSelectAudioTrack?: (track: AudioTrackItem) => void;
  onTrimComplete: (trimmedData: {
    videoUrl: string;
    startTime: number;
    endTime: number;
    duration: number;
    adFormat: string;
    aspectRatio: string;
    videoFilter: string;
    audioTrack?: AudioTrackItem | null;
  }) => void;
}

const VIDEO_FILTERS = [
  { id: 'normal', nameAr: 'أصلي', nameEn: 'Normal', filter: 'none' },
  { id: 'cinematic', nameAr: 'سينمائي', nameEn: 'Cinematic', filter: 'contrast(115%) saturate(125%) brightness(95%) sepia(15%)' },
  { id: 'warm', nameAr: 'دافئ', nameEn: 'Warm', filter: 'sepia(35%) saturate(140%) brightness(102%)' },
  { id: 'cool', nameAr: 'بارد', nameEn: 'Cool', filter: 'hue-rotate(190deg) saturate(130%) contrast(110%)' },
  { id: 'grayscale', nameAr: 'رمادي', nameEn: 'B&W', filter: 'grayscale(100%) contrast(110%)' },
  { id: 'high-contrast', nameAr: 'تباين', nameEn: 'Contrast', filter: 'contrast(140%) brightness(105%)' },
  { id: 'vintage', nameAr: 'عتيق', nameEn: 'Vintage', filter: 'sepia(60%) contrast(100%) brightness(92%) hue-rotate(-10deg)' },
];

const FORMAT_OPTIONS = [
  { id: '9:16', format: 'reel', ratio: '9:16' },
  { id: '1:1', format: 'post', ratio: '1:1' },
  { id: '16:9', format: 'video', ratio: '16:9' },
] as const;

export const VideoTrimmerModal: React.FC<VideoTrimmerModalProps> = ({
  isOpen,
  onClose,
  videoUrl: initialVideoUrl,
  videoDuration = 0,
  isRtl = true,
  token = null,
  onOpenAudioPicker,
  onSelectAudioTrack,
  onTrimComplete,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const ambientVideoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>(initialVideoUrl);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(videoDuration || 15);

  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(videoDuration || 15);

  const [selectedFormat, setSelectedFormat] = useState<'9:16' | '1:1' | '16:9'>('9:16');
  const [selectedFilter, setSelectedFilter] = useState<string>('normal');
  const [isProcessing, setIsProcessing] = useState(false);
  const [thumbnails, setThumbnails] = useState<string[]>([]);

  // Music Picker Modal State
  const [isAudioPickerOpen, setIsAudioPickerOpen] = useState(false);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<AudioTrackItem | null>(null);

  // Dragging states for visual range trimmer handles ('start' | 'end' | 'window' | 'scrub')
  const [dragMode, setDragMode] = useState<'start' | 'end' | 'window' | 'scrub' | null>(null);
  const dragStartDataRef = useRef<{ clientX: number; initialStart: number; initialEnd: number; windowLength: number }>({
    clientX: 0,
    initialStart: 0,
    initialEnd: 15,
    windowLength: 15,
  });

  useEffect(() => {
    setCurrentVideoUrl(initialVideoUrl);
  }, [initialVideoUrl]);

  useEffect(() => {
    if (videoDuration && videoDuration > 0) {
      setDuration(videoDuration);
      setEndTime(videoDuration);
    }
  }, [videoDuration]);

  // Extract visual filmstrip frames from video
  useEffect(() => {
    if (!isOpen || !currentVideoUrl) return;

    let isMounted = true;
    const generateFilmstrip = async () => {
      try {
        const offscreenVideo = document.createElement('video');
        offscreenVideo.src = currentVideoUrl;
        offscreenVideo.crossOrigin = 'anonymous';
        offscreenVideo.muted = true;
        offscreenVideo.playsInline = true;

        await new Promise<void>((resolve) => {
          offscreenVideo.onloadedmetadata = () => resolve();
          offscreenVideo.onerror = () => resolve();
          setTimeout(resolve, 2000);
        });

        const totalDur = offscreenVideo.duration || duration || 10;
        const frameCount = 8;
        const step = totalDur / frameCount;
        const frames: string[] = [];

        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 96;
        const ctx = canvas.getContext('2d');

        for (let i = 0; i < frameCount; i++) {
          if (!isMounted) break;
          const targetTime = Math.min(totalDur - 0.1, i * step);
          offscreenVideo.currentTime = targetTime;

          await new Promise<void>((res) => {
            const onSeeked = () => {
              offscreenVideo.removeEventListener('seeked', onSeeked);
              if (ctx) {
                ctx.drawImage(offscreenVideo, 0, 0, canvas.width, canvas.height);
                frames.push(canvas.toDataURL('image/jpeg', 0.6));
              }
              res();
            };
            offscreenVideo.addEventListener('seeked', onSeeked);
            setTimeout(() => {
              offscreenVideo.removeEventListener('seeked', onSeeked);
              res();
            }, 250);
          });
        }

        if (isMounted && frames.length > 0) {
          setThumbnails(frames);
        }
      } catch (_) {}
    };

    generateFilmstrip();
    return () => {
      isMounted = false;
    };
  }, [isOpen, currentVideoUrl, duration]);

  // Sync video time updates and loop strictly within trim range
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      if (video.duration && !isNaN(video.duration) && video.duration > 0) {
        setDuration(video.duration);
        if (endTime === 0 || endTime > video.duration) {
          setEndTime(video.duration);
        }
      }
    };

    const handleTimeUpdate = () => {
      const cur = video.currentTime;
      setCurrentTime(cur);

      if (ambientVideoRef.current && Math.abs(ambientVideoRef.current.currentTime - cur) > 0.2) {
        ambientVideoRef.current.currentTime = cur;
      }

      if (cur >= endTime || cur < startTime) {
        video.currentTime = startTime;
        if (ambientVideoRef.current) ambientVideoRef.current.currentTime = startTime;
      }
    };

    const handleEnded = () => {
      video.currentTime = startTime;
      if (ambientVideoRef.current) ambientVideoRef.current.currentTime = startTime;
      video.play().catch(() => {});
    };

    const handlePlay = () => {
      setIsPlaying(true);
      if (ambientVideoRef.current) {
        ambientVideoRef.current.play().catch(() => {});
      }
    };

    const handlePause = () => {
      setIsPlaying(false);
      if (ambientVideoRef.current) {
        ambientVideoRef.current.pause();
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [startTime, endTime]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      if (video.currentTime < startTime || video.currentTime >= endTime) {
        video.currentTime = startTime;
        if (ambientVideoRef.current) ambientVideoRef.current.currentTime = startTime;
      }
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
    triggerHaptic('light');
  }, [startTime, endTime]);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Timeline dragging logic
  const handleTimelinePointerDown = (
    mode: 'start' | 'end' | 'window' | 'scrub',
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!timelineRef.current || duration <= 0) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickRatio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = clickRatio * duration;

    setDragMode(mode);
    dragStartDataRef.current = {
      clientX: e.clientX,
      initialStart: startTime,
      initialEnd: endTime,
      windowLength: endTime - startTime,
    };

    if (mode === 'scrub') {
      const clampedTime = Math.max(startTime, Math.min(endTime, targetTime));
      setCurrentTime(clampedTime);
      if (videoRef.current) {
        videoRef.current.currentTime = clampedTime;
      }
      if (ambientVideoRef.current) {
        ambientVideoRef.current.currentTime = clampedTime;
      }
    }

    triggerHaptic('medium');

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!timelineRef.current || duration <= 0) return;
      const moveRect = timelineRef.current.getBoundingClientRect();
      const deltaX = moveEvent.clientX - dragStartDataRef.current.clientX;
      const deltaSeconds = (deltaX / moveRect.width) * duration;

      if (mode === 'start') {
        const newStart = Math.max(0, Math.min(dragStartDataRef.current.initialEnd - 0.5, dragStartDataRef.current.initialStart + deltaSeconds));
        setStartTime(newStart);
        setCurrentTime(newStart);
        if (videoRef.current) videoRef.current.currentTime = newStart;
        if (ambientVideoRef.current) ambientVideoRef.current.currentTime = newStart;
      } else if (mode === 'end') {
        const newEnd = Math.min(duration, Math.max(dragStartDataRef.current.initialStart + 0.5, dragStartDataRef.current.initialEnd + deltaSeconds));
        setEndTime(newEnd);
        setCurrentTime(newEnd);
        if (videoRef.current) videoRef.current.currentTime = newEnd;
        if (ambientVideoRef.current) ambientVideoRef.current.currentTime = newEnd;
      } else if (mode === 'window') {
        const winLen = dragStartDataRef.current.windowLength;
        let newStart = dragStartDataRef.current.initialStart + deltaSeconds;
        let newEnd = newStart + winLen;

        if (newStart < 0) {
          newStart = 0;
          newEnd = winLen;
        }
        if (newEnd > duration) {
          newEnd = duration;
          newStart = duration - winLen;
        }

        setStartTime(newStart);
        setEndTime(newEnd);
        setCurrentTime(newStart);
        if (videoRef.current) videoRef.current.currentTime = newStart;
        if (ambientVideoRef.current) ambientVideoRef.current.currentTime = newStart;
      } else if (mode === 'scrub') {
        const currentX = moveEvent.clientX - moveRect.left;
        const currentRatio = Math.max(0, Math.min(1, currentX / moveRect.width));
        const newCurrent = Math.max(startTime, Math.min(endTime, currentRatio * duration));
        setCurrentTime(newCurrent);
        if (videoRef.current) videoRef.current.currentTime = newCurrent;
        if (ambientVideoRef.current) ambientVideoRef.current.currentTime = newCurrent;
      }
    };

    const handlePointerUp = () => {
      setDragMode(null);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  const handleApplyTrim = async () => {
    setIsProcessing(true);
    const toastId = toast.loading(isRtl ? 'جاري تطبيق الإعدادات...' : 'Applying adjustments...');

    try {
      const matchedOption = FORMAT_OPTIONS.find((opt) => opt.id === selectedFormat) || FORMAT_OPTIONS[0];
      toast.dismiss(toastId);
      toast.success(isRtl ? 'تم تحديث الفيديو بنجاح' : 'Video adjusted successfully');

      onTrimComplete({
        videoUrl: currentVideoUrl,
        startTime,
        endTime,
        duration: Math.max(1, Math.round(endTime - startTime)),
        adFormat: matchedOption.format,
        aspectRatio: selectedFormat,
        videoFilter: selectedFilter,
        audioTrack: selectedAudioTrack,
      });
      onClose();
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(isRtl ? 'حدث خطأ أثناء حفظ الفيديو' : 'Failed to save video');
    } finally {
      setIsProcessing(false);
    }
  };

  // Range percentage calculations
  const startPercent = duration > 0 ? (startTime / duration) * 100 : 0;
  const endPercent = duration > 0 ? (endTime / duration) * 100 : 100;
  const currentPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const selectedFilterStyle = VIDEO_FILTERS.find(f => f.id === selectedFilter)?.filter || 'none';

  return (
    <>
      <AppModal
        open={isOpen}
        onClose={onClose}
        layer="nested"
        size="md"
        dir={isRtl ? 'rtl' : 'ltr'}
        contentClassName="!p-0 !border !border-[var(--border-default)] !rounded-[var(--radius-lg)] shadow-2xl !h-[82vh] !max-h-[600px] sm:!max-h-[640px] !w-[94%] sm:!max-w-md overflow-hidden bg-[var(--surface-page)]"
      >
        {/* Native Single-Column Mobile-First Studio Layout */}
        <div className="relative w-full h-full flex flex-col bg-[var(--surface-page)] overflow-hidden select-none">
          
          {/* 1. Header Toolbar (Compact) */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--surface-card)] border-b border-[var(--border-default)] z-30 shrink-0">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer border border-transparent hover:border-[var(--border-default)]"
            >
              <X size={16} />
            </button>

            {/* Time & Reset HUD */}
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] border border-[var(--border-default)] font-mono text-[10px] font-bold text-[var(--text-primary)]">
              <span className="text-[var(--text-primary)]">{formatTime(currentTime)}</span>
              <span className="text-[var(--text-muted)]">/</span>
              <span className="text-[var(--text-muted)]">{formatTime(endTime - startTime)}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setStartTime(0);
                  setEndTime(duration);
                  if (videoRef.current) videoRef.current.currentTime = 0;
                  triggerHaptic('light');
                }}
                title={isRtl ? 'إعادة ضبط' : 'Reset'}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] ms-1 cursor-pointer transition-colors"
              >
                <RotateCcw size={11} />
              </button>
            </div>

            {/* Save Action Button */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleApplyTrim}
              className="w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 active:scale-95 flex items-center justify-center shadow-xs transition-all cursor-pointer disabled:opacity-50 border border-[var(--border-strong)]"
              title={isRtl ? 'حفظ واعتماد' : 'Apply'}
              aria-label={isRtl ? 'حفظ واعتماد' : 'Apply'}
            >
              <Check size={15} strokeWidth={2.5} />
            </button>
          </div>

          {/* 2. Full-Bleed Video Stage & Canvas Viewport with Strict Edge Clipping */}
          <div 
            onClick={togglePlay}
            className="relative flex-1 min-h-0 w-full bg-black flex items-center justify-center cursor-pointer overflow-hidden select-none"
          >
            {/* Subtle Ambient Video Glow */}
            <video
              ref={ambientVideoRef}
              src={currentVideoUrl || undefined}
              muted
              playsInline
              style={{ filter: 'blur(30px)', transform: 'scale(1.1)' }}
              className="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none overflow-hidden"
            />

            {/* Foreground Rendered Video Container (Clips watermarks, icons & child elements to curved corners) */}
            <div className="relative z-10 w-full h-full flex items-center justify-center p-1.5 overflow-hidden">
              <div className={`relative overflow-hidden transition-all duration-200 flex items-center justify-center shadow-lg rounded-[var(--radius-md)] ${
                selectedFormat === '9:16' 
                  ? 'h-full aspect-[9/16]' 
                  : selectedFormat === '1:1' 
                  ? 'aspect-square max-h-full' 
                  : 'w-full aspect-video max-h-full'
              }`}>
                <video
                  ref={videoRef}
                  src={currentVideoUrl || undefined}
                  muted={isMuted}
                  playsInline
                  preload="auto"
                  style={{ filter: selectedFilterStyle }}
                  className="w-full h-full object-cover overflow-hidden rounded-[var(--radius-md)]"
                />
              </div>
            </div>

            {/* Tap-to-play icon indicator */}
            {!isPlaying && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 pointer-events-none">
                <div className="w-10 h-10 rounded-[var(--radius-md)] bg-black/75 text-white border border-white/20 flex items-center justify-center shadow-xl backdrop-blur-xs">
                  <Play size={18} className="translate-x-0.5 fill-current" />
                </div>
              </div>
            )}
          </div>

          {/* 3. Docked Single-Column Control Deck */}
          <div className="flex flex-col gap-2 px-2.5 pt-2 pb-2.5 bg-[var(--surface-card)] border-t border-[var(--border-default)] z-30 shrink-0">
            
            {/* Active Selected Audio Track Indicator Badge */}
            {selectedAudioTrack && (
              <div className="flex items-center justify-between px-2 py-1 rounded-[var(--radius-xs)] bg-purple-500/10 border border-purple-500/25 text-[10px] text-purple-300 animate-in fade-in duration-200">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <Music size={11} className="shrink-0 animate-pulse text-purple-400" />
                  <span className="truncate font-bold text-[var(--text-primary)]">
                    {selectedAudioTrack.title || (isRtl ? 'مقطع موسيقي' : 'Audio Track')}
                  </span>
                  {selectedAudioTrack.artist && (
                    <span className="text-[var(--text-muted)] truncate hidden sm:inline">
                      • {selectedAudioTrack.artist}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAudioTrack(null)}
                  className="w-4.5 h-4.5 rounded hover:bg-purple-500/20 flex items-center justify-center text-purple-400 cursor-pointer shrink-0 ms-1"
                  title={isRtl ? 'إزالة الموسيقى' : 'Remove Music'}
                >
                  <X size={10} />
                </button>
              </div>
            )}

            {/* Timeline Range Trimmer */}
            <div className="relative w-full">
              {dragMode && (
                <div 
                  className="absolute -top-6 z-40 px-1.5 py-0.5 rounded-[var(--radius-xs)] bg-[var(--surface-card)] text-[var(--text-primary)] font-mono text-[8.5px] font-bold shadow-md border border-[var(--border-default)] transform -translate-x-1/2 flex items-center gap-1 pointer-events-none"
                  style={{
                    left: `${
                      dragMode === 'start' 
                        ? startPercent 
                        : dragMode === 'end' 
                        ? endPercent 
                        : (startPercent + endPercent) / 2
                    }%`
                  }}
                >
                  <span>{formatTime(startTime)}</span>
                  <span className="text-[var(--text-muted)]">➔</span>
                  <span>{formatTime(endTime)}</span>
                  <span className="text-[var(--text-muted)] font-normal">({(endTime - startTime).toFixed(1)}s)</span>
                </div>
              )}

              <div
                ref={timelineRef}
                onPointerDown={(e) => handleTimelinePointerDown('scrub', e)}
                className="relative h-6.5 w-full rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] border border-[var(--border-default)] overflow-hidden cursor-pointer select-none touch-none"
              >
                {/* Thumbnail Strip */}
                <div className="absolute inset-0 flex items-center justify-between opacity-75 pointer-events-none overflow-hidden">
                  {thumbnails.length > 0 ? (
                    thumbnails.map((thumb, idx) => (
                      <img
                        key={idx}
                        src={thumb}
                        alt=""
                        className="h-full flex-1 object-cover border-r border-[var(--border-default)]/30 last:border-0"
                      />
                    ))
                  ) : (
                    <div className="w-full h-full bg-[var(--surface-subtle)]" />
                  )}
                </div>

                {/* Dimmed Out-of-Range */}
                <div
                  className="absolute inset-y-0 left-0 bg-black/70 pointer-events-none"
                  style={{ width: `${startPercent}%` }}
                />
                <div
                  className="absolute inset-y-0 right-0 bg-black/70 pointer-events-none"
                  style={{ width: `${100 - endPercent}%` }}
                />

                {/* Active Cut Window */}
                <div
                  onPointerDown={(e) => handleTimelinePointerDown('window', e)}
                  className="absolute inset-y-0 border-y-2 border-[var(--accent-foreground)] bg-[var(--accent-foreground)]/15 cursor-grab active:cursor-grabbing touch-none z-20"
                  style={{
                    left: `${startPercent}%`,
                    width: `${Math.max(1, endPercent - startPercent)}%`,
                  }}
                />

                {/* Playhead Marker */}
                <div
                  className="absolute inset-y-0 w-0.5 bg-white shadow-md z-30 pointer-events-none"
                  style={{ left: `${Math.min(endPercent, Math.max(startPercent, currentPercent))}%` }}
                >
                  <div className="w-1.5 h-1.5 rounded-[var(--radius-xs)] bg-white -translate-x-[2px] -translate-y-0.5 shadow-sm" />
                </div>

                {/* Left Handle */}
                <div
                  onPointerDown={(e) => handleTimelinePointerDown('start', e)}
                  style={{ left: `${startPercent}%` }}
                  className="absolute inset-y-0 -translate-x-1/2 w-2.5 bg-[var(--accent-foreground)] rounded-l-[var(--radius-xs)] flex items-center justify-center z-40 cursor-ew-resize active:scale-105 shadow-md border border-[var(--accent-foreground)] touch-none before:absolute before:-inset-2.5 before:content-['']"
                  title={isRtl ? 'بداية المقطع' : 'Start cut'}
                >
                  <div className="w-[1px] h-2.5 bg-white rounded-xs" />
                </div>

                {/* Right Handle */}
                <div
                  onPointerDown={(e) => handleTimelinePointerDown('end', e)}
                  style={{ left: `${endPercent}%` }}
                  className="absolute inset-y-0 -translate-x-1/2 w-2.5 bg-[var(--accent-foreground)] rounded-r-[var(--radius-xs)] flex items-center justify-center z-40 cursor-ew-resize active:scale-105 shadow-md border border-[var(--accent-foreground)] touch-none before:absolute before:-inset-2.5 before:content-['']"
                  title={isRtl ? 'نهاية المقطع' : 'End cut'}
                >
                  <div className="w-[1px] h-2.5 bg-white rounded-xs" />
                </div>
              </div>
            </div>

            {/* Aspect Ratio Numbers & Sound Control Buttons */}
            <div className="flex items-center justify-between gap-1.5">
              {/* Numbers Only Aspect Ratios */}
              <div className="flex items-center gap-0.5 bg-[var(--surface-subtle)] p-0.5 rounded-[var(--radius-sm)] border border-[var(--border-default)] flex-1">
                {FORMAT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSelectedFormat(opt.id as any);
                      triggerHaptic('light');
                    }}
                    className={`flex-1 py-0.5 px-1 rounded-[var(--radius-xs)] text-[10px] sm:text-[11px] font-mono font-bold transition-all cursor-pointer flex items-center justify-center ${
                      selectedFormat === opt.id
                        ? 'bg-[var(--surface-card)] text-[var(--text-primary)] shadow-xs border border-[var(--border-default)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                    title={opt.ratio}
                  >
                    <span>{opt.ratio}</span>
                  </button>
                ))}
              </div>

              {/* Music Library Button */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setIsAudioPickerOpen(true);
                  if (onOpenAudioPicker) onOpenAudioPicker();
                }}
                className={`w-6.5 h-6.5 rounded-[var(--radius-sm)] border text-[var(--text-primary)] flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                  selectedAudioTrack
                    ? 'bg-purple-500/20 border-purple-500/40 text-purple-400 font-bold'
                    : 'bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] border-[var(--border-default)]'
                }`}
                title={selectedAudioTrack ? (selectedAudioTrack.title || (isRtl ? 'مقطع موسيقي محدد' : 'Music Selected')) : (isRtl ? 'اختيار مقطع موسيقي' : 'Select Music Track')}
                aria-label={isRtl ? 'اختيار مقطع موسيقي' : 'Select Music Track'}
              >
                <Music size={13} className={selectedAudioTrack ? 'animate-pulse text-purple-400' : ''} />
              </button>

              {/* Mute Toggle */}
              <button
                type="button"
                onClick={() => {
                  setIsMuted(!isMuted);
                  triggerHaptic('light');
                }}
                className="w-6.5 h-6.5 rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] border border-[var(--border-default)] text-[var(--text-primary)] flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                title={isMuted ? (isRtl ? 'إلغاء كتم الصوت' : 'Unmute') : (isRtl ? 'كتم الصوت' : 'Mute')}
                aria-label={isMuted ? (isRtl ? 'إلغاء كتم الصوت' : 'Unmute') : (isRtl ? 'كتم الصوت' : 'Mute')}
              >
                {isMuted ? <VolumeX size={13} className="text-[var(--fg-danger)]" /> : <Volume2 size={13} />}
              </button>
            </div>

            {/* Filter Swatches (Evenly Fitted & Balanced) */}
            <div className="flex items-center justify-between gap-1 w-full pt-0.5 px-0.5">
              {VIDEO_FILTERS.map((flt) => (
                <button
                  key={flt.id}
                  type="button"
                  onClick={() => {
                    setSelectedFilter(flt.id);
                    triggerHaptic('light');
                  }}
                  className="group relative flex-1 flex flex-col items-center gap-0.5 min-w-0 transition-all cursor-pointer"
                  title={isRtl ? flt.nameAr : flt.nameEn}
                >
                  <div
                    className={`w-full max-w-[36px] h-5 rounded-[var(--radius-xs)] overflow-hidden border transition-all ${
                      selectedFilter === flt.id
                        ? 'ring-1.5 ring-[var(--accent-foreground)] scale-105 border-[var(--accent-foreground)] shadow-xs'
                        : 'border-[var(--border-default)] opacity-80 hover:opacity-100 hover:scale-105'
                    }`}
                  >
                    {thumbnails[0] ? (
                      <img
                        src={thumbnails[0]}
                        alt=""
                        style={{ filter: flt.filter }}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full"
                        style={{
                          filter: flt.filter,
                          background:
                            flt.id === 'normal'
                              ? 'linear-gradient(135deg, #94a3b8, #64748b)'
                              : flt.id === 'cinematic'
                              ? 'linear-gradient(135deg, #f59e0b, #b91c1c)'
                              : flt.id === 'warm'
                              ? 'linear-gradient(135deg, #fb923c, #ea580c)'
                              : flt.id === 'cool'
                              ? 'linear-gradient(135deg, #38bdf8, #2563eb)'
                              : flt.id === 'grayscale'
                              ? 'linear-gradient(135deg, #e2e8f0, #1e293b)'
                              : flt.id === 'high-contrast'
                              ? 'linear-gradient(135deg, #ffffff, #000000)'
                              : 'linear-gradient(135deg, #d97706, #78350f)',
                        }}
                      />
                    )}
                  </div>
                  <span className={`text-[8px] sm:text-[8.5px] font-bold leading-none transition-colors truncate max-w-full text-center mt-0.5 ${
                    selectedFilter === flt.id ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
                  }`}>
                    {isRtl ? flt.nameAr : flt.nameEn}
                  </span>
                </button>
              ))}
            </div>

          </div>

        </div>
      </AppModal>

      {/* Embedded Audio Library Picker Modal */}
      <AudioLibraryPickerModal
        open={isAudioPickerOpen}
        onClose={() => setIsAudioPickerOpen(false)}
        onSelectTrack={(track) => {
          setSelectedAudioTrack(track);
          setIsAudioPickerOpen(false);
          if (onSelectAudioTrack) onSelectAudioTrack(track);
          toast.success(isRtl ? 'تم اختيار المقطع الموسيقي بنجاح' : 'Audio track attached!');
        }}
        selectedTrackUrl={selectedAudioTrack?.audio_url}
        selectedTrackId={selectedAudioTrack?.id}
        token={token}
        isRtl={isRtl}
      />
    </>
  );
};
