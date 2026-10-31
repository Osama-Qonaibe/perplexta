import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Sparkles, Folder, Monitor } from 'lucide-react';

interface StudioWorkspaceLayoutProps {
  headerBar?: React.ReactNode;
  iconRail?: React.ReactNode;
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  language?: 'ar' | 'en';
  isChatCollapsed?: boolean;
  onToggleChatCollapsed?: () => void;
  mobileActiveTab?: 'preview' | 'chat' | 'files';
  onChangeMobileTab?: (tab: 'preview' | 'chat' | 'files') => void;
}

export const StudioWorkspaceLayout: React.FC<StudioWorkspaceLayoutProps> = ({
  headerBar,
  iconRail,
  leftPanel,
  rightPanel,
  language = 'ar',
  isChatCollapsed = false,
  mobileActiveTab = 'preview',
  onChangeMobileTab
}) => {
  const isAr = language === 'ar';
  const [leftWidth, setLeftWidth] = useState<number>(360);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(360);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      startXRef.current = e.clientX;
      startWidthRef.current = leftWidth;
    },
    [leftWidth]
  );

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      const delta = isAr ? startXRef.current - e.clientX : e.clientX - startXRef.current;
      const next = Math.min(620, Math.max(280, startWidthRef.current + delta));
      setLeftWidth(next);
    };
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isAr]);

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full bg-[var(--surface-page)] text-[var(--text-primary)] font-sans flex flex-col overflow-hidden">
      {/* Top Studio Header Bar */}
      {headerBar}

      {/* Mobile Viewport Segmented Switcher (< md) */}
      {onChangeMobileTab && (
        <div className="md:hidden flex items-center bg-[var(--surface-card)] border-b border-[var(--border-default)] px-2 py-1.5 shrink-0 justify-around select-none">
          <button
            type="button"
            onClick={() => onChangeMobileTab('chat')}
            className={`flex-1 h-8 px-2 rounded-shape-sm text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mobileActiveTab === 'chat'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'
            }`}
          >
            <Sparkles size={13} />
            <span>{isAr ? 'المساعد' : 'Assistant'}</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeMobileTab('files')}
            className={`flex-1 h-8 px-2 rounded-shape-sm text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mobileActiveTab === 'files'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'
            }`}
          >
            <Folder size={13} />
            <span>{isAr ? 'الملفات' : 'Files'}</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeMobileTab('preview')}
            className={`flex-1 h-8 px-2 rounded-shape-sm text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mobileActiveTab === 'preview'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'
            }`}
          >
            <Monitor size={13} />
            <span>{isAr ? 'المعاينة' : 'Preview'}</span>
          </button>
        </div>
      )}

      {/* Main Split Workspace */}
      <div className="flex-1 flex overflow-hidden bg-[var(--surface-page)] relative">
        {/* Primary Icon Navigation Rail */}
        {iconRail}

        {/* Resizable & Collapsible Contextual Left Panel */}
        <aside
          style={{
            width: isChatCollapsed ? 0 : `${leftWidth}px`
          }}
          className={`bg-[var(--surface-card)] border-e border-[var(--border-default)] flex-col overflow-hidden shrink-0 z-10 text-[var(--text-primary)] transition-[opacity] duration-200 max-md:!w-full ${
            isChatCollapsed ? 'md:!w-0 md:opacity-0 md:border-e-0' : 'md:opacity-100'
          } ${mobileActiveTab !== 'preview' ? 'flex' : 'hidden md:flex'}`}
        >
          {leftPanel}
        </aside>

        {/* Interactive Split Resizer Handle (Desktop Only) */}
        {!isChatCollapsed && (
          <div
            onMouseDown={handleMouseDown}
            onDoubleClick={() => setLeftWidth(360)}
            title={isAr ? 'اسحب لتغيير الحجم (نقر مزدوج لإعادة الضبط)' : 'Drag to resize (Double-click to reset)'}
            className={`hidden md:flex w-1.5 hover:w-1.5 cursor-col-resize items-center justify-center shrink-0 z-20 transition-colors group ${
              isDragging ? 'bg-blue-500' : 'bg-transparent hover:bg-blue-500/50'
            }`}
          >
            <div className="w-0.5 h-8 rounded-full bg-slate-700 group-hover:bg-blue-400 transition-colors" />
          </div>
        )}

        {/* Right Main Canvas Area (Preview / Code / Terminal) */}
        <main
          className={`flex-1 flex flex-col overflow-hidden relative ${
            mobileActiveTab === 'preview' ? 'flex' : 'hidden md:flex'
          }`}
        >
          {rightPanel}
        </main>

        {/* Drag overlay shield so iframe doesn't swallow mousemove while resizing */}
        {isDragging && <div className="fixed inset-0 z-50 cursor-col-resize" />}
      </div>
    </div>
  );
};
