import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { Logo } from '../common/Logo';
import { triggerHaptic } from '../../utils/haptics';

export interface AdminTopBarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const AdminTopBar: React.FC<AdminTopBarProps> = () => {
  const { user, language, dir, siteSettings } = useAppContext();
  const isRtl = language === 'ar';

  const [latency, setLatency] = useState<number | null>(null);
  const [pulseOptimal, setPulseOptimal] = useState(true);

  // Ping backend health latency periodically for subtle status dot
  useEffect(() => {
    let isMounted = true;
    const checkPing = async () => {
      try {
        const start = performance.now();
        const res = await fetch('/api/health');
        const elapsed = Math.round(performance.now() - start);
        if (isMounted) {
          if (res.ok) {
            setLatency(elapsed);
            setPulseOptimal(true);
          } else {
            setPulseOptimal(false);
          }
        }
      } catch {
        if (isMounted) {
          setPulseOptimal(false);
        }
      }
    };

    checkPing();
    const interval = setInterval(checkPing, 45000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const resolvedSiteName = (isRtl ? (siteSettings?.siteNameAr || siteSettings?.siteName) : siteSettings?.siteName) || (isRtl ? 'بيربليكستا' : 'Perplexta');

  return (
    <header 
      dir={dir}
      className="h-[60px] w-full shrink-0 flex items-center bg-[var(--surface-page)] border-b border-[var(--border-default)] select-none z-30 transition-theme"
    >
      {/* Sidebar-Aligned Brand & Logo Column: Exact match with AdminSidebar width and vertical border */}
      <div className={`w-auto md:w-[204px] md:xl:w-[218px] h-full shrink-0 flex items-center px-4 md:px-4.5 border-[var(--border-default)] transition-theme ${
        dir === 'rtl' ? 'border-l' : 'border-r'
      }`}>
        <NavLink
          to="/admin/dashboard"
          onClick={() => triggerHaptic('light')}
          className="group flex items-center gap-2.5 transition-all duration-fast active:scale-98 cursor-pointer focus:outline-hidden"
          title={isRtl ? 'لوحة التحكم والقيادة' : 'Admin Dashboard'}
        >
          {/* Primary Project Logo - Clean Container with Zero Clutter */}
          <div className="w-8 h-8 rounded-shape-sm overflow-hidden flex items-center justify-center shrink-0 border border-[var(--border-default)] bg-[var(--surface-card)] group-hover:border-[var(--border-accent)]/70 group-hover:shadow-xs transition-all duration-fast">
            <Logo size={24} shape="none" fallbackType="brand" />
          </div>

          {/* Brand Name & Single Elegant Badge */}
          <div className="flex items-center gap-2">
            <span className="font-black text-sm tracking-tight text-[var(--text-primary)] group-hover:text-accent transition-colors leading-none">
              {resolvedSiteName}
            </span>
            <span className="px-1.5 py-0.5 rounded-shape-xs text-[9px] font-extrabold uppercase tracking-wider bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-default)] shadow-2xs leading-none">
              {isRtl ? 'الإدارة' : 'ADMIN'}
            </span>
          </div>
        </NavLink>
      </div>

      {/* Main Content Aligned Header Bar: Matches main container padding px-6 md:px-8 */}
      <div className="flex-1 h-full flex items-center justify-between px-6 md:px-8">
        {/* Subtle Workspace Context Indicator */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-[var(--text-muted)] font-medium select-none">
          <span className="w-1.5 h-1.5 rounded-shape-full bg-[var(--fg-accent,#3b82f6)]/70" />
          <span className="text-[var(--text-secondary)] font-semibold text-xs leading-none">
            {isRtl ? 'منظومة الإدارة والتحكم التنفيذي' : 'Executive Console'}
          </span>
        </div>

        {/* Outer Edge Controls: High-Precision Harmonious Status & Admin Pills (Zero Clutter, Zero Duplication) */}
        <div className="flex items-center gap-2.5 ms-auto shrink-0">
          {/* Subtle Live System Status Pill */}
          <div 
            className="flex items-center gap-2 h-8 px-3 rounded-shape-sm bg-[var(--surface-card)] border border-[var(--border-default)] shadow-2xs select-none leading-none"
            title={pulseOptimal 
              ? (isRtl ? `النظام متصل ومستقر (${latency ?? 0}ms)` : `System Operational (${latency ?? 0}ms)`) 
              : (isRtl ? 'تنبيه اتصال بالخادم' : 'Server Notice')}
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-shape-full opacity-75 ${
                pulseOptimal ? 'bg-[var(--fg-success)]' : 'bg-[var(--fg-warning)]'
              }`} />
              <span className={`relative inline-flex rounded-shape-full h-2 w-2 ${
                pulseOptimal ? 'bg-[var(--fg-success)]' : 'bg-[var(--fg-warning)]'
              }`} />
            </span>
            <span className="text-[11px] font-bold text-[var(--text-secondary)]">
              {pulseOptimal 
                ? (isRtl ? 'متصل' : 'Online') 
                : (isRtl ? 'تنبيه' : 'Notice')}
            </span>
            {latency !== null && (
              <span className="text-[10px] font-mono text-[var(--text-muted)] border-s border-[var(--border-default)] ps-2">
                {latency}ms
              </span>
            )}
          </div>

          {/* Admin Identity Pill */}
          {user && (
            <div className="flex items-center gap-2 h-8 px-3 rounded-shape-sm bg-[var(--surface-card)] border border-[var(--border-default)] shadow-2xs select-none leading-none">
              <div className="w-5 h-5 rounded-shape-full bg-accent/15 text-accent border border-accent/25 text-[10px] font-black flex items-center justify-center shrink-0">
                {(user.name || user.email || 'A')[0].toUpperCase()}
              </div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-[11px] font-bold text-[var(--text-primary)] truncate max-w-[130px]">
                  {user.name || user.email?.split('@')[0]}
                </span>
                <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-wider">
                  • {user.role === 'admin' 
                    ? (isRtl ? 'مسؤول' : 'Admin') 
                    : (isRtl ? 'دعم' : 'Support')}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

