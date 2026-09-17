import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { usePwaContext } from '../context/PwaContext';
import { isMobilePwaBannerHidden } from '../utils/sectionVisibility';
import { resolveImageUrl } from '../utils/imageResolver';
import { safeStorageGet } from '../utils/safeStorage';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, Download, X, Loader2 } from 'lucide-react';
import { NotificationIconRenderer } from '../utils/imageProcessor';

export const PwaInstallBanner: React.FC = () => {
  const { siteSettings, language, theme, isStandaloneWebview } = useAppContext();

  const {
    installState,
    canInstall,
    mobilePlatform,
    hasPrompt,
    promptInstall,
    dismissBanner
  } = usePwaContext();

  const isStandaloneMode = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );

  const isPreviouslyInstalled = safeStorageGet('perplexta_pwa_installed') === 'true' ||
    safeStorageGet('perplexta_install_celebrated') === 'true';
  
  // Rule: Do not show on desktop or if already installed or standalone/webview mode
  const isDesktop = mobilePlatform === 'desktop';

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || isDesktop) return;

    if (isStandaloneMode || isStandaloneWebview || isPreviouslyInstalled || (installState as string) === 'installed' || installState === 'dismissed') {
      setIsVisible(false);
      return;
    }

    const lastDismissedTime = safeStorageGet('perplexta_pwa_dismissed');
    const savedCount = parseInt(safeStorageGet('perplexta_pwa_dismiss_count') || '0', 10);
    
    let cooldownMs = 24 * 60 * 60 * 1000;
    if (savedCount === 2) cooldownMs = 3 * 24 * 60 * 60 * 1000;
    else if (savedCount >= 3) cooldownMs = 7 * 24 * 60 * 60 * 1000;

    const isCooldownActive = lastDismissedTime && (Date.now() - Number(lastDismissedTime) < cooldownMs);
    
    if (isCooldownActive) {
      setIsVisible(false);
      return;
    }

    // Only show direct native prompt for mobile environments that support automated installation (like Android / Chrome)
    if (canInstall && hasPrompt) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [canInstall, hasPrompt, installState, isDesktop, isStandaloneMode, isPreviouslyInstalled]);

  if (isDesktop || installState === 'installed' || isStandaloneMode || isStandaloneWebview || isPreviouslyInstalled || isMobilePwaBannerHidden(siteSettings?.blocked_paths)) {
    return null;
  }

  // If browser does not support direct beforeinstallprompt, do not show prompt banner (no manual instructions per user directive)
  if (!hasPrompt) {
    return null;
  }

  const isAr = language === 'ar';

  const handleAction = async () => {
    if (canInstall && hasPrompt) {
      await promptInstall();
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    dismissBanner();
  };

  const rawLogo = siteSettings?.logoBase64 || siteSettings?.logoLightBase64;
  const siteName = isAr
    ? (siteSettings?.siteNameAr || siteSettings?.siteName || 'PERPLEXTA')
    : (siteSettings?.siteName || 'PERPLEXTA');

  const isAndroid = mobilePlatform === 'android-chrome' || mobilePlatform === 'android-other';

  if (!isVisible) return null;

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          id="pwa-install-banner-root"
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -15, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 380, damping: 26 }}
          className="fixed top-[calc(54px+env(safe-area-inset-top,0px))] left-3 right-3 sm:left-auto sm:right-4 z-[9999] max-w-sm w-auto select-none pointer-events-auto font-sans"
        >
          <div className="p-3 sm:p-3.5 rounded-2xl border border-[var(--pub-border-default)] bg-[var(--pub-surface-card)] text-[var(--pub-text-primary)] shadow-2xl relative overflow-hidden flex items-center justify-between gap-3">
            
            {/* Left: Brand Icon & Notification Message */}
            <div className="flex items-center gap-2.5 min-w-0">
              <NotificationIconRenderer
                src={resolveImageUrl((theme === 'light' && siteSettings?.logoLightBase64) ? siteSettings?.logoLightBase64 : siteSettings?.logoBase64, 'general')}
                alt={siteName}
                size={34}
                className="rounded-xl border border-[var(--pub-border-default)] bg-[var(--pub-surface-subtle)] p-1 shrink-0"
                fallbackIcon={
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 p-1 shrink-0">
                    <Smartphone size={16} />
                  </div>
                }
              />
              
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[var(--pub-text-primary)] truncate">
                    {siteName}
                  </span>
                  <span className="px-1.5 py-0.2 text-[9px] font-extrabold uppercase rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                    {isAndroid ? (isAr ? 'نسخة أندرويد' : 'Android') : (isAr ? 'تطبيق أصلي' : 'Native')}
                  </span>
                </div>
                <p className="text-[10.5px] font-medium text-[var(--pub-text-muted)] truncate mt-0.5">
                  {isAr ? 'تثبيت النسخة الأصلية على الجهاز' : 'Install official native edition'}
                </p>
              </div>
            </div>

            {/* Right: Direct Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleAction}
                disabled={installState === 'installing'}
                className="px-3 py-1.5 text-[11px] font-extrabold rounded-xl bg-cyan-500 text-black hover:opacity-90 active:scale-95 transition-all min-h-[36px] flex items-center justify-center gap-1 cursor-pointer shadow-sm"
              >
                {installState === 'installing' ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <>
                    <Download size={13} />
                    <span>{isAr ? 'تثبيت' : 'Install'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="p-1 rounded-lg text-[var(--pub-text-muted)] hover:text-[var(--pub-text-primary)] transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center cursor-pointer"
                aria-label={isAr ? 'إغلاق' : 'Close'}
              >
                <X size={15} />
              </button>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

