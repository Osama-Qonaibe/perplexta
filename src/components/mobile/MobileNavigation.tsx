import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import {
  MessageSquare,
  Flame,
  History,
  Cpu,
  User,
  X,
  Compass,
  CreditCard,
  Sliders,
  Plus,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Moon,
  Sun,
  Globe,
  Pin,
  Wallet,
  Bookmark,
  Gift,
  LogOut,
  MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { useAppContext } from '../../context/AppContext';
import { isPathBlocked } from '../../utils/sectionVisibility';
import { triggerHaptic } from '../../utils/haptics';
import { resolveImageUrl } from '../../utils/imageResolver';
import { NotificationIconRenderer } from '../../utils/imageProcessor';
import { useDeviceCapabilities } from '../../utils/deviceCapabilities';
import { useViewTransitionNavigate } from '../../utils/viewTransition';

const triggerMobileHistoryDrawer = () => {
  window.dispatchEvent(new Event('open-mobile-chat-history'));
};

interface ChatThreadSummary {
  id: string | number;
  title: string;
  updated_at?: string;
  created_at?: string;
  is_pinned?: boolean;
}

export const MobileNavigation: React.FC = () => {
  const {
    language,
    user,
    token,
    logout,
    theme,
    setTheme,
    setLanguage,
    siteSettings,
    setIsAuthModalOpen,
    isSidebarOpen,
    setIsSidebarOpen,
    t
  } = useAppContext();

  const { shouldDisableHeavyBlurs } = useDeviceCapabilities();
  const [isAccountSheetOpen, setIsAccountSheetOpen] = useState(false);
  const [chats, setChats] = useState<ChatThreadSummary[]>([]);
  const [isPinnedExpanded, setIsPinnedExpanded] = useState(true);
  const [isRecentsExpanded, setIsRecentsExpanded] = useState(true);

  const location = useLocation();
  const navigate = useViewTransitionNavigate();
  const currentPath = location.pathname;
  const isRtl = language === 'ar';

  const activeChatId = currentPath.startsWith('/chat/') ? currentPath.split('/chat/')[1] : null;

  const fetchRecentChats = useCallback(async () => {
    if (!token) {
      setChats([]);
      return;
    }
    try {
      const res = await fetch('/api/chats', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setChats(data);
        }
      }
    } catch {
      // Silent fallback on transient network issues
    }
  }, [token]);

  useEffect(() => {
    if (isSidebarOpen && token) {
      fetchRecentChats();
    }
  }, [isSidebarOpen, token, fetchRecentChats]);

  useEffect(() => {
    const handleRefresh = () => {
      if (token) fetchRecentChats();
    };
    const handleOpenSidebar = () => setIsSidebarOpen(true);

    window.addEventListener('chat-created', handleRefresh);
    window.addEventListener('chat-updated', handleRefresh);
    window.addEventListener('clear-chat', handleRefresh);
    window.addEventListener('open-mobile-sidebar', handleOpenSidebar);

    return () => {
      window.removeEventListener('chat-created', handleRefresh);
      window.removeEventListener('chat-updated', handleRefresh);
      window.removeEventListener('clear-chat', handleRefresh);
      window.removeEventListener('open-mobile-sidebar', handleOpenSidebar);
    };
  }, [token, fetchRecentChats, setIsSidebarOpen]);

  // Automatically close drawer when route changes
  useEffect(() => {
    setIsSidebarOpen(false);
    setIsAccountSheetOpen(false);
  }, [location.pathname, location.search, setIsSidebarOpen]);

  // Prevent background scrolling when drawer or account sheet is open
  useEffect(() => {
    if (isSidebarOpen || isAccountSheetOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen, isAccountSheetOpen]);

  // Light Touch Swipe-to-Dismiss Handler
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 50;
    const velocityThreshold = 250;

    if (isRtl) {
      if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
        triggerHaptic('light');
        setIsSidebarOpen(false);
      }
    } else {
      if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
        triggerHaptic('light');
        setIsSidebarOpen(false);
      }
    }
  };

  const handleNewChat = () => {
    triggerHaptic('medium');
    window.dispatchEvent(new Event('clear-chat'));
    navigate('/chat');
    setIsSidebarOpen(false);
  };

  const rawWorkspaceItems = [
    {
      id: 'chat',
      icon: <MessageSquare size={16} />,
      label: isRtl ? 'المحادثات الذكية' : 'AI Chat',
      path: '/chat',
      requiresAuth: false
    },
    {
      id: 'viralbook',
      icon: <Flame size={16} />,
      label: isRtl ? 'فيرال بوك' : 'ViralBook',
      path: '/viralbook',
      requiresAuth: false
    },
    {
      id: 'discover',
      icon: <Compass size={16} />,
      label: t('discover') || (isRtl ? 'استكشف' : 'Discover'),
      path: '/discover',
      requiresAuth: false
    },
    {
      id: 'rewards',
      icon: <Gift size={16} />,
      label: t('rewards') || (isRtl ? 'المكافآت' : 'Rewards'),
      path: '/rewards',
      requiresAuth: true
    }
  ];

  const workspaceItems = rawWorkspaceItems.filter(
    (item) => !isPathBlocked(item.path, siteSettings?.blocked_paths, true)
  );

  const pinnedChats = chats.filter((c) => c.is_pinned);
  const recentChats = chats.filter((c) => !c.is_pinned).slice(0, 14);

  const userPlanBadge = user?.role === 'admin'
    ? (isRtl ? 'إدارة' : 'Admin')
    : user?.subscription?.status === 'active'
      ? ((isRtl ? user.subscription.plan_name_ar : user.subscription.plan_name_en) || user.subscription.plan_name_en || 'Pro')
      : 'Pro';

  return (
    <div className="lg:hidden" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* 1. Backdrop Overlay for Slide-Over Sidebar Drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            key="mobile-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={() => {
              triggerHaptic('light');
              setIsSidebarOpen(false);
            }}
            className={`fixed inset-0 z-[190] ${
              shouldDisableHeavyBlurs ? 'bg-[var(--surface-overlay)]' : 'bg-[var(--surface-overlay)] backdrop-blur-[4px]'
            } touch-none`}
            aria-label="Close menu"
          />
        )}
      </AnimatePresence>

      {/* 2. Unified Slide-Over Mobile Sidebar Drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            key="mobile-drawer-panel"
            initial={{ x: isRtl ? '100%' : '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: isRtl ? '100%' : '-100%', opacity: 0 }}
            drag="x"
            dragDirectionLock
            dragSnapToOrigin
            dragConstraints={isRtl ? { left: 0, right: 350 } : { left: -350, right: 0 }}
            dragElastic={0.12}
            onDragEnd={handleDragEnd}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className={`fixed top-0 bottom-0 ${isRtl ? 'right-0 border-l' : 'left-0 border-r'} z-[200] w-[290px] max-w-[84vw] bg-[var(--surface-page)] text-[var(--text-primary)] border-[var(--border-default)] flex flex-col shadow-2xl overflow-hidden select-none touch-pan-y`}
          >
            {/* Top Bar: Brand Identity + Prominent "+ New" Button */}
            <div className="flex items-center justify-between px-3.5 pt-[calc(10px+env(safe-area-inset-top,0px))] pb-3 border-b border-[var(--border-default)] shrink-0 bg-[var(--surface-page)]">
              <div className="flex items-center gap-2 min-w-0">
                {(siteSettings.logoBase64 || siteSettings.logoLightBase64) ? (
                  <NotificationIconRenderer
                    src={resolveImageUrl((theme === 'light' && siteSettings.logoLightBase64) ? siteSettings.logoLightBase64 : siteSettings.logoBase64, 'general')}
                    alt={isRtl ? (siteSettings?.siteNameAr || 'Logo') : (siteSettings?.siteName || 'Logo')}
                    size={32}
                    className="rounded-shape-sm border border-[var(--border-default)] bg-[var(--surface-subtle)] shrink-0"
                    fallbackIcon={
                      <div className="w-8 h-8 rounded-shape-sm bg-[var(--bg-accent-muted)] border border-[var(--border-default)] flex items-center justify-center text-[var(--fg-accent)]">
                        <Cpu size={15} />
                      </div>
                    }
                  />
                ) : (
                  <div className="w-8 h-8 rounded-shape-sm bg-[var(--bg-accent-muted)] border border-[var(--border-default)] flex items-center justify-center text-[var(--fg-accent)] shrink-0">
                    <Cpu size={15} />
                  </div>
                )}
                <span className="font-bold text-sm text-[var(--text-primary)] font-sans tracking-tight truncate">
                  {isRtl ? (siteSettings?.siteNameAr || siteSettings?.siteName || 'بيربليكستا') : (siteSettings?.siteName || 'Perplexta')}
                </span>
              </div>

              <button
                type="button"
                onClick={handleNewChat}
                className="h-8 px-3 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] border border-[var(--border-default)] text-[var(--text-primary)] font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer shrink-0 touch-target-44-expanded"
              >
                <Plus size={14} className="text-[var(--fg-accent)]" />
                <span>{isRtl ? 'جديد' : 'New'}</span>
              </button>
            </div>

            {/* Unified Scrollable Content: AI Tools + Pinned + Recent Threads */}
            <div className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-4 overscroll-contain scrollbar-none">
              {/* Primary AI Workspaces & Tools */}
              <div className="space-y-0.5">
                {workspaceItems.map((item) => {
                  const isActive = currentPath === item.path || currentPath.startsWith(`${item.path}/`);
                  return (
                    <NavLink
                      key={item.id}
                      to={item.path}
                      onClick={(e) => {
                        triggerHaptic('selection');
                        setIsSidebarOpen(false);
                        if (item.requiresAuth && !user) {
                          e.preventDefault();
                          setIsAuthModalOpen(true);
                        }
                      }}
                      className={`h-10 px-3 rounded-shape-sm flex items-center justify-between gap-3 text-xs font-bold transition-all duration-fast border group ${
                        isActive
                          ? 'bg-[var(--surface-card)] text-[var(--text-primary)] border-[var(--border-default)] shadow-2xs'
                          : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`shrink-0 transition-colors duration-fast ${isActive ? 'text-[var(--fg-accent)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'}`}>
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </div>
                    </NavLink>
                  );
                })}
              </div>

              {/* Pinned Conversations Section (if any) */}
              {user && pinnedChats.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-[var(--border-default)]">
                  <button
                    type="button"
                    onClick={() => setIsPinnedExpanded((prev) => !prev)}
                    className="w-full h-8 px-2 flex items-center justify-between text-[11px] font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Pin size={12} className="text-[var(--fg-accent)]" />
                      <span>{isRtl ? 'المثبتة' : 'Pinned'}</span>
                    </span>
                    <ChevronDown
                      size={13}
                      className={`transition-transform duration-200 ${isPinnedExpanded ? 'rotate-0' : '-rotate-90 rtl:rotate-90'}`}
                    />
                  </button>

                  {isPinnedExpanded && (
                    <div className="space-y-0.5">
                      {pinnedChats.map((chat) => {
                        const isCurrent = String(activeChatId) === String(chat.id);
                        return (
                          <button
                            key={`pinned-${chat.id}`}
                            type="button"
                            onClick={() => {
                              triggerHaptic('selection');
                              navigate(`/chat/${chat.id}`);
                              setIsSidebarOpen(false);
                            }}
                            className={`w-full h-8 px-2.5 rounded-shape-sm flex items-center justify-between gap-2 text-xs transition-all cursor-pointer text-start ${
                              isCurrent
                                ? 'bg-[var(--surface-card)] text-[var(--text-primary)] font-bold border border-[var(--border-default)] shadow-2xs'
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] font-medium'
                            }`}
                          >
                            <span className="truncate flex-1">{chat.title || (isRtl ? 'محادثة بدون عنوان' : 'Untitled chat')}</span>
                            <Pin size={11} className="text-[var(--fg-accent)] shrink-0 opacity-75" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Recent Conversations Section */}
              {user && (
                <div className="space-y-1 pt-2 border-t border-[var(--border-default)]">
                  <div className="flex items-center justify-between px-2">
                    <button
                      type="button"
                      onClick={() => setIsRecentsExpanded((prev) => !prev)}
                      className="h-8 flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    >
                      <span>{isRtl ? 'المحادثات الأخيرة' : 'Recents'}</span>
                      <ChevronDown
                        size={13}
                        className={`transition-transform duration-200 ${isRecentsExpanded ? 'rotate-0' : '-rotate-90 rtl:rotate-90'}`}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setIsSidebarOpen(false);
                        setTimeout(() => {
                          triggerMobileHistoryDrawer();
                        }, 80);
                      }}
                      className="h-8 px-2 text-[11px] font-bold text-[var(--fg-accent)] hover:opacity-80 transition-opacity flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isRtl ? 'عرض الكل' : 'View all'}</span>
                    </button>
                  </div>

                  {isRecentsExpanded && (
                    <div className="space-y-0.5">
                      {recentChats.length > 0 ? (
                        recentChats.map((chat) => {
                          const isCurrent = String(activeChatId) === String(chat.id);
                          return (
                            <div
                              key={`recent-${chat.id}`}
                              className={`group w-full h-8 px-2.5 rounded-shape-sm flex items-center justify-between gap-1.5 text-xs transition-all ${
                                isCurrent
                                  ? 'bg-[var(--surface-card)] text-[var(--text-primary)] font-bold border border-[var(--border-default)] shadow-2xs'
                                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] font-medium'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  triggerHaptic('selection');
                                  navigate(`/chat/${chat.id}`);
                                  setIsSidebarOpen(false);
                                }}
                                className="flex-1 min-w-0 h-8 flex items-center text-start truncate cursor-pointer"
                              >
                                <span className="truncate">{chat.title || (isRtl ? 'محادثة جديدة' : 'New conversation')}</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  triggerHaptic('light');
                                  setIsSidebarOpen(false);
                                  setTimeout(() => {
                                    triggerMobileHistoryDrawer();
                                  }, 80);
                                }}
                                className="w-8 h-8 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0 opacity-70 hover:opacity-100 cursor-pointer"
                                aria-label={isRtl ? 'خيارات المحادثة' : 'Thread options'}
                              >
                                <MoreHorizontal size={13} />
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <div className="px-2.5 py-4 text-[11px] text-[var(--text-muted)] text-center">
                          {isRtl ? 'لا توجد محادثات سابقة بعد' : 'No recent conversations yet'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Fixed User Profile & Settings Trigger Bar */}
            <div className="p-2.5 border-t border-[var(--border-default)] bg-[var(--surface-card)] shrink-0 pb-[calc(10px+env(safe-area-inset-bottom,0px))]">
              {user ? (
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      setIsAccountSheetOpen(true);
                    }}
                    className="flex-1 min-w-0 h-10 px-2 rounded-shape-sm hover:bg-[var(--surface-subtle)] flex items-center gap-2.5 transition-colors cursor-pointer text-start"
                  >
                    <div className="w-8 h-8 rounded-shape-sm bg-[var(--bg-accent-muted)] border border-[var(--border-accent)]/40 text-[var(--fg-accent)] font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                      {user.avatar ? (
                        <img src={resolveImageUrl(user.avatar, 'avatar')} alt="" className="w-full h-full object-cover" />
                      ) : (
                        user.name ? user.name.charAt(0).toUpperCase() : 'U'
                      )}
                    </div>
                    <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                      {user.name || 'User'}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-shape-xs bg-[var(--bg-accent-muted)] border border-[var(--border-accent)]/30 text-[var(--fg-accent)] text-[10px] font-bold shrink-0">
                      {userPlanBadge}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      setIsAccountSheetOpen(true);
                    }}
                    className="w-8 h-8 rounded-shape-sm border border-[var(--border-default)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-page)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer shrink-0 touch-target-44-expanded"
                    aria-label={isRtl ? 'إعدادات الحساب' : 'Account settings'}
                  >
                    <Sliders size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsSidebarOpen(false);
                    setIsAuthModalOpen(true);
                  }}
                  className="w-full h-10 px-4 rounded-shape-md bg-[var(--bg-accent-emphasis)] text-[var(--fg-on-emphasis)] font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-[0.98] cursor-pointer"
                >
                  <User size={15} />
                  <span>{isRtl ? 'تسجيل الدخول / إنشاء حساب' : 'Sign In / Register'}</span>
                </button>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* 3. Mobile Account & Quick Settings Sheet (Opened from Sidebar User Footer) */}
      <AnimatePresence>
        {isAccountSheetOpen && user && (
          <motion.div
            key="mobile-account-sheet-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setIsAccountSheetOpen(false)}
            className="fixed inset-0 z-[220] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[var(--surface-page)] border-t sm:border border-[var(--border-default)] rounded-t-shape-lg sm:rounded-shape-lg shadow-2xl overflow-hidden flex flex-col max-h-[88dvh] pb-[calc(16px+env(safe-area-inset-bottom,0px))]"
            >
              {/* Top Handle & Header */}
              <div className="px-4 pt-3 pb-3 flex items-center justify-between border-b border-[var(--border-default)] bg-[var(--surface-card)]">
                <button
                  type="button"
                  onClick={() => setIsAccountSheetOpen(false)}
                  className="w-8 h-8 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer active:scale-95 touch-target-44-expanded"
                  aria-label={isRtl ? 'إغلاق' : 'Close'}
                >
                  <X size={15} />
                </button>

                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex flex-col items-end min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded-shape-xs bg-[var(--bg-accent-muted)] border border-[var(--border-accent)]/30 text-[var(--fg-accent)] text-[10px] font-bold">
                        {userPlanBadge}
                      </span>
                      <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                        {user.name}
                      </span>
                    </div>
                    <span className="text-[11px] text-[var(--text-muted)] truncate">
                      {user.email}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-shape-sm bg-[var(--bg-accent-muted)] border border-[var(--border-accent)]/40 text-[var(--fg-accent)] font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                    {user.avatar ? (
                      <img src={resolveImageUrl(user.avatar, 'avatar')} alt="" className="w-full h-full object-cover" />
                    ) : (
                      user.name ? user.name.charAt(0).toUpperCase() : 'U'
                    )}
                  </div>
                </div>
              </div>

              {/* Sheet Body */}
              <div className="p-4 space-y-3 overflow-y-auto">
                {/* Group 1: Settings, Plan, Wallet, Bookmarks */}
                <div className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-shape-md overflow-hidden divide-y divide-[var(--border-default)]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAccountSheetOpen(false);
                      setIsSidebarOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full h-10 px-3.5 flex items-center justify-between text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Sliders size={15} className="text-[var(--text-muted)]" />
                      <span>{isRtl ? 'جميع الإعدادات' : 'All settings'}</span>
                    </div>
                    {isRtl ? <ChevronLeft size={15} className="text-[var(--text-muted)]" /> : <ChevronRight size={15} className="text-[var(--text-muted)]" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsAccountSheetOpen(false);
                      setIsSidebarOpen(false);
                      navigate('/subscription');
                    }}
                    className="w-full h-10 px-3.5 flex items-center justify-between text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <CreditCard size={15} className="text-[var(--fg-accent)]" />
                      <span>{isRtl ? 'ترقية الباقة والاشتراك' : 'Upgrade plan'}</span>
                    </div>
                    {isRtl ? <ChevronLeft size={15} className="text-[var(--text-muted)]" /> : <ChevronRight size={15} className="text-[var(--text-muted)]" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsAccountSheetOpen(false);
                      setIsSidebarOpen(false);
                      navigate('/settings/wallet');
                    }}
                    className="w-full h-10 px-3.5 flex items-center justify-between text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Wallet size={15} className="text-[var(--text-muted)]" />
                      <span>{isRtl ? 'المحفظة والرصيد' : 'Wallet & Balance'}</span>
                    </div>
                    {isRtl ? <ChevronLeft size={15} className="text-[var(--text-muted)]" /> : <ChevronRight size={15} className="text-[var(--text-muted)]" />}
                  </button>

                  {!isPathBlocked('/rewards', siteSettings?.blocked_paths, true) && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAccountSheetOpen(false);
                        setIsSidebarOpen(false);
                        navigate('/rewards');
                      }}
                      className="w-full h-10 px-3.5 flex items-center justify-between text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Gift size={15} className="text-[var(--fg-accent)]" />
                        <span>{t('rewards') || (isRtl ? 'المكافآت والإحالات' : 'Rewards & Referrals')}</span>
                      </div>
                      {isRtl ? <ChevronLeft size={15} className="text-[var(--text-muted)]" /> : <ChevronRight size={15} className="text-[var(--text-muted)]" />}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setIsAccountSheetOpen(false);
                      setIsSidebarOpen(false);
                      navigate('/viralbook/saved');
                    }}
                    className="w-full h-10 px-3.5 flex items-center justify-between text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Bookmark size={15} className="text-[var(--text-muted)]" />
                      <span>{isRtl ? 'العناصر المحفوظة' : 'Saved Bookmarks'}</span>
                    </div>
                    {isRtl ? <ChevronLeft size={15} className="text-[var(--text-muted)]" /> : <ChevronRight size={15} className="text-[var(--text-muted)]" />}
                  </button>
                </div>

                {/* Group 2: Appearance & Language Preferences */}
                <div className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-shape-md overflow-hidden divide-y divide-[var(--border-default)]">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      setTheme(theme === 'dark' ? 'light' : 'dark');
                    }}
                    className="w-full h-10 px-3.5 flex items-center justify-between text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      {theme === 'dark' ? <Moon size={15} className="text-indigo-400" /> : <Sun size={15} className="text-amber-500" />}
                      <span>{isRtl ? 'المظهر' : 'Appearance'}</span>
                    </div>
                    <span className="text-[11px] font-medium text-[var(--text-muted)]">
                      {theme === 'dark' ? (isRtl ? 'داكن' : 'Dark') : (isRtl ? 'فاتح' : 'Light')}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      setLanguage(language === 'ar' ? 'en' : 'ar');
                    }}
                    className="w-full h-10 px-3.5 flex items-center justify-between text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Globe size={15} className="text-[var(--fg-accent)]" />
                      <span>{isRtl ? 'اللغة' : 'Language'}</span>
                    </div>
                    <span className="text-[11px] font-medium text-[var(--text-muted)]">
                      {language === 'ar' ? 'العربية' : 'English'}
                    </span>
                  </button>
                </div>

                {/* Group 3: Sign Out */}
                <div className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-shape-md overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('medium');
                      setIsAccountSheetOpen(false);
                      setIsSidebarOpen(false);
                      logout();
                    }}
                    className="w-full h-10 px-3.5 flex items-center justify-between text-xs font-bold text-[var(--fg-danger)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
                  >
                    <span>{isRtl ? 'تسجيل الخروج' : 'Sign out'}</span>
                    <LogOut size={15} />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
