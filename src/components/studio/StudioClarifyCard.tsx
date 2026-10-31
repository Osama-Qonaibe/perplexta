import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X, Check } from 'lucide-react';

export interface StudioQuestionOption {
  id: string;
  label: string;
  recommended?: boolean;
}

export interface StudioClarifyQuestion {
  id: string;
  question: string;
  options: StudioQuestionOption[];
  isMultiSelect?: boolean;
}

interface StudioClarifyCardProps {
  questions: StudioClarifyQuestion[];
  leadIn?: string;
  onSubmitAnswers: (answers: Record<string, string[]>) => void;
  onSkip?: () => void;
  language?: string;
}

export const StudioClarifyCard: React.FC<StudioClarifyCardProps> = ({
  questions,
  leadIn,
  onSubmitAnswers,
  onSkip,
  language = 'ar'
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string[]>>({});
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [activeOptionIdx, setActiveOptionIdx] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);
  const isAr = language === 'ar';

  const currentQuestion = questions[currentIdx];

  useEffect(() => {
    setActiveOptionIdx(0);
  }, [currentIdx]);

  if (!questions || questions.length === 0 || !currentQuestion) return null;

  const isLastStep = currentIdx >= questions.length - 1;

  const finalizeWithAnswers = (updatedAnswers: Record<string, string[]>) => {
    const finalAnswers: Record<string, string[]> = { ...updatedAnswers };
    for (const q of questions) {
      const typed = customInputs[q.id]?.trim();
      if (typed && (!finalAnswers[q.id] || finalAnswers[q.id].length === 0)) {
        finalAnswers[q.id] = [typed];
      }
    }
    onSubmitAnswers(finalAnswers);
  };

  const selectAnswerAndAdvance = (qId: string, answerText: string) => {
    const trimmed = String(answerText || '').trim();
    if (!trimmed) return;
    const updated = {
      ...selectedAnswers,
      [qId]: [trimmed]
    };
    setSelectedAnswers(updated);

    if (currentIdx < questions.length - 1) {
      setTimeout(() => {
        setCurrentIdx(idx => Math.min(questions.length - 1, idx + 1));
      }, 110);
    } else {
      setTimeout(() => {
        finalizeWithAnswers(updated);
      }, 110);
    }
  };

  const handleCustomAction = () => {
    const qId = currentQuestion.id;
    const typed = (customInputs[qId] || '').trim();
    if (typed) {
      selectAnswerAndAdvance(qId, typed);
      return;
    }

    // If user didn't type anything in custom input:
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(idx => idx + 1);
    } else {
      // On the last step, if any question was answered, submit; otherwise skip
      const hasAnyAnswer = Object.values(selectedAnswers).some(arr => arr && arr.length > 0);
      if (hasAnyAnswer) {
        finalizeWithAnswers(selectedAnswers);
      } else if (onSkip) {
        onSkip();
      } else {
        finalizeWithAnswers(selectedAnswers);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const targetTag = (e.target as HTMLElement)?.tagName;
    if (targetTag === 'INPUT' || targetTag === 'TEXTAREA') {
      if (e.key === 'Escape') {
        e.preventDefault();
        (e.target as HTMLElement).blur();
      }
      return;
    }

    const opts = currentQuestion.options;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveOptionIdx(i => (i + 1) % opts.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveOptionIdx(i => (i - 1 + opts.length) % opts.length);
    } else if (e.key === 'ArrowRight' && currentIdx < questions.length - 1) {
      e.preventDefault();
      setCurrentIdx(i => i + 1);
    } else if (e.key === 'ArrowLeft' && currentIdx > 0) {
      e.preventDefault();
      setCurrentIdx(i => i - 1);
    } else if (e.key === 'Enter' && opts[activeOptionIdx]) {
      e.preventDefault();
      selectAnswerAndAdvance(currentQuestion.id, opts[activeOptionIdx].label);
    } else if (e.key === 'Escape' && onSkip) {
      e.preventDefault();
      onSkip();
    } else if (/^[1-9]$/.test(e.key)) {
      const idx = parseInt(e.key, 10) - 1;
      if (idx < opts.length) {
        e.preventDefault();
        selectAnswerAndAdvance(currentQuestion.id, opts[idx].label);
      } else if (idx === opts.length) {
        e.preventDefault();
        customInputRef.current?.focus();
      }
    }
  };

  const currentCustomVal = (customInputs[currentQuestion.id] || '').trim();
  const hasAnyPreviousAnswer = Object.values(selectedAnswers).some(arr => arr && arr.length > 0);
  const customBtnIsPrimary = currentCustomVal.length > 0 || (isLastStep && hasAnyPreviousAnswer);

  let customBtnLabel = isAr ? 'تخطي' : 'Skip';
  if (currentCustomVal.length > 0) {
    customBtnLabel = isLastStep ? (isAr ? 'إرسال ↵' : 'Submit ↵') : (isAr ? 'التالي ←' : 'Next →');
  } else if (isLastStep && hasAnyPreviousAnswer) {
    customBtnLabel = isAr ? 'إرسال ↵' : 'Submit ↵';
  }

  return (
    <div className="space-y-2.5 my-2 font-sans">
      {/* Optional conversational lead-in above the clarify card (matches Builder's pre-clarify message) */}
      {leadIn && (
        <div className="text-xs md:text-sm text-[var(--text-primary)] leading-relaxed px-1">
          {leadIn}
        </div>
      )}

      <div
        ref={cardRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        role="region"
        aria-label={isAr ? 'أسئلة توضيحية' : 'Clarifying questions'}
        className="w-full bg-[var(--surface-card)] border border-[var(--border-default)] rounded-shape-md p-3.5 sm:p-4 space-y-3 shadow-md outline-none focus:border-blue-500/50 transition-all"
      >
        {/* Top Row: Question Prompt + Step Counter / Skip Button (exact match to clarify.js .clarify-top) */}
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs sm:text-[13px] font-bold text-[var(--text-primary)] leading-snug flex-1">
            {currentQuestion.question}
          </p>

          <div className="flex items-center gap-1 shrink-0">
            {questions.length > 1 && (
              <div className="flex items-center gap-0.5 text-[11px] font-medium text-[var(--text-muted)] bg-[var(--surface-subtle)] px-1.5 py-0.5 rounded-shape-xs border border-[var(--border-default)]">
                <button
                  type="button"
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
                  className="p-0.5 rounded hover:text-[var(--text-primary)] disabled:opacity-30 cursor-pointer"
                  aria-label={isAr ? 'السؤال السابق' : 'Previous question'}
                >
                  <ChevronLeft size={13} className={isAr ? 'rotate-180' : ''} />
                </button>
                <span className="px-1 font-mono text-[10.5px]">
                  {isAr
                    ? `${currentIdx + 1} من ${questions.length}`
                    : `${currentIdx + 1} of ${questions.length}`}
                </span>
                <button
                  type="button"
                  disabled={currentIdx === questions.length - 1}
                  onClick={() => setCurrentIdx(i => Math.min(questions.length - 1, i + 1))}
                  className="p-0.5 rounded hover:text-[var(--text-primary)] disabled:opacity-30 cursor-pointer"
                  aria-label={isAr ? 'السؤال التالي' : 'Next question'}
                >
                  <ChevronRight size={13} className={isAr ? 'rotate-180' : ''} />
                </button>
              </div>
            )}

            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="w-6 h-6 rounded-shape-xs flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
                title={isAr ? 'تخطي الأسئلة واستخدام الإعدادات الافتراضية' : 'Skip questions and use sensible defaults'}
                aria-label={isAr ? 'تخطي الأسئلة' : 'Skip questions'}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Numbered Options List (exact match to clarify.js .clarify-options) */}
        <div className="flex flex-col gap-1.5" role="listbox" aria-label={currentQuestion.question}>
          {currentQuestion.options.map((opt, i) => {
            const isSelected = (selectedAnswers[currentQuestion.id] || []).includes(opt.label);
            const isFocused = activeOptionIdx === i;
            return (
              <button
                key={opt.id || i}
                type="button"
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveOptionIdx(i)}
                onClick={() => selectAnswerAndAdvance(currentQuestion.id, opt.label)}
                className={`group w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-shape-sm border text-xs text-start cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-blue-500/12 border-blue-500 text-blue-500 font-bold'
                    : isFocused
                    ? 'bg-[var(--surface-subtle)] border-blue-500/40 text-[var(--text-primary)]'
                    : 'bg-[var(--surface-subtle)]/60 border-[var(--border-default)] hover:bg-[var(--surface-subtle)] hover:border-blue-500/30 text-[var(--text-primary)]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-5 h-5 rounded-shape-xs border text-[10.5px] font-mono font-bold flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-[var(--surface-card)] border-[var(--border-default)] text-[var(--text-muted)] group-hover:border-blue-500/40 group-hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="leading-snug break-words">{opt.label}</span>
                  {opt.recommended && (
                    <span className="px-1.5 py-0.5 rounded-shape-full bg-blue-500/15 text-blue-500 text-[10px] font-bold shrink-0">
                      {isAr ? 'موصى به' : 'Recommended'}
                    </span>
                  )}
                </div>

                <span
                  aria-hidden="true"
                  className={`text-xs font-mono shrink-0 transition-opacity ${
                    isSelected
                      ? 'opacity-100 text-blue-500'
                      : 'opacity-0 group-hover:opacity-100 text-[var(--text-muted)]'
                  }`}
                >
                  {isSelected ? (
                    <Check size={13} />
                  ) : isLastStep ? (
                    '↵'
                  ) : isAr ? (
                    '←'
                  ) : (
                    '→'
                  )}
                </span>
              </button>
            );
          })}

          {/* Custom "Something else..." row (exact match to clarify.js .clarify-custom-row) */}
          <div
            onClick={() => customInputRef.current?.focus()}
            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-shape-sm border transition-all ${
              currentCustomVal.length > 0
                ? 'bg-[var(--surface-subtle)] border-blue-500/50'
                : 'bg-[var(--surface-subtle)]/40 border-[var(--border-default)] focus-within:border-blue-500/50 focus-within:bg-[var(--surface-subtle)]'
            }`}
          >
            <span className="w-5 h-5 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-default)] text-[10.5px] font-mono font-bold flex items-center justify-center text-[var(--text-muted)] shrink-0">
              {currentQuestion.options.length + 1}
            </span>
            <input
              ref={customInputRef}
              type="text"
              placeholder={isAr ? 'شيء آخر (اكتب إجابتك الخاصة)...' : 'Something else...'}
              value={customInputs[currentQuestion.id] || ''}
              onChange={(e) =>
                setCustomInputs(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCustomAction();
                }
              }}
              className="flex-1 bg-transparent text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none min-w-0 py-1"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCustomAction();
              }}
              className={`px-2.5 py-1 rounded-shape-xs text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                customBtnIsPrimary
                  ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-2xs'
                  : 'bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-default)]'
              }`}
            >
              {customBtnLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
