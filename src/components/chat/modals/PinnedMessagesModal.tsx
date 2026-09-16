import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Pin, Bookmark, PinOff, Copy } from 'lucide-react';
import Markdown from 'react-markdown';
import { Message } from '../types';
import { toast } from '@/design-system';
import { stripProtocolMarkers } from '../../../utils/chatUtils';

interface PinnedMessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  dir: 'rtl' | 'ltr';
  onUnpin: (messageId: number) => void;
}

export const PinnedMessagesModal: React.FC<PinnedMessagesModalProps> = ({
  isOpen,
  onClose,
  messages,
  dir,
  onUnpin
}) => {
  const pinnedMessages = messages.filter(m => m.is_pinned);

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
            className="bg-[var(--surface-card)] border border-[var(--border-default)] text-[var(--text-primary)] rounded-lg w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-[var(--border-default)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-accent/10 flex items-center justify-center text-accent">
                  <Bookmark size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-black uppercase tracking-widest">
                    {dir === 'rtl' ? 'الرسائل المثبتة' : 'Pinned Messages'}
                  </h2>
                  <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-tighter mt-0.5">
                    {pinnedMessages.length} {dir === 'rtl' ? 'رسائل محفوظة' : 'saved messages'}
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-sm hover:bg-[var(--bg-overlay)] flex items-center justify-center text-[var(--text-secondary)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {pinnedMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Pin size={32} className="text-[var(--text-muted)] opacity-35 mb-3 animate-pulse text-accent/40" />
                  <p className="text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    {dir === 'rtl' ? 'لا توجد رسائل مثبتة حالياً' : 'No pinned messages yet'}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1 max-w-[280px] leading-relaxed">
                    {dir === 'rtl' ? 'ثبّت الرسائل المهمة في المحادثة لتبقى محفوظة هنا.' : 'Pin important questions or responses to view them in this list.'}
                  </p>
                </div>
              ) : (
                pinnedMessages.map((msg, pIdx) => (
                  <div key={`pinned-msg-${msg.id || pIdx}-${pIdx}`} className="group relative p-4 rounded-md bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:border-accent/30 transition-theme">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-accent">
                        {msg.role === 'user' ? (dir === 'rtl' ? 'البرومبت' : 'Your Prompt') : (dir === 'rtl' ? 'إجابة بيربليكستا' : 'Perplexta Answer')}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(stripProtocolMarkers(msg.content));
                            toast.success(dir === 'rtl' ? 'تم نسخ النص بنجاح' : 'Copied successfully');
                          }}
                          className="text-gray-400 hover:text-accent transition-theme p-1.5 rounded-sm hover:bg-[var(--bg-overlay)] cursor-pointer"
                          title={dir === 'rtl' ? 'نسخ' : 'Copy'}
                        >
                          <Copy size={12} />
                        </button>
                        <button
                          onClick={() => msg.id && onUnpin(msg.id)}
                          className="text-gray-400 hover:text-accent transition-theme p-1.5 rounded-sm hover:bg-[var(--bg-overlay)] cursor-pointer"
                          title={dir === 'rtl' ? 'إلغاء التثبيت' : 'Unpin'}
                        >
                          <PinOff size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="markdown-body prose text-[13px] line-clamp-6 text-[var(--text-secondary)]">
                      <Markdown>{stripProtocolMarkers(msg.content)}</Markdown>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
