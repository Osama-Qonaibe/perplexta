import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sparkles,
  MessageCircle,
  ThumbsUp,
  Globe,
  Phone,
  Check,
  Zap,
  Target
} from 'lucide-react';

export type CampaignGoal = 'auto_ai' | 'whatsapp_leads' | 'engagement' | 'traffic' | 'calls';

export interface GoalOption {
  id: CampaignGoal;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  badgeAr: string;
  badgeEn: string;
  icon: any;
  isAi?: boolean;
}

export const GOAL_MODAL_OPTIONS: GoalOption[] = [
  {
    id: 'auto_ai',
    titleAr: 'تلقائي (الذكاء الاصطناعي الذكي)',
    titleEn: 'Automatic (Perplexta AI)',
    descAr: 'اسمح لنظام الذكاء الاصطناعي بتحديد الهدف الأكثر ملاءمة وحصداً للتحويلات استناداً إلى نوع المنشور وسلوك الجمهور.',
    descEn: 'Let AI choose the most relevant objective based on post content and real-time audience behavior.',
    badgeAr: 'يناسب: المبيعات والنمو',
    badgeEn: 'Best for: Sales & Growth',
    icon: Sparkles,
    isAi: true
  },
  {
    id: 'whatsapp_leads',
    titleAr: 'تلقي المزيد من الرسائل والواتساب',
    titleEn: 'Get More Messages & WhatsApp',
    descAr: 'عرض إعلاناتك على الأشخاص الذين من المحتمل جداً أن يرسلوا إليك رسالة استفسار أو طلب عبر واتساب أو الدردشة.',
    descEn: 'Show ads to people most likely to message your business on WhatsApp or Direct Chat.',
    badgeAr: 'يناسب: المبيعات والمحادثات',
    badgeEn: 'Best for: Inquiries & Leads',
    icon: MessageCircle
  },
  {
    id: 'engagement',
    titleAr: 'زيادة معدل التفاعل والانتشار',
    titleEn: 'Boost Engagement & Community Reach',
    descAr: 'عرض إعلاناتك على الأشخاص الأكثر تفاعلاً للحصول على إعجابات، تعليقات حية، ومشاركات سريعة للمنشور.',
    descEn: 'Show ads to people likely to like, comment, and share your post across the community.',
    badgeAr: 'يناسب: التفاعل والشهرة',
    badgeEn: 'Best for: Engagement',
    icon: ThumbsUp
  },
  {
    id: 'traffic',
    titleAr: 'جذب مزيد من الزوار إلى موقع الويب أو المتجر',
    titleEn: 'Drive Website or Store Visitors',
    descAr: 'توجيه العملاء المهتمين مباشرة لزيارة رابط متجرك الإلكتروني، موقعك، أو صفحة الهبوط المخصصة.',
    descEn: 'Encourage prospects to click through to your landing page, shop, or external link.',
    badgeAr: 'يناسب: الزيارات والمبيعات',
    badgeEn: 'Best for: Web Traffic',
    icon: Globe
  },
  {
    id: 'calls',
    titleAr: 'تلقي المزيد من المكالمات الهاتفية المباشرة',
    titleEn: 'Get More Direct Phone Calls',
    descAr: 'إبراز زر الاتصال الهاتفي الفوري للعملاء المستعدين لإتمام الطلبات أو حجز المواعيد عبر الهاتف.',
    descEn: 'Highlight a direct click-to-call button for customers ready to call your business.',
    badgeAr: 'يناسب: الاتصال السريع',
    badgeEn: 'Best for: Phone Calls',
    icon: Phone
  }
];

interface GoalSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGoal: CampaignGoal;
  onSelectGoal: (goal: CampaignGoal) => void;
  isRtl?: boolean;
}

export const GoalSelectionModal: React.FC<GoalSelectionModalProps> = ({
  isOpen,
  onClose,
  currentGoal,
  onSelectGoal,
  isRtl = true
}) => {
  const [selected, setSelected] = useState<CampaignGoal>(currentGoal);

  useEffect(() => {
    if (isOpen) {
      setSelected(currentGoal);
    }
  }, [isOpen, currentGoal]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSelectGoal(selected);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="w-full max-w-lg bg-[var(--surface-card)] rounded-2xl border border-[var(--border-main)] shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]"
        >
          {/* Modal Header */}
          <div className="p-5 border-b border-[var(--border-main)] bg-[var(--surface-subtle)]/70 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                <Target size={18} />
              </div>
              <div>
                <h3 className="text-base font-black tracking-tight text-[var(--text-primary)]">
                  {isRtl ? 'الهدف من الترويج' : 'Select Campaign Goal'}
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {isRtl ? 'اختر النتيجة المرجوة من إطلاق هذا الإعلان' : 'Choose the primary outcome you want from this ad'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-card)] border border-transparent hover:border-[var(--border-main)] transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Goal Radio Options List */}
          <div className="p-5 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
            {GOAL_MODAL_OPTIONS.map((g) => {
              const isChosen = selected === g.id;
              const Icon = g.icon;
              return (
                <div
                  key={g.id}
                  onClick={() => setSelected(g.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                    isChosen
                      ? 'border-purple-600 bg-purple-600/10 shadow-xs ring-1 ring-purple-600/30'
                      : 'border-[var(--border-main)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] hover:border-purple-300 dark:hover:border-purple-700'
                  }`}
                >
                  {/* Radio Indicator */}
                  <div className="pt-0.5 shrink-0">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                        isChosen ? 'border-purple-600 bg-purple-600' : 'border-[var(--border-main)] bg-transparent'
                      }`}
                    >
                      {isChosen && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>

                  {/* Goal Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${isChosen ? 'bg-purple-600 text-white' : 'bg-[var(--surface-card)] text-purple-600 dark:text-purple-400'}`}>
                          <Icon size={16} />
                        </div>
                        <span className="font-bold text-sm text-[var(--text-primary)]">
                          {isRtl ? g.titleAr : g.titleEn}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                      {isRtl ? g.descAr : g.descEn}
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[var(--surface-card)] border border-[var(--border-main)] text-[var(--text-muted)]">
                        {isRtl ? g.badgeAr : g.badgeEn}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-[var(--border-main)] bg-[var(--surface-subtle)] flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-card)] border border-transparent hover:border-[var(--border-main)] transition-colors"
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-black bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-950/20 transition-all active:scale-98 flex items-center gap-1.5"
            >
              <Check size={15} />
              <span>{isRtl ? 'حفظ الهدف' : 'Save Goal'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
