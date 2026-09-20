import { secureStorage } from "@/lib/storage";
import { getPostShareUrl, getPageShareUrl, getPostShareText, getPageShareText } from "@/utils/shareUtils";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useModalScrollLock } from '../hooks/useModalScrollLock';
import { useNavigate, useLocation, useParams, NavLink } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import {
  Megaphone, Plus, Search, Heart, MessageSquare, Share2, Bookmark, Gift,
  Phone, Video, CheckCircle2, Eye, Sparkles,
  Send, X, Wallet, Tag, MessageCircle, Building2, MapPin, Globe, Type,
  UserCheck, UserPlus, Inbox, ArrowRight, ArrowLeft, ShieldCheck, Camera, User, Calendar,
  Image as ImageIcon, Filter, ChevronLeft, ChevronRight, Layers, Loader2, BarChart2, ArrowUp, ArrowDown, RefreshCw, Rocket,
  Radio, Clapperboard, Bell, Menu, SlidersHorizontal, Trash2, Ban, Volume2, VolumeX,
  Smile, Users, Compass, ChevronDown, Check, Navigation, Lock, Scissors, Edit2, Upload,
  AtSign, Hash, Settings, Cpu, ArrowUpDown, Languages, MessageSquareText, Copy, Briefcase, Link, ExternalLink, CheckCircle
} from 'lucide-react';
import { resolveImageUrl } from '../utils/imageResolver';
import { NotificationIconRenderer } from '../utils/imageProcessor';
import { motion, AnimatePresence } from 'motion/react';
import { BulletinAd, BulletinAdComment, BulletinPage, MediaGalleryItem } from '../../server/db/types';
import { UserAdAnalyticsView } from '../components/UserAdAnalyticsView';
import { PostFeed } from '../components/PostFeed';
import { BoardFeed } from '../components/bulletin/BoardFeed';
import { SavedPostsTab } from '../components/bulletin/SavedPostsTab';
import { InquiriesTab } from '../components/bulletin/InquiriesTab';
import { LiveStreamModal } from '../components/bulletin/LiveStreamModal';
import { AdMessengerHub } from '../components/AdMessengerHub';
import { BoostPostModal } from '../components/BoostPostModal';
import { RecommendationWidget } from '../components/RecommendationWidget';
import { MediaFormatPlayer } from '../components/MediaFormatPlayer';
import { VideoTrimmerModal } from '../components/VideoTrimmerModal';
import { VideoPreviewer } from '../components/VideoPreviewer';
import { ReelsFeed } from '../components/ReelsFeed';
import { StoryUploadModal } from '../components/StoryUploadModal';
import { StoryViewerModal } from '../components/StoryViewerModal';
import { VideoFrameCapture } from '../components/VideoFrameCapture';
import { MediaManagerModal } from '../components/MediaManagerModal';
import { ComposerMediaPreview } from '../components/ComposerMediaPreview';
import { MediaLightboxModal, LightboxMediaItem } from '../components/MediaLightboxModal';
import { triggerHaptic } from '../utils/haptics';
import { BulletinAvatar } from '../components/BulletinAvatar';
import { ImageUploadDropzone } from '../components/ImageUploadDropzone';
import { optimizeImageUpload, RECOMMENDED_IMAGE_SPECS } from '../utils/imageOptimizer';
import { extractVideoMetadata, extractVideoThumbnail, getRecommendedDimensions, getMediaUrl, compressAndResizeImage, extractVideoUrlFromAd } from '../utils/mediaUtils';
import { stopAllMedia, getGlobalMuteState, setGlobalMuteState } from '../utils/mediaCoordinator';
import { SOCIAL_COLORS } from '../constants/socialColors';
import { isPathBlocked } from '../utils/sectionVisibility';
import { ThemeToggleButton } from '../components/ThemeToggleButton';
import { AppModal, toast, useConfirm } from '@/design-system';
import { SearchableSelect } from '../components/SearchableSelect';

const PALESTINE_CITIES = [
  'القدس الشريف',
  'غزة',
  'رام الله والبيرة',
  'نابلس',
  'الخليل',
  'جنين',
  'طولكرم',
  'بيت لحم',
  'أريحا والأغوار',
  'قلقيلية',
  'سلفيت',
  'طوباس',
  'خان يونس',
  'رفح'
];

const VIRALBOOK_CATEGORIES = [
  { id: 'all', labelAr: 'كافة الفئات', labelEn: 'All Categories' },
  { id: 'تجارة إلكترونية / E-Commerce', labelAr: 'تجارة إلكترونية', labelEn: 'E-Commerce' },
  { id: 'عقارات / Real Estate', labelAr: 'عقارات', labelEn: 'Real Estate' },
  { id: 'سيارات ومحركات / Vehicles', labelAr: 'سيارات ومحركات', labelEn: 'Vehicles' },
  { id: 'وظائف وتوظيف / Jobs', labelAr: 'وظائف وتوظيف', labelEn: 'Jobs & Careers' },
  { id: 'خدمات وأعمال / Services', labelAr: 'خدمات وأعمال', labelEn: 'Services' },
  { id: 'أجهزة وإلكترونيات / Electronics', labelAr: 'أجهزة وإلكترونيات', labelEn: 'Electronics' },
  { id: 'أزياء وموضة / Fashion', labelAr: 'أزياء وموضة', labelEn: 'Fashion' },
  { id: 'أطعمة ومطاعم / Food & Dining', labelAr: 'أطعمة ومطاعم', labelEn: 'Food & Dining' },
];

const VIRALBOOK_SORT_OPTIONS = [
  { id: 'latest', labelAr: 'الأحدث', labelEn: 'Latest' },
  { id: 'popular', labelAr: 'الأكثر تفاعلاً', labelEn: 'Popular' },
];

interface LocationSearchResult {
  display_name: string;
  city: string;
  state?: string;
  country: string;
  country_code?: string;
  lat: string;
  lon: string;
}

const getCountryFlagEmoji = (countryCode?: string, countryName?: string): string => {
  if (countryCode && countryCode.length === 2) {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  }
  if (!countryName) return '🌐';
  if (countryName.includes('فلسطين')) return '🇵🇸';
  if (countryName.includes('الأردن')) return '🇯🇴';
  if (countryName.includes('السعودية')) return '🇸🇦';
  if (countryName.includes('الإمارات')) return '🇦🇪';
  if (countryName.includes('مصر')) return '🇪🇬';
  if (countryName.includes('قطر')) return '🇶🇦';
  if (countryName.includes('الكويت')) return '🇰🇼';
  if (countryName.includes('عمان') || countryName.includes('عُمان')) return '🇴🇲';
  if (countryName.includes('البحرين')) return '🇧🇭';
  if (countryName.includes('العراق')) return '🇮🇶';
  if (countryName.includes('لبنان')) return '🇱🇧';
  if (countryName.includes('سوريا')) return '🇸🇾';
  if (countryName.includes('اليمن')) return '🇾🇪';
  if (countryName.includes('المغرب')) return '🇲🇦';
  if (countryName.includes('الجزائر')) return '🇩🇿';
  if (countryName.includes('تونس')) return '🇹🇳';
  if (countryName.includes('السودان')) return '🇸🇩';
  if (countryName.includes('تركيا')) return '🇹🇷';
  if (countryName.includes('المملكة المتحدة') || countryName.includes('بريطانيا')) return '🇬🇧';
  if (countryName.includes('الولايات المتحدة') || countryName.includes('أمريكا')) return '🇺🇸';
  if (countryName.includes('ألمانيا')) return '🇩🇪';
  if (countryName.includes('فرنسا')) return '🇫🇷';
  if (countryName.includes('كندا')) return '🇨🇦';
  return '🌍';
};

const COUNTRIES_CITIES_DATA: Record<string, string[]> = {
  'فلسطين': PALESTINE_CITIES,
  'الأردن': ['عمان', 'الزرقاء', 'إربد', 'العقبة', 'السلط', 'مادبا', 'المفرق', 'الكرك', 'الطفيلة', 'معان', 'عجلون', 'جرش'],
  'المملكة العربية السعودية': ['الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'الخبر', 'الأحساء', 'تبوك', 'أبها', 'جازان', 'نجران', 'حائل', 'القصيم'],
  'الإمارات العربية المتحدة': ['دبي', 'أبوظبي', 'الشارقة', 'عجمان', 'رأس الخيمة', 'الفجيرة', 'أم القيوين', 'العين'],
  'مصر': ['القاهرة', 'الإسكندرية', 'الجيزة', 'شرم الشيخ', 'الغردقة', 'بورسعيد', 'السويس', 'المنصورة', 'الأقصر', 'أسوان'],
  'قطر': ['الدوحة', 'الريان', 'الوكرة', 'الخور', 'أم صلال'],
  'الكويت': ['الكويت العاصمة', 'حولي', 'الفروانية', 'الأحمدي', 'الجهراء'],
  'سلطنة عمان': ['مسقط', 'صلالة', 'صحار', 'نزوى', 'صور'],
  'البحرين': ['المنامة', 'المحرق', 'الرفاع', 'مدينة عيسى'],
  'العراق': ['بغداد', 'أربيل', 'البصرة', 'الموصل', 'النجف', 'كربلاء'],
  'لبنان': ['بيروت', 'طرابلس', 'صيدا', 'صور', 'زحلة'],
  'سوريا': ['دمشق', 'حلب', 'حمص', 'اللاذقية', 'حماة'],
  'اليمن': ['صنعاء', 'عدن', 'تعز', 'الحديدة', 'المكلا'],
  'المغرب': ['الرباط', 'الدار البيضاء', 'مراكش', 'فاس', 'طنجة'],
  'الجزائر': ['الجزائر العاصمة', 'وهران', 'قسنطينة', 'عنابة'],
  'تونس': ['تونس العاصمة', 'صفاقس', 'سوسة', 'بنزرت'],
  'السودان': ['الخرطوم', 'أم درمان', 'بورتسودان'],
  'تركيا': ['إسطنبول', 'أنقرة', 'إزمير', 'أنطاليا', 'بورصة'],
  'المملكة المتحدة': ['لندن', 'مانشستر', 'برمنهام', 'ليفربول', 'إدنبرة'],
  'الولايات المتحدة': ['نيويورك', 'لوس أنجلوس', 'شيكاغو', 'ميامي', 'واشنطن']
};

const FEELINGS = [
  { id: 'happy', labelAr: 'سعيد', labelEn: 'Happy', icon: '😊' },
  { id: 'blessed', labelAr: 'مبارك', labelEn: 'Blessed', icon: '😇' },
  { id: 'loved', labelAr: 'محبوب', labelEn: 'Loved', icon: '🥰' },
  { id: 'excited', labelAr: 'متحمس', labelEn: 'Excited', icon: '🤩' },
  { id: 'cool', labelAr: 'رائع', labelEn: 'Cool', icon: '😎' },
  { id: 'grateful', labelAr: 'ممتن', labelEn: 'Grateful', icon: '🙏' },
  { id: 'productive', labelAr: 'منتج', labelEn: 'Productive', icon: '💪' },
  { id: 'inspired', labelAr: 'ملهم', labelEn: 'Inspired', icon: '💡' },
];

export const BulletinBoardPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: routeIdParam, subPath, subId } = useParams<{ id?: string; subPath?: string; subId?: string }>();
  const { language, setLanguage, user, token, setIsAuthModalOpen, theme, siteSettings, isMobile, refreshUser, t } = useAppContext();
  const isRtl = language === 'ar';

  const activeLogo = (theme === 'light' && siteSettings?.logoLightBase64)
    ? siteSettings.logoLightBase64
    : (siteSettings?.logoBase64 || siteSettings?.logoLightBase64 || null);

  const resolveActiveTabFromLocation = (): 'board' | 'reels' | 'pages' | 'inquiries' | 'my_ads' | 'analytics' | 'saved' => {
    try {
      if (typeof window !== 'undefined') {
        const path = window.location.pathname.toLowerCase();
        const searchParams = new URLSearchParams(window.location.search);
        const urlTab = searchParams.get('tab');

        if (urlTab === 'inquiries' || path.includes('/inquiries')) return 'inquiries';
        if (path.startsWith('/reels') || path.includes('/reels')) return 'reels';
        if (path.includes('/pages')) return 'pages';
        if (path.includes('/my-ads') || path.includes('/my_ads')) return 'my_ads';
        if (path.includes('/analytics')) return 'analytics';
        if (path.includes('/saved')) return 'saved';

        if (path === '/viralbook' || path === '/bulletin' || path === '/viralbook/' || path === '/bulletin/') {
          if (urlTab && urlTab !== 'board') {
            const validTabs = ['board', 'reels', 'pages', 'inquiries', 'my_ads', 'analytics', 'saved'];
            if (validTabs.includes(urlTab)) return urlTab as any;
          }
          return 'board';
        }

        const validTabs = ['board', 'reels', 'pages', 'inquiries', 'my_ads', 'analytics', 'saved'];
        if (urlTab && validTabs.includes(urlTab)) {
          return urlTab as any;
        }

        const savedTab = sessionStorage.getItem('perplexta_bulletin_active_tab') || localStorage.getItem('perplexta_bulletin_active_tab');
        if (savedTab && validTabs.includes(savedTab)) {
          return savedTab as any;
        }
      }
    } catch (e) {
    }
    return 'board';
  };

  const [activeTab, setActiveTab] = useState<'board' | 'reels' | 'pages' | 'inquiries' | 'my_ads' | 'analytics' | 'saved'>(resolveActiveTabFromLocation);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const urlTab = searchParams.get('tab');
    const path = location.pathname.toLowerCase();

    if (urlTab === 'inquiries' || path.includes('/inquiries')) {
      if (activeTab !== 'inquiries') {
        setActiveTab('inquiries');
        fetchInquiries();
      }
    } else if (path === '/viralbook' || path === '/bulletin' || path === '/viralbook/' || path === '/bulletin/') {
      if (activeTab !== 'board' && !urlTab) {
        setActiveTab('board');
      }
    }

    const adIdParam = searchParams.get('ad_id');
    if (adIdParam) {
      const targetAdId = parseInt(adIdParam, 10);
      if (!isNaN(targetAdId)) {
        setTimeout(() => {
          const el = document.getElementById(`bulletin-ad-${targetAdId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('ring-2', 'ring-accent');
            setTimeout(() => el.classList.remove('ring-2', 'ring-accent'), 2500);
          }
        }, 600);
      }
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    try {
      sessionStorage.setItem('perplexta_bulletin_active_tab', activeTab);
      localStorage.setItem('perplexta_bulletin_active_tab', activeTab);
      if (typeof window !== 'undefined') {
        const tabToPathMap: Record<string, string> = {
          board: '/viralbook',
          reels: '/viralbook/reels',
          pages: '/viralbook/pages',
          inquiries: '/viralbook/inquiries',
          my_ads: '/viralbook/my-ads',
          analytics: '/viralbook/analytics',
          saved: '/viralbook/saved'
        };

        const targetPath = tabToPathMap[activeTab] || '/viralbook';
        const currentPath = window.location.pathname;

        const isExactOrSubMatch = currentPath === targetPath ||
          (activeTab === 'board' && (currentPath === '/viralbook' || currentPath === '/bulletin' || /^\/(?:viralbook|bulletin)\/\d+$/.test(currentPath))) ||
          (activeTab === 'reels' && (currentPath.startsWith('/viralbook/reels') || currentPath.startsWith('/reels')));

        if (!isExactOrSubMatch) {
          window.history.replaceState(null, '', targetPath);
        }

        if (window.location.search) {
          const url = new URL(window.location.href);
          if (url.searchParams.has('tab')) {
            url.searchParams.delete('tab');
            const cleanSearch = url.searchParams.toString();
            const newCleanUrl = url.pathname + (cleanSearch ? `?${cleanSearch}` : '') + url.hash;
            window.history.replaceState(null, '', newCleanUrl);
          }
        }
      }
    } catch (e) {
    }
  }, [activeTab]);

  useEffect(() => {
    let active = true;
    let timer: NodeJS.Timeout;
    let timer2: NodeJS.Timeout;

    const restoreScroll = () => {
      try {
        const savedScroll = sessionStorage.getItem(`perplexta_scroll_${activeTab}`);
        if (savedScroll) {
          const scrollY = parseInt(savedScroll, 10);
          if (!isNaN(scrollY) && scrollY > 0) {
            const container = document.querySelector('.main-scroll-container');
            if (container) {
              container.scrollTop = scrollY;
            } else {
              window.scrollTo({ top: scrollY, behavior: 'instant' as any });
            }
          }
        }
      } catch (e) {}
    };

    timer = setTimeout(restoreScroll, 50);
    timer2 = setTimeout(restoreScroll, 150);

    const handleScroll = (e: Event) => {
      if (!active) return;
      try {
        const target = e.target as HTMLElement;
        if (target && (target.classList?.contains('main-scroll-container') || target === document.documentElement)) {
          if (!document.body.classList.contains('layout-locked') && !document.body.classList.contains('workspace-focus-mode')) {
            const scrollTop = target.scrollTop || window.scrollY;
            sessionStorage.setItem(`perplexta_scroll_${activeTab}`, String(scrollTop));
          }
        }
      } catch (e) {}
    };

    document.addEventListener('scroll', handleScroll, { capture: true, passive: true });

    return () => {
      active = false;
      clearTimeout(timer);
      clearTimeout(timer2);
      document.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, [activeTab]);
  const [activeReelModalId, setActiveReelModalId] = useState<number | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const [messagingAdId, setMessagingAdId] = useState<number | null>(null);
  const [insightsAdId, setInsightsAdId] = useState<number | null>(null);

  const [ads, setAds] = useState<BulletinAd[]>([]);
  const [myAds, setMyAds] = useState<BulletinAd[]>([]);
  const [savedAds, setSavedAds] = useState<BulletinAd[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [isStoryViewerOpen, setIsStoryViewerOpen] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [previewingVideoStoryId, setPreviewingVideoStoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingSaved, setLoadingSaved] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>(() => {
    return secureStorage.getSync('perplexta_user_country') || 'فلسطين';
  });
  const [selectedCity, setSelectedCity] = useState<string>(() => {
    return secureStorage.getSync('perplexta_user_city') || 'all';
  });
  const [selectedRadius, setSelectedRadius] = useState<string>(() => {
    return secureStorage.getSync('perplexta_user_radius') || '10';
  });
  const [isLocationFlyoutOpen, setIsLocationFlyoutOpen] = useState<boolean>(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState<string>('');
  const [autocompleteResults, setAutocompleteResults] = useState<LocationSearchResult[]>([]);
  const [isSearchingGeoLocation, setIsSearchingGeoLocation] = useState<boolean>(false);
  const [isDetectingGps, setIsDetectingGps] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState<boolean>(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState<boolean>(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const rawLogo = (theme === 'light' && siteSettings?.logoLightBase64)
    ? siteSettings?.logoLightBase64
    : siteSettings?.logoBase64;

  const currentCategoryLabel = useMemo(() => {
    const found = VIRALBOOK_CATEGORIES.find(c => c.id === selectedCategory);
    if (!found || found.id === 'all') {
      return isRtl ? 'الفئات' : 'Categories';
    }
    return isRtl ? found.labelAr : found.labelEn;
  }, [selectedCategory, isRtl]);

  const currentSortLabel = useMemo(() => {
    const found = VIRALBOOK_SORT_OPTIONS.find(s => s.id === sortBy);
    return found ? (isRtl ? found.labelAr : found.labelEn) : (isRtl ? 'الأحدث' : 'Latest');
  }, [sortBy, isRtl]);

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; isOpen: boolean }>({ x: 0, y: 0, isOpen: false });

  const combinedReelsAds = useMemo(() => {
    const map = new Map<number, BulletinAd>();
    [...ads, ...myAds, ...savedAds].forEach(a => {
      if (!a || !a.id || a.ad_format === 'story' || (a as any).is_story) return;
      const vUrl = extractVideoUrlFromAd(a);
      if (vUrl) {
        map.set(Number(a.id), { ...a, video_url: vUrl });
      }
    });

    if (activeReelModalId !== null && !map.has(Number(activeReelModalId))) {
      const targetAd = ads.find(a => Number(a.id) === Number(activeReelModalId)) ||
                       myAds.find(a => Number(a.id) === Number(activeReelModalId)) ||
                       savedAds.find(a => Number(a.id) === Number(activeReelModalId));
      if (targetAd) {
        const vUrl = extractVideoUrlFromAd(targetAd) || targetAd.video_url || targetAd.image_url || '';
        map.set(Number(targetAd.id), { ...targetAd, video_url: vUrl });
      }
    }
    return Array.from(map.values());
  }, [ads, myAds, savedAds, activeReelModalId]);

  useEffect(() => {
    const handleOpenReelFullscreen = (e: any) => {
      const { adId, url } = e.detail || {};
      if (adId) {
        setActiveReelModalId(adId);
      } else if (url) {
        const found = combinedReelsAds.find(a => a.video_url === url || extractVideoUrlFromAd(a) === url);
        if (found) {
          setActiveReelModalId(found.id);
        } else if (ads.length > 0) {
          setActiveReelModalId(ads[0].id);
        } else {
          setActiveTab('reels');
        }
      } else {
        setActiveTab('reels');
      }
    };

    window.addEventListener('open-reel-fullscreen', handleOpenReelFullscreen as EventListener);
    return () => {
      window.removeEventListener('open-reel-fullscreen', handleOpenReelFullscreen as EventListener);
    };
  }, [combinedReelsAds, ads]);

  useEffect(() => {
    if (!locationSearchQuery || locationSearchQuery.trim().length < 2) {
      setAutocompleteResults([]);
      setIsSearchingGeoLocation(false);
      return;
    }

    setIsSearchingGeoLocation(true);
    const timer = setTimeout(async () => {
      try {
        const query = encodeURIComponent(locationSearchQuery.trim());
        const lang = isRtl ? 'ar' : 'en';
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${query}&addressdetails=1&limit=8&accept-language=${lang}`
        );
        if (res.ok) {
          const data = await res.json();
          const mapped: LocationSearchResult[] = data.map((item: any) => {
            const addr = item.address || {};
            const cityName =
              addr.city ||
              addr.town ||
              addr.village ||
              addr.municipality ||
              addr.suburb ||
              addr.county ||
              item.name ||
              locationSearchQuery;
            const countryName = addr.country || '';
            const stateName = addr.state || addr.region || '';
            return {
              display_name: item.display_name,
              city: cityName,
              state: stateName,
              country: countryName,
              country_code: addr.country_code,
              lat: item.lat,
              lon: item.lon,
            };
          });
          setAutocompleteResults(mapped);
        }
      } catch (err) {
        console.error('Location autocomplete error:', err);
      } finally {
        setIsSearchingGeoLocation(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [locationSearchQuery, isRtl]);

  const handleSelectAutocompleteResult = (result: LocationSearchResult) => {
    if (result.country) {
      setSelectedCountry(result.country);
      secureStorage.set('perplexta_user_country', result.country);
    }
    setSelectedCity(result.city);
    secureStorage.set('perplexta_user_city', result.city);
    setLocationSearchQuery('');
    setAutocompleteResults([]);
    setIsLocationFlyoutOpen(false);
    toast.success(
      isRtl
        ? `📍 تم تحديد المدينة الموثّقة: ${result.city} (${result.country || ''})`
        : `📍 Location set: ${result.city}, ${result.country || ''}`
    );
  };

  const getAvailableCities = () => {
    let list: string[] = [];
    if (selectedCountry === 'all') {
      Object.values(COUNTRIES_CITIES_DATA).forEach((cities) => {
        list.push(...cities);
      });
    } else if (COUNTRIES_CITIES_DATA[selectedCountry]) {
      list = COUNTRIES_CITIES_DATA[selectedCountry];
    } else {
      list = PALESTINE_CITIES;
    }

    const uniqueCities = Array.from(new Set(list));

    if (locationSearchQuery.trim()) {
      const q = locationSearchQuery.toLowerCase().trim();
      return uniqueCities.filter((c) => c.toLowerCase().includes(q));
    }

    return uniqueCities;
  };

  const handleSelectCity = (city: string, radius = selectedRadius) => {
    setSelectedCity(city);
    setSelectedRadius(radius);
    secureStorage.set('perplexta_user_city', city);
    secureStorage.set('perplexta_user_radius', radius);
    setIsLocationFlyoutOpen(false);
    toast.success(
      isRtl
        ? `📍 تم اختيار المنطقة: ${city === 'all' ? 'كافة المحافظات' : city}`
        : `📍 Location set: ${city === 'all' ? 'All Regions' : city}`
    );
  };

  const handleDetectGpsLocation = () => {
    if (!navigator.geolocation) {
      toast.error(isRtl ? 'خاصية تحديد الموقع غير مدعومة في جهازك' : 'Geolocation is not supported');
      return;
    }
    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar`);
          const data = await res.json();
          const detectedCity = data.address?.city || data.address?.town || data.address?.state || data.address?.county || 'القدس الشريف';

          handleSelectCity(detectedCity);
          toast.success(isRtl ? `🎯 تم تحديد موقعك الحالي بنجاح: ${detectedCity}` : `🎯 Location detected: ${detectedCity}`);
        } catch (e) {
          handleSelectCity('القدس الشريف');
          toast.success(isRtl ? '🎯 تم تحديد موقعك: القدس الشريف' : '🎯 Location set to Jerusalem');
        } finally {
          setIsDetectingGps(false);
        }
      },
      (err) => {
        setIsDetectingGps(false);
        toast.error(isRtl ? 'تعذر الحصول على إذن الموقع من الجهاز' : 'Failed to get location permission');
      },
      { timeout: 8000 }
    );
  };

  const [pagesList, setPagesList] = useState<BulletinPage[]>([]);
  const [myPagesList, setMyPagesList] = useState<BulletinPage[]>([]);
  const [pagesLoading, setPagesLoading] = useState<boolean>(false);

  const [selectedPageDetail, setSelectedPageDetail] = useState<{ page: BulletinPage; ads: BulletinAd[] } | null>(null);
  const [selectedUserDetail, setSelectedUserDetail] = useState<{
    user: {
      id: number;
      name: string;
      avatar?: string;
      cover_image?: string | null;
      bio?: string;
      occupation?: string;
      location?: string;
      website_url?: string;
      custom_domain?: string;
      is_domain_verified?: boolean;
      social_links?: Record<string, string>;
      verified_links?: string[];
      email?: string;
      kyc_status?: string;
      role?: string;
      created_at?: Date | string;
      posts_count?: number;
      pages_count?: number;
    };
    ads: BulletinAd[];
  } | null>(null);
  const [pageDetailTab, setPageDetailTab] = useState<'ads' | 'about' | 'media'>('ads');

  const [isProfileEditModalOpen, setIsProfileEditModalOpen] = useState<boolean>(false);
  const [isEditPageModalOpen, setIsEditPageModalOpen] = useState<boolean>(false);
  const [editingPageData, setEditingPageData] = useState<BulletinPage | null>(null);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState<boolean>(false);
  const [isSubmittingPageEdit, setIsSubmittingPageEdit] = useState<boolean>(false);

  const [profileFormData, setProfileFormData] = useState({
    name: '',
    avatar: '',
    cover_image: '',
    email: '',
    occupation: '',
    location: '',
    bio: '',
    website_url: '',
    custom_domain: '',
    is_domain_verified: false,
    social_links: {
      facebook: '',
      instagram: '',
      linkedin: '',
      twitter: '',
      whatsapp: '',
      youtube: '',
      github: ''
    },
    verified_links: [] as string[],
    custom_instructions: '',
    language: 'ar',
    theme: 'light'
  });

  const [kycFullName, setKycFullName] = useState<string>('');
  const [kycIDNumber, setKycIDNumber] = useState<string>('');
  const [kycSelfieUrl, setKycSelfieUrl] = useState<string>('');
  const [kycTab, setKycTab] = useState<'info' | 'kyc'>('info');

  useEffect(() => {
    if (isProfileEditModalOpen && user) {
      setProfileFormData({
        name: user.name || '',
        avatar: user.avatar || '',
        cover_image: user.cover_image || '',
        email: user.email || '',
        occupation: user.occupation || '',
        location: user.location || '',
        bio: user.bio || user.custom_instructions || '',
        website_url: user.website_url || '',
        custom_domain: user.custom_domain || '',
        is_domain_verified: !!user.is_domain_verified,
        social_links: {
          facebook: user.social_links?.facebook || '',
          instagram: user.social_links?.instagram || '',
          linkedin: user.social_links?.linkedin || '',
          twitter: user.social_links?.twitter || '',
          whatsapp: user.social_links?.whatsapp || '',
          youtube: user.social_links?.youtube || '',
          github: user.social_links?.github || ''
        },
        verified_links: user.verified_links || [],
        custom_instructions: user.custom_instructions || '',
        language: (user as any).language || language || 'ar',
        theme: (user as any).theme || theme || 'light'
      });
    }
  }, [isProfileEditModalOpen, user]);

  const [editPageFormData, setEditPageFormData] = useState({
    name: '',
    category: '',
    city: '',
    address: '',
    description: '',
    avatar_url: '',
    cover_url: '',
    whatsapp_number: '',
    phone_number: '',
    website_url: ''
  });
  const [editPageManagers, setEditPageManagers] = useState<any[]>([]);
  const [newManagerEmail, setNewManagerEmail] = useState<string>('');
  const [newManagerRole, setNewManagerRole] = useState<'full' | 'limited'>('limited');

  useEffect(() => {
    if (editingPageData) {
      setEditPageFormData({
        name: editingPageData.name || '',
        category: editingPageData.category || 'تجارة إلكترونية / E-Commerce',
        city: editingPageData.city || 'غزة',
        address: editingPageData.address || '',
        description: editingPageData.description || '',
        avatar_url: editingPageData.avatar_url || '',
        cover_url: editingPageData.cover_url || '',
        whatsapp_number: editingPageData.whatsapp_number || '',
        phone_number: editingPageData.phone_number || '',
        website_url: editingPageData.website_url || ''
      });
      let managersList: any[] = [];
      if (editingPageData.managers) {
        try {
          managersList = typeof editingPageData.managers === 'string'
            ? JSON.parse(editingPageData.managers)
            : editingPageData.managers;
        } catch (e) {
          managersList = [];
        }
      }
      setEditPageManagers(Array.isArray(managersList) ? managersList : []);
    }
  }, [editingPageData]);

  useEffect(() => {
    if (user && isProfileEditModalOpen) {
      setKycFullName('');
      setKycIDNumber('');
      setKycSelfieUrl('');
      setKycTab('info');
    }
  }, [user, isProfileEditModalOpen]);

  const [inquiriesList, setInquiriesList] = useState<any[]>([]);
  const [inquiriesSearchTerm, setInquiriesSearchTerm] = useState<string>('');
  const [inquiriesLoading, setInquiriesLoading] = useState<boolean>(false);
  const [selectedInboxAd, setSelectedInboxAd] = useState<BulletinAd | null>(null);

  useEffect(() => {
    if (token) {
      fetchMyAds();
      fetchInquiries();
      fetchMyPages();
      fetchWallet();
    } else {
      setMyAds([]);
      setInquiriesList([]);
      setMyPagesList([]);
      setWalletBalance(0);
    }
  }, [token]);

  useEffect(() => {
    const handleOpenInquiries = () => {
      setSelectedPageDetail(null);
      setActiveTab('inquiries');
      fetchInquiries();
    };
    const handleInquiriesUpdated = () => {
      fetchInquiries();
    };

    window.addEventListener('open-bulletin-inquiries', handleOpenInquiries);
    window.addEventListener('bulletin-inquiry-updated', handleInquiriesUpdated);
    return () => {
      window.removeEventListener('open-bulletin-inquiries', handleOpenInquiries);
      window.removeEventListener('bulletin-inquiry-updated', handleInquiriesUpdated);
    };
  }, []);

  const [pullDistance, setPullDistance] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const pullDistanceRef = useRef<number>(0);
  const hasTriggeredHapticRef = useRef<boolean>(false);

  const [walletBalance, setWalletBalance] = useState<number>(0);

  const [isLiveStreamOpen, setIsLiveStreamOpen] = useState<boolean>(false);
  const [isStreamSetupOpen, setIsStreamSetupOpen] = useState<boolean>(false);
  const [streamTitleInput, setStreamTitleInput] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(() => getGlobalMuteState());

  useEffect(() => {
    const handleMuteChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ muted: boolean }>;
      if (typeof customEvent.detail?.muted === 'boolean') {
        setIsMuted(customEvent.detail.muted);
      }
    };
    window.addEventListener('perplexta:mute_change', handleMuteChange);
    return () => window.removeEventListener('perplexta:mute_change', handleMuteChange);
  }, []);
  const [currentFeedIndex, setCurrentFeedIndex] = useState<number>(0);
  const [liveComments, setLiveComments] = useState<{id: string, user: string, text: string}[]>([]);
  const [liveLikes, setLiveLikes] = useState<number>(0);
  const [liveViewers, setLiveViewers] = useState<number>(0);
  const [newLiveComment, setNewLiveComment] = useState<string>('');
  const [isGiftModalOpen, setIsGiftModalOpen] = useState<boolean>(false);
  const [giftsCatalog, setGiftsCatalog] = useState<any[]>([]);
  const [showLikeAnimation, setShowLikeAnimation] = useState<boolean>(false);

  const streamFeed = [
    { id: 'live-1', type: 'live', host: 'Ahmed Khalil', hostId: 101, title: isRtl ? 'تحليل السوق العقاري' : 'Real Estate Market Analysis', viewers: 1240 },
    { id: 'reel-1', type: 'reel', host: 'Sara Tech', hostId: 102, title: isRtl ? 'مراجعة آيفون 16 برو' : 'iPhone 16 Pro Review', viewers: 850 },
    { id: 'live-2', type: 'live', host: 'Mustafa Business', hostId: 103, title: isRtl ? 'أسرار النجاح في التجارة' : 'Success Secrets in Business', viewers: 2100 },
  ];

  const videoRef = useRef<HTMLVideoElement>(null);
  const storyPressTimerRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleSendLiveComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLiveComment.trim()) return;
    setLiveComments(prev => [...prev, { id: Date.now().toString(), user: user?.name || (isRtl ? 'مستخدم' : 'User'), text: newLiveComment }]);
    setNewLiveComment('');
  };

  const handleLiveLike = () => {
    setLiveLikes(prev => prev + 1);
    setShowLikeAnimation(true);
    setTimeout(() => setShowLikeAnimation(false), 1000);
  };

  const fetchGiftsCatalog = async () => {
    try {
      const res = await fetch('/api/gifts');
      const data = await res.json();
      if (Array.isArray(data)) {
        setGiftsCatalog(data);
      }
    } catch (e) {
      console.error('Error fetching gifts:', e);
    }
  };

  const handleSendGift = async (gift: any) => {
    if (!token) {
      toast.error(isRtl ? 'يرجى تسجيل الدخول أولاً' : 'Please login first');
      setIsAuthModalOpen(true);
      return;
    }

    try {
      const res = await fetch('/api/gifts/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          giftId: gift.id,
          recipientId: streamFeed[currentFeedIndex]?.hostId || 1,
          context: 'live'
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(isRtl
          ? `تم إرسال ${gift.name_ar} بنجاح!`
          : `Sent ${gift.name_en} successfully!`
        );
        setIsGiftModalOpen(false);
        fetchWallet();
        setLiveComments(prev => [...prev, {
          id: Date.now().toString(),
          user: user?.name || (isRtl ? 'مستخدم' : 'User'),
          text: isRtl ? `أرسل هدية: ${gift.name_ar} ${gift.icon}` : `Sent a gift: ${gift.name_en} ${gift.icon}`
        }]);
      } else {
        toast.error(isRtl ? (data.error_ar || data.error) : data.error);
      }
    } catch (e) {
      toast.error(isRtl ? 'حدث خطأ أثناء إرسال الهدية' : 'Error sending gift');
    }
  };

  const startLiveStream = async () => {
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch (e: any) {
        if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') {
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
            toast.info(isRtl ? 'تم تفعيل الكاميرا فقط (الميكروفون غير موجود).' : 'Camera only activated (microphone not found).');
          } catch (e2: any) {
            if (e2.name === 'NotFoundError' || e2.name === 'DevicesNotFoundError') {
              stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              toast.info(isRtl ? 'تم تفعيل الميكروفون فقط (الكاميرا غير موجودة).' : 'Microphone only activated (camera not found).');
            } else {
              throw e2;
            }
          }
        } else {
          throw e;
        }
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing media devices:', err);
      toast.error(isRtl ? 'تعذر الوصول إلى الكاميرا والميكروفون. يرجى التحقق من الصلاحيات.' : 'Could not access camera and microphone. Please check permissions.');
    }
  };

  const stopLiveStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    let interval: any;
    if (isLiveStreamOpen) {
      startLiveStream();
      fetchGiftsCatalog();
      setLiveViewers(Math.floor(Math.random() * 1200) + 1500);
      setLiveLikes(Math.floor(Math.random() * 800));
      setLiveComments([]);

      interval = setInterval(() => {
        setLiveViewers(prev => {
          const drift = Math.floor(Math.random() * 51) - 25;
          const next = prev + drift;
          if (next < 1500) return 1500 + Math.floor(Math.random() * 200);
          if (next > 10000) return 10000 - Math.floor(Math.random() * 200);
          return next;
        });
      }, 3000);
    } else {
      stopLiveStream();
      setIsGiftModalOpen(false);
    }
    return () => {
      stopLiveStream();
      if (interval) clearInterval(interval);
    };
  }, [isLiveStreamOpen]);

  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState<boolean>(false);
  const [isAdModalOpen, setIsAdModalOpen] = useState<boolean>(false);
  const [isComposerDragging, setIsComposerDragging] = useState<boolean>(false);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState<boolean>(false);
  const [storyUploadMode, setStoryUploadMode] = useState<'media' | 'text'>('media');
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editingAdId, setEditingAdId] = useState<number | null>(null);
  const [isSubmittingAd, setIsSubmittingAd] = useState<boolean>(false);
  const [isAudienceModalOpen, setIsAudienceModalOpen] = useState<boolean>(false);
  const [selectedAudienceFilter, setSelectedAudienceFilter] = useState<string>('all');
  const [adFormData, setAdFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    video_url: '',
    media_gallery: [] as MediaGalleryItem[],
    whatsapp_number: '',
    phone_number: '',
    target_url: '',
    hashtags: '',
    page_id: '' as string | number,
    location_city: 'القدس الشريف',
    location_radius: '10',
    feeling: '',
    is_ai_generated: false,
    tagged_users: [] as string[],
    has_whatsapp_button: false,
    audience: 'public' as 'public' | 'friends' | 'only_me',
    ad_format: 'post' as 'post' | 'reel' | 'story',
    quick_questions: ['', '', ''] as string[],
    aspect_ratio: 'grid' as string
  });

  const [suggestionType, setSuggestionType] = useState<'none' | 'hashtag' | 'mention'>('none');
  const [suggestionQuery, setSuggestionQuery] = useState('');
  const [trendingHashtags, setTrendingHashtags] = useState<string[]>([]);
  const [mentionSuggestions, setMentionSuggestions] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/bulletin/hashtags/trending')
      .then(res => res.json())
      .then(data => {
        if (data && data.success) {
          setTrendingHashtags(data.tags);
        }
      })
      .catch(err => console.error('[Hashtags client] Fetch failed:', err));
  }, []);

  useEffect(() => {
    if (suggestionType !== 'mention') return;
    const url = `/api/bulletin/mentions/suggest?q=${encodeURIComponent(suggestionQuery)}`;
    fetch(url, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.success) {
          setMentionSuggestions(data.results);
        }
      })
      .catch(err => console.error('[Mentions client] Fetch failed:', err));
  }, [suggestionType, suggestionQuery, token]);

  const handleComposerTextChange = (text: string) => {
    if (text.length > 1000) return;
    setAdFormData(prev => ({ ...prev, description: text }));

    const lastWord = text.split(/[\s\n]+/).pop() || '';
    if (lastWord.startsWith('#')) {
      setSuggestionType('hashtag');
      setSuggestionQuery(lastWord.slice(1));
    } else if (lastWord.startsWith('@')) {
      setSuggestionType('mention');
      setSuggestionQuery(lastWord.slice(1));
    } else {
      setSuggestionType('none');
      setSuggestionQuery('');
    }
  };

  const handleSelectSuggestion = (selectedVal: string) => {
    const text = adFormData.description;
    const words = text.split(/([\s\n]+)/);

    let replaced = false;
    for (let i = words.length - 1; i >= 0; i--) {
      if (words[i].trim().startsWith('#') && suggestionType === 'hashtag') {
        words[i] = selectedVal.startsWith('#') ? selectedVal : `#${selectedVal}`;
        replaced = true;
        break;
      }
      if (words[i].trim().startsWith('@') && suggestionType === 'mention') {
        words[i] = selectedVal.startsWith('@') ? selectedVal : `@${selectedVal}`;

        const cleanName = selectedVal.replace(/^@/, '');
        if (!adFormData.tagged_users.includes(cleanName)) {
          setAdFormData(prev => ({
            ...prev,
            tagged_users: [...prev.tagged_users, cleanName]
          }));
        }

        replaced = true;
        break;
      }
    }

    const newText = words.join('') + ' ';
    setAdFormData(prev => ({ ...prev, description: newText }));
    setSuggestionType('none');
    setSuggestionQuery('');
  };

  const [isMediaManagerOpen, setIsMediaManagerOpen] = useState(false);

  const [isTrimmerModalOpen, setIsTrimmerModalOpen] = useState(false);
  const [trimmerVideoUrl, setTrimmerVideoUrl] = useState('');
  const [videoMetadataInfo, setVideoMetadataInfo] = useState<{
    fileSize?: number;
    duration?: number;
    resolution?: string;
    fileName?: string;
    uploadProgress?: number;
    processingStage?: 'idle' | 'uploading' | 'transcoding' | 'extracting' | 'done';
    localVideoUrl?: string;
  }>({ processingStage: 'done' });

  const [composerView, setComposerView] = useState<'main' | 'feelings' | 'location' | 'tagging' | 'emojis'>('main');
  const [userSearch, setUserSearch] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [selectedComposerCountry, setSelectedComposerCountry] = useState<string>('فلسطين');
  const [customLocationSearch, setCustomLocationSearch] = useState<string>('');

  const openReelUploadModal = () => {
    setAdFormData({
      title: '',
      description: '',
      image_url: '',
      video_url: '',
      media_gallery: [],
      whatsapp_number: (user as any)?.phone || '',
      phone_number: '',
      target_url: '',
      hashtags: '',
      page_id: '' as string | number,
      location_city: 'القدس الشريف',
      location_radius: '10',
      feeling: '',
      is_ai_generated: false,
      tagged_users: [] as string[],
      has_whatsapp_button: false,
      audience: 'public' as 'public' | 'friends' | 'only_me',
      ad_format: 'reel',
      quick_questions: ['', '', ''] as string[],
      aspect_ratio: 'grid'
    });
    setVideoMetadataInfo({ processingStage: 'done' });
    setIsEditMode(false);
    setEditingAdId(null);
    setComposerView('main');
    setIsAdModalOpen(true);
  };

  const openPostUploadModal = () => {
    setAdFormData({
      title: '',
      description: '',
      image_url: '',
      video_url: '',
      media_gallery: [],
      whatsapp_number: (user as any)?.phone || '',
      phone_number: '',
      target_url: '',
      hashtags: '',
      page_id: '' as string | number,
      location_city: 'القدس الشريف',
      location_radius: '10',
      feeling: '',
      is_ai_generated: false,
      tagged_users: [] as string[],
      has_whatsapp_button: false,
      audience: 'public' as 'public' | 'friends' | 'only_me',
      ad_format: 'post',
      quick_questions: ['', '', ''] as string[],
      aspect_ratio: 'grid'
    });
    setVideoMetadataInfo({ processingStage: 'done' });
    setIsEditMode(false);
    setEditingAdId(null);
    setComposerView('main');
    setIsAdModalOpen(true);
  };


  useEffect(() => {
    if (!customLocationSearch || customLocationSearch.trim().length < 2) {
      setLocationSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingLocation(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(customLocationSearch.trim())}&limit=5&accept-language=ar`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setLocationSuggestions(data);
        }
      } catch (e) {
        console.error('Error fetching location suggestions:', e);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [customLocationSearch]);

  const [isPageModalOpen, setIsPageModalOpen] = useState<boolean>(false);
  const [isSubmittingPage, setIsSubmittingPage] = useState<boolean>(false);
  const [pageFormData, setPageFormData] = useState({
    name: '',
    category: 'تجارة إلكترونية / E-Commerce',
    city: 'غزة',
    address: '',
    description: '',
    avatar_url: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=200&q=80',
    cover_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
    whatsapp_number: '',
    phone_number: '',
    website_url: ''
  });

  const [inquireAd, setInquireAd] = useState<BulletinAd | null>(null);
  const [inquiryText, setInquiryText] = useState<string>('');
  const [inquiryPhone, setInquiryPhone] = useState<string>('');
  const [isSendingInquiry, setIsSendingInquiry] = useState<boolean>(false);

  const [expandedAdId, setExpandedAdId] = useState<number | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<number, BulletinAdComment[]>>({});
  const [loadingCommentsAdId, setLoadingCommentsAdId] = useState<number | null>(null);
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [replyToCommentId, setReplyToCommentId] = useState<number | null>(null);

  const [lightboxState, setLightboxState] = useState<{
    isOpen: boolean;
    items: LightboxMediaItem[];
    initialIndex: number;
    postTitle?: string;
    authorName?: string;
    ad?: BulletinAd | null;
  }>({
    isOpen: false,
    items: [],
    initialIndex: 0,
    ad: null
  });

  const updateUrlWithPost = (postId: number | null) => {
    if (typeof window !== 'undefined') {
      const cleanUrl = postId ? `/viralbook/${postId}` : `/viralbook`;
      if (window.location.pathname !== cleanUrl) {
        window.history.pushState(null, '', cleanUrl);
      }
    }
  };

  const handleOpenLightbox = (url: string, items?: any[], index = 0, postTitle?: string, authorName?: string, ad?: BulletinAd) => {
    let resolvedItems: LightboxMediaItem[] = [];
    if (items && Array.isArray(items) && items.length > 0) {
      resolvedItems = items.map((it: any, i: number) => {
        if (typeof it === 'string') {
          return { id: `item-${i}`, url: it, type: 'image' };
        }
        return {
          id: it.id || `item-${i}`,
          url: it.url,
          type: it.type || (it.url?.endsWith('.mp4') ? 'video' : 'image'),
          caption: it.caption || '',
          thumbnailUrl: it.thumbnailUrl
        };
      });
    } else {
      resolvedItems = [{ id: 'item-0', url, type: url?.endsWith('.mp4') ? 'video' : 'image' }];
    }

    setLightboxState({
      isOpen: true,
      items: resolvedItems,
      initialIndex: index,
      postTitle,
      authorName,
      ad: ad || undefined
    });

    if (ad && ad.id) {
      updateUrlWithPost(ad.id);
    }
  };

  const setLightboxImage = (url: string | null) => {
    if (!url) {
      setLightboxState(prev => ({ ...prev, isOpen: false }));
      updateUrlWithPost(null);
    } else {
      handleOpenLightbox(url);
    }
  };
  const [isAddToPostModalOpen, setIsAddToPostModalOpen] = useState<boolean>(false);

  useModalScrollLock(activeReelModalId !== null, 'reels-viewer');

  const [boostingAd, setBoostingAd] = useState<BulletinAd | null>(null);
  const [isBoostModalOpen, setIsBoostModalOpen] = useState<boolean>(false);

  const isAnyModalOpen = isAdModalOpen ||
    isStoryViewerOpen ||
    isLiveStreamOpen ||
    isStoryModalOpen ||
    isAudienceModalOpen ||
    isPageModalOpen ||
    isAddToPostModalOpen ||
    isBoostModalOpen ||
    isGiftModalOpen ||
    inquireAd !== null ||
    isMediaManagerOpen ||
    isTrimmerModalOpen ||
    editingAdId !== null;

  useEffect(() => {
    if (isAnyModalOpen) {
      document.body.classList.add('layout-locked', 'workspace-focus-mode');
      document.documentElement.classList.add('workspace-focus-mode');
    } else {
      document.body.classList.remove('layout-locked', 'workspace-focus-mode');
      document.documentElement.classList.remove('workspace-focus-mode');
    }
    return () => {
      document.body.classList.remove('layout-locked', 'workspace-focus-mode');
      document.documentElement.classList.remove('workspace-focus-mode');
    };
  }, [isAnyModalOpen]);

  const handleOpenBoostModal = (ad: BulletinAd) => {
    if (!user || !token) {
      toast.error(isRtl ? 'يرجى تسجيل الدخول أولاً لتمويل إعلانك' : 'Please log in first to boost your ad');
      setIsAuthModalOpen(true);
      return;
    }
    setBoostingAd(ad);
    setIsBoostModalOpen(true);
  };

  const handleBoostSuccess = (updatedAd: BulletinAd) => {
    setAds(prev => prev.map(a => a.id === updatedAd.id ? { ...a, ...updatedAd, is_boosted: true } : a));
    setMyAds(prev => prev.map(a => a.id === updatedAd.id ? { ...a, ...updatedAd, is_boosted: true } : a));
    fetchAds(1, false);
    fetchWallet();
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const pathname = window.location.pathname;

    // 1. Check for Commercial Page route: /viralbook/page/:slug or /viralbook/pages/:slug
    const pageMatch = pathname.match(/\/(?:viralbook|bulletin)\/pages?\/([^\/]+)/i);
    if (pageMatch && pageMatch[1]) {
      const pageSlug = decodeURIComponent(pageMatch[1]);
      handleOpenPageDetail(pageSlug);
      return;
    }

    // 1b. Check for User Personal Profile Wall route: /viralbook/u/:userId or /u/:userId
    const userMatch = pathname.match(/\/(?:viralbook|bulletin)\/u(?:ser)?\/([^\/]+)/i) || pathname.match(/\/u\/([^\/]+)/i);
    if (userMatch && userMatch[1]) {
      const targetUserId = decodeURIComponent(userMatch[1]);
      handleOpenUserDetail(targetUserId);
      return;
    }

    // 2. Check for Post code/id route
    let targetPostCode: string | null = null;
    if (routeIdParam && routeIdParam !== 'reels' && routeIdParam !== 'pages' && routeIdParam !== 'page' && routeIdParam !== 'inquiries') {
      targetPostCode = routeIdParam;
    } else {
      const postMatch = pathname.match(/\/(?:viralbook|bulletin)\/(?:p|post)\/(?:[^\/]+\/)?([^\/]+)/i) ||
                        pathname.match(/\/(?:viralbook|bulletin)\/([A-Za-z0-9_-]+)/i);
      if (postMatch && postMatch[1] && !['reels', 'pages', 'page', 'inquiries', 'my-ads', 'analytics', 'saved'].includes(postMatch[1])) {
        targetPostCode = decodeURIComponent(postMatch[1]);
      }
    }

    if (!targetPostCode) {
      const urlParams = new URLSearchParams(window.location.search);
      const postStr = urlParams.get('post') || urlParams.get('id') || urlParams.get('ad');
      if (postStr) targetPostCode = postStr;
    }

    if (targetPostCode) {
      const codeOrId = targetPostCode;
      const fetchDirectPost = async () => {
        try {
          const res = await fetch(`/api/bulletin/ads/code/${encodeURIComponent(codeOrId)}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
          const data = await res.json();
          const ad = data.ad || (data.id ? data : null);
          if (ad) {
            const mediaUrl = getMediaUrl(ad.video_url || ad.image_url);
            handleOpenLightbox(mediaUrl, ad.media_gallery, 0, ad.title, ad.author_name, ad);

            try {
              const cRes = await fetch(`/api/bulletin/ads/${ad.id}/comments`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
              });
              const cData = await cRes.json();
              if (cData.success) {
                setCommentsMap(prev => ({ ...prev, [ad.id]: cData.comments || [] }));
              }
            } catch (cErr) {
              console.error('Failed to fetch direct post comments:', cErr);
            }
          }
        } catch (e) {
          console.error('Failed to fetch direct post:', e);
        }
      };
      fetchDirectPost();
    }
  }, [token, routeIdParam, subPath, subId, location.pathname]);

  useEffect(() => {
    let targetReelId: number | null = null;
    const isReelRoute = location.pathname.startsWith('/reels') ||
      location.pathname.includes('/reels') ||
      subPath === 'reels';

    if (isReelRoute) {
      if (subId && !isNaN(Number(subId))) {
        targetReelId = Number(subId);
      } else if (routeIdParam && !isNaN(Number(routeIdParam))) {
        targetReelId = Number(routeIdParam);
      } else if (typeof window !== 'undefined') {
        const reelMatch = location.pathname.match(/\/(?:reels|viralbook\/reels|bulletin\/reels)\/(\d+)/i);
        if (reelMatch && reelMatch[1]) {
          targetReelId = Number(reelMatch[1]);
        }
      }
    }

    if (!targetReelId && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const reelIdStr = urlParams.get('reel');
      if (reelIdStr && !isNaN(Number(reelIdStr))) {
        targetReelId = Number(reelIdStr);
      }
    }

    if (targetReelId && targetReelId > 0) {
      const reelId = targetReelId;
      const fetchDirectReel = async () => {
        try {
          const res = await fetch(`/api/bulletin/ads/${reelId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
          const data = await res.json();
          if (data.success && data.ad && data.ad.video_url) {
            setAds(prev => {
              const exists = prev.some(a => a.id === data.ad.id);
              if (exists) return prev;
              return [data.ad, ...prev];
            });
            setActiveReelModalId(reelId);
            setActiveTab('reels');
          }
        } catch (e) {
          console.error('Failed to fetch direct reel:', e);
        }
      };
      fetchDirectReel();
    }
  }, [token, routeIdParam, subPath, subId, location.pathname]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const boostStatus = urlParams.get('status');
    const sessionId = urlParams.get('session_id');

    if (boostStatus === 'boost-success' && sessionId && token) {
      fetch(`/api/bulletin/verify-boost-session?session_id=${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            toast.success(isRtl ? 'تم ترويج إعلانك وتنشيطه بنجاح عبر Stripe! 🚀' : 'Ad boosted successfully via Stripe!');
            fetchAds(1, false);
            fetchWallet();
          }
        })
        .catch(console.error);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [token]);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const adIdParam = routeIdParam || urlParams.get('id') || urlParams.get('ad');
    if (adIdParam) {
      const targetId = Number(adIdParam);
      if (!isNaN(targetId) && targetId > 0) {
        const exists = ads.some(a => a.id === targetId);
        if (exists) {
          setExpandedAdId(targetId);
          setTimeout(() => {
            const el = document.getElementById(`bulletin-ad-${targetId}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 350);
        } else {
          fetch(`/api/bulletin/ads/${targetId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          })
            .then(res => res.json())
            .then(data => {
              if (data.success && data.ad) {
                setAds(prev => [data.ad, ...prev.filter(a => a.id !== data.ad.id)]);
                setExpandedAdId(targetId);
                setTimeout(() => {
                  const el = document.getElementById(`bulletin-ad-${targetId}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 350);
              }
            })
            .catch(err => console.error('Failed to load deep-linked ad:', err));
        }
      }
    }
  }, [token, location, routeIdParam, ads]);

  useEffect(() => {
    if (routeIdParam === 'pages' && subPath && !isNaN(Number(subPath))) {
      const pageId = Number(subPath);
      handleOpenPageDetail(pageId);
    }
  }, [routeIdParam, subPath]);

  const [adPage, setAdPage] = useState<number>(1);
  const [hasMoreAds, setHasMoreAds] = useState<boolean>(true);
  const [loadingMoreAds, setLoadingMoreAds] = useState<boolean>(false);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  const handleNavigateToPost = async (adId: number) => {
    if (!adId) return;

    stopAllMedia();
    setActiveReelModalId(null);
    setLightboxState(prev => ({ ...prev, isOpen: false }));
    updateUrlWithPost(null);

    if (activeTab !== 'board') {
      setActiveTab('board');
    }

    setSelectedCategory('all');
    setSearchQuery('');
    setSelectedAudienceFilter('all');
    setSelectedCity('all');

    let targetAd = ads.find(a => a.id === adId);
    if (!targetAd) {
      try {
        const res = await fetch(`/api/bulletin/ads/${adId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const data = await res.json();
        if (data.success && data.ad) {
          targetAd = data.ad;
          setAds(prev => [data.ad, ...prev.filter(a => a.id !== data.ad.id)]);
        }
      } catch (e) {
        console.error('Failed to fetch target post for navigation:', e);
      }
    }

    setExpandedAdId(adId);

    const executeScroll = (attempts = 0) => {
      const el = document.getElementById(`bulletin-ad-${adId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-4', 'ring-accent', 'ring-offset-4', 'ring-offset-white', 'dark:ring-offset-zinc-900', 'shadow-2xl', 'transition-all', 'duration-500');
        setTimeout(() => {
          el.classList.remove('ring-4', 'ring-accent', 'ring-offset-4', 'ring-offset-white', 'dark:ring-offset-zinc-900', 'shadow-2xl');
        }, 3500);
      } else if (attempts < 8) {
        setTimeout(() => executeScroll(attempts + 1), 150);
      }
    };

    setTimeout(() => executeScroll(), 120);
  };


  const handleStoryViewed = async (storyId: number) => {
    try {
      const response = await fetch(`/api/bulletin/ads/${storyId}/impression`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setStories(prev => prev.map(s => s.id === storyId ? { ...s, impressions_count: (Number(s.impressions_count) || 0) + 1 } : s));
      }
    } catch (err) {
    }
  };

  const handleStoryDeleted = (storyId: number) => {
    setStories(prev => prev.filter(s => s.id !== storyId));
    fetchStories();
  };

  const fetchAds = async (pageNum = 1, append = false) => {
    if (append) {
      setLoadingMoreAds(true);
    } else {
      setLoading(true);
      setAdPage(1);
    }

    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedCity !== 'all') params.append('city', selectedCity);
      if (selectedAudienceFilter !== 'all') params.append('audience', selectedAudienceFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (sortBy) params.append('sort', sortBy);
      params.append('page', String(pageNum));
      params.append('limit', '8');

      const res = await fetch(`/api/bulletin/ads?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (res.status === 503) {
        toast.error(isRtl ? 'النظام قيد التشغيل، يرجى المحاولة بعد لحظات' : 'System initializing, please retry in a moment');
        return;
      }

      if (res.status === 429) {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || (isRtl ? 'تم تجاوز حد الطلبات، يرجى الانتظار قليلًا' : 'Rate limit exceeded, please wait a moment'));
        return;
      }

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      if (data.success) {
        const fetchedAds: BulletinAd[] = data.ads || [];
        if (append) {
          const existingIds = new Set(ads.map(a => a.id));
          const newUniqueAds = fetchedAds.filter(a => !existingIds.has(a.id));
          if (newUniqueAds.length > 0) {
            setAds(prev => [...prev, ...newUniqueAds]);
            setHasMoreAds(true);
          } else {
            if (ads.length > 0) {
              const recycled = ads.slice(0, 8).map((ad, idx) => ({
                ...ad,
                _virtualId: `${ad.id}_recycle_${pageNum}_${idx}_${Date.now()}`
              }));
              setAds(prev => [...prev, ...recycled as any]);
              setHasMoreAds(true);
            } else {
              setHasMoreAds(false);
            }
          }
        } else {
          setAds(fetchedAds);
          setHasMoreAds(true);
        }
      }
    } catch (error) {
      console.error('Error fetching bulletin ads:', error);
      toast.error(isRtl ? 'تعذر تحميل الإعلانات' : 'Failed to load ads');
    } finally {
      setLoading(false);
      setLoadingMoreAds(false);
    }
  };

  const fetchStories = async () => {
    try {
      const res = await fetch('/api/bulletin/stories', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.status === 503) return;
      if (!res.ok) throw new Error('Failed to fetch stories');
      const data = await res.json();
      if (data.success) {
        setStories(data.stories || []);
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
    }
  };

  const handleLoadMoreAds = () => {
    if (loading || loadingMoreAds) return;
    const nextPage = adPage + 1;
    setAdPage(nextPage);
    fetchAds(nextPage, true);
  };

  const fetchPages = async () => {
    setPagesLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/bulletin/pages?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (res.status === 503) return;
      if (!res.ok) throw new Error('Failed to fetch pages');
      const data = await res.json();
      if (data.success) {
        setPagesList(data.pages || []);
      }
    } catch (error) {
      console.error('Error fetching pages:', error);
    } finally {
      setPagesLoading(false);
    }
  };

  const fetchMyPages = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/bulletin/pages/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMyPagesList(data.pages || []);
      }
    } catch (e) {}
  };

  const fetchMyAds = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/bulletin/ads/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMyAds(data.ads || []);
      }
    } catch (e) {}
  };

  const fetchInquiries = async () => {
    if (!token) return;
    setInquiriesLoading(true);
    try {
      const [legacyRes, directRes] = await Promise.all([
        fetch('/api/bulletin/inquiries/my', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/bulletin/my-inquiries', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const legacyData = await legacyRes.json().catch(() => ({ inquiries: [] }));
      const directData = await directRes.json().catch(() => ({ inquiries: [] }));

      const legacyInquiries = (legacyData.inquiries || []).map((inq: any) => ({
        ...inq,
        type: 'legacy'
      }));

      const directInquiries = (directData.inquiries || []).map((thread: any) => ({
        id: `direct_${thread.ad_id}_${thread.other_user_id}`,
        ad_id: thread.ad_id,
        ad_title: thread.ad_title,
        ad_image: thread.ad_image,
        sender_id: thread.other_user_id,
        sender_name: thread.other_user_name,
        sender_avatar: thread.other_user_avatar,
        message: thread.last_message,
        unread_count: thread.unread_count,
        created_at: thread.last_message_at,
        type: 'direct'
      }));

      setInquiriesList([...directInquiries, ...legacyInquiries]);
    } catch (e) {
    } finally {
      setInquiriesLoading(false);
    }
  };

  const fetchWallet = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/wallet', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data) {
        setWalletBalance(parseFloat(data.balance) || 0);
      }
    } catch (e) {}
  };

  useEffect(() => {
    sessionStorage.removeItem('perplexta_bulletin_scroll_y');
    fetchAds();
    fetchStories();
    fetchPages();
  }, [selectedCategory, selectedCity, sortBy, selectedAudienceFilter]);

  useEffect(() => {
    const handleScroll = () => {
      try {
        const container = document.querySelector('.main-scroll-container');
        const containerY = container ? container.scrollTop : 0;
        const windowY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
        const currentY = Math.max(containerY, windowY);

        const isPostFullscreen = expandedAdId !== null || activeReelModalId !== null || lightboxState.isOpen || activeTab !== 'board';
        setShowScrollTop(!isPostFullscreen && currentY > 200);

        if (activeTab === 'board' && currentY > 0 && !document.body.classList.contains('layout-locked') && !document.body.classList.contains('workspace-focus-mode')) {
          sessionStorage.setItem('perplexta_bulletin_scroll_y', String(currentY));
        }
      } catch (e) {}
    };

    const container = document.querySelector('.main-scroll-container');
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { capture: true, passive: true });

    handleScroll();

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'board' && !loading && ads.length > 0) {
      const savedScrollY = sessionStorage.getItem('perplexta_bulletin_scroll_y');
      if (savedScrollY && Number(savedScrollY) > 0) {
        const targetY = Number(savedScrollY);
        const timer = setTimeout(() => {
          const container = document.querySelector('.main-scroll-container');
          if (container) {
            container.scrollTop = targetY;
          } else {
            window.scrollTo({ top: targetY, behavior: 'instant' });
          }
        }, 120);
        return () => clearTimeout(timer);
      }
    }
  }, [activeTab, loading, ads.length]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sessionStorage.removeItem('perplexta_bulletin_scroll_y');
    if (activeTab === 'board') fetchAds();
    if (activeTab === 'pages') fetchPages();
  };

  const handleToggleLike = async (adId: number, reaction: string = 'like') => {
    if (!token) {
      toast.error(isRtl ? 'يرجى تسجيل الدخول للتفاعل مع الإعلان' : 'Please log in to like ads');
      return;
    }

    setAds(prev => prev.map(ad => {
      if (ad.id === adId) {
        const currentReaction = (ad as any).user_reaction;
        const isRemoving = currentReaction === reaction;
        const nextReaction = isRemoving ? null : reaction;
        const countDelta = isRemoving ? -1 : (currentReaction ? 0 : 1);
        return {
          ...ad,
          user_has_liked: Boolean(nextReaction),
          user_reaction: nextReaction,
          likes_count: Math.max(0, (ad.likes_count || 0) + countDelta)
        };
      }
      return ad;
    }));

    setSavedAds(prev => prev.map(ad => {
      if (ad.id === adId) {
        const currentReaction = (ad as any).user_reaction;
        const isRemoving = currentReaction === reaction;
        const nextReaction = isRemoving ? null : reaction;
        const countDelta = isRemoving ? -1 : (currentReaction ? 0 : 1);
        return {
          ...ad,
          user_has_liked: Boolean(nextReaction),
          user_reaction: nextReaction,
          likes_count: Math.max(0, (ad.likes_count || 0) + countDelta)
        };
      }
      return ad;
    }));

    try {
      const res = await fetch(`/api/bulletin/ads/${adId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reaction })
      });
      const data = await res.json();
      if (data.success && data.user_reaction !== undefined) {
        setAds(prev => prev.map(ad => ad.id === adId ? { ...ad, user_has_liked: data.isLiked, user_reaction: data.user_reaction, likes_count: data.likesCount } : ad));
        setSavedAds(prev => prev.map(ad => ad.id === adId ? { ...ad, user_has_liked: data.isLiked, user_reaction: data.user_reaction, likes_count: data.likesCount } : ad));
      } else if (!data.success) {
        fetchAds();
      }
    } catch (e) {
      fetchAds();
    }
  };

  const handleToggleFollowPage = async (pageId: number) => {
    if (!token) {
      toast.error(isRtl ? 'يرجى تسجيل الدخول لمتابعة الصفحة' : 'Please log in to follow page');
      return;
    }

    setPagesList(prev => prev.map(p => {
      if (p.id === pageId) {
        const following = p.user_is_following;
        return {
          ...p,
          user_is_following: !following,
          followers_count: following ? Math.max(0, p.followers_count - 1) : p.followers_count + 1
        };
      }
      return p;
    }));

    if (selectedPageDetail && selectedPageDetail.page.id === pageId) {
      setSelectedPageDetail(prev => prev ? {
        ...prev,
        page: {
          ...prev.page,
          user_is_following: !prev.page.user_is_following,
          followers_count: prev.page.user_is_following ? Math.max(0, prev.page.followers_count - 1) : prev.page.followers_count + 1
        }
      } : null);
    }

    try {
      const res = await fetch(`/api/bulletin/pages/${pageId}/follow`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.is_following ? (isRtl ? 'تمت متابعة الصفحة' : 'Page followed') : (isRtl ? 'تم إلغاء المتابعة' : 'Unfollowed'));
      }
    } catch (e) {
      fetchPages();
    }
  };

  const handleOpenPageDetail = async (pageIdentifier: number | string) => {
    try {
      const isSlug = typeof pageIdentifier === 'string' && isNaN(Number(pageIdentifier));
      const endpoint = isSlug
        ? `/api/bulletin/pages/slug/${encodeURIComponent(pageIdentifier)}`
        : `/api/bulletin/pages/${pageIdentifier}`;
      const res = await fetch(endpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success || data.id) {
        const pageObj = data.page || data;
        let pageAds: BulletinAd[] = data.ads || [];
        if (!data.ads) {
          const adsRes = await fetch(`/api/bulletin/ads?page_id=${pageObj.id}`);
          const adsData = await adsRes.json();
          pageAds = adsData.ads || [];
        }
        setSelectedUserDetail(null);
        setSelectedPageDetail({ page: pageObj, ads: pageAds });
        setPageDetailTab('ads');
        window.scrollTo({ top: 180, behavior: 'smooth' });
      } else {
        toast.error(data.error || 'تعذر فتح الصفحة');
      }
    } catch (e) {
      toast.error(isRtl ? 'تعذر تحميل الصفحة' : 'Failed to load page');
    }
  };

  const handleOpenUserDetail = async (userIdentifier: number | string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/bulletin/users/${encodeURIComponent(userIdentifier)}/wall`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success && data.user) {
        setSelectedPageDetail(null);
        setSelectedUserDetail({
          user: data.user,
          ads: data.ads || []
        });
        window.scrollTo({ top: 120, behavior: 'smooth' });
        const cleanUrl = `/viralbook/u/${data.user.id}`;
        if (typeof window !== 'undefined' && window.location.pathname !== cleanUrl) {
          window.history.pushState({}, '', cleanUrl);
        }
      } else {
        toast.error(data.error || (isRtl ? 'تعذر فتح الملف الشخصي' : 'Could not open user wall'));
      }
    } catch (e) {
      toast.error(isRtl ? 'تعذر تحميل حائط المستخدم' : 'Failed to load user wall');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToBoard = () => {
    setSelectedPageDetail(null);
    setSelectedUserDetail(null);
    if (typeof window !== 'undefined' && (window.location.pathname.includes('/u/') || window.location.pathname.includes('/pages/'))) {
      window.history.pushState({}, '', '/viralbook');
    }
  };

  const handleToggleCommentLike = async (adId: number, commentId: number, reaction: string = 'like') => {
    if (!token) {
      setIsAuthModalOpen(true);
      return;
    }

    setCommentsMap((prev) => ({
      ...prev,
      [adId]: (prev[adId] || []).map((c) => {
        if (c.id === commentId) {
          const isRemoving = c.user_reaction === reaction;
          return {
            ...c,
            user_reaction: isRemoving ? null : reaction,
            like_count: Math.max(0, (c.like_count || 0) + (isRemoving ? -1 : (c.user_reaction ? 0 : 1))),
          };
        }
        return c;
      })
    }));

    try {
      await fetch(`/api/bulletin/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reaction })
      });
    } catch (e) {}
  };

  const toggleComments = async (adId: number) => {
    if (expandedAdId === adId) {
      setExpandedAdId(null);
      return;
    }

    setExpandedAdId(adId);
    if (!commentsMap[adId]) {
      setLoadingCommentsAdId(adId);
      try {
        const res = await fetch(`/api/bulletin/ads/${adId}/comments`);
        const data = await res.json();
        if (data.success) {
          setCommentsMap(prev => ({ ...prev, [adId]: data.comments || [] }));
        }
      } catch (e) {
        console.error('Failed to fetch comments:', e);
      } finally {
        setLoadingCommentsAdId(null);
      }
    }
  };

  const handleAddComment = async (adId: number, parentIdOrText?: number | string, optParentId?: number) => {
    if (!token) {
      toast.error(isRtl ? 'يرجى تسجيل الدخول للتعليق' : 'Please log in to comment');
      return;
    }
    let text = newCommentText;
    let parentId = typeof parentIdOrText === 'number' ? parentIdOrText : optParentId;
    if (typeof parentIdOrText === 'string') {
      text = parentIdOrText;
    }
    const contentToSend = text;
    if (!contentToSend || !contentToSend.trim()) return;

    try {
      const res = await fetch(`/api/bulletin/ads/${adId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: contentToSend.trim(), parent_id: parentId })
      });
      const data = await res.json();
      if (data.success && data.comment) {
        setCommentsMap(prev => ({
          ...prev,
          [adId]: [...(prev[adId] || []), data.comment]
        }));
        if (typeof parentIdOrText !== 'string') {
          setNewCommentText('');
          setReplyToCommentId(null);
        }
        setAds(prev => prev.map(a => a.id === adId ? { ...a, comments_count: a.comments_count + 1 } : a));
        toast.success(isRtl ? 'تم إضافة تعليقك' : 'Comment added');
      } else {
        toast.error(data.error || 'فشل إرسال التعليق');
      }
    } catch (e) {
      toast.error('حدث خطأ أثناء إضافة التعليق');
    }
  };

  const handleSendInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error(isRtl ? 'يرجى تسجيل الدخول لإرسال الاستفسار' : 'Please log in to inquire');
      return;
    }
    if (!inquireAd || !inquiryText.trim()) return;

    setIsSendingInquiry(true);
    try {
      const res = await fetch(`/api/bulletin/ads/${inquireAd.id}/inquire`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          message: inquiryText.trim(),
          sender_phone: inquiryPhone.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(isRtl ? 'تم إرسال استفسارك للتاجر بنجاح!' : 'Inquiry sent to merchant successfully!');
        setInquireAd(null);
        setInquiryText('');
        setInquiryPhone('');
      } else {
        toast.error(data.error || 'فشل إرسال الاستفسار');
      }
    } catch (e) {
      toast.error('حدث خطأ أثناء إرسال الاستفسار');
    } finally {
      setIsSendingInquiry(false);
    }
  };

  const handleMessageAdvertiser = async (ad: BulletinAd, customMessage?: string) => {
    if (!token || !user) {
      toast.error(isRtl ? 'يرجى تسجيل الدخول أولاً لمراسلة المعلن' : 'Please log in to message the advertiser');
      setIsAuthModalOpen(true);
      return;
    }

    if (user.id && (user.id === ad.user_id)) {
      toast.error(isRtl ? 'هذا إعلانك الخاص، لا يمكنك مراسلة نفسك' : 'This is your own advertisement');
      return;
    }

    setMessagingAdId(ad.id);
    try {
      const res = await fetch(`/api/bulletin/ads/${ad.id}/message-advertiser`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: customMessage || '' })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(isRtl ? 'تم فتح المحادثة المشفرة مع المعلن في صندوق الرسائل!' : 'Encrypted chat with advertiser opened in messenger!');
        setInquireAd(null);
        await fetchInquiries();
        setSelectedInboxAd(ad);
        setActiveTab('inquiries');
      } else {
        toast.error(data.error || (isRtl ? 'فشل مراسلة المعلن' : 'Failed to message advertiser'));
      }
    } catch (e) {
      toast.error(isRtl ? 'حدث خطأ أثناء الاتصال بالمعلن' : 'Error contacting advertiser');
    } finally {
      setMessagingAdId(null);
    }
  };

  const fetchSavedAds = async () => {
    if (!token) return;
    setLoadingSaved(true);
    try {
      const res = await fetch('/api/bulletin/saved', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSavedAds(data.ads);
      }
    } catch (e) {
      console.error('Fetch saved ads error:', e);
    } finally {
      setLoadingSaved(false);
    }
  };

  const handleToggleSave = async (adOrId: BulletinAd | number) => {
    if (!token) {
      toast.error(isRtl ? 'يرجى تسجيل الدخول أولاً' : 'Please log in first');
      return;
    }
    const targetId = typeof adOrId === 'number' ? adOrId : adOrId.id;

    try {
      const res = await fetch(`/api/bulletin/ads/${targetId}/save`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        const updateFn = (prev: BulletinAd[]) => prev.map(a => a.id === targetId ? { ...a, user_has_saved: data.saved } : a);
        setAds(updateFn);
        setMyAds(updateFn);
        if (data.saved) {
          fetchSavedAds();
        } else {
          setSavedAds(prev => prev.filter(a => a.id !== targetId));
        }
      }
    } catch (e) {
      toast.error('حدث خطأ أثناء حفظ المنشور');
    }
  };

  const triggerFeedRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      triggerHaptic('light');
      if (activeTab === 'board') {
        await Promise.all([
          fetchAds(1, false),
          fetchPages(),
          fetchStories()
        ]);
      } else if (activeTab === 'pages') {
        await fetchPages();
      } else if (activeTab === 'my_ads') {
        await fetchMyAds();
      } else if (activeTab === 'saved') {
        await fetchSavedAds();
      }
      triggerHaptic('success');
      toast.success(isRtl ? 'تم تحديث المحتوى بنجاح' : 'Feed updated successfully', { id: 'bulletin-pull-refresh' });
    } catch (e) {
      console.error('Pull to refresh error:', e);
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
        pullDistanceRef.current = 0;
      }, 250);
    }
  };

  useEffect(() => {
    if (activeTab === 'reels') return;

    let touchStartY: number | null = null;
    let touchStartX: number | null = null;
    let isTouchPulling = false;

    let mouseStartY: number | null = null;
    let isMousePulling = false;

    const getScrollTop = () => {
      const container = document.querySelector('.main-scroll-container') as HTMLElement | null;
      const cTop = container ? container.scrollTop : 0;
      const wTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      return Math.max(cTop, wTop);
    };

    const isInteractive = (target: EventTarget | null) => {
      if (!target || !(target instanceof HTMLElement)) return false;
      return Boolean(
        target.closest(
          'button, a, input, textarea, select, [role="button"], video, audio, .custom-scrollbar, [data-prevent-pull="true"], [data-radix-popper-content-wrapper]'
        )
      );
    };

    const isModalActive = () => {
      return Boolean(
        isAnyModalOpen ||
        lightboxState.isOpen ||
        activeReelModalId !== null ||
        isMobileSidebarOpen ||
        isMobileSearchOpen ||
        contextMenu.isOpen
      );
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1 || isRefreshing || isModalActive()) return;
      if (isInteractive(e.target)) return;

      const scrollTop = getScrollTop();
      if (scrollTop <= 2) {
        touchStartY = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
        isTouchPulling = true;
        pullDistanceRef.current = 0;
        hasTriggeredHapticRef.current = false;
      } else {
        touchStartY = null;
        touchStartX = null;
        isTouchPulling = false;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isTouchPulling || touchStartY === null || isRefreshing) return;

      const scrollTop = getScrollTop();
      if (scrollTop > 2) {
        isTouchPulling = false;
        touchStartY = null;
        touchStartX = null;
        if (pullDistanceRef.current !== 0) {
          pullDistanceRef.current = 0;
          setPullDistance(0);
        }
        return;
      }

      const touch = e.touches[0];
      const deltaY = touch.clientY - touchStartY;
      const deltaX = Math.abs(touch.clientX - (touchStartX ?? touch.clientX));

      if (deltaX > 8 && deltaX > deltaY && pullDistanceRef.current === 0) {
        isTouchPulling = false;
        touchStartY = null;
        touchStartX = null;
        return;
      }

      if (deltaY > 0) {
        if (e.cancelable) {
          e.preventDefault();
        }
        const damped = Math.min(Math.pow(deltaY, 0.82) * 1.6, 95);
        pullDistanceRef.current = damped;
        setPullDistance(damped);

        if (damped >= 55 && !hasTriggeredHapticRef.current) {
          hasTriggeredHapticRef.current = true;
          triggerHaptic('medium');
        } else if (damped < 55) {
          hasTriggeredHapticRef.current = false;
        }
      } else {
        if (pullDistanceRef.current !== 0) {
          pullDistanceRef.current = 0;
          setPullDistance(0);
        }
      }
    };

    const onTouchEnd = () => {
      if (!isTouchPulling) return;
      isTouchPulling = false;
      touchStartY = null;
      touchStartX = null;

      const finalDist = pullDistanceRef.current;
      if (finalDist >= 55 && !isRefreshing) {
        triggerFeedRefresh();
      } else {
        pullDistanceRef.current = 0;
        setPullDistance(0);
      }
      hasTriggeredHapticRef.current = false;
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0 || isRefreshing || isModalActive()) return;
      if (isInteractive(e.target)) return;

      const scrollTop = getScrollTop();
      if (scrollTop <= 2) {
        mouseStartY = e.clientY;
        isMousePulling = true;
        pullDistanceRef.current = 0;
        hasTriggeredHapticRef.current = false;
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isMousePulling || mouseStartY === null || isRefreshing) return;

      const scrollTop = getScrollTop();
      if (scrollTop > 2) {
        isMousePulling = false;
        mouseStartY = null;
        if (pullDistanceRef.current !== 0) {
          pullDistanceRef.current = 0;
          setPullDistance(0);
        }
        return;
      }

      const deltaY = e.clientY - mouseStartY;
      if (deltaY > 0) {
        const damped = Math.min(Math.pow(deltaY, 0.82) * 1.6, 95);
        pullDistanceRef.current = damped;
        setPullDistance(damped);

        if (damped >= 55 && !hasTriggeredHapticRef.current) {
          hasTriggeredHapticRef.current = true;
          triggerHaptic('medium');
        } else if (damped < 55) {
          hasTriggeredHapticRef.current = false;
        }
      } else {
        if (pullDistanceRef.current !== 0) {
          pullDistanceRef.current = 0;
          setPullDistance(0);
        }
      }
    };

    const onMouseUp = () => {
      if (!isMousePulling) return;
      isMousePulling = false;
      mouseStartY = null;

      const finalDist = pullDistanceRef.current;
      if (finalDist >= 55 && !isRefreshing) {
        triggerFeedRefresh();
      } else {
        pullDistanceRef.current = 0;
        setPullDistance(0);
      }
      hasTriggeredHapticRef.current = false;
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);

      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [
    activeTab,
    isRefreshing,
    isAnyModalOpen,
    lightboxState.isOpen,
    activeReelModalId,
    isMobileSidebarOpen,
    isMobileSearchOpen,
    contextMenu.isOpen,
    isRtl
  ]);

  const handleReportAd = async (ad: BulletinAd) => {
    if (!token) {
      toast.error(isRtl ? 'يرجى تسجيل الدخول أولاً' : 'Please log in first');
      return;
    }

    const reason = await confirm({
      title: isRtl ? 'الإبلاغ عن المنشور' : 'Report Post',
      description: isRtl ? 'لماذا تبلغ عن هذا المنشور؟' : 'Why are you reporting this post?',
      hasInput: true,
      inputPlaceholder: isRtl ? 'أدخل سبب الإبلاغ...' : 'Enter reason...',
      confirmLabel: isRtl ? 'إرسال البلاغ' : 'Submit Report',
      variant: 'warning',
      requiredInput: true,
    });
    if (!reason || typeof reason !== 'string' || !reason.trim()) return;

    try {
      const response = await fetch(`/api/bulletin/ads/${ad.id}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });
      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.error || (isRtl ? 'فشل إرسال البلاغ' : 'Failed to send report'));
      }
    } catch (error) {
      toast.error(isRtl ? 'خطأ في الاتصال' : 'Connection error');
    }
  };

  const handleRecommendationAdClick = (adId: number) => {
    if (activeTab !== 'board') {
      setActiveTab('board');
    }
    setTimeout(() => {
      const el = document.getElementById(`bulletin-ad-${adId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-accent');
        setTimeout(() => el.classList.remove('ring-2', 'ring-accent'), 2500);
      }
    }, 200);
  };

  const handleEditAd = (ad: BulletinAd) => {
    const synthesizedGallery: MediaGalleryItem[] = [];
    if (ad.media_gallery && Array.isArray(ad.media_gallery) && ad.media_gallery.length > 0) {
      synthesizedGallery.push(...ad.media_gallery);
    } else {
      if (ad.image_url) {
        const urls = ad.image_url.split(',').map(u => u.trim()).filter(Boolean);
        urls.forEach((url, i) => {
          synthesizedGallery.push({
            id: `img-${i}-${Date.now()}`,
            url,
            type: 'image',
            caption: ''
          });
        });
      }
      if (ad.video_url) {
        synthesizedGallery.push({
          id: `vid-0-${Date.now()}`,
          url: ad.video_url,
          type: 'video',
          caption: '',
          thumbnailUrl: ad.image_url ? ad.image_url.split(',')[0].trim() : undefined
        });
      }
    }

    setAdFormData({
      title: ad.title,
      description: ad.description,
      image_url: ad.image_url || '',
      video_url: ad.video_url || '',
      media_gallery: synthesizedGallery,
      whatsapp_number: ad.whatsapp_number || '',
      phone_number: ad.phone_number || '',
      target_url: ad.target_url || '',
      hashtags: Array.isArray(ad.hashtags) ? ad.hashtags.join(',') : (ad.hashtags || ''),
      page_id: ad.page_id || '',
      location_city: ad.location_city || 'القدس الشريف',
      location_radius: '10',
      feeling: ad.feeling || '',
      is_ai_generated: ad.is_ai_generated || false,
      tagged_users: Array.isArray(ad.tagged_users) ? ad.tagged_users : [],
      has_whatsapp_button: !!ad.whatsapp_number,
      audience: (ad.audience as any) || 'public',
      ad_format: (ad.ad_format as any) || 'post',
      quick_questions: Array.isArray(ad.quick_questions) ? ad.quick_questions : ['', '', ''],
      aspect_ratio: (ad as any).aspect_ratio || 'grid'
    });
    setEditingAdId(ad.id);
    setIsEditMode(true);
    setIsAdModalOpen(true);
  };

  const confirm = useConfirm();

  const handleDeleteAd = async (ad: BulletinAd) => {
    if (!token) return;
    const confirmDelete = await confirm({
      title: isRtl ? 'حذف المنشور' : 'Delete Post',
      description: isRtl ? 'هل أنت متأكد من حذف هذا المنشور نهائياً؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure you want to delete this post permanently? This action cannot be undone.',
      variant: 'danger',
      confirmLabel: isRtl ? 'حذف نهائياً' : 'Delete Permanently'
    });
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/bulletin/ads/${ad.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success(isRtl ? 'تم حذف المنشور بنجاح' : 'Post deleted successfully');
        setAds(prev => prev.filter(a => a.id !== ad.id));
        setMyAds(prev => prev.filter(a => a.id !== ad.id));
      } else {
        toast.error(data.error || 'فشل حذف المنشور');
      }
    } catch (e) {
      toast.error('حدث خطأ أثناء حذف المنشور');
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error(isRtl ? 'يرجى تسجيل الدخول أولاً' : 'Please log in first');
      return;
    }

    const totalMediaCount = (adFormData.media_gallery && adFormData.media_gallery.length > 0)
      ? adFormData.media_gallery.length
      : (adFormData.image_url ? adFormData.image_url.split(',').map(u => u.trim()).filter(Boolean).length : 0);
    if (totalMediaCount > 20) {
      toast.error(isRtl ? 'الحد الأقصى المسموح به هو 20 وسيطة فقط' : 'The maximum limit allowed is only 20 media items');
      return;
    }

    setIsSubmittingAd(true);
    try {
      const desc = adFormData.description || '';
      const textHashtags = (desc.match(/#[\p{L}\p{N}_]+/gu) || []).map(h => h.replace(/^#/, '').trim());
      const existingHashtags = Array.isArray(adFormData.hashtags)
        ? adFormData.hashtags.map((h: any) => String(h).replace(/^#/, '').trim()).filter(Boolean)
        : typeof adFormData.hashtags === 'string'
        ? adFormData.hashtags.split(/[,\s]+/).map(h => h.replace(/^#/, '').trim()).filter(Boolean)
        : [];
      const mergedHashtags = Array.from(new Set([...existingHashtags, ...textHashtags]));

      const textMentions = (desc.match(/@[\p{L}\p{N}_]+/gu) || []).map(m => m.replace(/^@/, '').trim()).filter(Boolean);
      const existingMentions = (Array.isArray(adFormData.tagged_users) ? adFormData.tagged_users : [])
        .map(m => String(m).replace(/^@/, '').trim())
        .filter(Boolean);
      const mergedMentions = Array.from(new Set([...existingMentions, ...textMentions]));

      const payload = {
        ...adFormData,
        title: adFormData.title?.trim() || (desc.length > 60 ? desc.slice(0, 60) + '...' : desc) || 'منشور جديد',
        hashtags: mergedHashtags.join(','),
        tagged_users: mergedMentions
      };

      const url = isEditMode ? `/api/bulletin/ads/${editingAdId}` : '/api/bulletin/ads';
      const method = isEditMode ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        toast.clear();
        if (isEditMode) {
          toast.success(isRtl ? 'تم تحديث المنشور بنجاح! ✨' : 'Post updated successfully! ✨');
        } else {
          toast.success(isRtl ? 'تم نشر منشورك بنجاح! 🎉' : 'Your post has been published successfully! 🎉');
        }
        setIsAdModalOpen(false);
        setIsEditMode(false);
        setEditingAdId(null);
        setAdFormData({
          title: '',
          description: '',
          image_url: '',
          video_url: '',
          media_gallery: [],
          whatsapp_number: '',
          phone_number: '',
          target_url: '',
          hashtags: '',
          page_id: '',
          location_city: 'القدس الشريف',
          location_radius: '10',
          feeling: '',
          is_ai_generated: false,
          tagged_users: [],
          has_whatsapp_button: false,
          audience: 'public',
          ad_format: 'post',
          quick_questions: ['', '', ''],
          aspect_ratio: 'grid'
        });
        fetchMyAds();
        fetchAds();
        fetchWallet();
        if (selectedPageDetail) {
          handleOpenPageDetail(selectedPageDetail.page.id);
        }
        setActiveTab('board');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        toast.error(data.error || 'فشل نشر المنشور');
      }
    } catch (error) {
      console.error('Error creating ad:', error);
      toast.error('حدث خطأ أثناء نشر الإعلان');
    } finally {
      setIsSubmittingAd(false);
    }
  };

  const handleMixedMediaUpload = async (e: React.ChangeEvent<HTMLInputElement> | { target: { files: FileList | File[] } }) => {
    const filesList = e.target.files;
    if (!filesList || filesList.length === 0) return;

    setIsAdModalOpen(true);
    const filesArray = Array.from(filesList);

    const currentGallery = adFormData.media_gallery || [];
    const maxLimit = 20;

    if (currentGallery.length >= maxLimit) {
      toast.error(isRtl ? `الحد الأقصى هو ${maxLimit} وسيطة للمنشور الواحد` : `Cannot upload more than ${maxLimit} media items per post`);
      return;
    }

    let filesToUpload = filesArray;
    if (currentGallery.length + filesArray.length > maxLimit) {
      const allowedCount = maxLimit - currentGallery.length;
      toast.warning(
        isRtl
          ? `الحد الأقصى هو ${maxLimit} عنصر. سيتم رفع أول ${allowedCount} وسائط إضافية فقط.`
          : `Maximum limit is ${maxLimit} items. Only the first ${allowedCount} items will be uploaded.`
      );
      filesToUpload = filesArray.slice(0, allowedCount);
    }

    const toastId = toast.loading(
      isRtl
        ? `جاري معالجة ورفع الوسائط (${filesToUpload.length} عنصر)...`
        : `Processing and uploading media (${filesToUpload.length} items)...`
    );

    try {
      const authToken = token || secureStorage.getSync('app_token') || '';
      const newItems: MediaGalleryItem[] = [];
      let imagesUploaded = 0;
      let videosUploaded = 0;

      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const isVideo = file.type.startsWith('video/');
        const isImage = file.type.startsWith('image/');

        if (!isVideo && !isImage) {
          toast.error(isRtl ? `الملف ${file.name} ليس مدعوماً (صور أو فيديو فقط)` : `File ${file.name} is not supported`);
          continue;
        }

        if (isVideo) {
          if (file.size > 100 * 1024 * 1024) {
            toast.error(isRtl ? `حجم الفيديو ${file.name} يتجاوز 100MB` : `Video ${file.name} exceeds 100MB`);
            continue;
          }

          let thumbUrl: string | undefined;
          let videoRatio = '16:9';
          let isVertical = false;
          try {
            const meta = await extractVideoMetadata(file);
            thumbUrl = meta.thumbnail;
            videoRatio = meta.aspectRatio;
            isVertical = meta.isVertical;
          } catch (_) {}

          const formDataUpload = new FormData();
          formDataUpload.append('file', file);

          const res = await fetch('/api/files/upload', {
            method: 'POST',
            headers: { Authorization: `Bearer ${authToken}` },
            body: formDataUpload
          });

          if (res.ok) {
            const data = await res.json();
            const rawUrl = data.fileUrl || data.file?.url || data.file?.file_url || data.url || data.path;
            const fileUrl = getMediaUrl(rawUrl);
            if (fileUrl) {
              newItems.push({
                id: `vid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                url: fileUrl,
                type: 'video',
                caption: '',
                thumbnailUrl: thumbUrl
              });
              videosUploaded++;
              setAdFormData(prev => ({
                ...prev,
                aspect_ratio: videoRatio,
                ad_format: isVertical ? 'reel' : (prev.ad_format || 'post')
              }));
            }
          }
        } else {
          if (file.size > 25 * 1024 * 1024) {
            toast.error(isRtl ? `حجم الصورة ${file.name} يتجاوز 25MB` : `Image ${file.name} exceeds 25MB`);
            continue;
          }

          const compressed = await compressAndResizeImage(file, {
            format: 'feed',
            quality: 0.88,
            mimeType: 'image/webp'
          });

          const formDataUpload = new FormData();
          formDataUpload.append('file', compressed.file);

          const res = await fetch('/api/files/upload', {
            method: 'POST',
            headers: { Authorization: `Bearer ${authToken}` },
            body: formDataUpload
          });

          if (res.ok) {
            const data = await res.json();
            const rawUrl = data.fileUrl || data.file?.url || data.file?.file_url || data.url || data.path;
            const fileUrl = getMediaUrl(rawUrl);
            if (fileUrl) {
              newItems.push({
                id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                url: fileUrl,
                type: 'image',
                caption: ''
              });
              imagesUploaded++;
            }
          }
        }
      }

      if (newItems.length > 0) {
        setAdFormData(prev => {
          const combinedGallery = [...(prev.media_gallery || []), ...newItems];
          const allImages = combinedGallery.filter(m => m.type === 'image').map(m => m.url);
          const firstVideo = combinedGallery.find(m => m.type === 'video');

          return {
            ...prev,
            media_gallery: combinedGallery,
            image_url: allImages.join(','),
            video_url: firstVideo ? firstVideo.url : prev.video_url
          };
        });
        toast.dismiss(toastId);
        const msg = isRtl
          ? `تم رفع الوسائط بنجاح (${imagesUploaded} صور، ${videosUploaded} فيديو)!`
          : `Successfully uploaded ${imagesUploaded} images & ${videosUploaded} videos!`;
        toast.success(msg);
      } else {
        throw new Error('No files uploaded');
      }
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(isRtl ? 'حدث خطأ أثناء رفع الوسائط، يرجى المحاولة لاحقاً' : 'Error uploading media files, please try again.');
    }
  };

  const handleImageFileUpload = (e: any) => handleMixedMediaUpload(e);

  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      toast.error(isRtl ? 'حجم الفيديو كبير جداً (الحد الأقصى 100MB)' : 'Video file is too large (max 100MB)');
      return;
    }

    setIsAdModalOpen(true);
    const localUrl = URL.createObjectURL(file);

    setVideoMetadataInfo({
      fileName: file.name,
      fileSize: file.size,
      localVideoUrl: localUrl,
      uploadProgress: 0,
      processingStage: 'uploading'
    });

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    const handleUploadFallback = (f: File, url: string) => {
      console.error('Video upload failed, falling back to local object URL');
      setAdFormData(prev => ({ ...prev, video_url: url }));
      setVideoMetadataInfo(prev => ({
        ...prev,
        processingStage: 'done',
        uploadProgress: 100
      }));
      toast.success(isRtl ? 'تم تحميل المقطع محلياً وجاهز للنشر!' : 'Video loaded locally and ready!');
      extractVideoMetadata(f).then(meta => {
        if (meta.thumbnail) {
          setAdFormData(prev => ({
            ...prev,
            image_url: prev.image_url || meta.thumbnail,
            aspect_ratio: meta.aspectRatio,
            ad_format: meta.isVertical ? 'reel' : (prev.ad_format || 'post')
          }));
        }
      }).catch(() => {});
    };

    const authToken = token || secureStorage.getSync('app_token') || '';
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/files/upload', true);
    xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        setVideoMetadataInfo(prev => ({
          ...prev,
          uploadProgress: percentComplete,
          processingStage: percentComplete >= 100 ? 'transcoding' : 'uploading'
        }));
      }
    };

    xhr.onload = async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          const rawUrl = data.fileUrl || data.file?.file_url || data.file?.url || data.url || data.path;
          const fileUrl = getMediaUrl(rawUrl);
          if (fileUrl) {
            let thumb = '';
            let videoRatio = '16:9';
            let isVertical = false;
            try {
              const meta = await extractVideoMetadata(file);
              thumb = meta.thumbnail;
              videoRatio = meta.aspectRatio;
              isVertical = meta.isVertical;
            } catch (_) {}

            setAdFormData(prev => {
              const gallery = [...(prev.media_gallery || [])];
              if (!gallery.some(m => m.url === fileUrl)) {
                gallery.push({
                  id: `vid-${Date.now()}`,
                  url: fileUrl,
                  type: 'video',
                  caption: '',
                  thumbnailUrl: thumb
                });
              }
              return {
                ...prev,
                video_url: fileUrl,
                media_gallery: gallery,
                aspect_ratio: videoRatio,
                image_url: prev.image_url || thumb,
                ad_format: isVertical ? 'reel' : ((prev.ad_format as string) === 'banner' ? 'post' : (prev.ad_format || 'post'))
              };
            });

            setVideoMetadataInfo(prev => ({
              ...prev,
              fileSize: data.fileSize || data.file?.file_size || file.size,
              duration: data.duration || data.file?.duration,
              resolution: data.resolution || data.file?.resolution,
              processingStage: 'done',
              uploadProgress: 100
            }));

            toast.success(isRtl ? 'تم رفع وتشغيل مقطع الفيديو بنجاح!' : 'Video uploaded & ready!');
          } else {
             handleUploadFallback(file, localUrl);
          }
        } catch (err) {
          console.error('Parse response error:', err);
          handleUploadFallback(file, localUrl);
        }
      } else {
        const errJson = (() => { try { return JSON.parse(xhr.responseText); } catch (e) { return {}; } })();
        toast.error(errJson.error || errJson.message_ar || (isRtl ? 'فشل الرفع' : 'Upload failed'));
        handleUploadFallback(file, localUrl);
      }
    };

    xhr.onerror = () => {
      toast.error(isRtl ? 'حدث خطأ في الشبكة' : 'Network error occurred');
      handleUploadFallback(file, localUrl);
    };

    xhr.send(formDataUpload);
  };

  const handleUploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const authToken = token || secureStorage.getSync('app_token') || '';

    let res = await fetch('/api/bulletin/upload', {
      method: 'POST',
      headers: {
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      },
      body: formData
    });

    if (!res.ok) {
      res = await fetch('/api/files/upload', {
        method: 'POST',
        headers: {
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        },
        body: formData
      });
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message_ar || err.error || (isRtl ? 'فشل رفع الملف' : 'Upload failed'));
    }
    const data = await res.json();
    return data.url || data.fileUrl || data.file?.url || data.file?.file_url || '';
  };

  const handleMixedMediaSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const authToken = token || secureStorage.getSync('app_token') || '';
    if (!authToken) {
      toast.error(isRtl ? 'يرجى تسجيل الدخول أولاً' : 'Please log in first');
      return;
    }

    const fileList = Array.from(files);
    for (const file of fileList) {
      if (file.type.startsWith('video/')) {
        const fakeEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
        handleVideoFileUpload(fakeEvent);
      } else if (file.type.startsWith('image/')) {
        const uploadToast = toast.loading(isRtl ? `جاري معالجة ورفع الصورة: ${file.name}...` : `Uploading: ${file.name}...`);
        try {
          const url = await handleUploadFile(file);
          toast.dismiss(uploadToast);
          if (url) {
            setAdFormData(prev => {
              const gallery = [...(prev.media_gallery || [])];
              if (!gallery.some(m => m.url === url)) {
                gallery.push({
                  id: `img-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                  url,
                  type: 'image',
                  caption: ''
                });
              }
              return {
                ...prev,
                image_url: prev.image_url ? `${prev.image_url},${url}` : url,
                media_gallery: gallery
              };
            });
            toast.success(isRtl ? 'تم رفع الصورة بنجاح!' : 'Image uploaded!');
          }
        } catch (err: any) {
          toast.dismiss(uploadToast);
          toast.error(err?.message || (isRtl ? 'فشل رفع الصورة' : 'Failed to upload image'));
        }
      }
    }
    e.target.value = '';
  };

  const handleReelFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!token) {
      toast.error(isRtl ? 'يرجى تسجيل الدخول أولاً' : 'Please log in first');
      return;
    }

    if (!file.type.startsWith('video/')) {
      toast.error(isRtl ? 'يرجى اختيار مقطع فيديو فقط لرفع الريلز القياسي (9:16)' : 'Please select a video file for standard Reels (9:16)');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast.error(isRtl ? 'حجم الفيديو كبير جداً (الحد الأقصى 100MB)' : 'Video file is too large (max 100MB)');
      return;
    }

    setAdFormData(prev => ({ ...prev, ad_format: 'reel' }));
    handleVideoFileUpload(e);
  };

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error(isRtl ? 'يرجى تسجيل الدخول أولاً' : 'Please log in first');
      return;
    }

    setIsSubmittingPage(true);
    try {
      const res = await fetch('/api/bulletin/pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(pageFormData)
      });
      const data = await res.json();
      if (data.success) {
        toast.success(isRtl ? 'مبروك! تم إنشاء صفحتك التجارية وتفعيلها بنجاح 🏪' : 'Merchant page created successfully!');
        setIsPageModalOpen(false);
        setPageFormData({
          name: '',
          category: 'تجارة إلكترونية / E-Commerce',
          city: 'غزة',
          address: '',
          description: '',
          avatar_url: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=200&q=80',
          cover_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
          whatsapp_number: '',
          phone_number: '',
          website_url: ''
        });
        fetchPages();
        fetchMyPages();
      } else {
        toast.error(data.error || 'فشل إنشاء الصفحة التجارية');
      }
    } catch (e) {
      toast.error('حدث خطأ أثناء إنشاء الصفحة');
    } finally {
      setIsSubmittingPage(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSubmittingProfile(true);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: profileFormData.name,
          email: profileFormData.email,
          avatar: profileFormData.avatar,
          cover_image: profileFormData.cover_image,
          occupation: profileFormData.occupation,
          location: profileFormData.location,
          bio: profileFormData.bio,
          custom_instructions: profileFormData.bio,
          website_url: profileFormData.website_url,
          custom_domain: profileFormData.custom_domain,
          is_domain_verified: profileFormData.is_domain_verified,
          social_links: profileFormData.social_links,
          verified_links: profileFormData.verified_links
        })
      });
      if (res.ok) {
        toast.success(isRtl ? 'تم تحديث الملف الشخصي والإعدادات بنجاح! ✨' : 'Profile & settings updated successfully!');
        await refreshUser();
        if (selectedUserDetail && user && selectedUserDetail.user.id === user.id) {
          setSelectedUserDetail(prev => prev ? {
            ...prev,
            user: {
              ...prev.user,
              name: profileFormData.name,
              avatar: profileFormData.avatar,
              cover_image: profileFormData.cover_image,
              occupation: profileFormData.occupation,
              location: profileFormData.location,
              bio: profileFormData.bio,
              website_url: profileFormData.website_url,
              custom_domain: profileFormData.custom_domain,
              is_domain_verified: profileFormData.is_domain_verified,
              social_links: profileFormData.social_links,
              verified_links: profileFormData.verified_links
            }
          } : null);
        }
        setIsProfileEditModalOpen(false);
      } else {
        const err = await res.json();
        toast.error(err.error || (isRtl ? 'فشل تعديل الملف الشخصي' : 'Failed to update profile'));
      }
    } catch (e) {
      toast.error(isRtl ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred');
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const optimized = await optimizeImageUpload(file, { maxWidth: 400, maxHeight: 400, aspectRatio: 1 });
      const url = await handleUploadFile(optimized);
      setProfileFormData(prev => ({ ...prev, avatar: url }));
      toast.success(isRtl ? 'تم قص وتجهيز الصورة الشخصية بنجاح 📸' : 'Avatar optimized & uploaded successfully');
    } catch (err: any) {
      toast.error(err.message || (isRtl ? 'فشل رفع الصورة' : 'Failed to upload image'));
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const optimized = await optimizeImageUpload(file, { maxWidth: 1200, maxHeight: 400, aspectRatio: 3 });
      const url = await handleUploadFile(optimized);
      setProfileFormData(prev => ({ ...prev, cover_image: url }));
      toast.success(isRtl ? 'تم قص وتجهيز صورة الغلاف بنجاح 🖼️' : 'Cover image optimized & uploaded successfully');
    } catch (err: any) {
      toast.error(err.message || (isRtl ? 'فشل رفع صورة الغلاف' : 'Failed to upload cover image'));
    }
  };

  const handleKycSelfieUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await handleUploadFile(file);
      setKycSelfieUrl(url);
      toast.success(isRtl ? 'تم رفع مستند التوثيق بنجاح' : 'KYC document uploaded successfully');
    } catch (err: any) {
      toast.error(err.message || (isRtl ? 'فشل رفع المستند' : 'Failed to upload document'));
    }
  };

  const handleEditPageAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const optimized = await optimizeImageUpload(file, { maxWidth: 400, maxHeight: 400, aspectRatio: 1 });
      const url = await handleUploadFile(optimized);
      setEditPageFormData(prev => ({ ...prev, avatar_url: url }));
      toast.success(isRtl ? 'تم قص وتجهيز شعار الصفحة بنجاح 🎯' : 'Page avatar optimized & uploaded successfully');
    } catch (err: any) {
      toast.error(err.message || (isRtl ? 'فشل رفع الشعار' : 'Failed to upload avatar'));
    }
  };

  const handleEditPageCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const optimized = await optimizeImageUpload(file, { maxWidth: 1200, maxHeight: 400, aspectRatio: 3 });
      const url = await handleUploadFile(optimized);
      setEditPageFormData(prev => ({ ...prev, cover_url: url }));
      toast.success(isRtl ? 'تم قص وتجهيز غلاف الصفحة بنجاح 🖼️' : 'Page cover optimized & uploaded successfully');
    } catch (err: any) {
      toast.error(err.message || (isRtl ? 'فشل رفع الغلاف' : 'Failed to upload cover'));
    }
  };

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!kycFullName.trim() || !kycSelfieUrl.trim()) {
      toast.error(isRtl ? 'يرجى ملء جميع الحقول المطلوبة لتوثيق الهوية' : 'Please fill in all required fields');
      return;
    }
    setIsSubmittingProfile(true);
    try {
      const res = await fetch('/api/kyc/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: kycFullName.trim(),
          selfie: kycSelfieUrl.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(isRtl ? 'تم إرسال طلب التوثيق بنجاح! قيد المراجعة 🛡️' : 'Verification request submitted successfully!');
        await refreshUser();
        setIsProfileEditModalOpen(false);
      } else {
        toast.error(data.error || (isRtl ? 'فشل إرسال طلب التوثيق' : 'Failed to submit verification'));
      }
    } catch (e) {
      toast.error(isRtl ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred');
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const handleSavePageEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingPageData) return;
    setIsSubmittingPageEdit(true);
    try {
      const payload: any = {
        ...editPageFormData,
        managers: editPageManagers
      };

      const res = await fetch(`/api/bulletin/pages/${editingPageData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        toast.success(isRtl ? 'تم حفظ تعديلات الصفحة التجارية بنجاح! 🏪' : 'Page edited successfully!');
        setIsEditPageModalOpen(false);
        setEditingPageData(null);
        await fetchPages();
        await fetchMyPages();

        if (selectedPageDetail && selectedPageDetail.page.id === data.page.id) {
          setSelectedPageDetail(prev => prev ? { ...prev, page: data.page } : null);
        }
      } else {
        toast.error(data.error || (isRtl ? 'فشل تعديل الصفحة التجارية' : 'Failed to edit page'));
      }
    } catch (e) {
      toast.error(isRtl ? 'حدث خطأ أثناء تعديل الصفحة' : 'Error updating page');
    } finally {
      setIsSubmittingPageEdit(false);
    }
  };

  const handleShareAd = async (ad: BulletinAd) => {
    const shareUrl = getPostShareUrl(ad);

    try {
      await fetch(`/api/bulletin/ads/${ad.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: user?.id,
          sharer_name: user?.name || user?.email || (isRtl ? 'أحد المستخدمين' : 'A user'),
        }),
      });
    } catch (e) {}

    if (navigator.share) {
      try {
        await navigator.share({
          title: ad.title,
          text: ad.description,
          url: shareUrl
        });
        return;
      } catch (e: any) {
        if (e?.name === 'AbortError') {
          return;
        }
      }
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      toast.success(isRtl ? 'تم نسخ رابط المنشور بنجاح' : 'Post link copied to clipboard');
    } catch (err) {}
  };

  const handleWhatsAppClick = (ad: BulletinAd, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!ad.whatsapp_number) return;

    fetch(`/api/bulletin/ads/${ad.id}/click`, { method: 'POST' }).catch(() => {});

    let cleanPhone = ad.whatsapp_number.replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
      `مرحباً! أود الاستفسار عن إعلانك "${ad.title}" على المنصة التجارية.`
    )}`;
    window.open(waUrl, '_blank');
  };

  const filteredInquiriesList = inquiriesList.filter(inq => {
    const term = inquiriesSearchTerm.toLowerCase();
    return (
      (inq.sender_name && inq.sender_name.toLowerCase().includes(term)) ||
      (inq.message && inq.message.toLowerCase().includes(term)) ||
      (inq.ad_title && inq.ad_title.toLowerCase().includes(term)) ||
      (inq.sender_phone && inq.sender_phone.toLowerCase().includes(term))
    );
  });

  const orderedStories = useMemo(() => {
    const now = Date.now();
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

    const activeStories = (stories || []).filter((story: any) => {
      if (story.expires_at) {
        return new Date(story.expires_at).getTime() > now;
      }
      if (story.created_at) {
        return (now - new Date(story.created_at).getTime()) <= TWENTY_FOUR_HOURS_MS;
      }
      return true;
    });

    const groups: { [key: string]: any[] } = {};
    activeStories.forEach((story: any) => {
      const key = story.page_id ? `page-${story.page_id}` : `user-${story.author_id || story.user_id}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(story);
    });

    const result: any[] = [];
    Object.values(groups).forEach(group => {
      const sorted = [...group].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      result.push(...sorted.slice(0, 10));
    });
    return result;
  }, [stories]);

  const representativeStories = useMemo(() => {
    const seen = new Set();
    return orderedStories.filter((story: any) => {
      const key = story.page_id ? `page-${story.page_id}` : `user-${story.author_id || story.user_id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [orderedStories]);

  const handleMobileBack = () => {
    if (isMobileSearchOpen) {
      setIsMobileSearchOpen(false);
      return;
    }
    if (selectedPageDetail) {
      handleBackToBoard();
      return;
    }
    if (activeTab !== 'board') {
      setActiveTab('board');
      return;
    }
    navigate('/chat');
  };

  return (
    <div className="min-h-screen-safe bg-[var(--surface-page)] text-[var(--text-primary)] transition-theme pb-24">

      {}
      <header
        dir={isRtl ? 'rtl' : 'ltr'}
        className="sticky top-0 z-[160] h-[calc(52px+env(safe-area-inset-top,0px))] lg:h-[calc(56px+env(safe-area-inset-top,0px))] pt-[env(safe-area-inset-top,0px)] bg-[var(--surface-page)]/95 backdrop-blur-md border-b border-[var(--border-default)] transition-theme shadow-xs"
      >
        <div className="w-full max-w-[1536px] 2xl:max-w-[1680px] mx-auto h-full px-3 sm:px-4 lg:px-6 flex items-center justify-between gap-2 sm:gap-4">

          {}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 shrink-0">
            {}
            <NavLink
              to="/"
              onClick={() => {
                triggerHaptic('light');
              }}
              className="group/logo-link relative w-8 h-8 rounded-shape-sm overflow-hidden border border-[var(--border-default)] hover:border-[var(--border-accent)] bg-transparent hover:bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] transition-all duration-150 flex items-center justify-center flex-shrink-0 active:scale-95 cursor-pointer before:absolute before:-inset-1.5 before:content-['']"
              title={t('appName') || siteSettings?.siteName || "Perplexta"}
              aria-label={t('appName') || siteSettings?.siteName || "Perplexta"}
            >
              {(siteSettings?.logoBase64 || siteSettings?.logoLightBase64) ? (
                <div className="w-full h-full overflow-hidden flex items-center justify-center">
                  <NotificationIconRenderer
                    src={resolveImageUrl((theme === 'light' && siteSettings?.logoLightBase64) ? siteSettings.logoLightBase64 : siteSettings?.logoBase64, 'general')}
                    alt={t('appName') || siteSettings?.siteName || "Perplexta"}
                    size={32}
                    className="w-full h-full object-contain block"
                    fallbackIcon={<Cpu size={14} className="text-[var(--accent)]" />}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center text-[var(--text-primary)]">
                  <Cpu size={14} className="text-[var(--accent)]" />
                </div>
              )}
            </NavLink>

            {}
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm sm:text-base font-black tracking-tight text-[var(--text-primary)] select-none">
                {isRtl ? 'فيرال بوك' : 'ViralBook'}
              </span>
              {selectedPageDetail ? (
                <span className="hidden md:inline-flex items-center gap-1 text-xs text-[var(--text-muted)] font-medium">
                  <span className="text-[var(--border-default)]">/</span>
                  <span className="truncate max-w-[140px] text-accent font-bold">{selectedPageDetail.page.name}</span>
                </span>
              ) : activeTab !== 'board' ? (
                <span className="hidden md:inline-flex items-center gap-1 text-xs text-[var(--text-muted)] font-medium">
                  <span className="text-[var(--border-default)]">/</span>
                  <span className="truncate">
                    {activeTab === 'pages' && (isRtl ? 'دليل الصفحات التجارية' : 'Pages Directory')}
                    {activeTab === 'inquiries' && (isRtl ? 'الرسائل والاستفسارات' : 'Inquiries')}
                    {activeTab === 'my_ads' && (isRtl ? 'حملاتي وإعلاناتي' : 'My Campaigns')}
                    {activeTab === 'analytics' && (isRtl ? 'التحليلات' : 'Analytics')}
                    {activeTab === 'saved' && (isRtl ? 'المحفوظات' : 'Saved')}
                    {activeTab === 'reels' && (isRtl ? 'مقاطع ريلز' : 'Reels')}
                  </span>
                </span>
              ) : null}
            </div>
          </div>

          {}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0 flex-1 justify-center max-w-xl mx-auto min-w-0">
            {/* Dropdown 1: Categories */}
            {activeTab === 'board' && (
              <div ref={categoryDropdownRef} className="relative hidden md:block shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                    setIsSortDropdownOpen(false);
                  }}
                  className="group h-8 px-2.5 rounded-shape-sm border border-[var(--border-default)] hover:border-[var(--border-accent)] bg-transparent hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-bold transition-all duration-150 flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-2xs"
                  title={isRtl ? 'تصفية حسب الفئة' : 'Filter by Category'}
                >
                  <Tag size={13} className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors duration-150" />
                  <span className="truncate max-w-[85px]">{currentCategoryLabel}</span>
                  <ChevronDown size={11} className={`transition-transform duration-150 shrink-0 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isCategoryDropdownOpen && (() => {
                    const sortedCategories = [...VIRALBOOK_CATEGORIES].sort((a, b) => {
                      const labelA = (isRtl ? a.labelAr : a.labelEn).trim();
                      const labelB = (isRtl ? b.labelAr : b.labelEn).trim();
                      const lenA = labelA.length;
                      const lenB = labelB.length;
                      return lenA !== lenB ? lenA - lenB : labelA.localeCompare(labelB);
                    });

                    return (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                        className={`absolute top-full mt-1.5 ${isRtl ? 'right-0 origin-top-right' : 'left-0 origin-top-left'} w-max min-w-[190px] p-1 rounded-shape-md border border-[var(--border-default)] shadow-lg flex flex-col gap-0.5 z-[100] bg-[var(--surface-card)] backdrop-blur-xl max-h-64 overflow-y-auto overscroll-contain custom-scrollbar`}
                        dir={isRtl ? 'rtl' : 'ltr'}
                      >
                        <div className="px-2 py-1 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-default)] mb-0.5">
                          {isRtl ? 'تصفية حسب الفئة' : 'Filter by Category'}
                        </div>
                        {sortedCategories.map((cat) => {
                          const isSelected = selectedCategory === cat.id;
                          const label = isRtl ? cat.labelAr : cat.labelEn;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                setSelectedCategory(cat.id);
                                setIsCategoryDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-shape-sm text-xs font-semibold transition-all duration-150 cursor-pointer select-none group ${
                                isSelected
                                  ? 'bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] text-[var(--accent)] font-bold'
                                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]'
                              }`}
                            >
                              <span className="truncate min-w-0 transition-colors">{label}</span>
                              {isSelected && <Check size={12} className="text-[var(--accent)] shrink-0 ms-1.5" />}
                            </button>
                          );
                        })}
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>
              </div>
            )}

            {/* Dropdown 2: Sort */}
            {activeTab === 'board' && (
              <div ref={sortDropdownRef} className="relative hidden sm:block shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsSortDropdownOpen(!isSortDropdownOpen);
                    setIsCategoryDropdownOpen(false);
                  }}
                  className="group h-8 px-2.5 rounded-shape-sm border border-[var(--border-default)] hover:border-[var(--border-accent)] bg-transparent hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-bold transition-all duration-150 flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-2xs"
                  title={isRtl ? 'ترتيب المنشورات' : 'Sort Posts'}
                >
                  <ArrowUpDown size={13} className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors duration-150" />
                  <span className="truncate max-w-[80px]">{currentSortLabel}</span>
                  <ChevronDown size={11} className={`transition-transform duration-150 shrink-0 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isSortDropdownOpen && (() => {
                    const sortedSortOptions = [...VIRALBOOK_SORT_OPTIONS].sort((a, b) => {
                      const labelA = (isRtl ? a.labelAr : a.labelEn).trim();
                      const labelB = (isRtl ? b.labelAr : b.labelEn).trim();
                      const lenA = labelA.length;
                      const lenB = labelB.length;
                      return lenA !== lenB ? lenA - lenB : labelA.localeCompare(labelB);
                    });

                    return (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                         className={`absolute top-full mt-1.5 ${isRtl ? 'right-0 origin-top-right' : 'left-0 origin-top-left'} w-max min-w-[160px] p-1 rounded-shape-md border border-[var(--border-default)] shadow-lg flex flex-col gap-0.5 z-[100] bg-[var(--surface-card)] backdrop-blur-xl overscroll-contain`}
                        dir={isRtl ? 'rtl' : 'ltr'}
                      >
                        <div className="px-2 py-1 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-default)] mb-0.5">
                          {isRtl ? 'ترتيب المنشورات' : 'Sort Posts'}
                        </div>
                        {sortedSortOptions.map((opt) => {
                          const isSelected = sortBy === opt.id;
                          const label = isRtl ? opt.labelAr : opt.labelEn;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                setSortBy(opt.id as 'latest' | 'popular');
                                setIsSortDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-shape-sm text-xs font-semibold transition-all duration-150 cursor-pointer select-none group ${
                                isSelected
                                  ? 'bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] text-[var(--accent)] font-bold'
                                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]'
                              }`}
                            >
                              <span className="truncate min-w-0 transition-colors">{label}</span>
                              {isSelected && <Check size={12} className="text-[var(--accent)] shrink-0 ms-1.5" />}
                            </button>
                          );
                        })}
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>
              </div>
            )}

            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative hidden md:flex items-center md:w-60 lg:w-72 h-8 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] focus-within:border-[var(--border-accent)] focus-within:ring-2 focus-within:ring-[var(--accent)]/10 transition-all duration-150 shadow-2xs group">
              <Search size={13} className="absolute start-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none transition-colors group-focus-within:text-[var(--accent)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isRtl ? 'بحث...' : 'Search...'}
                className="w-full h-full ps-8 pe-6 bg-transparent text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none transition-theme font-sans"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute end-1.5 top-1/2 -translate-y-1/2 p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-shape-sm hover:bg-[var(--surface-card)] transition-colors cursor-pointer"
                  title={isRtl ? 'مسح البحث' : 'Clear search'}
                >
                  <X size={12} />
                </button>
              )}
            </form>

            {/* Location Filter Trigger */}
            {activeTab === 'board' && (
              <button
                type="button"
                onClick={() => setIsLocationFlyoutOpen(!isLocationFlyoutOpen)}
                className="group/loc-btn relative hidden sm:flex w-8 h-8 rounded-shape-sm border border-[var(--border-default)] hover:border-[var(--border-accent)] bg-transparent hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-150 items-center justify-center shrink-0 active:scale-95 cursor-pointer shadow-2xs"
                title={
                  selectedCity === 'all'
                    ? (isRtl ? 'تحديد نطاق تغطية الموقع (كافة المحافظات)' : 'Location radius filter (All Regions)')
                    : (isRtl ? `تحديد نطاق الموقع: ${selectedCity} (${selectedRadius === 'all' ? 'الكل' : `+${selectedRadius} كم`})` : `Location: ${selectedCity} (${selectedRadius === 'all' ? 'All' : `+${selectedRadius} km`})`)
                }
              >
                <MapPin
                  size={14}
                  className="transition-transform duration-150 group-hover/loc-btn:scale-110 text-[var(--text-muted)] group-hover/loc-btn:text-[var(--text-primary)]"
                />
              </button>
            )}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 order-3">
            {/* Inquiries / Chat Inbox Trigger */}
            {user && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  if (selectedPageDetail) setSelectedPageDetail(null);
                  setActiveTab('inquiries');
                }}
                className="group hidden sm:flex w-8 h-8 rounded-shape-sm border border-[var(--border-default)] hover:border-[var(--border-accent)] bg-transparent hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer shadow-2xs relative"
                title={isRtl ? 'الرسائل والاستفسارات' : 'Inquiries & Messages'}
              >
                <MessageSquare size={14} className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors duration-150" />
                {inquiriesList.length > 0 && (
                  <span className="absolute -top-1 -end-1 w-4 h-4 rounded-shape-full bg-red-500 text-white text-[9px] font-extrabold flex items-center justify-center ring-2 ring-[var(--surface-page)]">
                    {inquiriesList.length}
                  </span>
                )}
              </button>
            )}

            {/* Language Toggle */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setLanguage(language === 'ar' ? 'en' : 'ar');
              }}
              className="group w-8 h-8 rounded-shape-sm border border-[var(--border-default)] hover:border-[var(--border-accent)] bg-transparent hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer shadow-2xs"
              title={language === 'ar' ? 'English' : 'العربية'}
            >
              <Languages size={14} className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors duration-150" />
            </button>

            {/* Theme Toggle */}
            <ThemeToggleButton variant="icon-button" size="sm" className="!w-8 !h-8 !rounded-shape-sm !border-[var(--border-default)] hover:!border-[var(--border-accent)] !bg-transparent hover:!bg-[var(--surface-subtle)] !text-[var(--text-muted)] hover:!text-[var(--text-primary)] shadow-2xs transition-all duration-150" />

            <div className="w-px h-5 bg-[var(--border-default)] shrink-0 hidden xs:block" />

            {/* Back to Chat / Feed */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                if (selectedPageDetail) {
                  setSelectedPageDetail(null);
                  return;
                }
                navigate('/chat');
              }}
              className="group h-8 px-2.5 sm:px-3 rounded-shape-sm border border-[var(--border-default)] hover:border-[var(--border-accent)] bg-transparent hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold text-xs flex items-center gap-1.5 transition-all duration-150 active:scale-95 shadow-2xs cursor-pointer shrink-0"
              title={selectedPageDetail ? (isRtl ? 'رجوع إلى الخلاصة' : 'Back to Feed') : (isRtl ? 'العودة إلى الصفحة الرئيسية' : 'Back to Home')}
            >
              {isRtl ? (
                <ArrowLeft size={13} className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-transform duration-150 group-hover:-translate-x-0.5" />
              ) : (
                <ArrowRight size={13} className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-transform duration-150 group-hover:translate-x-0.5" />
              )}
              <span className="hidden xs:inline font-sans text-xs font-bold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
                {selectedPageDetail ? (isRtl ? 'رجوع' : 'Back') : (isRtl ? 'الرئيسية' : 'Home')}
              </span>
            </button>
          </div>

        </div>

        {}
        <AnimatePresence>
          {isMobileSearchOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
              className="md:hidden w-full border-t border-[var(--border-default)] bg-[var(--surface-page)]/98 backdrop-blur-md px-3 py-2 overflow-hidden shadow-md"
            >
              <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full h-9 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] focus-within:border-accent/50 focus-within:ring-2 focus-within:ring-accent/10 transition-all">
                <Search size={14} className="absolute start-2.5 top-1/2 -translate-y-1/2 text-accent shrink-0 pointer-events-none" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isRtl ? 'ابحث في المنشورات، الإعلانات، والصفحات...' : 'Search posts, ads, pages...'}
                  className="w-full h-full ps-8 pe-16 bg-transparent text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none font-sans"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute end-12 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                    title={isRtl ? 'مسح' : 'Clear'}
                  >
                    <X size={12} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsMobileSearchOpen(false)}
                  className="absolute end-1.5 top-1/2 -translate-y-1/2 px-2 py-0.5 text-[11px] font-extrabold text-accent hover:bg-accent/10 rounded-shape-xs transition-colors cursor-pointer"
                >
                  {isRtl ? 'إغلاق' : 'Close'}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-40 pointer-events-none transition-transform duration-100 flex flex-col items-center justify-center"
          style={{
            top: isRefreshing ? '76px' : `${Math.min(pullDistance + 50, 115)}px`,
            opacity: isRefreshing ? 1 : Math.min(pullDistance / 35, 1)
          }}
        >
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-shape-sm bg-[var(--surface-card)]/95 backdrop-blur-md border border-[var(--border-main)] shadow-xl text-xs font-bold text-[var(--text-primary)]">
            <RefreshCw
              size={16}
              className={`text-accent ${isRefreshing ? 'animate-spin' : ''}`}
              style={{
                transform: isRefreshing ? undefined : `rotate(${pullDistance * 4}deg)`
              }}
            />
            <span>
              {isRefreshing
                ? (isRtl ? 'جارٍ تحديث المحتوى...' : 'Refreshing feed...')
                : pullDistance >= 55
                  ? (isRtl ? 'اترك للتحديث الفوري' : 'Release to refresh')
                  : (isRtl ? 'اسحب للتحديث' : 'Pull down to refresh')}
            </span>
          </div>
        </div>
      )}

      {}
      <div className="w-full max-w-[1536px] 2xl:max-w-[1680px] mx-auto px-3 sm:px-4 lg:px-6 pt-3 sm:pt-4 lg:pt-5 pb-28 lg:pb-8">

        {}
        <AnimatePresence>
          {isMobileSidebarOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileSidebarOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ x: isRtl ? '100%' : '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: isRtl ? '100%' : '-100%' }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className={`absolute top-0 bottom-0 ${isRtl ? 'end-0' : 'start-0'} w-80 max-w-[85%] bg-[var(--surface-card)] shadow-2xl z-10 flex flex-col`}
              >
                <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-shape-sm bg-accent/10 flex items-center justify-center text-accent font-bold">
                      <SlidersHorizontal size={14} />
                    </div>
                    <h3 className="text-xs font-extrabold">{isRtl ? 'قائمة بيربليكستا بورد والتحكم' : 'Perplexta Board Menu & Controls'}</h3>
                  </div>
                  <button
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="w-8 h-8 rounded-shape-sm border border-[var(--border-default)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] active:scale-95 transition-theme"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-5">
                  {}
                  <div className="space-y-1.5 pb-2 border-b border-[var(--border-default)]">
                    <h4 className="text-[11px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider mb-2">{isRtl ? 'أقسام المنصة' : 'Platform Sections'}</h4>
                    <button
                      onClick={() => { setSelectedPageDetail(null); setActiveTab('board'); setIsMobileSidebarOpen(false); }}
                      className={`group w-full px-3 py-2.5 rounded-[var(--radius-md)] text-xs font-bold flex items-center gap-2.5 transition-theme ${
                        activeTab === 'board' && !selectedPageDetail
                          ? 'bg-accent/10 text-accent shadow-sm border border-accent/20'
                          : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'
                      }`}
                    >
                      <Megaphone size={16} className={`transition-theme ${activeTab === 'board' && !selectedPageDetail ? 'text-accent' : 'text-[var(--text-muted)] group-hover:text-accent'}`} />
                      <span>{isRtl ? 'الإعلانات والمنشورات' : 'Ads & Posts'}</span>
                    </button>

                    <button
                      onClick={() => { setSelectedPageDetail(null); setActiveTab('pages'); setIsMobileSidebarOpen(false); }}
                      className={`group w-full px-3 py-2.5 rounded-[var(--radius-md)] text-xs font-bold flex items-center gap-2.5 transition-theme ${
                        activeTab === 'pages' && !selectedPageDetail
                          ? 'bg-accent/10 text-accent shadow-sm border border-accent/20'
                          : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'
                      }`}
                    >
                      <Building2 size={16} className={`transition-theme ${activeTab === 'pages' && !selectedPageDetail ? 'text-accent' : 'text-[var(--text-muted)] group-hover:text-accent'}`} />
                      <span>{isRtl ? 'الصفحات التجارية' : 'Merchant Pages'}</span>
                    </button>

                    {user && (
                      <button
                        onClick={() => { setSelectedPageDetail(null); setActiveTab('inquiries'); setIsMobileSidebarOpen(false); }}
                        className={`group w-full px-3 py-2.5 rounded-[var(--radius-md)] text-xs font-bold flex items-center justify-between transition-theme ${
                          activeTab === 'inquiries' && !selectedPageDetail
                            ? 'bg-accent/10 text-accent shadow-sm border border-accent/20'
                            : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Inbox size={16} className={`transition-theme ${activeTab === 'inquiries' && !selectedPageDetail ? 'text-accent' : 'text-[var(--text-muted)] group-hover:text-accent'}`} />
                          <span>{isRtl ? 'الرسائل والاستفسارات' : 'Inquiries & Messages'}</span>
                        </div>
                        {inquiriesList.length > 0 && (
                          <span className="px-2 py-0.5 rounded-shape-xs bg-accent/10 text-accent text-[10px] font-black">
                            {inquiriesList.length}
                          </span>
                        )}
                      </button>
                    )}

                    {user && (
                      <button
                        onClick={() => { setSelectedPageDetail(null); setActiveTab('my_ads'); setIsMobileSidebarOpen(false); }}
                        className={`group w-full px-3 py-2.5 rounded-[var(--radius-md)] text-xs font-bold flex items-center gap-2.5 transition-theme ${
                          activeTab === 'my_ads' && !selectedPageDetail
                            ? 'bg-accent/10 text-accent shadow-sm border border-accent/20'
                            : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'
                        }`}
                      >
                        <Tag size={16} className={`transition-theme ${activeTab === 'my_ads' && !selectedPageDetail ? 'text-accent' : 'text-[var(--text-muted)] group-hover:text-accent'}`} />
                        <span>{isRtl ? 'إعلاناتي وإدارتها' : 'My Advertisements'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => { setSelectedPageDetail(null); setActiveTab('analytics'); setIsMobileSidebarOpen(false); }}
                      className={`group w-full px-3 py-2.5 rounded-[var(--radius-md)] text-xs font-bold flex items-center gap-2.5 transition-theme ${
                        activeTab === 'analytics' && !selectedPageDetail
                          ? 'bg-accent/10 text-accent shadow-sm border border-accent/20'
                          : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'
                      }`}
                    >
                      <BarChart2 size={16} className={`transition-theme ${activeTab === 'analytics' && !selectedPageDetail ? 'text-accent' : 'text-[var(--text-muted)] group-hover:text-accent'}`} />
                      <span>{isRtl ? 'تحليلات الأداء' : 'Performance Analytics'}</span>
                    </button>

                    <button
                      onClick={() => {
                        if (!token) { setIsAuthModalOpen(true); return; }
                        setSelectedPageDetail(null);
                        setActiveTab('saved');
                        setIsMobileSidebarOpen(false);
                        fetchSavedAds();
                      }}
                      className={`group w-full px-3 py-2.5 rounded-[var(--radius-md)] text-xs font-bold flex items-center gap-2.5 transition-theme ${
                        activeTab === 'saved' && !selectedPageDetail
                          ? 'bg-accent/10 text-accent shadow-sm border border-accent/20'
                          : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'
                      }`}
                    >
                      <Bookmark size={16} className={`transition-theme ${activeTab === 'saved' && !selectedPageDetail ? 'text-accent' : 'text-[var(--text-muted)] group-hover:text-accent'}`} />
                      <span>{isRtl ? 'المحفوظات' : 'Saved Items'}</span>
                    </button>
                  </div>

                  {}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => {
                        if (!token) { setIsAuthModalOpen(true); return; }
                        setIsPageModalOpen(true);
                        setIsMobileSidebarOpen(false);
                      }}
                      className="p-2.5 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] text-[var(--text-primary)] font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Building2 size={14} className="text-accent" />
                      <span>{isRtl ? 'إنشاء صفحة' : 'Create Page'}</span>
                    </button>
                    <button
                      onClick={() => {
                        if (!token) { setIsAuthModalOpen(true); return; }
                        setIsAdModalOpen(true);
                        setIsMobileSidebarOpen(false);
                      }}
                      className="p-2.5 rounded-[var(--radius-md)] bg-accent text-[var(--text-primary)] font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-none"
                    >
                      <Plus size={14} />
                      <span>{isRtl ? 'نشر إعلان' : 'Publish Ad'}</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {}
        {activeTab === 'analytics' && !selectedPageDetail ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-[var(--radius-md)] bg-[var(--surface-card)] border border-[var(--border-default)]">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab('board')}
                  className="px-4 py-2 rounded-[var(--radius-md)] bg-accent hover:bg-accent text-[var(--text-primary)] font-bold text-xs flex items-center gap-2 shadow transition-theme active:scale-95"
                >
                  {isRtl ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
                  <span>{isRtl ? 'رجوع إلى خلاصة الإعلانات' : 'Back to Feed'}</span>
                </button>
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold flex items-center gap-2">
                    <BarChart2 size={18} className="text-accent" />
                    <span>{isRtl ? 'تحليلات نتائج الإعلانات وأداء الحملات' : 'Ad Performance Analytics'}</span>
                  </h2>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {isRtl ? 'متابعة تفصيلية لنسب المشاهدة، التفاعلات، والنقرات المباشرة' : 'Detailed conversion metrics, impressions, and engagement'}
                  </p>
                </div>
              </div>
            </div>

            <UserAdAnalyticsView />
          </div>
        ) : activeTab === 'reels' ? (
          <div className="w-full h-full">
            {}
            <ReelsFeed
              ads={combinedReelsAds.length > 0 ? combinedReelsAds : ads}
              isRtl={isRtl}
              token={token}
              user={user}
              commentsMap={commentsMap}
              onToggleLike={handleToggleLike}
              onToggleSave={handleToggleSave}
              onAddComment={handleAddComment}
              onToggleCommentLike={handleToggleCommentLike}
              onMessageAdvertiser={handleMessageAdvertiser}
              onShare={handleShareAd}
              onBoostAd={handleOpenBoostModal}
              onDeleteReel={(id) => {
                const ad = ads.find(a => a.id === id);
                if (ad) handleDeleteAd(ad);
              }}
              onEditReel={handleEditAd}
              onOpenPageDetail={handleOpenPageDetail}
              onClose={() => setActiveTab('board')}
              onOpenUploadReels={openReelUploadModal}
              onUploadReelClick={openReelUploadModal}
              onViewPost={handleNavigateToPost}
              onArchiveAd={(archivedAd) => {
                setAds(prev => prev.filter(a => a.id !== archivedAd.id));
                setSavedAds(prev => prev.filter(a => a.id !== archivedAd.id));
              }}
              onTrashAd={(trashedAd) => {
                setAds(prev => prev.filter(a => a.id !== trashedAd.id));
                setSavedAds(prev => prev.filter(a => a.id !== trashedAd.id));
              }}
              onUpdateAd={(updatedAd) => {
                setAds(prev => prev.map(a => a.id === updatedAd.id ? { ...a, ...updatedAd } : a));
                setSavedAds(prev => prev.map(a => a.id === updatedAd.id ? { ...a, ...updatedAd } : a));
              }}
              onReportAd={handleReportAd}
              initialAdId={activeReelModalId || undefined}
              isLoading={loading}
            />
          </div>
        ) : activeTab === 'pages' && !selectedPageDetail ? (
          <div className="space-y-6 max-w-4xl mx-auto px-2 sm:px-0">
            {}
            <div className="ui-card-container flex flex-col sm:flex-row items-center justify-between gap-3 text-start">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setActiveTab('board')}
                  className="ui-btn-secondary text-xs shrink-0 cursor-pointer"
                >
                  {isRtl ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}
                  <span>{isRtl ? 'رجوع إلى خلاصة الإعلانات' : 'Back to Feed'}</span>
                </button>
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-extrabold flex items-center gap-2 text-[var(--text-primary)]">
                    <Building2 size={18} className="text-accent shrink-0" />
                    <span>{isRtl ? 'دليل الصفحات والأنشطة التجارية' : 'Commercial Pages & Business Directory'}</span>
                  </h2>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    {isRtl ? 'تصفح واستكشف كافة الكيانات والأنشطة التجارية الموثوقة' : 'Explore all verified business profiles and commercial entities'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  if (!token) {
                    toast.error(isRtl ? 'يرجى تسجيل الدخول أولاً' : 'Please log in first');
                    return;
                  }
                  setIsPageModalOpen(true);
                }}
                className="ui-btn-primary text-xs w-full sm:w-auto shrink-0 cursor-pointer"
              >
                <Plus size={15} />
                <span>{isRtl ? 'أنشئ صفحتك التجارية' : 'Create Merchant Page'}</span>
              </button>
            </div>

            {}
            {pagesLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map(n => (
                  <div key={`bulletin-skel-pages-${n}`} className="rounded-[var(--radius-md)] bg-[var(--surface-card)] h-72 border border-[var(--border-default)] animate-pulse"></div>
                ))}
              </div>
            ) : pagesList.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <Building2 size={32} className="text-[var(--text-muted)] mx-auto" />
                <h3 className="text-sm font-bold text-[var(--text-primary)]">{isRtl ? 'لا توجد صفحات تجارية مطابقة' : 'No Merchant Pages Found'}</h3>
                <button
                  onClick={() => setIsPageModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[var(--text-primary)] hover:text-accent transition-theme cursor-pointer border border-[var(--border-default)] rounded-[var(--radius-full)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)]"
                >
                  <Plus size={14} className="stroke-[2.5]" />
                  <span>{isRtl ? 'إنشاء صفحة تجارية' : 'Create Merchant Page'}</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto">
                {pagesList.map((page, pIdx) => (
                  <motion.div
                    key={`page-item-${page.id}-${pIdx}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-[var(--radius-md)] bg-[var(--surface-card)] border border-[var(--border-default)] transition-theme space-y-4"
                  >
                    {}
                    <div className="h-32 sm:h-52 w-full bg-[var(--surface-subtle)] relative cursor-pointer overflow-hidden rounded-t-xl" onClick={() => handleOpenPageDetail(page.id)}>
                      <img src={getMediaUrl(page.cover_url)} alt={page.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                      <span className="absolute top-3 start-3 px-3 py-1 rounded-shape-xs bg-black/60 text-[var(--text-primary)] text-[11px] font-bold backdrop-blur-md">
                        {page.category}
                      </span>
                    </div>

                    {}
                    <div className="px-4 sm:px-6 -mt-12 sm:-mt-16 space-y-3 relative z-10">
                      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div className="flex items-end gap-3 cursor-pointer min-w-0" onClick={() => handleOpenPageDetail(page.id)}>
                          <BulletinAvatar
                            src={page.avatar_url}
                            alt={page.name}
                            size="lg"
                            isPage={true}
                          />
                          <div className="mb-1 min-w-0">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <h3 className="text-base sm:text-lg font-extrabold text-[var(--text-primary)] truncate hover:text-accent transition-colors">{page.name}</h3>
                              <CheckCircle2 size={16} className="text-blue-500 shrink-0" />
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                              <span className="flex items-center gap-1"><MapPin size={12} className="text-accent" /> {page.city}</span>
                              <span>•</span>
                              <span>{page.followers_count} {isRtl ? 'متابع' : 'Followers'}</span>
                            </div>
                          </div>
                        </div>

                        {}
                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 pt-1 sm:pt-0 overflow-x-auto pb-1 sm:pb-0">
                          <button
                            onClick={() => handleToggleFollowPage(page.id)}
                            className={`px-3 py-2 rounded-[var(--radius-md)] text-xs font-bold transition-theme flex items-center gap-1 shadow shrink-0 ${
                              page.user_is_following
                                ? 'bg-[var(--surface-subtle)] text-[var(--text-secondary)]'
                                : 'bg-accent text-[var(--text-primary)] hover:bg-accent'
                            }`}
                          >
                            {page.user_is_following ? <UserCheck size={14} /> : <UserPlus size={14} />}
                            <span>{page.user_is_following ? (isRtl ? 'متابع' : 'Following') : (isRtl ? 'متابعة' : '+ Follow')}</span>
                          </button>

                          <button
                            onClick={() => handleOpenPageDetail(page.id)}
                            className="px-3 py-2 rounded-[var(--radius-md)] bg-[var(--text-primary)] text-[var(--surface-page)] font-black text-xs flex items-center gap-1 shadow shrink-0"
                          >
                            <Globe size={14} />
                            <span>{isRtl ? 'زيارة' : 'Visit'}</span>
                          </button>

                          {page.whatsapp_number && (
                            <a
                              href={`https://wa.me/${page.whatsapp_number.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="w-9 h-9 rounded-[var(--radius-xs)] bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 flex items-center justify-center transition-theme shadow-2xs shrink-0 cursor-pointer" style={{ color: SOCIAL_COLORS.whatsapp.base }}
                              title={isRtl ? 'تواصل عبر واتساب' : 'WhatsApp'}
                              aria-label={isRtl ? 'تواصل عبر واتساب' : 'WhatsApp'}
                            >
                              <Phone size={15} />
                            </a>
                          )}
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed pt-1 line-clamp-3">
                        {page.description}
                      </p>
                    </div>

                    <div className="px-4 sm:px-6 pb-3 pt-2 border-t border-[var(--border-default)] flex items-center justify-between text-xs text-[var(--text-muted)]">
                      <span className="flex items-center gap-1.5">
                        <Tag size={13} className="text-accent" />
                        <span className="font-semibold text-[var(--text-secondary)]">{page.ads_count || 0} {isRtl ? 'إعلان نشط' : 'active ads'}</span>
                      </span>

                      <button
                        onClick={() => handleOpenPageDetail(page.id)}
                        className="text-accent font-bold hover:underline flex items-center gap-1 text-xs"
                      >
                        <span>{isRtl ? 'استعراض المنتجات' : 'Browse'}</span>
                        {isRtl ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-5 xl:gap-6 2xl:gap-7 items-start justify-center w-full">

          {}
          <div className="hidden lg:flex flex-col w-full lg:w-64 xl:w-[290px] 2xl:w-[320px] shrink-0 gap-4 order-1 sticky top-[calc(60px+env(safe-area-inset-top,0px))] max-h-[calc(100vh-5.5rem)] overflow-y-auto custom-scrollbar overscroll-contain">

            {}
            <div className="ui-card-container flex flex-col gap-3 w-full">
              {user ? (
                <div className="flex items-center justify-between pb-2.5 mb-1 border-b border-[var(--border-default)] gap-2.5 w-full">
                  <div
                    className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer hover:opacity-85 transition-opacity group"
                    onClick={() => user?.id && handleOpenUserDetail(user.id)}
                    title={isRtl ? 'عرض حائط الملف الشخصي المستقل' : 'View Profile Wall'}
                  >
                    <BulletinAvatar
                      src={user.avatar}
                      alt={user.name}
                      size="md"
                      isOnline={true}
                    />
                    <div className="min-w-0 flex-1 flex items-center">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h3 className="text-xs font-extrabold truncate group-hover:text-accent transition-colors">{user.name}</h3>
                        <ShieldCheck size={14} className="text-accent shrink-0" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ms-auto">
                    <button
                      onClick={() => setIsProfileEditModalOpen(true)}
                      className="w-8 h-8 rounded-shape-sm bg-transparent border border-[var(--border-default)] hover:bg-accent/10 hover:border-accent/20 text-[var(--text-muted)] hover:text-accent transition-all duration-150 active:scale-95 group shrink-0 cursor-pointer relative flex items-center justify-center"
                      title={isRtl ? 'إعدادات الحساب وتوثيق الهوية' : 'Account Settings & Verification'}
                    >
                      <Settings size={14} className="transition-transform duration-200 group-hover:rotate-45" />
                    </button>

                    <button
                      onClick={() => { setSelectedPageDetail(null); setActiveTab('inquiries'); }}
                      className={`w-8 h-8 rounded-shape-sm border transition-all duration-150 relative active:scale-95 group shrink-0 cursor-pointer flex items-center justify-center ${
                        activeTab === 'inquiries' && !selectedPageDetail
                          ? 'bg-accent/15 border-accent/30 text-accent font-bold'
                          : 'bg-transparent border-[var(--border-default)] hover:bg-accent/10 hover:border-accent/20 text-[var(--text-muted)] hover:text-accent'
                      }`}
                      title={isRtl ? 'صندوق محادثات المسنجر' : 'Messenger Chats'}
                    >
                      <MessageSquare size={14} />
                      {inquiriesList.length > 0 && (
                        <span className="absolute -top-1 -end-1 w-4 h-4 rounded-shape-full bg-red-500 text-white text-[9px] font-extrabold flex items-center justify-center ring-2 ring-[var(--surface-card)]">
                          {inquiriesList.length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-[var(--radius-md)] bg-accent/10 border border-accent/20 text-center space-y-2">
                  <p className="text-xs font-bold text-accent">
                    {isRtl ? 'سجل الدخول لنشر وتفاعل كامل مع الإعلانات!' : 'Sign in to publish and interact!'}
                  </p>
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="platform-action-btn w-full py-2"
                  >
                    {isRtl ? 'تسجيل الدخول / حساب جديد' : 'Sign In'}
                  </button>
                </div>
              )}

              {}
              <div className="flex flex-col gap-1 w-full">
                <button
                  onClick={() => { setSelectedPageDetail(null); setActiveTab('board'); }}
                  className={`platform-tab-btn ${activeTab === 'board' && !selectedPageDetail ? 'active' : ''}`}
                >
                  <span className="flex items-center gap-2">
                    <Megaphone size={16} className="text-accent" />
                    <span>{isRtl ? 'الإعلانات والمنشورات' : 'Ads & Posts'}</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-bold">
                    {ads.length}
                  </span>
                </button>

                <button
                  onClick={() => { setSelectedPageDetail(null); setActiveTab('pages'); }}
                  className={`platform-tab-btn ${activeTab === 'pages' && !selectedPageDetail ? 'active' : ''}`}
                >
                  <span className="flex items-center gap-2">
                    <Building2 size={16} className="text-accent" />
                    <span>{isRtl ? 'دليل الصفحات التجارية' : 'Merchant Pages'}</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-bold">
                    {pagesList.length}
                  </span>
                </button>

                {user && (
                  <button
                    onClick={() => { setSelectedPageDetail(null); setActiveTab('inquiries'); }}
                    className={`platform-tab-btn ${activeTab === 'inquiries' && !selectedPageDetail ? 'active' : ''}`}
                  >
                    <span className="flex items-center gap-2">
                      <Inbox size={16} className="text-amber-500" />
                      <span>{isRtl ? 'الرسائل والاستفسارات' : 'Inquiries'}</span>
                    </span>
                    {inquiriesList.length > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-white font-extrabold">
                        {inquiriesList.length}
                      </span>
                    )}
                  </button>
                )}

                {user && (
                  <button
                    onClick={() => { setSelectedPageDetail(null); setActiveTab('saved'); fetchSavedAds(); }}
                    className={`platform-tab-btn ${activeTab === 'saved' && !selectedPageDetail ? 'active' : ''}`}
                  >
                    <span className="flex items-center gap-2">
                      <Bookmark size={16} className="text-accent" />
                      <span>{isRtl ? 'المنشورات المحفوظة' : 'Saved Posts'}</span>
                    </span>
                    {savedAds.length > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-bold">
                        {savedAds.length}
                      </span>
                    )}
                  </button>
                )}

                {user && (
                  <button
                    onClick={() => { setSelectedPageDetail(null); setActiveTab('my_ads'); }}
                    className={`platform-tab-btn ${activeTab === 'my_ads' && !selectedPageDetail ? 'active' : ''}`}
                  >
                    <span className="flex items-center gap-2">
                      <Tag size={16} className="text-accent" />
                      <span>{isRtl ? 'حملاتي وإعلاناتي' : 'My Campaigns'}</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-bold">
                      {myAds.length}
                    </span>
                  </button>
                )}

                {user && (
                  <button
                    onClick={() => { setSelectedPageDetail(null); setActiveTab('analytics'); }}
                    className={`platform-tab-btn ${activeTab === 'analytics' && !selectedPageDetail ? 'active' : ''}`}
                  >
                    <span className="flex items-center gap-2">
                      <BarChart2 size={16} className="text-accent" />
                      <span>{isRtl ? 'تحليلات نتائج الأداء' : 'Analytics'}</span>
                    </span>
                  </button>
                )}
              </div>
            </div>

            {}
            <div className="xl:hidden">
              <RecommendationWidget
                variant="bulletin"
                filterType="bulletin"
                limit={3}
                title={isRtl ? 'إعلانات موصى بها' : 'Recommended Ads'}
                subtitle={isRtl ? 'مقترحات مخصصة بناءً على سلوكك واهتماماتك' : 'Tailored ad suggestions'}
                className="ui-card-container"
                onAdClick={handleRecommendationAdClick}
              />
            </div>

            {}
            {user && (
              <div className="ui-card-container flex flex-col gap-3 w-full">
                <div className="flex items-center justify-between gap-2.5 pb-2.5 mb-1 border-b border-[var(--border-default)] w-full">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-shape-md bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
                      <Building2 size={18} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs sm:text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2 truncate">
                        <span>{isRtl ? 'إعدادات التاجر' : 'Merchant Settings'}</span>
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ms-auto">
                    <button
                      onClick={() => setIsPageModalOpen(true)}
                      className="w-8 h-8 rounded-shape-sm bg-transparent border border-[var(--border-default)] hover:bg-accent/10 hover:border-accent/20 text-[var(--text-muted)] hover:text-accent transition-all duration-150 active:scale-95 group shrink-0 cursor-pointer relative flex items-center justify-center"
                      title={isRtl ? 'إعدادات التاجر' : 'Merchant Settings'}
                    >
                      <Settings size={14} className="transition-transform duration-200 group-hover:rotate-45" />
                    </button>
                  </div>
                </div>

                {myPagesList.length === 0 ? (
                  <div className="text-center py-3 text-xs text-[var(--text-muted)] space-y-2">
                    <p>{isRtl ? 'لم تقم بإعداد ملفك التجاري بعد. افصل هويتك الشخصية عن الإعلانات.' : 'No commercial profile setup yet. Separate your personal identity from your ads.'}</p>
                    <button
                      onClick={() => setIsPageModalOpen(true)}
                      className="platform-action-btn px-3.5 py-1.5 text-[11px]"
                    >
                      {isRtl ? 'إعداد الملف التجاري الآن' : 'Setup Commercial Profile'}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1 w-full">
                    {myPagesList.map((page, idx) => (
                      <div
                        key={`my-page-${page.id}-${idx}`}
                        onClick={() => handleOpenPageDetail(page.id)}
                        className={`group relative platform-tab-btn cursor-pointer ${
                          selectedPageDetail?.page.id === page.id
                            ? 'active'
                            : ''
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="relative shrink-0">
                            <BulletinAvatar
                              src={page.avatar_url}
                              alt={page.name}
                              size="sm"
                              isPage={true}
                            />
                          </div>
                          <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-[var(--text-primary)] group-hover:text-accent transition-colors truncate">{page.name}</h4>
                              <p className="text-[10px] text-[var(--text-muted)] truncate">{page.city} • {page.followers_count} {isRtl ? 'متابع' : 'followers'}</p>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] font-bold text-accent px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 group-hover:bg-accent/20 transition-all shrink-0">
                                {isRtl ? 'إدارة' : 'Manage'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {}
            <div className="xl:hidden">
              <div className="ui-card-container flex flex-col gap-3 w-full">
              <div className="flex items-center justify-between gap-2.5 pb-2.5 mb-1 border-b border-[var(--border-default)] w-full">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-shape-md bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
                    <UserPlus size={18} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2 truncate">
                      <span>{isRtl ? 'صفحات موصى بها' : 'Recommended Pages'}</span>
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ms-auto">
                  <button
                    onClick={() => setActiveTab('pages')}
                    className="w-8 h-8 rounded-shape-sm bg-transparent border border-[var(--border-default)] hover:bg-accent/10 hover:border-accent/20 text-[var(--text-muted)] hover:text-accent transition-all duration-150 active:scale-95 group shrink-0 cursor-pointer relative flex items-center justify-center"
                    title={isRtl ? 'عرض كافة الصفحات التجارية' : 'View All Pages'}
                  >
                    <ArrowLeft size={14} className={`transition-transform duration-200 ${isRtl ? 'group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5 rotate-180'}`} />
                  </button>

                  <button
                    onClick={() => fetchPages()}
                    disabled={pagesLoading}
                    className="w-8 h-8 rounded-shape-sm bg-transparent border border-[var(--border-default)] hover:bg-accent/10 hover:border-accent/20 text-[var(--text-muted)] hover:text-accent transition-all duration-150 active:scale-95 group shrink-0 cursor-pointer relative flex items-center justify-center"
                    title={isRtl ? 'تحديث' : 'Refresh'}
                  >
                    <RefreshCw size={14} className={pagesLoading ? 'animate-spin text-accent' : 'transition-transform duration-300 group-hover:rotate-180'} />
                  </button>
                </div>
              </div>

              {pagesLoading ? (
                <div className="flex flex-col gap-1.5 w-full">
                  {[1, 2, 3].map(n => (
                    <div key={`bulletin-skel-rec-${n}`} className="h-10 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] animate-pulse"></div>
                  ))}
                </div>
              ) : pagesList.slice(0, 5).length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] text-center py-2">{isRtl ? 'لا توجد صفحات حالياً' : 'No pages'}</p>
              ) : (
                <div className="flex flex-col gap-1 w-full">
                  {pagesList.slice(0, 5).map((page, idx) => (
                    <div
                      key={`rec-page-${page.id}-${idx}`}
                      onClick={() => handleOpenPageDetail(page.id)}
                      className="group relative platform-tab-btn cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="relative shrink-0">
                          <BulletinAvatar
                            src={page.avatar_url}
                            alt={page.name}
                            size="sm"
                            isPage={true}
                          />
                        </div>
                        <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <h4 className="text-xs font-bold text-[var(--text-primary)] group-hover:text-accent transition-colors truncate">{page.name}</h4>
                              <CheckCircle2 size={12} className="text-blue-500 shrink-0" />
                            </div>
                            <p className="text-[10px] text-[var(--text-muted)] truncate">{page.city} • {page.followers_count} {isRtl ? 'متابع' : 'followers'}</p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-bold text-accent px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 group-hover:bg-accent/20 transition-all shrink-0">
                              {isRtl ? 'زيارة' : 'Visit'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            </div>

          </div>

          {}
          <div
            className="flex-1 flex flex-col space-y-4 sm:space-y-5 lg:space-y-6 order-2 relative max-w-2xl xl:max-w-[650px] 2xl:max-w-[720px] min-w-0 w-full min-h-[500px]"
            onContextMenu={(e) => {
              e.preventDefault();
              const rect = e.currentTarget.getBoundingClientRect();
              setContextMenu({
                x: Math.max(10, Math.min(e.clientX - rect.left, rect.width - 200)),
                y: Math.max(10, Math.min(e.clientY - rect.top, rect.height - 150)),
                isOpen: true
              });
            }}
            onClick={() => {
              if (contextMenu.isOpen) setContextMenu(prev => ({ ...prev, isOpen: false }));
            }}
            style={{
              transform: pullDistance > 0 ? `translateY(${Math.min(pullDistance * 0.28, 26)}px)` : 'none',
              transition: pullDistance === 0 ? 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)' : 'none'
            }}
          >
            {}
            <AnimatePresence>
              {contextMenu.isOpen && (() => {
                const rawContextActions = [
                  {
                    id: 'refresh',
                    label: isRtl ? 'تحديث المحتوى' : 'Refresh Feed',
                    icon: RefreshCw,
                    action: () => {
                      triggerFeedRefresh();
                      setContextMenu(prev => ({ ...prev, isOpen: false }));
                    }
                  },
                  {
                    id: 'copy',
                    label: isRtl ? 'نسخ رابط الصفحة' : 'Copy Page Link',
                    icon: Copy,
                    action: () => {
                      navigator.clipboard.writeText(window.location.href);
                      setContextMenu(prev => ({ ...prev, isOpen: false }));
                    }
                  },
                  {
                    id: 'clear',
                    label: isRtl ? 'إعادة ضبط الجلسة' : 'Clear Session',
                    icon: Trash2,
                    isDestructive: true,
                    action: () => {
                      sessionStorage.clear();
                      sessionStorage.removeItem('perplexta_bulletin_scroll_y');
                      secureStorage.remove('perplexta_bulletin_scroll_y');
                      window.location.reload();
                    }
                  }
                ];

                const sortedActions = [...rawContextActions].sort((a, b) => {
                  const lenA = a.label.trim().length;
                  const lenB = b.label.trim().length;
                  return lenA !== lenB ? lenA - lenB : a.label.localeCompare(b.label);
                });

                return (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -8 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute z-50 w-max min-w-[190px] rounded-[var(--radius-md)] shadow-2xl border border-[var(--border-default)] p-1 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10 select-none bg-[var(--surface-card)] text-[var(--text-primary)] flex flex-col gap-0.5"
                    style={{
                      left: `${contextMenu.x}px`,
                      top: `${contextMenu.y}px`,
                    }}
                    onClick={(e) => e.stopPropagation()}
                    dir={isRtl ? 'rtl' : 'ltr'}
                  >
                    <div className="px-2.5 py-1 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-default)]/50 mb-0.5">
                      {isRtl ? 'إجراءات سريعة' : 'Quick Actions'}
                    </div>
                    {sortedActions.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={item.action}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-shape-sm text-xs font-semibold transition-all duration-150 cursor-pointer select-none ${
                            item.isDestructive
                              ? 'text-rose-500 hover:bg-rose-500/10 font-bold'
                              : 'text-[var(--text-primary)] hover:bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] hover:text-[var(--accent)] group'
                          }`}
                        >
                          <span className={`truncate min-w-0 ${item.isDestructive ? '' : 'group-hover:text-[var(--accent)] transition-colors'}`}>
                            {item.label}
                          </span>
                          <Icon size={14} className={`${item.isDestructive ? 'text-rose-500' : 'text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-all duration-150'} shrink-0 ms-2`} />
                        </button>
                      );
                    })}
                  </motion.div>
                );
              })()}
            </AnimatePresence>

            {}
            <AnimatePresence>
              {(pullDistance > 0 || isRefreshing) && (
                <motion.div
                  initial={{ opacity: 0, y: -25, scale: 0.85 }}
                  animate={{
                    opacity: 1,
                    y: isRefreshing ? 12 : Math.min(pullDistance * 0.55, 42),
                    scale: pullDistance >= 55 || isRefreshing ? 1.05 : 0.95
                  }}
                  exit={{ opacity: 0, y: -20, scale: 0.8 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3.5 py-1.5 rounded-shape-xs border shadow-xl backdrop-blur-md transition-theme pointer-events-none ${
                    isRefreshing || pullDistance >= 55
                      ? 'bg-accent/10 dark:bg-accent/40 border-accent/40 text-accent shadow-none'
                      : 'bg-[var(--surface-card)]/90 border-[var(--border-default)] text-[var(--fg-secondary)]'
                  }`}
                >
                  {isRefreshing ? (
                    <RefreshCw size={15} className="animate-spin text-accent shrink-0" />
                  ) : pullDistance >= 55 ? (
                    <ArrowUp size={15} className="text-accent shrink-0 transition-transform duration-200" />
                  ) : (
                    <ArrowDown
                      size={15}
                      className="text-[var(--text-muted)] shrink-0 transition-transform duration-200"
                      style={{ transform: `rotate(${Math.min(pullDistance * 3, 180)}deg)` }}
                    />
                  )}
                  <span className="text-[11px] font-extrabold tracking-tight">
                    {isRefreshing
                      ? (isRtl ? 'جاري تحديث الخلاصة...' : 'Refreshing feed...')
                      : pullDistance >= 55
                        ? (isRtl ? 'اترك للتحديث الآن' : 'Release to refresh')
                        : (isRtl ? 'اسحب لأسفل لتحديث الإعلانات' : 'Pull down to refresh')}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {}
            {}
            {}
            {selectedUserDetail ? (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[var(--radius-md)] bg-[var(--surface-card)] border border-[var(--border-default)] overflow-hidden space-y-4"
              >
                {/* Header Back Bar */}
                <div className="p-3 bg-[var(--surface-subtle)] border-b border-[var(--border-default)] flex items-center justify-between">
                  <button
                    onClick={handleBackToBoard}
                    className="px-3 py-1.5 rounded-[var(--radius-md)] bg-accent text-[var(--text-primary)] font-bold text-xs flex items-center gap-2 hover:opacity-90 transition-theme shadow"
                  >
                    {isRtl ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
                    <span>{isRtl ? 'العودة إلى خلاصة بيربليكستا بورد' : 'Back to Perplexta Board Feed'}</span>
                  </button>
                  <span className="text-xs font-bold text-[var(--text-muted)] bg-[var(--surface-card)] px-3 py-1 rounded-full border border-[var(--border-default)] flex items-center gap-1.5">
                    <User size={14} className="text-accent" />
                    <span>{isRtl ? 'حائط ملف شخصي مستقل' : 'Independent Profile Wall'}</span>
                  </span>
                </div>

                {/* Profile Card Header */}
                <div className="px-4 pt-2 pb-4 border-b border-[var(--border-default)] space-y-4">
                  {/* Cover Image Header */}
                  <div className="relative h-32 sm:h-44 w-full rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 overflow-hidden mb-12 shadow-sm border border-[var(--border-default)]">
                    {selectedUserDetail.user.cover_image ? (
                      <img
                        src={resolveImageUrl(selectedUserDetail.user.cover_image)}
                        alt="Profile Cover"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
                    )}
                    <div className="absolute -bottom-10 right-4 sm:right-6 border-4 border-[var(--surface-card)] rounded-full shadow-lg bg-[var(--surface-card)]">
                      <BulletinAvatar
                        src={selectedUserDetail.user.avatar}
                        alt={selectedUserDetail.user.name}
                        size="xl"
                        fallbackText={selectedUserDetail.user.name}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-2">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-black text-[var(--text-primary)]">{selectedUserDetail.user.name}</h2>
                        {selectedUserDetail.user.kyc_status === 'verified' && (
                          <span title={isRtl ? 'حساب موثق' : 'Verified Account'} className="inline-flex items-center gap-1 bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-full text-accent font-extrabold text-[11px]">
                            <ShieldCheck size={15} />
                            <span>{isRtl ? 'حساب موثق' : 'Verified'}</span>
                          </span>
                        )}
                        {selectedUserDetail.user.occupation && (
                          <span className="inline-flex items-center gap-1 bg-[var(--surface-subtle)] border border-[var(--border-default)] px-2.5 py-0.5 rounded-full text-xs font-bold text-[var(--text-primary)]">
                            <Briefcase size={12} className="text-accent" />
                            <span>{selectedUserDetail.user.occupation}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                        {selectedUserDetail.user.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={13} className="text-accent" />
                            <span>{selectedUserDetail.user.location}</span>
                          </span>
                        )}
                        {selectedUserDetail.user.email && (
                          <span className="flex items-center gap-1">
                            <AtSign size={13} />
                            <span>{selectedUserDetail.user.email}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {user && user.id === selectedUserDetail.user.id && (
                        <button
                          onClick={() => setIsProfileEditModalOpen(true)}
                          className="px-3.5 py-2 rounded-lg bg-accent text-[var(--text-primary)] text-xs font-bold shadow hover:opacity-90 transition-opacity flex items-center gap-1.5"
                        >
                          <Settings size={14} />
                          <span>{isRtl ? 'تعديل الملف الشخصي' : 'Edit Profile'}</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          const url = `${window.location.origin}/viralbook/u/${selectedUserDetail.user.id}`;
                          navigator.clipboard.writeText(url);
                          toast.success(isRtl ? 'تم نسخ رابط الحائط الشخصي' : 'Profile wall link copied');
                        }}
                        className="px-3.5 py-2 rounded-lg bg-[var(--surface-subtle)] text-[var(--text-primary)] text-xs font-bold border border-[var(--border-default)] hover:bg-[var(--surface-card)] transition-colors flex items-center gap-1.5"
                      >
                        <Share2 size={14} className="text-accent" />
                        <span>{isRtl ? 'مشاركة الحائط' : 'Share Wall'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Bio Overview */}
                  {selectedUserDetail.user.bio && (
                    <div className="p-3 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-secondary)] leading-relaxed">
                      {selectedUserDetail.user.bio}
                    </div>
                  )}

                  {/* Website & Verified Domain Links */}
                  {(selectedUserDetail.user.website_url || selectedUserDetail.user.custom_domain) && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {selectedUserDetail.user.website_url && (
                        <a
                          href={selectedUserDetail.user.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs text-accent font-bold hover:underline"
                        >
                          <Globe size={13} />
                          <span>{selectedUserDetail.user.website_url.replace(/^https?:\/\//, '')}</span>
                          <ExternalLink size={11} />
                        </a>
                      )}
                      {selectedUserDetail.user.custom_domain && (
                        <a
                          href={`https://${selectedUserDetail.user.custom_domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400 font-extrabold hover:underline"
                        >
                          <ShieldCheck size={14} />
                          <span>{selectedUserDetail.user.custom_domain}</span>
                          {selectedUserDetail.user.is_domain_verified && (
                            <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                              {isRtl ? 'دومين موثق' : 'Verified Domain'}
                            </span>
                          )}
                        </a>
                      )}
                    </div>
                  )}

                  {/* Social Media Links */}
                  {selectedUserDetail.user.social_links && Object.values(selectedUserDetail.user.social_links).some(link => Boolean(link)) && (
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[var(--border-default)]/60">
                      <span className="text-[11px] font-bold text-[var(--text-muted)] me-1">{isRtl ? 'التواصل:' : 'Social:'}</span>
                      {Object.entries(selectedUserDetail.user.social_links).map(([platform, rawLink]) => {
                        const linkStr = String(rawLink || '').trim();
                        if (!linkStr) return null;
                        const url = linkStr.startsWith('http') ? linkStr : `https://${linkStr}`;
                        return (
                          <a
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-md bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[11px] font-bold text-[var(--text-secondary)] hover:text-accent hover:border-accent/30 transition-colors flex items-center gap-1"
                          >
                            <Share2 size={11} />
                            <span className="capitalize">{platform}</span>
                            <ExternalLink size={10} />
                          </a>
                        );
                      })}
                    </div>
                  )}

                  {/* Badges & Stats */}
                  <div className="mt-2 pt-3 border-t border-[var(--border-default)]/60 flex flex-wrap items-center gap-4 text-xs text-[var(--text-secondary)]">
                    <div className="flex items-center gap-1.5 bg-[var(--surface-subtle)] px-2.5 py-1 rounded-md border border-[var(--border-default)]">
                      <Megaphone size={14} className="text-accent" />
                      <span className="font-bold text-[var(--text-primary)]">{selectedUserDetail.ads.length}</span>
                      <span>{isRtl ? 'منشور شخصي' : 'Personal Posts'}</span>
                    </div>

                    {selectedUserDetail.user.created_at && (
                      <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                        <Calendar size={13} />
                        <span>{isRtl ? 'انضم منذ' : 'Joined'}: {new Date(selectedUserDetail.user.created_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Posts Section Title */}
                <div className="px-4 pt-2 pb-1 flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2">
                    <User size={16} className="text-accent" />
                    <span>{isRtl ? 'منشورات الحائط الشخصي' : 'Personal Wall Posts'}</span>
                  </h3>
                  <span className="text-xs font-bold text-[var(--text-muted)]">
                    {selectedUserDetail.ads.length} {isRtl ? 'منشور' : 'posts'}
                  </span>
                </div>

                {/* Feed or Empty State */}
                <div className="p-3">
                  {selectedUserDetail.ads.length === 0 ? (
                    <div className="text-center py-12 bg-[var(--surface-subtle)] rounded-xl border border-[var(--border-default)]">
                      <User size={40} className="mx-auto text-[var(--text-muted)] opacity-40 mb-3" />
                      <p className="text-sm font-bold text-[var(--text-primary)]">
                        {isRtl ? 'لا توجد منشورات شخصية لهذا المستخدم حالياً' : 'No personal posts for this user yet'}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        {isRtl ? 'المنشورات المعروضة هنا تقتصر فقط على المنشورات الشخصية المستقلة' : 'Only personal independent posts are displayed here'}
                      </p>
                    </div>
                  ) : (
                    <PostFeed
                      ads={selectedUserDetail.ads}
                      loading={false}
                      isRtl={isRtl}
                      token={token}
                      user={user}
                      onReportAd={handleReportAd}
                      onToggleLike={handleToggleLike}
                      onToggleComments={toggleComments}
                      onToggleCommentLike={handleToggleCommentLike}
                      expandedAdId={expandedAdId}
                      commentsMap={commentsMap}
                      loadingCommentsAdId={loadingCommentsAdId}
                      newCommentText={newCommentText}
                      setNewCommentText={setNewCommentText}
                      onAddComment={handleAddComment}
                      replyToCommentId={replyToCommentId}
                      setReplyToCommentId={setReplyToCommentId}
                      onMessageAdvertiser={handleMessageAdvertiser}
                      messagingAdId={messagingAdId}
                      onInquire={setInquireAd}
                      onWhatsApp={handleWhatsAppClick}
                      onShare={handleShareAd}
                      onOpenPageDetail={handleOpenPageDetail}
                      onOpenUserDetail={handleOpenUserDetail}
                      onOpenLightbox={handleOpenLightbox}
                      onCreateAdClick={openPostUploadModal}
                      onBoostAd={handleOpenBoostModal}
                      onEditAd={handleEditAd}
                      onDeleteAd={handleDeleteAd}
                      onToggleSave={handleToggleSave}
                      onArchiveAd={(archivedAd) => {
                        setSelectedUserDetail(prev => prev ? {
                          ...prev,
                          ads: prev.ads.filter(a => a.id !== archivedAd.id)
                        } : null);
                      }}
                      onTrashAd={(trashedAd) => {
                        setSelectedUserDetail(prev => prev ? {
                          ...prev,
                          ads: prev.ads.filter(a => a.id !== trashedAd.id)
                        } : null);
                      }}
                    />
                  )}
                </div>
              </motion.div>
            ) : selectedPageDetail ? (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[var(--radius-md)] bg-[var(--surface-card)] border border-[var(--border-default)] overflow-hidden space-y-4"
              >
                {}
                <div className="p-3 bg-[var(--surface-subtle)] border-b border-[var(--border-default)] flex items-center justify-between">
                  <button
                    onClick={handleBackToBoard}
                    className="px-3 py-1.5 rounded-[var(--radius-md)] bg-accent text-[var(--text-primary)] font-bold text-xs flex items-center gap-2 hover:bg-accent transition-theme shadow"
                  >
                    {isRtl ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
                    <span>{isRtl ? 'العودة إلى خلاصة بيربليكستا بورد' : 'Back to Perplexta Board Feed'}</span>
                  </button>

                  <span className="text-xs font-bold text-[var(--text-muted)]">
                    {isRtl ? 'عرض كامل للصفحة التجارية' : 'Merchant Page View'}
                  </span>
                </div>

                {/* Page Cover Banner */}
                <div className="h-44 sm:h-56 md:h-64 w-full bg-[var(--surface-subtle)] relative overflow-hidden rounded-t-[var(--radius-md)] border-b border-[var(--border-default)]">
                  <img
                    src={getMediaUrl(selectedPageDetail.page.cover_url)}
                    alt={selectedPageDetail.page.name}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-3 start-3 px-3 py-1 rounded-shape-xs bg-black/70 text-white text-xs font-bold backdrop-blur-md border border-white/20">
                    {selectedPageDetail.page.category}
                  </span>
                </div>

                {/* Profile Avatar & Action Buttons Bar */}
                <div className="px-4 sm:px-6 pb-4 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 -mt-12 sm:-mt-14 relative z-10">
                    {/* Avatar Container with crisp elevation */}
                    <div className="shrink-0 p-1 bg-[var(--surface-card)] rounded-2xl shadow-xl border border-[var(--border-default)] inline-block w-fit">
                      <BulletinAvatar
                        src={selectedPageDetail.page.avatar_url}
                        alt={selectedPageDetail.page.name}
                        size="lg"
                        isPage={true}
                      />
                    </div>

                    {/* Action Buttons - Cleanly outside & below cover image */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0">
                      <button
                        onClick={() => handleToggleFollowPage(selectedPageDetail.page.id)}
                        className={`px-4 py-2.5 min-h-[44px] rounded-[var(--radius-md)] text-xs font-extrabold transition-theme flex items-center gap-2 shadow-sm ${
                          selectedPageDetail.page.user_is_following
                            ? 'bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-default)] hover:bg-[var(--surface-inset)]'
                            : 'bg-accent text-[var(--text-primary)] hover:opacity-90'
                        }`}
                      >
                        {selectedPageDetail.page.user_is_following ? <UserCheck size={16} /> : <UserPlus size={16} />}
                        <span>{selectedPageDetail.page.user_is_following ? (isRtl ? 'تتابعها' : 'Following') : (isRtl ? '+ متابعة الصفحة' : '+ Follow Page')}</span>
                      </button>

                      <button
                        onClick={async () => {
                          const shareUrl = getPageShareUrl(selectedPageDetail.page);
                          const shareText = getPageShareText(selectedPageDetail.page, isRtl);
                          if (navigator.share) {
                            try {
                              await navigator.share({
                                title: selectedPageDetail.page.name,
                                text: shareText,
                                url: shareUrl
                              });
                              return;
                            } catch (e: any) {
                              if (e?.name === 'AbortError') return;
                            }
                          }
                          if (navigator.clipboard) {
                            await navigator.clipboard.writeText(shareUrl);
                            toast.success(isRtl ? 'تم نسخ رابط الصفحة بنجاح' : 'Page link copied!');
                          }
                        }}
                        className="px-4 py-2.5 min-h-[44px] rounded-[var(--radius-md)] text-xs font-extrabold transition-theme flex items-center gap-2 bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] text-[var(--text-primary)] shadow-sm cursor-pointer border border-[var(--border-default)]"
                        title={isRtl ? 'مشاركة رابط هذه الصفحة' : 'Share Page Link'}
                      >
                        <Share2 size={16} className="text-accent" />
                        <span>{isRtl ? 'مشاركة الصفحة' : 'Share Page'}</span>
                      </button>

                      {(() => {
                        const isPageOwnerOrManager = user && (
                          selectedPageDetail.page.user_id === user.id ||
                          selectedPageDetail.page.owner_id === user.id ||
                          user.role === 'admin' ||
                          (selectedPageDetail.page.managers && (
                            (() => {
                              try {
                                const list = typeof selectedPageDetail.page.managers === 'string'
                                  ? JSON.parse(selectedPageDetail.page.managers)
                                  : selectedPageDetail.page.managers;
                                return Array.isArray(list) && list.some((m: any) => m.userId === user.id || m.email === user.email);
                              } catch (e) {
                                return false;
                              }
                            })()
                          ))
                        );
                        if (!isPageOwnerOrManager) return null;
                        return (
                          <button
                            onClick={() => {
                              setEditingPageData(selectedPageDetail.page);
                              setIsEditPageModalOpen(true);
                            }}
                            className="px-4 py-2.5 min-h-[44px] rounded-[var(--radius-md)] text-xs font-extrabold transition-theme flex items-center gap-2 bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] text-[var(--text-secondary)] shadow-sm cursor-pointer border border-[var(--border-default)]"
                          >
                            <Settings size={16} />
                            <span>{isRtl ? 'إدارة وتعديل الصفحة' : 'Manage & Edit Page'}</span>
                          </button>
                        );
                      })()}

                      {selectedPageDetail.page.whatsapp_number && (
                        <a
                          href={`https://wa.me/${selectedPageDetail.page.whatsapp_number.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-2.5 min-h-[44px] rounded-[var(--radius-md)] bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 flex items-center justify-center gap-1.5 transition-theme shadow-2xs cursor-pointer font-extrabold text-xs" style={{ color: SOCIAL_COLORS.whatsapp.base }}
                          title={isRtl ? 'تواصل عبر واتساب' : 'WhatsApp'}
                          aria-label={isRtl ? 'تواصل عبر واتساب' : 'WhatsApp'}
                        >
                          <Phone size={16} />
                          <span className="hidden sm:inline">{isRtl ? 'واتساب' : 'WhatsApp'}</span>
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl sm:text-2xl font-extrabold">{selectedPageDetail.page.name}</h2>
                      <CheckCircle2 size={20} className="text-blue-500 shrink-0" />
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                        {isRtl ? 'صفحة تجارية موثقة' : 'Commercial Page'}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed max-w-3xl">
                      {selectedPageDetail.page.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border-subtle)]">
                      <span className="flex items-center gap-1"><MapPin size={14} className="text-accent" /> {selectedPageDetail.page.city}</span>
                      {selectedPageDetail.page.owner_name && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-medium text-[var(--text-secondary)]">
                            <UserCheck size={13} className="text-accent" />
                            {isRtl ? 'المالك:' : 'Owner:'} {selectedPageDetail.page.owner_name}
                          </span>
                        </>
                      )}
                      <span>•</span>
                      <span>{selectedPageDetail.page.followers_count} {isRtl ? 'متابع' : 'Followers'}</span>
                      <span>•</span>
                      <span className="font-bold text-accent">{selectedPageDetail.ads.length} {isRtl ? 'منشور إعلاني خاص بالصفحة' : 'Page Posts'}</span>
                    </div>
                  </div>

                  {}
                  <div className="flex items-center gap-2 border-b border-[var(--border-default)] pt-3">
                    <button
                      onClick={() => setPageDetailTab('ads')}
                      className={`px-4 py-2 text-xs font-bold border-b-2 transition-theme ${
                        pageDetailTab === 'ads'
                          ? 'border-accent text-accent'
                          : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {isRtl ? 'إعلانات ومنشورات الصفحة' : 'Page Posts & Ads'}
                    </button>
                    <button
                      onClick={() => setPageDetailTab('about')}
                      className={`px-4 py-2 text-xs font-bold border-b-2 transition-theme ${
                        pageDetailTab === 'about'
                          ? 'border-accent text-accent'
                          : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {isRtl ? 'معلومات الشركة والتواصل' : 'About & Contact'}
                    </button>
                    <button
                      onClick={() => setPageDetailTab('media')}
                      className={`px-4 py-2 text-xs font-bold border-b-2 transition-theme ${
                        pageDetailTab === 'media'
                          ? 'border-accent text-accent'
                          : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {isRtl ? 'معرض التصاميم والصور' : 'Media Gallery'}
                    </button>
                  </div>

                  {}
                  {pageDetailTab === 'ads' && (
                    <div className="pt-2 space-y-4">
                      {user && myPagesList.some(p => p.id === selectedPageDetail.page.id) && (
                        <div className="p-3.5 rounded-[var(--radius-md)] bg-accent/10 border border-accent/20 flex items-center justify-between">
                          <span className="text-xs font-bold text-accent">
                            {isRtl ? 'أنت مالك هذه الصفحة التجارية! يمكنك إضافة منشور إعلاني جديد باسمها.' : 'You own this page! Add a new ad post.'}
                          </span>
                          <button
                            onClick={() => {
                              setAdFormData(prev => ({ ...prev, page_id: selectedPageDetail.page.id }));
                              setIsAdModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-[var(--radius-md)] bg-accent text-[var(--text-primary)] font-bold text-xs"
                          >
                            + {isRtl ? 'نشر إعلان باسم الصفحة' : 'Post as Page'}
                          </button>
                        </div>
                      )}

                      {selectedPageDetail.ads.length === 0 ? (
                        <div className="text-center py-12 bg-[var(--surface-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] space-y-2">
                          <Megaphone size={32} className="text-[var(--text-secondary)] mx-auto" />
                          <p className="text-xs text-[var(--text-muted)] italic">
                            {isRtl ? 'لا توجد إعلانات نشطة لهذه الصفحة حالياً' : 'No active ads for this page yet.'}
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-4 max-w-2xl mx-auto w-full">
                          {selectedPageDetail.ads.map((ad, adIdx) => (
                            <div key={`page-ad-${ad.id}-${adIdx}`} className="p-3.5 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border-default)] space-y-2.5">
                              <div className="relative aspect-square rounded-[var(--radius-md)] overflow-hidden cursor-pointer" onClick={() => handleOpenLightbox(getMediaUrl(ad.image_url), ad.media_gallery, 0, ad.title, ad.author_name, ad)}>
                                <img
                                  src={getMediaUrl(ad.image_url)}
                                  alt={ad.title || 'Ad thumbnail'}
                                  onError={(e) => {
                                    const target = e.currentTarget;
                                    if (!target.dataset.fallback) {
                                      target.dataset.fallback = 'true';
                                      target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1080&q=80';
                                    }
                                  }}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <h4 className="text-xs font-extrabold line-clamp-1">{ad.title}</h4>
                              <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed">{ad.description}</p>

                              <div className="flex items-center justify-end pt-1 gap-1.5 ms-auto">
                                <button
                                  onClick={() => handleMessageAdvertiser(ad)}
                                  disabled={messagingAdId === ad.id}
                                  className="w-8 h-8 rounded-[var(--radius-xs)] bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)] text-[var(--text-primary)] border border-[var(--border-default)] hover:border-accent/40 flex items-center justify-center transition-theme shadow-2xs disabled:opacity-50 cursor-pointer"
                                  title={isRtl ? 'مراسلة المعلن في محادثة خاصة' : 'Message Advertiser'}
                                  aria-label={isRtl ? 'مراسلة المعلن في محادثة خاصة' : 'Message Advertiser'}
                                >
                                  {messagingAdId === ad.id ? (
                                    <Loader2 size={14} className="animate-spin text-accent" />
                                  ) : (
                                    <MessageCircle size={14} className="text-accent shrink-0" />
                                  )}
                                </button>

                                {ad.whatsapp_number && (
                                  <button
                                    onClick={(e) => handleWhatsAppClick(ad, e)}
                                    className="w-8 h-8 rounded-[var(--radius-xs)] bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 flex items-center justify-center transition-theme shadow-2xs cursor-pointer" style={{ color: SOCIAL_COLORS.whatsapp.base }}
                                    title={isRtl ? 'مراسلة عبر واتساب' : 'WhatsApp'}
                                    aria-label={isRtl ? 'مراسلة عبر واتساب' : 'WhatsApp'}
                                  >
                                    <Phone size={14} className="shrink-0" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {}
                  {pageDetailTab === 'about' && (
                    <div className="p-4 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border-default)] space-y-3 text-xs">
                      <h4 className="font-extrabold text-sm border-b border-[var(--border-default)] pb-2">
                        {isRtl ? 'تفاصيل الصفحة التجارية:' : 'Business Details:'}
                      </h4>
                      <p className="text-[var(--text-secondary)] leading-relaxed">{selectedPageDetail.page.description}</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div className="p-3 rounded-[var(--radius-md)] bg-[var(--surface-card)] border border-[var(--border-default)]">
                          <span className="text-[var(--text-muted)] text-[10px] block">{isRtl ? 'المحافظة / المدينة:' : 'City:'}</span>
                          <strong className="font-bold text-xs">{selectedPageDetail.page.city}</strong>
                        </div>

                        {selectedPageDetail.page.address && (
                          <div className="p-3 rounded-[var(--radius-md)] bg-[var(--surface-card)] border border-[var(--border-default)]">
                            <span className="text-[var(--text-muted)] text-[10px] block">{isRtl ? 'العنوان التفصيلي:' : 'Address:'}</span>
                            <strong className="font-bold text-xs">{selectedPageDetail.page.address}</strong>
                          </div>
                        )}

                        {selectedPageDetail.page.whatsapp_number && (
                          <div className="p-3 rounded-[var(--radius-md)] bg-[var(--surface-card)] border border-[var(--border-default)]">
                            <span className="text-[var(--text-muted)] text-[10px] block">{isRtl ? 'الواتساب الرسمي:' : 'WhatsApp:'}</span>
                            <strong className="font-bold text-xs text-accent">{selectedPageDetail.page.whatsapp_number}</strong>
                          </div>
                        )}

                        {selectedPageDetail.page.website_url && (
                          <div className="p-3 rounded-[var(--radius-md)] bg-[var(--surface-card)] border border-[var(--border-default)]">
                            <span className="text-[var(--text-muted)] text-[10px] block">{isRtl ? 'الموقع الإلكتروني:' : 'Website:'}</span>
                            <a href={selectedPageDetail.page.website_url} target="_blank" rel="noreferrer" className="font-bold text-xs text-blue-500 hover:underline">
                              {selectedPageDetail.page.website_url}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {}
                  {pageDetailTab === 'media' && (
                    <div className="pt-2">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {selectedPageDetail.ads.map((ad, gIdx) => (
                          <div
                            key={`page-gallery-ad-${ad.id}-${gIdx}`}
                            onClick={() => handleOpenLightbox(getMediaUrl(ad.image_url), ad.media_gallery, 0, ad.title, ad.author_name, ad)}
                            className="aspect-square rounded-[var(--radius-md)] overflow-hidden cursor-pointer relative group bg-[var(--surface-subtle)]"
                          >
                            <img
                              src={getMediaUrl(ad.image_url)}
                              alt={ad.title || 'Ad gallery image'}
                              onError={(e) => {
                                const target = e.currentTarget;
                                if (!target.dataset.fallback) {
                                  target.dataset.fallback = 'true';
                                  target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1080&q=80';
                                }
                              }}
                              className="w-full h-full object-cover transition-theme"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-theme flex items-end p-2 text-[var(--text-primary)] text-[10px] font-bold">
                              {ad.title}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </motion.div>
            ) : (
              <>
                {}
                {}
                {}
                {activeTab === 'board' && (
                  <BoardFeed
                    isRtl={isRtl}
                    selectedCity={selectedCity}
                    selectedRadius={selectedRadius}
                    setIsLocationFlyoutOpen={setIsLocationFlyoutOpen}
                    handleDetectGpsLocation={handleDetectGpsLocation}
                    isDetectingGps={isDetectingGps}
                    triggerFeedRefresh={triggerFeedRefresh}
                    isRefreshing={isRefreshing}
                    storiesProps={{
                      isRtl,
                      activeTab,
                      setActiveTab,
                      token,
                      user,
                      setIsStoryModalOpen,
                      onOpenUploadStory: (mode: 'media' | 'text' = 'media') => {
                        if (!token) {
                          toast.error(isRtl ? 'يرجى تسجيل الدخول أولاً' : 'Please log in first');
                          return;
                        }
                        setStoryUploadMode(mode);
                        setIsStoryModalOpen(true);
                      },
                      onOpenUploadReel: () => {
                        if (!token) {
                          toast.error(isRtl ? 'يرجى تسجيل الدخول أولاً' : 'Please log in first');
                          return;
                        }
                        openReelUploadModal();
                      },
                      representativeStories,
                      orderedStories,
                      previewingVideoStoryId,
                      setPreviewingVideoStoryId,
                      setSelectedStoryIndex,
                      setIsStoryViewerOpen,
                      storyPressTimerRef,
                      getMediaUrl,
                    }}
                    composerProps={{
                      user,
                      token,
                      isRtl,
                      setIsAdModalOpen,
                      setIsStreamSetupOpen,
                      openPostUploadModal,
                      openReelUploadModal,
                    }}
                    ads={ads}
                    loading={loading}
                    hasMoreAds={hasMoreAds}
                    loadingMoreAds={loadingMoreAds}
                    handleLoadMoreAds={handleLoadMoreAds}
                    setActiveReelModalId={setActiveReelModalId}
                    setActiveTab={setActiveTab}
                    searchQuery={searchQuery}
                    token={token}
                    user={user}
                    handleReportAd={handleReportAd}
                    handleToggleLike={handleToggleLike}
                    toggleComments={toggleComments}
                    handleToggleCommentLike={handleToggleCommentLike}
                    expandedAdId={expandedAdId}
                    commentsMap={commentsMap}
                    loadingCommentsAdId={loadingCommentsAdId}
                    newCommentText={newCommentText}
                    setNewCommentText={setNewCommentText}
                    handleAddComment={handleAddComment}
                    replyToCommentId={replyToCommentId}
                    setReplyToCommentId={setReplyToCommentId}
                    handleMessageAdvertiser={handleMessageAdvertiser}
                    messagingAdId={messagingAdId}
                    setInquireAd={setInquireAd}
                    handleWhatsAppClick={handleWhatsAppClick}
                    handleShareAd={handleShareAd}
                    handleOpenPageDetail={handleOpenPageDetail}
                    handleOpenUserDetail={handleOpenUserDetail}
                    handleOpenLightbox={handleOpenLightbox}
                    openPostUploadModal={openPostUploadModal}
                    handleOpenBoostModal={handleOpenBoostModal}
                    handleEditAd={handleEditAd}
                    handleDeleteAd={handleDeleteAd}
                    handleToggleSave={handleToggleSave}
                    setAds={setAds}
                    setSavedAds={setSavedAds}
                  />
                )}



                {}
                {}
                {}
                {activeTab === 'saved' && (
                  <SavedPostsTab
                    savedAds={savedAds}
                    loadingSaved={loadingSaved}
                    isRtl={isRtl}
                    token={token}
                    user={user}
                    setActiveTab={setActiveTab}
                    handleReportAd={handleReportAd}
                    handleToggleLike={handleToggleLike}
                    toggleComments={toggleComments}
                    handleToggleCommentLike={handleToggleCommentLike}
                    expandedAdId={expandedAdId}
                    commentsMap={commentsMap}
                    loadingCommentsAdId={loadingCommentsAdId}
                    newCommentText={newCommentText}
                    setNewCommentText={setNewCommentText}
                    handleAddComment={handleAddComment}
                    replyToCommentId={replyToCommentId}
                    setReplyToCommentId={setReplyToCommentId}
                    handleMessageAdvertiser={handleMessageAdvertiser}
                    messagingAdId={messagingAdId}
                    setInquireAd={setInquireAd}
                    handleWhatsAppClick={handleWhatsAppClick}
                    handleShareAd={handleShareAd}
                    handleOpenPageDetail={handleOpenPageDetail}
                    handleOpenUserDetail={handleOpenUserDetail}
                    handleOpenLightbox={handleOpenLightbox}
                    openPostUploadModal={openPostUploadModal}
                    handleOpenBoostModal={handleOpenBoostModal}
                    handleEditAd={handleEditAd}
                    handleDeleteAd={handleDeleteAd}
                    handleToggleSave={handleToggleSave}
                    setAds={setAds}
                    setSavedAds={setSavedAds}
                  />
                )}

                {}
                {}
                {}
                {activeTab === 'inquiries' && (
                  <InquiriesTab
                    isRtl={isRtl}
                    setActiveTab={setActiveTab}
                    selectedInboxAd={selectedInboxAd}
                    setSelectedInboxAd={setSelectedInboxAd}
                    inquiriesSearchTerm={inquiriesSearchTerm}
                    setInquiriesSearchTerm={setInquiriesSearchTerm}
                    inquiriesLoading={inquiriesLoading}
                    inquiriesList={inquiriesList}
                    filteredInquiriesList={filteredInquiriesList}
                    fetchInquiries={fetchInquiries}
                  />
                )}
                </>
              )}
            </div>

            {}
            <div className="hidden xl:flex flex-col w-64 xl:w-[290px] 2xl:w-[320px] shrink-0 gap-4 order-3 sticky top-[calc(60px+env(safe-area-inset-top,0px))] max-h-[calc(100vh-5.5rem)] overflow-y-auto custom-scrollbar overscroll-contain">
              {}
              <RecommendationWidget
                variant="bulletin"
                filterType="bulletin"
                limit={3}
                title={isRtl ? 'إعلانات جانبية موصى بها' : 'Recommended Side Ads'}
                subtitle={isRtl ? 'مقترحات مخصصة بناءً على سلوكك واهتماماتك' : 'Tailored ad suggestions'}
                className="ui-card-container"
                onAdClick={handleRecommendationAdClick}
              />

              {}
              <div className="ui-card-container flex flex-col gap-3 w-full">
                <div className="flex items-center justify-between gap-2.5 pb-2.5 mb-1 border-b border-[var(--border-default)] w-full">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-shape-md bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
                      <UserPlus size={18} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs sm:text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2 truncate">
                        <span>{isRtl ? 'صفحات موصى بها' : 'Recommended Pages'}</span>
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ms-auto">
                    <button
                      onClick={() => setActiveTab('pages')}
                      className="w-8 h-8 rounded-shape-sm bg-transparent border border-[var(--border-default)] hover:bg-accent/10 hover:border-accent/20 text-[var(--text-muted)] hover:text-accent transition-all duration-150 active:scale-95 group shrink-0 cursor-pointer relative flex items-center justify-center"
                      title={isRtl ? 'عرض كافة الصفحات التجارية' : 'View All Pages'}
                    >
                      <ArrowLeft size={14} className={`transition-transform duration-200 ${isRtl ? 'group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5 rotate-180'}`} />
                    </button>

                    <button
                      onClick={() => fetchPages()}
                      disabled={pagesLoading}
                      className="w-8 h-8 rounded-shape-sm bg-transparent border border-[var(--border-default)] hover:bg-accent/10 hover:border-accent/20 text-[var(--text-muted)] hover:text-accent transition-all duration-150 active:scale-95 group shrink-0 cursor-pointer relative flex items-center justify-center"
                      title={isRtl ? 'تحديث' : 'Refresh'}
                    >
                      <RefreshCw size={14} className={pagesLoading ? 'animate-spin text-accent' : 'transition-transform duration-300 group-hover:rotate-180'} />
                    </button>
                  </div>
                </div>

                {pagesLoading ? (
                  <div className="flex flex-col gap-1.5 w-full">
                    {[1, 2, 3].map(n => (
                      <div key={`bulletin-skel-rec-col3-${n}`} className="h-10 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] animate-pulse"></div>
                    ))}
                  </div>
                ) : pagesList.slice(0, 5).length === 0 ? (
                  <div className="text-center py-3 space-y-2">
                    <p className="text-xs text-[var(--text-muted)]">{isRtl ? 'لا توجد صفحات حالياً' : 'No pages currently'}</p>
                    <button
                      onClick={() => {
                        if (!token) {
                          toast.error(isRtl ? 'يرجى تسجيل الدخول أولاً' : 'Please log in first');
                          return;
                        }
                        setIsPageModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-accent hover:bg-accent/10 transition-colors border border-accent/30 rounded-shape-sm cursor-pointer"
                    >
                      <Plus size={13} />
                      <span>{isRtl ? 'إنشاء صفحة تجارية' : 'Create Merchant Page'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1 w-full">
                    {pagesList.slice(0, 5).map((page, idx) => (
                      <div
                        key={`rec-page-col3-${page.id}-${idx}`}
                        onClick={() => handleOpenPageDetail(page.id)}
                        className="group relative platform-tab-btn cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="relative shrink-0">
                            <BulletinAvatar
                              src={page.avatar_url}
                              alt={page.name}
                              size="sm"
                              isPage={true}
                            />
                          </div>
                          <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1">
                                <h4 className="text-xs font-bold text-[var(--text-primary)] group-hover:text-accent transition-colors truncate">{page.name}</h4>
                                <CheckCircle2 size={12} className="text-blue-500 shrink-0" />
                              </div>
                              <p className="text-[10px] text-[var(--text-muted)] truncate">{page.city} • {page.followers_count} {isRtl ? 'متابع' : 'followers'}</p>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] font-bold text-accent px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 group-hover:bg-accent/20 transition-all shrink-0">
                                {isRtl ? 'زيارة' : 'Visit'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {}
      {}
      {}
      <LiveStreamModal
        isOpen={isLiveStreamOpen}
        onClose={() => {
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
          setIsLiveStreamOpen(false);
        }}
        isRtl={isRtl}
        user={user}
        walletBalance={walletBalance}
        streamTitleInput={streamTitleInput}
        streamFeed={streamFeed}
        currentFeedIndex={currentFeedIndex}
        setCurrentFeedIndex={setCurrentFeedIndex}
        streamRef={streamRef}
        videoRef={videoRef}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        liveViewers={liveViewers}
        liveLikes={liveLikes}
        handleLiveLike={handleLiveLike}
        showLikeAnimation={showLikeAnimation}
        liveComments={liveComments}
        newLiveComment={newLiveComment}
        setNewLiveComment={setNewLiveComment}
        handleSendLiveComment={handleSendLiveComment}
        isGiftModalOpen={isGiftModalOpen}
        setIsGiftModalOpen={setIsGiftModalOpen}
        giftsCatalog={giftsCatalog}
        handleSendGift={handleSendGift}
      />

      {}
      {}
      {}
      <AppModal
        open={isAdModalOpen}
        onClose={() => setIsAdModalOpen(false)}
        size="lg"
        layer="modal"
        closeOnBackdrop={false}
      >
              {/* Modal Header */}
              <div className="bg-[var(--surface-subtle)] border-b border-[var(--border-default)] p-2.5 sm:p-4 text-[var(--text-primary)] relative overflow-hidden shrink-0">
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                    <div className="p-1.5 sm:p-2.5 rounded-shape-sm bg-accent/10 text-accent border border-accent/20 shrink-0">
                      <Edit2 size={15} className="sm:size-[18px]" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs sm:text-base font-bold flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span className="truncate">
                          {composerView === 'feelings' ? (isRtl ? 'كيف تشعر؟' : 'How are you feeling?') :
                           composerView === 'location' ? (isRtl ? 'أين أنت؟' : 'Where are you?') :
                           composerView === 'tagging' ? (isRtl ? 'إشارة إلى أشخاص' : 'Tag people') :
                           composerView === 'emojis' ? (isRtl ? 'اختر رمزاً تعبيرياً' : 'Choose Emoji') :
                           isEditMode ? (isRtl ? 'تعديل المنشور' : 'Edit Post') :
                           (isRtl ? 'إنشاء منشور جديد' : 'Create New Post')}
                        </span>
                        {isEditMode && composerView === 'main' && (
                          <span className="px-1.5 py-0.5 rounded-shape-xs bg-amber-500/20 text-amber-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shrink-0">
                            {isRtl ? 'وضع التعديل' : 'Edit Mode'}
                          </span>
                        )}
                        {(adFormData.image_url || adFormData.video_url || videoMetadataInfo.localVideoUrl) && (
                          <span className="px-1.5 py-0.5 rounded-shape-xs bg-[var(--fg-success)]/15 text-[var(--fg-success)] text-[9px] sm:text-[10px] font-bold shrink-0">
                            100% {isRtl ? 'جاهز' : 'Ready'}
                          </span>
                        )}
                      </h3>
                      <p className="text-[10.5px] sm:text-xs text-[var(--text-muted)] font-medium pt-0.5 truncate hidden xs:block">
                        {isEditMode
                          ? (isRtl ? 'تحديث نص المنشور، الوسائط، والخيارات' : 'Modify post text, media & options')
                          : (isRtl ? 'شارِك أفكارك وصورك أو مقاطع الفيديو' : 'Share ideas, photos or videos')}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (composerView === 'main') setIsAdModalOpen(false);
                      else setComposerView('main');
                    }}
                    className="w-7 h-7 sm:w-9 sm:h-9 rounded-shape-sm bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all border border-[var(--border-default)] flex items-center justify-center cursor-pointer shrink-0 ms-1.5 sm:ms-2"
                    title={isRtl ? 'إغلاق' : 'Close'}
                  >
                    {composerView === 'main' ? <X size={15} className="sm:size-[17px]" /> : <ArrowLeft size={15} className={`sm:size-[16px] ${isRtl ? 'rotate-180' : ''}`} />}
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 sm:p-4 scrollbar-thin">
                {composerView === 'main' && (
                  <form onSubmit={handleCreateCampaign} className="space-y-2.5 sm:space-y-4">
                    {}
                    <div className="flex items-center gap-2 sm:gap-3">
                      <BulletinAvatar
                        src={adFormData.page_id ? myPagesList.find(p => p.id === Number(adFormData.page_id))?.avatar_url : user?.avatar}
                        alt={adFormData.page_id ? myPagesList.find(p => p.id === Number(adFormData.page_id))?.name : user?.name}
                        size="sm"
                        isPage={Boolean(adFormData.page_id)}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                          <span className="text-xs sm:text-base font-bold text-[var(--text-primary)] truncate">
                            {adFormData.page_id ? myPagesList.find(p => p.id === Number(adFormData.page_id))?.name : user?.name}
                          </span>
                          {adFormData.feeling && (
                            <span className="text-[11px] sm:text-xs text-[var(--text-muted)] font-medium truncate">
                              — {isRtl ? 'يشعر بـ' : 'is feeling'} {FEELINGS.find(f => f.id === adFormData.feeling)?.icon} {isRtl ? FEELINGS.find(f => f.id === adFormData.feeling)?.labelAr : FEELINGS.find(f => f.id === adFormData.feeling)?.labelEn}
                            </span>
                          )}
                          {adFormData.location_city && (
                            <span className="text-[11px] sm:text-xs text-[var(--text-muted)] font-medium truncate">
                              — {isRtl ? 'في' : 'in'} <span className="text-accent font-bold">{adFormData.location_city}</span>
                            </span>
                          )}
                        </div>

                        {/* Page selector */}
                        <div className="flex items-center gap-1 sm:gap-1.5 mt-1 sm:mt-1.5 flex-wrap">
                          {/* Page Selector Pill */}
                          {myPagesList.length > 0 && (
                            <SearchableSelect
                              value={String(adFormData.page_id || '')}
                              onChange={(val) => setAdFormData({ ...adFormData, page_id: val })}
                              options={[
                                { value: '', label: isRtl ? 'حسابي الشخصي' : 'Personal Profile' },
                                ...myPagesList.map((p) => ({
                                  value: String(p.id),
                                  label: p.name,
                                  icon: <Building2 size={12} className="text-accent" />
                                }))
                              ]}
                              searchable={myPagesList.length > 5}
                              size="sm"
                              dir={isRtl ? 'rtl' : 'ltr'}
                              className="w-auto min-w-[140px]"
                            />
                          )}

                          {}
                          <button
                            type="button"
                            onClick={() => setIsAudienceModalOpen(true)}
                            className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 sm:px-2 rounded-md bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface-inset)] transition-colors cursor-pointer"
                            title={isRtl ? 'تحديد جمهور المنشور' : 'Select audience'}
                          >
                            {adFormData.audience === 'friends' ? (
                              <>
                                <Users size={10} className="text-blue-500 shrink-0" />
                                <span>{isRtl ? 'الأصدقاء' : 'Friends'}</span>
                              </>
                            ) : adFormData.audience === 'only_me' ? (
                              <>
                                <Lock size={10} className="text-amber-500 shrink-0" />
                                <span>{isRtl ? 'أنا فقط' : 'Only Me'}</span>
                              </>
                            ) : (
                              <>
                                <Globe size={10} className="text-[var(--text-muted)] shrink-0" />
                                <span>{isRtl ? 'العامة' : 'Public'}</span>
                              </>
                            )}
                            <ChevronDown size={10} className="text-[var(--text-muted)]" />
                          </button>

                          {}
                          <button
                            type="button"
                            onClick={() => setAdFormData(prev => ({ ...prev, is_ai_generated: !prev.is_ai_generated }))}
                            className={`flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 sm:px-2 rounded-md transition-colors cursor-pointer ${
                              adFormData.is_ai_generated
                                ? 'bg-purple-500/15 text-purple-500'
                                : 'bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface-inset)]'
                            }`}
                            title={isRtl ? 'تسمية المحتوى الذي تم إنشاؤه بالذكاء الاصطناعي' : 'Label AI-generated content'}
                          >
                            {adFormData.is_ai_generated ? (
                              <>
                                <Sparkles size={10} className="text-purple-500 shrink-0" />
                                <span>{isRtl ? 'ذكاء اصطناعي: مفعّل' : 'AI label: On'}</span>
                              </>
                            ) : (
                              <>
                                <span>{isRtl ? 'تسمية الذكاء الاصطناعي ➕' : 'AI label off ➕'}</span>
                              </>
                            )}
                            <ChevronDown size={10} className="text-[var(--text-muted)]" />
                          </button>

                          {}
                          <button
                            type="button"
                            onClick={() => {
                              setAdFormData(prev => ({
                                ...prev,
                                ad_format: prev.ad_format === 'post' ? 'reel' : prev.ad_format === 'reel' ? 'story' : 'post'
                              }));
                            }}
                            className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 sm:px-2 rounded-md bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 transition-colors cursor-pointer"
                            title={isRtl ? 'تغيير شكل وتنسيق المنشور' : 'Change post format'}
                          >
                            <Clapperboard size={10} className="shrink-0 text-indigo-500" />
                            <span>
                              {adFormData.ad_format === 'reel' ? (isRtl ? 'ريلز (9:16)' : 'Reel (9:16)') :
                               adFormData.ad_format === 'story' ? (isRtl ? 'قصة (9:16)' : 'Story (9:16)') :
                               (isRtl ? 'منشور عادي' : 'Standard Post')}
                            </span>
                            <ChevronDown size={10} className="text-[var(--text-muted)]" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {}
                    <div className="py-1 sm:py-2">
                      <textarea
                        value={adFormData.description}
                        onChange={(e) => handleComposerTextChange(e.target.value)}
                        placeholder={
                          isRtl
                            ? `بمَ تفكر اليوم، ${user?.name ? user.name.split(' ')[0] : ''}؟`
                            : `What's on your mind, ${user?.name ? user.name.split(' ')[0] : ''}?`
                        }
                        className="w-full text-sm sm:text-lg bg-transparent border-0 outline-none focus:outline-none focus:ring-0 resize-none min-h-[80px] sm:min-h-[140px] text-[var(--text-primary)] p-1 placeholder-[var(--text-muted)] font-normal leading-relaxed mb-1"
                        rows={3}
                        autoFocus
                      />

                      {}
                      <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono px-1 pb-1">
                        <span>
                          {isRtl ? 'الحد الأقصى 1000 حرف' : 'Max 1000 chars'}
                        </span>
                        <span dir="ltr" className={`font-mono inline-block ${adFormData.description.length >= 900 ? 'text-[var(--fg-danger)] font-bold' : ''}`}>
                          {adFormData.description.length} / 1000
                        </span>
                      </div>

                      {}
                      {suggestionType !== 'none' && (
                        <div className="my-2 p-2 bg-[var(--surface-card)] border border-[var(--border-default)] rounded-[var(--radius-md)] shadow-lg max-h-[160px] overflow-y-auto z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                          <div className="flex items-center justify-between px-2 pb-1.5 border-b border-[var(--border-default)] text-[10px] text-[var(--text-muted)] font-extrabold">
                            <span>
                              {suggestionType === 'hashtag'
                                ? (isRtl ? 'اقتراحات وسوم شائعة (#)' : 'Trending Hashtags (#)')
                                : (isRtl ? 'خيارات المنشن والإشارة (@)' : 'Mentions & Sharing Precision (@)')}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setSuggestionType('none');
                                setSuggestionQuery('');
                              }}
                              className="hover:text-red-500 font-black text-xs"
                            >
                              ×
                            </button>
                          </div>
                          <div className="divide-y divide-[var(--border-default)] mt-1">
                            {suggestionType === 'hashtag' && (
                              trendingHashtags
                                .filter(tag => !suggestionQuery || tag.toLowerCase().includes(suggestionQuery.toLowerCase()))
                                .map((tag, idx) => (
                                  <button
                                    key={`has-${idx}`}
                                    type="button"
                                    onClick={() => handleSelectSuggestion(tag)}
                                    className="w-full text-right sm:text-left rtl:text-right ltr:text-left px-2 py-1.5 text-xs hover:bg-accent/10 hover:text-accent transition-colors font-semibold text-[var(--text-secondary)] flex items-center gap-2"
                                  >
                                    <span className="text-accent font-bold">#</span>
                                    <span>{tag}</span>
                                  </button>
                                ))
                            )}

                            {suggestionType === 'mention' && (
                              mentionSuggestions
                                .filter(item => {
                                  const q = suggestionQuery.toLowerCase();
                                  return !suggestionQuery || item.name.toLowerCase().includes(q) || item.username.toLowerCase().includes(q);
                                })
                                .map((item, idx) => {
                                  const isBroadcast = item.type === 'broadcast';
                                  return (
                                    <button
                                      key={`men-${idx}`}
                                      type="button"
                                      onClick={() => handleSelectSuggestion(item.username)}
                                      className="w-full text-right sm:text-left rtl:text-right ltr:text-left px-2 py-1.5 text-xs hover:bg-accent/10 hover:text-accent transition-colors font-semibold text-[var(--text-secondary)] flex items-center justify-between"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className={isBroadcast ? 'text-accent' : 'text-accent'}>
                                          {isBroadcast ? '📢' : '@'}
                                        </span>
                                        <span>{isRtl && item.labelAr ? item.labelAr : item.name}</span>
                                      </div>
                                      {!isBroadcast && (
                                        <span className="text-[9px] text-[var(--text-muted)] font-mono">
                                          @{item.username}
                                        </span>
                                      )}
                                    </button>
                                  );
                                })
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Upload progress & transcoding status */}
                    {(videoMetadataInfo.processingStage === 'uploading' || videoMetadataInfo.processingStage === 'transcoding') && (
                      <div className="mb-3 p-3.5 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border-default)] space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-[var(--text-primary)]">
                          <span className="flex items-center gap-2">
                            <Loader2 size={14} className="animate-spin text-accent" />
                            <span>
                              {videoMetadataInfo.processingStage === 'uploading'
                                ? (isRtl ? 'جاري رفع مقطع الفيديو...' : 'Uploading video...')
                                : (isRtl ? 'جاري معالجة وضغط الفيديو تلقائياً...' : 'Processing & optimizing video...')}
                            </span>
                          </span>
                          <span className="font-mono text-accent">{Math.round(videoMetadataInfo.uploadProgress || 0)}%</span>
                        </div>
                        <div className="w-full bg-[var(--surface-card)] rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-accent h-full transition-all duration-200"
                            style={{ width: `${videoMetadataInfo.uploadProgress || 0}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Empty State: Content Upload Card Dropzone */}
                    {!(
                      (adFormData.media_gallery && adFormData.media_gallery.length > 0) ||
                      adFormData.image_url ||
                      adFormData.video_url ||
                      videoMetadataInfo.localVideoUrl
                    ) && (
                      <div
                        onDragOver={(e) => { e.preventDefault(); setIsComposerDragging(true); }}
                        onDragLeave={() => setIsComposerDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsComposerDragging(false);
                          if (e.dataTransfer.files?.length) {
                            handleMixedMediaSelect({ target: { files: e.dataTransfer.files } } as any);
                          }
                        }}
                        className={`relative rounded-xl sm:rounded-2xl border-2 border-dashed p-2.5 sm:p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer group min-h-[95px] sm:min-h-[150px] select-none ${
                          isComposerDragging
                            ? 'border-accent bg-accent/10 scale-[1.01]'
                            : 'border-[var(--border-default)] hover:border-accent/70 bg-[var(--surface-subtle)]/60 hover:bg-[var(--surface-subtle)]'
                        }`}
                      >
                        <input
                          type="file"
                          multiple
                          accept="image/*,video/*"
                          onChange={handleMixedMediaSelect}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />

                        <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-[var(--surface-card)] border border-[var(--border-default)] flex items-center justify-center text-accent mb-1 sm:mb-2.5 shadow-xs group-hover:scale-110 group-hover:bg-accent group-hover:text-slate-950 transition-all duration-200">
                          <ImageIcon size={16} className="sm:size-[22px]" />
                        </div>

                        <h4 className="text-[11px] sm:text-sm font-extrabold text-[var(--text-primary)] group-hover:text-accent transition-colors leading-tight">
                          {isRtl ? 'إضافة صور أو مقاطع فيديو' : 'Add Photos or Videos'}
                        </h4>

                        <p className="text-[9.5px] sm:text-xs text-[var(--text-muted)] mt-0.5 sm:mt-1 font-medium max-w-xs">
                          {isRtl ? 'اسحب وأفلت الملفات هنا أو انقر للتصفح' : 'Drag & drop files or click to browse'}
                        </p>

                        <div className="flex items-center gap-1 sm:gap-1.5 mt-1.5 sm:mt-2.5">
                          <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[10px] font-bold bg-[var(--surface-card)] border border-[var(--border-default)] text-[var(--text-secondary)]">
                            JPG, PNG, WebP
                          </span>
                          <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[10px] font-bold bg-[var(--surface-card)] border border-[var(--border-default)] text-[var(--text-secondary)]">
                            MP4, MOV (≤100MB)
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Media Loaded State: Preview and Gallery Manager */}
                    {Boolean(
                      (adFormData.media_gallery && adFormData.media_gallery.length > 0) ||
                      adFormData.image_url ||
                      adFormData.video_url ||
                      videoMetadataInfo.localVideoUrl
                    ) && (
                      <div className="mb-2 sm:mb-3">
                        <ComposerMediaPreview
                          mediaItems={
                            adFormData.media_gallery && adFormData.media_gallery.length > 0
                              ? adFormData.media_gallery
                              : [
                                  ...(adFormData.image_url
                                    ? adFormData.image_url.split(',').map((u, i) => ({
                                        id: `img-${i}`,
                                        url: u.trim(),
                                        type: 'image' as const,
                                        caption: ''
                                      }))
                                    : []),
                                  ...(adFormData.video_url
                                    ? [
                                        {
                                          id: 'vid-0',
                                          url: adFormData.video_url,
                                          type: 'video' as const,
                                          caption: ''
                                        }
                                      ]
                                    : [])
                                ]
                          }
                          onOpenMediaManager={() => setIsMediaManagerOpen(true)}
                          onClearAll={() => {
                            setAdFormData(prev => ({
                              ...prev,
                              image_url: '',
                              video_url: '',
                              media_gallery: []
                            }));
                            setVideoMetadataInfo({ processingStage: 'done' });
                          }}
                          onAddMoreClick={() => {
                            const input = document.getElementById('composer-mixed-media-input') as HTMLInputElement;
                            if (input) input.click();
                          }}
                          isRtl={isRtl}
                        />

                        {/* Hidden file input for adding more media */}
                        <input
                          id="composer-mixed-media-input"
                          type="file"
                          multiple
                          accept="image/*,video/*"
                          onChange={handleMixedMediaSelect}
                          className="hidden"
                        />
                      </div>
                    )}
                        {adFormData.has_whatsapp_button && (
                          <div className="mt-2 p-2 sm:p-3 bg-[var(--surface-inset)] rounded-[var(--radius-md)] border border-[var(--border-default)] flex items-center justify-between gap-2 sm:gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-shape-xs bg-[#25D366]/10 flex items-center justify-center text-[#25D366] shrink-0">
                                <MessageCircle size={16} className="text-[#25D366] sm:size-5" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-[11px] sm:text-sm font-extrabold text-[var(--text-primary)] truncate">
                                  {adFormData.page_id ? myPagesList.find(p => p.id === Number(adFormData.page_id))?.name : (user?.name || 'Afaq Academy')}
                                </h4>
                                <p className="text-[10px] sm:text-[11px] text-[var(--text-muted)] font-medium truncate">
                                  {isRtl ? 'انقر لبدء المحادثة المباشرة عبر واتساب' : 'Click to start direct chat on WhatsApp'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                              <div className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-[#25D366] text-[var(--text-primary)] text-[10px] sm:text-xs font-bold flex items-center gap-1 shadow-xs">
                                <MessageCircle size={12} className="fill-white/20 sm:size-[14px]" />
                                <span>{isRtl ? 'واتساب' : 'WhatsApp'}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setAdFormData(prev => ({ ...prev, has_whatsapp_button: false }))}
                                className="w-6 h-6 sm:w-7 sm:h-7 rounded-shape-xs bg-[var(--surface-subtle)] hover:bg-red-500 hover:text-[var(--text-primary)] flex items-center justify-center text-[var(--text-muted)] transition-colors cursor-pointer"
                                title={isRtl ? 'إزالة زر الواتساب' : 'Remove WhatsApp CTA'}
                              >
                                <X size={11} />
                              </button>
                            </div>
                          </div>
                        )}

                    {}
                    {(adFormData.video_url || videoMetadataInfo.localVideoUrl) && (
                      <div className="mb-2 sm:mb-3">
                        <VideoFrameCapture
                          videoUrl={adFormData.video_url || videoMetadataInfo.localVideoUrl || ''}
                          currentCoverUrl={adFormData.image_url}
                          onSelectCover={(coverUrl) => {
                            setAdFormData(prev => ({ ...prev, image_url: coverUrl }));
                          }}
                          onRemoveCover={() => {
                            setAdFormData(prev => ({ ...prev, image_url: '' }));
                          }}
                          isRtl={isRtl}
                        />
                      </div>
                    )}

                    {}
                    {adFormData.has_whatsapp_button && (
                      <div className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-[var(--radius-md)] bg-[var(--status-success-subtle)] border border-[var(--fg-success)]/30 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <Phone size={13} className="text-[#25D366] shrink-0" />
                          <input
                            type="text"
                            value={adFormData.whatsapp_number}
                            onChange={(e) => setAdFormData({ ...adFormData, whatsapp_number: e.target.value })}
                            placeholder={isRtl ? 'رقم الواتساب (مثال: 970599000000+)' : 'WhatsApp Number (e.g., +970599000000)'}
                            className="w-full text-xs bg-transparent border-0 outline-none focus:outline-none focus:ring-0 p-0 text-[var(--text-primary)] font-bold"
                          />
                        </div>
                      </div>
                    )}

                    {}
                    <div className="px-3 py-1.5 rounded-shape-md border border-[var(--border-default)] bg-[var(--surface-card)] flex items-center justify-between shadow-xs">
                      <span className="text-[11px] font-bold text-[var(--text-primary)] shrink-0">
                        {isRtl ? 'إضافة إلى منشورك' : 'Add to your post'}
                      </span>
                      <div className="flex items-center gap-1">
                        {}
                        <label className="p-1 rounded-shape-sm hover:bg-[var(--status-success-subtle)] text-[var(--fg-success)] cursor-pointer transition-colors" title={isRtl ? 'صور / فيديو' : 'Photos / Video'}>
                          <ImageIcon size={16} />
                          <input
                            type="file"
                            multiple
                            accept="image/*,video/*"
                            onChange={handleMixedMediaSelect}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setComposerView('tagging')}
                          className="p-1 rounded-shape-sm hover:bg-accent/10 text-accent transition-colors"
                          title={isRtl ? 'إشارة إلى أشخاص' : 'Tag people'}
                        >
                          <Users size={16} />
                        </button>

                        {}
                        <button
                          type="button"
                          onClick={() => {
                            setAdFormData(prev => ({
                              ...prev,
                              has_whatsapp_button: !prev.has_whatsapp_button,
                              whatsapp_number: prev.whatsapp_number || (user as any)?.phone || ''
                            }));
                            if (!adFormData.has_whatsapp_button) {
                              toast.success(isRtl ? 'تم إرفاق زر المراسلة عبر واتساب' : 'WhatsApp CTA button attached');
                            }
                          }}
                          className={`p-1 rounded-shape-sm transition-colors ${adFormData.has_whatsapp_button ? 'bg-[#25D366]/15 text-[#25D366]' : 'hover:bg-[#25D366]/10 text-[#25D366]'}`}
                          title={isRtl ? 'زر مراسلة واتساب' : 'WhatsApp Button'}
                        >
                          <MessageCircle size={16} />
                        </button>

                        {}
                        <button
                          type="button"
                          onClick={() => setComposerView('location')}
                          className={`p-1 rounded-shape-sm transition-colors ${adFormData.location_city ? 'bg-rose-500/15 text-rose-500' : 'hover:bg-rose-500/10 text-rose-500'}`}
                          title={isRtl ? 'الموقع' : 'Location'}
                        >
                          <MapPin size={16} />
                        </button>

                        {}
                        <button
                          type="button"
                          onClick={() => setComposerView('feelings')}
                          className={`p-1 rounded-shape-sm transition-colors ${adFormData.feeling ? 'bg-amber-500/15 text-amber-500' : 'hover:bg-amber-500/10 text-amber-500'}`}
                          title={isRtl ? 'الشعور / النشاط' : 'Feeling / Activity'}
                        >
                          <Smile size={16} />
                        </button>

                        {}
                        <button
                          type="button"
                          onClick={() => setIsAddToPostModalOpen(true)}
                          className="p-1 rounded-shape-sm hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] transition-colors"
                          title={isRtl ? 'المزيد' : 'More'}
                        >
                          <SlidersHorizontal size={16} />
                        </button>
                      </div>
                    </div>

                    {}
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-[var(--text-muted)] px-1">
                      <CheckCircle2 size={12} className="text-[var(--fg-success)] shrink-0 sm:size-[13px]" />
                      <span>{isRtl ? '© جارٍ التحقق من وجود محتوى محمي بحقوق النشر' : '© Checking for copyrighted content'}</span>
                    </div>

                    {}
                    <button
                      type="submit"
                      disabled={isSubmittingAd || (!adFormData.description && !adFormData.image_url && !adFormData.video_url)}
                      className="w-full py-2.5 sm:py-3 rounded-shape-sm bg-accent hover:opacity-90 disabled:bg-[var(--surface-subtle)] disabled:text-[var(--text-muted)] text-slate-950 font-black text-xs sm:text-base shadow-sm transition-all active:scale-[0.99] cursor-pointer disabled:cursor-not-allowed"
                    >
                      {isSubmittingAd ? (isRtl ? 'جاري النشر...' : 'Publishing...') : (isEditMode ? (isRtl ? 'حفظ التعديلات' : 'Save Changes') : (isRtl ? 'نشر' : 'Post'))}
                    </button>
                  </form>
                )}

                {composerView === 'feelings' && (
                  <div className="grid grid-cols-2 gap-2">
                    {FEELINGS.map((f, fIdx) => (
                      <button
                        key={`bulletin-feel-${f.id}-${fIdx}`}
                        onClick={() => {
                          setAdFormData({...adFormData, feeling: f.id});
                          setComposerView('main');
                        }}
                        className={`p-3 rounded-[var(--radius-md)] border flex items-center gap-3 transition-theme ${adFormData.feeling === f.id ? 'border-accent bg-accent/5 text-accent' : 'border-[var(--border-default)] hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)]'}`}
                      >
                        <span className="text-xl">{f.icon}</span>
                        <span className="text-xs font-bold">{isRtl ? f.labelAr : f.labelEn}</span>
                      </button>
                    ))}
                    <button
                      onClick={() => { setAdFormData({...adFormData, feeling: ''}); setComposerView('main'); }}
                      className="col-span-2 p-2 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded-[var(--radius-md)] transition-theme"
                    >
                      {isRtl ? 'إزالة الشعور' : 'Remove Feeling'}
                    </button>
                  </div>
                )}

                {composerView === 'location' && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="p-4 rounded-[var(--radius-md)] bg-[var(--surface-card)] border border-[var(--border-default)] shadow-xl space-y-4 text-start"
                  >
                    {}
                    <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-[var(--radius-md)] bg-accent/10 text-accent flex items-center justify-center border border-accent/20 shrink-0">
                          <MapPin size={16} className="animate-bounce" />
                        </div>
                        <div>
                          <h3 className="text-xs sm:text-sm font-black text-[var(--text-primary)] flex items-center gap-1.5">
                            <span>{isRtl ? 'قائمة تحديد موقع المنشور والتغطية' : 'Post Location & Radius Flyout'}</span>
                            <span className="text-[9px] bg-accent/15 text-accent px-1.5 py-0.5 rounded-shape-sm font-bold">
                              {isRtl ? 'مباشر' : 'Live'}
                            </span>
                          </h3>
                          <p className="text-[10px] text-[var(--text-muted)]">
                            {isRtl ? 'حدد نطاق وصول منشورك الجغرافي بالوقت الفعلي' : 'Set your post visibility & reach radius in real time'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setComposerView('main')}
                        className="w-8 h-8 rounded-shape-sm bg-[var(--surface-subtle)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-theme hover:rotate-90"
                        title={isRtl ? 'إغلاق' : 'Close'}
                      >
                        <X size={15} />
                      </button>
                    </div>

                    {}
                    <div className="p-3 rounded-[var(--radius-md)] bg-[var(--surface-inset)] border border-accent/25 flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-2">
                        <Navigation size={14} className="text-accent shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-[var(--text-muted)]">
                            {isRtl ? 'الموقع ونطاق الرؤية المحدد:' : 'Targeted Location & Coverage:'}
                          </p>
                          <p className="text-xs font-black text-accent truncate max-w-[220px] sm:max-w-[320px]">
                            {adFormData.location_city
                              ? `📍 ${adFormData.location_city} (${adFormData.location_radius === 'all' ? (isRtl ? 'بلا حدود' : 'Unlimited') : `+${adFormData.location_radius || '10'} ${isRtl ? 'كم' : 'km'}`})`
                              : (isRtl ? '🌐 غير محدد (تغطية عامة)' : '🌐 Not set (Global Feed)')}
                          </p>
                        </div>
                      </div>

                      {adFormData.location_city && (
                        <button
                          type="button"
                          onClick={() => setAdFormData(prev => ({ ...prev, location_city: '' }))}
                          className="text-[11px] font-extrabold text-red-500 hover:text-red-600 px-2 py-1 bg-red-500/10 rounded-lg transition-colors shrink-0"
                        >
                          {isRtl ? 'إلغاء التحديد' : 'Clear'}
                        </button>
                      )}
                    </div>

                    {}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-[var(--text-secondary)] flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Search size={12} className="text-accent" />
                          <span>{isRtl ? 'البحث عن مدينة أو معالم بالوقت الفعلي:' : 'Real-Time Location Autocomplete:'}</span>
                        </span>
                        {isSearchingLocation && (
                          <span className="text-[10px] text-accent font-bold animate-pulse flex items-center gap-1">
                            <Loader2 size={11} className="animate-spin" />
                            <span>{isRtl ? 'جاري البحث...' : 'Searching...'}</span>
                          </span>
                        )}
                      </label>

                      <div className="relative">
                        <input
                          type="text"
                          value={customLocationSearch}
                          onChange={(e) => setCustomLocationSearch(e.target.value)}
                          placeholder={isRtl ? 'اكتب اسم المدينة، الحي، الدولة أو المعلم...' : 'Type city, landmark, or country...'}
                          className="w-full ps-8 pe-8 py-2 text-xs rounded-[var(--radius-md)] bg-[var(--surface-inset)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-accent font-bold transition-theme shadow-inner"
                        />
                        <Search size={14} className="absolute start-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                        {customLocationSearch && (
                          <button
                            type="button"
                            onClick={() => { setCustomLocationSearch(''); setLocationSuggestions([]); }}
                            className="absolute end-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-red-500 transition-colors"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>

                      {}
                      {locationSuggestions.length > 0 && (
                        <div className="mt-1 max-h-44 overflow-y-auto custom-scrollbar border border-accent/30 rounded-[var(--radius-md)] bg-[var(--surface-card)] p-1.5 shadow-xl space-y-1">
                          <div className="text-[10px] font-bold text-accent px-2 py-0.5 flex items-center justify-between border-b border-[var(--border-default)]">
                            <span>{isRtl ? 'النتائج المباشرة:' : 'Live Matches:'}</span>
                            <span>{locationSuggestions.length}</span>
                          </div>
                          {locationSuggestions.map((item, idx) => (
                            <button
                              key={`bulletin-loc-sugg-${item.display_name || idx}-${idx}`}
                              type="button"
                              onClick={() => {
                                setAdFormData(prev => ({ ...prev, location_city: item.display_name }));
                                setLocationSuggestions([]);
                                setCustomLocationSearch('');
                              }}
                              className="w-full text-right rtl:text-right ltr:text-left px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-accent/10 rounded-lg transition-colors flex items-center gap-2 font-medium"
                            >
                              <MapPin size={12} className="text-accent shrink-0" />
                              <span className="truncate">{item.display_name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {}
                    <div className="space-y-1.5 p-3 rounded-[var(--radius-md)] bg-[var(--surface-inset)] border border-[var(--border-default)]">
                      <label className="block text-[11px] font-extrabold text-[var(--text-primary)] flex items-center gap-1.5">
                        <Building2 size={13} className="text-accent" />
                        <span>{isRtl ? 'اختيار سريع حسب القوائم الجاهزة:' : 'Quick Country & City Selection:'}</span>
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* Quick Country */}
                        <div>
                          <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-0.5">
                            {isRtl ? 'الدولة:' : 'Country:'}
                          </label>
                          <SearchableSelect
                            value={selectedComposerCountry}
                            onChange={(country) => {
                              setSelectedComposerCountry(country);
                              const cities = COUNTRIES_CITIES_DATA[country] || [];
                              const firstCity = cities[0] || country;
                              setAdFormData(prev => ({ ...prev, location_city: `${country} - ${firstCity}` }));
                            }}
                            options={Object.keys(COUNTRIES_CITIES_DATA).map((c) => ({
                              value: c,
                              label: c,
                              icon: <MapPin size={12} className="text-accent" />
                            }))}
                            placeholder={isRtl ? 'اختر الدولة...' : 'Select Country...'}
                            dir={isRtl ? 'rtl' : 'ltr'}
                            size="sm"
                            className="w-full"
                          />
                        </div>

                        {/* Quick City */}
                        <div>
                          <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-0.5">
                            {isRtl ? 'المدينة:' : 'City:'}
                          </label>
                          <SearchableSelect
                            value={
                              adFormData.location_city?.includes(' - ')
                                ? adFormData.location_city.split(' - ')[1]
                                : adFormData.location_city
                            }
                            onChange={(cityName) => {
                              setAdFormData(prev => ({
                                ...prev,
                                location_city: `${selectedComposerCountry} - ${cityName}`
                              }));
                            }}
                            options={(COUNTRIES_CITIES_DATA[selectedComposerCountry] || []).map((cityName) => ({
                              value: cityName,
                              label: cityName,
                              icon: <Building2 size={12} className="text-accent" />
                            }))}
                            placeholder={isRtl ? 'اختر المدينة...' : 'Select City...'}
                            dir={isRtl ? 'rtl' : 'ltr'}
                            size="sm"
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>

                    {}
                    <div className="space-y-2 p-3 rounded-[var(--radius-md)] bg-[var(--surface-inset)] border border-accent/20">
                      <div className="flex items-center justify-between text-xs font-extrabold">
                        <span className="text-[var(--text-primary)] flex items-center gap-1.5">
                          <SlidersHorizontal size={13} className="text-accent" />
                          <span>{isRtl ? 'شعاع مسافة التغطية برؤية المنشور:' : 'Post Visibility Distance Radius:'}</span>
                        </span>
                        <span className="text-accent font-black text-xs bg-accent/15 px-2 py-0.5 rounded-lg border border-accent/20">
                          {adFormData.location_radius === 'all'
                            ? (isRtl ? '🌐 بلا حدود' : '🌐 Unlimited')
                            : `🎯 +${adFormData.location_radius || '10'} ${isRtl ? 'كم' : 'km'}`}
                        </span>
                      </div>

                      {}
                      <div className="space-y-1 pt-1">
                        <input
                          type="range"
                          min="5"
                          max="100"
                          step="5"
                          value={adFormData.location_radius === 'all' ? '100' : (adFormData.location_radius || '10')}
                          onChange={(e) => setAdFormData(prev => ({ ...prev, location_radius: e.target.value }))}
                          className="w-full h-2 bg-[var(--surface-subtle)] rounded-lg appearance-none cursor-pointer accent-accent hover:accent-accent-400 transition-theme"
                        />
                        <div className="flex justify-between text-[9px] font-bold text-[var(--text-muted)] px-0.5">
                          <span>5 {isRtl ? 'كم' : 'km'}</span>
                          <span>25 {isRtl ? 'كم' : 'km'}</span>
                          <span>50 {isRtl ? 'كم' : 'km'}</span>
                          <span>100 {isRtl ? 'كم' : 'km'}</span>
                        </div>
                      </div>

                      {}
                      <div className="flex items-center gap-1 pt-1">
                        {['5', '10', '25', '50', '100', 'all'].map((r, rIdx) => (
                          <button
                            key={`bulletin-rad-opt-${r}-${rIdx}`}
                            type="button"
                            onClick={() => setAdFormData(prev => ({ ...prev, location_radius: r }))}
                            className={`flex-1 py-1 rounded-lg text-[10px] font-extrabold transition-theme border ${
                              (adFormData.location_radius || '10') === r
                                ? 'bg-accent text-[var(--text-primary)] border-accent shadow-2xs'
                                : 'bg-[var(--surface-inset)] text-[var(--text-secondary)] border-[var(--border-default)] hover:border-accent/50'
                            }`}
                          >
                            {r === 'all' ? (isRtl ? 'الكل' : 'All') : `${r} ${isRtl ? 'كم' : 'km'}`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {}
                    <button
                      type="button"
                      onClick={() => {
                        if (!navigator.geolocation) {
                          toast.error(isRtl ? 'المتصفح لا يدعم تحديد الموقع' : 'Geolocation is not supported');
                          return;
                        }
                        toast.loading(isRtl ? 'جاري تحديد موقعك الجغرافي...' : 'Detecting GPS location...');
                        navigator.geolocation.getCurrentPosition(
                          async (position) => {
                            toast.dismiss();
                            const { latitude, longitude } = position.coords;
                            try {
                              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar`);
                              const data = await res.json();
                              const place = data.address?.city || data.address?.town || data.address?.state || data.address?.county || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
                              setAdFormData(prev => ({ ...prev, location_city: place }));
                              toast.success(isRtl ? `🎯 تم تحديد موقعك: ${place}` : `🎯 Location set: ${place}`);
                            } catch (e) {
                              const locStr = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
                              setAdFormData(prev => ({ ...prev, location_city: locStr }));
                              toast.success(isRtl ? `🎯 تم إضافة الموقع: ${locStr}` : `🎯 Coords added: ${locStr}`);
                            }
                          },
                          () => {
                            toast.dismiss();
                            toast.error(isRtl ? 'تعذر الوصول لموقع الجهاز' : 'Could not detect location');
                          },
                          { timeout: 8000 }
                        );
                      }}
                      className="w-full py-2 px-3 rounded-[var(--radius-md)] bg-accent/10 hover:bg-accent/20 border border-accent/30 text-accent font-extrabold text-[11px] flex items-center justify-center gap-1.5 transition-theme active:scale-95"
                    >
                      <Compass size={14} className="text-accent shrink-0" />
                      <span>{isRtl ? '🎯 تحديد موقعي الجغرافي تلقائياً (GPS)' : '🎯 Auto-Detect GPS Location'}</span>
                    </button>

                    {}
                    <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-default)]">
                      <button
                        type="button"
                        onClick={() => setComposerView('main')}
                        className="flex-1 py-2 bg-[var(--surface-subtle)] hover:bg-[var(--surface-page)] text-[var(--text-secondary)] rounded-[var(--radius-md)] text-xs font-bold transition-theme"
                      >
                        {isRtl ? 'إلغاء' : 'Cancel'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setComposerView('main')}
                        className="flex-1 py-2.5 bg-accent hover:bg-accent text-[var(--text-primary)] rounded-[var(--radius-md)] text-xs font-extrabold transition-theme shadow-md shadow-none flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <Check size={15} />
                        <span>{isRtl ? 'تأكيد وحفظ الموقع' : 'Apply Location'}</span>
                      </button>
                    </div>
                  </motion.div>
                )}

                 {composerView === 'tagging' && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-shape-md bg-accent/5 border border-accent/10 text-[10px] font-bold text-accent">
                      {isRtl ? 'ميزة الإشارة تتيح لك تنبيه المستخدمين الآخرين حول منشورك.' : 'Tagging allows you to notify other users about your post.'}
                    </div>
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder={isRtl ? 'اكتب أسماء المستخدمين (مفصولة بفاصلة)...' : 'Enter usernames (comma separated)...'}
                      className="w-full px-4 py-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-accent"
                    />
                    <button
                      onClick={() => {
                        const tags = userSearch.split(',').map(s => s.trim()).filter(Boolean);
                        setAdFormData({...adFormData, tagged_users: tags});
                        setComposerView('main');
                      }}
                      className="w-full py-2.5 rounded-shape-sm bg-accent text-slate-950 font-black text-xs active:scale-95 transition-all"
                    >
                      {isRtl ? 'حفظ التغييرات' : 'Save Changes'}
                    </button>
                  </div>
                )}

                {composerView === 'emojis' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-8 gap-2 max-h-[350px] overflow-y-auto p-1 scrollbar-thin">
                      {['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','🤠','🥳','🤖','👋','🤚','🖐','✋','🖖','👌','🤌','🤏','✌️','🤞','🫰','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🧠','👀','👁️','👅','👄','💋','❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','💕','💞','💓','💗','💖','💘','💝','✨','⭐','🌟','💫','🔥','💥','💯','💢','💬','💭','💤','🚀','💡','🎉','🏆','🥇','💎'].map((emoji, idx) => (
                        <button
                          key={`bulletin-emoji-${idx}`}
                          type="button"
                          onClick={() => {
                            setAdFormData(prev => ({ ...prev, description: prev.description + emoji }));
                            setComposerView('main');
                          }}
                          className="h-10 text-xl flex items-center justify-center rounded-[var(--radius-md)] hover:bg-[var(--surface-subtle)] transition-theme"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
        </AppModal>

      {}
      <AppModal
        open={isAudienceModalOpen}
        onClose={() => setIsAudienceModalOpen(false)}
        size="md"
        layer="nested"
      >
              {}
              <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-shape-sm bg-accent/10 text-accent flex items-center justify-center">
                    <Globe size={18} />
                  </div>
                  <h3 className="text-base font-black text-[var(--text-primary)]">
                    {isRtl ? 'تحديد جمهور المنشور' : 'Select Post Audience'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAudienceModalOpen(false)}
                  className="w-8 h-8 rounded-shape-sm bg-[var(--surface-subtle)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {}
              <div className="p-4 space-y-3">
                <p className="text-xs text-[var(--text-muted)] font-medium leading-relaxed">
                  {isRtl
                    ? 'من يمكنه رؤية منشورك؟ يحدد هذا الخيار الفئات المسموح لها برؤية المنشور في التغذية الرئيسية والبحث.'
                    : 'Who can see your post? This option determines who is allowed to view the post in the main feed and search.'}
                </p>

                {}
                <button
                  type="button"
                  onClick={() => {
                    setAdFormData(prev => ({ ...prev, audience: 'public' }));
                    setIsAudienceModalOpen(false);
                  }}
                  className={`w-full p-3.5 rounded-shape-md border text-start transition-theme flex items-center justify-between ${
                    adFormData.audience === 'public'
                      ? 'border-accent bg-accent/20 ring-1 ring-accent/50'
                      : 'border-[var(--border-default)] hover:bg-[var(--surface-subtle)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-shape-md bg-accent/10 text-accent flex items-center justify-center shrink-0">
                      <Globe size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2">
                        <span>{isRtl ? 'العامة' : 'Public'}</span>
                        <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-shape-xs font-bold">
                          {isRtl ? 'موصى به' : 'Recommended'}
                        </span>
                      </h4>
                      <p className="text-[11px] text-[var(--text-muted)] font-medium">
                        {isRtl ? 'أي شخص داخل المنصة أو خارجها' : 'Anyone on or off the platform'}
                      </p>
                    </div>
                  </div>
                  {adFormData.audience === 'public' && (
                    <div className="w-6 h-6 rounded-shape-xs bg-accent text-slate-950 flex items-center justify-center shadow-xs">
                      <Check size={14} />
                    </div>
                  )}
                </button>

                {}
                <button
                  type="button"
                  onClick={() => {
                    setAdFormData(prev => ({ ...prev, audience: 'friends' }));
                    setIsAudienceModalOpen(false);
                  }}
                  className={`w-full p-3.5 rounded-shape-md border text-start transition-theme flex items-center justify-between ${
                    adFormData.audience === 'friends'
                      ? 'border-accent bg-accent/10 ring-1 ring-accent/50'
                      : 'border-[var(--border-default)] hover:bg-[var(--surface-subtle)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-shape-md bg-accent/10 text-accent flex items-center justify-center shrink-0">
                      <Users size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-[var(--text-primary)]">
                        {isRtl ? 'الأصدقاء' : 'Friends'}
                      </h4>
                      <p className="text-[11px] text-[var(--text-muted)] font-medium">
                        {isRtl ? 'المستخدمون والمسجلون فقط على المنصة' : 'Registered members & friends only'}
                      </p>
                    </div>
                  </div>
                  {adFormData.audience === 'friends' && (
                    <div className="w-6 h-6 rounded-shape-xs bg-accent text-slate-950 flex items-center justify-center shadow-xs">
                      <Check size={14} />
                    </div>
                  )}
                </button>

                {}
                <button
                  type="button"
                  onClick={() => {
                    setAdFormData(prev => ({ ...prev, audience: 'only_me' }));
                    setIsAudienceModalOpen(false);
                  }}
                  className={`w-full p-3.5 rounded-shape-md border text-start transition-theme flex items-center justify-between ${
                    adFormData.audience === 'only_me'
                      ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/50'
                      : 'border-[var(--border-default)] hover:bg-[var(--surface-subtle)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-shape-md bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                      <Lock size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-[var(--text-primary)]">
                        {isRtl ? 'أنا فقط' : 'Only Me'}
                      </h4>
                      <p className="text-[11px] text-[var(--text-muted)] font-medium">
                        {isRtl ? 'منشور خاص بك لا يظهر لأي مستخدم آخر' : 'Private post visible only to you'}
                      </p>
                    </div>
                  </div>
                  {adFormData.audience === 'only_me' && (
                    <div className="w-6 h-6 rounded-shape-xs bg-amber-500 text-[var(--text-primary)] flex items-center justify-center shadow-xs">
                      <Check size={14} />
                    </div>
                  )}
                </button>
              </div>

              {}
              <div className="p-4 bg-[var(--surface-subtle)] border-t border-[var(--border-default)] flex items-center justify-between">
                <span className="text-[11px] text-[var(--text-muted)] font-medium">
                  {isRtl ? 'سيتم تطبيق هذا الخيار على هذا المنشور' : 'Selection will apply to this post'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsAudienceModalOpen(false)}
                  className="px-5 py-2 rounded-[var(--radius-md)] bg-accent hover:bg-accent text-[var(--text-primary)] text-xs font-black transition-theme shadow-md shadow-none"
                >
                  {isRtl ? 'تم التحديد' : 'Done'}
                </button>
              </div>
        </AppModal>

      {}
      <AppModal
        open={isAddToPostModalOpen}
        onClose={() => setIsAddToPostModalOpen(false)}
        size="md"
        layer="nested"
        contentClassName="p-5 space-y-4"
      >
        <div className="flex items-center justify-between p-5 pb-3 border-b border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={() => setIsAddToPostModalOpen(false)}
                  className="p-2 rounded-shape-sm hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] transition-colors"
                >
                  <ArrowLeft size={20} className={isRtl ? 'rotate-180' : ''} />
                </button>
                <h3 className="text-base font-extrabold text-[var(--text-primary)]">
                  {isRtl ? 'إضافة إلى منشورك' : 'Add to your post'}
                </h3>
                <div className="w-9" />
              </div>

              <div className="grid grid-cols-2 gap-2 py-2">
                {}
                <label className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] hover:bg-[var(--surface-subtle)] cursor-pointer transition-theme group">
                  <div className="w-10 h-10 rounded-shape-sm bg-accent/10 flex items-center justify-center text-accent transition-theme">
                    <ImageIcon size={22} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[var(--text-primary)]">{isRtl ? 'صورة/فيديو' : 'Photo/Video'}</span>
                    <span className="text-[9px] text-[var(--text-muted)]">{isRtl ? 'إرفاق وسائط' : 'Attach media'}</span>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleMixedMediaSelect}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setComposerView('feelings');
                    setIsAddToPostModalOpen(false);
                  }}
                  className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] hover:bg-[var(--surface-subtle)] text-left rtl:text-right transition-theme group"
                >
                  <div className="w-10 h-10 rounded-shape-sm bg-orange-500/10 flex items-center justify-center text-orange-500 transition-theme">
                    <Smile size={22} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[var(--text-primary)]">{isRtl ? 'شعور/نشاط' : 'Feeling/Activity'}</span>
                    <span className="text-[9px] text-[var(--text-muted)]">{isRtl ? 'شارك حالتك' : 'Share status'}</span>
                  </div>
                </button>

                {}
                <button
                  type="button"
                  onClick={() => {
                    setComposerView('tagging');
                    setIsAddToPostModalOpen(false);
                  }}
                  className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] hover:bg-[var(--surface-subtle)] text-left rtl:text-right transition-theme group"
                >
                  <div className="w-10 h-10 rounded-shape-sm bg-accent/10 flex items-center justify-center text-accent transition-theme">
                    <Users size={22} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[var(--text-primary)]">{isRtl ? 'إشارة إلى الأشخاص' : 'Tag people'}</span>
                    <span className="text-[9px] text-[var(--text-muted)]">{isRtl ? 'مع أصدقائك' : 'With friends'}</span>
                  </div>
                </button>

                {}
                <button
                  type="button"
                  onClick={() => {
                    setComposerView('location');
                    setIsAddToPostModalOpen(false);
                  }}
                  className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] hover:bg-[var(--surface-subtle)] text-left rtl:text-right transition-theme group"
                >
                  <div className="w-10 h-10 rounded-shape-sm bg-red-500/10 flex items-center justify-center text-red-500 transition-theme">
                    <MapPin size={22} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[var(--text-primary)]">{isRtl ? 'دخول / موقع' : 'Check in'}</span>
                    <span className="text-[9px] text-[var(--text-muted)]">{isRtl ? 'مكانك الحالي' : 'Your location'}</span>
                  </div>
                </button>

                {}
                <button
                  type="button"
                  onClick={() => {
                    setAdFormData(prev => ({ ...prev, has_whatsapp_button: !prev.has_whatsapp_button }));
                    setIsAddToPostModalOpen(false);
                    toast.success(isRtl ? 'تم تفعيل زر تلقي المكالمات/واتساب' : 'Call/WhatsApp button activated');
                  }}
                  className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] hover:bg-[var(--surface-subtle)] text-left rtl:text-right transition-theme group"
                >
                  <div className="w-10 h-10 rounded-shape-sm bg-accent/10 flex items-center justify-center text-accent transition-theme">
                    <Phone size={22} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[var(--text-primary)]">{isRtl ? 'تلقي مكالمات' : 'Receive calls'}</span>
                    <span className="text-[9px] text-[var(--text-muted)]">{isRtl ? 'رقم الاتصال السريع' : 'Direct contact'}</span>
                  </div>
                </button>

                {}
                <button
                  type="button"
                  onClick={async () => {
                    const gifUrl = await confirm({
                      title: isRtl ? 'إضافة صورة GIF' : 'Add GIF Image',
                      description: isRtl ? 'أدخل رابط صورة GIF المتحركة:' : 'Enter GIF image URL:',
                      hasInput: true,
                      inputPlaceholder: 'https://...',
                      confirmLabel: isRtl ? 'إضافة' : 'Add',
                      variant: 'info',
                      requiredInput: true,
                    });
                    if (gifUrl && typeof gifUrl === 'string') {
                      setAdFormData(prev => ({ ...prev, image_url: gifUrl }));
                      toast.success(isRtl ? 'تمت إضافة صورة GIF بنجاح' : 'GIF added successfully');
                    }
                    setIsAddToPostModalOpen(false);
                  }}
                  className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] hover:bg-[var(--surface-subtle)] text-left rtl:text-right transition-theme group"
                >
                  <div className="w-10 h-10 rounded-shape-sm bg-accent/10 flex items-center justify-center text-accent font-extrabold text-xs transition-theme">
                    GIF
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[var(--text-primary)]">{isRtl ? 'صورة GIF' : 'GIF Image'}</span>
                    <span className="text-[9px] text-[var(--text-muted)]">{isRtl ? 'صور متحركة' : 'Animated sticker'}</span>
                  </div>
                </button>

                {}
                <button
                  type="button"
                  onClick={() => {
                    setAdFormData(prev => ({ ...prev, description: (prev.description ? prev.description + '\n' : '') + '🔴 [بث مباشر / Live Broadcast]' }));
                    setIsAddToPostModalOpen(false);
                    toast.success(isRtl ? 'تمت إضافة علامة البث المباشر' : 'Live video badge added');
                  }}
                  className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] hover:bg-[var(--surface-subtle)] text-left rtl:text-right transition-theme group"
                >
                  <div className="w-10 h-10 rounded-shape-sm bg-red-600/10 flex items-center justify-center text-red-500 transition-theme">
                    <Radio size={22} className="animate-pulse" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[var(--text-primary)]">{isRtl ? 'فيديو بث مباشر' : 'Live Video'}</span>
                    <span className="text-[9px] text-[var(--text-muted)]">{isRtl ? 'بث مباشر الآن' : 'Broadcast live'}</span>
                  </div>
                </button>

                {}
                <button
                  type="button"
                  onClick={() => {
                    setAdFormData(prev => ({ ...prev, description: (prev.description ? prev.description + '\n' : '') + '🎉 [حدث شخصي هام / Life Event]' }));
                    setIsAddToPostModalOpen(false);
                    toast.success(isRtl ? 'تمت إضافة علامة الحدث الشخصي' : 'Life event badge added');
                  }}
                  className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] hover:bg-[var(--surface-subtle)] text-left rtl:text-right transition-theme group"
                >
                  <div className="w-10 h-10 rounded-shape-sm bg-accent/10 flex items-center justify-center text-accent transition-theme">
                    <Bookmark size={22} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[var(--text-primary)]">{isRtl ? 'حدث شخصي' : 'Life Event'}</span>
                    <span className="text-[9px] text-[var(--text-muted)]">{isRtl ? 'مناسبة خاصة' : 'Milestone'}</span>
                  </div>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsAddToPostModalOpen(false)}
                className="w-full py-2.5 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] hover:bg-[var(--border-default)] text-[var(--text-primary)] font-bold text-xs transition-theme"
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
        </AppModal>

      {}
      {}
      {}
      <AppModal
        open={isPageModalOpen}
        onClose={() => setIsPageModalOpen(false)}
        size="lg"
        layer="modal"
        contentClassName="p-6 space-y-4"
      >
              <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                <div className="flex items-center gap-2">
                  <Building2 size={20} className="text-accent" />
                  <h3 className="text-sm font-extrabold text-[var(--text-primary)]">{isRtl ? 'إنشاء صفحة تجارية جديدة' : 'Create Merchant Page'}</h3>
                </div>
                <button onClick={() => setIsPageModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreatePage} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1 text-[var(--text-secondary)]">{isRtl ? 'اسم الشركة / المتجر:' : 'Page Name:'}</label>
                    <input
                      type="text"
                      required
                      value={pageFormData.name}
                      onChange={(e) => setPageFormData({ ...pageFormData, name: e.target.value })}
                      placeholder={isRtl ? 'شركة القدس للتكنولوجيا' : 'Name...'}
                      className="w-full px-3 py-2 text-xs rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1 text-[var(--text-secondary)]">{isRtl ? 'المدينة / المحافظة:' : 'City:'}</label>
                    <SearchableSelect
                      value={pageFormData.city}
                      onChange={(val) => setPageFormData({ ...pageFormData, city: val })}
                      options={PALESTINE_CITIES.map((c) => ({
                        value: c,
                        label: c,
                        icon: <MapPin size={13} className="text-accent" />
                      }))}
                      placeholder={isRtl ? 'اختر المدينة / المحافظة' : 'Select City...'}
                      dir={isRtl ? 'rtl' : 'ltr'}
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 text-[var(--text-secondary)]">{isRtl ? 'نبذة عن الشركة والخدمات:' : 'About Business:'}</label>
                  <textarea
                    rows={3}
                    required
                    value={pageFormData.description}
                    onChange={(e) => setPageFormData({ ...pageFormData, description: e.target.value })}
                    placeholder={isRtl ? 'صف خدماتك ومنتجاتك وساعات العمل بالتفصيل...' : 'Description...'}
                    className="w-full px-3 py-2 text-xs rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-primary)] resize-none"
                  />
                </div>

                {/* Image Specs Guidance Box */}
                <div className="p-3.5 rounded-xl bg-accent/5 border border-accent/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-accent flex items-center gap-1.5">
                      <Sparkles size={16} />
                      <span>{isRtl ? 'قياسات الصور الموصى بها والقص الذكي' : 'Recommended Image Dimensions & Smart Crop'}</span>
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] font-bold">
                      {isRtl ? 'قص تلقائي + ضغط عالي السرعة' : 'Auto Crop & Speed Optimized'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-[var(--text-secondary)]">
                    <div className="p-2 rounded-lg bg-[var(--surface-card)] border border-[var(--border-default)]">
                      <strong className="block text-[var(--text-primary)] font-bold mb-0.5">{isRtl ? 'غلاف البانير (Banner Cover):' : 'Banner Cover:'}</strong>
                      <p className="text-[10px] text-[var(--text-muted)]">{isRtl ? RECOMMENDED_IMAGE_SPECS.cover.labelAr : RECOMMENDED_IMAGE_SPECS.cover.labelEn}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-[var(--surface-card)] border border-[var(--border-default)]">
                      <strong className="block text-[var(--text-primary)] font-bold mb-0.5">{isRtl ? 'شعار الصفحة (Avatar Logo):' : 'Avatar Logo:'}</strong>
                      <p className="text-[10px] text-[var(--text-muted)]">{isRtl ? RECOMMENDED_IMAGE_SPECS.avatar.labelAr : RECOMMENDED_IMAGE_SPECS.avatar.labelEn}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <ImageUploadDropzone
                      label={isRtl ? 'صورة الشعار (Avatar):' : 'Avatar (Profile Logo):'}
                      value={pageFormData.avatar_url}
                      onChange={(url) => setPageFormData({ ...pageFormData, avatar_url: url })}
                      aspectRatio={1}
                      targetWidth={400}
                      targetHeight={400}
                      placeholderText={isRtl ? 'رفع صورة الشعار (400×400 - 1:1)' : 'Upload Avatar Image (1:1)'}
                      isRtl={isRtl}
                    />

                    <ImageUploadDropzone
                      label={isRtl ? 'صورة الغلاف (Cover Banner):' : 'Cover Banner:'}
                      value={pageFormData.cover_url}
                      onChange={(url) => setPageFormData({ ...pageFormData, cover_url: url })}
                      aspectRatio={3}
                      targetWidth={1200}
                      targetHeight={400}
                      placeholderText={isRtl ? 'رفع صورة الغلاف (1200×400 - 3:1)' : 'Upload Cover Banner (3:1)'}
                      isRtl={isRtl}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1 text-[var(--text-secondary)]">{isRtl ? 'رقم الواتساب الرسمي:' : 'Official WhatsApp:'}</label>
                    <input
                      type="text"
                      value={pageFormData.whatsapp_number}
                      onChange={(e) => setPageFormData({ ...pageFormData, whatsapp_number: e.target.value })}
                      placeholder="+970599000000"
                      className="w-full px-3 py-2 text-xs rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1 text-[var(--text-secondary)]">{isRtl ? 'العنوان التفصيلي:' : 'Detailed Address:'}</label>
                    <input
                      type="text"
                      value={pageFormData.address}
                      onChange={(e) => setPageFormData({ ...pageFormData, address: e.target.value })}
                      placeholder={isRtl ? 'شارع عمر المختار - حي الرمال' : 'Address...'}
                      className="w-full px-3 py-2 text-xs rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-primary)]"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--border-default)] flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingPage}
                    className="px-6 py-2.5 rounded-[var(--radius-md)] bg-accent hover:bg-accent text-[var(--text-primary)] font-bold text-xs shadow-lg shadow-none transition-theme"
                  >
                    {isSubmittingPage ? (isRtl ? 'جاري الإنشاء...' : 'Creating...') : (isRtl ? 'تفعيل الصفحة التجارية' : 'Create Page')}
                  </button>
                </div>
              </form>
        </AppModal>

      {}
      {}
      {}
      <AnimatePresence>
        {inquireAd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md rounded-[var(--radius-md)] bg-[var(--surface-card)] border border-[var(--border-default)] p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2.5">
                <div className="flex items-center gap-2">
                  <MessageCircle size={18} className="text-accent" />
                  <h3 className="text-xs font-extrabold text-[var(--text-primary)]">{isRtl ? 'إرسال استفسار مباشر للتاجر' : 'Direct Merchant Inquiry'}</h3>
                </div>
                <button onClick={() => setInquireAd(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <X size={16} />
                </button>
              </div>

              <div className="p-2.5 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] flex items-center gap-2.5 border border-[var(--border-default)]">
                <img src={getMediaUrl(inquireAd.image_url)} alt={inquireAd.title} className="w-12 h-12 rounded-[var(--radius-sm)] object-cover" />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold truncate text-[var(--text-primary)]">{inquireAd.title}</h4>
                  <p className="text-[10px] text-[var(--text-muted)]">{inquireAd.author_name}</p>
                </div>
              </div>

              <form onSubmit={handleSendInquiry} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold mb-1 text-[var(--text-secondary)]">{isRtl ? 'رسالتك واستفسارك:' : 'Your Inquiry:'}</label>
                  <textarea
                    rows={3}
                    required
                    value={inquiryText}
                    onChange={(e) => setInquiryText(e.target.value)}
                    placeholder={isRtl ? 'مرحباً، أود معرفة أسعار ومكونات هذا المنتج...' : 'Message...'}
                    className="w-full px-3 py-2 text-xs rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-primary)] resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold mb-1 text-[var(--text-secondary)]">{isRtl ? 'رقم هاتفك / الواتساب للتواصل contigo:' : 'Your Phone/WhatsApp:'}</label>
                  <input
                    type="text"
                    value={inquiryPhone}
                    onChange={(e) => setInquiryPhone(e.target.value)}
                    placeholder="+970599111222"
                    className="w-full px-3 py-2 text-xs rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-primary)]"
                  />
                </div>

                <div className="pt-2 border-t border-[var(--border-default)] space-y-2">
                  <button
                    type="button"
                    onClick={() => handleMessageAdvertiser(inquireAd, inquiryText)}
                    disabled={messagingAdId === inquireAd.id}
                    className="w-full py-2.5 rounded-[var(--radius-md)] bg-accent text-[var(--text-primary)] font-bold text-xs flex items-center justify-center gap-2 transition-theme hover:opacity-90 disabled:opacity-50"
                  >
                    {messagingAdId === inquireAd.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <MessageCircle size={14} />
                    )}
                    <span>{isRtl ? 'مراسلة المعلن مباشرة (فتح محادثة خاصة)' : 'Message Advertiser (Open Direct Chat)'}</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSendingInquiry}
                    className="w-full py-2 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] text-[var(--text-secondary)] font-bold text-xs flex items-center justify-center gap-2 transition-theme"
                  >
                    <Send size={13} />
                    <span>{isSendingInquiry ? (isRtl ? 'جاري الإرسال...' : 'Sending...') : (isRtl ? 'إرسال كاستفسار سريع فقط' : 'Send Quick Inquiry Only')}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {}
      {boostingAd && (
        <BoostPostModal
          isOpen={isBoostModalOpen}
          onClose={() => {
            setIsBoostModalOpen(false);
            setBoostingAd(null);
          }}
          ad={boostingAd}
          walletBalance={walletBalance}
          token={token}
          isRtl={isRtl}
          onSuccess={handleBoostSuccess}
        />
      )}

      {}
      <AnimatePresence>
        {isStreamSetupOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm rounded-[var(--radius-md)] bg-[var(--surface-card)] border border-[var(--border-default)] p-6 shadow-xl space-y-6 text-[var(--text-primary)]"
            >
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-[var(--radius-sm)] bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/20 shadow-xs">
                  <Radio size={28} className="text-red-500 animate-pulse" />
                </div>
                <h3 className="text-xl font-black tracking-tight">{isRtl ? 'إعداد البث المباشر' : 'Live Stream Setup'}</h3>
                <p className="text-xs text-[var(--text-muted)] font-medium">
                  {isRtl ? 'أدخل عنواناً جذاباً لمتابعيك قبل البدء' : 'Enter a catchy title for your audience before starting'}
                </p>
              </div>

              <div className="space-y-4">
                <div className="relative group">
                  <input
                    type="text"
                    value={streamTitleInput}
                    onChange={(e) => setStreamTitleInput(e.target.value)}
                    placeholder={isRtl ? 'مثلاً: جولة في مكتبي الجديد...' : 'e.g., Tour of my new office...'}
                    className="w-full bg-[var(--surface-subtle)] border border-[var(--border-default)] rounded-[var(--radius-sm)] px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/50 transition-theme font-bold"
                    autoFocus
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none transition-colors group-focus-within:text-red-500/50">
                    <Type size={18} />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setIsStreamSetupOpen(false);
                      setStreamTitleInput('');
                    }}
                    className="flex-1 py-3 rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] text-[var(--text-secondary)] font-bold text-xs transition-theme active:scale-95 border border-[var(--border-default)]"
                  >
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    onClick={() => {
                      if (!streamTitleInput.trim()) {
                        toast.error(isRtl ? 'يرجى إدخال عنوان للبث' : 'Please enter a stream title');
                        return;
                      }
                      setIsStreamSetupOpen(false);
                      setIsLiveStreamOpen(true);
                    }}
                    className="flex-[2] py-3 rounded-[var(--radius-sm)] bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition-theme active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{isRtl ? 'بدء البث المباشر 🚀' : 'Start Streaming 🚀'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {}
      {}
      {}
      <AnimatePresence>
        {isLocationFlyoutOpen && (
          <div
            className="fixed inset-0 z-50 flex items-start sm:items-center justify-center pt-16 sm:pt-0 p-3 sm:p-4 bg-black/50 backdrop-blur-[2px] transition-theme"
            onClick={() => setIsLocationFlyoutOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.97, opacity: 0, y: -10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.97, opacity: 0, y: -10 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm sm:max-w-md rounded-[var(--radius-md)] bg-[var(--surface-card)] border border-[var(--border-default)] shadow-2xl p-4 space-y-3.5 my-auto max-h-[88vh] overflow-y-auto custom-scrollbar backdrop-blur-md text-[var(--text-primary)] transform-gpu no-flicker"
            >
              {}
              <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-[var(--radius-md)] bg-accent/10 flex items-center justify-center text-accent border border-accent/20">
                    <MapPin size={16} className="animate-bounce shrink-0" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-[var(--text-primary)] flex items-center gap-1">
                      <span>{isRtl ? 'قائمة التغطية والموقع السريعة' : 'Instant Location & Radius Flyout'}</span>
                      <span className="text-[9px] bg-accent/15 text-accent px-1.5 py-0.5 rounded-shape-xs font-bold">
                        {isRtl ? 'مباشر' : 'Live'}
                      </span>
                    </h3>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      {isRtl ? 'ابحث بالوقت الفعلي أو اضبط شعاع التغطية (5 - 100 كم)' : 'Real-time search & radius visibility (5-100 km)'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsLocationFlyoutOpen(false)}
                  className="w-7 h-7 rounded-shape-xs bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] flex items-center justify-center text-[var(--text-muted)] transition-theme hover:rotate-90"
                >
                  <X size={15} />
                </button>
              </div>

              {}
              <div className="flex items-center justify-between px-3 py-2 rounded-[var(--radius-md)] bg-gradient-to-r from-gray-500/10 via-gray-500/10 to-gray-500/5 border border-accent/25 text-accent shadow-2xs">
                <div className="flex items-center gap-2 text-[11px] font-bold truncate">
                  <Navigation size={13} className="text-accent shrink-0" />
                  <span className="truncate">
                    {isRtl ? 'النطاق الحالي:' : 'Current Feed:'}{' '}
                    <strong className="text-accent font-extrabold">
                      {selectedCity === 'all'
                        ? (isRtl ? '🌐 جميع الدول والمحافظات' : '🌐 All Global Regions')
                        : `📍 ${selectedCountry ? `${selectedCountry} - ` : ''}${selectedCity} (${selectedRadius === 'all' ? (isRtl ? 'الكل' : 'All') : `+${selectedRadius}كم`})`}
                    </strong>
                  </span>
                </div>
                {selectedCity !== 'all' && (
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectCity('all', 'all');
                      setSelectedCountry('all');
                    }}
                    className="text-[10px] font-extrabold text-[var(--text-muted)] hover:text-red-500 underline transition-theme shrink-0 ms-1"
                  >
                    {isRtl ? 'إعادة ضبط' : 'Reset'}
                  </button>
                )}
              </div>

              {/* Country Selection */}
              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-[var(--text-secondary)] flex items-center gap-1">
                  <Globe size={13} className="text-accent" />
                  <span>{isRtl ? 'اختر الدولة:' : 'Select Country:'}</span>
                </label>
                <SearchableSelect
                  value={selectedCountry}
                  onChange={(c) => {
                    setSelectedCountry(c);
                    secureStorage.set('perplexta_user_country', c);
                    handleSelectCity('all');
                  }}
                  options={[
                    { value: 'all', label: isRtl ? '🌐 كافة الدول (تغطية عالمية)' : '🌐 All Countries (Global)' },
                    { value: 'فلسطين', label: '🇵🇸 فلسطين' },
                    { value: 'الأردن', label: '🇯🇴 الأردن' },
                    { value: 'المملكة العربية السعودية', label: '🇸🇦 المملكة العربية السعودية' },
                    { value: 'الإمارات العربية المتحدة', label: '🇦🇪 الإمارات العربية المتحدة' },
                    { value: 'مصر', label: '🇪🇬 مصر' },
                    { value: 'قطر', label: '🇶🇦 قطر' },
                    { value: 'الكويت', label: '🇰🇼 الكويت' },
                    { value: 'سلطنة عمان', label: '🇴🇲 سلطنة عمان' },
                    { value: 'البحرين', label: '🇧🇭 البحرين' },
                    { value: 'العراق', label: '🇮🇶 العراق' },
                    { value: 'لبنان', label: '🇱🇧 لبنان' },
                    { value: 'سوريا', label: '🇸🇾 سوريا' },
                    { value: 'اليمن', label: '🇾🇪 اليمن' },
                    { value: 'المغرب', label: '🇲🇦 المغرب' },
                    { value: 'الجزائر', label: '🇩🇿 الجزائر' },
                    { value: 'تونس', label: '🇹🇳 تونس' },
                    { value: 'السودان', label: '🇸🇩 السودان' },
                    { value: 'تركيا', label: '🇹🇷 تركيا' },
                    { value: 'المملكة المتحدة', label: '🇬🇧 المملكة المتحدة' },
                    { value: 'الولايات المتحدة', label: '🇺🇸 الولايات المتحدة' },
                  ]}
                  placeholder={isRtl ? 'اختر الدولة...' : 'Select Country...'}
                  dir={isRtl ? 'rtl' : 'ltr'}
                  className="w-full"
                />
              </div>

              {}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-[var(--text-secondary)] flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Building2 size={13} className="text-accent" />
                    <span>{isRtl ? 'البحث التفاعلي المباشر (بالوقت الفعلي):' : 'Real-Time Autocomplete Search:'}</span>
                  </span>
                  {isSearchingGeoLocation && (
                    <span className="text-[10px] text-accent font-bold flex items-center gap-1">
                      <Loader2 size={11} className="animate-spin" />
                      {isRtl ? 'جاري البحث...' : 'Searching...'}
                    </span>
                  )}
                </label>

                {}
                <div className="relative">
                  <input
                    type="text"
                    value={locationSearchQuery}
                    onChange={(e) => setLocationSearchQuery(e.target.value)}
                    placeholder={isRtl ? 'ابحث عن أي مدينة أو دولة أو منطقة بالوقت الفعلي...' : 'Search any city, country or landmark in real time...'}
                    className="w-full ps-8 pe-8 py-2 text-xs rounded-[var(--radius-md)] bg-[var(--surface-inset)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-accent transition-theme shadow-inner font-medium"
                  />
                  <Search size={14} className="absolute start-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  {isSearchingGeoLocation ? (
                    <Loader2 size={13} className="absolute end-2.5 top-1/2 -translate-y-1/2 text-accent animate-spin" />
                  ) : locationSearchQuery ? (
                    <button
                      type="button"
                      onClick={() => {
                        setLocationSearchQuery('');
                        setAutocompleteResults([]);
                      }}
                      className="absolute end-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      <X size={13} />
                    </button>
                  ) : null}
                </div>

                {}
                {autocompleteResults.length > 0 && (
                  <div className="space-y-1 mt-1 max-h-48 overflow-y-auto custom-scrollbar border border-accent/30 rounded-[var(--radius-md)] bg-[var(--surface-card)] p-1.5 shadow-xl">
                    <div className="text-[10px] font-bold text-accent px-2 py-1 flex items-center justify-between border-b border-[var(--border-default)]">
                      <span className="flex items-center gap-1">
                        <Sparkles size={11} />
                        {isRtl ? 'نتائج الخريطة المباشرة (موثّقة):' : 'Verified Live Location Results:'}
                      </span>
                      <span className="text-[9px] bg-accent/10 px-1.5 py-0.5 rounded text-accent font-extrabold">
                        {autocompleteResults.length} {isRtl ? 'نتيجة' : 'results'}
                      </span>
                    </div>
                    {autocompleteResults.map((item, idx) => {
                      const flag = getCountryFlagEmoji(item.country_code, item.country);
                      return (
                        <button
                          key={`${item.city}-${item.lat}-${idx}`}
                          type="button"
                          onClick={() => handleSelectAutocompleteResult(item)}
                          className="w-full text-start p-2 rounded-[var(--radius-sm)] hover:bg-accent/10 transition-theme flex items-center justify-between group border border-transparent hover:border-accent/20"
                        >
                          <div className="flex items-center gap-2 truncate me-2">
                            <span className="text-sm shrink-0">{flag}</span>
                            <div className="truncate">
                              <div className="text-xs font-black text-[var(--text-primary)] group-hover:text-accent transition-colors flex items-center gap-1">
                                <span>{item.city}</span>
                                {item.country && <span className="text-[10px] text-[var(--text-muted)] font-normal">({item.country})</span>}
                              </div>
                              <div className="text-[10px] text-[var(--text-muted)] truncate font-medium">
                                {item.state ? `${item.state} - ` : ''}{item.display_name}
                              </div>
                            </div>
                          </div>
                          <span className="text-[9px] font-extrabold text-accent bg-accent/10 px-1.5 py-0.5 rounded shrink-0 flex items-center gap-0.5">
                            <CheckCircle2 size={10} />
                            {isRtl ? 'اختيار' : 'Select'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {}
                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-1 custom-scrollbar">
                  <button
                    type="button"
                    onClick={() => handleSelectCity('all')}
                    className={`px-2.5 py-1.5 rounded-[var(--radius-md)] text-[11px] font-bold flex items-center gap-1.5 transition-theme border ${
                      selectedCity === 'all'
                        ? 'bg-accent text-[var(--text-primary)] border-accent shadow-2xs'
                        : 'bg-[var(--surface-inset)] text-[var(--text-primary)] border-[var(--border-default)] hover:bg-accent/10'
                    }`}
                  >
                    <Globe size={12} className={selectedCity === 'all' ? 'text-[var(--text-primary)]' : 'text-accent shrink-0'} />
                    <span className="truncate">{isRtl ? 'كل مدن الدولة' : 'All Cities'}</span>
                  </button>

                  {getAvailableCities().map((c, cIdx) => (
                    <button
                      key={`bulletin-avail-city-${c}-${cIdx}`}
                      type="button"
                      onClick={() => handleSelectCity(c)}
                      className={`px-2.5 py-1.5 rounded-[var(--radius-md)] text-[11px] font-bold flex items-center gap-1.5 transition-theme border ${
                        selectedCity === c
                          ? 'bg-accent text-[var(--text-primary)] border-accent shadow-2xs'
                          : 'bg-[var(--surface-inset)] text-[var(--text-primary)] border-[var(--border-default)] hover:bg-accent/10'
                      }`}
                    >
                      <MapPin size={12} className={selectedCity === c ? 'text-[var(--text-primary)]' : 'text-accent shrink-0'} />
                      <span className="truncate">{c}</span>
                    </button>
                  ))}
                </div>
              </div>

              {}
              <div className="pt-2 space-y-2 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={handleDetectGpsLocation}
                  disabled={isDetectingGps}
                  className="w-full py-1.5 px-3 rounded-[var(--radius-md)] bg-accent/10 hover:bg-accent/20 border border-accent/30 text-accent font-extrabold text-[11px] flex items-center justify-center gap-1.5 transition-theme active:scale-95 disabled:opacity-50"
                >
                  {isDetectingGps ? <Loader2 size={13} className="animate-spin text-accent" /> : <Compass size={13} />}
                  <span>{isRtl ? '🎯 تحديد موقعي الآن تلقائياً (GPS)' : '🎯 Auto-Detect My Location (GPS)'}</span>
                </button>

                {}
                <div className="space-y-2 bg-[var(--surface-inset)] p-3 rounded-[var(--radius-lg)] border border-accent/20">
                  <div className="flex items-center justify-between text-xs font-extrabold">
                    <span className="text-[var(--text-primary)] flex items-center gap-1.5">
                      <SlidersHorizontal size={13} className="text-accent" />
                      <span>{isRtl ? 'نطاق الوصول والشعاع:' : 'Reach Visibility Radius:'}</span>
                    </span>
                    <span className="text-accent font-black text-xs bg-accent/15 px-2 py-0.5 rounded-[var(--radius-sm)] border border-accent/20">
                      {selectedRadius === 'all' ? (isRtl ? '🌐 بلا حدود (الكل)' : '🌐 Unlimited (Global)') : `🎯 +${selectedRadius} ${isRtl ? 'كم' : 'km'}`}
                    </span>
                  </div>

                  {}
                  <div className="space-y-1 pt-1">
                    <input
                      type="range"
                      min="5"
                      max="100"
                      step="5"
                      value={selectedRadius === 'all' ? 100 : Number(selectedRadius)}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedRadius(val);
                        secureStorage.set('perplexta_user_radius', val);
                      }}
                      className="w-full h-2 bg-[var(--surface-subtle)] rounded-[var(--radius-sm)] appearance-none cursor-pointer accent-accent hover:accent-accent-400 transition-theme"
                    />
                    <div className="flex justify-between text-[9px] font-bold text-[var(--text-muted)] px-0.5">
                      <span>5 {isRtl ? 'كم' : 'km'}</span>
                      <span>25 {isRtl ? 'كم' : 'km'}</span>
                      <span>50 {isRtl ? 'كم' : 'km'}</span>
                      <span>100 {isRtl ? 'كم' : 'km'}</span>
                    </div>
                  </div>

                  {}
                  <div className="flex items-center gap-1 pt-1">
                    {['5', '10', '25', '50', '100', 'all'].map((r, rIdx) => (
                      <button
                        key={`bulletin-filter-rad-${r}-${rIdx}`}
                        type="button"
                        onClick={() => {
                          setSelectedRadius(r);
                          secureStorage.set('perplexta_user_radius', r);
                        }}
                        className={`flex-1 py-1 rounded-[var(--radius-sm)] text-[10px] font-extrabold transition-theme border ${
                          selectedRadius === r
                            ? 'bg-accent text-[var(--text-primary)] border-accent shadow-2xs'
                            : 'bg-[var(--surface-card)] text-[var(--text-secondary)] border-[var(--border-default)] hover:border-accent/50'
                        }`}
                      >
                        {r === 'all' ? (isRtl ? 'الكل' : 'All') : `${r} ${isRtl ? 'كم' : 'km'}`}
                      </button>
                    ))}
                  </div>

                  {}
                  <div className="text-[10px] font-bold text-accent bg-accent/10 px-2.5 py-1.5 rounded-[var(--radius-md)] border border-accent/20 flex items-center gap-1.5">
                    <Radio size={12} className="text-accent animate-pulse shrink-0" />
                    <span>
                      {isRtl
                        ? `تغطية الإعلانات نشطة في نطاق ${selectedRadius === 'all' ? 'جميع المناطق بلا قيود' : `${selectedRadius} كم حول ${selectedCity === 'all' ? 'جميع المدن' : selectedCity}`}`
                        : `Active feed filtering for ${selectedRadius === 'all' ? 'all locations' : `${selectedRadius} km around ${selectedCity}`}`}
                    </span>
                  </div>
                </div>
              </div>

              {}
              <button
                type="button"
                onClick={() => setIsLocationFlyoutOpen(false)}
                className="w-full py-2.5 rounded-[var(--radius-md)] bg-accent hover:bg-accent text-[var(--text-primary)] font-extrabold text-xs shadow-md shadow-none active:scale-95 transition-theme flex items-center justify-center gap-1.5"
              >
                <Check size={15} />
                <span>{isRtl ? 'تأكيد وتطبيق التغطية' : 'Apply Proximity'}</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {}
      {createPortal(
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 15 }}
              onClick={() => {
                const container = document.querySelector('.main-scroll-container');
                if (container) {
                  container.scrollTo({ top: 0, behavior: 'smooth' });
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
                document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
                document.body.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hidden md:flex fixed bottom-8 end-6 z-40 min-h-[44px] h-11 px-4 rounded-[var(--comp-button-radius,6px)] bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)] text-[var(--text-primary)] border border-[var(--border-main)] hover:border-accent shadow-xl transition-all items-center gap-2 text-xs font-bold cursor-pointer active:scale-98 backdrop-blur-md"
              title={isRtl ? 'العودة لأعلى الصفحة' : 'Scroll to top'}
              aria-label={isRtl ? 'العودة لأعلى الصفحة' : 'Scroll to top'}
            >
              <ArrowUp size={16} className="text-accent" />
              <span>{isRtl ? 'أعلى الصفحة' : 'Top'}</span>
            </motion.button>
          )}
        </AnimatePresence>,
        document.body
      )}

      {}
      {}
      {}
      {}
      <nav
        dir={isRtl ? 'rtl' : 'ltr'}
        className="lg:hidden fixed bottom-0 inset-x-0 z-[150] w-full bg-[var(--surface-page)]/95 backdrop-blur-md border-t border-[var(--border-default)] transition-theme shadow-xs pb-[env(safe-area-inset-bottom,0px)]"
      >
        <div className="w-full max-w-sm mx-auto h-[48px] px-5 flex items-center justify-between">
          {/* Feed */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setSelectedPageDetail(null);
              setActiveTab('board');
              setIsMobileSearchOpen(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`group w-8 h-8 rounded-shape-sm border transition-all duration-150 active:scale-95 cursor-pointer shadow-2xs relative touch-manipulation select-none shrink-0 flex items-center justify-center ${
              activeTab === 'board' && !selectedPageDetail && !isMobileSearchOpen
                ? 'bg-[var(--surface-card)] text-[var(--accent)] border-[var(--border-accent)] font-bold shadow-2xs'
                : 'bg-transparent border-[var(--border-default)] hover:border-[var(--border-accent)] hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title={isRtl ? 'الرئيسية' : 'Feed'}
            aria-label={isRtl ? 'الرئيسية' : 'Feed'}
          >
            <Megaphone size={14} className={activeTab === 'board' && !selectedPageDetail && !isMobileSearchOpen ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors duration-150'} />
          </button>

          {/* Search */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setIsMobileSearchOpen(prev => !prev);
              if (!isMobileSearchOpen) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className={`group w-8 h-8 rounded-shape-sm border transition-all duration-150 active:scale-95 cursor-pointer shadow-2xs relative touch-manipulation select-none shrink-0 flex items-center justify-center ${
              isMobileSearchOpen
                ? 'bg-[var(--surface-card)] text-[var(--accent)] border-[var(--border-accent)] font-bold shadow-2xs'
                : 'bg-transparent border-[var(--border-default)] hover:border-[var(--border-accent)] hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title={isRtl ? 'البحث' : 'Search'}
            aria-label={isRtl ? 'البحث' : 'Search'}
          >
            <Search size={14} className={isMobileSearchOpen ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors duration-150'} />
          </button>

          {/* Create Reel */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('medium');
              if (!token) {
                setIsAuthModalOpen(true);
                return;
              }
              openReelUploadModal();
            }}
            className="group w-8 h-8 rounded-shape-sm border border-[var(--border-default)] hover:border-[var(--border-accent)] bg-transparent hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer shadow-2xs touch-manipulation select-none shrink-0"
            title={isRtl ? 'إنشاء ريلز جديد' : 'Create Reel'}
            aria-label={isRtl ? 'إنشاء ريلز جديد' : 'Create Reel'}
          >
            <Clapperboard size={14} className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors duration-150" />
          </button>

          {/* Inquiries */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              if (!token) {
                setIsAuthModalOpen(true);
                return;
              }
              setSelectedPageDetail(null);
              setActiveTab('inquiries');
              setIsMobileSearchOpen(false);
            }}
            className={`group w-8 h-8 rounded-shape-sm border transition-all duration-150 active:scale-95 cursor-pointer shadow-2xs relative touch-manipulation select-none shrink-0 flex items-center justify-center ${
              activeTab === 'inquiries' && !selectedPageDetail
                ? 'bg-[var(--surface-card)] text-[var(--accent)] border-[var(--border-accent)] font-bold shadow-2xs'
                : 'bg-transparent border-[var(--border-default)] hover:border-[var(--border-accent)] hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title={isRtl ? 'سجل المحادثات' : 'Chats / Inquiries'}
            aria-label={isRtl ? 'سجل المحادثات' : 'Chats / Inquiries'}
          >
            <MessageSquareText size={14} className={activeTab === 'inquiries' && !selectedPageDetail ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors duration-150'} />
            {inquiriesList.length > 0 && (
              <span className="absolute -top-1 -end-1 w-3.5 h-3.5 rounded-shape-full bg-red-500 text-white text-[8px] font-black flex items-center justify-center ring-1 ring-[var(--surface-page)]">
                {inquiriesList.length > 9 ? '9+' : inquiriesList.length}
              </span>
            )}
          </button>

          {/* Menu */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('medium');
              setIsMobileSidebarOpen(true);
            }}
            className="group w-8 h-8 rounded-shape-sm border border-[var(--border-default)] hover:border-[var(--border-accent)] bg-transparent hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer shadow-2xs touch-manipulation select-none shrink-0"
            title={isRtl ? 'القائمة' : 'Menu'}
            aria-label={isRtl ? 'القائمة' : 'Menu'}
          >
            <Menu size={14} className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors duration-150" />
          </button>
        </div>
      </nav>



      {}
      <StoryUploadModal
        isOpen={isStoryModalOpen}
        onClose={() => setIsStoryModalOpen(false)}
        isRtl={isRtl}
        token={token}
        user={user}
        userPages={myPagesList}
        initialMode={storyUploadMode}
        onStoryCreated={(newStory) => {
          fetchStories();
        }}
      />

      <StoryViewerModal
        isOpen={isStoryViewerOpen}
        onClose={() => {
          setIsStoryViewerOpen(false);
          setPreviewingVideoStoryId(null);
        }}
        stories={orderedStories}
        initialStoryIndex={selectedStoryIndex}
        currentUser={user}
        isRtl={isRtl}
        onStoryViewed={handleStoryViewed}
        onStoryDeleted={handleStoryDeleted}
      />

      {}
      <VideoTrimmerModal
        isOpen={isTrimmerModalOpen}
        onClose={() => setIsTrimmerModalOpen(false)}
        videoUrl={trimmerVideoUrl}
        isRtl={isRtl}
        onTrimComplete={(trimmed) => {
          setAdFormData(prev => ({
            ...prev,
            video_url: trimmed.videoUrl,
            ad_format: trimmed.adFormat as any
          }));
          toast.success(isRtl ? 'تم تطبيق إعدادات وقص الفيديو بنجاح!' : 'Video trimming & format settings applied successfully!');
        }}
      />

      {}
      <MediaManagerModal
        isOpen={isMediaManagerOpen}
        onClose={() => setIsMediaManagerOpen(false)}
        mediaItems={adFormData.media_gallery || []}
        onChangeMediaItems={(updatedMedia) => {
          setAdFormData(prev => {
            const allImages = updatedMedia.filter(m => m.type === 'image').map(m => m.url);
            const firstVideo = updatedMedia.find(m => m.type === 'video');
            return {
              ...prev,
              media_gallery: updatedMedia,
              image_url: allImages.join(','),
              video_url: firstVideo ? firstVideo.url : ''
            };
          });
        }}
        onAddMoreFiles={handleMixedMediaUpload}
        isRtl={isRtl}
      />

      {}
      <MediaLightboxModal
        isOpen={lightboxState.isOpen}
        onClose={() => {
          setLightboxState(prev => ({ ...prev, isOpen: false }));
          updateUrlWithPost(null);
        }}
        items={lightboxState.items}
        initialIndex={lightboxState.initialIndex}
        onToggleCommentLike={handleToggleCommentLike}
        isRtl={isRtl}
        postTitle={lightboxState.postTitle}
        authorName={lightboxState.authorName}
        ad={lightboxState.ad}
        comments={lightboxState.ad ? commentsMap[lightboxState.ad.id] : undefined}
        loadingComments={lightboxState.ad ? loadingCommentsAdId === lightboxState.ad.id : false}
        onToggleLike={handleToggleLike}
        onAddComment={handleAddComment}
        onShare={handleShareAd}
        onBoostAd={handleOpenBoostModal}
        onEditAd={handleEditAd}
        onViewPost={handleNavigateToPost}
        user={user}
        token={token}
      />

      {}
      <AnimatePresence>
        {activeReelModalId !== null && (
          <ReelsFeed
            ads={combinedReelsAds.length > 0 ? combinedReelsAds : ads}
            initialAdId={activeReelModalId}
            isRtl={isRtl}
            token={token}
            user={user}
            commentsMap={commentsMap}
            onToggleLike={handleToggleLike}
            onToggleSave={handleToggleSave}
            onAddComment={handleAddComment}
            onToggleCommentLike={handleToggleCommentLike}
            onMessageAdvertiser={handleMessageAdvertiser}
            onShare={handleShareAd}
            onBoostAd={handleOpenBoostModal}
            onDeleteReel={(id) => {
              const ad = ads.find(a => a.id === id);
              if (ad) handleDeleteAd(ad);
            }}
            onEditReel={handleEditAd}
            onOpenPageDetail={handleOpenPageDetail}
            onOpenUploadReels={() => {
              stopAllMedia('reel_upload_preview');
              openReelUploadModal();
            }}
            onUploadReelClick={() => {
              stopAllMedia('reel_upload_preview');
              openReelUploadModal();
            }}
            onClose={() => {
              stopAllMedia();
              setActiveReelModalId(null);
            }}
            onViewPost={handleNavigateToPost}
            onArchiveAd={(archivedAd) => {
              setAds(prev => prev.filter(a => a.id !== archivedAd.id));
              setSavedAds(prev => prev.filter(a => a.id !== archivedAd.id));
            }}
            onTrashAd={(trashedAd) => {
              setAds(prev => prev.filter(a => a.id !== trashedAd.id));
              setSavedAds(prev => prev.filter(a => a.id !== trashedAd.id));
            }}
            onUpdateAd={(updatedAd) => {
              setAds(prev => prev.map(a => a.id === updatedAd.id ? { ...a, ...updatedAd } : a));
              setSavedAds(prev => prev.map(a => a.id === updatedAd.id ? { ...a, ...updatedAd } : a));
            }}
            onReportAd={handleReportAd}
            isLoading={loading}
          />
        )}
      </AnimatePresence>

      {}
      <AnimatePresence>
        {previewingVideoStoryId && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center p-6"
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div className="relative w-full max-w-[280px] aspect-[9/16] rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white/20 z-10 bg-black">
              {getMediaUrl(stories.find(s => s.id === previewingVideoStoryId)?.video_url) ? (
                <video
                  src={getMediaUrl(stories.find(s => s.id === previewingVideoStoryId)?.video_url)}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                <img
                  src={getMediaUrl(stories.find(s => s.id === previewingVideoStoryId)?.image_url)}
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute top-4 start-4 flex items-center gap-2 bg-black/20 backdrop-blur-md p-1.5 pr-3 rounded-shape-xs">
                <BulletinAvatar
                  src={stories.find(s => s.id === previewingVideoStoryId)?.author_avatar}
                  alt={stories.find(s => s.id === previewingVideoStoryId)?.author_name}
                  size="sm"
                />
                <div className="flex flex-col">
                  <span className="text-[var(--text-primary)] text-[11px] font-bold drop-shadow-md leading-none">
                    {stories.find(s => s.id === previewingVideoStoryId)?.author_name}
                  </span>
                  <span className="text-[var(--text-primary)]/60 text-[9px] drop-shadow-md">
                    {isRtl ? 'معاينة سريعة' : 'Quick Preview'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {}
      {}
      {}
      <AnimatePresence>
        {isProfileEditModalOpen && user && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-xl rounded-[var(--radius-md)] bg-[var(--surface-card)] border border-[var(--border-default)] p-6 shadow-2xl space-y-4 my-8 text-[var(--text-primary)] transform-gpu no-flicker"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                <div className="flex items-center gap-2">
                  <Settings size={20} className="text-accent" />
                  <h3 className="text-sm font-extrabold">{isRtl ? 'إعدادات الحساب وتوثيق الهوية' : 'Account Settings & KYC'}</h3>
                </div>
                <button onClick={() => setIsProfileEditModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <X size={18} />
                </button>
              </div>

              {}
              <div className="flex items-center gap-2 border-b border-[var(--border-default)] pb-2">
                <button
                  type="button"
                  onClick={() => setKycTab('info')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-[var(--radius-sm)] transition-theme ${
                    kycTab === 'info'
                      ? 'bg-accent/10 text-accent'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--surface-inset)]'
                  }`}
                >
                  {isRtl ? 'المعلومات الشخصية' : 'Personal Profile'}
                </button>
                <button
                  type="button"
                  onClick={() => setKycTab('kyc')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-[var(--radius-sm)] transition-theme flex items-center gap-1 ${
                    kycTab === 'kyc'
                      ? 'bg-accent/10 text-accent'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--surface-inset)]'
                  }`}
                >
                  <ShieldCheck size={14} />
                  <span>{isRtl ? 'طلب شارة التوثيق (KYC)' : 'Get Verified (KYC)'}</span>
                </button>
              </div>

              {kycTab === 'info' ? (
                <form onSubmit={handleSaveProfile} className="space-y-5 max-h-[75vh] overflow-y-auto pe-1">
                  {/* Banner & Avatar Upload Box with Smart Crop */}
                  <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-inset)] p-3.5 space-y-3">
                    <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2">
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-accent">
                        <Sparkles size={15} />
                        <span>{isRtl ? 'صورة البروفايل والغلاف مع القص والضغط الذكي' : 'Profile Avatar & Cover Image'}</span>
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] font-bold">
                        {isRtl ? 'يتم القص التلقائي مجاناً لحجم خفيف' : 'Auto Smart Crop Enabled'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <ImageUploadDropzone
                        label={isRtl ? 'الصورة الشخصية (Avatar):' : 'Avatar (Profile Photo):'}
                        value={profileFormData.avatar}
                        onChange={(url) => setProfileFormData(prev => ({ ...prev, avatar: url }))}
                        aspectRatio={1}
                        targetWidth={400}
                        targetHeight={400}
                        placeholderText={isRtl ? 'رفع صورة شخصية (400×400 - 1:1)' : 'Upload Avatar (400×400)'}
                        isRtl={isRtl}
                      />

                      <ImageUploadDropzone
                        label={isRtl ? 'غلاف الحائط (Cover Banner):' : 'Cover Banner:'}
                        value={profileFormData.cover_image}
                        onChange={(url) => setProfileFormData(prev => ({ ...prev, cover_image: url }))}
                        aspectRatio={3}
                        targetWidth={1200}
                        targetHeight={400}
                        placeholderText={isRtl ? 'رفع غلاف الحائط (1200×400 - 3:1)' : 'Upload Cover Banner (1200×400)'}
                        isRtl={isRtl}
                      />
                    </div>
                  </div>

                  {/* Section 1: Basic Professional Info */}
                  <div className="space-y-3 bg-[var(--surface-inset)] p-3.5 rounded-xl border border-[var(--border-default)]">
                    <h4 className="text-xs font-black text-accent flex items-center gap-1.5 border-b border-[var(--border-default)] pb-2">
                      <User size={14} />
                      <span>{isRtl ? 'المعلومات الشخصية والمهنية' : 'Personal & Professional Info'}</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold mb-1 text-[var(--text-secondary)]">{isRtl ? 'الاسم المعروض:' : 'Display Name:'}</label>
                        <input
                          type="text"
                          required
                          value={profileFormData.name}
                          onChange={(e) => setProfileFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--surface-card)] border border-[var(--border-default)] focus:border-accent outline-none"
                          placeholder={isRtl ? 'اسمك الكامل' : 'Your full name'}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold mb-1 text-[var(--text-secondary)]">{isRtl ? 'المهنة / المسمى الوظيفي:' : 'Occupation / Title:'}</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={profileFormData.occupation}
                            onChange={(e) => setProfileFormData(prev => ({ ...prev, occupation: e.target.value }))}
                            className="w-full px-3 py-2 ps-8 text-xs rounded-lg bg-[var(--surface-card)] border border-[var(--border-default)] focus:border-accent outline-none"
                            placeholder={isRtl ? 'مثال: مهندس برمجيات، تاجر معتمد، رائد أعمال' : 'e.g., Software Engineer, Merchant'}
                          />
                          <Briefcase size={14} className="absolute start-2.5 top-2.5 text-[var(--text-muted)]" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold mb-1 text-[var(--text-secondary)]">{isRtl ? 'البريد الإلكتروني:' : 'Email Address:'}</label>
                        <div className="relative">
                          <input
                            type="email"
                            value={profileFormData.email}
                            onChange={(e) => setProfileFormData(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full px-3 py-2 ps-8 text-xs rounded-lg bg-[var(--surface-card)] border border-[var(--border-default)] focus:border-accent outline-none"
                            placeholder="name@example.com"
                          />
                          <AtSign size={14} className="absolute start-2.5 top-2.5 text-[var(--text-muted)]" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold mb-1 text-[var(--text-secondary)]">{isRtl ? 'المدينة / الموقع:' : 'City / Location:'}</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={profileFormData.location}
                            onChange={(e) => setProfileFormData(prev => ({ ...prev, location: e.target.value }))}
                            className="w-full px-3 py-2 ps-8 text-xs rounded-lg bg-[var(--surface-card)] border border-[var(--border-default)] focus:border-accent outline-none"
                            placeholder={isRtl ? 'القدس الشريف، غزة، رام الله...' : 'City or region'}
                          />
                          <MapPin size={14} className="absolute start-2.5 top-2.5 text-[var(--text-muted)]" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1 text-[var(--text-secondary)]">{isRtl ? 'النبذة التعريفية (Bio):' : 'Bio / Overview:'}</label>
                      <textarea
                        rows={2}
                        value={profileFormData.bio}
                        onChange={(e) => setProfileFormData(prev => ({ ...prev, bio: e.target.value, custom_instructions: e.target.value }))}
                        className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--surface-card)] border border-[var(--border-default)] focus:border-accent outline-none"
                        placeholder={isRtl ? 'اكتب نبذة تعريفية قصيرة تظهر على حائطك الشخصي...' : 'Brief description about yourself...'}
                      />
                    </div>
                  </div>

                  {/* Section 2: Website & Custom Domain */}
                  <div className="space-y-3 bg-[var(--surface-inset)] p-3.5 rounded-xl border border-[var(--border-default)]">
                    <h4 className="text-xs font-black text-accent flex items-center gap-1.5 border-b border-[var(--border-default)] pb-2">
                      <Globe size={14} />
                      <span>{isRtl ? 'الموقع الإلكتروني والدومين الخاص' : 'Website & Custom Domain'}</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold mb-1 text-[var(--text-secondary)]">{isRtl ? 'رابط الموقع الشخصي:' : 'Website URL:'}</label>
                        <div className="relative">
                          <input
                            type="url"
                            value={profileFormData.website_url}
                            onChange={(e) => setProfileFormData(prev => ({ ...prev, website_url: e.target.value }))}
                            className="w-full px-3 py-2 ps-8 text-xs rounded-lg bg-[var(--surface-card)] border border-[var(--border-default)] focus:border-accent outline-none"
                            placeholder="https://mywebsite.com"
                          />
                          <Link size={14} className="absolute start-2.5 top-2.5 text-[var(--text-muted)]" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold mb-1 text-[var(--text-secondary)]">{isRtl ? 'اسم الدومين الخاص:' : 'Custom Domain Name:'}</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={profileFormData.custom_domain}
                            onChange={(e) => setProfileFormData(prev => ({ ...prev, custom_domain: e.target.value }))}
                            className="w-full px-3 py-2 ps-8 text-xs rounded-lg bg-[var(--surface-card)] border border-[var(--border-default)] focus:border-accent outline-none"
                            placeholder="username.com"
                          />
                          <Globe size={14} className="absolute start-2.5 top-2.5 text-[var(--text-muted)]" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={18} className="text-emerald-500 shrink-0" />
                        <div>
                          <p className="font-bold text-emerald-600 dark:text-emerald-400">{isRtl ? 'علامة توثيق النطاق والموقع' : 'Verified Domain Badge'}</p>
                          <p className="text-[10px] text-[var(--text-muted)]">{isRtl ? 'إظهار شارة النطاق الموثق على حائطك الشخصي' : 'Show verified domain badge on profile'}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setProfileFormData(prev => ({ ...prev, is_domain_verified: !prev.is_domain_verified }))}
                        className={`px-3 py-1 rounded-full font-bold text-[11px] transition-colors ${
                          profileFormData.is_domain_verified
                            ? 'bg-emerald-500 text-white'
                            : 'bg-[var(--surface-card)] text-[var(--text-muted)] border border-[var(--border-default)]'
                        }`}
                      >
                        {profileFormData.is_domain_verified ? (isRtl ? '✓ موثق' : '✓ Verified') : (isRtl ? 'تفعيل' : 'Enable')}
                      </button>
                    </div>
                  </div>

                  {/* Section 3: Social Media Links */}
                  <div className="space-y-3 bg-[var(--surface-inset)] p-3.5 rounded-xl border border-[var(--border-default)]">
                    <h4 className="text-xs font-black text-accent flex items-center gap-1.5 border-b border-[var(--border-default)] pb-2">
                      <Share2 size={14} />
                      <span>{isRtl ? 'حسابات التواصل الاجتماعي الإضافية' : 'Social Media Accounts'}</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold mb-1 text-[var(--text-muted)]">Facebook</label>
                        <input
                          type="text"
                          value={profileFormData.social_links.facebook || ''}
                          onChange={(e) => setProfileFormData(prev => ({
                            ...prev,
                            social_links: { ...prev.social_links, facebook: e.target.value }
                          }))}
                          className="w-full px-2.5 py-1.5 text-xs rounded-md bg-[var(--surface-card)] border border-[var(--border-default)]"
                          placeholder="https://facebook.com/username"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold mb-1 text-[var(--text-muted)]">Instagram</label>
                        <input
                          type="text"
                          value={profileFormData.social_links.instagram || ''}
                          onChange={(e) => setProfileFormData(prev => ({
                            ...prev,
                            social_links: { ...prev.social_links, instagram: e.target.value }
                          }))}
                          className="w-full px-2.5 py-1.5 text-xs rounded-md bg-[var(--surface-card)] border border-[var(--border-default)]"
                          placeholder="https://instagram.com/username"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold mb-1 text-[var(--text-muted)]">LinkedIn</label>
                        <input
                          type="text"
                          value={profileFormData.social_links.linkedin || ''}
                          onChange={(e) => setProfileFormData(prev => ({
                            ...prev,
                            social_links: { ...prev.social_links, linkedin: e.target.value }
                          }))}
                          className="w-full px-2.5 py-1.5 text-xs rounded-md bg-[var(--surface-card)] border border-[var(--border-default)]"
                          placeholder="https://linkedin.com/in/username"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold mb-1 text-[var(--text-muted)]">X / Twitter</label>
                        <input
                          type="text"
                          value={profileFormData.social_links.twitter || ''}
                          onChange={(e) => setProfileFormData(prev => ({
                            ...prev,
                            social_links: { ...prev.social_links, twitter: e.target.value }
                          }))}
                          className="w-full px-2.5 py-1.5 text-xs rounded-md bg-[var(--surface-card)] border border-[var(--border-default)]"
                          placeholder="https://x.com/username"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold mb-1 text-[var(--text-muted)]">WhatsApp</label>
                        <input
                          type="text"
                          value={profileFormData.social_links.whatsapp || ''}
                          onChange={(e) => setProfileFormData(prev => ({
                            ...prev,
                            social_links: { ...prev.social_links, whatsapp: e.target.value }
                          }))}
                          className="w-full px-2.5 py-1.5 text-xs rounded-md bg-[var(--surface-card)] border border-[var(--border-default)]"
                          placeholder="+970599000000"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold mb-1 text-[var(--text-muted)]">YouTube / GitHub</label>
                        <input
                          type="text"
                          value={profileFormData.social_links.youtube || profileFormData.social_links.github || ''}
                          onChange={(e) => setProfileFormData(prev => ({
                            ...prev,
                            social_links: { ...prev.social_links, youtube: e.target.value, github: e.target.value }
                          }))}
                          className="w-full px-2.5 py-1.5 text-xs rounded-md bg-[var(--surface-card)] border border-[var(--border-default)]"
                          placeholder="https://youtube.com/@channel or github"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-end gap-2 border-t border-[var(--border-default)] pt-3 sticky bottom-0 bg-[var(--surface-card)] p-2">
                    <button
                      type="button"
                      onClick={() => setIsProfileEditModalOpen(false)}
                      className="px-4 py-2 rounded-[var(--radius-md)] border border-[var(--border-default)] text-xs font-bold hover:bg-[var(--surface-subtle)]"
                    >
                      {isRtl ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingProfile}
                      className="px-5 py-2 rounded-[var(--radius-md)] bg-accent text-[var(--text-primary)] text-xs font-bold shadow-md hover:opacity-90 transition-opacity"
                    >
                      {isSubmittingProfile ? (isRtl ? 'جاري حفظ التغييرات...' : 'Saving...') : (isRtl ? 'حفظ إعدادات الملف الشخصي ✨' : 'Save Profile Settings')}
                    </button>
                  </div>
                </form>
              ) : user && (
                <div className="space-y-4">
                  {user.kyc_status === 'verified' && (
                    <div className="p-4 rounded-shape-md bg-accent/10 border border-accent/20 text-center space-y-2">
                      <div className="flex justify-center">
                        <ShieldCheck size={40} className="text-accent" />
                      </div>
                      <h4 className="text-sm font-extrabold text-accent">{isRtl ? 'حسابك موثق بالشارة الزرقاء' : 'Account Verified'}</h4>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {isRtl ? 'لقد قمنا بالتحقق من هويتك بنجاح. تتمتع الآن بثقة كاملة في جميع صفقاتك ونشراتك.' : 'Your identity is fully verified.'}
                      </p>
                    </div>
                  )}

                  {user.kyc_status === 'pending' && (
                    <div className="p-4 rounded-[var(--radius-md)] bg-yellow-500/10 border border-yellow-500/20 text-center space-y-2">
                      <div className="flex justify-center">
                        <div className="w-10 h-10 rounded-shape-full border-4 border-yellow-500 border-t-transparent animate-spin" />
                      </div>
                      <h4 className="text-sm font-extrabold text-yellow-500">{isRtl ? 'طلب التوثيق قيد المراجعة' : 'Verification Pending'}</h4>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {isRtl ? 'طلبك الآن قيد التدقيق لدى الإدارة. سيتم إخطارك وتفعيل الشارة الزرقاء فوراً بعد التحقق.' : 'Your request is under review.'}
                      </p>
                    </div>
                  )}

                  {(user.kyc_status === 'none' || user.kyc_status === 'rejected' || !user.kyc_status) && (
                    <form onSubmit={handleKycSubmit} className="space-y-4">
                      {user.kyc_status === 'rejected' && (
                        <div className="p-3 rounded-[var(--radius-md)] bg-red-500/10 border border-red-500/20 text-xs text-red-500">
                          {isRtl ? 'تم رفض طلب التوثيق السابق. يرجى تقديم الاسم الحقيقي ومستند واضح للتحقق.' : 'Previous verification request was rejected. Please submit valid documents.'}
                        </div>
                      )}

                      <div className="p-3.5 rounded-[var(--radius-md)] bg-accent/5 border border-accent/10 space-y-1">
                        <h4 className="text-xs font-extrabold text-accent">{isRtl ? 'احصل على الشارة الزرقاء في بيربليكستا بورد 🛡️' : 'Get the Blue Verification Badge on Perplexta Board'}</h4>
                        <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                          {isRtl ? 'توثيق الهوية يضمن للعملاء سلامة الصفقات ويمنح منشوراتك الأولوية التامة في محركات البحث والتوصيات بالمنصة.' : 'Verifying your identity builds trust and boosts search priority.'}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold mb-1">{isRtl ? 'الاسم الكامل القانوني (مطابق للهوية):' : 'Legal Full Name:'}</label>
                          <input
                            type="text"
                            required
                            value={kycFullName}
                            onChange={(e) => setKycFullName(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-[var(--radius-md)] bg-[var(--surface-inset)] border border-[var(--border-default)]"
                            placeholder={isRtl ? 'مثال: محمد أحمد علي' : 'Legal Name'}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold mb-1">{isRtl ? 'رقم الهوية الوطنية / جواز السفر:' : 'ID / Passport Number:'}</label>
                          <input
                            type="text"
                            required
                            value={kycIDNumber}
                            onChange={(e) => setKycIDNumber(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-[var(--radius-md)] bg-[var(--surface-inset)] border border-[var(--border-default)]"
                            placeholder="E.g., 401234567"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold mb-1">{isRtl ? 'صورة الهوية أو مستند رسمي للتوثيق:' : 'Official Identity Document or Selfie with ID:'}</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              required
                              value={kycSelfieUrl}
                              onChange={(e) => setKycSelfieUrl(e.target.value)}
                              className="flex-1 px-3 py-2 text-xs rounded-[var(--radius-md)] bg-[var(--surface-inset)] border border-[var(--border-default)]"
                              placeholder="https://..."
                            />
                            <label className="px-3 py-2 rounded-[var(--radius-md)] bg-accent text-[var(--text-primary)] text-xs font-bold cursor-pointer flex items-center justify-center shrink-0">
                              <Upload size={14} />
                              <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={handleKycSelfieUpload}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 border-t border-[var(--border-default)] pt-3">
                        <button
                          type="button"
                          onClick={() => setIsProfileEditModalOpen(false)}
                          className="px-4 py-2 rounded-[var(--radius-md)] border border-[var(--border-default)] text-xs font-bold"
                        >
                          {isRtl ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmittingProfile}
                          className="px-4 py-2 rounded-[var(--radius-md)] bg-accent text-[var(--text-primary)] text-xs font-bold"
                        >
                          {isSubmittingProfile ? (isRtl ? 'جاري الإرسال...' : 'Submitting...') : (isRtl ? 'إرسال طلب التوثيق' : 'Submit Verification')}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isEditPageModalOpen && editingPageData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-xl rounded-[var(--radius-md)] bg-[var(--surface-card)] border border-[var(--border-default)] p-6 shadow-2xl space-y-4 my-8 text-[var(--text-primary)] transform-gpu no-flicker"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                <div className="flex items-center gap-2">
                  <Building2 size={20} className="text-accent" />
                  <h3 className="text-sm font-extrabold">{isRtl ? 'إدارة وتعديل الصفحة التجارية والمسؤولين' : 'Manage Merchant Page & Admins'}</h3>
                </div>
                <button onClick={() => { setIsEditPageModalOpen(false); setEditingPageData(null); }} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSavePageEdit} className="space-y-4">
                <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1">

                  {}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold mb-1">{isRtl ? 'اسم الشركة / المتجر:' : 'Page Name:'}</label>
                      <input
                        type="text"
                        required
                        value={editPageFormData.name}
                        onChange={(e) => setEditPageFormData({ ...editPageFormData, name: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-[var(--radius-md)] bg-[var(--surface-inset)] border border-[var(--border-default)]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1 text-[var(--text-secondary)]">{isRtl ? 'المدينة:' : 'City:'}</label>
                      <SearchableSelect
                        value={editPageFormData.city}
                        onChange={(val) => setEditPageFormData({ ...editPageFormData, city: val })}
                        options={PALESTINE_CITIES.map((c) => ({
                          value: c,
                          label: c,
                          icon: <MapPin size={13} className="text-accent" />
                        }))}
                        placeholder={isRtl ? 'اختر المدينة' : 'Select City...'}
                        dir={isRtl ? 'rtl' : 'ltr'}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold mb-1">{isRtl ? 'الصنف / الفئة:' : 'Category:'}</label>
                      <input
                        type="text"
                        required
                        value={editPageFormData.category}
                        onChange={(e) => setEditPageFormData({ ...editPageFormData, category: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-[var(--radius-md)] bg-[var(--surface-inset)] border border-[var(--border-default)]"
                        placeholder="E.g., E-Commerce"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1">{isRtl ? 'العنوان الفعلي:' : 'Address:'}</label>
                      <input
                        type="text"
                        value={editPageFormData.address}
                        onChange={(e) => setEditPageFormData({ ...editPageFormData, address: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-[var(--radius-md)] bg-[var(--surface-inset)] border border-[var(--border-default)]"
                        placeholder="E.g., Remal Street"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1">{isRtl ? 'نبذة ووصف الشركة:' : 'Description:'}</label>
                    <textarea
                      rows={2}
                      required
                      value={editPageFormData.description}
                      onChange={(e) => setEditPageFormData({ ...editPageFormData, description: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-[var(--radius-md)] bg-[var(--surface-inset)] border border-[var(--border-default)]"
                    />
                  </div>

                  {}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold mb-1">{isRtl ? 'رقم الواتساب:' : 'WhatsApp:'}</label>
                      <input
                        type="text"
                        value={editPageFormData.whatsapp_number}
                        onChange={(e) => setEditPageFormData({ ...editPageFormData, whatsapp_number: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-[var(--radius-md)] bg-[var(--surface-inset)] border border-[var(--border-default)]"
                        placeholder="970599..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1">{isRtl ? 'الهاتف للتواصل:' : 'Phone:'}</label>
                      <input
                        type="text"
                        value={editPageFormData.phone_number}
                        onChange={(e) => setEditPageFormData({ ...editPageFormData, phone_number: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-[var(--radius-md)] bg-[var(--surface-inset)] border border-[var(--border-default)]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1">{isRtl ? 'الموقع الإلكتروني:' : 'Website URL:'}</label>
                      <input
                        type="text"
                        value={editPageFormData.website_url}
                        onChange={(e) => setEditPageFormData({ ...editPageFormData, website_url: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-[var(--radius-md)] bg-[var(--surface-inset)] border border-[var(--border-default)]"
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  {/* Image Specifications & Upload Section */}
                  <div className="p-3.5 rounded-xl bg-accent/5 border border-accent/20 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-extrabold text-accent">
                      <Sparkles size={16} />
                      <span>{isRtl ? 'قياسات الصور الموصى بها والقص الذكي الخفيف' : 'Recommended Dimensions & Smart Crop'}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-[var(--text-secondary)]">
                      <div className="p-2.5 rounded-lg bg-[var(--surface-card)] border border-[var(--border-default)] space-y-1">
                        <p className="font-bold text-[var(--text-primary)] flex items-center gap-1">
                          <ImageIcon size={13} className="text-accent" />
                          <span>{isRtl ? 'غلاف البانير (Cover Banner)' : 'Cover Banner'}</span>
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)]">
                          {isRtl ? RECOMMENDED_IMAGE_SPECS.cover.labelAr : RECOMMENDED_IMAGE_SPECS.cover.labelEn}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-[var(--surface-card)] border border-[var(--border-default)] space-y-1">
                        <p className="font-bold text-[var(--text-primary)] flex items-center gap-1">
                          <User size={13} className="text-accent" />
                          <span>{isRtl ? 'شعار الصفحة (Avatar Logo)' : 'Avatar Logo'}</span>
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)]">
                          {isRtl ? RECOMMENDED_IMAGE_SPECS.avatar.labelAr : RECOMMENDED_IMAGE_SPECS.avatar.labelEn}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <ImageUploadDropzone
                        label={isRtl ? 'شعار الصفحة (Avatar):' : 'Page Avatar (1:1):'}
                        value={editPageFormData.avatar_url}
                        onChange={(url) => setEditPageFormData({ ...editPageFormData, avatar_url: url })}
                        aspectRatio={1}
                        targetWidth={400}
                        targetHeight={400}
                        placeholderText={isRtl ? 'رفع الشعار المربع (400×400)' : 'Upload Avatar (400×400)'}
                        isRtl={isRtl}
                      />

                      <ImageUploadDropzone
                        label={isRtl ? 'غلاف الصفحة (Cover):' : 'Cover Banner (3:1):'}
                        value={editPageFormData.cover_url}
                        onChange={(url) => setEditPageFormData({ ...editPageFormData, cover_url: url })}
                        aspectRatio={3}
                        targetWidth={1200}
                        targetHeight={400}
                        placeholderText={isRtl ? 'رفع البانير الأفقي (1200×400)' : 'Upload Banner (1200×400)'}
                        isRtl={isRtl}
                      />
                    </div>
                  </div>
                  <div className="border-t border-[var(--border-default)] pt-4 space-y-3">
                    <h4 className="text-xs font-extrabold flex items-center gap-1.5 text-accent">
                      <Users size={16} />
                      <span>{isRtl ? 'إدارة المسؤولين والأدوار' : 'Manage Page Admins/Managers'}</span>
                    </h4>

                    {}
                    {user && (editingPageData.user_id === user.id || editingPageData.owner_id === user.id || user.role === 'admin') ? (
                      <div className="space-y-3">
                        <div className="flex gap-2 items-end">
                          <div className="flex-1">
                            <label className="block text-[10px] font-bold mb-0.5 text-[var(--text-muted)]">{isRtl ? 'البريد الإلكتروني للمسؤول الجديد:' : 'New Manager Email:'}</label>
                            <input
                              type="email"
                              value={newManagerEmail}
                              onChange={(e) => setNewManagerEmail(e.target.value)}
                              className="w-full px-3 py-2 text-xs rounded-[var(--radius-md)] bg-[var(--surface-inset)] border border-[var(--border-default)]"
                              placeholder="manager@example.com"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold mb-0.5 text-[var(--text-muted)]">{isRtl ? 'الصلاحية:' : 'Permission Role:'}</label>
                            <SearchableSelect
                              value={newManagerRole}
                              onChange={(val) => setNewManagerRole(val as 'full' | 'limited')}
                              options={[
                                { value: 'limited', label: isRtl ? 'مدير محدود المهام' : 'Limited Admin' },
                                { value: 'full', label: isRtl ? 'مدير كامل الصلاحيات' : 'Full Admin' }
                              ]}
                              searchable={false}
                              dir={isRtl ? 'rtl' : 'ltr'}
                              className="w-full min-w-[140px]"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (!newManagerEmail.trim()) {
                                toast.error(isRtl ? 'يرجى إدخال البريد الإلكتروني للمسؤول' : 'Email is required');
                                return;
                              }
                              const emailClean = newManagerEmail.trim().toLowerCase();
                              if (editPageManagers.some(m => m.email === emailClean)) {
                                toast.error(isRtl ? 'هذا البريد الإلكتروني مضاف بالفعل كمسؤول' : 'Manager already exists');
                                return;
                              }
                              const newMgr = {
                                email: emailClean,
                                name: emailClean.split('@')[0],
                                role: newManagerRole
                              };
                              setEditPageManagers([...editPageManagers, newMgr]);
                              setNewManagerEmail('');
                              toast.success(isRtl ? 'تمت إضافة المسؤول للقايمة مؤقتاً! يرجى حفظ الصفحة لتأكيد الحفظ بالخادم.' : 'Manager added to list! Save page to persist.');
                            }}
                            className="px-3 py-2 bg-accent text-[var(--text-primary)] text-xs font-bold rounded-[var(--radius-md)] h-9 flex items-center justify-center shrink-0 cursor-pointer"
                          >
                            <span>{isRtl ? 'إضافة' : 'Add'}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] text-center text-xs text-[var(--text-muted)]">
                        {isRtl ? 'صلاحية إضافة وإزالة المسؤولين مقتصرة على مالك الصفحة الأساسي.' : 'Only page owner can manage managers.'}
                      </div>
                    )}

                    {}
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-[var(--text-muted)]">{isRtl ? 'قائمة المسؤولين الحاليين:' : 'Current Managers List:'}</p>
                      {editPageManagers.length === 0 ? (
                        <p className="text-[10px] text-[var(--text-muted)] italic">{isRtl ? 'لا يوجد مسؤولين إضافيين لهذه الصفحة حالياً.' : 'No additional managers.'}</p>
                      ) : (
                        <div className="grid grid-cols-1 gap-1.5">
                          {editPageManagers.map((mgr, mIdx) => (
                            <div key={`edit-mgr-${mIdx}`} className="p-2.5 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-inset)] flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <span className="text-xs font-extrabold truncate block">{mgr.name || mgr.email}</span>
                                <span className="text-[10px] text-[var(--text-muted)] truncate block">{mgr.email}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                  mgr.role === 'full'
                                    ? 'bg-accent/10 text-accent border border-accent/20'
                                    : 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                                }`}>
                                  {mgr.role === 'full'
                                    ? (isRtl ? 'مدير كامل' : 'Full Admin')
                                    : (isRtl ? 'مدير محدود' : 'Limited Admin')}
                                </span>
                                {user && (editingPageData.user_id === user.id || editingPageData.owner_id === user.id || user.role === 'admin') && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditPageManagers(editPageManagers.filter((_, idx) => idx !== mIdx));
                                      toast.info(isRtl ? 'تم حذف المسؤول من القائمة! يرجى حفظ الصفحة لتأكيد التغيير.' : 'Manager removed! Save page to persist.');
                                    }}
                                    className="p-1 rounded-md text-red-500 hover:bg-red-500/10 transition-theme"
                                    title={isRtl ? 'إزالة المسؤول' : 'Remove Manager'}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                <div className="flex items-center justify-end gap-2 border-t border-[var(--border-default)] pt-3">
                  <button
                    type="button"
                    onClick={() => { setIsEditPageModalOpen(false); setEditingPageData(null); }}
                    className="px-4 py-2 rounded-[var(--radius-md)] border border-[var(--border-default)] text-xs font-bold"
                  >
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPageEdit}
                    className="px-4 py-2 rounded-[var(--radius-md)] bg-accent text-[var(--text-primary)] text-xs font-bold"
                  >
                    {isSubmittingPageEdit ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'حفظ التعديلات' : 'Save Changes')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default BulletinBoardPage;
