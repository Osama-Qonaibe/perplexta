import React, { createContext, useContext, useEffect, useState } from 'react';

interface VisualViewportContextType {
  keyboardHeight: number;
  viewportHeight: number;
  isKeyboardOpen: boolean;
}

const VisualViewportContext = createContext<VisualViewportContextType>({
  keyboardHeight: 0,
  viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 800,
  isKeyboardOpen: false,
});

export const VisualViewportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [viewportData, setViewportData] = useState<VisualViewportContextType>({
    keyboardHeight: 0,
    viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 800,
    isKeyboardOpen: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateViewport = () => {
      if (!window.visualViewport) {
        setViewportData({
          keyboardHeight: 0,
          viewportHeight: window.innerHeight,
          isKeyboardOpen: false,
        });
        return;
      }

      const vv = window.visualViewport;
      const rawDiff = window.innerHeight - vv.height;
      const kbHeight = Math.max(0, rawDiff);
      const isOpen = kbHeight > 100;

      document.documentElement.style.setProperty('--kb-height', `${kbHeight}px`);
      document.documentElement.style.setProperty('--vv-height', `${vv.height}px`);

      setViewportData({
        keyboardHeight: kbHeight,
        viewportHeight: vv.height,
        isKeyboardOpen: isOpen,
      });
    };

    updateViewport();

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewport);
      window.visualViewport.addEventListener('scroll', updateViewport);
    }
    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewport);
        window.visualViewport.removeEventListener('scroll', updateViewport);
      }
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
    };
  }, []);

  return (
    <VisualViewportContext.Provider value={viewportData}>
      {children}
    </VisualViewportContext.Provider>
  );
};

export const useVisualViewport = () => useContext(VisualViewportContext);
