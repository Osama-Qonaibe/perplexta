import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from '@/design-system';
import { secureStorage } from "@/lib/storage";
import {
  X,
  Upload,
  Image as ImageIcon,
  Video as VideoIcon,
  Play,
  Pause,
  Clock,
  Sparkles,
  Loader2,
  Send,
  User,
  Music,
  Scissors,
  Volume2,
  VolumeX,
  Check,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Sliders,
  Sparkle,
  Type,
  Palette,
  AlignCenter,
  AlignRight,
  AlignLeft
} from 'lucide-react';

export interface StoryUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  isRtl?: boolean;
  token?: string | null;
  user?: any;
  userPages?: any[];
  onStoryCreated?: (newStory: any) => void;
  preselectedFile?: File | null;
  initialMode?: 'media' | 'text';
}

interface SelectedImageSettings {
  file: File;
  previewUrl: string;
  effect: string; // 'none' | 'vintage' | 'grayscale' | 'cyber' | 'cold' | 'glow'
  music: string; // 'none' | 'lofi' | 'acoustic' | 'pop' | 'piano'
  duration: number; // 5 to 15 seconds
}

// Preset Gradients for Text Stories
export const TEXT_STORY_GRADIENTS = [
  { id: 'sunset', nameAr: 'غروب دافئ', nameEn: 'Sunset', colors: ['#f43f5e', '#fb923c'], bgClass: 'from-rose-500 to-orange-400' },
  { id: 'cyber', nameAr: 'سايبر بنفسجي', nameEn: 'Cyber Violet', colors: ['#8b5cf6', '#ec4899'], bgClass: 'from-violet-500 to-pink-500' },
  { id: 'emerald', nameAr: 'زمردي منعش', nameEn: 'Emerald', colors: ['#059669', '#10b981'], bgClass: 'from-emerald-600 to-teal-500' },
  { id: 'ocean', nameAr: 'أزرق محيطي', nameEn: 'Ocean Deep', colors: ['#1e40af', '#3b82f6'], bgClass: 'from-blue-700 to-sky-500' },
  { id: 'fire', nameAr: 'لهب ناري', nameEn: 'Flame', colors: ['#dc2626', '#f59e0b'], bgClass: 'from-red-600 to-amber-500' },
  { id: 'obsidian', nameAr: 'أسود ليلي', nameEn: 'Obsidian Night', colors: ['#0f172a', '#334155'], bgClass: 'from-slate-900 to-slate-700' },
];

// Preset Music tracks with preview mp3 urls
const MUSIC_TRACKS = [
  { id: 'none', labelAr: 'بدون موسيقى', labelEn: 'No Music', url: '' },
  { id: 'lofi', labelAr: 'لوفي هادئ', labelEn: 'Lofi Beats', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 'acoustic', labelAr: 'جيتار كلاسيكي', labelEn: 'Acoustic Chill', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 'pop', labelAr: 'بوب حماسي', labelEn: 'Energetic Pop', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { id: 'piano', labelAr: 'بيانو سينمائي', labelEn: 'Cinematic Piano', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' }
];

// Preset Effects/Filters with Tailwind classes
const EFFECTS = [
  { id: 'none', labelAr: 'بدون تأثير', labelEn: 'Original', class: '' },
  { id: 'vintage', labelAr: 'كلاسيكي دافئ', labelEn: 'Vintage Warm', class: 'sepia contrast-125 saturate-110 brightness-95' },
  { id: 'grayscale', labelAr: 'أبيض وأسود', labelEn: 'Noir B&W', class: 'grayscale contrast-115' },
  { id: 'cyber', labelAr: 'سايبر ملون', labelEn: 'Cyberpunk', class: 'hue-rotate-90 saturate-150' },
  { id: 'cold', labelAr: 'أزرق سينمائي', labelEn: 'Cold Cinematic', class: 'saturate-120 hue-rotate-15 contrast-105' },
  { id: 'glow', labelAr: 'توهج مشرق', labelEn: 'Dreamy Glow', class: 'brightness-105 saturate-125 contrast-95 sepia-[15%]' }
];

export const StoryUploadModal: React.FC<StoryUploadModalProps> = ({
  isOpen,
  onClose,
  isRtl = true,
  token,
  user,
  userPages = [],
  onStoryCreated,
  preselectedFile = null,
  initialMode = 'media'
}) => {
  // Creation mode tab ('media' or 'text')
  const [creationTab, setCreationTab] = useState<'media' | 'text'>(initialMode);

  // Text Story States
  const [textContent, setTextContent] = useState<string>('');
  const [textGradientIndex, setTextGradientIndex] = useState<number>(0);
  const [textAlign, setTextAlign] = useState<'center' | 'right' | 'left'>('center');
  const [textFontSize, setTextFontSize] = useState<'normal' | 'large' | 'huge'>('large');

  // General State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string>('');
  const [isStoryDragging, setIsStoryDragging] = useState<boolean>(false);
  const [isVideo, setIsVideo] = useState<boolean>(false);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgressText, setUploadProgressText] = useState<string>('');

  // Multiple Images State
  const [imageStories, setImageStories] = useState<SelectedImageSettings[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  // Video Specific Playback States
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [startTimeOffset, setStartTimeOffset] = useState<number>(0);
  const [videoDurationLimit, setVideoDurationLimit] = useState<number>(30);

  // Video Cover / Thumbnails States
  const [recommendedCovers, setRecommendedCovers] = useState<string[]>([]);
  const [selectedCoverIndex, setSelectedCoverIndex] = useState<number>(0);
  const [isGeneratingCovers, setIsGeneratingCovers] = useState<boolean>(false);

  // Background Audio Preview Element for Images
  const [activeMusicTrack, setActiveMusicTrack] = useState<string>('none');
  const [isMusicPlaying, setIsMusicPlaying] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const customCoverInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  const handleCustomCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setRecommendedCovers(prev => [dataUrl, ...prev]);
      setSelectedCoverIndex(0);
    };
    reader.readAsDataURL(file);
  };

  // Auto handle preselected files
  useEffect(() => {
    if (preselectedFile) {
      handleFilesSelected([preselectedFile]);
    }
  }, [preselectedFile]);

  // Clean up Object URLs when closed
  useEffect(() => {
    if (!isOpen) {
      // Revoke general preview URL
      if (mediaPreviewUrl && mediaPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(mediaPreviewUrl);
      }
      // Revoke multiple image URLs
      imageStories.forEach(story => {
        if (story.previewUrl && story.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(story.previewUrl);
        }
      });

      setSelectedFile(null);
      setMediaPreviewUrl('');
      setIsVideo(false);
      setVideoDuration(0);
      setImageStories([]);
      setActiveImageIndex(0);
      setIsUploading(false);
      setRecommendedCovers([]);
      setSelectedCoverIndex(0);
      setStartTimeOffset(0);
      stopAudioPreview();
    }
  }, [isOpen]);

  // Sync initial mode whenever modal opens
  useEffect(() => {
    if (isOpen && initialMode) {
      setCreationTab(initialMode);
    }
  }, [isOpen, initialMode]);
  useEffect(() => {
    if (isVideo) {
      stopAudioPreview();
      return;
    }

    if (imageStories.length > 0) {
      const currentStory = imageStories[activeImageIndex];
      const selectedMusic = currentStory?.music || 'none';
      
      if (selectedMusic !== activeMusicTrack) {
        setActiveMusicTrack(selectedMusic);
        if (selectedMusic === 'none') {
          stopAudioPreview();
        } else {
          playAudioTrack(selectedMusic);
        }
      }
    }
  }, [activeImageIndex, imageStories, isVideo]);

  const playAudioTrack = (trackId: string) => {
    const track = MUSIC_TRACKS.find(t => t.id === trackId);
    if (!track || !track.url) {
      stopAudioPreview();
      return;
    }

    if (!audioPreviewRef.current) {
      audioPreviewRef.current = new Audio();
      audioPreviewRef.current.loop = true;
    }

    try {
      audioPreviewRef.current.src = track.url;
      audioPreviewRef.current.volume = isMuted ? 0 : 0.5;
      audioPreviewRef.current.play().then(() => {
        setIsMusicPlaying(true);
      }).catch(err => {
        console.warn('Audio play auto-blocked:', err);
        setIsMusicPlaying(false);
      });
    } catch (e) {
      console.error('Audio setup failed:', e);
    }
  };

  const stopAudioPreview = () => {
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      audioPreviewRef.current.src = '';
    }
    setIsMusicPlaying(false);
    setActiveMusicTrack('none');
  };

  const toggleMusicMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (audioPreviewRef.current) {
      audioPreviewRef.current.volume = nextMute ? 0 : 0.5;
    }
    if (videoRef.current) {
      videoRef.current.muted = nextMute;
    }
  };

  // Extract recommended cover thumbnails from video
  const generateVideoCovers = (fileUrl: string, durationSecs: number) => {
    if (!fileUrl || durationSecs <= 0) return;
    setIsGeneratingCovers(true);

    const video = document.createElement('video');
    video.src = fileUrl;
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.preload = 'auto';

    const covers: string[] = [];
    const timestamps = [
      Math.min(1, durationSecs * 0.1),
      Math.min(durationSecs - 0.5, durationSecs * 0.4),
      Math.min(durationSecs - 0.5, durationSecs * 0.7),
      Math.min(durationSecs - 0.5, durationSecs * 0.9)
    ];

    let currentIndex = 0;

    const captureNext = () => {
      if (currentIndex >= timestamps.length) {
        setRecommendedCovers(covers);
        setIsGeneratingCovers(false);
        video.remove();
        return;
      }
      video.currentTime = timestamps[currentIndex];
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 180;
        canvas.height = 320; // vertical ratio
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          covers.push(dataUrl);
        }
      } catch (e) {
        console.error('[StoryUpload] Video cover grab failed:', e);
      }
      currentIndex++;
      captureNext();
    };

    video.onloadedmetadata = () => {
      captureNext();
    };

    video.onerror = () => {
      setIsGeneratingCovers(false);
      video.remove();
    };
  };

  // Handles multiple files selected via input or drag-and-drop
  const handleFilesSelected = (filesList: File[]) => {
    if (!filesList || filesList.length === 0) return;

    // Check if the first file is a video
    const firstFile = filesList[0];
    const isVid = firstFile.type.startsWith('video/') || 
                  ['mp4', 'mov', 'avi', 'webm', 'mkv', 'wmv', 'flv', '3gp'].some(ext => firstFile.name.toLowerCase().endsWith('.' + ext));

    if (isVid) {
      // Videos must be uploaded singly
      if (filesList.length > 1) {
        toast.info(isRtl 
          ? 'تنبيه: لا يمكن اختيار أكثر من فيديو واحد للقصة، سيتم معالجة الفيديو الأول فقط.' 
          : 'Note: You can only upload one video at a time. Processing the first video only.');
      }

      const MAX_SIZE = 100 * 1024 * 1024; // 100MB max limit
      if (firstFile.size > MAX_SIZE) {
        toast.error(isRtl ? 'حجم مقطع الفيديو كبير جداً (الأقصى 100 ميجابايت)' : 'Video file too large (Max 100MB)');
        return;
      }

      const objectUrl = URL.createObjectURL(firstFile);
      setIsVideo(true);
      setSelectedFile(firstFile);
      setMediaPreviewUrl(objectUrl);
      setImageStories([]);

      const tempVid = document.createElement('video');
      tempVid.preload = 'metadata';
      tempVid.muted = true;
      tempVid.src = objectUrl;

      tempVid.onloadedmetadata = () => {
        const duration = tempVid.duration;
        setVideoDuration(duration);
        generateVideoCovers(objectUrl, duration);
        if (duration > 30.5) {
          toast.info(isRtl 
            ? 'سيتم تفعيل محدد القص التلقائي لمقاطع الفيديو الطويلة حتى 30 ثانية.' 
            : 'Long video trimmer enabled automatically to loop up to 30 seconds.');
        }
        tempVid.remove();
      };

      tempVid.onerror = () => {
        setVideoDuration(0);
        tempVid.remove();
      };
    } else {
      // Handle multiple images up to 10 photos max
      setIsVideo(false);
      setVideoDuration(0);
      setRecommendedCovers([]);

      const imgFiles = filesList.filter(f => f.type.startsWith('image/')).slice(0, 10);
      
      if (imgFiles.length === 0) {
        toast.error(isRtl ? 'يرجى اختيار صور صالحة فقط' : 'Please select valid image files only');
        return;
      }

      if (filesList.length > 10) {
        toast.info(isRtl 
          ? 'الحد الأقصى هو 10 صور للقصص المتعددة تلقائياً. تم اختيار أول 10 صور فقط.' 
          : 'Max limit is 10 photos for auto-split stories. Selected the first 10 photos only.');
      }

      const newImageStories: SelectedImageSettings[] = imgFiles.map(file => ({
        file,
        previewUrl: URL.createObjectURL(file),
        effect: 'none',
        music: 'none',
        duration: 15
      }));

      setImageStories(newImageStories);
      setActiveImageIndex(0);
      setSelectedFile(imgFiles[0]);
      setMediaPreviewUrl(newImageStories[0].previewUrl);
    }
  };

  const updateActiveImageSettings = (key: 'effect' | 'music' | 'duration', value: any) => {
    if (imageStories.length === 0) return;
    const updated = [...imageStories];
    updated[activeImageIndex] = {
      ...updated[activeImageIndex],
      [key]: value
    };
    setImageStories(updated);
  };

  const removeImageFromStories = (idx: number) => {
    if (imageStories.length <= 1) {
      // Clear all
      setImageStories([]);
      setSelectedFile(null);
      setMediaPreviewUrl('');
      return;
    }

    const updated = [...imageStories];
    const removedUrl = updated[idx].previewUrl;
    if (removedUrl.startsWith('blob:')) {
      URL.revokeObjectURL(removedUrl);
    }
    updated.splice(idx, 1);
    
    let nextIndex = activeImageIndex;
    if (idx <= activeImageIndex && activeImageIndex > 0) {
      nextIndex = activeImageIndex - 1;
    }

    setImageStories(updated);
    setActiveImageIndex(nextIndex);
    setSelectedFile(updated[nextIndex].file);
    setMediaPreviewUrl(updated[nextIndex].previewUrl);
  };

  const handlePublish = async () => {
    const authToken = token || secureStorage.getSync('app_token') || '';
    if (!authToken) {
      toast.error(isRtl ? 'يرجى تسجيل الدخول أولاً' : 'Please log in first');
      return;
    }

    setIsUploading(true);
    stopAudioPreview();

    try {
      if (isVideo) {
        // Publish Single Video Story
        setUploadProgressText(isRtl ? 'جاري رفع مقطع الفيديو القصير...' : 'Uploading short video clip...');
        
        const formData = new FormData();
        formData.append('file', selectedFile!);

        // Pass startTimeOffset and trim limit query parameters (up to 30 seconds)
        const uploadRes = await fetch(`/api/files/upload?maxDuration=30&startOffset=${startTimeOffset}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authToken}`
          },
          body: formData
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || (!uploadData.url && !uploadData.file_url && !uploadData.file?.url)) {
          throw new Error(uploadData.error || (isRtl ? 'فشل رفع مقطع الفيديو' : 'Video upload failed'));
        }

        const videoUrl = uploadData.url || uploadData.file_url || uploadData.file?.url;
        const coverThumbnailUrl = recommendedCovers[selectedCoverIndex] || '';

        setUploadProgressText(isRtl ? 'جاري توثيق ونشر قصة الفيديو...' : 'Publishing video story...');
        const res = await fetch('/api/bulletin/stories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`
          },
          body: JSON.stringify({
            title: isRtl ? 'قصة مرئية' : 'Video Story',
            description: isRtl ? 'شاهد قصة مرئية بالكامل 🎥' : 'Watch video story live 🎥',
            video_url: videoUrl,
            image_url: coverThumbnailUrl || undefined,
            page_id: null
          })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || (isRtl ? 'فشل نشر قصة الفيديو' : 'Failed to publish video story'));
        }

        if (onStoryCreated) onStoryCreated(data.story);
        toast.clear();
        toast.success(isRtl ? 'تم نشر قصة الفيديو بنجاح! 🎥' : 'Video story published successfully! 🎥');
        onClose();

      } else if (imageStories.length > 0) {
        // Publish Multiple Image Stories (Auto split)
        toast.info(isRtl 
          ? `جاري تقسيم ومعالجة عدد (${imageStories.length}) قصص تلقائياً...` 
          : `Processing and auto-splitting (${imageStories.length}) stories sequentially...`);

        let lastStory: any = null;

        for (let i = 0; i < imageStories.length; i++) {
          const item = imageStories[i];
          setUploadProgressText(isRtl 
            ? `جاري رفع القصة (${i + 1} من ${imageStories.length})...` 
            : `Uploading story (${i + 1} of ${imageStories.length})...`
          );

          const formData = new FormData();
          formData.append('file', item.file);

          const uploadRes = await fetch('/api/files/upload', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${authToken}`
            },
            body: formData
          });

          const uploadData = await uploadRes.json();
          if (!uploadRes.ok || (!uploadData.url && !uploadData.file_url && !uploadData.file?.url)) {
            throw new Error(`Failed story #${i+1} upload: ` + (uploadData.error || 'Server upload error'));
          }

          const imageUrl = uploadData.url || uploadData.file_url || uploadData.file?.url;

          // Assemble meta tags inside description for display styling
          const effectObj = EFFECTS.find(e => e.id === item.effect);
          const musicObj = MUSIC_TRACKS.find(m => m.id === item.music);
          
          const tags: string[] = [];
          if (effectObj && effectObj.id !== 'none') tags.push(`✨ ${isRtl ? effectObj.labelAr : effectObj.labelEn}`);
          if (musicObj && musicObj.id !== 'none') tags.push(`🎵 ${isRtl ? musicObj.labelAr : musicObj.labelEn}`);
          tags.push(`⏱️ ${item.duration}s`);

          const res = await fetch('/api/bulletin/stories', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`
            },
            body: JSON.stringify({
              title: isRtl ? `قصة مصورة #${i + 1}` : `Photo Story #${i + 1}`,
              description: tags.join(' | '),
              image_url: imageUrl,
              page_id: null
            })
          });

          const storyData = await res.json();
          if (res.ok && storyData.success) {
            lastStory = storyData.story;
          }
        }

        if (onStoryCreated && lastStory) {
          onStoryCreated(lastStory);
        }

        toast.clear();
        toast.success(isRtl 
          ? `تهانينا! تم نشر عدد (${imageStories.length}) قصص مقسمة بنجاح! 🎉` 
          : `Successfully published (${imageStories.length}) split stories! 🎉`
        );
        onClose();
      }
    } catch (err: any) {
      console.error('[StoryUpload] Processing failed:', err);
      toast.error(err.message || (isRtl ? 'حدث خطأ أثناء معالجة ونشر القصص' : 'Error publishing stories'));
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Publishing Text Story via 1080x1920 Canvas
  const handlePublishTextStory = async () => {
    if (!textContent.trim()) {
      toast.error(isRtl ? 'يرجى كتابة نص للقصة' : 'Please enter text for the story');
      return;
    }
    setIsUploading(true);
    setUploadProgressText(isRtl ? 'جاري توليد القصة النصية بدقة عالية...' : 'Rendering high-resolution story image...');

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      const grad = TEXT_STORY_GRADIENTS[textGradientIndex] || TEXT_STORY_GRADIENTS[0];

      // Linear Gradient Background
      const gradient = ctx.createLinearGradient(0, 0, 1080, 1920);
      gradient.addColorStop(0, grad.colors[0]);
      gradient.addColorStop(1, grad.colors[1]);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1080, 1920);

      // Vignette shadows top & bottom
      const topVignette = ctx.createLinearGradient(0, 0, 0, 360);
      topVignette.addColorStop(0, 'rgba(0,0,0,0.45)');
      topVignette.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = topVignette;
      ctx.fillRect(0, 0, 1080, 360);

      const botVignette = ctx.createLinearGradient(0, 1560, 0, 1920);
      botVignette.addColorStop(0, 'rgba(0,0,0,0)');
      botVignette.addColorStop(1, 'rgba(0,0,0,0.5)');
      ctx.fillStyle = botVignette;
      ctx.fillRect(0, 1560, 1080, 360);

      // Header on canvas
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.font = 'bold 38px sans-serif';
      ctx.textAlign = 'center';
      const authorName = user?.name || (isRtl ? 'مستخدم بيربليكستا' : 'User');
      ctx.fillText(authorName, 540, 160);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '24px sans-serif';
      ctx.fillText(isRtl ? 'قصة نصية • تختفي تلقائياً بعد 24 ساعة' : 'Text Story • Disappears after 24h', 540, 210);

      // Body text measurement & wrapping
      const fontSize = textFontSize === 'huge' ? 66 : textFontSize === 'large' ? 50 : 38;
      const lineHeight = fontSize * 1.5;
      ctx.font = `bold ${fontSize}px Tajawal, Cairo, sans-serif`;
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 4;

      const maxWidth = 880;
      const paragraphs = textContent.trim().split('\n');
      const lines: string[] = [];

      for (const paragraph of paragraphs) {
        const words = paragraph.split(/\s+/);
        let pLine = '';
        for (const word of words) {
          if (!word) continue;
          const testLine = pLine ? `${pLine} ${word}` : word;
          const testWidth = ctx.measureText(testLine).width;
          if (testWidth > maxWidth && pLine) {
            lines.push(pLine);
            pLine = word;
          } else {
            pLine = testLine;
          }
        }
        if (pLine) lines.push(pLine);
      }

      const totalHeight = lines.length * lineHeight;
      let startY = (1920 - totalHeight) / 2 + fontSize * 0.8;

      let textX = 540;
      if (textAlign === 'right') {
        textX = 960;
        ctx.textAlign = 'right';
      } else if (textAlign === 'left') {
        textX = 120;
        ctx.textAlign = 'left';
      } else {
        ctx.textAlign = 'center';
      }

      for (const line of lines) {
        ctx.fillText(line, textX, startY);
        startY += lineHeight;
      }

      // Convert to blob
      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('Canvas blob generation failed'));
        }, 'image/jpeg', 0.92);
      });

      setUploadProgressText(isRtl ? 'جاري رفع القصة النصية...' : 'Uploading story image...');

      const authToken = token || secureStorage.getSync('app_token') || '';
      const file = new File([blob], `text_story_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('/api/files/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
        body: formData
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || (!uploadData.url && !uploadData.file_url && !uploadData.file?.url)) {
        throw new Error(uploadData.error || (isRtl ? 'فشل رفع القصة النصية' : 'Story upload failed'));
      }

      const imageUrl = uploadData.url || uploadData.file_url || uploadData.file?.url;

      setUploadProgressText(isRtl ? 'جاري نشر القصة (صلاحية 24 ساعة)...' : 'Publishing story (24h)...');
      const res = await fetch('/api/bulletin/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          title: textContent.slice(0, 40),
          description: textContent,
          image_url: imageUrl,
          page_id: null
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create story');
      }

      toast.success(isRtl ? 'تم نشر القصة النصية بنجاح لمدة 24 ساعة!' : 'Text story published for 24 hours!');
      if (onStoryCreated) onStoryCreated(data.story || data);
      onClose();
    } catch (err: any) {
      console.error('Error publishing text story:', err);
      toast.error(err.message || (isRtl ? 'تعذر نشر القصة' : 'Failed to publish text story'));
    } finally {
      setIsUploading(false);
    }
  };

  // Safe duration display formatting
  const formatTime = (secs: number) => {
    const s = Math.floor(secs % 60);
    return `${s < 10 ? '0' : ''}${s}`;
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-[var(--surface-overlay)] backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            className="relative w-full max-w-sm md:max-w-[440px] bg-[var(--surface-card)] border border-[var(--border-default)] rounded-[var(--radius-lg)] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] font-sans"
          >
          {/* Main Title Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border-default)] bg-[var(--surface-subtle)]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-[var(--radius-xs)] bg-[var(--bg-accent-muted)] text-[var(--fg-accent)] flex items-center justify-center font-bold">
                <Sparkles size={15} className="animate-pulse" />
              </div>
              <div>
                <h2 className="text-xs md:text-sm font-extrabold text-[var(--text-primary)]">
                  {isRtl ? 'إنشاء قصة' : 'Create Story'}
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={isUploading}
              aria-label="Close"
              className="w-8 h-8 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-[var(--radius-xs)] hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Creation Tab Switcher: Photos/Video vs Text Story */}
          <div className="flex items-center gap-1 p-1 mx-4 mt-3 bg-[var(--surface-subtle)] border border-[var(--border-default)] rounded-[var(--radius-sm)]">
            <button
              type="button"
              onClick={() => {
                if (isUploading) return;
                setCreationTab('media');
              }}
              className={`flex-1 py-1.5 px-3 rounded-[var(--radius-xs)] text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                creationTab === 'media'
                  ? 'bg-[var(--surface-card)] text-accent shadow-2xs border border-accent/25'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-transparent'
              }`}
            >
              <ImageIcon size={13} />
              <span>{isRtl ? 'صور وفيديو' : 'Photos & Video'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (isUploading) return;
                setCreationTab('text');
              }}
              className={`flex-1 py-1.5 px-3 rounded-[var(--radius-xs)] text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                creationTab === 'text'
                  ? 'bg-[var(--surface-card)] text-emerald-500 shadow-2xs border border-emerald-500/25'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-transparent'
              }`}
            >
              <Type size={13} />
              <span>{isRtl ? 'قصة نصية' : 'Text Story'}</span>
            </button>
          </div>

          {/* Loader Overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-[var(--surface-overlay)] z-[80] flex flex-col items-center justify-center gap-3 text-center p-6 backdrop-blur-sm">
              <div className="relative">
                <Loader2 size={36} className="animate-spin text-[var(--fg-accent)]" />
                <Sparkle size={14} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[var(--fg-accent)]" />
              </div>
              <div className="space-y-1">
                <p className="text-white text-xs font-extrabold">{isRtl ? 'جاري معالجة ونشر القصة...' : 'Processing story...'}</p>
                <p className="text-[10px] text-white/70 max-w-sm">{uploadProgressText}</p>
              </div>
            </div>
          )}

          {/* Dialog Contents */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {creationTab === 'text' ? (
              /* Text Story Creation Playground */
              <div className="flex flex-col gap-4 items-stretch">
                {/* 1. Interactive 9:16 Vertical Preview */}
                <div className="flex justify-center">
                  <div
                    className={`relative w-48 h-80 sm:w-56 sm:h-96 rounded-2xl overflow-hidden shadow-xl border border-white/20 flex flex-col justify-between p-3.5 bg-gradient-to-br ${
                      TEXT_STORY_GRADIENTS[textGradientIndex]?.bgClass || 'from-rose-500 to-orange-400'
                    } text-white select-none transition-all duration-300`}
                  >
                    {/* Header */}
                    <div className="flex items-center gap-2 z-10">
                      <img
                        src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                        alt="Avatar"
                        className="w-7 h-7 rounded-full border border-white/40 object-cover shadow-sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold truncate leading-tight">
                          {user?.name || (isRtl ? 'أنا' : 'Me')}
                        </p>
                        <span className="text-[8px] text-white/80 flex items-center gap-0.5">
                          <Clock size={8} />
                          {isRtl ? 'تستمر 24 ساعة' : '24h Story'}
                        </span>
                      </div>
                    </div>

                    {/* Middle: Live Text Content */}
                    <div className="my-auto px-2 py-4 max-h-[70%] overflow-y-auto scrollbar-none z-10">
                      <p
                        className={`font-extrabold break-words text-white drop-shadow-md leading-relaxed ${
                          textFontSize === 'huge' ? 'text-lg sm:text-xl' : textFontSize === 'large' ? 'text-base sm:text-lg' : 'text-sm'
                        } ${
                          textAlign === 'right' ? 'text-right' : textAlign === 'left' ? 'text-left' : 'text-center'
                        }`}
                      >
                        {textContent.trim() || (isRtl ? 'اكتب ما يدور في ذهنك...' : 'Type what\'s on your mind...')}
                      </p>
                    </div>

                    {/* Footer note */}
                    <div className="text-center z-10">
                      <span className="text-[8.5px] text-white/70 font-semibold bg-black/20 px-2 py-0.5 rounded-full backdrop-blur-xs">
                        {isRtl ? 'قصة نصية ملونة' : 'Text Story'}
                      </span>
                    </div>

                    {/* Ambient subtle vignette */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/25 pointer-events-none" />
                  </div>
                </div>

                {/* 2. Text Story Editor Controls */}
                <div className="space-y-3 bg-[var(--surface-subtle)] p-3 rounded-[var(--radius-md)] border border-[var(--border-default)]">
                  {/* Text Input */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[var(--text-primary)] flex items-center justify-between">
                      <span>{isRtl ? 'نص القصة:' : 'Story Text:'}</span>
                      <span className="text-[9px] text-[var(--text-muted)] font-mono">{textContent.length}/280</span>
                    </label>
                    <textarea
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value.slice(0, 280))}
                      rows={3}
                      placeholder={isRtl ? 'اكتب قصتك هنا... شارك فكرة، حكمة، أو خبراً سريعاً' : 'Type your story here...'}
                      className="w-full text-xs p-2.5 rounded-[var(--radius-xs)] bg-[var(--surface-card)] border border-[var(--border-default)] focus:border-accent outline-none text-[var(--text-primary)] resize-none"
                    />
                  </div>

                  {/* Gradient Background Selector */}
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-bold text-[var(--text-primary)] flex items-center gap-1">
                      <Palette size={12} className="text-accent" />
                      <span>{isRtl ? 'لون الخلفية والتدرج:' : 'Background Gradient:'}</span>
                    </label>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {TEXT_STORY_GRADIENTS.map((g, gIdx) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setTextGradientIndex(gIdx)}
                          className={`w-7 h-7 rounded-full bg-gradient-to-br ${g.bgClass} shrink-0 transition-transform cursor-pointer flex items-center justify-center shadow-xs ${
                            textGradientIndex === gIdx ? 'scale-115 ring-2 ring-accent ring-offset-1 ring-offset-[var(--surface-card)]' : 'hover:scale-105'
                          }`}
                          title={isRtl ? g.nameAr : g.nameEn}
                        >
                          {textGradientIndex === gIdx && <Check size={12} className="text-white stroke-[3]" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Alignment & Font Size Controls */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[var(--border-default)]">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[var(--text-muted)] block">{isRtl ? 'المحاذاة:' : 'Align:'}</span>
                      <div className="flex items-center gap-1 bg-[var(--surface-card)] p-0.5 rounded-[var(--radius-xs)] border border-[var(--border-default)]">
                        <button
                          type="button"
                          onClick={() => setTextAlign('right')}
                          className={`flex-1 py-1 flex items-center justify-center rounded-xs transition-colors cursor-pointer ${
                            textAlign === 'right' ? 'bg-accent text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          <AlignRight size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setTextAlign('center')}
                          className={`flex-1 py-1 flex items-center justify-center rounded-xs transition-colors cursor-pointer ${
                            textAlign === 'center' ? 'bg-accent text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          <AlignCenter size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setTextAlign('left')}
                          className={`flex-1 py-1 flex items-center justify-center rounded-xs transition-colors cursor-pointer ${
                            textAlign === 'left' ? 'bg-accent text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          <AlignLeft size={12} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[var(--text-muted)] block">{isRtl ? 'حجم الخط:' : 'Size:'}</span>
                      <div className="flex items-center gap-1 bg-[var(--surface-card)] p-0.5 rounded-[var(--radius-xs)] border border-[var(--border-default)]">
                        <button
                          type="button"
                          onClick={() => setTextFontSize('normal')}
                          className={`flex-1 py-1 text-[10px] font-bold rounded-xs transition-colors cursor-pointer ${
                            textFontSize === 'normal' ? 'bg-accent text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          {isRtl ? 'عادي' : 'S'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setTextFontSize('large')}
                          className={`flex-1 py-1 text-[10px] font-bold rounded-xs transition-colors cursor-pointer ${
                            textFontSize === 'large' ? 'bg-accent text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          {isRtl ? 'كبير' : 'M'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setTextFontSize('huge')}
                          className={`flex-1 py-1 text-[10px] font-bold rounded-xs transition-colors cursor-pointer ${
                            textFontSize === 'huge' ? 'bg-accent text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          {isRtl ? 'ضخم' : 'L'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : !selectedFile ? (
              /* Drag & Drop Upload Portal */
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsStoryDragging(true); }}
                onDragLeave={() => setIsStoryDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsStoryDragging(false);
                  const files = e.dataTransfer.files ? Array.from(e.dataTransfer.files) : [];
                  if (files.length > 0) handleFilesSelected(files);
                }}
                className={`border-2 border-dashed rounded-[var(--radius-md)] p-6 sm:p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all bg-[var(--surface-subtle)] group text-center select-none ${
                  isStoryDragging
                    ? 'border-accent bg-accent/10 scale-[1.01]'
                    : 'border-[var(--border-default)] hover:border-[var(--border-accent)]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                     const files = e.target.files ? Array.from(e.target.files) : [];
                     if (files.length > 0) handleFilesSelected(files);
                  }}
                />

                <div className="w-14 h-14 rounded-[var(--radius-md)] bg-[var(--bg-accent-muted)] text-[var(--fg-accent)] flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                  <Upload size={28} className="group-hover:translate-y-[-2px] transition-transform" />
                </div>

                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-extrabold text-[var(--text-primary)]">
                    {isRtl ? 'اسحب الملفات هنا أو انقر للتصفح' : 'Drag & Drop files here or click to browse'}
                  </p>
                  <p className="text-[10px] sm:text-xs text-[var(--text-secondary)] max-w-md mx-auto">
                    {isRtl 
                      ? 'يمكنك اختيار حتى 10 صور ليتم تقسيمها تلقائياً إلى قصص ممتالية، أو اختيار مقطع فيديو واحد ليتم تشغيله وقصه ذكياً'
                      : 'Upload up to 10 photos to split them automatically into separate stories, or choose a video clip to trim'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[var(--radius-xs)] bg-[var(--bg-accent-muted)] text-[var(--fg-accent)] text-[10.5px] font-bold border border-[var(--border-accent)]/20">
                    <ImageIcon size={12} />
                    {isRtl ? 'رفع حتى 10 صور' : 'Up to 10 Images'}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[var(--radius-xs)] bg-[var(--surface-card)] text-[var(--text-primary)] text-[10.5px] font-bold border border-[var(--border-default)]">
                    <VideoIcon size={12} />
                    {isRtl ? 'فيديو (حتى 30 ثانية)' : 'Video (Up to 30s)'}
                  </span>
                </div>
              </div>
            ) : (
              /* Design Studio Playground */
              <div className="flex flex-col gap-4 items-stretch">
                
                {/* 1. Immersive 9:16 Vertical Story Live Preview */}
                <div className="flex flex-col gap-2">
                  <div className="relative w-36 sm:w-40 mx-auto aspect-[9/16] bg-black rounded-[var(--radius-md)] overflow-hidden shadow-2xl border border-[var(--border-default)] flex items-center justify-center group">
                    
                    {/* Video Player Render */}
                    {isVideo ? (
                      <video
                        ref={videoRef}
                        src={mediaPreviewUrl}
                        autoPlay
                        loop
                        muted={isMuted}
                        playsInline
                        onTimeUpdate={() => {
                          if (videoRef.current) {
                            const cur = videoRef.current.currentTime;
                            setCurrentTime(cur);
                            if (cur > startTimeOffset + 30) {
                              videoRef.current.currentTime = startTimeOffset;
                            } else if (cur < startTimeOffset) {
                              videoRef.current.currentTime = startTimeOffset;
                            }
                          }
                        }}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      /* Image Render with Live Filter CSS Classes applied */
                      <img
                        src={mediaPreviewUrl}
                        alt="Preview"
                        className={`w-full h-full object-cover transition-all duration-300 ${
                          EFFECTS.find(e => e.id === (imageStories[activeImageIndex]?.effect || 'none'))?.class || ''
                        }`}
                      />
                    )}

                    {/* Gradient Top & Bottom Bars */}
                    <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/85 via-black/35 to-transparent pointer-events-none" />
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />

                    {/* Header Overlay (User metadata + Expiration) */}
                    <div className="absolute top-3 inset-x-3 flex items-center justify-between text-white z-15">
                      <div className="flex items-center gap-2">
                        <img
                          src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                          alt="Avatar"
                          className="w-7 h-7 rounded-[var(--radius-xs)] border border-white/20 object-cover"
                        />
                        <div>
                          <p className="text-[10px] font-extrabold leading-tight">
                            {user?.name || (isRtl ? 'مستكشف المنصة' : 'User')}
                          </p>
                          <span className="inline-flex items-center gap-0.5 text-[8px] text-white/70">
                            <Clock size={8} />
                            {isRtl ? 'تختفي بعد 24 ساعة' : 'Expires in 24h'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedFile(null);
                          setMediaPreviewUrl('');
                          setImageStories([]);
                          stopAudioPreview();
                        }}
                        className="px-2.5 py-1 rounded-[var(--radius-xs)] bg-black/60 hover:bg-black/80 text-white text-[10px] font-bold border border-white/10 backdrop-blur-md transition-all cursor-pointer"
                      >
                        {isRtl ? 'تغيير' : 'Change'}
                      </button>
                    </div>

                    {/* Active Audio Indicator Notes for Image */}
                    {!isVideo && activeMusicTrack !== 'none' && isMusicPlaying && (
                      <div className="absolute top-14 right-3 flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded text-[var(--fg-accent)] text-[8px] font-bold backdrop-blur-md border border-white/10">
                        <Music size={8} className="animate-bounce" />
                        <span>{MUSIC_TRACKS.find(m => m.id === activeMusicTrack)?.labelAr}</span>
                      </div>
                    )}

                    {/* Controls Overlay (Mute, Play/Pause) */}
                    <div className="absolute bottom-3 inset-x-3 flex items-center justify-between z-15 text-white">
                      
                      {/* Media Playback Controls */}
                      <div className="flex items-center gap-1">
                        {isVideo && (
                          <button
                            onClick={() => {
                              if (videoRef.current) {
                                if (isPlaying) {
                                  videoRef.current.pause();
                                } else {
                                  videoRef.current.play().catch(console.error);
                                }
                                setIsPlaying(!isPlaying);
                              }
                            }}
                            className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border border-white/10 transition-colors cursor-pointer"
                          >
                            {isPlaying ? <Pause size={10} /> : <Play size={10} />}
                          </button>
                        )}

                        {/* Mute/Unmute sound track */}
                        <button
                          onClick={toggleMusicMute}
                          className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border border-white/10 transition-colors cursor-pointer"
                        >
                          {isMuted ? <VolumeX size={10} className="text-[var(--fg-danger)]" /> : <Volume2 size={10} className="text-[var(--fg-accent)]" />}
                        </button>
                      </div>

                      {/* Video Clip Duration Badge / Track Duration */}
                      <div className="px-2 py-0.5 rounded-[var(--radius-xs)] bg-black/60 border border-white/10 backdrop-blur-md text-[9px] font-bold flex items-center gap-1">
                        <Clock size={10} className="text-[var(--fg-accent)]" />
                        <span>
                          {isVideo 
                            ? `00:${formatTime(currentTime)} / 00:30`
                            : `${imageStories[activeImageIndex]?.duration || 15}s`
                          }
                        </span>
                      </div>
                    </div>

                    {/* Multi-photo pagination badge */}
                    {imageStories.length > 1 && (
                      <div className="absolute top-14 left-3 bg-black/65 px-2 py-0.5 rounded border border-white/10 text-[8px] font-bold text-white backdrop-blur-md">
                        {isRtl ? 'القصة' : 'Story'} {activeImageIndex + 1} / {imageStories.length}
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Controls Board (Effects, Music, Trimming, Multi-image layout) */}
                <div className="space-y-4">
                  
                  {/* Grid layout for Multiple Photos Selection if active */}
                  {imageStories.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-[var(--text-secondary)] block uppercase tracking-wider">
                        {isRtl ? `الصور المختارة (${imageStories.length} من 10)` : `Selected Images (${imageStories.length} of 10)`}
                      </span>
                      
                      <div className="flex flex-wrap items-center gap-1 bg-[var(--surface-subtle)] p-2 rounded-[var(--radius-sm)] border border-[var(--border-default)] max-h-[110px] overflow-y-auto">
                        {imageStories.map((item, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setActiveImageIndex(idx);
                              setMediaPreviewUrl(item.previewUrl);
                            }}
                            className={`relative w-10 h-14 rounded-[var(--radius-xs)] overflow-hidden border-2 cursor-pointer transition-all shrink-0 ${
                              activeImageIndex === idx ? 'border-[var(--border-accent)] scale-105 shadow-md' : 'border-[var(--border-default)] hover:opacity-80'
                            }`}
                          >
                            <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeImageFromStories(idx);
                              }}
                              className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-[var(--fg-danger)] text-white shadow cursor-pointer"
                            >
                              <X size={8} />
                            </button>
                            
                            {(item.effect !== 'none' || item.music !== 'none') && (
                              <div className="absolute bottom-0.5 inset-x-0 flex justify-center gap-0.5 bg-black/40 py-0.5">
                                {item.effect !== 'none' && <Sparkles size={6} className="text-[var(--fg-accent)]" />}
                                {item.music !== 'none' && <Music size={6} className="text-[var(--fg-accent)]" />}
                              </div>
                            )}
                          </div>
                        ))}

                        {imageStories.length < 10 && (
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-10 h-14 rounded-[var(--radius-xs)] border border-dashed border-[var(--border-default)] flex flex-col items-center justify-center text-[var(--text-muted)] hover:border-[var(--border-accent)] hover:text-[var(--fg-accent)] transition-colors shrink-0 cursor-pointer"
                          >
                            <Upload size={12} />
                            <span className="text-[8px] font-bold mt-0.5">{isRtl ? 'إضافة' : 'Add'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* VIDEO TRIMMER CARD & CHOOSE RECOMMENDED COVER */}
                  {isVideo && (
                    <div className="space-y-3">
                      {videoDuration > 30.5 && (
                        <div className="bg-[var(--surface-subtle)] p-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-[var(--text-primary)] flex items-center gap-1">
                              <Scissors size={12} className="text-[var(--fg-accent)]" />
                              {isRtl ? 'قص ذكي للمقطع (30 ثانية):' : 'Crop segment loop (30s):'}
                            </span>
                            <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded bg-[var(--bg-accent-muted)] text-[var(--fg-accent)] font-mono">
                              {isRtl ? 'يبدأ من:' : 'Starts at:'} {formatTime(startTimeOffset)}s
                            </span>
                          </div>

                          <div className="space-y-1">
                            <input
                              type="range"
                              min="0"
                              max={Math.max(0, videoDuration - 30)}
                              step="0.5"
                              value={startTimeOffset}
                              onChange={(e) => {
                                const offset = parseFloat(e.target.value);
                                setStartTimeOffset(offset);
                                if (videoRef.current) {
                                  videoRef.current.currentTime = offset;
                                }
                              }}
                              className="w-full accent-[var(--accent)] h-1 bg-[var(--surface-inset)] rounded-lg cursor-pointer"
                            />
                            <div className="flex items-center justify-between text-[8px] text-[var(--text-muted)]">
                              <span>00:00</span>
                              <span>{isRtl ? 'نهاية المقطع:' : 'Video End:'} {formatTime(videoDuration)}s</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Cover selection panel */}
                      <div className="bg-[var(--surface-subtle)] p-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider">
                            {isRtl ? 'توصيات المقطع' : 'Clip Recommendations'}
                          </span>
                          <button
                            type="button"
                            onClick={() => customCoverInputRef.current?.click()}
                            className="flex items-center gap-1 px-2 py-1 rounded-[var(--radius-xs)] bg-[var(--bg-accent-muted)] hover:opacity-85 text-[var(--fg-accent)] text-[9px] font-bold border border-[var(--border-accent)]/25 transition-colors cursor-pointer"
                          >
                            <Upload size={9} />
                            <span>{isRtl ? 'رفع صورة غلاف' : 'Upload cover'}</span>
                          </button>
                          <input
                            ref={customCoverInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleCustomCoverUpload}
                            className="hidden"
                          />
                        </div>
                        
                        {isGeneratingCovers ? (
                          <div className="flex items-center gap-1 justify-center py-3 text-[10px] text-[var(--text-muted)]">
                            <Loader2 size={12} className="animate-spin text-[var(--fg-accent)]" />
                            <span>{isRtl ? 'جاري استخراج صور غلاف ممتازة...' : 'Generating cover previews...'}</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-4 gap-1">
                            {recommendedCovers.map((thumb, idx) => (
                              <div
                                key={idx}
                                onClick={() => setSelectedCoverIndex(idx)}
                                className={`relative aspect-[9/16] rounded-[var(--radius-xs)] overflow-hidden border-2 cursor-pointer transition-all hover:opacity-90 ${
                                  selectedCoverIndex === idx ? 'border-[var(--border-accent)] scale-[1.03] shadow-md' : 'border-[var(--border-default)]'
                                }`}
                              >
                                <img src={thumb} alt="" className="w-full h-full object-cover" />
                                {selectedCoverIndex === idx && (
                                  <div className="absolute inset-0 bg-[var(--bg-accent-muted)] flex items-center justify-center text-[var(--fg-accent)]">
                                    <Check size={12} className="bg-[var(--bg-accent-emphasis)] text-[var(--fg-on-emphasis)] rounded-full p-0.5" />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* PHOTO DESIGN PANEL (EFFECTS & MUSIC TRACKS & STORY DURATION) */}
                  {!isVideo && (
                    <div className="space-y-3">
                      
                      {/* Effect selector panel */}
                      <div className="bg-[var(--surface-subtle)] p-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] space-y-2">
                        <span className="text-[11px] font-bold text-[var(--text-primary)] block">
                          {isRtl ? 'إضافة تأثير فلتر سينمائي للقصة:' : 'Apply creative photo filter effect:'}
                        </span>
                        
                        <div className="grid grid-cols-3 gap-1">
                          {EFFECTS.map((eff) => (
                            <button
                              key={eff.id}
                              type="button"
                              onClick={() => updateActiveImageSettings('effect', eff.id)}
                              className={`flex items-center gap-1 px-2 py-1.5 rounded-[var(--radius-xs)] text-[10px] font-semibold transition-colors border text-center justify-center cursor-pointer ${
                                imageStories[activeImageIndex]?.effect === eff.id
                                  ? 'bg-[var(--bg-accent-muted)] border-[var(--border-accent)] text-[var(--fg-accent)] font-bold'
                                  : 'bg-[var(--surface-card)] border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'
                              }`}
                            >
                              <Sparkles size={9} className={imageStories[activeImageIndex]?.effect === eff.id ? 'text-[var(--fg-accent)]' : 'text-[var(--text-muted)]'} />
                              <span>{isRtl ? eff.labelAr : eff.labelEn}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Music selector panel */}
                      <div className="bg-[var(--surface-subtle)] p-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[var(--text-primary)] flex items-center gap-1">
                            <Music size={11} className="text-[var(--fg-accent)]" />
                            {isRtl ? 'إضافة موسيقى خلفية للمشهد:' : 'Attach background audio track:'}
                          </span>
                          {imageStories[activeImageIndex]?.music !== 'none' && (
                            <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-[var(--bg-accent-muted)] text-[var(--fg-accent)] animate-pulse">
                              {isRtl ? 'تسمع الآن' : 'Playing vibe'}
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                          {MUSIC_TRACKS.map((track) => (
                            <button
                              key={track.id}
                              type="button"
                              onClick={() => updateActiveImageSettings('music', track.id)}
                              className={`flex items-center gap-1 px-2 py-1.5 rounded-[var(--radius-xs)] text-[10px] font-semibold transition-colors border text-start justify-start cursor-pointer ${
                                imageStories[activeImageIndex]?.music === track.id
                                  ? 'bg-[var(--bg-accent-muted)] border-[var(--border-accent)] text-[var(--fg-accent)] font-bold'
                                  : 'bg-[var(--surface-card)] border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'
                              }`}
                            >
                              <Music size={9} className={imageStories[activeImageIndex]?.music === track.id ? 'text-[var(--fg-accent)]' : 'text-[var(--text-muted)]'} />
                              <span className="truncate">{isRtl ? track.labelAr : track.labelEn}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Duration slider panel */}
                      <div className="bg-[var(--surface-subtle)] p-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[var(--text-primary)] flex items-center gap-1">
                            <Clock size={11} className="text-[var(--fg-accent)]" />
                            {isRtl ? 'مدة عرض هذه القصة:' : 'Story playback duration:'}
                          </span>
                          <span className="text-[10px] font-bold text-[var(--fg-accent)] bg-[var(--bg-accent-muted)] px-2 py-0.5 rounded-[var(--radius-xs)]">
                            {imageStories[activeImageIndex]?.duration || 15} {isRtl ? 'ثانية' : 'seconds'}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <input
                            type="range"
                            min="5"
                            max="15"
                            step="1"
                            value={imageStories[activeImageIndex]?.duration || 15}
                            onChange={(e) => updateActiveImageSettings('duration', parseInt(e.target.value))}
                            className="w-full accent-[var(--accent)] h-1 bg-[var(--surface-inset)] rounded-lg cursor-pointer"
                          />
                          <div className="flex items-center justify-between text-[8px] text-[var(--text-muted)]">
                            <span>5s</span>
                            <span>15s ({isRtl ? 'أقصى مدة' : 'Maximum'})</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Action Bar */}
          <div className="px-4 py-2.5 border-t border-[var(--border-default)] bg-[var(--surface-subtle)] flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              disabled={isUploading}
              className="px-3 py-1.5 rounded-[var(--radius-xs)] bg-[var(--surface-card)] border border-[var(--border-default)] hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] text-[10.5px] font-bold transition-colors cursor-pointer"
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </button>

            {creationTab === 'text' ? (
              <button
                onClick={handlePublishTextStory}
                disabled={!textContent.trim() || isUploading}
                className="flex-1 max-w-[200px] flex items-center justify-center gap-1 px-3.5 py-1.5 rounded-[var(--radius-xs)] bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[10.5px] font-bold shadow-sm transition-opacity border border-emerald-500 cursor-pointer"
              >
                <Send size={12} />
                <span>{isRtl ? 'نشر القصة النصية (24 ساعة)' : 'Publish Text Story (24h)'}</span>
              </button>
            ) : (
              <button
                onClick={handlePublish}
                disabled={(!selectedFile && imageStories.length === 0) || isUploading}
                className="flex-1 max-w-[190px] flex items-center justify-center gap-1 px-3.5 py-1.5 rounded-[var(--radius-xs)] bg-[var(--bg-accent-emphasis)] hover:opacity-90 disabled:opacity-50 text-[var(--fg-on-emphasis)] text-[10.5px] font-bold shadow-sm transition-opacity border border-[var(--border-accent)] cursor-pointer"
              >
                <Send size={12} />
                <span>
                  {imageStories.length > 1 
                    ? (isRtl ? `نشر عدد (${imageStories.length}) قصص الآن` : `Publish (${imageStories.length}) stories`)
                    : (isRtl ? 'مشاركة القصة الآن' : 'Share Story Now')
                  }
                </span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
export default StoryUploadModal;
