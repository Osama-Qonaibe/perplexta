import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sliders, X, Check, Save, Tag, DollarSign, RefreshCw } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface RecommendationPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

const CATEGORY_OPTIONS = [
  { id: 'development', name_en: 'Software Development & Scripts', name_ar: 'تطوير البرمجيات والسكربتات' },
  { id: 'design', name_en: 'UI/UX & Graphic Design', name_ar: 'التصميم والواجهات والتجربة' },
  { id: 'ai_tools', name_en: 'AI & Automation Tools', name_ar: 'أدوات الذكاء الاصطناعي والأتمتة' },
  { id: 'marketing', name_en: 'Digital Marketing & Growth', name_ar: 'التسويق الرقمي وإدارة الحملات' },
  { id: 'services', name_en: 'Professional Freelance Services', name_ar: 'الخدمات المهنية والمستقلة' },
  { id: 'real_estate', name_en: 'Listings & Opportunities', name_ar: 'العقارات والفرص التجارية' },
  { id: 'business', name_en: 'Business Plans & Strategy', name_ar: 'خطط الأعمال والإستراتيجيات' },
  { id: 'content', name_en: 'Articles, Research & Guides', name_ar: 'المقالات والبحوث والأدلة' },
];

export const RecommendationPreferencesModal: React.FC<RecommendationPreferencesModalProps> = ({
  isOpen,
  onClose,
  onSaved
}) => {
  const { language, token } = useAppContext();

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(5000);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && token) {
      fetchPreferences();
    }
  }, [isOpen, token]);

  const fetchPreferences = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/recommendations/preferences', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.preferences) {
        setSelectedCategories(data.preferences.preferred_categories || []);
        if (data.preferences.preferred_price_range?.max) {
          setMaxPrice(data.preferences.preferred_price_range.max);
        }
      }
    } catch (err) {
      console.error('[RecommendationPreferencesModal] Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleCategory = (catId: string) => {
    setSelectedCategories(prev =>
      prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/recommendations/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          preferred_categories: selectedCategories,
          preferred_price_range: { min: 0, max: maxPrice }
        })
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(language === 'ar' ? 'تم حفظ تفضيلات التوصيات بنجاح' : 'Preferences saved successfully');
        if (onSaved) onSaved();
        setTimeout(() => {
          setSuccessMsg(null);
          onClose();
        }, 1000);
      }
    } catch (err) {
      console.error('[RecommendationPreferencesModal] Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-[var(--surface-overlay)] backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-lg rounded-[var(--pub-radius-container)] border border-[var(--pub-border-default)] bg-[var(--pub-surface-container)] p-5 sm:p-6 shadow-2xl relative overflow-hidden text-[var(--pub-text-primary)]"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[var(--pub-border-default)]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-[var(--pub-radius-control)] bg-[var(--pub-accent-muted)] border border-[var(--pub-accent-primary)]/30 flex items-center justify-center text-[var(--pub-accent-primary)]">
                <Sliders size={16} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-[var(--pub-text-primary)]">
                  {language === 'ar' ? 'تخصيص تفضيلات التوصيات' : 'Customize Discovery Vector'}
                </h3>
                <p className="text-[11px] text-[var(--pub-text-muted)]">
                  {language === 'ar' ? 'حدّد المجالات والنطاق السعري لضبط المقترحات بدقة' : 'Select categories & budget limits to tune your recommendations'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="ide-header-button w-8 h-8 p-0 flex items-center justify-center"
            >
              <X size={15} />
            </button>
          </div>

          {isLoading ? (
            <div className="py-12 flex items-center justify-center text-[var(--pub-accent-primary)]">
              <RefreshCw size={22} className="animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Category Selector */}
              <div>
                <label className="text-xs font-bold text-[var(--pub-text-primary)] flex items-center gap-1 mb-2">
                  <Tag size={13} className="text-[var(--pub-accent-primary)]" />
                  <span>{language === 'ar' ? 'مجالات الاهتمام المفضلّة' : 'Preferred Categories'}</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-52 overflow-y-auto custom-scrollbar p-0.5">
                  {CATEGORY_OPTIONS.map(cat => {
                    const isSelected = selectedCategories.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleToggleCategory(cat.id)}
                        className={`flex items-center justify-between p-2 rounded-[var(--pub-radius-control)] border text-xs font-bold transition-colors text-start cursor-pointer ${
                          isSelected
                            ? 'bg-[var(--pub-accent-muted)] text-[var(--pub-accent-primary)] border-[var(--pub-accent-primary)]/40 shadow-2xs'
                            : 'bg-[var(--pub-surface-subtle)] text-[var(--pub-text-muted)] border-[var(--pub-border-default)] hover:text-[var(--pub-text-primary)] hover:border-[var(--pub-border-strong)]'
                        }`}
                      >
                        <span className="truncate">{language === 'ar' ? cat.name_ar : cat.name_en}</span>
                        {isSelected && <Check size={13} className="shrink-0 text-[var(--pub-accent-primary)]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[var(--pub-text-primary)] flex items-center gap-1">
                    <DollarSign size={13} className="text-[var(--pub-accent-primary)]" />
                    <span>{language === 'ar' ? 'الحد الأقصى للميزانية' : 'Maximum Budget Limit'}</span>
                  </label>
                  <span className="ide-badge-info">
                    ${maxPrice} USD
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="10000"
                  step="50"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-[var(--pub-accent-primary)] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[var(--pub-text-muted)] font-semibold mt-0.5">
                  <span>$50 USD</span>
                  <span>$10,000+ USD</span>
                </div>
              </div>

              {/* Success Alert */}
              {successMsg && (
                <div className="p-2.5 rounded-[var(--pub-radius-control)] bg-[var(--pub-accent-muted)] border border-[var(--pub-accent-primary)]/30 text-xs font-bold text-[var(--pub-accent-primary)] flex items-center gap-2">
                  <Check size={14} />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--pub-border-default)]">
                <button
                  type="button"
                  onClick={onClose}
                  className="ide-header-button text-xs"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="ide-send-button text-xs"
                >
                  {isSaving ? (
                    <RefreshCw size={13} className="animate-spin" />
                  ) : (
                    <Save size={13} />
                  )}
                  <span>{language === 'ar' ? 'حفظ التفضيلات' : 'Save Preferences'}</span>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
