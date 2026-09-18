import React from 'react';
import { Sliders, Paperclip, Check, Sparkles, AlertTriangle, Loader2 } from 'lucide-react';

export const StudioMixerPanel = ({
  dir,
  isMixerExpanded,
  setIsMixerExpanded,
  uploadedFile,
  handleFileUpload,
  fileInputRef,
  removeUploadedFile,
  aiVolume,
  setAiVolume,
  uploadedVolume,
  setUploadedVolume,
  status,
  aiGainNodeRef,
  audioCtxRef,
  uploadedGainNodeRef
}: any) => {
  return (
    <div className="w-full px-5 py-4 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm flex flex-col gap-4 transition-theme">
        <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="absolute inset-0 bg-[var(--surface-subtle)] rounded-[var(--radius-xs)] blur-[6px] opacity-15 animate-pulse" />
              <Sliders size={16} className="text-[var(--fg-accent)] relative " />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-[var(--fg-accent)] uppercase tracking-widest leading-none mb-1">
                {dir === 'rtl' ? 'مستودع هندسة وتوليف الصوت' : 'STUDIO PRODUCTION MIXER'}
              </span>
              <h5 className="text-[12px] font-bold text-[var(--text-primary)] leading-none">
                {dir === 'rtl' ? 'دمج المسارات والملفات المحلية' : 'Multi-Channel Live Web Audio Console'}
              </h5>
            </div>
          </div>

          <button 
            type="button"
            onClick={() => setIsMixerExpanded(!isMixerExpanded)}
            className="text-[10px] font-black text-[var(--text-muted)] hover:text-[var(--fg-accent)] uppercase tracking-wider transition-colors pt-1"
          >
            {isMixerExpanded 
              ? (dir === 'rtl' ? 'طي اللوحة' : 'COLLAPSE PANEL') 
              : (dir === 'rtl' ? 'توسيع ومزج الملفات' : 'EXPAND & MIX')}
          </button>
        </div>

        {isMixerExpanded && (
          <div className="flex flex-col gap-5 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  {dir === 'rtl' ? 'تحميل مسار خارجي / صوت مضاف' : 'UPLOAD COMPANION/VOCAL TRACK'}
                </span>

                <div
                  onDragOver={(e: any) => { e.preventDefault(); }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-[var(--radius-sm)] p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-theme ${
                    uploadedFile 
                      ? 'border-[var(--border-accent)] bg-[var(--surface-subtle)]' 
                      : 'border-[var(--border-default)] hover:border-[var(--border-accent)] hover:bg-[var(--surface-subtle)]'
                  }`}
                >
                  {/* ... contents of the uploader ... */}
                </div>
              </div>

              <div className="flex flex-col gap-3 justify-center">
                {/* ... mixer controls ... */}
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-xs)] bg-[var(--surface-inset)] border border-[var(--border-default)] text-[10px] text-[var(--text-muted)] font-medium leading-normal">
              <div className="w-1.5 h-1.5 rounded-[var(--radius-full)] bg-[var(--fg-accent)] animate-pulse shrink-0" />
              <span>
                {dir === 'rtl' 
                  ? 'بروتوكول ويب أوديو (Web Audio API) يقوم بدمج المسارين في بث واحد فائق الدقة ٢٤ بت بالوقت الفعلي.' 
                  : 'High-fidelity 24-bit real-time digital mixing pipeline driven entirely by your browser Web Audio API.'
                }
              </span>
            </div>
          </div>
        )}
      </div>
  );
};
