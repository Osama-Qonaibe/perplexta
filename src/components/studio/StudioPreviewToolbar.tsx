import React from 'react';
import {
  Monitor,
  Tablet,
  Smartphone,
  RotateCcw,
  MousePointer,
  ExternalLink,
  Code,
  Eye,
  PanelLeftClose,
  PanelLeftOpen,
  AlertTriangle,
  History,
  Download,
  Globe
} from 'lucide-react';

export type StudioViewportDevice = 'desktop' | 'tablet' | 'mobile';

interface StudioPreviewToolbarProps {
  activeTab: 'preview' | 'code';
  onChangeTab: (tab: 'preview' | 'code') => void;
  viewportDevice: StudioViewportDevice;
  onChangeViewportDevice: (device: StudioViewportDevice) => void;
  onRefreshPreview: () => void;
  isInspectMode: boolean;
  onToggleInspectMode: () => void;
  onPopOutPreview?: () => void;
  onShareClick?: () => void;
  onPublishClick?: () => void;
  // Extended controls matching Builder toolbar
  isChatCollapsed?: boolean;
  onToggleChatCollapsed?: () => void;
  hasUnsavedCode?: boolean;
  issuesCount?: number;
  isIssuesOpen?: boolean;
  onToggleIssues?: () => void;
  versionsCount?: number;
  isVersionsOpen?: boolean;
  onToggleVersions?: () => void;
  onDownloadZip?: () => void;
  isPublished?: boolean;
  language?: 'ar' | 'en';
}

export const StudioPreviewToolbar: React.FC<StudioPreviewToolbarProps> = ({
  activeTab,
  onChangeTab,
  viewportDevice,
  onChangeViewportDevice,
  onRefreshPreview,
  isInspectMode,
  onToggleInspectMode,
  onPopOutPreview,
  onPublishClick,
  isChatCollapsed = false,
  onToggleChatCollapsed,
  hasUnsavedCode = false,
  issuesCount = 0,
  isIssuesOpen = false,
  onToggleIssues,
  versionsCount = 0,
  isVersionsOpen = false,
  onToggleVersions,
  onDownloadZip,
  isPublished = false,
  language = 'ar'
}) => {
  const isAr = language === 'ar';

  return (
    <div className="w-full h-11 bg-[var(--surface-card)] border-b border-[var(--border-default)] px-2.5 flex items-center justify-between gap-2 font-sans shrink-0 overflow-x-auto custom-scrollbar">
      {/* Left Group: Collapse Chat + Preview/Code Switcher */}
      <div className="flex items-center gap-1.5 shrink-0">
        {onToggleChatCollapsed && (
          <button
            type="button"
            onClick={onToggleChatCollapsed}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            title={isChatCollapsed ? (isAr ? 'إظهار المحادثة' : 'Show Chat') : (isAr ? 'طي المحادثة' : 'Collapse Chat')}
          >
            {isChatCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
          </button>
        )}

        <div className="flex items-center gap-0.5 p-0.5 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)]">
          <button
            type="button"
            onClick={() => onChangeTab('preview')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-shape-xs text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Eye size={13} />
            <span>{isAr ? 'المعاينة' : 'Preview'}</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeTab('code')}
            className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-shape-xs text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'code'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Code size={13} />
            <span>{isAr ? 'الكود' : 'Code'}</span>
            {hasUnsavedCode && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title={isAr ? 'تعديلات غير محفوظة' : 'Unsaved changes'} />
            )}
          </button>
        </div>
      </div>

      {/* Center Group: Device Sizes + Reload + Element Picker (visible in Preview mode) */}
      {activeTab === 'preview' && (
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="hidden sm:flex items-center gap-0.5 p-0.5 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)]">
            <button
              type="button"
              onClick={() => onChangeViewportDevice('desktop')}
              className={`p-1.5 rounded-shape-xs transition-colors cursor-pointer ${
                viewportDevice === 'desktop'
                  ? 'bg-[var(--surface-card)] text-blue-500 shadow-2xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              title={isAr ? 'سطح المكتب' : 'Desktop View'}
            >
              <Monitor size={14} />
            </button>
            <button
              type="button"
              onClick={() => onChangeViewportDevice('tablet')}
              className={`p-1.5 rounded-shape-xs transition-colors cursor-pointer ${
                viewportDevice === 'tablet'
                  ? 'bg-[var(--surface-card)] text-blue-500 shadow-2xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              title={isAr ? 'جهاز لوحي' : 'Tablet View'}
            >
              <Tablet size={14} />
            </button>
            <button
              type="button"
              onClick={() => onChangeViewportDevice('mobile')}
              className={`p-1.5 rounded-shape-xs transition-colors cursor-pointer ${
                viewportDevice === 'mobile'
                  ? 'bg-[var(--surface-card)] text-blue-500 shadow-2xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              title={isAr ? 'هاتف محمول' : 'Mobile View'}
            >
              <Smartphone size={14} />
            </button>
          </div>

          {/* Inspect Element Toggle */}
          <button
            type="button"
            onClick={onToggleInspectMode}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-shape-xs border text-xs font-bold transition-all cursor-pointer ${
              isInspectMode
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-500'
                : 'bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title={isAr ? 'تحديد عنصر من المعاينة لتعديله بالذكاء الاصطناعي' : 'Pick an element from preview to target edits'}
          >
            <MousePointer size={13} />
            <span className="hidden md:inline">{isAr ? 'تحديد عنصر' : 'Select'}</span>
          </button>

          {/* Reload Preview Button */}
          <button
            type="button"
            onClick={onRefreshPreview}
            className="p-1.5 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            title={isAr ? 'إعادة تحميل المعاينة' : 'Reload preview'}
          >
            <RotateCcw size={13} />
          </button>
        </div>
      )}

      {/* Right Group: Issues, Versions, Download, Pop-out, Publish */}
      <div className="flex items-center gap-1.5 shrink-0">
        {onToggleIssues && (
          <button
            type="button"
            onClick={onToggleIssues}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-shape-xs border text-xs font-bold transition-colors cursor-pointer ${
              isIssuesOpen || issuesCount > 0
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                : 'bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title={isAr ? 'الأخطاء والملاحظات' : 'Issues & Punch List'}
          >
            <AlertTriangle size={13} />
            <span className="hidden xl:inline">{isAr ? 'المشكلات' : 'Issues'}</span>
            {issuesCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-shape-full bg-amber-500 text-slate-950 text-[10px] font-black">
                {issuesCount}
              </span>
            )}
          </button>
        )}

        {onToggleVersions && (
          <button
            type="button"
            onClick={onToggleVersions}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-shape-xs border text-xs font-bold transition-colors cursor-pointer ${
              isVersionsOpen
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-500'
                : 'bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title={isAr ? 'سجل الإصدارات واللقطات' : 'Version History'}
          >
            <History size={13} />
            <span className="hidden xl:inline">{isAr ? 'الإصدارات' : 'Versions'}</span>
            {versionsCount > 0 && (
              <span className="text-[10px] opacity-75">({versionsCount})</span>
            )}
          </button>
        )}

        {onDownloadZip && (
          <button
            type="button"
            onClick={onDownloadZip}
            className="p-1.5 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            title={isAr ? 'تنزيل المشروع (ZIP)' : 'Download Project ZIP'}
          >
            <Download size={13} />
          </button>
        )}

        {onPopOutPreview && (
          <button
            type="button"
            onClick={onPopOutPreview}
            className="p-1.5 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            title={isAr ? 'فتح المعاينة في نافذة مستقلة' : 'Open preview in new tab'}
          >
            <ExternalLink size={13} />
          </button>
        )}

        {onPublishClick && (
          <button
            type="button"
            onClick={onPublishClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-shape-xs text-xs font-bold transition-all cursor-pointer shadow-2xs ${
              isPublished
                ? 'bg-green-600 hover:bg-green-500 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            <Globe size={13} />
            <span>{isPublished ? (isAr ? 'منشور' : 'Published') : (isAr ? 'نشر' : 'Publish')}</span>
          </button>
        )}
      </div>
    </div>
  );
};
