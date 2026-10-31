import React, { useState } from 'react';
import { History, RotateCcw, X, Clock, Plus, Check } from 'lucide-react';

export interface StudioVersionSnapshot {
  id: string;
  timestamp: string;
  label: string;
  filesCount: number;
}

interface StudioVersionsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  snapshots: StudioVersionSnapshot[];
  onRestoreSnapshot: (snapshotId: string) => void;
  onCreateSnapshot?: (label: string) => void;
  language?: 'ar' | 'en';
}

export const StudioVersionsPanel: React.FC<StudioVersionsPanelProps> = ({
  isOpen,
  onClose,
  snapshots,
  onRestoreSnapshot,
  onCreateSnapshot,
  language = 'ar'
}) => {
  const [newLabel, setNewLabel] = useState('');
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);
  const isAr = language === 'ar';

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onCreateSnapshot) return;
    const label = newLabel.trim() || (isAr ? `نسخة محفوظة #${snapshots.length + 1}` : `Snapshot #${snapshots.length + 1}`);
    onCreateSnapshot(label);
    setNewLabel('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 font-sans">
      <div className="w-full max-w-md bg-[var(--surface-card)] border border-[var(--border-default)] rounded-shape-md shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
            <History size={18} className="text-blue-500" />
            <span>{isAr ? 'سجل الإصدارات والنسخ الاحتياطية' : 'Version History & Snapshots'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-shape-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Create New Snapshot Form */}
        {onCreateSnapshot && (
          <form onSubmit={handleCreate} className="p-3 bg-[var(--surface-subtle)] border-b border-[var(--border-default)] flex items-center gap-2">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder={isAr ? 'تسمية الإصدار الحالي (اختياري)...' : 'Label current version (optional)...'}
              className="flex-1 px-3 py-1.5 text-xs bg-[var(--surface-card)] border border-[var(--border-default)] rounded-shape-xs text-[var(--text-primary)] outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-shape-xs bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Plus size={13} />
              <span>{isAr ? 'حفظ لقطة' : 'Save Snapshot'}</span>
            </button>
          </form>
        )}

        {/* Snapshots List */}
        <div className="p-4 overflow-y-auto max-h-[55vh] space-y-2 custom-scrollbar">
          {snapshots.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--text-muted)]">
              {isAr ? 'لا توجد إصدارات سابقة محفوظة بعد' : 'No previous version snapshots saved yet'}
            </div>
          ) : (
            snapshots.map((snap, idx) => {
              const isConfirming = confirmRestoreId === snap.id;
              return (
                <div
                  key={snap.id}
                  className="flex items-center justify-between p-3 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-[var(--text-primary)] truncate">{snap.label}</p>
                      {idx === 0 && (
                        <span className="px-1.5 py-0.5 rounded-shape-full bg-blue-500/10 text-blue-500 text-[9px] font-bold">
                          {isAr ? 'الأحدث' : 'Latest'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {snap.timestamp}
                      </span>
                      <span>• {snap.filesCount} {isAr ? 'ملفات' : 'files'}</span>
                    </div>
                  </div>

                  {isConfirming ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          onRestoreSnapshot(snap.id);
                          setConfirmRestoreId(null);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded-shape-xs bg-green-600 text-white font-bold hover:bg-green-500 flex items-center gap-1 cursor-pointer"
                      >
                        <Check size={12} />
                        <span>{isAr ? 'تأكيد' : 'Confirm'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmRestoreId(null)}
                        className="px-2 py-1 rounded-shape-xs bg-[var(--surface-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                      >
                        {isAr ? 'إلغاء' : 'Cancel'}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmRestoreId(snap.id)}
                      className="px-2.5 py-1 rounded-shape-xs bg-blue-500/10 border border-blue-500/20 text-blue-500 font-bold hover:bg-blue-500/20 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <RotateCcw size={12} />
                      <span>{isAr ? 'استعادة' : 'Restore'}</span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
