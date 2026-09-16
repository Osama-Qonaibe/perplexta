import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Palette,
  Save,
  RotateCcw,
  Moon,
  Sun,
  Settings,
  Download,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  Trash2,
  Sliders,
  MousePointerClick,
  Info,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  useThemeStudio,
  LiveThemePreview,
  TokenColorPicker,
  TokenSliderInput,
  ThemePresetsSelector,
  ThemeExportImportModal,
  TokenSearchBar,
  ThemeAuditModal,
  TOKEN_CATEGORIES_METADATA,
} from './theme';

interface ThemeStudioViewProps {
  t: (key: string, replacements?: any) => string;
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  token: string | null;
  language: string;
}

export const ThemeStudioView: React.FC<ThemeStudioViewProps> = ({
  t,
  showToast,
  token,
  language,
}) => {
  const navigate = useNavigate();
  const isAr = language === 'ar';

  const {
    activeMode,
    setActiveMode,
    lightTokens,
    darkTokens,
    currentTokens,
    currentDefaultTokens,
    loading,
    saving,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    activePresetId,
    filteredDefinitions,
    handleTokenChange,
    handleSelectPreset,
    handleImportTokens,
    handleSave,
    handleReset,
    handlePurgeDatabaseOverrides,
  } = useThemeStudio(token, showToast, language);

  const [showExportImportModal, setShowExportImportModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(true);

  // Button Governance Lab State
  const [buttonState, setButtonState] = useState<'idle' | 'hover' | 'active' | 'loading' | 'disabled'>('idle');
  const [selectedRadius, setSelectedRadius] = useState<'4px' | '6px' | '8px' | '12px' | '9999px'>('8px');
  const [selectedHeight, setSelectedHeight] = useState<'28px' | '32px' | '36px' | '40px'>('32px');

  // Safely extract button color tokens
  const btnPrimaryBg = currentTokens['--bg-btn-primary'] || '#06b6d4';
  const btnPrimaryFg = currentTokens['--fg-btn-primary'] || '#020617';
  const btnSecondaryBg = currentTokens['--bg-btn-secondary'] || (activeMode === 'dark' ? '#0d131f' : '#f1f5f9');
  const btnSecondaryFg = currentTokens['--fg-btn-secondary'] || (activeMode === 'dark' ? '#ffffff' : '#0f172a');
  const btnSecondaryBorder = currentTokens['--border-btn-secondary'] || (activeMode === 'dark' ? '#1e293b' : '#e2e8f0');
  const btnDangerBg = currentTokens['--bg-btn-danger'] || '#e11d48';
  const btnDangerFg = currentTokens['--fg-btn-danger'] || '#ffffff';

  const handleApplyButtonPreset = (height: string, radius: string) => {
    // Update individual tokens
    handleTokenChange(activeMode, '--radius-sm', radius);
    handleTokenChange(activeMode, '--btn-header-size', height);
    handleTokenChange(activeMode, '--btn-input-size', height);
    handleTokenChange(activeMode, '--btn-tool-size', height);
    handleTokenChange(activeMode, '--btn-action-size', height);

    setSelectedHeight(height as any);
    setSelectedRadius(radius as any);

    showToast(
      isAr 
        ? `تم تعميم مقاييس الأزرار: الارتفاع ${height} والانحناء ${radius}` 
        : `Applied button geometry: Height ${height}, Radius ${radius}`,
      'success'
    );
  };

  return (
    <div className="space-y-6 pb-16" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Sovereign Command Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[var(--surface-card)] border border-[var(--border-default)] p-5 sm:p-6 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shadow-xs">
              <Palette size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {isAr
                  ? 'استوديو حوكمة نظام التصميم والمظهر (Design System & Theme Governance)'
                  : 'Sovereign Design System & Theme Studio'}
              </h2>
              <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-bold tracking-wider">
                ENGINE V2.1 • GRANULAR GEOMETRY • CANONICAL HACOS
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed">
            {isAr
              ? 'التحكم المركزي التام في رموز التصميم (Tokens)، الألوان، الخطوط، حدود العناصر، وأحجام الأزرار بدقة متناهية مع الفحص التلقائي لمعايير تباين الألوان WCAG.'
              : 'Absolute central governance over design tokens, color scales, typography hierarchies, and button metrics with automatic WCAG contrast ratio auditing.'}
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/admin/settings')}
            className="h-8 flex items-center gap-1.5 px-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] text-[var(--text-primary)] text-xs font-bold transition-all cursor-pointer"
            title={isAr ? 'العودة لإعدادات النظام' : 'Return to Settings'}
          >
            <Settings size={14} />
            <span>{isAr ? 'الإعدادات' : 'Settings'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowLivePreview(!showLivePreview)}
            className={`h-8 flex items-center gap-1.5 px-3 rounded-[var(--radius-sm)] border text-xs font-bold transition-all cursor-pointer ${
              showLivePreview
                ? 'border-[var(--border-accent)] text-[var(--fg-accent)] bg-[var(--bg-accent-muted)]'
                : 'border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-muted)]'
            }`}
          >
            {showLivePreview ? <Eye size={14} /> : <EyeOff size={14} />}
            <span>{isAr ? 'المعاينة الحية' : 'Live Preview'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAuditModal(true)}
            className="h-8 flex items-center gap-1.5 px-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition-all cursor-pointer"
          >
            <ShieldCheck size={14} />
            <span>{isAr ? 'فحص الامتثال (Audit)' : 'Governance Audit'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowExportImportModal(true)}
            className="h-8 flex items-center gap-1.5 px-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] text-[var(--text-primary)] text-xs font-bold transition-all cursor-pointer"
          >
            <Download size={14} />
            <span>{isAr ? 'تصدير / استيراد' : 'Import / Export'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleReset(activeMode)}
            className="h-8 flex items-center gap-1.5 px-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] text-[var(--text-primary)] text-xs font-bold transition-all cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>{isAr ? 'استعادة الافتراضي' : 'Reset'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm(isAr ? 'هل أنت تأكد من تطهير وحذف جميع التخصيصات المحفوظة من قاعدة البيانات؟' : 'Are you sure you want to purge all custom overrides from the database?')) {
                handlePurgeDatabaseOverrides();
              }
            }}
            className="h-8 flex items-center gap-1.5 px-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-all cursor-pointer"
            title={isAr ? 'حذف وتطهير كافة التخصيصات المخزنة سلفاً' : 'Purge all pre-saved overrides from database'}
          >
            <Trash2 size={14} />
            <span>{isAr ? 'تطهير قاعدة البيانات' : 'Purge DB'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="h-8 flex items-center gap-1.5 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
            ) : (
              <Save size={14} />
            )}
            <span>{isAr ? 'تعميم وحفظ دائم' : 'Commit & Deploy'}</span>
          </button>
        </div>
      </div>

      {/* Curated Theme Presets Selector */}
      <ThemePresetsSelector
        onSelectPreset={handleSelectPreset}
        activePresetId={activePresetId}
        language={language}
      />

      {/* Mode Switcher Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5 bg-[var(--surface-subtle)] p-1 rounded-[var(--radius-sm)] border border-[var(--border-default)]">
          <button
            type="button"
            onClick={() => setActiveMode('dark')}
            className={`flex items-center gap-2 px-3 h-8 rounded-[var(--radius-xs)] font-bold text-xs transition-all cursor-pointer ${
              activeMode === 'dark'
                ? 'bg-[var(--surface-card)] text-[var(--text-primary)] shadow-xs border border-[var(--border-default)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Moon size={14} className="text-cyan-500" />
            <span>{isAr ? 'الوضع الداكن (Dark Mode)' : 'Dark Mode'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('light')}
            className={`flex items-center gap-2 px-3 h-8 rounded-[var(--radius-xs)] font-bold text-xs transition-all cursor-pointer ${
              activeMode === 'light'
                ? 'bg-[var(--surface-card)] text-[var(--text-primary)] shadow-xs border border-[var(--border-default)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Sun size={14} className="text-amber-500" />
            <span>{isAr ? 'الوضع الفاتح (Light Mode)' : 'Light Mode'}</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <Sparkles size={14} className="text-cyan-500" />
          <span>
            {isAr
              ? 'تغيير الخيارات أدناه يُطبّق بشكل حي وفوري في المتصفح'
              : 'Live real-time token injection active in viewport'}
          </span>
        </div>
      </div>

      {/* Interactive Sandbox Preview (Collapsible) */}
      {showLivePreview && (
        <LiveThemePreview
          tokens={currentTokens}
          mode={activeMode}
          language={language}
        />
      )}

      {/* DEDICATED BUTTON & CONTROLLER GOVERNANCE STUDIO */}
      <div className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-[var(--radius-md)] p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-default)] pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
              <MousePointerClick size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {isAr ? 'مختبر الأزرار وعناصر التحكم التفاعلية' : 'Interactive Buttons & Controls Lab'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isAr 
                  ? 'تخصيص كامل لأبعاد، أشكال، انحناءات، وحالات الأزرار مع اختبار حي فوري للحالات المختلفة' 
                  : 'Granular control over button heights, edge shapes, and live interaction state simulation'}
              </p>
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400 mr-1">
              {isAr ? 'قوالب سريعة:' : 'Quick Presets:'}
            </span>
            <button
              type="button"
              onClick={() => handleApplyButtonPreset('32px', '8px')}
              className="h-6 px-2 text-[10px] font-bold rounded-[var(--radius-xs)] border border-[var(--border-default)] hover:border-[var(--border-accent)] bg-[var(--surface-subtle)] text-[var(--text-primary)] transition-all cursor-pointer"
            >
              {isAr ? 'معيار بيربليكستا (Standard)' : 'Perplexta Standard'}
            </button>
            <button
              type="button"
              onClick={() => handleApplyButtonPreset('40px', '12px')}
              className="h-6 px-2 text-[10px] font-bold rounded-[var(--radius-xs)] border border-[var(--border-default)] hover:border-[var(--border-accent)] bg-[var(--surface-subtle)] text-[var(--text-primary)] transition-all cursor-pointer"
            >
              {isAr ? 'مظهر ممتد ومستدير (Comfort)' : 'Comfort Round'}
            </button>
            <button
              type="button"
              onClick={() => handleApplyButtonPreset('28px', '9999px')}
              className="h-6 px-2 text-[10px] font-bold rounded-[var(--radius-xs)] border border-[var(--border-default)] hover:border-[var(--border-accent)] bg-[var(--surface-subtle)] text-[var(--text-primary)] transition-all cursor-pointer"
            >
              {isAr ? 'بيضاوي صغير (Compact Pill)' : 'Compact Pill'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controllers Column */}
          <div className="lg:col-span-5 space-y-4">
            {/* Height Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>{isAr ? 'الارتفاع القياسي للأزرار (Button Height)' : 'Button Height'}</span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 font-bold">{selectedHeight}</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['28px', '32px', '36px', '40px'] as const).map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => handleApplyButtonPreset(h, selectedRadius)}
                    className={`h-8 font-mono text-[11px] rounded-lg border transition-all cursor-pointer ${
                      selectedHeight === h
                        ? 'border-cyan-500/30 text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Shape & Corner Radius Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>{isAr ? 'درجة الانحناء وحجم الحواف (Border Radius)' : 'Border Radius'}</span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 font-bold">{selectedRadius}</span>
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {(['4px', '6px', '8px', '12px', '9999px'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleApplyButtonPreset(selectedHeight, r)}
                    className={`h-8 font-mono text-[11px] rounded-lg border transition-all cursor-pointer ${
                      selectedRadius === r
                        ? 'border-cyan-500/30 text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {r === '4px' ? 'XS (4px)' : r === '6px' ? 'SM (6px)' : r === '8px' ? 'MD (8px)' : r === '12px' ? 'LG (12px)' : 'Pill'}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive States Simulator Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'محاكاة الحالات التفاعلية للزر:' : 'Simulate Button State:'}
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {(['idle', 'hover', 'active', 'loading', 'disabled'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setButtonState(st)}
                    className={`h-8 text-xs font-bold rounded-lg border transition-all cursor-pointer capitalize ${
                      buttonState === st
                        ? 'border-cyan-500 bg-cyan-500 text-slate-950 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {st === 'idle' ? (isAr ? 'الخمول' : 'Default') : st === 'hover' ? (isAr ? 'تحويم' : 'Hover') : st === 'active' ? (isAr ? 'ضغط' : 'Active') : st === 'loading' ? (isAr ? 'تحميل' : 'Loading') : (isAr ? 'معطل' : 'Disabled')}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 bg-[var(--surface-subtle)] rounded-[var(--radius-sm)] text-[11px] leading-relaxed text-[var(--text-muted)] flex items-start gap-2 border border-[var(--border-default)]">
              <Info size={14} className="text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
              <span>
                {isAr
                  ? 'هذه التعديلات تعيد ضبط متغيرات المظهر (--radius-sm, --btn-header-size, إلخ) وتقوم بتحديثها فوراً داخل جميع أزرار وحقول الإدخال عبر المنصة.'
                  : 'Adjusting these dimensions recalculates CSS variables such as --radius-sm, --btn-header-size, and --btn-input-size, which are seamlessly read by components.'}
              </span>
            </div>
          </div>

          {/* Sandbox Live Testing Area */}
          <div className="lg:col-span-7 bg-[var(--surface-subtle)] dark:bg-[var(--surface-panel)] border border-[var(--border-default)] rounded-xl p-5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider block mb-4">
                {isAr ? 'محيط الاختبار الفوري للمكونات (Live Component Output Sandbox)' : 'Live Interactive Button Play Area'}
              </span>

              <div className="space-y-6">
                {/* Variant Row 1: Primary vs Secondary */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-500">{isAr ? 'أزرار الإجراءات الأساسية والثانوية:' : 'Primary CTA and Secondary Actions:'}</span>
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Primary Button */}
                    <button
                      type="button"
                      disabled={buttonState === 'disabled'}
                      className={`font-bold text-xs flex items-center justify-center gap-1.5 transition-all select-none duration-150 shrink-0 ${
                        buttonState === 'hover' ? 'brightness-110 opacity-90 scale-98' : buttonState === 'active' ? 'scale-95 duration-75 brightness-90' : ''
                      }`}
                      style={{
                        height: selectedHeight,
                        borderRadius: selectedRadius,
                        backgroundColor: btnPrimaryBg,
                        color: btnPrimaryFg,
                        paddingLeft: '14px',
                        paddingRight: '14px',
                        opacity: buttonState === 'disabled' ? 0.4 : 1,
                        pointerEvents: buttonState === 'disabled' ? 'none' : 'auto',
                      }}
                    >
                      {buttonState === 'loading' && (
                        <Loader2 size={13} className="animate-spin text-slate-950" />
                      )}
                      <span>{isAr ? 'زر رئيسي (Primary CTA)' : 'Primary CTA Button'}</span>
                    </button>

                    {/* Secondary Button */}
                    <button
                      type="button"
                      disabled={buttonState === 'disabled'}
                      className={`font-bold text-xs flex items-center justify-center gap-1.5 transition-all select-none border duration-150 shrink-0 ${
                        buttonState === 'hover' ? 'brightness-110 opacity-95 scale-98' : buttonState === 'active' ? 'scale-95 duration-75 brightness-95' : ''
                      }`}
                      style={{
                        height: selectedHeight,
                        borderRadius: selectedRadius,
                        backgroundColor: btnSecondaryBg,
                        borderColor: btnSecondaryBorder,
                        color: btnSecondaryFg,
                        paddingLeft: '14px',
                        paddingRight: '14px',
                        opacity: buttonState === 'disabled' ? 0.4 : 1,
                        pointerEvents: buttonState === 'disabled' ? 'none' : 'auto',
                      }}
                    >
                      {buttonState === 'loading' && (
                        <Loader2 size={13} className="animate-spin" />
                      )}
                      <span>{isAr ? 'زر ثانوي' : 'Secondary Action'}</span>
                    </button>
                  </div>
                </div>

                {/* Variant Row 2: Danger, Status, Ghost */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-500">{isAr ? 'أزرار حالات التنبيه والحذف والرموز:' : 'Affirmative, Destructive & Compact Icon Buttons:'}</span>
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Danger Button */}
                    <button
                      type="button"
                      disabled={buttonState === 'disabled'}
                      className={`font-bold text-xs flex items-center justify-center gap-1.5 transition-all select-none duration-150 shrink-0 ${
                        buttonState === 'hover' ? 'brightness-110 opacity-95 scale-98' : buttonState === 'active' ? 'scale-95 duration-75 brightness-95' : ''
                      }`}
                      style={{
                        height: selectedHeight,
                        borderRadius: selectedRadius,
                        backgroundColor: btnDangerBg,
                        color: btnDangerFg,
                        paddingLeft: '14px',
                        paddingRight: '14px',
                        opacity: buttonState === 'disabled' ? 0.4 : 1,
                        pointerEvents: buttonState === 'disabled' ? 'none' : 'auto',
                      }}
                    >
                      {buttonState === 'loading' && (
                        <Loader2 size={13} className="animate-spin" />
                      )}
                      <span>{isAr ? 'إجراء حذف (Danger)' : 'Danger Button'}</span>
                    </button>

                    {/* Status Badge Custom */}
                    <span
                      className="px-2.5 inline-flex items-center gap-1.5 font-mono text-xs font-bold border rounded-md"
                      style={{
                        height: selectedHeight,
                        backgroundColor: 'rgba(6, 182, 212, 0.1)',
                        borderColor: 'rgba(6, 182, 212, 0.25)',
                        color: btnPrimaryBg,
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                      <span>{isAr ? 'حالة نشطة' : 'ACTIVE STATUS'}</span>
                    </span>

                    {/* Square Icon Button */}
                    <button
                      type="button"
                      disabled={buttonState === 'disabled'}
                      className={`flex items-center justify-center transition-all select-none border duration-150 shrink-0 ${
                        buttonState === 'hover' ? 'scale-105 bg-slate-200 dark:bg-slate-800' : buttonState === 'active' ? 'scale-95' : ''
                      }`}
                      style={{
                        height: selectedHeight,
                        width: selectedHeight,
                        borderRadius: selectedRadius,
                        backgroundColor: btnSecondaryBg,
                        borderColor: btnSecondaryBorder,
                        color: btnSecondaryFg,
                        opacity: buttonState === 'disabled' ? 0.4 : 1,
                        pointerEvents: buttonState === 'disabled' ? 'none' : 'auto',
                      }}
                      title="Settings Icon Button"
                    >
                      {buttonState === 'loading' ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Settings size={14} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--border-default)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span>{isAr ? 'أبعاد مرئية فعلية:' : 'Simulated Dimensions:'}</span>
              <span className="font-mono bg-[var(--surface-subtle)] px-2 py-0.5 rounded-[var(--radius-xs)] text-[10px]">
                {selectedHeight} height • {selectedRadius === '9999px' ? 'Full Pill' : `${selectedRadius} radius`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Token Search & Category Filter */}
      <TokenSearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        totalTokensCount={currentTokens ? Object.keys(currentTokens).length : 0}
        filteredCount={filteredDefinitions.length}
        language={language}
      />

      {/* Token Cards Grid */}
      {loading ? (
        <div className="p-16 text-center text-slate-500 bg-[var(--surface-card)] border border-[var(--border-default)] rounded-xl">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500 mx-auto mb-3" />
          <p className="text-xs font-semibold">
            {isAr ? 'جاري تحميل رموز ومصفوفة التصميم...' : 'Resolving design tokens from core registry...'}
          </p>
        </div>
      ) : filteredDefinitions.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-[var(--surface-card)] border border-[var(--border-default)] rounded-xl">
          <p className="text-xs">
            {isAr
              ? 'لم يتم العثور على أي رمز يطابق كلمة البحث.'
              : 'No tokens matched your search query or category filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDefinitions.map((def) => {
            const val = currentTokens[def.key] ?? '';
            const defVal = currentDefaultTokens[def.key] ?? '';

            if (def.type === 'size' || (def.options && def.options.length > 0)) {
              return (
                <TokenSliderInput
                  key={def.key}
                  definition={def}
                  value={val}
                  defaultValue={defVal}
                  onChange={(newVal) => handleTokenChange(activeMode, def.key, newVal)}
                  language={language}
                  showToast={showToast}
                />
              );
            }

            return (
              <TokenColorPicker
                key={def.key}
                definition={def}
                value={val}
                defaultValue={defVal}
                onChange={(newVal) => handleTokenChange(activeMode, def.key, newVal)}
                language={language}
                showToast={showToast}
              />
            );
          })}
        </div>
      )}

      {/* Export / Import Modal */}
      <ThemeExportImportModal
        isOpen={showExportImportModal}
        onClose={() => setShowExportImportModal(false)}
        lightTokens={lightTokens}
        darkTokens={darkTokens}
        activeMode={activeMode}
        onImportTokens={handleImportTokens}
        language={language}
        showToast={showToast}
      />

      {/* Design System Governance Audit Modal */}
      <ThemeAuditModal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
        lightTokens={lightTokens}
        darkTokens={darkTokens}
        language={language}
      />
    </div>
  );
};
