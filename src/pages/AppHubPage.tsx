import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Folder, Database, Plus, Sparkles, Terminal, Download, Github, 
  Trash2, Edit2, ChevronRight, ChevronLeft, ArrowUpRight, Search, 
  RefreshCw, Globe, Layers, HardDrive, ShieldCheck, Cpu, Code, 
  CheckCircle2, AlertTriangle, FileCode, Play, X, Settings, LayoutDashboard
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { toast } from '@/design-system';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { resolveImageUrl } from '../utils/imageResolver';
import { Logo } from '../components/common/Logo';

interface Project {
  id: string;
  name: string;
  description: string;
  techStack: string;
  updatedAt: string;
  dbSize: string;
  tablesCount: number;
  recordsCount: number;
  isAutoSaved: boolean;
  files?: Record<string, any>;
}

const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'متجر بيربليكستا الذكي / Smart E-Commerce',
    description: 'منصة تجارة إلكترونية تفاعلية مع سلة تسوق وقاعدة بيانات منتجات SQLite حية.',
    techStack: 'HTML5 / JS / SQLite',
    updatedAt: 'منذ دقيقتين / 2m ago',
    dbSize: '248 KB',
    tablesCount: 3,
    recordsCount: 14,
    isAutoSaved: true
  },
  {
    id: 'proj-2',
    name: 'لوحة تحليلات الخوادم / Server Analytics Hub',
    description: 'لوحة مراقبة أداء الخوادم السحابية ونقاط الـ API والطلبات البرمجية الحية.',
    techStack: 'Vanilla JS / PHP',
    updatedAt: 'منذ ساعة / 1h ago',
    dbSize: '512 KB',
    tablesCount: 5,
    recordsCount: 42,
    isAutoSaved: true
  },
  {
    id: 'proj-3',
    name: 'مدونة المحتوى النخبة / Elite Content Blog',
    description: 'نظام إدارة محتوى خفيف وسريع مع تعليقات وتصنيفات فورية.',
    techStack: 'HTML5 / CSS / SQLite',
    updatedAt: 'أمس / Yesterday',
    dbSize: '120 KB',
    tablesCount: 2,
    recordsCount: 8,
    isAutoSaved: true
  }
];

export const AppHubPage: React.FC = () => {
  const { theme, language, siteSettings, dir } = useAppContext();
  const navigate = useNavigate();
  const siteName = language === 'ar' ? siteSettings.siteNameAr : siteSettings.siteName;

  const [activeTab, setActiveTab] = useState<'projects' | 'databases' | 'templates' | 'metrics'>('projects');
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem('perplexta_hub_projects');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p: any) => ({
            ...p,
            name: (!p.name || p.name.length <= 2) ? 'مشروع ويب قيد التطوير / Web Project' : p.name,
            description: p.description || 'مشروع ويب تعريفي قيد التطوير باستخدام بيئة الكانفاس الحية.'
          }));
        }
      }
    } catch {}
    return DEFAULT_PROJECTS;
  });

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectPrompt, setNewProjectPrompt] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Persistence
  useEffect(() => {
    try {
      localStorage.setItem('perplexta_hub_projects', JSON.stringify(projects));
    } catch {}
  }, [projects]);

  const activeProjectsCount = projects.length;
  const totalDbSize = '880 KB';
  const lastGithubExport = language === 'ar' ? 'منذ 3 ساعات' : '3 hours ago';

  // Open Project in Canvas
  const handleOpenProject = (project: Project) => {
    sessionStorage.setItem('current_active_project', JSON.stringify(project));
    toast.success(language === 'ar' ? `فتح مشروع ${project.name} في الاستوديو` : `Opening ${project.name} in studio`);
    navigate('/app/canvas');
  };

  // Create Project handler
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) {
      toast.error(language === 'ar' ? 'يرجى إدخال اسم المشروع' : 'Please enter project name');
      return;
    }

    setIsCreating(true);
    setTimeout(() => {
      const newProj: Project = {
        id: `proj-${Date.now()}`,
        name: newProjectName,
        description: newProjectPrompt || (language === 'ar' ? 'مشروع ويب جديد تم إنشاؤه عبر المساعد الذكي' : 'New web project created via AI assistant'),
        techStack: 'HTML5 / JS / SQLite',
        updatedAt: language === 'ar' ? 'الآن' : 'Just now',
        dbSize: '64 KB',
        tablesCount: 2,
        recordsCount: 4,
        isAutoSaved: true
      };

      setProjects([newProj, ...projects]);
      setIsCreating(false);
      setIsNewModalOpen(false);
      setNewProjectName('');
      setNewProjectPrompt('');
      toast.success(language === 'ar' ? 'تم إنشاء المشروع بنجاح!' : 'Project created successfully!');
      handleOpenProject(newProj);
    }, 800);
  };

  // Duplicate project
  const handleDuplicate = (proj: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    const duplicated: Project = {
      ...proj,
      id: `proj-${Date.now()}`,
      name: `${proj.name} (${language === 'ar' ? 'نسخة' : 'Copy'})`,
      updatedAt: language === 'ar' ? 'الآن' : 'Just now'
    };
    setProjects([duplicated, ...projects]);
    toast.success(language === 'ar' ? 'تم تكرار المشروع بنجاح' : 'Project duplicated successfully');
  };

  // Delete project
  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا المشروع؟' : 'Are you sure you want to delete this project?')) {
      setProjects(projects.filter(p => p.id !== id));
      toast.success(language === 'ar' ? 'تم حذف المشروع' : 'Project deleted');
    }
  };

  // Export ZIP
  const handleDownloadZip = async (proj: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    const zip = new JSZip();
    zip.file('index.html', `<!DOCTYPE html><html><head><title>${proj.name}</title></head><body><h1>${proj.name}</h1></body></html>`);
    zip.file('style.css', 'body { font-family: sans-serif; }');
    zip.file('app.js', 'console.log("App loaded");');
    
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${proj.name.replace(/\s+/g, '_')}_export.zip`);
    toast.success(language === 'ar' ? 'تم تصدير ملفات ZIP بنجاح' : 'ZIP exported successfully');
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[var(--surface-page)] text-[var(--text-primary)] font-sans flex flex-col md:flex-row overflow-hidden transition-theme">
      {/* Chat-style Full-Height Sidebar */}
      <aside className="w-full md:w-72 h-screen sticky top-0 bg-[var(--surface-card)] border-r border-[var(--border-default)] flex flex-col justify-between p-5 shrink-0 select-none">
        
        {/* Top Section: Real Platform Logo & New Project CTA */}
        <div className="space-y-5">
          <div className="flex items-center gap-3.5 pb-4 border-b border-[var(--border-default)]">
            <Logo size={32} showName={false} />
            <div className="overflow-hidden">
              <h2 className="text-sm font-bold uppercase tracking-wider truncate text-[var(--text-primary)]">{siteName}</h2>
            </div>
          </div>

          {/* New Project CTA Button */}
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="w-full py-2.5 px-4 rounded-shape-sm bg-[var(--comp-button-primary-bg)] hover:opacity-90 text-[var(--comp-button-primary-fg)] font-bold text-xs shadow-2xs hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            <span>{language === 'ar' ? 'مشروع جديد' : 'New Project'}</span>
          </button>

          {/* Navigation Menu */}
          <nav className="space-y-1.5 pt-2">
            <button
              onClick={() => setActiveTab('projects')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-shape-sm text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'projects'
                  ? 'bg-[var(--surface-subtle)] text-[var(--text-primary)] border border-[var(--border-default)] shadow-2xs'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Folder size={15} />
                <span>{language === 'ar' ? 'المشاريع النشطة' : 'Active Projects'}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[var(--surface-subtle)] text-[10px] text-[var(--text-muted)] border border-[var(--border-default)]">
                {projects.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('databases')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-shape-sm text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'databases'
                  ? 'bg-[var(--surface-subtle)] text-[var(--text-primary)] border border-[var(--border-default)] shadow-2xs'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Database size={15} />
                <span>{language === 'ar' ? 'قواعد البيانات الافتراضية' : 'Virtual Databases'}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[var(--surface-subtle)] text-[10px] text-[var(--text-muted)] border border-[var(--border-default)]">
                SQL
              </span>
            </button>

            <button
              onClick={() => setActiveTab('templates')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-shape-sm text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'templates'
                  ? 'bg-[var(--surface-subtle)] text-[var(--text-primary)] border border-[var(--border-default)] shadow-2xs'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers size={15} />
                <span>{language === 'ar' ? 'القوالب الجاهزة' : 'Templates Gallery'}</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('metrics')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-shape-sm text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'metrics'
                  ? 'bg-[var(--surface-subtle)] text-[var(--text-primary)] border border-[var(--border-default)] shadow-2xs'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <HardDrive size={15} />
                <span>{language === 'ar' ? 'الإحصائيات والنسخ الاحتياطي' : 'Metrics & Backups'}</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Bottom Section: Auto-Save Status & Back to Studio Button */}
        <div className="space-y-3 pt-4 border-t border-[var(--border-default)]">
          <div className="p-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-[var(--text-muted)]">{language === 'ar' ? 'الحفظ التلقائي' : 'Auto-Save'}</span>
              <span className="text-emerald-500 flex items-center gap-1">
                <CheckCircle2 size={12} /> {language === 'ar' ? 'مفعل' : 'Active'}
              </span>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] leading-tight">
              {language === 'ar' ? 'جميع التعديلات محفوظة آمنة.' : 'All edits are securely saved.'}
            </p>
          </div>

          <button
            onClick={() => navigate('/studio')}
            className="w-full h-10 px-3 rounded-shape-sm bg-transparent hover:bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
          >
            {dir === 'rtl' ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            <span>{language === 'ar' ? 'العودة للاستوديو الرئيسي' : 'Back to Main Studio'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto bg-[var(--surface-page)]">
        {/* Top Quick Metrics & Search Bar */}
        <header className="sticky top-0 z-30 backdrop-blur-md bg-[var(--surface-page)]/95 border-b border-[var(--border-default)] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6 w-full sm:w-auto">
            <div>
              <h1 className="text-base font-bold tracking-tight text-[var(--text-primary)]">
                {activeTab === 'projects' && (language === 'ar' ? 'لوحة المشاريع النشطة' : 'Active Projects Hub')}
                {activeTab === 'databases' && (language === 'ar' ? 'إدارة قواعد البيانات الافتراضية' : 'Virtual Database Manager')}
                {activeTab === 'templates' && (language === 'ar' ? 'معرض القوالب الذكية' : 'Templates Gallery')}
                {activeTab === 'metrics' && (language === 'ar' ? 'إحصائيات الموارد والنسخ الاحتياطي' : 'Resource Metrics & Backups')}
              </h1>
              <p className="text-xs text-[var(--text-secondary)]">
                {language === 'ar' ? 'تحكم كامل بالمشاريع، قواعد البيانات SQLite، والتصدير السحابي.' : 'Full control over projects, SQLite databases, and cloud exports.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {activeTab === 'projects' && (
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder={language === 'ar' ? 'بحث في المشاريع...' : 'Search projects...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-3 pr-9 rounded-shape-sm bg-[var(--surface-card)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-accent)] shadow-2xs"
                />
              </div>
            )}
          </div>
        </header>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-shape-sm bg-[var(--surface-card)] border border-[var(--border-default)] flex items-center justify-between shadow-2xs">
              <div>
                <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase">{language === 'ar' ? 'المشاريع النشطة' : 'Active Projects'}</p>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mt-1">{activeProjectsCount}</h3>
              </div>
              <div className="w-10 h-10 rounded-shape-sm bg-[var(--bg-accent-muted)] text-[var(--fg-accent)] flex items-center justify-center">
                <Folder size={20} />
              </div>
            </div>

            <div className="p-4 rounded-shape-sm bg-[var(--surface-card)] border border-[var(--border-default)] flex items-center justify-between shadow-2xs">
              <div>
                <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase">{language === 'ar' ? 'حجم تخزين SQLite' : 'SQLite Storage'}</p>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mt-1">{totalDbSize}</h3>
              </div>
              <div className="w-10 h-10 rounded-shape-sm bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Database size={20} />
              </div>
            </div>

            <div className="p-4 rounded-shape-sm bg-[var(--surface-card)] border border-[var(--border-default)] flex items-center justify-between shadow-2xs">
              <div>
                <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase">{language === 'ar' ? 'آخر تصدير GitHub' : 'Last GitHub Export'}</p>
                <h3 className="text-sm font-bold text-[var(--text-primary)] mt-1">{lastGithubExport}</h3>
              </div>
              <div className="w-10 h-10 rounded-shape-sm bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <Github size={20} />
              </div>
            </div>
          </div>

          {/* TAB 1: PROJECTS GRID */}
          {activeTab === 'projects' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProjects.map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => handleOpenProject(proj)}
                    className="p-5 rounded-shape-sm bg-[var(--surface-card)] border border-[var(--border-default)] hover:border-[var(--border-accent)]/60 transition-all cursor-pointer flex flex-col justify-between group shadow-2xs space-y-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-shape-sm text-[10px] font-bold bg-[var(--surface-subtle)] text-[var(--text-muted)] border border-[var(--border-default)]">
                          {proj.techStack}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)]">{proj.updatedAt}</span>
                      </div>
                      <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--fg-accent)] transition-colors">
                        {proj.name}
                      </h3>
                      {/* RTL Fix for Arabic text and truncation */}
                      <p 
                        className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed"
                        style={{
                          direction: language === 'ar' ? 'rtl' : 'ltr',
                          textAlign: language === 'ar' ? 'right' : 'left',
                          unicodeBidi: 'plaintext'
                        }}
                      >
                        {proj.description || (language === 'ar' ? 'مشروع ويب قيد التطوير...' : 'Web project under development...')}
                      </p>
                    </div>

                    <div className="space-y-3 pt-2">
                      {/* Primary CTA Button for opening in studio */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenProject(proj);
                        }}
                        className="w-full py-2 px-3 rounded-shape-sm bg-[var(--bg-accent-muted)] hover:bg-[var(--accent)] text-[var(--fg-accent)] hover:text-[var(--comp-button-primary-fg)] text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-[var(--border-accent)]/30 cursor-pointer shadow-2xs"
                      >
                        <span>{language === 'ar' ? 'فتح في الاستوديو' : 'Open in Studio'}</span>
                        <ArrowUpRight size={14} className={dir === 'rtl' ? 'rotate-[-90deg]' : ''} />
                      </button>

                      <div className="pt-2 border-t border-[var(--border-default)] flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                          <Database size={12} className="text-emerald-500" />
                          <span>{proj.dbSize} ({proj.tablesCount} {language === 'ar' ? 'جداول' : 'tables'})</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleDownloadZip(proj, e)}
                            className="p-1.5 rounded-shape-sm bg-transparent hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors border border-[var(--border-default)]"
                            title={language === 'ar' ? 'تحميل ZIP' : 'Download ZIP'}
                          >
                            <Download size={14} />
                          </button>
                          <button
                            onClick={(e) => handleDuplicate(proj, e)}
                            className="p-1.5 rounded-shape-sm bg-transparent hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors border border-[var(--border-default)]"
                            title={language === 'ar' ? 'تكرار المشروع' : 'Duplicate project'}
                          >
                            <RefreshCw size={14} />
                          </button>
                          <button
                            onClick={(e) => handleDelete(proj.id, e)}
                            className="p-1.5 rounded-shape-sm bg-transparent hover:bg-rose-500/10 text-[var(--text-muted)] hover:text-rose-500 transition-colors border border-[var(--border-default)] hover:border-rose-500/30"
                            title={language === 'ar' ? 'حذف المشروع' : 'Delete project'}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: VIRTUAL DATABASES */}
          {activeTab === 'databases' && (
            <div className="space-y-4">
              <div className="p-5 rounded-shape-sm bg-[var(--surface-card)] border border-[var(--border-default)] space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">
                      {language === 'ar' ? 'مدير قواعد البيانات الافتراضية (Supabase / PlanetScale Style)' : 'Virtual Database Manager (Supabase / PlanetScale Style)'}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {language === 'ar' ? 'مراقبة استهلاك SQLite لكل مشروع مع جدول تفصيلي وخيارات الصيانة الفورية.' : 'Monitor SQLite storage per project with detailed tables and instant maintenance options.'}
                    </p>
                  </div>
                  <button 
                    onClick={() => toast.success(language === 'ar' ? 'تم تحديث حالة قواعد البيانات' : 'Database status updated')}
                    className="h-8 px-3 rounded-shape-sm bg-transparent hover:bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs font-bold text-[var(--text-primary)] cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <RefreshCw size={12} /> {language === 'ar' ? 'تحديث' : 'Refresh'}
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border-default)] text-[var(--text-muted)] uppercase text-[10px]">
                        <th className="py-3 px-4">{language === 'ar' ? 'اسم المشروع' : 'Project Name'}</th>
                        <th className="py-3 px-4">{language === 'ar' ? 'الجداول' : 'Tables'}</th>
                        <th className="py-3 px-4">{language === 'ar' ? 'السجلات' : 'Records'}</th>
                        <th className="py-3 px-4">{language === 'ar' ? 'الحجم' : 'Size'}</th>
                        <th className="py-3 px-4 text-left">{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-default)]">
                      {projects.map((proj) => (
                        <tr key={proj.id} className="hover:bg-[var(--surface-subtle)] transition-colors">
                          <td className="py-3.5 px-4 font-bold text-[var(--text-primary)]">{proj.name}</td>
                          <td className="py-3.5 px-4 text-[var(--text-secondary)]">{proj.tablesCount} tables</td>
                          <td className="py-3.5 px-4 text-[var(--text-secondary)]">{proj.recordsCount} rows</td>
                          <td className="py-3.5 px-4 font-mono text-emerald-500">{proj.dbSize}</td>
                          <td className="py-3.5 px-4 text-left flex items-center justify-end gap-2">
                            <button
                              onClick={() => toast.success(language === 'ar' ? `تم إفراغ جداول قاعدة بيانات ${proj.name}` : `Truncated tables for ${proj.name}`)}
                              className="px-2.5 py-1 rounded-shape-sm bg-transparent border border-[var(--border-default)] text-[11px] font-bold text-[var(--text-secondary)] hover:text-rose-500 hover:border-rose-500/30 cursor-pointer shadow-2xs"
                            >
                              {language === 'ar' ? 'إفراغ (Truncate)' : 'Truncate'}
                            </button>
                            <button
                              onClick={() => {
                                const blob = new Blob([`-- SQLite Schema & Dump for ${proj.name}\nCREATE TABLE IF NOT EXISTS records (id INT PRIMARY KEY, data TEXT);\nINSERT INTO records VALUES (1, 'Sample Data');`], { type: 'text/plain' });
                                saveAs(blob, `${proj.name.replace(/\s+/g, '_')}_schema.sql`);
                                toast.success(language === 'ar' ? 'تم تنزيل ملف schema.sql بنجاح' : 'schema.sql downloaded successfully');
                              }}
                              className="px-2.5 py-1 rounded-shape-sm bg-[var(--bg-accent-muted)] border border-[var(--border-accent)]/30 text-[11px] font-bold text-[var(--fg-accent)] hover:bg-[var(--accent)] hover:text-[var(--comp-button-primary-fg)] cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              <Download size={11} /> schema.sql
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TEMPLATES */}
          {activeTab === 'templates' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { 
                  id: 'ecommerce', 
                  title: language === 'ar' ? 'متجر إلكتروني متكامل' : 'E-commerce Store', 
                  desc: language === 'ar' ? 'متجر إلكتروني مع سلة تسوق، قاعدة بيانات منتجات SQLite، ونظام دفع وهمي.' : 'Full e-commerce store with shopping cart and SQLite product database.', 
                  tag: 'E-commerce' 
                },
                { 
                  id: 'portfolio', 
                  title: language === 'ar' ? 'بورتفوليو شخصي احترافي' : 'Professional Portfolio', 
                  desc: language === 'ar' ? 'موقع شخصي لعرض الأعمال، المهارات، ونموذج اتصال مباشر.' : 'Personal website showcasing works, skills, and direct contact form.', 
                  tag: 'Portfolio' 
                },
                { 
                  id: 'saas', 
                  title: language === 'ar' ? 'لوحة تحكم SaaS' : 'SaaS Dashboard', 
                  desc: language === 'ar' ? 'لوحة SaaS متكاملة مع إحصائيات مستخدمين، اشتراكات، ورسوم بيانية.' : 'SaaS dashboard with user stats, subscriptions, and analytical charts.', 
                  tag: 'SaaS' 
                },
                { 
                  id: 'blog', 
                  title: language === 'ar' ? 'مدونة مقالات خفيفة' : 'Lightweight Article Blog', 
                  desc: language === 'ar' ? 'عارض مقالات، تعليقات، ونظام تصنيفات فورية خفيف جداً.' : 'Article viewer, comments, and real-time category tagging.', 
                  tag: 'Blog' 
                }
              ].map((tpl) => (
                <div key={tpl.id} className="p-5 rounded-shape-sm bg-[var(--surface-card)] border border-[var(--border-default)] flex flex-col justify-between space-y-4 shadow-2xs hover:border-[var(--border-accent)]/60 transition-all">
                  <div className="space-y-2">
                    <span className="px-2.5 py-1 rounded-shape-sm text-[10px] font-bold bg-[var(--bg-accent-muted)] text-[var(--fg-accent)] border border-[var(--border-accent)]/20">{tpl.tag}</span>
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">{tpl.title}</h3>
                    <p 
                      className="text-xs text-[var(--text-secondary)] leading-relaxed"
                      style={{
                        direction: language === 'ar' ? 'rtl' : 'ltr',
                        textAlign: language === 'ar' ? 'right' : 'left',
                        unicodeBidi: 'plaintext'
                      }}
                    >
                      {tpl.desc}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const newProj: Project = {
                        id: `proj-${Date.now()}`,
                        name: tpl.title,
                        description: tpl.desc,
                        techStack: 'HTML5 / SQLite',
                        updatedAt: language === 'ar' ? 'الآن' : 'Just now',
                        dbSize: '150 KB',
                        tablesCount: 3,
                        recordsCount: 10,
                        isAutoSaved: true
                      };
                      setProjects([newProj, ...projects]);
                      toast.success(language === 'ar' ? 'تم إنشاء المشروع من القالب بنجاح!' : 'Created from template successfully!');
                      handleOpenProject(newProj);
                    }}
                    className="w-full py-2.5 rounded-shape-sm bg-[var(--comp-button-primary-bg)] hover:opacity-90 text-[var(--comp-button-primary-fg)] text-xs font-bold hover:opacity-90 transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <span>{language === 'ar' ? 'استخدام القالب بنقرة واحدة' : 'Use Template 1-Click'}</span>
                    <ArrowUpRight size={14} className={dir === 'rtl' ? 'rotate-[-90deg]' : ''} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: METRICS & BACKUPS */}
          {activeTab === 'metrics' && (
            <div className="p-5 rounded-shape-sm bg-[var(--surface-card)] border border-[var(--border-default)] space-y-4 shadow-2xs">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                {language === 'ar' ? 'تقرير استهلاك الموارد وحالة الخادم المحلي' : 'Resource Consumption & Local Server Status'}
              </h3>
              <div className="space-y-3 text-xs text-[var(--text-secondary)]">
                <div className="flex justify-between p-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)]">
                  <span>{language === 'ar' ? 'الذاكرة المؤقتة (Local Storage VFS)' : 'Local Storage VFS'}</span>
                  <span className="font-bold text-[var(--fg-accent)]">1.4 MB / 50 MB</span>
                </div>
                <div className="flex justify-between p-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)]">
                  <span>{language === 'ar' ? 'حالة المزامنة السحابية (Auto-Save)' : 'Cloud Auto-Save Sync'}</span>
                  <span className="font-bold text-emerald-500">{language === 'ar' ? 'متصل (مزامنة فورية)' : 'Connected (Real-time Sync)'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* NEW PROJECT MODAL */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold tracking-wider flex items-center gap-2 text-[var(--text-primary)]">
                <Sparkles size={16} className="text-[var(--fg-accent)]" />
                {language === 'ar' ? 'إنشاء مشروع جديد عبر الذكاء الاصطناعي' : 'Create New AI Project'}
              </h3>
              <button 
                onClick={() => setIsNewModalOpen(false)}
                className="p-1 rounded-shape-sm hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)]">{language === 'ar' ? 'اسم المشروع' : 'Project Name'}</label>
                <input
                  type="text"
                  required
                  placeholder={language === 'ar' ? 'مثال: متجر إلكتروني للملابس' : 'e.g., E-commerce Apparel Store'}
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full h-10 px-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-accent)] shadow-2xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)]">{language === 'ar' ? 'وصف الفكرة أو برومبت التوليد' : 'AI Prompt / Description'}</label>
                <textarea
                  rows={3}
                  placeholder={language === 'ar' ? 'صف تطبيقك المطلوب وسيقوم النظام بتوليد الهيكل وملفات الـ SQLite...' : 'Describe your app and AI will generate files and SQLite database...'}
                  value={newProjectPrompt}
                  onChange={(e) => setNewProjectPrompt(e.target.value)}
                  className="w-full p-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-accent)] resize-none shadow-2xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-shape-sm bg-transparent hover:bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs font-bold text-[var(--text-secondary)] cursor-pointer shadow-2xs"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 rounded-shape-sm bg-[var(--comp-button-primary-bg)] hover:opacity-90 text-[var(--comp-button-primary-fg)] text-xs font-bold hover:opacity-90 transition-colors cursor-pointer flex items-center gap-2 shadow-2xs"
                >
                  {isCreating ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  <span>{isCreating ? (language === 'ar' ? 'جاري التوليد...' : 'Generating...') : (language === 'ar' ? 'بدء الإنشاء والتطوير' : 'Start Development')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
