import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { usePwaContext } from '../context/PwaContext';
import { isMobilePwaBannerHidden } from '../utils/sectionVisibility';
import { resolveImageUrl } from '../utils/imageResolver';
import { safeStorageGet } from '../utils/safeStorage';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, Download, X, Share2, PlusSquare, Sparkles, Check, ExternalLink, Loader2, Info } from 'lucide-react';
import { NotificationIconRenderer } from '../utils/imageProcessor';

export const PwaInstallBanner: React.FC = () => {
  const { siteSettings, language, theme, dir } = useAppContext();

  const {
    installState,
    canInstall,
    isStandalone,
    mobilePlatform,
    hasPrompt,
    promptInstall,
    openApp,
    dismissBanner
  } = usePwaContext();

  const isStandaloneMode = typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches;
  
  // Rule: Do not show on desktop at all
  const isDesktop = mobilePlatform === 'desktop';

  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || isDesktop) return;

    const lastDismissedTime = safeStorageGet('perplexta_pwa_dismissed');
    const savedCount = parseInt(safeStorageGet('perplexta_pwa_dismiss_count') || '0', 10);
    
    let cooldownMs = 24 * 60 * 60 * 1000;
    if (savedCount === 2) cooldownMs = 3 * 24 * 60 * 60 * 1000;
    else if (savedCount >= 3) cooldownMs = 7 * 24 * 60 * 60 * 1000;

    const isCooldownActive = lastDismissedTime && (Date.now() - Number(lastDismissedTime) < cooldownMs);
    
    if (isStandaloneMode || (installState as string) === 'installed' || installState === 'dismissed' || isCooldownActive) {
      setIsVisible(false);
      return;
    }

    if (canInstall) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [canInstall, installState, isStandalone, isDesktop, isStandaloneMode]);

  if (isDesktop || installState === 'installed' || isStandaloneMode || isMobilePwaBannerHidden(siteSettings?.blocked_paths)) {
    return null;
  }

  const isAr = language === 'ar';
  const isDark = theme === 'dark';

  const handleAction = async () => {
    if ((installState as string) === 'installed') {
      openApp();
      return;
    }

    // Direct Native Installation Prompt flow (e.g. Chrome on Android)
    if (canInstall && hasPrompt) {
      await promptInstall();
      return;
    }

    // Manual Instructions flow (iOS / non-supported browsers) - Toggles inline notification expansion
    if (canInstall && !hasPrompt) {
      setIsExpanded(prev => !prev);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    dismissBanner();
  };

  const rawLogo = siteSettings?.logoBase64 || siteSettings?.logoLightBase64;
  const logoUrl = rawLogo ? resolveImageUrl(rawLogo) : null;
  const siteName = isAr
    ? (siteSettings?.siteNameAr || siteSettings?.siteName || 'PERPLEXTA')
    : (siteSettings?.siteName || 'PERPLEXTA');

  const isAndroid = mobilePlatform === 'android-chrome' || mobilePlatform === 'android-other';
  const isIos = mobilePlatform === 'ios-safari' || mobilePlatform === 'ios-other';

  if (!isVisible) return null;

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          id="pwa-install-banner-root"
          initial={{ opacity: 0, y: 15, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="w-full select-none pointer-events-auto transition-theme font-sans"
        >
          <div className={`p-3.5 sm:p-4 rounded-xl border border-[var(--border-main)] bg-[var(--surface-card)] text-[var(--text-primary)] shadow-lg relative overflow-hidden flex flex-col gap-3 min-w-[280px] sm:min-w-[310px]`}>
            
            {/* Header Area with Brand/Logo and Dismiss */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {rawLogo ? (
                  <NotificationIconRenderer
                    src={resolveImageUrl((theme === 'light' && siteSettings?.logoLightBase64) ? siteSettings?.logoLightBase64 : siteSettings?.logoBase64, 'general')}
                    alt={siteName}
                    size={32}
                    className="rounded-lg border border-accent/20 bg-[var(--surface-subtle)] p-0.5 shrink-0"
                    fallbackIcon={
                      <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent p-1 shrink-0">
                        <Smartphone size={16} />
                      </div>
                    }
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent p-1 shrink-0">
                    <Smartphone size={16} />
                  </div>
                )}
                
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-[var(--text-primary)] truncate leading-tight">
                    {siteName}
                  </span>
                  {/* Highlight device compatibility clearly */}
                  <span className="text-[9.5px] font-semibold text-accent/90 flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shrink-0" />
                    {isAndroid ? (
                      isAr ? 'نسخة الأندرويد الرسمية' : 'Official Android Version'
                    ) : isIos ? (
                      isAr ? 'نسخة الآيفون والـ iOS' : 'Official iOS / iPhone Version'
                    ) : (
                      isAr ? 'نسخة تطبيق الويب' : 'Web App Version'
                    )}
                  </span>
                </div>
              </div>

              {/* Close Button meeting minimum touch target parameters via hit expansion */}
              <button
                type="button"
                onClick={handleClose}
                className="p-1 rounded-lg bg-gray-500/10 text-gray-400 hover:text-[var(--text-primary)] cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center touch-target-44 before:absolute before:-inset-1"
                aria-label={isAr ? 'إغلاق' : 'Close'}
              >
                <X size={14} />
              </button>
            </div>

            {/* Notification Content Body */}
            <AnimatePresence mode="wait">
              {!isExpanded ? (
                // Compact / Initial State
                <motion.div
                  key="compact-view"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col gap-3"
                >
                  <p className="text-[11px] text-[var(--text-secondary)] leading-normal">
                    {isAndroid ? (
                      isAr
                        ? 'قم بتثبيت نسخة الأندرويد المخصصة للحصول على أداء فائق وتنبيهات مباشرة وبيئة عمل متكاملة.'
                        : 'Install the official Android edition for maximum performance, direct push alerts, and standalone view.'
                    ) : (
                      isAr
                        ? 'تثبيت التطبيق على الشاشة الرئيسية يمنحك سرعة فائقة وتصفحاً ملء الشاشة وكأنك تستخدم تطبيقاً مستقلاً.'
                        : 'Install Perplexta on your home screen for quick, full-screen standalone workspace access.'
                    )}
                  </p>

                  {/* Elegant Horizontal Action Row */}
                  <div className="flex items-center justify-end gap-2 mt-0.5">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-3.5 py-2 text-[10.5px] font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors min-h-[44px] touch-target-44 flex items-center justify-center cursor-pointer"
                    >
                      {isAr ? 'لاحقاً' : 'Later'}
                    </button>

                    <button
                      type="button"
                      onClick={handleAction}
                      disabled={installState === 'installing'}
                      className="px-4 py-2 text-[11px] font-extrabold rounded-lg bg-accent text-black hover:opacity-90 transition-opacity min-h-[44px] touch-target-44 flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                    >
                      {installState === 'installing' ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          <span>{isAr ? 'جاري التثبيت...' : 'Installing...'}</span>
                        </>
                      ) : hasPrompt ? (
                        <>
                          <Download size={13} />
                          <span>{isAndroid ? (isAr ? 'تثبيت نسخة الأندرويد' : 'Install Android App') : (isAr ? 'تثبيت التطبيق' : 'Install App')}</span>
                        </>
                      ) : (
                        <>
                          <Info size={13} />
                          <span>{isAr ? 'عرض التعليمات' : 'Show Instructions'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              ) : (
                // Elegant Inline Expanded Instructions Notification (بنمط الإشعارات وليس تصميم مختلف)
                <motion.div
                  key="instructions-view"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                  className="flex flex-col gap-3"
                >
                  <div className="toast-divider w-full border-t border-[var(--border-main)] my-1" />

                  <p className="text-[11px] font-bold text-accent">
                    {mobilePlatform === 'ios-safari' ? (
                      isAr ? 'طريقة التثبيت على نظام iOS (Safari):' : 'How to install on iOS (Safari):'
                    ) : mobilePlatform === 'ios-other' ? (
                      isAr ? 'طريقة التثبيت على الآيفون:' : 'How to install on iPhone:'
                    ) : (
                      isAr ? 'طريقة التثبيت اليدوي:' : 'Manual Installation Steps:'
                    )}
                  </p>

                  <div className="flex flex-col gap-2">
                    {/* Step 1 */}
                    <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                      isDark ? 'bg-gray-800/40 border-gray-700/60' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="w-5.5 h-5.5 rounded bg-accent/20 text-accent flex items-center justify-center font-bold text-[10.5px] shrink-0">
                        1
                      </div>
                      <div className="text-[10.5px] leading-tight flex-1">
                        {mobilePlatform === 'ios-safari' ? (
                          <>
                            <span className="font-semibold text-[var(--text-primary)]">
                              {isAr ? 'اضغط على زر المشاركة' : 'Tap the Share icon'}
                            </span>{' '}
                            <span className="text-[var(--text-secondary)]">
                              {isAr ? 'الموجود أسفل متصفح Safari' : 'located at the bottom of Safari browser'}
                            </span>
                            <Share2 size={11} className="text-blue-400 inline mx-1 shrink-0" />
                          </>
                        ) : mobilePlatform === 'ios-other' ? (
                          <>
                            <span className="font-semibold text-[var(--text-primary)]">
                              {isAr ? 'افتح الصفحة بمتصفح Safari' : 'Open this page in Safari'}
                            </span>{' '}
                            <span className="text-[var(--text-secondary)]">
                              {isAr ? 'لأن نظام iOS يحصر التثبيت فيه' : 'as iOS Safari fully supports standalone shortcuts'}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="font-semibold text-[var(--text-primary)]">
                              {isAr ? 'افتح قائمة المتصفح' : 'Open the browser menu'}
                            </span>{' '}
                            <span className="text-[var(--text-secondary)]">
                              {isAr ? 'من زر القائمة (⋮) أو (≡)' : 'via button (⋮) or (≡) in your browser'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                      isDark ? 'bg-gray-800/40 border-gray-700/60' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="w-5.5 h-5.5 rounded bg-accent/20 text-accent flex items-center justify-center font-bold text-[10.5px] shrink-0">
                        2
                      </div>
                      <div className="text-[10.5px] leading-tight flex-1">
                        {mobilePlatform === 'ios-safari' || mobilePlatform === 'ios-other' ? (
                          <>
                            <span className="font-semibold text-[var(--text-primary)]">
                              {isAr ? 'اختر "الإضافة للشاشة الرئيسية"' : 'Select "Add to Home Screen"'}
                            </span>{' '}
                            <span className="text-[var(--text-secondary)]">
                              {isAr ? 'من الخيارات المنسدلة.' : 'from the action options list.'}
                            </span>
                            <PlusSquare size={11} className="text-accent inline mx-1 shrink-0" />
                          </>
                        ) : (
                          <>
                            <span className="font-semibold text-[var(--text-primary)]">
                              {isAr ? 'اختر "تثبيت التطبيق" أو "إضافة للشاشة"' : 'Select "Install App" or "Add to Home Screen"'}
                            </span>{' '}
                            <span className="text-[var(--text-secondary)]">
                              {isAr ? 'لإنشاء الاختصار التلقائي.' : 'to generate the launcher shortcut.'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Inline Confirmation & Return Actions */}
                  <div className="flex items-center justify-end gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setIsExpanded(false)}
                      className="px-3 py-1.5 text-[10px] font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors min-h-[44px] touch-target-44 flex items-center justify-center cursor-pointer"
                    >
                      {isAr ? 'عودة' : 'Back'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsExpanded(false);
                        handleClose();
                      }}
                      className="px-4 py-2 text-[10.5px] font-extrabold rounded-lg bg-accent text-black hover:opacity-90 transition-opacity min-h-[44px] touch-target-44 flex items-center justify-center cursor-pointer shadow-sm"
                    >
                      {isAr ? 'تم، فهمت' : 'Got it, thanks'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
