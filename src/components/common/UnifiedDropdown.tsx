import React from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';

export type DropdownPlacement = 
  | 'bottom-start'
  | 'bottom-end'
  | 'top-start'
  | 'top-end'
  | 'bottom-left' 
  | 'bottom-center' 
  | 'top-right' 
  | 'top-left'
  | 'bottom-right';

interface UnifiedDropdownProps {
  isOpen: boolean;
  placement?: DropdownPlacement;
  children: React.ReactNode;
  className?: string;
  id?: string;
  dir?: 'rtl' | 'ltr';
  onClose?: () => void;
}

const menuVariants: Variants = {
  closed: {
    opacity: 0,
    scale: 0.94,
    transition: { duration: 0.12, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }
  },
  open: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.16, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }
  }
};

export const UnifiedDropdown: React.FC<UnifiedDropdownProps> = ({ 
  isOpen, 
  placement = 'bottom-start', 
  children, 
  className = '',
  id,
  dir = 'rtl',
  onClose
}) => {
  const isRtl = dir === 'rtl';

  const getPlacementConfig = (p: DropdownPlacement): { placementClass: string; transformOrigin: string } => {
    switch (p) {
      // Logical Start placements (anchored to button corner based on language direction)
      case 'bottom-start':
      case 'bottom-center':
        return isRtl
          ? { placementClass: 'origin-bottom-right bottom-full mb-1 right-0', transformOrigin: 'bottom right' }
          : { placementClass: 'origin-bottom-left bottom-full mb-1 left-0', transformOrigin: 'bottom left' };
      case 'bottom-end':
        return isRtl
          ? { placementClass: 'origin-bottom-left bottom-full mb-1 left-0', transformOrigin: 'bottom left' }
          : { placementClass: 'origin-bottom-right bottom-full mb-1 right-0', transformOrigin: 'bottom right' };
      case 'top-start':
        return isRtl
          ? { placementClass: 'origin-top-right top-full mt-1 right-0', transformOrigin: 'top right' }
          : { placementClass: 'origin-top-left top-full mt-1 left-0', transformOrigin: 'top left' };
      case 'top-end':
        return isRtl
          ? { placementClass: 'origin-top-left top-full mt-1 left-0', transformOrigin: 'top left' }
          : { placementClass: 'origin-top-right top-full mt-1 right-0', transformOrigin: 'top right' };

      // Explicit directional placements
      case 'bottom-left':
        return { placementClass: 'origin-bottom-left bottom-full mb-1 left-0', transformOrigin: 'bottom left' };
      case 'bottom-right':
        return { placementClass: 'origin-bottom-right bottom-full mb-1 right-0', transformOrigin: 'bottom right' };
      case 'top-left':
        return { placementClass: 'origin-top-left top-full mt-1 left-0', transformOrigin: 'top left' };
      case 'top-right':
        return { placementClass: 'origin-top-right top-full mt-1 right-0', transformOrigin: 'top right' };
      default:
        return isRtl
          ? { placementClass: 'origin-bottom-right bottom-full mb-1 right-0', transformOrigin: 'bottom right' }
          : { placementClass: 'origin-bottom-left bottom-full mb-1 left-0', transformOrigin: 'bottom left' };
    }
  };

  const { placementClass, transformOrigin } = getPlacementConfig(placement);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {onClose && (
            <div 
              className="fixed inset-0 z-40 bg-transparent"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
            />
          )}
          <motion.div
            id={id}
            dir={dir}
            variants={menuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            style={{ transformOrigin }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className={`
              absolute z-50 rounded-[var(--radius-md)]
              border border-[var(--border-default)]
              bg-[var(--surface-card)] text-[var(--text-primary)]
              backdrop-blur-xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10
              overflow-hidden overscroll-contain
              transition-colors duration-150
              ${placementClass}
              ${className}
            `}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

