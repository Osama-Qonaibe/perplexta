import React from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '../components/AdminSidebar';
import { Header } from '../components/Header';
import { AuthModal } from '../components/AuthModal';
import { DesktopOnlyNotice } from '../components/mobile/DesktopOnlyNotice';
import { useAppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { perplextaPageTransition } from '@/design-system';

export const AdminLayout: React.FC = () => {
  const { dir, language, isMobile } = useAppContext();

  // Guard: If viewed on mobile, display native lightweight notice instead of heavy ERP tables
  if (isMobile) {
    return (
      <div className="flex flex-col h-[100dvh] w-full overflow-hidden relative bg-[var(--surface-page)] text-[var(--text-primary)]">
        <Header activeLanguage={language} />
        <main className="flex-1 overflow-y-auto pt-[calc(56px+env(safe-area-inset-top,0px)+6px)] flex items-center justify-center p-4">
          <DesktopOnlyNotice />
        </main>
        <AuthModal />
      </div>
    );
  }

  return (
    <div 
      className={`flex h-screen w-full overflow-hidden relative bg-[var(--surface-page)] text-[var(--text-primary)]`}
    >
      <div className={`absolute inset-0 z-0 bg-[var(--surface-page)]`} />

      <motion.div
        dir={dir}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
        className="flex h-full w-full overflow-hidden relative z-10"
      >
        <AdminSidebar activeLanguage={language} />

        <div 
          style={{ 
            marginLeft: isMobile ? 0 : (dir === 'rtl' ? 0 : 240),
            marginRight: isMobile ? 0 : (dir === 'rtl' ? 240 : 0),
            transition: 'margin 0.2s ease'
          }}
          className="flex-1 flex flex-col relative min-w-0 overflow-hidden bg-inherit"
        >
          <Header activeLanguage={language} />
          <main className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth overscroll-none [WebkitOverflowScrolling:touch] bg-inherit h-[calc(100dvh-var(--safe-area-spacing))] md:h-full">
            <div className="min-h-full flex flex-col pt-[72px] px-6 md:px-8 pb-[calc(var(--safe-area-spacing)+env(safe-area-inset-bottom,0px))] md:pb-12">
              <Outlet />
            </div>
          </main>
        </div>
      </motion.div>
      <AuthModal />
    </div>
  );
};
