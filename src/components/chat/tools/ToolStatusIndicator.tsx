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
      colorClass: 'text-amber-500',
      bgClass: 'bg-amber-500/10 border-amber-500/20'
    };
  }
  if (normId.startsWith('chat_pro')) {
    return {
      label: dir === 'rtl' ? 'متقدم' : 'Pro',
      icon: Sparkles,
      colorClass: 'text-[var(--fg-accent)]',
      bgClass: 'bg-[var(--surface-subtle)] border-[var(--border-default)]'
    };
  }
  if (normId.startsWith('chat_reasoning')) {
    return {
      label: dir === 'rtl' ? 'تفكير' : 'Thinking',
      icon: Brain,
      colorClass: 'text-sky-500',
      bgClass: 'bg-sky-500/10 border-sky-500/20'
    };
  }

  switch (normId) {
    case 'code':
      return {
        label: dir === 'rtl' ? 'برمجة' : 'Code',
        icon: Code,
        colorClass: 'text-[var(--fg-accent)]',
        bgClass: 'bg-[var(--surface-subtle)] border-[var(--border-default)]'
      };
    case 'video':
      return {
        label: dir === 'rtl' ? 'فيديو' : 'Video',
        icon: Video,
        colorClass: 'text-rose-500',
        bgClass: 'bg-rose-500/10 border-rose-500/20'
      };
    case 'image':
      return {
        label: dir === 'rtl' ? 'صور' : 'Image',
        icon: ImageIcon,
        colorClass: 'text-pink-500',
        bgClass: 'bg-pink-500/10 border-pink-500/20'
      };
    case 'perplexta_analysis':
      return {
        label: dir === 'rtl' ? 'تحليل' : 'Analysis',
        icon: Search,
        colorClass: 'text-teal-500',
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
    case 'ads_copilot':
      return {
        label: dir === 'rtl' ? 'مساعد الإعلانات' : 'Ads Copilot',
        icon: Megaphone,
        colorClass: 'text-amber-500',
        bgClass: 'bg-amber-500/10 border-amber-500/20'
      };
    case 'audio_studio':
    case 'canvas':
      return {
        label: dir === 'rtl' ? 'استوديو الصوتيات' : 'Audio Studio',
        icon: Music,
        colorClass: 'text-[var(--fg-accent)]',
        bgClass: 'bg-[var(--bg-accent-muted)] border-[var(--border-accent)]/20'
      };
    case 'tts':
      return {
        label: dir === 'rtl' ? 'صوتيات' : 'Text to Speech',
        icon: Volume2,
        colorClass: 'text-blue-500',
        bgClass: 'bg-blue-500/10 border-blue-500/20'
      };
    case 'stt':
      return {
        label: dir === 'rtl' ? 'مسجل صوتی' : 'Speech to Text',
        icon: Mic,
        colorClass: 'text-orange-500',
        bgClass: 'bg-orange-500/10 border-orange-500/20'
      };
    default:
      return {
        label: dir === 'rtl' ? 'محادثة' : 'Chat',
        icon: MessageSquare,
        colorClass: 'text-[var(--fg-accent)]',
        bgClass: 'bg-[var(--surface-subtle)] border-[var(--border-default)]'
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
