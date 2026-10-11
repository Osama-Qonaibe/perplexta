import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { 
  Sparkles, Upload, Plus, ChevronRight, ChevronLeft, 
  Palette, LayoutTemplate, Sliders, ArrowUpRight, 
  Languages, Camera, Smartphone, Monitor, CreditCard,
  FolderHeart, Star, Trash2, Copy, Search, Filter, ShieldCheck,
  User as UserIcon, Crown, FolderOpen, Image as ImageIcon,
  FileText, Sparkle, RefreshCw, Layers, Check, ExternalLink,
  Edit3, ArrowRight, UploadCloud, Award, Play, Film, Video,
  Clock, Scissors, Zap, Music, X
} from 'lucide-react';
import { ThemeToggleButton } from '../components/ThemeToggleButton';
import { resolveImageUrl } from '../utils/imageResolver';
import { toast } from '@/design-system';
import { 
  StudioProject, 
  getUserStudioProjects, 
  saveUserStudioProject, 
  deleteUserStudioProject, 
  duplicateUserStudioProject, 
  toggleFavoriteStudioProject 
} from '../data/rataqProjects';
import { 
  StudioUploadItem, 
  getStoredStudioUploads,
  getUploadsFromDB,
  getStudioSessionFromDB,
  clearStudioSessionFromDB
} from '../data/rataqUploads';
import { 
  StudioBrandKit, 
  getStoredBrandKit 
} from '../data/rataqBrandKit';
import { PublicGuestLanding } from '../components/PublicGuestLanding';
import { RataqRepoTemplates, RataqRepoTemplate } from '../data/templates';
import { convertRataqTemplateToCanvasElements } from '../utils/rataqTemplateLoader';
import { CreatorRegistrationModal } from '../components/creators/CreatorRegistrationModal';
import { TemplatePreviewModal } from '../components/creators/TemplatePreviewModal';
import { getStoredCreators, getStoredMarketplaceTemplates, recordTemplateUse, MarketplaceTemplate } from '../data/rinexCreators';
import { UNIFIED_PUBLIC_TEMPLATES, PublicTemplateItem } from '../data/publicTemplatesData';

// Placeholder for the new ArtifactVideoEditor component
const ArtifactVideoEditor = React.lazy(() => import('../components/chat/artifacts/ArtifactVideoEditor'));

interface VideoPreset {
  id: string;
  nameAr: string;
  nameEn: string;
  width: number;
  height: number;
  icon: React.ReactNode;
  aspectRatio: string;
  category: 'social' | 'marketing' | 'reels' | 'custom';
}

const VIDEO_PRESETS: VideoPreset[] = [
  {
    id: 'tiktok_reels',
    nameAr: 'تيك توك وريلز (9:16)',
    nameEn: 'TikTok & Reels (9:16)',
    width: 1080,
    height: 1920,
    icon: <Smartphone className="w-5 h-5 text-rose-500" />,
    aspectRatio: '9:16',
    category: 'reels'
  },
  {
    id: 'youtube_video',
    nameAr: 'يوتيوب وعرض فيديو (16:9)',
    nameEn: 'YouTube & Video (16:9)',
    width: 1920,
    height: 1080,
    icon: <Monitor className="w-5 h-5 text-red-500" />,
    aspectRatio: '16:9',
    category: 'social'
  },
  {
    id: 'instagram_story',
    nameAr: 'ستوري إنستغرام (9:16)',
    nameEn: 'Instagram Story (9:16)',
    width: 1080,
    height: 1920,
    icon: <Camera className="w-5 h-5 text-pink-500" />,
    aspectRatio: '9:16',
    category: 'social'
  },
  {
    id: 'square_video',
    nameAr: 'فيديو مربع (1:1)',
    nameEn: 'Square Video (1:1)',
    width: 1080,
    height: 1080,
    icon: <Layers className="w-5 h-5 text-blue-500" />,
    aspectRatio: '1:1',
    category: 'social'
  }
];

export const VideoStudioPage: React.FC = () => {
  const { language, setLanguage, dir, theme, siteSettings, user, setIsAuthModalOpen } = useAppContext();
  const isAr = language === 'ar' || dir === 'rtl';
  const navigate = useNavigate();
  const location = useLocation();

  const [activeVideoArtifact, setActiveVideoArtifact] = useState<{ id: string; title: string; content: string } | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | undefined>(undefined);
  const [activeInitialElements, setActiveInitialElements] = useState<any[] | undefined>(undefined);
  const [activeInitialVideoSize, setActiveInitialVideoSize] = useState<{ width: number; height: number } | undefined>(undefined);

  // Restore Active Session
  useEffect(() => {
    async function loadInitial() {
      // 1. Handle Marketplace Template Navigation
      if (location.state && location.state.loadMarketplaceTemplate) {
        const tpl = location.state.loadMarketplaceTemplate;
        const newId = `video-project-${tpl.id}-${Date.now()}`;
        setActiveProjectId(newId);
        setActiveInitialElements(tpl.elements || []);
        const templateSize = (tpl.width && tpl.height) ? { width: tpl.width, height: tpl.height } : { width: 1080, height: 1920 };
        setActiveInitialVideoSize(templateSize);
        setActiveVideoArtifact({
          id: newId,
          title: isAr ? tpl.titleAr : tpl.titleEn,
          content: tpl.videoUrl || tpl.thumbnail || tpl.src
        });
        window.history.replaceState({}, document.title);
        return;
      }

      // 2. Handle Workspace ID deep link (e.g. /video-studio?id=proj_123)
      const params = new URLSearchParams(window.location.search);
      const workspaceId = params.get('id');
      if (workspaceId && user) {
        try {
          const token = localStorage.getItem('app_token');
          const res = await fetch(`/api/studio/workspaces/${workspaceId}`, {
            headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
          });
          if (res.ok) {
            const ws = await res.json();
            const projectData = ws.files['project.json'] ? JSON.parse(ws.files['project.json'].content) : {};
            setActiveProjectId(ws.id);
            setActiveVideoArtifact({ id: ws.id, title: ws.title, content: '' });
            setActiveInitialElements(projectData.scenes?.[0]?.elements || []);
            setActiveInitialVideoSize(projectData.videoSize);
          }
        } catch (e) {
          console.warn('Failed to load workspace:', e);
        }
      }
    }
    loadInitial();
  }, [location.state, isAr, user]);

  const handleCreateBlankVideo = (width: number, height: number, title: string) => {
    if (!user) {
      toast.error(isAr ? 'يرجى تسجيل الدخول لبدء مشروع فيديو' : 'Please log in to start a video project');
      setIsAuthModalOpen(true);
      return;
    }
    const newId = `video-${Date.now()}`;
    setActiveProjectId(newId);
    setActiveInitialElements([]);
    setActiveInitialVideoSize({ width, height });
    setActiveVideoArtifact({
      id: newId,
      title,
      content: ''
    });
    toast.success(isAr ? 'تم إنشاء مساحة عمل الفيديو' : 'Created video workspace');
  };

  const [videoSearchQuery, setVideoSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplateForPreview, setSelectedTemplateForPreview] = useState<any | null>(null);
  const [marketplaceVideoTemplates, setMarketplaceVideoTemplates] = useState<MarketplaceTemplate[]>([]);

  // Fetch Marketplace Video Templates
  useEffect(() => {
    async function loadVideoTemplates() {
      try {
        const templates = await getStoredMarketplaceTemplates();
        setMarketplaceVideoTemplates(templates);
      } catch (err) {
        console.error('Failed to load marketplace templates in VideoStudioPage:', err);
      }
    }
    loadVideoTemplates();
  }, []);

  // Filter & Memoize Video Templates with Keyword & Metadata Search
  const filteredVideoTemplates = useMemo(() => {
    // Combine Public Templates and Marketplace Templates
    const publicVideos = UNIFIED_PUBLIC_TEMPLATES.map(t => ({
      id: t.id,
      titleAr: t.titleAr,
      titleEn: t.titleEn,
      descriptionAr: (t as any).descriptionAr || t.tag || '',
      descriptionEn: (t as any).descriptionEn || t.tag || '',
      thumbnail: t.src,
      videoUrl: t.previewVideoUrl || t.videoUrl,
      previewVideoUrl: t.previewVideoUrl || t.videoUrl,
      category: t.category,
      categoryLabelAr: t.categoryLabelAr,
      dimensions: t.dimensions,
      width: t.width || (t.dimensions.includes('1920') ? 1080 : 1920),
      height: t.height || (t.dimensions.includes('1920') ? 1920 : 1080),
      creatorName: 'رينكس موشن',
      creatorUsername: 'rinex_motion',
      creatorAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=rinex_motion',
      rating: 4.9,
      usesCount: 1250,
      elements: t.elements || [],
      tag: t.tag
    }));

    const marketplaceMapped = marketplaceVideoTemplates.map(t => ({
      id: t.id,
      titleAr: t.titleAr,
      titleEn: t.titleEn,
      descriptionAr: t.descriptionAr,
      descriptionEn: t.descriptionEn,
      thumbnail: t.thumbnail,
      videoUrl: t.videoUrl || t.previewVideoUrl,
      previewVideoUrl: t.previewVideoUrl || t.videoUrl,
      category: t.category,
      categoryLabelAr: t.categoryLabelAr,
      dimensions: t.dimensions,
      width: t.dimensions.includes('1920') ? 1080 : 1080,
      height: t.dimensions.includes('1920') ? 1920 : 1080,
      creatorName: t.creatorName,
      creatorUsername: t.creatorUsername,
      creatorAvatar: t.creatorAvatar,
      rating: t.rating || 4.9,
      usesCount: t.usesCount || 500,
      elements: t.elements || [],
      tag: t.categoryLabelAr
    }));

    const allVideos = [...publicVideos, ...marketplaceMapped];

    return allVideos.filter(item => {
      // Category filter
      if (selectedCategory === 'reels' && !(item.category === 'reels' || item.category === 'tiktok' || item.dimensions.includes('1920') || item.dimensions.includes('9:16'))) return false;
      if (selectedCategory === 'youtube' && !(item.category === 'youtube' || item.dimensions.includes('16:9') || item.dimensions.includes('1280'))) return false;
      if (selectedCategory === 'square' && !(item.dimensions.includes('1080 × 1080') || item.width === item.height)) return false;
      if (selectedCategory === 'story' && !(item.category === 'story' || item.dimensions.includes('9:16'))) return false;

      // Real-time keyword & metadata search filter
      if (videoSearchQuery.trim()) {
        const query = videoSearchQuery.trim().toLowerCase();
        
        const titleMatch = (item.titleAr && item.titleAr.toLowerCase().includes(query)) ||
                           (item.titleEn && item.titleEn.toLowerCase().includes(query));
        const descMatch = (item.descriptionAr && item.descriptionAr.toLowerCase().includes(query)) ||
                          (item.descriptionEn && item.descriptionEn.toLowerCase().includes(query));
        const creatorMatch = (item.creatorName && item.creatorName.toLowerCase().includes(query)) ||
                             (item.creatorUsername && item.creatorUsername.toLowerCase().includes(query));
        const categoryMatch = (item.category && item.category.toLowerCase().includes(query)) ||
                              (item.categoryLabelAr && item.categoryLabelAr.toLowerCase().includes(query)) ||
                              (item.tag && item.tag.toLowerCase().includes(query)) ||
                              (item.dimensions && item.dimensions.toLowerCase().includes(query));
        
        // Match inside element text content
        const elementTextMatch = Array.isArray(item.elements) && item.elements.some((el: any) => 
          el.text && String(el.text).toLowerCase().includes(query)
        );

        return titleMatch || descMatch || creatorMatch || categoryMatch || elementTextMatch;
      }

      return true;
    });
  }, [selectedCategory, videoSearchQuery, marketplaceVideoTemplates]);

  const handleUseVideoTemplate = (tpl: any) => {
    if (!user) {
      toast.error(isAr ? 'يرجى تسجيل الدخول لتخصيص القالب' : 'Please log in to edit templates');
      setIsAuthModalOpen(true);
      return;
    }

    recordTemplateUse(tpl.id);
    const newId = `video-project-${tpl.id}-${Date.now()}`;
    setActiveProjectId(newId);
    setActiveInitialElements(tpl.elements || []);
    const templateSize = { width: tpl.width || 1080, height: tpl.height || 1920 };
    setActiveInitialVideoSize(templateSize);
    setActiveVideoArtifact({
      id: newId,
      title: isAr ? tpl.titleAr : tpl.titleEn,
      content: tpl.videoUrl || tpl.thumbnail
    });
    toast.success(isAr ? `✨ تم تحضير قالب "${tpl.titleAr}" في المحرر` : `✨ Initialized "${tpl.titleEn}" template`);
  };

  if (activeVideoArtifact) {
    return (
      <React.Suspense fallback={<div className="fixed inset-0 bg-[var(--surface-page)] flex items-center justify-center text-[var(--text-primary)]">Loading Editor...</div>}>
        <ArtifactVideoEditor
          artifact={activeVideoArtifact}
          projectId={activeProjectId}
          initialElements={activeInitialElements}
          initialVideoSize={activeInitialVideoSize}
          onClose={() => {
            setActiveVideoArtifact(null);
            navigate('/studio');
          }}
        />
      </React.Suspense>
    );
  }

  return (
    <div className="min-h-screen-safe bg-[var(--surface-page)] text-[var(--text-primary)] font-sans pb-28 md:pb-20 transition-theme flex flex-col">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[var(--surface-page)]/95 border-b border-[var(--border-default)] pt-[env(safe-area-inset-top,0px)] transition-theme shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button 
              type="button"
              onClick={() => navigate('/studio')} 
              className="w-8 h-8 rounded-shape-sm border border-[var(--border-default)] flex items-center justify-center cursor-pointer hover:bg-[var(--surface-subtle)]"
            >
              {dir === 'rtl' ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
            <h1 className="text-sm font-bold">{isAr ? 'رينكس موشن فيديو' : 'Rinex Motion Video'}</h1>
          </div>
          <div className="flex items-center gap-2">
             <ThemeToggleButton variant="icon-button" size="sm" />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-8">
        {/* Preset Selector */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black">{isAr ? 'ابدأ مشروع فيديو جديد' : 'Start New Video Project'}</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {VIDEO_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleCreateBlankVideo(preset.width, preset.height, isAr ? preset.nameAr : preset.nameEn)}
                className="p-4 rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] hover:border-[var(--accent)] transition-all cursor-pointer text-center space-y-3 group"
              >
                <div className="w-12 h-12 rounded-shape-sm bg-[var(--surface-subtle)] flex items-center justify-center mx-auto text-[var(--accent)] group-hover:scale-110 transition-transform">
                  {preset.icon}
                </div>
                <div>
                  <div className="text-xs font-bold">{isAr ? preset.nameAr : preset.nameEn}</div>
                  <div className="text-[10px] text-[var(--text-muted)]">{preset.width} x {preset.height}</div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Video Template Gallery Section */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black flex items-center gap-2">
                <Film className="w-5 h-5 text-[var(--accent)]" />
                <span>{isAr ? 'مكتبة قوالب الفيديو والموشن' : 'Motion Video Templates Gallery'}</span>
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {isAr 
                  ? 'اختر من بين مئات قوالب الفيديو الاحترافية القابلة للتعديل الفوري' 
                  : 'Choose from hundreds of customizable video templates'}
              </p>
            </div>

            <div className="text-xs font-bold px-3 py-1.5 rounded-full bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-secondary)] self-start sm:self-auto">
              {filteredVideoTemplates.length} {isAr ? 'قالب متوفر' : 'templates available'}
            </div>
          </div>

          {/* Real-time Text-based Search Input above Template Gallery */}
          <div className="space-y-3">
            <div className="relative w-full">
              <Search size={18} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
              <input
                type="text"
                value={videoSearchQuery}
                onChange={(e) => setVideoSearchQuery(e.target.value)}
                placeholder={isAr ? 'ابحث في قوالب الفيديو (الاسم، الكلمات المفتاحية، المبدع، أو نوع المنصة)...' : 'Search video templates by name, keywords, creator, or platform...'}
                className="w-full ps-11 pe-10 py-3 rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] focus:border-[var(--accent)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none transition-all shadow-xs"
              />
              {videoSearchQuery && (
                <button
                  type="button"
                  onClick={() => setVideoSearchQuery('')}
                  className="absolute end-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer p-1"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Category Chips Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
              {[
                { id: 'all', label: isAr ? 'جميع القوالب' : 'All Templates' },
                { id: 'reels', label: isAr ? 'ريلز وتيك توك (9:16)' : 'Reels & TikTok' },
                { id: 'youtube', label: isAr ? 'يوتيوب وعريض (16:9)' : 'YouTube & Wide' },
                { id: 'square', label: isAr ? 'فيديو مربع (1:1)' : 'Square Video' },
                { id: 'story', label: isAr ? 'ستوري وقصص' : 'Stories' }
              ].map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3.5 py-1.5 rounded-shape-sm text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                      isActive
                        ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-xs'
                        : 'bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] border-[var(--border-default)]'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Template Gallery Grid */}
          {filteredVideoTemplates.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredVideoTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="group relative bg-[var(--surface-card)] border border-[var(--border-default)] hover:border-[var(--accent)] rounded-shape-md overflow-hidden transition-all duration-300 shadow-2xs hover:shadow-md flex flex-col"
                >
                  {/* Video / Thumbnail Preview Container */}
                  <div 
                    className="relative aspect-[9/16] w-full bg-slate-900 overflow-hidden cursor-pointer"
                    onClick={() => setSelectedTemplateForPreview(tpl)}
                  >
                    {tpl.previewVideoUrl ? (
                      <video
                        src={tpl.previewVideoUrl}
                        poster={tpl.thumbnail}
                        muted
                        loop
                        playsInline
                        onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                        onMouseLeave={(e) => {
                          e.currentTarget.pause();
                          e.currentTarget.currentTime = 0;
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <img
                        src={tpl.thumbnail}
                        alt={tpl.titleAr}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80';
                        }}
                      />
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                    {/* Dimensions & Play Badge */}
                    <div className="absolute top-2.5 start-2.5 end-2.5 flex items-center justify-between z-10 pointer-events-none">
                      <span className="px-2 py-0.5 text-[9px] font-mono font-black bg-black/70 text-white rounded-shape-xs backdrop-blur-xs">
                        {tpl.dimensions}
                      </span>
                      <span className="w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center backdrop-blur-xs">
                        <Play size={10} fill="currentColor" />
                      </span>
                    </div>

                    {/* Hover Quick Edit Overlay */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4 z-20">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUseVideoTemplate(tpl);
                        }}
                        className="px-4 py-2 rounded-shape-sm bg-[var(--accent)] text-white text-xs font-black flex items-center gap-1.5 shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                      >
                        <Zap size={14} />
                        <span>{isAr ? 'تعديل بالقالب' : 'Edit Template'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Template Meta Info */}
                  <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-bold line-clamp-1 group-hover:text-[var(--accent)] transition-colors">
                        {isAr ? tpl.titleAr : tpl.titleEn}
                      </h3>
                      <p className="text-[10px] text-[var(--text-muted)] line-clamp-1 mt-0.5">
                        {isAr ? tpl.descriptionAr : tpl.descriptionEn}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[var(--border-default)] flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <img src={tpl.creatorAvatar} alt="" className="w-4 h-4 rounded-full" />
                        <span className="text-[var(--text-muted)] font-bold truncate max-w-[90px]">{tpl.creatorName}</span>
                      </div>
                      <span className="text-[var(--accent)] font-bold flex items-center gap-1">
                        <Film size={11} />
                        <span>{tpl.categoryLabelAr || 'موشن'}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 rounded-shape-lg border border-[var(--border-default)] bg-[var(--surface-card)] text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[var(--surface-subtle)] flex items-center justify-center mx-auto text-[var(--text-muted)]">
                <Search size={24} />
              </div>
              <h3 className="text-sm font-bold">
                {videoSearchQuery 
                  ? (isAr ? `لا توجد قوالب فيديو مطابقة لـ "${videoSearchQuery}"` : `No video templates match "${videoSearchQuery}"`)
                  : (isAr ? 'لا توجد قوالب متوفرة في هذه الفئة' : 'No templates available in this category')}
              </h3>
              <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                {isAr ? 'جرب البحث بكلمات مختلفة مثل: "ريلز"، "سفر"، "تخفيضات"، أو "يوتيوب".' : 'Try searching with keywords like "Reels", "Travel", "Sale", or "YouTube".'}
              </p>
              <button
                onClick={() => {
                  setVideoSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="px-4 py-2 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] text-xs font-bold cursor-pointer transition-colors"
              >
                {isAr ? 'إعادة ضبط البحث' : 'Reset Search'}
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Template Preview Modal */}
      {selectedTemplateForPreview && (
        <TemplatePreviewModal
          template={selectedTemplateForPreview}
          onClose={() => setSelectedTemplateForPreview(null)}
        />
      )}
    </div>
  );
};

export default VideoStudioPage;
