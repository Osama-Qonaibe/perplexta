import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { resolveImageUrl } from '../../utils/imageResolver';
import { NotificationIconRenderer } from '../../utils/imageProcessor';
import { Sparkles, Cpu } from 'lucide-react';

export interface LogoProps {
  size?: number;
  className?: string;
  showName?: boolean;
  nameClassName?: string;
  fallbackType?: 'cpu' | 'sparkles';
  shape?: 'rounded' | 'circle';
}

export const Logo: React.FC<LogoProps> = ({
  size = 32,
  className = '',
  showName = false,
  nameClassName = 'font-bold text-sm text-[var(--text-primary)] font-sans tracking-tight',
  fallbackType = 'cpu',
  shape = 'rounded',
}) => {
  const { siteSettings, theme, language } = useAppContext();
  const isRtl = language === 'ar';
  const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-shape-sm';

  const rawLogo = (theme === 'light' && siteSettings?.logoLightBase64) 
    ? siteSettings?.logoLightBase64 
    : siteSettings?.logoBase64;
  const logoUrl = rawLogo ? resolveImageUrl(rawLogo, 'general') : null;
  const displayName = isRtl 
    ? (siteSettings?.siteNameAr || siteSettings?.siteName || 'بيربليكستا') 
    : (siteSettings?.siteName || 'Perplexta');

  const fallback = (
    <div 
      className={`w-8 h-8 ${shapeClass} bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center justify-center text-accent shadow-2xs shrink-0 box-border overflow-hidden`}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      {fallbackType === 'cpu' ? (
        <Cpu size={Math.max(13, Math.round(size * 0.45))} className="text-accent" />
      ) : (
        <Sparkles size={Math.max(13, Math.round(size * 0.45))} className="text-accent" />
      )}
    </div>
  );

  return (
    <div className={`inline-flex items-center gap-2 shrink-0 box-border select-none ${className}`}>
      <div 
        className={`w-8 h-8 ${shapeClass} overflow-hidden border border-[var(--border-default)] bg-[var(--surface-subtle)] flex items-center justify-center shrink-0 box-border shadow-2xs relative`}
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        {logoUrl ? (
          <NotificationIconRenderer
            src={logoUrl}
            alt={displayName}
            size={size}
            className="w-full h-full object-contain block p-0.5"
            fallbackIcon={fallback}
          />
        ) : (
          fallback
        )}
      </div>
      {showName && (
        <span className={nameClassName}>
          {displayName}
        </span>
      )}
    </div>
  );
};

