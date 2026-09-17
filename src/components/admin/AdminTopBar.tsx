import React, { useState, useEffect } from 'react';
import { Languages } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { ThemeToggleButton } from '../ThemeToggleButton';
import { Logo } from '../common/Logo';
import { triggerHaptic } from '../../utils/haptics';

export interface AdminTopBarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const AdminTopBar: React.FC<AdminTopBarProps> = () => {
  const { user, language, setLanguage, dir, siteSettings } = useAppContext();

  const [latency, setLatency] = useState<number | null>(null);
  const [pulseOptimal, setPulseOptimal] = useState(true);

  // Ping backend health latency periodically for executive status pill
  useEffect(() => {
    let isMounted = true;
    const checkPing = async () => {
      try {
        const start = performance.now();
        const res = await fetch('/api/admin/health', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          },
        });
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

  const toggleLanguage = () => {
    triggerHaptic('light');
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  const resolvedSiteName = (language === 'ar' ? (siteSettings?.siteNameAr || siteSettings?.siteName) : siteSettings?.siteName) || 'Perplexta';

  return (
    <header 
      dir={dir}
      className="h-[60px] w-full shrink-0 flex items-center justify-between px-4 md:px-6 bg-[var(--surface-page)] border-b border-[var(--border-default)] select-none z-30 transition-theme"
    >
      {/* Start Section: Official Platform Brand & Identity */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-shape-sm overflow-hidden flex items-center justify-center shrink-0 border border-[var(--border-default)] bg-[var(--surface-card)] shadow-2xs">
            <Logo size={24} fallbackType="cpu" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-black text-sm tracking-tight text-[var(--text-primary)]">
                {resolvedSiteName}
              </span>
              <span className="px-1.5 py-0.5 rounded-[var(--radius-xs)] text-[9px] font-bold uppercase tracking-wider bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-default)]">
                {language === 'ar' ? 'الإدارة' : 'ADMIN'}
              </span>
            </div>
            <span className="text-[10px] text-[var(--text-muted)] font-medium leading-none mt-1">
              {language === 'ar' ? 'لوحة التحكم والقيادة' : 'Command Center'}
            </span>
          </div>
        </div>
      </div>

      {/* Center Section: Live Health Status Pill */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface-card)] border border-[var(--border-default)] shadow-2xs">
        <span className="relative flex h-2 w-2">
          <span className={`relative inline-flex rounded-full h-2 w-2 ${
            pulseOptimal ? 'bg-emerald-500' : 'bg-rose-500'
          }`} />
        </span>
        <span className="text-[11px] font-bold text-[var(--text-primary)]">
          {pulseOptimal 
            ? (language === 'ar' ? 'النظام متصل ومستقر' : 'System Optimal') 
            : (language === 'ar' ? 'تنبيه اتصال' : 'System Notice')}
        </span>
        {latency !== null && (
          <span className="text-[10px] font-mono text-[var(--text-muted)] border-s border-[var(--border-default)] ps-2">
            {latency}ms
          </span>
        )}
      </div>

      {/* End Section: Admin Info, Theme & Language */}
      <div className="flex items-center gap-2">
        {/* Admin Identity Pill */}
        {user && (
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-[var(--radius-sm)] bg-[var(--surface-card)] border border-[var(--border-default)]">
            <div className="w-5 h-5 rounded-full bg-[var(--surface-subtle)] text-[var(--text-primary)] border border-[var(--border-default)] text-[10px] font-bold flex items-center justify-center shrink-0">
              {(user.name || user.email || 'A')[0].toUpperCase()}
            </div>
            <div className="flex flex-col text-start">
              <span className="text-[11px] font-bold text-[var(--text-primary)] leading-none truncate max-w-[110px]">
                {user.name || user.email?.split('@')[0]}
              </span>
              <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase leading-none mt-0.5">
                {user.role === 'admin' 
                  ? (language === 'ar' ? 'مسؤول النظام' : 'Super Admin') 
                  : (language === 'ar' ? 'فريق الدعم' : 'Support')}
              </span>
            </div>
          </div>
        )}

        {/* Theme Toggle */}
        <ThemeToggleButton 
          variant="icon-button" 
          size="sm" 
          className="!w-8 !h-8 !rounded-shape-sm !border-[var(--border-default)] hover:!border-[var(--border-accent)] !bg-[var(--surface-card)] hover:!bg-[var(--surface-subtle)] !text-[var(--text-secondary)] hover:!text-[var(--text-primary)] transition-all touch-target-44 cursor-pointer" 
        />

        {/* Language Switch */}
        <button
          type="button"
          onClick={toggleLanguage}
          className="w-8 h-8 rounded-shape-sm border border-[var(--border-default)] bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)] hover:border-[var(--border-accent)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center cursor-pointer transition-all active:scale-95 touch-target-44"
          title={language === 'ar' ? 'التبديل إلى الإنجليزية' : 'Switch to Arabic'}
          aria-label="Toggle Language"
        >
          <Languages size={14} />
        </button>
      </div>
    </header>
  );
};
