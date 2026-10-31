import React, { useRef, useEffect } from 'react';
import { StudioViewportDevice } from './StudioPreviewToolbar';
import { Loader2, AlertCircle, Wand2, RotateCcw, MousePointer } from 'lucide-react';
import type { StudioEditTarget } from './types';

interface StudioPreviewPanelProps {
  iframeSrcDoc: string;
  viewportDevice: StudioViewportDevice;
  isInspectMode: boolean;
  onInspectElementCaptured?: (elementInfo: StudioEditTarget) => void;
  isLoading?: boolean;
  isUpdating?: boolean;
  errorMsg?: string | null;
  onAutoFixError?: (err: string) => void;
  onReload?: () => void;
  language?: 'ar' | 'en';
}

export const StudioPreviewPanel: React.FC<StudioPreviewPanelProps> = ({
  iframeSrcDoc,
  viewportDevice,
  isInspectMode,
  onInspectElementCaptured,
  isLoading = false,
  isUpdating = false,
  errorMsg,
  onAutoFixError,
  onReload,
  language = 'ar'
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isAr = language === 'ar';

  const getDeviceFrameClasses = () => {
    switch (viewportDevice) {
      case 'mobile':
        return 'w-[375px] h-[680px] max-h-[92%] shadow-2xl rounded-[28px] border-[6px] border-slate-800 overflow-hidden';
      case 'tablet':
        return 'w-[768px] h-[900px] max-h-[94%] shadow-2xl rounded-[20px] border-[6px] border-slate-800 overflow-hidden';
      case 'desktop':
      default:
        return 'w-full h-full';
    }
  };

  // Inject visual element picker script when isInspectMode is active
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;

    const handleMessage = (event: MessageEvent) => {
      if (!onInspectElementCaptured) return;
      if (event.data?.type === 'STUDIO_ELEMENT_PICKED' && event.data.payload) {
        onInspectElementCaptured(event.data.payload);
      } else if (event.data?.type === 'INSPECT_ELEMENT_CLICK' && event.data.info) {
        onInspectElementCaptured(event.data.info);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onInspectElementCaptured]);

  // Enhance srcDoc with element inspector bridge when inspect mode is enabled
  const computedSrcDoc = React.useMemo(() => {
    if (!isInspectMode) return iframeSrcDoc;
    const inspectorScript = `
<script>
(function() {
  let highlightEl = null;
  function handleMouseOver(e) {
    e.stopPropagation();
    if (highlightEl && highlightEl !== e.target) {
      highlightEl.style.outline = '';
    }
    highlightEl = e.target;
    highlightEl.style.outline = '2px dashed #f59e0b';
    highlightEl.style.outlineOffset = '-2px';
  }
  function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    const el = e.target;
    if (el) {
      el.style.outline = '';
      window.parent.postMessage({
        type: 'STUDIO_ELEMENT_PICKED',
        payload: {
          tag: el.tagName || 'DIV',
          id: el.id || undefined,
          classes: typeof el.className === 'string' ? el.className : undefined,
          text: (el.innerText || '').trim().slice(0, 80)
        }
      }, '*');
    }
  }
  document.addEventListener('mouseover', handleMouseOver, true);
  document.addEventListener('click', handleClick, true);
})();
</script>`;
    if (iframeSrcDoc.includes('</body>')) {
      return iframeSrcDoc.replace('</body>', `${inspectorScript}</body>`);
    }
    return `${iframeSrcDoc}${inspectorScript}`;
  }, [iframeSrcDoc, isInspectMode]);

  const isFramed = viewportDevice === 'mobile' || viewportDevice === 'tablet';

  return (
    <div
      className={`w-full h-full flex-1 flex flex-col relative overflow-hidden ${
        isFramed
          ? 'bg-[var(--surface-subtle)] items-center justify-center p-4 overflow-auto'
          : 'bg-[var(--surface-page)]'
      }`}
    >
      {/* Updating / Building Live Overlay Badge (Centered as in Builder repo) */}
      {(isLoading || isUpdating) && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/35 backdrop-blur-[2px] pointer-events-none animate-in fade-in duration-150">
          <div className="flex flex-col items-center gap-3 px-6 py-5 rounded-shape-md bg-[#171c24]/95 border border-white/10 text-white shadow-2xl">
            <Loader2 size={24} className="text-blue-400 animate-spin" />
            <span className="text-xs font-semibold tracking-wide text-slate-200">
              {isAr ? 'جاري تطبيق التغييرات...' : 'Applying changes...'}
            </span>
          </div>
        </div>
      )}

      {/* Inspect Mode Floating Banner */}
      {isInspectMode && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3.5 py-1.5 rounded-shape-full bg-amber-500 text-slate-950 font-black text-xs shadow-lg pointer-events-none">
          <MousePointer size={13} />
          <span>
            {isAr
              ? 'انقر على أي عنصر داخل المعاينة لتحديده للتعديل'
              : 'Click any element inside the preview to target it for editing'}
          </span>
        </div>
      )}

      {/* Runtime Error Overlay Banner */}
      {errorMsg && (
        <div className="absolute bottom-4 left-4 right-4 z-30 p-3.5 rounded-shape-md bg-red-950/95 border border-red-500/40 text-red-100 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 backdrop-blur-md">
          <div className="flex items-start gap-2.5 min-w-0">
            <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <div className="text-xs font-bold text-red-300">
                {isAr ? 'خطأ تشغيلي في المعاينة' : 'Preview Runtime Error'}
              </div>
              <p className="text-[11px] font-mono text-red-200/90 truncate max-w-xl mt-0.5">
                {errorMsg}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onReload && (
              <button
                type="button"
                onClick={onReload}
                className="px-2.5 py-1.5 rounded-shape-xs bg-red-900/60 hover:bg-red-900 text-red-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>{isAr ? 'إعادة التحميل' : 'Reload'}</span>
              </button>
            )}
            {onAutoFixError && (
              <button
                type="button"
                onClick={() => onAutoFixError(errorMsg)}
                className="px-3 py-1.5 rounded-shape-xs bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Wand2 size={13} />
                <span>{isAr ? 'إصلاح تلقائي بالذكاء الاصطناعي' : 'Fix with AI'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Device Frame & Sandbox Iframe */}
      {isFramed ? (
        <div className={`transition-all duration-300 ${getDeviceFrameClasses()} relative bg-[var(--surface-page)] shrink-0 shadow-2xl`}>
          <iframe
            ref={iframeRef}
            title="App Studio Live Preview"
            srcDoc={computedSrcDoc}
            style={{ width: '100%', height: '100%', minHeight: '100%', border: 'none', display: 'block' }}
            className="w-full h-full block bg-transparent border-none"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          />
        </div>
      ) : (
        <iframe
          ref={iframeRef}
          title="App Studio Live Preview"
          srcDoc={computedSrcDoc}
          style={{ width: '100%', height: '100%', minHeight: '100%', border: 'none', display: 'block' }}
          className="w-full h-full absolute inset-0 block bg-transparent border-none"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        />
      )}
    </div>
  );
};
