import React, { useState, useRef, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { 
  AlertTriangle, 
  RefreshCw, 
  Maximize2, 
  Download, 
  Sparkles,
  Palette
} from 'lucide-react';
import { toast } from '@/design-system';
import { useAppContext } from '../../../../context/AppContext';
import { ArtifactContext } from '../../../../context/ArtifactContext';
import { ASPECT_RATIO_CLASSES } from '../../../../constants/chat';

export const SimpleImageLoadingPlaceholder = ({ dir, aspectRatio = '1:1' }: { dir: 'ltr' | 'rtl'; aspectRatio?: string }) => {
  const containerAspectClass = ASPECT_RATIO_CLASSES[aspectRatio] || ASPECT_RATIO_CLASSES['1:1'];

  // Progressive blur relaxation over time (decreases gradually as image generates)
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setElapsed((Date.now() - startTime) / 1000);
    }, 80);
    return () => clearInterval(interval);
  }, []);

  // Blur starts at a gentle 14px and gradually clarifies down to 1.5px as work progresses
  const currentBlur = Math.max(1.5, 14 - Math.min(12.5, elapsed * 0.85));
  const frostedOpacity = Math.max(0.15, 0.45 - Math.min(0.3, elapsed * 0.025));

  return (
    <div className="w-full flex flex-col my-2 items-start">
      <div 
        className={`relative overflow-hidden rounded-shape-md border border-[var(--border-default)] bg-[var(--surface-subtle)] ${containerAspectClass} w-full flex items-center justify-center`}
      >
        {/* Soft, calm ambient latent luminous gradient */}
        <motion.div
          animate={{
            opacity: [0.25, 0.5, 0.25],
            scale: [1, 1.03, 1],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 bg-gradient-to-br from-accent/10 via-[var(--surface-container-high)] to-accent/5 pointer-events-none"
        />

        {/* Gentle linear sheen sweep */}
        <motion.div
          animate={{
            x: dir === 'rtl' ? ['150%', '-150%'] : ['-150%', '150%']
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent skew-x-12 pointer-events-none z-10"
        />

        {/* Light frosted blur screen whose blur gradually softens & decreases during work without any text or circles */}
        <div 
          className="absolute inset-0 pointer-events-none z-20 transition-[backdrop-filter,opacity] duration-fast ease-out"
          style={{
            backdropFilter: `blur(${currentBlur.toFixed(1)}px)`,
            WebkitBackdropFilter: `blur(${currentBlur.toFixed(1)}px)`,
            backgroundColor: `rgba(255, 255, 255, ${frostedOpacity.toFixed(2)})`
          }}
        />
      </div>
    </div>
  );
};

export const SimpleImageErrorPlaceholder = ({ dir, errorMessage, onRetry, aspectRatio = '1:1' }: { dir: 'ltr' | 'rtl'; errorMessage?: string; onRetry?: () => void; aspectRatio?: string }) => {
  const containerAspectClass = ASPECT_RATIO_CLASSES[aspectRatio] || ASPECT_RATIO_CLASSES['1:1'];

  return (
    <div className="w-full flex flex-col my-3 items-start gap-3">
      <div 
        className={`relative overflow-hidden rounded-shape-md border border-rose-500/30 bg-rose-500/10 ${containerAspectClass} w-full shadow-sm flex flex-col items-center justify-center p-6 text-center`}
      >
        <AlertTriangle className="text-rose-500 mb-3" size={24} />
        <span className="text-xs font-bold text-[var(--text-primary)] mb-1">
          {dir === 'rtl' ? 'تعذر إنشاء الصورة' : 'Synthesis failed'}
        </span>
        <span className="text-[10px] text-rose-500 font-medium break-words max-w-full leading-relaxed px-2">
          {errorMessage || (dir === 'rtl' ? 'خطأ غير معروف.' : 'Unknown generation error.')}
        </span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-shape-sm border border-rose-500/30 bg-[var(--surface-subtle)] text-rose-500 hover:bg-rose-500/20 transition-theme text-[11px] font-black uppercase cursor-pointer"
          >
            <RefreshCw size={12} className="animate-spin-slow" />
            <span>{dir === 'rtl' ? 'إعادة المحاولة' : 'Retry'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

const loadedImageCache = new Set<string>();
loadedImageCache.clear();

export const ShareableImageOutput = ({ src, dir: propDir, alt }: { src?: string; dir?: string; alt?: string; [key: string]: any }) => {
  const { dir: contextDir } = useAppContext();
  const artifactContext = useContext(ArtifactContext);
  const dir = propDir || contextDir || (document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr');
  const rawSrc = src || '';
  const cleanUrl = rawSrc.split('#')[0];
  const aspectMatch = rawSrc.match(/#aspect=([0-9]+:[0-9]+)/);
  const selectedRatio = aspectMatch ? aspectMatch[1] : '1:1';
  const containerAspectClass = ASPECT_RATIO_CLASSES[selectedRatio] || ASPECT_RATIO_CLASSES['1:1'];

  const [isImageFocused, setIsImageFocused] = useState(() => loadedImageCache.has(cleanUrl));
  const [imageError, setImageError] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!cleanUrl) return;

    if (loadedImageCache.has(cleanUrl) || (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0)) {
      setIsImageFocused(true);
      loadedImageCache.add(cleanUrl);
    }

    const timer = setTimeout(() => {
      setIsImageFocused(true);
      if (cleanUrl) loadedImageCache.add(cleanUrl);
    }, 600);

    return () => clearTimeout(timer);
  }, [cleanUrl]);

  const handleEditImage = () => {
    if (!cleanUrl) return;
    if (!artifactContext) {
      toast.error(dir === 'rtl' ? 'محرر الكانفاس غير متوفر حالياً' : 'Canvas editor is not available');
      return;
    }
    
    // Open the image editor in the canvas layout
    artifactContext.setActiveArtifact({
      id: cleanUrl,
      title: dir === 'rtl' ? 'محرر الصور الميكرو' : 'Micro Image Editor',
      type: 'image',
      content: cleanUrl,
      version: 1,
      files: {}
    });
    artifactContext.setIsArtifactOpen(true);
    artifactContext.setActiveTab('preview');
    toast.success(dir === 'rtl' ? 'تم فتح الصورة في محرر ميكرو كانفاس' : 'Image opened in Micro-Canvas Editor');
  };

  const handleDownload = async () => {
    if (!cleanUrl) return;
    try {
      const targetUrl = cleanUrl.startsWith('/') ? `${window.location.origin}${cleanUrl}` : cleanUrl;
      const cleanResponse = await fetch(targetUrl);
      const cleanBlob = await cleanResponse.blob();
      const cleanObjectUrl = window.URL.createObjectURL(cleanBlob);
      const link = document.createElement('a');
      link.href = cleanObjectUrl;
      link.download = `Generated_Image_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(cleanObjectUrl);
      toast.success(dir === 'rtl' ? 'تم تنزيل الصورة بنجاح!' : 'Image downloaded successfully!');
    } catch (err) {
      const link = document.createElement('a');
      link.href = cleanUrl;
      link.download = `Generated_Image_${Date.now()}.png`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="w-full flex flex-col my-2 items-start">
      {/* Image Container */}
      <div 
        className={`relative group overflow-hidden rounded-shape-md border border-[var(--border-default)] bg-[var(--surface-subtle)] ${containerAspectClass} w-full transition-all duration-300 shadow-sm`}
      >
        {!imageError && (
          <img 
            ref={imgRef}
            onLoad={() => {
              setIsImageFocused(true);
              if (cleanUrl) loadedImageCache.add(cleanUrl);
            }}
            onError={() => {
              setIsImageFocused(true);
              setImageError(true);
            }}
            src={cleanUrl}
            alt={alt || "Generated Image"}
            className="block w-full h-full object-cover select-none cursor-pointer"
            onClick={() => setIsPreviewOpen(true)}
            style={{
              filter: isImageFocused ? 'blur(0px)' : 'blur(8px)',
              opacity: isImageFocused ? 1 : 0.6,
              transition: 'filter 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            referrerPolicy="no-referrer"
          />
        )}

        {/* Download, Edit, & Enlarge Buttons */}
        {isImageFocused && !imageError && (
          <div className={`absolute top-2 ${dir === 'rtl' ? 'left-2' : 'right-2'} flex items-center gap-1.5 z-25`}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditImage();
              }}
              className="w-7 h-7 rounded-shape-xs bg-indigo-600 border border-indigo-500 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-md cursor-pointer"
              title={dir === 'rtl' ? 'تعديل وتأثيرات بعد الإنتاج' : 'Edit & Post-Production FX'}
            >
              <Palette size={13} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              className="w-7 h-7 rounded-shape-xs bg-[var(--surface-card)]/80 backdrop-blur-md border border-[var(--border-default)] text-[var(--text-primary)] flex items-center justify-center hover:bg-[var(--surface-subtle)] transition-colors shadow-md cursor-pointer"
              title={dir === 'rtl' ? 'تنزيل' : 'Download'}
            >
              <Download size={13} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsPreviewOpen(true);
              }}
              className="w-7 h-7 rounded-shape-xs bg-[var(--surface-card)]/80 backdrop-blur-md border border-[var(--border-default)] text-[var(--text-primary)] flex items-center justify-center hover:bg-[var(--surface-subtle)] transition-colors shadow-md cursor-pointer"
              title={dir === 'rtl' ? 'تكبير' : 'Enlarge'}
            >
              <Maximize2 size={13} />
            </button>
          </div>
        )}

        {!isImageFocused && !imageError && (
          <div className="absolute inset-0 bg-white/10 backdrop-blur-[6px] pointer-events-none transition-all duration-300" />
        )}

        {imageError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-rose-500/10 p-4 text-center">
            <AlertTriangle className="text-rose-500 mb-2" size={20} />
            <span className="text-[11px] font-bold text-rose-500">
              {dir === 'rtl' ? 'تعذر تحميل الصورة' : 'Failed to load image'}
            </span>
          </div>
        )}
      </div>

      {/* Lightbox Modal (Enlarge view) */}
      {isPreviewOpen && createPortal(
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[999999] flex items-center justify-center p-4"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <img 
              src={cleanUrl} 
              alt={alt || "Enlarged Image"} 
              className="max-w-full max-h-[82vh] object-contain rounded-shape-md shadow-2xl"
              referrerPolicy="no-referrer"
            />
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => {
                  setIsPreviewOpen(false);
                  handleEditImage();
                }}
                className="px-4 py-2 rounded-shape-sm bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-colors cursor-pointer"
              >
                <Palette size={14} />
                <span>{dir === 'rtl' ? 'تعديل الصورة' : 'Edit Image'}</span>
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2 rounded-shape-sm bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)] text-[var(--text-primary)] text-xs font-bold flex items-center gap-2 border border-[var(--border-default)] backdrop-blur-md transition-colors cursor-pointer"
              >
                <Download size={14} />
                <span>{dir === 'rtl' ? 'تنزيل' : 'Download'}</span>
              </button>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] text-[var(--text-primary)] text-xs font-bold transition-colors cursor-pointer"
              >
                {dir === 'rtl' ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
