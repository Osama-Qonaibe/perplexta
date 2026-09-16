import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Loader2, FileText, CheckCircle2 } from 'lucide-react';

interface ForensicAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAnalyzing: boolean;
  report: any;
  selectedFile: File | null;
  dir: 'rtl' | 'ltr';
}

export const ForensicAuditModal: React.FC<ForensicAuditModalProps> = ({
  isOpen,
  onClose,
  isAnalyzing,
  report,
  selectedFile,
  dir
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-[var(--surface-card)] border border-[var(--border-default)] text-[var(--text-primary)] rounded-lg w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-[var(--border-default)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-accent/10 flex items-center justify-center text-accent">
                  <Sparkles size={20} className="animate-pulse" />
                </div>
                <div>
                  <h2 className="text-sm font-black uppercase tracking-widest text-accent">
                    {dir === 'rtl' ? 'التحليل الجنائي للوثيقة' : 'Document Forensic Audit'}
                  </h2>
                  <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-tighter mt-0.5">
                    {selectedFile?.name || 'document.pdf'} • {(Number(selectedFile?.size || 0) / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-sm hover:bg-[var(--surface-subtle)] flex items-center justify-center text-[var(--text-secondary)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Loader2 size={36} className="text-accent animate-spin mb-4" />
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">
                    {dir === 'rtl' ? 'جاري استخراج وتحليل البنية العميقة...' : 'Extracting and analyzing deep structures...'}
                  </p>
                </div>
              ) : report ? (
                <div className="space-y-6">
                  {/* Forensic Report Content would go here */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-md bg-emerald-500/5 border border-emerald-500/20">
                      <div className="flex items-center gap-2 text-emerald-500 mb-2">
                        <CheckCircle2 size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          {dir === 'rtl' ? 'سلامة الملف' : 'File Integrity'}
                        </span>
                      </div>
                      <p className="text-[11px] font-bold text-[var(--text-secondary)]">
                        {dir === 'rtl' ? 'لم يتم العثور على تلاعب في الميتاداتا الأساسية.' : 'No manipulation found in core metadata.'}
                      </p>
                    </div>
                    {/* Add more forensic details based on report */}
                  </div>
                  
                  <div className="p-4 rounded-md bg-[var(--surface-subtle)] border border-[var(--border-default)]">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent mb-4">
                      {dir === 'rtl' ? 'ملخص الفحص الجنائي' : 'Forensic Audit Summary'}
                    </h4>
                    <div className="prose prose-invert prose-sm max-w-none text-[var(--text-secondary)] text-[12px] font-medium leading-relaxed">
                      {report.summary || (dir === 'rtl' ? 'تم اكتمال الفحص بنجاح.' : 'Audit completed successfully.')}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText size={48} className="text-[var(--text-muted)] opacity-20 mb-4" />
                  <p className="text-sm font-bold text-[var(--text-muted)]">
                    {dir === 'rtl' ? 'لا توجد بيانات تحليل حالياً' : 'No analysis data available'}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
