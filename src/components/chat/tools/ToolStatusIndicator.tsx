import React from 'react';
import { motion } from 'motion/react';
import {
  Zap,
  Sparkles,
  Brain,
  Code,
  Video,
  ImageIcon,
  BookOpen,
  Search,
  Database,
  Scale,
  Megaphone,
  Music,
  Volume2,
  Mic,
  MessageSquare
} from 'lucide-react';

export const getToolDetails = (toolId: string | undefined, dir: 'ltr' | 'rtl', t: any) => {
  const normId = toolId || 'chat_fast';

  if (normId.startsWith('chat_fast')) {
    return {
      label: dir === 'rtl' ? 'البحث السريع' : 'Fast Search',
      icon: Zap,
      colorClass: 'text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]',
      bgClass: 'bg-amber-500/10 border-amber-500/20'
    };
  }
  if (normId.startsWith('chat_pro')) {
    return {
      label: dir === 'rtl' ? 'متقدم' : 'Pro',
      icon: Sparkles,
      colorClass: 'text-accent',
      bgClass: 'bg-accent/10 border-accent/20'
    };
  }
  if (normId.startsWith('chat_reasoning')) {
    return {
      label: dir === 'rtl' ? 'تفكير' : 'Thinking',
      icon: Brain,
      colorClass: 'text-sky-500 drop-shadow-[0_0_8px_rgba(14,165,233,0.5)]',
      bgClass: 'bg-sky-500/10 border-sky-500/20'
    };
  }

  switch (normId) {
    case 'code':
      return {
        label: dir === 'rtl' ? 'برمجة' : 'Code',
        icon: Code,
        colorClass: 'text-accent',
        bgClass: 'bg-accent/10 border-accent/20'
      };
    case 'video':
      return {
        label: dir === 'rtl' ? 'فيديو' : 'Video',
        icon: Video,
        colorClass: 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]',
        bgClass: 'bg-red-500/10 border-red-500/20'
      };
    case 'image':
      return {
        label: dir === 'rtl' ? 'صور' : 'Image',
        icon: ImageIcon,
        colorClass: 'text-pink-500 drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]',
        bgClass: 'bg-pink-500/10 border-pink-500/20'
      };
    case 'perplexta_analysis':
      return {
        label: dir === 'rtl' ? 'تحليل' : 'Analysis',
        icon: Search,
        colorClass: 'text-teal-500 drop-shadow-[0_0_8px_rgba(20,184,166,0.5)]',
        bgClass: 'bg-teal-500/10 border-teal-500/20'
      };
    case 'sovereign_search':
    case 'research_studies':
      return {
        label: dir === 'rtl' ? 'البحوث والدراسات' : 'Research & Studies',
        icon: BookOpen,
        colorClass: 'text-[var(--fg-accent)]',
        bgClass: 'bg-[var(--surface-subtle)] border-[var(--border-default)]'
      };
    case 'sovereign_memory':
      return {
        label: dir === 'rtl' ? 'ذاكرة' : 'Memory',
        icon: Database,
        colorClass: 'text-[var(--fg-accent)]',
        bgClass: 'bg-[var(--surface-subtle)] border-[var(--border-default)]'
      };
    case 'ads_copilot':
      return {
        label: dir === 'rtl' ? 'مساعد الإعلانات' : 'Ads Copilot',
        icon: Megaphone,
        colorClass: 'text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]',
        bgClass: 'bg-amber-500/10 border-amber-500/20'
      };
    case 'audio_studio':
    case 'canvas':
      return {
        label: dir === 'rtl' ? 'استوديو الصوتيات' : 'Audio Studio',
        icon: Music,
        colorClass: 'text-cyan-500 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]',
        bgClass: 'bg-cyan-500/10 border-cyan-500/20'
      };
    case 'tts':
      return {
        label: dir === 'rtl' ? 'صوتيات' : 'Text to Speech',
        icon: Volume2,
        colorClass: 'text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]',
        bgClass: 'bg-blue-500/10 border-blue-500/20'
      };
    case 'stt':
      return {
        label: dir === 'rtl' ? 'مسجل صوتی' : 'Speech to Text',
        icon: Mic,
        colorClass: 'text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]',
        bgClass: 'bg-orange-500/10 border-orange-500/20'
      };
    default:
      return {
        label: dir === 'rtl' ? 'محادثة' : 'Chat',
        icon: MessageSquare,
        colorClass: 'text-accent',
        bgClass: 'bg-accent/10 border-accent/20'
      };
  }
};

export const ToolStatusIndicator: React.FC<{
  tool?: string;
  isGenerating: boolean;
  dir: 'ltr' | 'rtl';
  t: any;
}> = () => {
  return null;
};
