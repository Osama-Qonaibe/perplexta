import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Clock, Folder, X, Edit2, Pin } from 'lucide-react';

export interface StudioProjectItem {
  id: string;
  name: string;
  updatedAt: string;
  filesCount?: number;
  pinned?: boolean;
}

interface StudioProjectDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  projects: StudioProjectItem[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onCreateNewProject: () => void;
  onDeleteProject: (id: string, name: string) => void;
  onRenameProject?: (id: string, name: string) => void;
  onTogglePinProject?: (id: string) => void;
  language?: 'ar' | 'en';
}

export const StudioProjectDrawer: React.FC<StudioProjectDrawerProps> = ({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  onSelectProject,
  onCreateNewProject,
  onDeleteProject,
  onRenameProject,
  onTogglePinProject,
  language = 'ar'
}) => {
  const [search, setSearch] = useState('');
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('perplexta_pinned_projects') || '[]');
    } catch {
      return [];
    }
  });
  const isAr = language === 'ar';

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTogglePinProject) {
      onTogglePinProject(id);
      return;
    }
    const next = pinnedIds.includes(id)
      ? pinnedIds.filter(p => p !== id)
      : [...pinnedIds, id];
    setPinnedIds(next);
    try {
      localStorage.setItem('perplexta_pinned_projects', JSON.stringify(next));
    } catch {}
  };

  const filteredProjects = projects
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const aPin = a.pinned || pinnedIds.includes(a.id) ? 1 : 0;
      const bPin = b.pinned || pinnedIds.includes(b.id) ? 1 : 0;
      return bPin - aPin;
    });

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-xs font-sans"
    >
      <nav
        aria-label={isAr ? 'المشاريع' : 'Projects'}
        className="w-80 max-w-[85vw] h-full bg-[var(--surface-card)] border-e border-[var(--border-default)] flex flex-col shadow-2xl animate-in slide-in-from-left duration-200"
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Folder size={17} className="text-accent" />
            <h2 className="text-sm font-black uppercase tracking-wider text-[var(--text-primary)]">
              {isAr ? 'المشاريع' : 'Projects'}
            </h2>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              ({projects.length})
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                onCreateNewProject();
                onClose();
              }}
              className="px-2.5 py-1 rounded-shape-xs bg-accent text-[var(--comp-button-primary-fg)] font-bold text-xs inline-flex items-center gap-1 hover:opacity-90 transition-all cursor-pointer"
              title={isAr ? 'مشروع جديد' : 'New Project'}
            >
              <Plus size={13} />
              <span>{isAr ? 'جديد' : 'New'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-shape-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="p-3 border-b border-[var(--border-default)]/60">
          <div className="relative">
            <Search size={14} className="absolute start-2.5 top-2.5 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder={isAr ? 'البحث في المشاريع...' : 'Search projects...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full ps-8 pe-3 py-1.5 text-xs bg-[var(--surface-subtle)] border border-[var(--border-default)] rounded-shape-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-accent"
            />
          </div>
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
          {filteredProjects.length === 0 ? (
            <div className="py-10 text-center text-xs text-[var(--text-muted)] space-y-2">
              <Folder size={24} className="mx-auto opacity-30" />
              <p>{isAr ? 'لا توجد مشاريع مطابقة للبحث' : 'No matching projects found'}</p>
            </div>
          ) : (
            filteredProjects.map(proj => {
              const isActive = proj.id === activeProjectId;
              const isPinned = proj.pinned || pinnedIds.includes(proj.id);
              return (
                <div
                  key={proj.id}
                  onClick={() => {
                    onSelectProject(proj.id);
                    onClose();
                  }}
                  className={`group flex items-center justify-between p-2.5 rounded-shape-sm border cursor-pointer transition-all ${
                    isActive
                      ? 'bg-accent/10 border-accent/40 text-accent font-bold shadow-2xs'
                      : 'bg-[var(--surface-subtle)]/50 border-[var(--border-default)] hover:border-accent/30 text-[var(--text-primary)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <Folder size={15} className={`shrink-0 ${isActive ? 'text-accent' : 'text-[var(--text-muted)]'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold truncate">{proj.name}</p>
                        {isPinned && <Pin size={10} className="text-amber-500 shrink-0 fill-amber-500" />}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] font-mono mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {proj.updatedAt}
                        </span>
                        {proj.filesCount !== undefined && (
                          <span>• {proj.filesCount} {isAr ? 'ملفات' : 'files'}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      type="button"
                      onClick={(e) => togglePin(proj.id, e)}
                      className={`p-1 rounded-shape-xs hover:bg-[var(--surface-card)] cursor-pointer ${
                        isPinned ? 'text-amber-500' : 'text-[var(--text-muted)] hover:text-amber-500'
                      }`}
                      title={isAr ? 'تثبيت المشروع' : 'Pin project'}
                    >
                      <Pin size={12} />
                    </button>

                    {onRenameProject && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRenameProject(proj.id, proj.name);
                        }}
                        className="p-1 rounded-shape-xs text-[var(--text-muted)] hover:text-accent hover:bg-accent/10 cursor-pointer"
                        title={isAr ? 'إعادة تسمية' : 'Rename'}
                      >
                        <Edit2 size={12} />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProject(proj.id, proj.name);
                      }}
                      className="p-1 rounded-shape-xs text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                      title={isAr ? 'حذف المشروع' : 'Delete project'}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </nav>

      {/* Backdrop click to close */}
      <div className="flex-1" onClick={onClose} />
    </div>
  );
};
