import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Users,
  MapPin,
  Layers,
  Sparkles,
  Check,
  Plus,
  HelpCircle,
  Sliders,
  Compass
} from 'lucide-react';
import { DynamicLocationTargetingSelector } from './DynamicLocationTargetingSelector';
import { CategoryTargetingSelector } from './CategoryTargetingSelector';
import { MASTER_PLATFORM_CATEGORIES } from '../constants/categories';

export type TargetGender = 'all' | 'male' | 'female';

export interface AudienceConfig {
  gender: TargetGender;
  ageMin: number;
  ageMax: number;
  selectedCities: string[];
  selectedInterests: string[];
}

interface AudienceAdvantageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: AudienceConfig) => void;
  initialConfig: AudienceConfig;
  isRtl?: boolean;
}

// Curated Quick Interest Suggestions shown right below Detailed Targeting
const QUICK_INTEREST_SUGGESTIONS = [
  { id: 'tech_software_dev', labelAr: 'البرمجة والتطوير', labelEn: 'Software & Dev' },
  { id: 'biz_digital_marketing', labelAr: 'التسويق الرقمي', labelEn: 'Digital Marketing' },
  { id: 'ecom_general_store', labelAr: 'المتاجر والتجارة الإلكترونية', labelEn: 'E-Commerce' },
  { id: 'realestate_residential_sales', labelAr: 'العقارات السكنية', labelEn: 'Real Estate' },
  { id: 'auto_car_dealers', labelAr: 'معارض وتجارة السيارات', labelEn: 'Car Dealers' },
  { id: 'ecom_fashion_clothing', labelAr: 'الأزياء والملابس', labelEn: 'Fashion & Clothing' },
  { id: 'food_restaurants_fastfood', labelAr: 'المطاعم والمأكولات', labelEn: 'Restaurants & Dining' },
  { id: 'edu_elearning_courses', labelAr: 'التعليم والتدريب', labelEn: 'Education & Training' }
];

export const AudienceAdvantageModal: React.FC<AudienceAdvantageModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialConfig,
  isRtl = true
}) => {
  const [gender, setGender] = useState<TargetGender>(initialConfig.gender || 'all');
  const [ageMin, setAgeMin] = useState<number>(initialConfig.ageMin || 18);
  const [ageMax, setAgeMax] = useState<number>(initialConfig.ageMax || 55);
  const [selectedCities, setSelectedCities] = useState<string[]>(initialConfig.selectedCities || []);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(initialConfig.selectedInterests || []);

  // Sync state when opened
  useEffect(() => {
    if (isOpen) {
      setGender(initialConfig.gender || 'all');
      setAgeMin(initialConfig.ageMin || 18);
      setAgeMax(initialConfig.ageMax || 55);
      setSelectedCities(initialConfig.selectedCities || []);
      setSelectedInterests(initialConfig.selectedInterests || []);
    }
  }, [isOpen, initialConfig]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      gender,
      ageMin,
      ageMax,
      selectedCities,
      selectedInterests
    });
    onClose();
  };

  const handleQuickAddInterest = (id: string) => {
    if (!selectedInterests.includes(id)) {
      setSelectedInterests(prev => [...prev, id]);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="w-full max-w-2xl bg-[var(--surface-card)] rounded-2xl border border-[var(--border-main)] shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]"
        >
          {/* Modal Header */}
          <div className="p-5 border-b border-[var(--border-main)] bg-[var(--surface-subtle)]/70 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                <Sliders size={18} />
              </div>
              <div>
                <h3 className="text-base font-black tracking-tight text-[var(--text-primary)]">
                  {isRtl ? 'تعديل الجمهور باستخدام +Advantage' : 'Edit Audience with Advantage+'}
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {isRtl ? 'تحسين استهداف الحملة للوصول إلى أنسب شريحة مهتمة بعرضك' : 'Optimize targeting to reach high-intent prospects'}
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

          {/* Modal Scrollable Body */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
            
            {/* 1. Target Gender Radio / Pill Group */}
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">
                {isRtl ? 'الجنس:' : 'Gender:'}
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: 'all', labelAr: 'الكل', labelEn: 'All' },
                  { id: 'male', labelAr: 'الرجال', labelEn: 'Men' },
                  { id: 'female', labelAr: 'النساء', labelEn: 'Women' }
                ].map((g) => {
                  const isSelected = gender === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setGender(g.id as TargetGender)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                        isSelected
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                          : 'bg-[var(--surface-subtle)] text-[var(--text-secondary)] border-[var(--border-main)] hover:bg-[var(--surface-card)]'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isSelected ? 'border-white bg-white/20' : 'border-[var(--border-main)]'}`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span>{isRtl ? g.labelAr : g.labelEn}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Age Range Dual Controls */}
            <div className="p-4 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-main)] space-y-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[var(--text-secondary)]">{isRtl ? 'الفئة العمرية:' : 'Age Range:'}</span>
                <span className="text-purple-600 dark:text-purple-400 font-mono font-black text-sm">
                  {ageMin} - {ageMax >= 65 ? '65+' : ageMax} {isRtl ? 'سنة' : 'years'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <span className="text-[11px] text-[var(--text-muted)] block mb-1">
                    {isRtl ? 'الحد الأدنى:' : 'Min Age:'} <span className="font-mono font-bold text-[var(--text-primary)]">{ageMin}</span>
                  </span>
                  <input
                    type="range"
                    min={18}
                    max={65}
                    value={ageMin}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val <= ageMax) setAgeMin(val);
                    }}
                    className="w-full accent-purple-600 cursor-pointer"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-[var(--text-muted)] block mb-1">
                    {isRtl ? 'الحد الأقصى:' : 'Max Age:'} <span className="font-mono font-bold text-[var(--text-primary)]">{ageMax >= 65 ? '65+' : ageMax}</span>
                  </span>
                  <input
                    type="range"
                    min={18}
                    max={65}
                    value={ageMax}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val >= ageMin) setAgeMax(val);
                    }}
                    className="w-full accent-purple-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* 3. Dynamic Real-Time Location Search & Map Viewer */}
            <div className="p-4 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-main)]">
              <DynamicLocationTargetingSelector
                selectedLocations={selectedCities}
                onChange={setSelectedCities}
                isRtl={isRtl}
              />
            </div>

            {/* 4. Detailed Category & Sector Targeting */}
            <div className="p-4 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-main)] space-y-3">
              <CategoryTargetingSelector
                selectedCategoryIds={selectedInterests}
                onChange={setSelectedInterests}
                isRtl={isRtl}
              />

              {/* Quick Suggestions Pills (Just like shown in the video) */}
              <div className="pt-2 border-t border-[var(--border-main)]/70">
                <span className="text-[11px] font-bold text-[var(--text-muted)] block mb-2">
                  {isRtl ? 'اقتراحات شائعة وسريعة:' : 'Quick Recommended Categories:'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_INTEREST_SUGGESTIONS.map((item) => {
                    const isAdded = selectedInterests.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleQuickAddInterest(item.id)}
                        disabled={isAdded}
                        className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-all flex items-center gap-1.5 border ${
                          isAdded
                            ? 'bg-purple-600/10 text-purple-600 dark:text-purple-400 border-purple-500/20 opacity-70 cursor-default'
                            : 'bg-[var(--surface-card)] text-[var(--text-secondary)] border-[var(--border-main)] hover:border-purple-400 hover:text-purple-600'
                        }`}
                      >
                        {isAdded ? <Check size={12} /> : <Plus size={12} />}
                        <span>{isRtl ? item.labelAr : item.labelEn}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>

          {/* Modal Sticky Footer Actions */}
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
              <span>{isRtl ? 'حفظ إعدادات الجمهور' : 'Save Audience'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
