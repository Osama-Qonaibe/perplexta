import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Activity, Database, Cpu, Landmark, 
  Users, Settings, Mail, ArrowRight,
  ShieldAlert, Palette
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { triggerHaptic } from '../utils/haptics';

export interface AdminSidebarProps {
  activeLanguage?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ 
  activeLanguage,
  onClose 
}) => {
  const { user, language: globalLang } = useAppContext();
  const location = useLocation();

  const language = activeLanguage || globalLang;
  const dir = language === 'ar' ? 'rtl' : 'ltr';

  const isSupport = user?.role === 'support';

  const navItems = [
    // 1. مركز القيادة والنبض (Command Center)
    { 
      icon: <Activity size={18} />, 
      label: language === 'ar' ? 'مركز القيادة والنبض' : 'Command Center', 
      path: '/admin/dashboard',
      matchPaths: ['/admin/dashboard'],
    },
    ...(!isSupport ? [
      // 2. البنية التحتية والذكاء الاصطناعي (AI & Compute Infrastructure)
      { 
        icon: <Cpu size={18} />, 
        label: language === 'ar' ? 'البنية التحتية والذكاء الاصطناعي' : 'AI & Compute Infrastructure', 
        path: '/admin/keys',
        matchPaths: ['/admin/keys', '/admin/ai-infra', '/admin/gpu', '/admin/orchestrator', '/admin/memories'],
      },
      // 3. أوركسترا قواعد البيانات (Databases & Storage)
      { 
        icon: <Database size={18} />, 
        label: language === 'ar' ? 'أوركسترا قواعد البيانات' : 'Databases & Storage', 
        path: '/admin/databases',
        matchPaths: ['/admin/databases'],
      },
      // 4. الخزينة والمالية والاشتراكات (Finance & Monetization)
      { 
        icon: <Landmark size={18} />, 
        label: language === 'ar' ? 'الخزينة والمالية والاشتراكات' : 'Finance & Monetization', 
        path: '/admin/finance',
        matchPaths: ['/admin/finance', '/admin/plans', '/admin/referrals'],
      },
    ] : []),
    // 5. المستخدمين والمجتمع والإعلانات (Users & Community Hub)
    { 
      icon: <Users size={18} />, 
      label: language === 'ar' ? 'المستخدمين والمجتمع والإعلانات' : 'Users & Community Hub', 
      path: '/admin/users',
      matchPaths: ['/admin/users', '/admin/ads'],
    },
    ...(!isSupport ? [
      // 6. مركز المراسلات والبث (Communications & Broadcast)
      { 
        icon: <Mail size={18} />, 
        label: language === 'ar' ? 'مركز المراسلات والبث' : 'Communications & Broadcast', 
        path: '/admin/emails',
        matchPaths: ['/admin/emails', '/admin/broadcast'],
      },
      // 7. المظهر والمحركات والـ SEO (Design & SEO Studio)
      { 
        icon: <Palette size={18} />, 
        label: language === 'ar' ? 'المظهر والمحركات والـ SEO' : 'Design & SEO Studio', 
        path: '/admin/theme',
        matchPaths: ['/admin/theme', '/admin/seo', '/admin/design-seo'],
      },
      // 8. الأمان والتدقيق والامتثال (Security & Compliance)
      { 
        icon: <ShieldAlert size={18} />, 
        label: language === 'ar' ? 'الأمان والتدقيق والامتثال' : 'Security & Compliance', 
        path: '/admin/audit',
        matchPaths: ['/admin/audit', '/admin/radar', '/admin/metrics'],
      },
      // 9. إعدادات النظام العامة (System Settings)
      { 
        icon: <Settings size={18} />, 
        label: language === 'ar' ? 'إعدادات النظام العامة' : 'System Settings', 
        path: '/admin/settings',
        matchPaths: ['/admin/settings'],
      },
    ] : []),
  ];

  return (
    <aside 
      dir={dir}
      className={`h-full flex flex-col bg-[var(--surface-page)] border-[var(--border-default)] transition-theme select-none w-[220px] md:w-[240px] shrink-0 relative z-20 ${
        dir === 'rtl' ? 'border-l' : 'border-r'
      }`}
    >
      <nav className="flex-1 px-3 space-y-1 pt-3 overflow-y-auto custom-scrollbar scroll-smooth">
          {navItems.map((item, index) => {
            const isItemActive = item.matchPaths.some(
              (p) => location.pathname === p || location.pathname.startsWith(p + '/')
            );

            return (
              <NavLink
                key={`admin-nav-${item.path}-${index}`}
                to={item.path}
                onClick={() => {
                  if (onClose) onClose();
                }}
                className={`group flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] rounded-[var(--radius-sm)] transition-all duration-150 border cursor-pointer touch-target-44 ${
                  isItemActive
                    ? 'bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] text-[var(--accent)] border-[color-mix(in_oklab,var(--accent)_30%,var(--border-default))] font-bold shadow-2xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] hover:border-[var(--border-default)] border-transparent'
                }`}
              >
                <div className={`w-6 h-6 flex-shrink-0 flex items-center justify-center transition-colors duration-200 ${
                  isItemActive 
                    ? 'text-[var(--accent)]' 
                    : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
                }`}>
                  {React.isValidElement(item.icon) ? React.cloneElement(item.icon as React.ReactElement, { size: 17 } as any) : item.icon}
                </div>
                <span className={`font-bold text-xs tracking-tight transition-colors duration-200 leading-normal ${
                  isItemActive ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'
                }`}>
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Exit & Return to Platform Button */}
        <div className="p-3 border-t border-[var(--border-default)] mt-auto transition-theme">
          <NavLink 
            to="/chat"
            onClick={() => {
              triggerHaptic('medium');
              if (onClose) onClose();
            }}
            className="group flex items-center justify-between px-3 py-2.5 min-h-[44px] rounded-[var(--radius-sm)] transition-all border border-[var(--border-default)] bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)] hover:border-[var(--border-accent)] active:scale-95 touch-target-44 shadow-2xs cursor-pointer"
            title={language === 'ar' ? 'الخروج من لوحة التحكم والعودة للتطبيق' : 'Exit Admin to App'}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 flex items-center justify-center rounded-[var(--radius-xs)] text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors">
                <ArrowRight size={15} className={dir === 'rtl' ? 'rotate-180' : ''} />
              </div>
              <span className="font-bold text-xs text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                {language === 'ar' ? 'العودة للمنصة' : 'Exit to App'}
              </span>
            </div>
          </NavLink>
        </div>
      </aside>
  );
};
