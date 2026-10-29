import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BrainCircuit, Plus, Trash2, Edit2, Save, X, Loader2, Info, User, AlertTriangle, Sparkles, MessageSquare, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { ActionConfirmationModal } from './ActionConfirmationModal';
import { toast, SelectDropdown } from '@/design-system';

interface Memory {
  id: number;
  fact: string;
  category: string;
  source: 'user' | 'ai' | 'consolidated';
  created_at: string;
  updated_at: string;
  chat_id?: number | string;
  chat_title?: string;
}

interface MemoryCenterProps {
  memories: Memory[];
  isLoading: boolean;
  onAdd: (fact: string, category?: string) => Promise<void>;
  onUpdate: (id: number, fact: string, category?: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onPrune?: () => Promise<void>;
  onRefresh?: () => void;
  dir: 'rtl' | 'ltr';
  theme: 'dark' | 'light' | 'system';
  stickyOffset?: number;
}

export const MemoryCenter: React.FC<MemoryCenterProps> = ({ 
  memories, 
  isLoading, 
  onAdd, 
  onUpdate, 
  onDelete, 
  onPrune,
  onRefresh,
  dir, 
  theme,
  stickyOffset = 0
}) => {
  const { t } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);
  const [newValue, setNewValue] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editCategory, setEditCategory] = useState('general');
  const [isPruning, setIsPruning] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [isPruneConfirmOpen, setIsPruneConfirmOpen] = useState(false);
  const [deletingMemory, setDeletingMemory] = useState<Memory | null>(null);

  const categories = [
    { id: 'all', label: t('all') || (dir === 'rtl' ? 'الكل' : 'All') },
    { id: 'identity', label: t('identity') || (dir === 'rtl' ? 'الهوية والشخصية' : 'Identity & Personal') },
    { id: 'technical', label: t('technical') || (dir === 'rtl' ? 'بيئة وتقنيات العمل' : 'Tech Stack') },
    { id: 'preference', label: t('preference') || (dir === 'rtl' ? 'التفضيلات والقواعد' : 'Preferences & Rules') },
    { id: 'project', label: t('project') || (dir === 'rtl' ? 'المشاريع الحالية' : 'Active Projects') },
    { id: 'professional', label: t('professional') || (dir === 'rtl' ? 'المهنة والدور' : 'Role & Profession') },
    { id: 'general', label: t('general') || (dir === 'rtl' ? 'حقائق عامة' : 'General Facts') },
  ];

  const filteredMemories = filterCategory === 'all' 
    ? memories 
    : memories.filter(m => {
        if (filterCategory === 'identity' && (m.category === 'personal' || m.category === 'identity')) return true;
        return m.category === filterCategory;
      });

  const MEMORY_LIMIT = 50;
  const memoryCount = memories.length;
  const isLimitReached = memoryCount >= MEMORY_LIMIT;
  const usagePercentage = Math.min(100, (memoryCount / MEMORY_LIMIT) * 100);

  const handleSaveNew = async () => {
    if (!newValue.trim()) return;
    if (isLimitReached) {
      toast.error(t('memoryLimitReached') || 'Memory limit reached');
      return;
    }
    await onAdd(newValue, newCategory);
    setNewValue('');
    setIsAdding(false);
  };

  const handlePrune = () => {
    if (!onPrune) return;
    setIsPruneConfirmOpen(true);
  };

  const handlePruneConfirm = async () => {
    setIsPruneConfirmOpen(false);
    if (!onPrune) return;
    setIsPruning(true);
    try {
      await onPrune();
    } finally {
      setIsPruning(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingMemory) return;
    try {
      await onDelete(deletingMemory.id);
    } finally {
      setDeletingMemory(null);
    }
  };

  const handleSaveEdit = async (id: number) => {
    if (!editValue.trim()) return;
    await onUpdate(id, editValue, editCategory);
    setEditingId(null);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-12">
      {/* Unified Sovereign Header & Capacity Card (Prevents Mobile Sticky Clipping) */}
      <div className="ide-card p-3.5 sm:p-6 rounded-shape-md border border-[var(--border-default)] bg-[var(--surface-card)] shadow-xs space-y-3.5">
        <div className="flex items-center justify-between gap-2.5 pb-3 border-b border-[var(--border-default)]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-shape-sm bg-[var(--bg-accent-muted)] border border-[var(--border-accent)]/20 text-[var(--fg-accent)] shrink-0 flex items-center justify-center">
              <BrainCircuit size={16} />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[var(--text-primary)] truncate">
                {t('memoryCenter') || (dir === 'rtl' ? 'مركز الذاكرة' : 'Memory Center')}
              </h2>
              <p className="text-[10px] text-[var(--text-muted)] font-bold truncate">
                {dir === 'rtl' 
                  ? 'الحقائق والتفضيلات التي تعلمها المساعد عنك' 
                  : 'Facts and preferences learned about you'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {onRefresh && (
              <button 
                type="button"
                onClick={onRefresh}
                disabled={isLoading}
                title={dir === 'rtl' ? 'مزامنة وتحديث الذاكرة' : 'Sync & Refresh Memory'}
                className="w-8 h-8 flex items-center justify-center rounded-shape-sm border border-[var(--border-default)] bg-[var(--surface-subtle)]/60 hover:bg-[var(--surface-subtle)] hover:border-[var(--border-accent)]/40 text-[var(--text-secondary)] hover:text-[var(--fg-accent)] active:scale-95 transition-all cursor-pointer"
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin text-[var(--fg-accent)]' : ''} />
              </button>
            )}
            <button 
              type="button"
              onClick={() => setIsAdding(true)}
              className="h-8 px-3 bg-[var(--comp-button-primary-bg)] hover:opacity-90 text-[var(--fg-on-emphasis)] rounded-shape-sm font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <Plus size={14} />
              <span>{t('addFact') || (dir === 'rtl' ? 'إضافة حقيقة' : 'Add Fact')}</span>
            </button>
          </div>
        </div>

        {/* Memory Capacity Indicator */}
        <div 
          className={`p-3 rounded-shape-sm border transition-all ${
            isLimitReached 
              ? 'bg-[var(--surface-subtle)] border-[var(--fg-warning)]/30'
              : 'bg-[var(--surface-subtle)] border-[var(--border-default)]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-primary)]">
                {t('memoryCapacity') || (dir === 'rtl' ? 'سعة الذاكرة' : 'Memory Capacity')}
              </span>
              <span className="px-2 py-0.5 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-default)] text-[10px] text-[var(--fg-accent)] font-mono font-bold">
                {memoryCount} / {MEMORY_LIMIT} {dir === 'rtl' ? 'حقائق' : 'facts'}
              </span>
            </div>
            
            {isLimitReached && (
              <button 
                type="button"
                onClick={handlePrune}
                disabled={isPruning}
                className="h-8 px-3 bg-[var(--surface-card)] text-[var(--fg-warning)] rounded-shape-xs text-[10px] font-bold border border-[var(--border-default)] flex items-center justify-center gap-1 cursor-pointer transition-all"
              >
                {isPruning ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                <span>{t('prune') || (dir === 'rtl' ? 'تنظيف' : 'Prune')}</span>
              </button>
            )}
          </div>

          <div className="w-full h-1.5 bg-[var(--surface-card)] rounded-shape-full overflow-hidden border border-[var(--border-default)]">
            <motion.div 
              className="h-full rounded-shape-full bg-[var(--accent)]"
              initial={{ width: 0 }}
              animate={{ width: `${usagePercentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>

          {isLimitReached && (
            <div className="mt-2 flex items-start gap-1">
              <AlertTriangle size={12} className="text-[var(--fg-warning)] shrink-0 mt-0.5" />
              <p className="text-[10px] text-[var(--fg-warning)] leading-relaxed font-medium">
                {dir === 'rtl' 
                  ? 'وصلت للحد الأقصى. يرجى تنظيف الذاكرة للمتابعة.' 
                  : 'Memory full. Please prune to continue.'}
              </p>
            </div>
          )}
        </div>

        {/* Category Filter Chips (Hidden Scrollbar, Strict h-8 Standard) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-pan-x pt-0.5">
          {categories.map((cat, cIdx) => (
            <button
              key={`mem-cat-btn-${cat.id}-${cIdx}`}
              type="button"
              onClick={() => setFilterCategory(cat.id)}
              className={`h-8 px-3 rounded-shape-xs text-[10px] sm:text-[11px] font-bold whitespace-nowrap shrink-0 flex items-center justify-center transition-all cursor-pointer border ${
                filterCategory === cat.id
                  ? 'bg-[var(--bg-accent-muted)] text-[var(--fg-accent)] border-[var(--border-accent)]/30 shadow-2xs'
                  : 'bg-[var(--surface-subtle)]/60 border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Auto-update Indicator */}
      <div className="p-3.5 rounded-shape-md border border-[var(--border-accent)]/20 bg-[var(--bg-accent-muted)] flex items-start gap-2.5">
        <Info className="text-[var(--fg-accent)] shrink-0 mt-0.5" size={15} />
        <p className="text-[11px] sm:text-xs text-[var(--text-muted)] leading-relaxed font-medium">
          {dir === 'rtl' 
            ? 'يقوم المساعد بتحديث هذه الذاكرة تلقائياً (AI)، ويمكنك إضافة حقائق بنفسك (User).' 
            : 'Assistant updates memory automatically (AI), or you can add facts manually (User).'}
        </p>
      </div>

      {/* Add New Memory Card */}
      {isAdding && (
        <div className="p-4 sm:p-5 rounded-shape-md border border-[var(--border-default)] bg-[var(--surface-card)] space-y-3 shadow-xs">
          <div className="flex gap-3">
            <div className="flex-1">
              <SelectDropdown
                size="sm"
                label={t('category') || (dir === 'rtl' ? 'التصنيف' : 'Category')}
                value={newCategory}
                onChange={(val) => setNewCategory(val)}
                dir={dir}
                options={categories.filter(c => c.id !== 'all').map(cat => ({
                  value: cat.id,
                  label: cat.label
                }))}
              />
            </div>
          </div>
          <textarea
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder={dir === 'rtl' ? 'ما الذي يجب أن يتذكره المساعد؟' : 'What should the assistant remember?'}
            className="w-full p-3 rounded-shape-sm border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-accent)] resize-none min-h-[88px] text-xs"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button 
              type="button"
              onClick={() => { setIsAdding(false); setNewValue(''); }}
              className="h-8 px-3.5 rounded-shape-sm border border-[var(--border-default)] text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] flex items-center justify-center transition-all cursor-pointer"
            >
              {t('cancel') || (dir === 'rtl' ? 'إلغاء' : 'Cancel')}
            </button>
            <button 
              type="button"
              onClick={handleSaveNew}
              disabled={!newValue.trim()}
              className="h-8 px-4 rounded-shape-sm text-xs font-bold bg-[var(--comp-button-primary-bg)] hover:opacity-90 text-[var(--comp-button-primary-fg)] flex items-center justify-center transition-all disabled:opacity-50 cursor-pointer"
            >
              {t('save') || (dir === 'rtl' ? 'حفظ' : 'Save')}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 rounded-shape-md border border-[var(--border-default)] bg-[var(--surface-card)]">
          <Loader2 className="w-7 h-7 text-[var(--fg-accent)] animate-spin" />
          <p className="text-xs font-bold text-[var(--text-muted)] animate-pulse">{t('loadingMemory') || (dir === 'rtl' ? 'جاري تحميل الذاكرة...' : 'Loading memory...')}</p>
        </div>
      ) : filteredMemories.length === 0 ? (
        <div className="p-8 sm:p-10 rounded-shape-md border border-dashed border-[var(--border-default)] bg-[var(--surface-card)] flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-shape-sm bg-[var(--bg-accent-muted)] text-[var(--fg-accent)] border border-[var(--border-accent)]/20 flex items-center justify-center mb-3">
            <BrainCircuit size={20} />
          </div>
          <h3 className="text-xs sm:text-sm font-bold mb-1 text-[var(--text-primary)]">{t('noResults') || (dir === 'rtl' ? 'لا توجد عناصر' : 'No memories found')}</h3>
          <p className="text-[11px] text-[var(--text-muted)] max-w-sm leading-relaxed">
            {dir === 'rtl' 
              ? 'لا توجد حقائق في هذا التصنيف حالياً.' 
              : 'No facts found in this category yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMemories.map((memory, mIdx) => (
            <div 
              key={`mem-item-${memory.id || mIdx}-${mIdx}`} 
              className="group p-3.5 sm:p-5 rounded-shape-md border border-[var(--border-default)] bg-[var(--surface-card)] hover:border-[var(--border-accent)]/20 transition-all shadow-xs"
            >
              {editingId === memory.id ? (
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <SelectDropdown
                        size="sm"
                        value={editCategory}
                        onChange={(val) => setEditCategory(val)}
                        dir={dir}
                        options={categories.filter(c => c.id !== 'all').map(cat => ({
                          value: cat.id,
                          label: cat.label
                        }))}
                      />
                    </div>
                  </div>
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full p-3 rounded-shape-sm border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-accent)] resize-none min-h-[88px] text-xs"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button 
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="h-8 px-3 rounded-shape-sm border border-[var(--border-default)] text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <X size={13} />
                      <span>{t('cancel') || (dir === 'rtl' ? 'إلغاء' : 'Cancel')}</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleSaveEdit(memory.id)}
                      disabled={!editValue.trim()}
                      className="h-8 px-3.5 bg-[var(--comp-button-primary-bg)] hover:opacity-90 text-[var(--comp-button-primary-fg)] rounded-shape-sm text-xs font-bold flex items-center justify-center gap-1 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <Save size={13} />
                      <span>{t('save') || (dir === 'rtl' ? 'حفظ' : 'Save')}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-shape-xs bg-[var(--bg-accent-muted)] text-[var(--fg-accent)] border border-[var(--border-accent)]/20 text-[9px] font-bold uppercase tracking-wider">
                        {memory.source === 'user' ? <User size={10} /> : memory.source === 'consolidated' ? <Sparkles size={10} /> : <BrainCircuit size={10} />}
                        <span>
                          {memory.source === 'user'
                            ? (dir === 'rtl' ? 'بواسطة المستخدم' : 'User Added')
                            : memory.source === 'consolidated'
                              ? (dir === 'rtl' ? 'ملخص مدمج' : 'Consolidated')
                              : (dir === 'rtl' ? 'تعلم آلي' : 'AI Learned')}
                        </span>
                      </span>
                      <span className="px-2 py-0.5 rounded-shape-xs text-[9px] font-bold uppercase tracking-wider bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-muted)]">
                        {categories.find(c => c.id === memory.category)?.label || memory.category}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap text-[var(--text-primary)] font-medium" dir="auto">
                      {memory.fact}
                    </p>
                    <div className="text-[10px] text-[var(--text-muted)] mt-2 flex items-center flex-wrap gap-1">
                      <span>
                        {new Date(memory.created_at).toLocaleString(dir === 'rtl' ? 'ar-EG' : 'en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {memory.updated_at !== memory.created_at && (
                        <>
                          <span className="opacity-40">•</span>
                          <span>{dir === 'rtl' ? 'تم التعديل' : 'Updated'}</span>
                        </>
                      )}
                      {memory.chat_id && (
                        <>
                          <span className="opacity-40">•</span>
                          <Link 
                            to={`/chat/${memory.chat_id}`}
                            className="inline-flex items-center gap-1 text-[var(--fg-accent)] hover:underline font-bold"
                            title={dir === 'rtl' ? 'انتقال إلى المحادثة المصدر' : 'Go to source thread'}
                          >
                            <MessageSquare size={10} />
                            <span>
                              {dir === 'rtl' ? 'المصدر: ' : 'Source: '}
                              "{memory.chat_title || `#${memory.chat_id}`}"
                            </span>
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button 
                      type="button"
                      onClick={() => {
                        setEditingId(memory.id);
                        setEditValue(memory.fact);
                        setEditCategory(memory.category);
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-shape-xs border border-[var(--border-default)] bg-[var(--surface-subtle)]/50 text-[var(--text-muted)] hover:text-[var(--fg-accent)] hover:bg-[var(--bg-accent-muted)] transition-all cursor-pointer"
                      title={dir === 'rtl' ? 'تعديل' : 'Edit'}
                    >
                      <Edit2 size={13} />
                    </button>
                    <button 
                      type="button"
                      onClick={() => setDeletingMemory(memory)}
                      className="w-8 h-8 flex items-center justify-center rounded-shape-xs border border-[var(--border-default)] bg-[var(--surface-subtle)]/50 text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                      title={dir === 'rtl' ? 'حذف' : 'Delete'}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reusable Memory Prune Confirmation Modal */}
      <ActionConfirmationModal
        isOpen={isPruneConfirmOpen}
        onClose={() => setIsPruneConfirmOpen(false)}
        onConfirm={handlePruneConfirm}
        variant="danger"
        title={{
          ar: 'تطهير سعة الذاكرة؟',
          en: 'Prune Memory Capacity?'
        }}
        description={{
          ar: 'سيتم حذف أقدم 10 حقائق أو معلومات مسجلة كليا لتحرير سعة إضافية بشكل فوري. لا يمكن التراجع عن هذا الإجراء.',
          en: 'This will permanently discard the 10 oldest remembered facts or settings to reclaim storage immediately. This process cannot be undone.'
        }}
        confirmLabel={{
          ar: 'تطهير وتحرير السعة',
          en: 'Prune & Reclaim'
        }}
      />

      {/* Reusable Individual Memory Delete Confirmation Modal */}
      <ActionConfirmationModal
        isOpen={!!deletingMemory}
        onClose={() => setDeletingMemory(null)}
        onConfirm={handleDeleteConfirm}
        variant="danger"
        title={{
          ar: 'حذف هذه الحقيقة؟',
          en: 'Delete this fact?'
        }}
        description={{
          ar: 'هل أنت متأكد من رغبتك في إزالة هذه الحقيقة المعينة من ذاكرة المساعد الذكي؟',
          en: 'Are you sure you want to discard this specific fact from the smart assistant\'s memory base?'
        }}
        extraContent={deletingMemory ? (
          <div className="p-3 rounded-shape-sm text-xs leading-relaxed break-all text-start border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] italic">
            "{deletingMemory.fact}"
          </div>
        ) : undefined}
      />
    </div>
  );
};

