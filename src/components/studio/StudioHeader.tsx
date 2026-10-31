import React, { useState, useEffect } from 'react';
import {
  Edit2,
  LayoutGrid,
  Wand2,
  Download,
  Sliders,
  Globe,
  Check,
  ArrowLeft,
  Plus,
  Layers,
  Key,
  FolderOpen,
  History,
  Sparkles
} from 'lucide-react';

interface StudioHeaderProps {
  projectName: string;
  onRenameProject: (newName: string) => void;
  onOpenTemplates: () => void;
  onTriggerAiFix: () => void;
  onDownloadProject: () => void;
  onOpenSettings?: () => void;
  onTogglePublish: () => void;
  isPublished?: boolean;
  isPublishDirty?: boolean;
  isGenerating?: boolean;
  cloudSyncBadge?: React.ReactNode;
  quotaBadge?: string | null;
  onBack?: () => void;
  onOpenProjectsDrawer?: () => void;
  onCreateNewProject?: () => void;
  onSharePreview?: () => void;
  onOpenVersions?: () => void;
  onToggleStartScreen?: () => void;
  isStartScreenOpen?: boolean;
  onOpenEnvModal?: () => void;
  language?: 'ar' | 'en';
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  projectName,
  onRenameProject,
  onOpenTemplates,
  onTriggerAiFix,
  onDownloadProject,
  onOpenSettings,
  onTogglePublish,
  isPublished = false,
  isPublishDirty = false,
  isGenerating = false,
  cloudSyncBadge,
  quotaBadge,
  onBack,
  onOpenProjectsDrawer,
  onCreateNewProject,
  onSharePreview,
  onOpenVersions,
  onToggleStartScreen,
  isStartScreenOpen = false,
  onOpenEnvModal,
  language = 'ar'
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(projectName);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const isAr = language === 'ar';

  useEffect(() => {
    setNameInput(projectName);
  }, [projectName]);

  const handleSaveName = () => {
    if (nameInput.trim()) {
      onRenameProject(nameInput.trim());
    } else {
      setNameInput(projectName);
    }
    setIsEditing(false);
  };

  return (
    <header className="h-11 bg-[var(--surface-card)] border-b border-[var(--border-default)] px-3 sm:px-4 flex items-center justify-between shrink-0 select-none z-30 font-sans">
      {/* Left section: Back, Projects Drawer, New Project, Project Name, Cloud Sync */}
      <div className="flex items-center gap-2 min-w-0">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center justify-center w-8 h-8 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:bg-[var(--surface-card)] hover:border-accent text-[var(--text-primary)] transition-all cursor-pointer shrink-0 relative touch-target-44-expanded"
            title={isAr ? 'الرجوع للبداية' : 'Back to start'}
          >
            <ArrowLeft size={14} className="rtl:rotate-180" />
          </button>
        )}

        {onOpenProjectsDrawer && (
          <button
            type="button"
            onClick={onOpenProjectsDrawer}
            className="inline-flex items-center justify-center w-8 h-8 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:border-accent/50 text-[var(--text-secondary)] hover:text-accent transition-all cursor-pointer shrink-0"
            title={isAr ? 'درج المشاريع' : 'Projects Drawer'}
          >
            <FolderOpen size={14} />
          </button>
        )}

        {onCreateNewProject && (
          <button
            type="button"
            onClick={onCreateNewProject}
            className="hidden sm:inline-flex items-center justify-center w-8 h-8 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:border-accent/50 text-[var(--text-secondary)] hover:text-accent transition-all cursor-pointer shrink-0"
            title={isAr ? 'مشروع جديد' : 'New Project'}
          >
            <Plus size={14} />
          </button>
        )}

        {/* Inline Project Title */}
        {isEditing ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveName();
                if (e.key === 'Escape') {
                  setNameInput(projectName);
                  setIsEditing(false);
                }
              }}
              autoFocus
              className="h-7 px-2 text-xs font-bold bg-[var(--surface-subtle)] border border-accent rounded-shape-xs text-[var(--text-primary)] outline-none w-36 sm:w-48"
            />
            <button
              type="button"
              onClick={handleSaveName}
              className="p-1 rounded-shape-xs bg-accent text-[var(--comp-button-primary-fg)] hover:opacity-90 cursor-pointer"
            >
              <Check size={12} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 min-w-0">
            <h1
              onClick={() => {
                setNameInput(projectName);
                setIsEditing(true);
              }}
              className="text-xs font-black text-[var(--text-primary)] hover:text-accent uppercase tracking-wide truncate max-w-[130px] sm:max-w-[220px] cursor-pointer transition-colors"
              title={isAr ? 'انقر لإعادة تسمية المشروع' : 'Click to rename project'}
            >
              {projectName}
            </h1>
            <button
              type="button"
              onClick={() => {
                setNameInput(projectName);
                setIsEditing(true);
              }}
              className="p-1 text-[var(--text-muted)] hover:text-accent rounded-shape-xs cursor-pointer transition-colors shrink-0"
              title={isAr ? 'إعادة تسمية المشروع' : 'Rename project'}
            >
              <Edit2 size={11} />
            </button>
          </div>
        )}

        {/* Cloud Sync Radar */}
        {cloudSyncBadge}
      </div>

      {/* Right section: Actions Bar */}
      <div className="flex items-center gap-1.5 shrink-0">
        {quotaBadge && (
          <span
            className="hidden lg:inline-flex items-center justify-center gap-1.5 h-8 px-2.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[11px] font-mono font-bold leading-none text-[var(--text-muted)] shrink-0"
            title={isAr ? 'عدد المشاريع السحابية المستخدمة' : 'Cloud Projects Quota'}
          >
            <Layers size={13} className="text-accent shrink-0" />
            <span>{quotaBadge}</span>
          </span>
        )}

        {onToggleStartScreen && (
          <button
            type="button"
            onClick={onToggleStartScreen}
            className={`h-8 px-2.5 rounded-shape-sm border text-[11px] font-bold leading-none inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              isStartScreenOpen
                ? 'bg-blue-600 text-white border-blue-500 shadow-2xs'
                : 'bg-[var(--surface-subtle)] border-[var(--border-default)] hover:border-accent/50 hover:text-accent text-[var(--text-secondary)]'
            }`}
            title={isAr ? 'شاشة البداية والاقتراحات' : 'Start Screen & Prompts'}
          >
            <Sparkles size={13} className={isStartScreenOpen ? 'text-white' : 'text-accent shrink-0'} />
            <span className="hidden xl:inline">{isAr ? 'شاشة البداية' : 'Start Screen'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenTemplates}
          className="h-8 px-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:border-accent/50 hover:text-accent text-[var(--text-secondary)] text-[11px] font-bold leading-none inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
        >
          <LayoutGrid size={13} className="text-accent shrink-0" />
          <span className="hidden md:inline">{isAr ? 'القوالب' : 'Templates'}</span>
        </button>

        <button
          type="button"
          onClick={onTriggerAiFix}
          disabled={isGenerating}
          className="h-8 px-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:border-accent/50 hover:text-accent text-[var(--text-secondary)] text-[11px] font-bold leading-none inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 disabled:opacity-40"
          title={isAr ? 'فحص وإصلاح الأخطاء ذكياً' : 'AI Diagnose & Fix'}
        >
          <Wand2 size={13} className="text-accent shrink-0" />
          <span className="hidden md:inline">{isAr ? 'إصلاح ذكي' : 'AI Fix'}</span>
        </button>

        <button
          type="button"
          onClick={onDownloadProject}
          className="w-8 h-8 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:bg-[var(--surface-card)] hover:border-accent text-[var(--text-muted)] hover:text-[var(--text-primary)] inline-flex items-center justify-center transition-all cursor-pointer shrink-0"
          title={isAr ? 'تنزيل المشروع ZIP' : 'Download ZIP'}
        >
          <Download size={14} />
        </button>

        {onOpenEnvModal && (
          <button
            type="button"
            onClick={onOpenEnvModal}
            className="w-8 h-8 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:bg-[var(--surface-card)] hover:border-accent text-[var(--text-muted)] hover:text-[var(--text-primary)] inline-flex items-center justify-center transition-all cursor-pointer shrink-0"
            title={isAr ? 'متغيرات البيئة' : 'Environment Variables'}
          >
            <Key size={13} />
          </button>
        )}

        {/* More Options Dropdown */}
        <div className="relative flex items-center">
          <button
            type="button"
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className={`w-8 h-8 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:bg-[var(--surface-card)] hover:border-accent text-[var(--text-muted)] hover:text-[var(--text-primary)] inline-flex items-center justify-center transition-all cursor-pointer shrink-0 ${
              isMoreOpen ? 'text-accent border-accent/60' : ''
            }`}
            title={isAr ? 'خيارات إضافية' : 'More Options'}
          >
            <Sliders size={14} />
          </button>

          {isMoreOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsMoreOpen(false)} />
              <div className="absolute top-9 end-0 w-56 z-50 p-1.5 rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] shadow-2xl space-y-1">
                {onOpenSettings && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreOpen(false);
                      onOpenSettings();
                    }}
                    className="w-full h-9 px-3 rounded-shape-sm text-xs font-semibold flex items-center gap-2.5 text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] cursor-pointer"
                  >
                    <Key size={14} className="text-blue-500 shrink-0" />
                    <span>{isAr ? 'متغيرات البيئة' : 'Env Variables'}</span>
                  </button>
                )}

                {onOpenVersions && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreOpen(false);
                      onOpenVersions();
                    }}
                    className="w-full h-9 px-3 rounded-shape-sm text-xs font-semibold flex items-center gap-2.5 text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] cursor-pointer"
                  >
                    <History size={14} className="text-amber-500 shrink-0" />
                    <span>{isAr ? 'سجل الإصدارات' : 'Version History'}</span>
                  </button>
                )}

                {onSharePreview && (
                  <>
                    <div className="h-px bg-[var(--border-default)] my-1" />
                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreOpen(false);
                        onSharePreview();
                      }}
                      className="w-full h-9 px-3 rounded-shape-sm text-xs font-semibold flex items-center gap-2.5 text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] cursor-pointer"
                    >
                      <Globe size={14} className="text-accent shrink-0" />
                      <span>{isAr ? 'نسخ رابط المعاينة' : 'Copy Preview Link'}</span>
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Publish Button */}
        <button
          type="button"
          onClick={onTogglePublish}
          className={`h-8 px-3 rounded-shape-sm font-bold text-[11px] leading-none inline-flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer shrink-0 ${
            isPublished
              ? isPublishDirty
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                : 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-accent text-[var(--comp-button-primary-fg)] hover:opacity-90'
          }`}
        >
          <Globe size={13} className="shrink-0" />
          <span>
            {isPublished
              ? isPublishDirty
                ? isAr ? 'نشر التعديلات' : 'Publish changes'
                : isAr ? 'منشور' : 'Published'
              : isAr ? 'نشر' : 'Publish'}
          </span>
          {isPublished && (
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isPublishDirty ? 'bg-slate-950 animate-ping' : 'bg-white'
              }`}
            />
          )}
        </button>
      </div>
    </header>
  );
};
