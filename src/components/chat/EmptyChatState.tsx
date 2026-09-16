import React from 'react';
import { motion } from 'motion/react';
import { Logo } from '../common/Logo';

interface EmptyChatStateProps {
  selectedTool: string;
  dir: 'ltr' | 'rtl';
  user: any;
}

export const getToolWelcomeIntro = (toolId: string, dir: 'ltr' | 'rtl', user: any) => {
  const isAr = dir === 'rtl';
  const rawName = user?.name?.trim();
  const firstName = rawName ? rawName.split(' ')[0] : '';
  const greeting = firstName 
    ? (isAr ? `مرحباً بك، ${firstName}` : `Welcome back, ${firstName}`)
    : (isAr ? 'مرحباً بك' : 'Welcome back');
  
  let promptIntro = '';
  switch (toolId) {
    case 'image':
      promptIntro = isAr ? 'توليد ومعالجة الصور المتقدمة' : 'Advanced image generation & processing';
      break;
    case 'video':
      promptIntro = isAr ? 'إنتاج ومعالجة مقاطع الفيديو' : 'Video synthesis & generation';
      break;
    case 'code':
      promptIntro = isAr ? 'الهندسة البرمجية وتحليل الأكواد' : 'Software engineering & code analysis';
      break;
    case 'perplexta_music':
      promptIntro = isAr ? 'التأليف الصوتي والمعالجة السمعية' : 'Acoustic composition & audio processing';
      break;
    case 'canvas':
      promptIntro = isAr ? 'تصميم المسارات والمؤثرات الصوتية' : 'Audio track & sound design';
      break;
    case 'sovereign_search':
    case 'research_studies':
      promptIntro = isAr ? 'تفكيك وتركيب البحوث والدراسات الأكاديمية والمراجعة المنهجية' : 'Comprehensive research synthesis & empirical literature review';
      break;
    case 'ads_copilot':
    case 'ads':
      promptIntro = isAr ? 'تخطيط وصياغة الحملات الإعلانية واستراتيجيات النمو' : 'Ad campaign strategy, copywriting & growth optimization';
      break;
    case 'perplexta_analysis':
      promptIntro = isAr ? 'البحث المتقدم والتحليل الاستقصائي الموثق' : 'Deep technical & verified analytical research';
      break;
    case 'tts':
      promptIntro = isAr ? 'التوليف الصوتي الاحترافي' : 'Voice synthesis & speech output';
      break;
    case 'stt':
      promptIntro = isAr ? 'تفريغ التسجيلات الصوتية' : 'Speech-to-text audio transcription';
      break;
    default:
      promptIntro = isAr ? 'التحليل الذكي ومعالجة البيانات' : 'Intelligence & data analysis';
      break;
  }
  return { greeting, promptIntro };
};

export const EmptyChatState: React.FC<EmptyChatStateProps> = ({ selectedTool, dir, user }) => {
  // Never show greetings, slogans or text clutter to visitors before login
  if (!user) {
    return null;
  }

  const isAr = dir === 'rtl';
  const rawName = user?.name?.trim();
  const firstName = rawName ? rawName.split(' ')[0] : '';
  const planName = user?.subscription?.plan_name_ar || user?.subscription?.plan_name_en || (user?.role === 'admin' ? (isAr ? 'الإدارة العليا' : 'System Admin') : null);
  const planColor = user?.subscription?.plan_color || 'var(--fg-accent)';

  const isDefaultTool = ['chat_fast', 'chat_pro', 'chat_reasoning'].includes(selectedTool);

  return (
    <motion.div 
      key="onboarding-view" 
      initial={{ opacity: 0, scale: 1, filter: "blur(4px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.98, filter: "blur(6px)", transition: { duration: 0.15, ease: "easeOut" } }}
      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center min-h-0 py-2 sm:py-4 selection:bg-[var(--bg-accent-muted)] w-full relative overflow-hidden"
    >
      <div className="w-full max-w-2xl px-4 flex flex-col items-center text-center relative z-10">
        {user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-shape-full bg-[var(--surface-card)] border border-[var(--border-default)] mb-2.5 text-[11px] font-bold text-[var(--text-secondary)] shadow-xs"
          >
            <span 
              className="w-2 h-2 rounded-full shrink-0" 
              style={{ backgroundColor: planColor }} 
            />
            <span className="tracking-wide">
              {planName || (isAr ? 'عضوية معتمدة' : 'Verified Member')}
            </span>
            <Logo size={14} fallbackType="cpu" />
          </motion.div>
        )}

        {isDefaultTool ? (
          <>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[var(--text-primary)] tracking-tight mb-2 font-sans">
              {isAr ? 'ما هو جدول أعمالك اليوم؟' : 'What is your agenda for today?'}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium max-w-md mx-auto leading-relaxed">
              {isAr
                ? 'منصة بيربليكستا للتحليل الذكي والبحث الموثق'
                : 'Perplexta Platform for Intelligence & Verified Research'
              }
            </p>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-2 px-4 max-w-lg mx-auto w-full">
            {(() => {
              const { greeting, promptIntro } = getToolWelcomeIntro(selectedTool, dir, user);
              return (
                <>
                  <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] tracking-tight mb-1.5 font-sans">
                    {greeting}
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-bold leading-relaxed max-w-md font-sans">
                    {promptIntro}
                  </p>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </motion.div>
  );
};

