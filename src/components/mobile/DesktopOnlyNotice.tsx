import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Monitor, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { triggerHaptic } from '../../utils/haptics';

export const DesktopOnlyNotice: React.FC<{ title?: string; message?: string }> = ({
  title,
  message,
}) => {
  const { language } = useAppContext();
  const navigate = useNavigate();
  const isRtl = language === 'ar';

  const handleReturn = () => {
    triggerHaptic('light');
    navigate('/chat');
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 sm:p-6 text-center select-none">
      <div className="w-full max-w-sm p-6 rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-default)] shadow-xs flex flex-col items-center">
        <div className="w-14 h-14 rounded-shape-md bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center justify-center text-[var(--fg-accent)] mb-4">
          <Monitor className="w-7 h-7 stroke-[1.5]" />
        </div>

        <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] mb-2 font-sans">
          {title || (isRtl ? 'مخصص لبيئة سطح المكتب' : 'Desktop Environment Required')}
        </h2>

        <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-6 font-sans font-medium">
          {message || (isRtl
            ? 'لوحة التحكم الإدارية المتقدمة مصممة خصيصاً للشاشات الكبيرة لتوفير أعلى مستويات الأداء وإدارة الموارد والبنية التحتية.'
            : 'The Advanced Admin ERP is optimized for desktop displays to provide high-precision infrastructure management and model orchestration.')}
        </p>

        <button
          type="button"
          onClick={handleReturn}
          className="w-full h-10 px-4 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] font-bold text-xs flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer shadow-2xs"
        >
          {isRtl ? (
            <>
              <ArrowRight className="w-4 h-4" />
              <span>العودة للدردشة واستوديو الوسائط</span>
            </>
          ) : (
            <>
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Chat & Media Studio</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
