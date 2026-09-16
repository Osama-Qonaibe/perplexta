import { useState, useEffect, useRef, useCallback } from 'react';

export interface ChatWidthObserverState {
  containerRef: React.RefObject<HTMLDivElement | null>;
  width: number;
  isCompact: boolean;
  contentPaddingClass: string;
  contentMaxWidthClass: string;
}

/**
 * Hook to dynamically observe and manage the chat container width and padding
 * when Canvas mode is opened/closed or viewport changes.
 */
export function useChatWidthObserver(isArtifactOpen: boolean): ChatWidthObserverState {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>(0);

  const handleResize = useCallback((entries: ResizeObserverEntry[]) => {
    if (!entries || !entries[0]) return;
    const measuredWidth = Math.round(entries[0].contentRect.width);
    if (measuredWidth > 0) {
      window.requestAnimationFrame(() => {
        setWidth(measuredWidth);
      });
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Initial measurement
    const rect = el.getBoundingClientRect();
    if (rect.width > 0) {
      setWidth(Math.round(rect.width));
    }

    const observer = new ResizeObserver(handleResize);
    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [handleResize, isArtifactOpen]);

  const isCompact = isArtifactOpen || (width > 0 && width < 600);

  const contentPaddingClass = isCompact ? 'px-3 sm:px-4' : 'px-4 sm:px-6';
  const contentMaxWidthClass = isCompact ? 'w-full max-w-full' : 'max-w-3xl mx-auto w-full';

  return {
    containerRef,
    width,
    isCompact,
    contentPaddingClass,
    contentMaxWidthClass
  };
}
