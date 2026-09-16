/**
 * 🏛️ PERPLEXTA DESIGN SYSTEM — ASSISTANT ICON PRIMITIVE
 * 
 * Branded AI assistant icon with spin state, directional awareness,
 * and seamless theme integration using the real logo from site settings/control panel.
 */

import React from 'react';
import { Sparkles, Cpu } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { resolveImageUrl } from '../../utils/imageResolver';
import { NotificationIconRenderer } from '../../utils/imageProcessor';

export interface AssistantIconProps {
  size?: number;
  isSpinning?: boolean;
  dir?: 'ltr' | 'rtl';
  className?: string;
}

export const AssistantIcon: React.FC<AssistantIconProps> = ({
  size = 14,
  isSpinning = false,
  dir = 'ltr',
  className = '',
}) => {
  const { siteSettings, theme, language } = useAppContext();
  const isRtl = language === 'ar';

  const rawLogo = (theme === 'light' && siteSettings?.logoLightBase64) 
    ? siteSettings?.logoLightBase64 
    : siteSettings?.logoBase64;
  const logoUrl = rawLogo ? resolveImageUrl(rawLogo, 'general') : null;
  const displayName = isRtl 
    ? (siteSettings?.siteNameAr || siteSettings?.siteName || 'بيربليكستا') 
    : (siteSettings?.siteName || 'Perplexta');

  const fallback = (
    <Sparkles
      size={size}
      className={`${isSpinning ? 'animate-spin' : ''} transition-transform text-accent`}
    />
  );

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 ${isSpinning ? 'animate-pulse' : ''} ${className}`}
      dir={dir}
    >
      {logoUrl ? (
        <div 
          className="rounded-shape-sm overflow-hidden flex items-center justify-center shrink-0"
          style={{ width: `${size + 4}px`, height: `${size + 4}px` }}
        >
          <NotificationIconRenderer
            src={logoUrl}
            alt={displayName}
            size={size + 4}
            className="w-full h-full object-contain block"
            fallbackIcon={fallback}
          />
        </div>
      ) : (
        fallback
      )}
    </span>
  );
};
