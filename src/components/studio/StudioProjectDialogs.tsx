import React, { useState, useEffect } from 'react';
import { FilePlus, Edit2, Trash2, X, AlertTriangle } from 'lucide-react';

interface NewFileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFile: (fileName: string) => void;
  language?: 'ar' | 'en';
}

export const StudioNewFileDialog: React.FC<NewFileDialogProps> = ({
  isOpen,
  onClose,
  onCreateFile,
  language = 'ar'
}) => {
  const [fileName, setFileName] = useState('');
  const isAr = language === 'ar';

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fileName.trim()) {
      onCreateFile(fileName.trim());
      setFileName('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 font-sans">
      <div className="w-full max-w-sm bg-[var(--surface-card)] border border-[var(--border-default)] rounded-shape-md shadow-2xl p-4 space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2">
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
            <FilePlus size={16} className="text-blue-500" />
            <span>{isAr ? 'إنشاء ملف جديد' : 'Create New File'}</span>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-shape-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              {isAr ? 'اسم ومسار الملف (مثال: app.js أو styles.css)' : 'File Name (e.g. app.js, styles.css)'}
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="script.js"
              autoFocus
              dir="ltr"
              className="w-full px-3 py-1.5 text-xs bg-[var(--surface-subtle)] border border-[var(--border-default)] rounded-shape-xs text-[var(--text-primary)] outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-shape-xs bg-[var(--surface-subtle)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={!fileName.trim()}
              className="px-4 py-1.5 rounded-shape-xs bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs disabled:opacity-40 cursor-pointer shadow-xs"
            >
              {isAr ? 'إنشاء الملف' : 'Create File'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface RenameDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  title?: string;
  onRename: (newName: string) => void;
  language?: 'ar' | 'en';
}

export const StudioRenameDialog: React.FC<RenameDialogProps> = ({
  isOpen,
  onClose,
  currentName,
  title,
  onRename,
  language = 'ar'
}) => {
  const [name, setName] = useState(currentName);
  const isAr = language === 'ar';

  useEffect(() => {
    setName(currentName);
  }, [currentName, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && name.trim() !== currentName) {
      onRename(name.trim());
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 font-sans">
      <div className="w-full max-w-sm bg-[var(--surface-card)] border border-[var(--border-default)] rounded-shape-md shadow-2xl p-4 space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2">
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
            <Edit2 size={16} className="text-blue-500" />
            <span>{title || (isAr ? 'إعادة التسمية' : 'Rename')}</span>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-shape-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            className="w-full px-3 py-1.5 text-xs bg-[var(--surface-subtle)] border border-[var(--border-default)] rounded-shape-xs text-[var(--text-primary)] outline-none focus:border-blue-500"
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-shape-xs bg-[var(--surface-subtle)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-1.5 rounded-shape-xs bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs disabled:opacity-40 cursor-pointer shadow-xs"
            >
              {isAr ? 'حفظ' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  targetName: string;
  requireNameVerification?: boolean;
  onConfirmDelete: () => void;
  language?: 'ar' | 'en';
}

export const StudioDeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  onClose,
  targetName,
  requireNameVerification = false,
  onConfirmDelete,
  language = 'ar'
}) => {
  const [typedName, setTypedName] = useState('');
  const isAr = language === 'ar';

  useEffect(() => {
    if (!isOpen) setTypedName('');
  }, [isOpen]);

  if (!isOpen) return null;

  const canDelete = !requireNameVerification || typedName.trim() === targetName.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 font-sans">
      <div className="w-full max-w-sm bg-[var(--surface-card)] border border-[var(--border-default)] rounded-shape-md shadow-2xl p-4 space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2">
          <div className="flex items-center gap-2 text-sm font-bold text-red-500">
            <Trash2 size={16} />
            <span>{isAr ? 'تأكيد الحذف النهائي' : 'Confirm Permanent Deletion'}</span>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-shape-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">
            <X size={15} />
          </button>
        </div>

        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          {isAr ? (
            <>
              هل أنت متأكد من حذف <strong className="text-[var(--text-primary)]">{targetName}</strong>؟ لا يمكن التراجع عن هذا الإجراء.
            </>
          ) : (
            <>
              Are you sure you want to delete <strong className="text-[var(--text-primary)]">{targetName}</strong>? This action cannot be undone.
            </>
          )}
        </p>

        {requireNameVerification && (
          <div className="space-y-1.5">
            <label className="block text-[11px] text-[var(--text-muted)]">
              {isAr ? `اكتب "${targetName}" لتأكيد الحذف:` : `Type "${targetName}" to confirm:`}
            </label>
            <input
              type="text"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder={targetName}
              className="w-full px-3 py-1.5 text-xs bg-[var(--surface-subtle)] border border-red-500/30 rounded-shape-xs text-[var(--text-primary)] outline-none focus:border-red-500"
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-shape-xs bg-[var(--surface-subtle)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            type="button"
            disabled={!canDelete}
            onClick={() => {
              if (!canDelete) return;
              onConfirmDelete();
              onClose();
            }}
            className="px-4 py-1.5 rounded-shape-xs bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold text-xs cursor-pointer shadow-xs"
          >
            {isAr ? 'حذف نهائي' : 'Delete Permanently'}
          </button>
        </div>
      </div>
    </div>
  );
};
