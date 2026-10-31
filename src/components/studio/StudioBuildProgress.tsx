import React from 'react';
import { Loader2, CheckCircle2, AlertCircle, Terminal, FileCode } from 'lucide-react';

export interface StudioToolProgressStep {
  id: string;
  toolName: string;
  status: 'running' | 'completed' | 'error';
  detail?: string;
  targetFile?: string;
}

interface StudioBuildProgressProps {
  steps: StudioToolProgressStep[];
  isActive?: boolean;
  activeLog?: string;
  pipelinePhase?: 1 | 2 | 3 | null;
  currentlyWritingFile?: string;
  language?: string;
  onSelectFile?: (path: string) => void;
}

export const StudioBuildProgress: React.FC<StudioBuildProgressProps> = ({
  steps,
  activeLog,
  pipelinePhase,
  currentlyWritingFile,
  language = 'ar',
  onSelectFile
}) => {
  if (steps.length === 0 && !activeLog && !pipelinePhase && !currentlyWritingFile) return null;
  const isAr = language === 'ar';

  const phaseLabels = {
    1: isAr ? 'المرحلة 1: تحليل المعمارية وتخطيط الملفات' : 'Phase 1: Architecture & Blueprinting',
    2: isAr ? 'المرحلة 2: توليد وكتابة الملفات البرمجية' : 'Phase 2: Synthesizing Source Files',
    3: isAr ? 'المرحلة 3: فحص التكامل وتحديث المعاينة' : 'Phase 3: Verification & Live Reload'
  };

  return (
    <div className="w-full bg-[var(--surface-card)] border border-blue-500/30 rounded-shape-md p-3 space-y-2.5 font-sans shadow-sm my-2">
      <div className="flex items-center justify-between text-xs font-bold text-[var(--text-primary)] pb-1.5 border-b border-[var(--border-default)]">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-blue-500 animate-pulse" />
          <span>{isAr ? 'تقدم البناء وتنفيذ الأدوات' : 'Build & Tool Execution'}</span>
        </div>
        {pipelinePhase && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-shape-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            {phaseLabels[pipelinePhase]}
          </span>
        )}
      </div>

      {currentlyWritingFile && (
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-shape-xs bg-blue-500/10 border border-blue-500/20 text-xs">
          <div className="flex items-center gap-2 text-blue-400 font-mono truncate">
            <Loader2 size={12} className="animate-spin shrink-0" />
            <FileCode size={12} className="shrink-0" />
            <span className="truncate">{currentlyWritingFile}</span>
          </div>
          <span className="text-[10px] font-bold text-blue-400 shrink-0">
            {isAr ? 'جاري الكتابة...' : 'Writing...'}
          </span>
        </div>
      )}

      {steps.length > 0 && (
        <div className="space-y-1.5 max-h-44 overflow-y-auto custom-scrollbar">
          {steps.map(step => (
            <div
              key={step.id}
              onClick={() => step.targetFile && onSelectFile?.(step.targetFile)}
              className={`flex items-center justify-between p-2 rounded-shape-xs bg-[var(--surface-subtle)] text-xs ${
                step.targetFile && onSelectFile ? 'cursor-pointer hover:border-blue-500/30 border border-transparent' : ''
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                {step.status === 'running' && (
                  <Loader2 size={13} className="text-blue-500 animate-spin shrink-0" />
                )}
                {step.status === 'completed' && (
                  <CheckCircle2 size={13} className="text-green-500 shrink-0" />
                )}
                {step.status === 'error' && (
                  <AlertCircle size={13} className="text-rose-500 shrink-0" />
                )}
                <div className="truncate flex items-center gap-1.5">
                  <span className="font-bold text-[var(--text-primary)]">{step.toolName}</span>
                  {step.targetFile && (
                    <span className="text-[11px] text-blue-400 font-mono">
                      [{step.targetFile}]
                    </span>
                  )}
                </div>
              </div>

              {step.detail && (
                <span className="text-[10px] text-[var(--text-secondary)] truncate max-w-[130px]">
                  {step.detail}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {activeLog && (
        <div className="p-2 rounded-shape-xs bg-[var(--surface-subtle)] text-[var(--text-primary)] font-mono text-[11px] overflow-x-auto truncate border border-[var(--border-default)]">
          <span className="text-blue-500 font-bold">&gt;</span> {activeLog}
        </div>
      )}
    </div>
  );
};
