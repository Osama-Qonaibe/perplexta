import React, { useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { useSwipeToClose } from '../utils/swipe';
import { useModalScrollLock } from '../hooks/useModalScrollLock';
import { AuthCard } from './auth/AuthCard';
import { themeConfig } from '@/design-system';
import { MODAL_BACKDROP_VARIANTS, MODAL_DIALOG_VARIANTS } from '../styles/motionTokens';

export { AuthCard } from './auth/AuthCard';

export const AuthModal: React.FC = () => {
  const { dir, isAuthModalOpen, setIsAuthModalOpen, user } = useAppContext();

  const swipeHandlers = useSwipeToClose({
    onSwipeClose: () => setIsAuthModalOpen(false),
    direction: 'both',
    dir: dir as 'rtl' | 'ltr',
    isMobile: true
  });

  useModalScrollLock(isAuthModalOpen, 'auth-modal');

  useEffect(() => {
    if (!isAuthModalOpen) return;

    // Preload ChatPage chunk immediately while modal is open for 0ms post-login transition
    import('../pages/ChatPage').catch(() => {});

    if (user) {
      setIsAuthModalOpen(false);
    }
  }, [isAuthModalOpen, user, setIsAuthModalOpen]);

  const handleClose = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <AnimatePresence>
      {isAuthModalOpen && (
        <motion.div
          key="perplexta-auth-modal"
          variants={MODAL_BACKDROP_VARIANTS}
          initial="initial"
          animate="animate"
          exit="exit"
          onClick={handleClose}
          className={themeConfig.auth.overlay}
        >
          <motion.div
            variants={MODAL_DIALOG_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            onTouchStart={swipeHandlers.onTouchStart}
            onTouchMove={swipeHandlers.onTouchMove}
            onTouchEnd={swipeHandlers.onTouchEnd}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full flex justify-center transform-gpu"
          >
            <AuthCard onClose={handleClose} onSuccess={handleClose} showCloseButton={true} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};


