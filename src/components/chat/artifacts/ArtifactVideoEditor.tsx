import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  Play, Pause, Plus, Trash2, Layers, Clock, Scissors, Zap, 
  ChevronRight, ChevronLeft, Maximize2, Minimize2, Save, X,
  Download, RefreshCw, ZoomIn, ZoomOut, Film, Video, Music,
  Type, Image as ImageIcon, Shapes, Sliders, ArrowUpRight,
  PlusCircle, SkipBack, SkipForward, Settings, Volume2, VolumeX,
  Sparkles, Monitor, Smartphone, Camera, Palette, Square, Search, LayoutTemplate
} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { toast } from '@/design-system';
import { resolveImageUrl } from '../../../utils/imageResolver';
import { UNIFIED_PUBLIC_TEMPLATES } from '../../../data/publicTemplatesData';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface VideoScene {
  id: string;
  duration: number; // in seconds
  elements: any[];
  transition?: 'none' | 'fade' | 'slide' | 'zoom';
}

interface ArtifactVideoEditorProps {
  artifact: {
    id: string;
    title: string;
    content: string;
  };
  projectId?: string;
  initialElements?: any[];
  initialVideoSize?: { width: number; height: number };
  onClose: () => void;
}

export const ArtifactVideoEditor: React.FC<ArtifactVideoEditorProps> = ({
  artifact,
  projectId,
  initialElements,
  initialVideoSize,
  onClose
}) => {
  const { language, dir, theme, user } = useAppContext();
  const isAr = language === 'ar' || dir === 'rtl';

  const [scenes, setScenes] = useState<VideoScene[]>([
    {
      id: 'scene-1',
      duration: 5,
      elements: initialElements || [],
      transition: 'none'
    }
  ]);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoSize, setVideoSize] = useState(initialVideoSize || { width: 1080, height: 1920 });
  const [isSaving, setIsSaving] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'tools' | 'templates'>('tools');
  const [templateQuery, setTemplateQuery] = useState('');

  // Filter video templates in real time inside editor
  const sidebarFilteredTemplates = useMemo(() => {
    if (!templateQuery.trim()) return UNIFIED_PUBLIC_TEMPLATES;
    const q = templateQuery.trim().toLowerCase();
    return UNIFIED_PUBLIC_TEMPLATES.filter(t => 
      t.titleAr.toLowerCase().includes(q) ||
      t.titleEn.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.tag.toLowerCase().includes(q) ||
      (t.elements && t.elements.some((el: any) => el.text && String(el.text).toLowerCase().includes(q)))
    );
  }, [templateQuery]);

  const handleApplyTemplateToScene = (tpl: any) => {
    const newElements = tpl.elements || [];
    setScenes(prev => {
      const updated = [...prev];
      updated[currentSceneIndex] = {
        ...updated[currentSceneIndex],
        elements: newElements
      };
      return updated;
    });
    if (tpl.width && tpl.height) {
      setVideoSize({ width: tpl.width, height: tpl.height });
    }
    toast.success(isAr ? `تم تطبيق قالب "${tpl.titleAr}" على المشهد الحالي` : `Applied "${tpl.titleEn}" template to current scene`);
  };
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const totalDuration = useMemo(() => scenes.reduce((sum, s) => sum + s.duration, 0), [scenes]);

  const animate = useCallback((time: number) => {
    if (!startTimeRef.current) startTimeRef.current = time;
    const progress = (time - startTimeRef.current) / 1000;
    
    if (progress >= totalDuration) {
      setIsPlaying(false);
      setCurrentTime(0);
      startTimeRef.current = 0;
      return;
    }

    setCurrentTime(progress);
    requestRef.current = requestAnimationFrame(animate);
  }, [totalDuration]);

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      startTimeRef.current = 0;
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, animate]);

  // Handle Persistence
  const handleSaveProject = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem('app_token');
      const res = await fetch('/api/studio/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          id: projectId || `video-${Date.now()}`,
          title: artifact.title,
          frameworkMode: 'video',
          files: { 'project.json': { content: JSON.stringify({ scenes, videoSize }) } },
          metadata: { type: 'video', fps: 30, duration: totalDuration, resolution: `${videoSize.width}x${videoSize.height}` }
        })
      });
      if (res.ok) {
        toast.success(isAr ? 'تم حفظ المشروع سحابياً بنجاح' : 'Project saved to cloud successfully');
      }
    } catch (e) {
      toast.error(isAr ? 'فشل في حفظ المشروع' : 'Failed to save project');
    } finally {
      setIsSaving(false);
    }
  };

  // Render logic for the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background based on theme
    ctx.fillStyle = theme === 'dark' ? '#0d1117' : '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Find current scene based on currentTime
    let accum = 0;
    const scene = scenes.find(s => {
      const start = accum;
      const end = accum + s.duration;
      accum = end;
      return currentTime >= start && currentTime <= end;
    });

    if (scene) {
      scene.elements.forEach(el => {
        ctx.fillStyle = el.color || (theme === 'dark' ? '#ffffff' : '#1f2328');
        if (el.type === 'text') {
           ctx.font = `bold ${el.fontSize || 48}px Tajawal, Cairo, sans-serif`;
           ctx.fillText(el.text || 'Text', el.x, el.y);
        } else {
           ctx.fillRect(el.x, el.y, el.w || 100, el.h || 100);
        }
      });
    }

    if (isPlaying) {
       ctx.fillStyle = 'rgba(9, 105, 218, 0.2)';
       ctx.beginPath();
       ctx.arc(canvas.width / 2 + Math.sin(currentTime * 2) * 100, canvas.height / 2, 50, 0, Math.PI * 2);
       ctx.fill();
    }
  }, [currentTime, scenes, isPlaying, theme]);

  const handleAddScene = () => {
    const newScene: VideoScene = {
      id: `scene-${Date.now()}`,
      duration: 3,
      elements: [],
      transition: 'fade'
    };
    setScenes([...scenes, newScene]);
    toast.success(isAr ? 'تمت إضافة مشهد جديد' : 'Scene added');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[var(--surface-page)] flex flex-col text-[var(--text-primary)] overflow-hidden font-sans transition-theme">
      {/* Top Header */}
      <header className="h-14 border-b border-[var(--border-default)] flex items-center justify-between px-4 bg-[var(--surface-card)] transition-theme">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="touch-target-44 p-2 hover:bg-[var(--surface-subtle)] rounded-lg cursor-pointer transition-colors">
            <X size={20} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold truncate max-w-[200px]">{artifact.title}</h1>
            <span className="text-[10px] text-[var(--text-muted)] font-mono">PROJECT_ID: {projectId?.toUpperCase()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleSaveProject}
            disabled={isSaving}
            className="h-9 px-4 rounded-lg bg-[var(--comp-button-primary-bg)] hover:opacity-90 text-[var(--comp-button-primary-fg)] text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            <span>{isAr ? 'حفظ المشروع' : 'Save Project'}</span>
          </button>
          <button className="h-9 px-4 rounded-lg border border-[var(--border-default)] hover:bg-[var(--surface-subtle)] text-[var(--text-primary)] text-xs font-bold flex items-center gap-2 transition-all cursor-pointer">
            <Download size={16} />
            <span>{isAr ? 'تصدير MP4' : 'Export MP4'}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Assets & Templates */}
        <aside className="w-72 border-e border-[var(--border-default)] bg-[var(--surface-card)] flex flex-col transition-theme">
          {/* Tab Switcher Header */}
          <div className="p-2 border-b border-[var(--border-default)] flex gap-1 bg-[var(--surface-subtle)]">
            <button
              onClick={() => setSidebarTab('tools')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                sidebarTab === 'tools'
                  ? 'bg-[var(--surface-card)] text-[var(--accent)] shadow-2xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Zap size={14} />
              <span>{isAr ? 'الأدوات' : 'Tools'}</span>
            </button>
            <button
              onClick={() => setSidebarTab('templates')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                sidebarTab === 'templates'
                  ? 'bg-[var(--surface-card)] text-[var(--accent)] shadow-2xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <LayoutTemplate size={14} />
              <span>{isAr ? 'القوالب' : 'Templates'}</span>
            </button>
          </div>

          {sidebarTab === 'tools' ? (
            <>
              <div className="p-2 grid grid-cols-2 gap-2 overflow-y-auto">
                {[
                  { icon: <Type size={18} />, label: isAr ? 'نصوص' : 'Text' },
                  { icon: <ImageIcon size={18} />, label: isAr ? 'وسائط' : 'Media' },
                  { icon: <Shapes size={18} />, label: isAr ? 'أشكال' : 'Shapes' },
                  { icon: <Music size={18} />, label: isAr ? 'صوتيات' : 'Audio' },
                  { icon: <Scissors size={18} />, label: isAr ? 'قص' : 'Trim' },
                  { icon: <Zap size={18} />, label: isAr ? 'انتقالات' : 'FX' },
                ].map((tool, i) => (
                  <button key={i} className="flex flex-col items-center justify-center p-3 rounded-xl bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] border border-[var(--border-default)] transition-all cursor-pointer group">
                    <span className="text-[var(--accent)] group-hover:scale-110 transition-transform">{tool.icon}</span>
                    <span className="text-[10px] mt-1.5 font-bold">{tool.label}</span>
                  </button>
                ))}
              </div>

              <div className="mt-auto p-4 border-t border-[var(--border-default)] bg-[var(--surface-subtle)]">
                <div className="flex items-center justify-between text-xs mb-3 font-bold">
                  <span className="text-[var(--text-muted)]">{isAr ? 'دقة العرض' : 'Resolution'}</span>
                  <span className="font-mono text-[var(--accent)]">{videoSize.width}x{videoSize.height}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setVideoSize({ width: 1080, height: 1920 })} className="flex-1 h-8 rounded-lg bg-[var(--surface-card)] text-[10px] font-bold border border-[var(--border-default)] hover:border-[var(--accent)] transition-colors cursor-pointer">9:16</button>
                  <button onClick={() => setVideoSize({ width: 1920, height: 1080 })} className="flex-1 h-8 rounded-lg bg-[var(--surface-card)] text-[10px] font-bold border border-[var(--border-default)] hover:border-[var(--accent)] transition-colors cursor-pointer">16:9</button>
                  <button onClick={() => setVideoSize({ width: 1080, height: 1080 })} className="flex-1 h-8 rounded-lg bg-[var(--surface-card)] text-[10px] font-bold border border-[var(--border-default)] hover:border-[var(--accent)] transition-colors cursor-pointer">1:1</button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden p-3 space-y-3">
              {/* Text-based Search Input above Video Template Gallery */}
              <div className="relative w-full shrink-0">
                <Search size={14} className="absolute start-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                <input
                  type="text"
                  value={templateQuery}
                  onChange={(e) => setTemplateQuery(e.target.value)}
                  placeholder={isAr ? 'ابحث في القوالب باسم القالب أو الميتاداتا...' : 'Search video templates...'}
                  className="w-full ps-8 pe-7 py-2 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-default)] focus:border-[var(--accent)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none transition-all"
                />
                {templateQuery && (
                  <button
                    type="button"
                    onClick={() => setTemplateQuery('')}
                    className="absolute end-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Template Gallery List */}
              <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar pe-1">
                {sidebarFilteredTemplates.length > 0 ? (
                  sidebarFilteredTemplates.map((tpl) => (
                    <div
                      key={tpl.id}
                      onClick={() => handleApplyTemplateToScene(tpl)}
                      className="group relative rounded-xl border border-[var(--border-default)] hover:border-[var(--accent)] bg-[var(--surface-subtle)] overflow-hidden transition-all cursor-pointer p-2.5 space-y-2"
                    >
                      <div className="relative aspect-video w-full bg-slate-900 rounded-lg overflow-hidden">
                        <img src={tpl.src} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
                        <span className="absolute bottom-1 end-1 px-1.5 py-0.5 text-[8px] font-mono font-bold bg-black/70 text-white rounded">
                          {tpl.dimensions}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold truncate max-w-[150px] group-hover:text-[var(--accent)] transition-colors">
                          {isAr ? tpl.titleAr : tpl.titleEn}
                        </span>
                        <span className="text-[9px] font-bold text-[var(--text-muted)]">
                          {tpl.tag || tpl.categoryLabelAr}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center space-y-2 text-[var(--text-muted)]">
                    <Search size={20} className="mx-auto" />
                    <p className="text-xs font-bold">{isAr ? 'لا توجد قوالب مطابقة لبحثك' : 'No templates match your search'}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>

        {/* Center: Preview Stage */}
        <main className="flex-1 bg-[var(--surface-page)] relative flex flex-col items-center justify-center p-8 transition-theme">
           <div 
             className="relative bg-black shadow-2xl overflow-hidden border border-[var(--border-default)] ring-8 ring-[var(--surface-subtle)] rounded-lg"
             style={{
               aspectRatio: `${videoSize.width} / ${videoSize.height}`,
               maxHeight: '100%',
               maxWidth: '100%'
             }}
           >
             <canvas 
               ref={canvasRef}
               width={videoSize.width}
               height={videoSize.height}
               className="w-full h-full object-contain"
             />
             
             {/* Overlay playback indicator */}
             {!isPlaying && (
               <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px] transition-all group">
                 <button 
                   onClick={() => setIsPlaying(true)}
                   className="w-16 h-16 rounded-full bg-[var(--accent)] text-white flex items-center justify-center shadow-2xl transform active:scale-95 transition-all cursor-pointer hover:scale-110"
                 >
                   <Play size={32} fill="currentColor" />
                 </button>
               </div>
             )}
           </div>

           {/* Preview Controls */}
           <div className="mt-6 flex items-center gap-6 bg-[var(--surface-card)] px-6 py-2.5 rounded-full border border-[var(--border-default)] shadow-lg transition-theme">
              <button className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors cursor-pointer"><SkipBack size={18} /></button>
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-10 h-10 rounded-full bg-[var(--accent)] text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-md"
              >
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
              </button>
              <button className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors cursor-pointer"><SkipForward size={18} /></button>
              
              <div className="w-px h-6 bg-[var(--border-default)] mx-2" />
              
              <div className="text-xs font-mono font-bold w-12 text-center tabular-nums text-[var(--accent)]">
                {currentTime.toFixed(1)}s
              </div>
              
              <div className="w-px h-6 bg-[var(--border-default)] mx-2" />
              
              <button className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors cursor-pointer"><Volume2 size={18} /></button>
           </div>
        </main>

        {/* Right Sidebar: Layer Controls */}
        <aside className="w-72 border-s border-[var(--border-default)] bg-[var(--surface-card)] flex flex-col transition-theme">
          <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between">
            <h2 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">{isAr ? 'الطبقات والحركة' : 'Layers & Motion'}</h2>
            <button className="p-1 hover:bg-[var(--surface-subtle)] rounded transition-colors"><Settings size={14} /></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
             {scenes[currentSceneIndex]?.elements.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                 <div className="w-12 h-12 rounded-full bg-[var(--surface-subtle)] flex items-center justify-center text-[var(--text-muted)]">
                    <Layers size={24} />
                 </div>
                 <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-tight">
                    {isAr ? 'لا توجد عناصر في هذا المشهد' : 'No elements in this scene'}
                 </p>
                 <button className="text-[10px] text-[var(--accent)] font-black hover:underline cursor-pointer">
                    + {isAr ? 'إضافة عنصر جديد' : 'Add element'}
                 </button>
               </div>
             ) : (
               scenes[currentSceneIndex]?.elements.map((el, i) => (
                 <div key={i} className="p-3 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:border-[var(--accent)]/50 transition-all cursor-pointer group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {el.type === 'text' ? <Type size={14} className="text-[var(--accent)]" /> : <Square size={14} className="text-[var(--accent)]" />}
                        <span className="text-[11px] font-bold truncate max-w-[100px]">{el.name || el.type}</span>
                      </div>
                      <button className="text-[var(--text-muted)] hover:text-[var(--fg-danger)] opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border-default)]">
                      <div className="space-y-1">
                        <span className="text-[9px] text-[var(--text-muted)] uppercase font-black tracking-tighter">{isAr ? 'التحريك' : 'Animation'}</span>
                        <div className="text-[10px] font-bold text-[var(--accent)]">Fade In</div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] text-[var(--text-muted)] uppercase font-black tracking-tighter">{isAr ? 'المدة' : 'Duration'}</span>
                        <div className="text-[10px] font-bold">1.5s</div>
                      </div>
                    </div>
                 </div>
               ))
             )}
          </div>
        </aside>
      </div>

      {/* Bottom Timeline */}
      <footer className="h-48 border-t border-[var(--border-default)] bg-[var(--surface-card)] flex flex-col transition-theme">
        <div className="h-8 border-b border-[var(--border-default)] flex items-center justify-between px-4 bg-[var(--surface-subtle)]">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-1.5 text-[10px] font-black text-[var(--text-muted)]">
               <Clock size={12} />
               <span>{currentTime.toFixed(2)} / {totalDuration.toFixed(2)}s</span>
             </div>
             <div className="h-3 w-px bg-[var(--border-default)]" />
             <div className="flex items-center gap-1.5 text-[10px] font-black text-[var(--accent)]">
               <Film size={12} />
               <span>{scenes.length} {isAr ? 'مشاهد' : 'Scenes'}</span>
             </div>
          </div>
          
          <div className="flex items-center gap-2">
             <button className="p-1 hover:bg-[var(--surface-inset)] rounded cursor-pointer transition-colors"><ZoomOut size={14} /></button>
             <div className="w-32 h-1.5 bg-[var(--border-default)] rounded-full relative overflow-hidden">
                <div className="absolute inset-y-0 left-0 w-1/2 bg-[var(--accent)] rounded-full" />
             </div>
             <button className="p-1 hover:bg-[var(--surface-inset)] rounded cursor-pointer transition-colors"><ZoomIn size={14} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-hidden relative custom-scrollbar">
           {/* Timeline Ruler: Fixed LTR for technical precision */}
           <div className="h-6 border-b border-[var(--border-default)] relative flex" style={{ width: `${totalDuration * 100}px`, direction: 'ltr' }}>
              {Array.from({ length: Math.ceil(totalDuration) + 1 }).map((_, i) => (
                <div key={i} className="absolute border-s border-[var(--border-default)] h-full flex flex-col justify-end pb-1" style={{ left: `${i * 100}px` }}>
                  <span className="text-[8px] font-mono text-[var(--text-muted)] ps-1">{i}s</span>
                </div>
              ))}
           </div>

           {/* Scenes Track */}
           <div className="flex items-center p-4 min-w-full" style={{ width: `${totalDuration * 100}px`, direction: 'ltr' }}>
              {scenes.map((scene, i) => (
                <div 
                  key={scene.id}
                  onClick={() => setCurrentSceneIndex(i)}
                  className={cn(
                    "relative h-20 border rounded-lg transition-all cursor-pointer group flex flex-col p-2 overflow-hidden",
                    currentSceneIndex === i 
                      ? "bg-[var(--accent)]/10 border-[var(--accent)] ring-2 ring-[var(--accent)]/20 shadow-md" 
                      : "bg-[var(--surface-subtle)] border-[var(--border-default)] hover:border-[var(--text-muted)]"
                  )}
                  style={{ width: `${scene.duration * 100}px` }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]">SCENE {i + 1}</span>
                    <span className="text-[8px] font-mono text-[var(--text-muted)]">{scene.duration}s</span>
                  </div>
                  
                  {/* Transition Indicator */}
                  {i < scenes.length - 1 && (
                    <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-[var(--surface-card)] border border-[var(--border-default)] flex items-center justify-center text-[8px] font-bold text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all">
                      <Zap size={10} fill="currentColor" />
                    </div>
                  )}

                  <div className="mt-auto flex gap-1">
                     {scene.elements.slice(0, 3).map((_, idx) => (
                       <div key={idx} className="w-full h-1 bg-[var(--accent)]/30 rounded-full" />
                     ))}
                  </div>
                </div>
              ))}
              
              <button 
                onClick={handleAddScene}
                className="ms-4 h-20 w-12 border-2 border-dashed border-[var(--border-default)] rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/5 transition-all cursor-pointer"
              >
                <Plus size={24} />
              </button>
           </div>

           {/* Playhead */}
           <div 
             className="absolute top-0 bottom-0 w-px bg-[var(--fg-danger)] z-20 pointer-events-none"
             style={{ 
               left: `${currentTime * 100}px`,
               transition: isPlaying ? 'none' : 'left 0.1s linear',
               direction: 'ltr'
             }}
           >
             <div className="w-3 h-3 bg-[var(--fg-danger)] rounded-full -translate-x-1.5 -translate-y-1.5 shadow-lg" />
           </div>
        </div>
      </footer>
    </div>
  );
};

export default ArtifactVideoEditor;
