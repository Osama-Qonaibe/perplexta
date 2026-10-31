import React, { useState, useEffect, useRef } from 'react';
import { Check, Loader2, ChevronRight, ChevronLeft, ChevronDown, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HighlightText } from '../../HighlightText';
import { ThinkingStep } from '../types';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ThinkingStepsProps {
  steps?: ThinkingStep[];
  rawThinking?: string;
  isProcessing?: boolean;
  dir: 'ltr' | 'rtl';
  query?: string;
  thinkingTime?: number | string | null;
  tool?: string;
}

export const ThinkingSteps: React.FC<ThinkingStepsProps> = ({ 
  steps, 
  rawThinking, 
  isProcessing = false, 
  dir, 
  query, 
  thinkingTime,
  tool
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [liveSeconds, setLiveSeconds] = useState(1);
  const startTimeRef = useRef<number | null>(null);
  const maxObservedTimeRef = useRef<number>(1);

  // Live timer while processing
  useEffect(() => {
    if (isProcessing) {
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
      }
      const interval = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
          setLiveSeconds(elapsed);
          if (elapsed > maxObservedTimeRef.current) {
            maxObservedTimeRef.current = elapsed;
          }
        }
      }, 250);
      return () => clearInterval(interval);
    } else {
      if (liveSeconds > maxObservedTimeRef.current) {
        maxObservedTimeRef.current = liveSeconds;
      }
    }
  }, [isProcessing, liveSeconds]);

  const extractedRaw = rawThinking || (steps && steps.find((s: any) => s.is_raw_trace)?.step);

  const isImageTool = tool === 'image';
  const isVideoTool = tool === 'video';

  const defaultSteps = isImageTool ? [
    { step: dir === 'rtl' ? 'تحليل التوجيه الفني وتحديد التكوين البصري' : 'Prompt & Visual Composition Analysis', status: 'completed' as const },
    { step: dir === 'rtl' ? 'معالجة الترددات والطبقات التوليدية العصبونية' : 'Neural Latent Diffusion & Sampling', status: 'completed' as const },
    { step: dir === 'rtl' ? 'الرندرة النهائية وتطبيق فلاتر الدقة والوضوح' : 'High-Resolution Rendering & Polish', status: 'completed' as const }
  ] : isVideoTool ? [
    { step: dir === 'rtl' ? 'تحليل المشهد الزمني وتوليد الإطارات المفتاحية' : 'Keyframe Synthesis & Temporal Planning', status: 'completed' as const },
    { step: dir === 'rtl' ? 'رندرة وتنعيم الحركة الحركية العصبونية' : 'Motion Flow Interpolation & Physics', status: 'completed' as const },
    { step: dir === 'rtl' ? 'الترميز النهائي للملف عالي الوضوح' : 'High-Definition Video Encoding', status: 'completed' as const }
  ] : [
    { step: dir === 'rtl' ? 'تحليل سياق الاستفسار وتحديد المتطلبات' : 'Context & Query Requirement Analysis', status: 'completed' as const },
    { step: dir === 'rtl' ? 'البحث والتحقق من المعارف والمصادر المتخصصة' : 'Deep Knowledge & Fact Retrieval', status: 'completed' as const },
    { step: dir === 'rtl' ? 'صياغة الاستجابة الدقيقة وتنظيم التنسيق النهائي' : 'Synthesizing Precise Structured Response', status: 'completed' as const }
  ];

  const hasExplicitSteps = steps && steps.length > 0 && !steps[0]?.is_raw_trace;
  const displaySteps = hasExplicitSteps ? steps : defaultSteps;

  const isCurrentlyProcessing = isProcessing || (steps ? steps.some(s => s.status === 'processing') : false);

  const displayedTimeVal = thinkingTime 
    ? Math.max(1, Math.round(Number(thinkingTime)))
    : (isCurrentlyProcessing
        ? liveSeconds
        : (maxObservedTimeRef.current > 0 ? maxObservedTimeRef.current : 2));

  const isWorking = isCurrentlyProcessing;
  const statusLabel = isWorking
    ? (dir === 'rtl' ? 'جاري العمل' : 'Working')
    : (dir === 'rtl' ? 'اكتمل' : 'Finished');

  const ChevronIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

  return (
    <div className="mb-1.5 bg-transparent border-0 overflow-hidden transition-all duration-200 select-none" id="thinking-steps-container">
      {/* Minimal Poised Working / Finished Timer Header */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="group inline-flex items-center gap-1.5 py-0.5 px-0 text-xs font-normal text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent border-0 transition-colors cursor-pointer select-none touch-target-44 box-border relative before:absolute before:-inset-1.5 before:content-['']"
      >
        <span className={`font-sans tracking-tight transition-colors ${isWorking ? 'text-[var(--text-secondary)] animate-pulse' : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'}`}>
          {statusLabel}
        </span>
        <span className="font-mono tabular-nums text-[11.5px] text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors">
          {displayedTimeVal}s
        </span>
        <span className="flex items-center text-[var(--text-muted)]/70 group-hover:text-[var(--text-primary)] transition-transform duration-150">
          {isCollapsed ? <ChevronIcon size={12} /> : <ChevronDown size={12} />}
        </span>
      </button>

      {/* Collapsible Reasoning Trace / Steps Drawer */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden mt-1.5 mb-2 ps-3 border-s border-[var(--border-default)]/60"
          >
            {extractedRaw ? (
              <div className="text-xs text-[var(--text-secondary)] leading-relaxed space-y-1.5 font-sans">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-muted)]">
                  <Brain size={12} className="shrink-0" />
                  <span>{dir === 'rtl' ? 'مسار التحليل' : 'Reasoning Trace'}</span>
                </div>
                <div className="markdown-body text-xs leading-relaxed text-[var(--text-muted)] overflow-x-auto whitespace-pre-wrap font-sans">
                  <Markdown remarkPlugins={[remarkGfm]}>
                    {extractedRaw}
                  </Markdown>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 py-0.5">
                {displaySteps.map((step, idx) => (
                  <div 
                    key={`step-${step.step || idx}-${idx}`} 
                    className="flex items-center gap-2 text-xs text-[var(--text-muted)]"
                  >
                    {step.status === 'completed' || !isCurrentlyProcessing ? (
                      <Check size={11} className="text-[var(--text-muted)] shrink-0" />
                    ) : (
                      <Loader2 size={11} className="text-[var(--fg-accent)] animate-spin shrink-0" />
                    )}
                    <span className="truncate font-normal">
                      <HighlightText text={step.step} query={query} />
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
