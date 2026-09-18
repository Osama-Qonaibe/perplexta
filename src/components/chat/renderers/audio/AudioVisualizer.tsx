import React from 'react';
import { motion } from 'motion/react';
import { Music } from 'lucide-react';

export const AudioVisualizer = ({ status, isPlaying, currentTime, dir }: { status: string; isPlaying: boolean; currentTime: number; dir: 'ltr' | 'rtl' }) => {
  return (
    <div className="absolute bottom-0 left-0 w-full h-12 flex items-end justify-center gap-1 sm:gap-1.5 px-6 pb-4 opacity-65 pointer-events-none">
      {Array.from({ length: 36 }).map((_, i) => {
        let scaleVal = 4;
        if (status === 'ready' && isPlaying) {
          const indexFactor = Math.sin(i * 0.4 + currentTime * 8);
          const volumeFactor = 16 + indexFactor * 12;
          scaleVal = Math.max(4, Math.min(26, volumeFactor));
          return (
            <div 
              key={`audio-vis-bar-${i}`}
              style={{ height: `${scaleVal}px` }}
              className="w-1 bg-[var(--fg-accent)]/70 rounded-[var(--radius-xs)] transition-theme shadow-[0_0_8px_rgba(156,163,175,0.4)]"
            />
          );
        } else if (status === 'rendering' || status === 'idle') {
          return (
            <motion.div 
              key={`audio-vis-motion-${i}`}
              animate={{ 
                height: [4, 18 + Math.sin(i * 0.5) * 10, 4] 
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: i * 0.05 
              }}
              className="w-1 bg-[var(--fg-accent)]/60 rounded-[var(--radius-xs)] shadow-[0_0_8px_rgba(156,163,175,0.3)]"
            />
          );
        } else {
          scaleVal = 4 + Math.sin(i * 0.3) * 3;
          return (
            <div 
              key={`audio-vis-idle-${i}`}
              style={{ height: `${scaleVal}px` }}
              className="w-1 bg-[var(--fg-accent)]/40 rounded-[var(--radius-xs)] transition-theme shadow-[0_0_4px_rgba(156,163,175,0.1)]"
            />
          );
        }
      })}
    </div>
  );
};
