import React from 'react';
import { motion } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { MobileAppLayout } from './MobileAppLayout';
import { DesktopLayout } from './DesktopLayout';

export const MainLayout: React.FC = () => {
  const { isMobile } = useAppContext();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12, ease: 'easeOut' }}
      className="w-full h-full bg-[var(--surface-page)] text-[var(--text-primary)] transition-theme"
    >
      {isMobile ? <MobileAppLayout /> : <DesktopLayout />}
    </motion.div>
  );
};
