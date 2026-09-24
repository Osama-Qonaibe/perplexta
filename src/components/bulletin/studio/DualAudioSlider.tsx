import React from 'react';
import { Volume2, VolumeX, Mic, Music2, Sliders, AudioWaveform } from 'lucide-react';

interface DualAudioSliderProps {
  originalVolume: number; // 0.0 to 1.0
  musicVolume: number;    // 0.0 to 1.0
  hasVideoAudio?: boolean;
  hasMusicTrack?: boolean;
  onChangeOriginalVolume: (vol: number) => void;
  onChangeMusicVolume: (vol: number) => void;
  isRtl?: boolean;
  className?: string;
}

export const DualAudioSlider: React.FC<DualAudioSliderProps> = ({
  originalVolume,
  musicVolume,
  hasVideoAudio = true,
  hasMusicTrack = true,
  onChangeOriginalVolume,
  onChangeMusicVolume,
  isRtl = true,
  className = ''
}) => {
  return (
    <div className={`flex flex-col gap-2.5 p-3 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-default)] shadow-xs ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
          <Sliders size={14} className="text-[var(--accent-foreground)]" />
          <span>{isRtl ? 'ميكسر الصوت' : 'Audio Mixer'}</span>
        </div>

        {/* Quick icon-only presets */}
        {hasVideoAudio && hasMusicTrack && (
          <div className="flex items-center gap-1 bg-[var(--surface-subtle)] p-0.5 rounded-lg border border-[var(--border-default)]">
            <button
              type="button"
              onClick={() => {
                onChangeOriginalVolume(0.8);
                onChangeMusicVolume(0.2);
              }}
              className="p-1.5 rounded-md hover:bg-[var(--surface-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              title={isRtl ? 'تركيز على الصوت الأصلي' : 'Voice Focus'}
              aria-label={isRtl ? 'تركيز على الصوت الأصلي' : 'Voice Focus'}
            >
              <Mic size={13} />
            </button>
            <button
              type="button"
              onClick={() => {
                onChangeOriginalVolume(0.5);
                onChangeMusicVolume(0.5);
              }}
              className="p-1.5 rounded-md hover:bg-[var(--surface-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              title={isRtl ? 'صوت متوازن' : 'Balanced Audio'}
              aria-label={isRtl ? 'صوت متوازن' : 'Balanced Audio'}
            >
              <Sliders size={13} />
            </button>
            <button
              type="button"
              onClick={() => {
                onChangeOriginalVolume(0.0);
                onChangeMusicVolume(1.0);
              }}
              className="p-1.5 rounded-md hover:bg-[var(--surface-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              title={isRtl ? 'موسيقى فقط' : 'Music Only'}
              aria-label={isRtl ? 'موسيقى فقط' : 'Music Only'}
            >
              <Music2 size={13} />
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {/* Track 1: Original Video Audio */}
        {hasVideoAudio && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChangeOriginalVolume(originalVolume > 0 ? 0 : 0.8)}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors shrink-0 cursor-pointer"
              title={originalVolume > 0 ? (isRtl ? 'كتم' : 'Mute') : (isRtl ? 'تشغيل' : 'Unmute')}
              aria-label={originalVolume > 0 ? (isRtl ? 'كتم' : 'Mute') : (isRtl ? 'تشغيل' : 'Unmute')}
            >
              {originalVolume > 0 ? <Volume2 size={14} className="text-emerald-500" /> : <VolumeX size={14} className="text-[var(--fg-danger)]" />}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={originalVolume}
              onChange={(e) => onChangeOriginalVolume(parseFloat(e.target.value))}
              className="flex-1 h-1.5 bg-[var(--surface-subtle)] rounded-lg appearance-none cursor-pointer accent-emerald-500"
              aria-label="Original volume"
            />

            <span className="w-8 text-end font-mono text-[10px] font-bold text-[var(--text-muted)]">
              {Math.round(originalVolume * 100)}%
            </span>
          </div>
        )}

        {/* Track 2: Background Music Audio */}
        {hasMusicTrack && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChangeMusicVolume(musicVolume > 0 ? 0 : 0.8)}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors shrink-0 cursor-pointer"
              title={musicVolume > 0 ? (isRtl ? 'كتم' : 'Mute') : (isRtl ? 'تشغيل' : 'Unmute')}
              aria-label={musicVolume > 0 ? (isRtl ? 'كتم' : 'Mute') : (isRtl ? 'تشغيل' : 'Unmute')}
            >
              {musicVolume > 0 ? <Volume2 size={14} className="text-purple-500" /> : <VolumeX size={14} className="text-[var(--fg-danger)]" />}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={musicVolume}
              onChange={(e) => onChangeMusicVolume(parseFloat(e.target.value))}
              className="flex-1 h-1.5 bg-[var(--surface-subtle)] rounded-lg appearance-none cursor-pointer accent-purple-500"
              aria-label="Music volume"
            />

            <span className="w-8 text-end font-mono text-[10px] font-bold text-[var(--text-muted)]">
              {Math.round(musicVolume * 100)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

