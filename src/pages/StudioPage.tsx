import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { 
  ShieldCheck, Cpu, CreditCard, Sparkles, 
  ChevronRight, ChevronLeft, ArrowUpRight,
  MessageSquare, Terminal, Music, Code
} from 'lucide-react';
import { resolveImageUrl } from '../utils/imageResolver';

export const StudioPage: React.FC = () => {
  const { theme, language, siteSettings, dir } = useAppContext();
  const navigate = useNavigate();
  const siteName = language === 'ar' ? siteSettings.siteNameAr : siteSettings.siteName;
  const logo = theme === 'dark' ? siteSettings.logoBase64 : (siteSettings.logoLightBase64 || siteSettings.logoBase64);

  const studioFeatures = [
    {
      id: 'chat_engine',
      icon: <MessageSquare className="w-5 h-5 text-accent" />,
      title: language === 'ar' ? 'المحادثة والتحليل الذكي' : 'Smart Chat & Reasoning',
      desc: language === 'ar' ? 'محركات ذكاء اصطناعي متعددة مع نظام التوجيه والتبديل الصامت.' : 'Multi-model AI engines with dynamic failover orchestration.',
      action: () => navigate('/chat'),
      badge: language === 'ar' ? 'نشط' : 'Active'
    },
    {
      id: 'bulletin_hub',
      icon: <Sparkles className="w-5 h-5 text-accent" />,
      title: language === 'ar' ? 'منصة بيربليكستا بورد والمجتمع' : 'Perplexta Board Community Hub',
      desc: language === 'ar' ? 'مجتمع تفاعلي، ريلز، وقنوات تجارية موثقة بدقة متناهية.' : 'Interactive feed, verified commercial pages, and short reels.',
      action: () => navigate('/bulletin'),
      badge: language === 'ar' ? 'شائع' : 'Trending'
    },
    {
      id: 'api_portal',
      icon: <Terminal className="w-5 h-5 text-accent" />,
      title: language === 'ar' ? 'بوابة المطورين والـ API' : 'Developer & API Portal',
      desc: language === 'ar' ? 'مفاتيح API، توجيه الروبوتات، والتحليلات البرمجية المستقلة.' : 'API keys, autonomous bots routing, and programmatic workflows.',
      action: () => navigate('/settings/developer'),
      badge: language === 'ar' ? 'للمطورين' : 'Devs'
    },
    {
      id: 'wallet_economy',
      icon: <CreditCard className="w-5 h-5 text-accent" />,
      title: language === 'ar' ? 'المحفظة والاشتراكات' : 'Wallet & Plans',
      desc: language === 'ar' ? 'نظام مالي مدقق بسجل غير قابل للتعديل لشحن النقاط والترقية.' : 'Audited ledger financial system for credits and tier upgrades.',
      action: () => navigate('/settings/wallet'),
      badge: language === 'ar' ? 'آمن' : 'Secure'
    },
    {
      id: 'app_studio',
      icon: <Code className="w-5 h-5 text-accent" />,
      title: language === 'ar' ? 'استوديو التطبيق (IDE متكامل)' : 'App Studio & Live IDE',
      desc: language === 'ar' ? 'معاينة حيّة، شجرة ملفات، قاعدة بيانات SQLite، وتصحيح ذكي.' : 'Live preview, file tree, SQLite database, and AI code fixing.',
      action: () => navigate('/app'),
      badge: language === 'ar' ? 'مميز' : 'Pro'
    },
    {
      id: 'audio_studio',
      icon: <Music className="w-5 h-5 text-accent" />,
      title: language === 'ar' ? 'استوديو الصوت والإنتاج' : 'Audio Studio & Production',
      desc: language === 'ar' ? 'محركات تأليف النطق، تحويل الصوت، والموسيقى الأوركسترالية المتطورة.' : 'State-of-the-art TTS vocal synthesis, speech transcribing, and orchestral music composition.',
      action: () => navigate('/audio-studio'),
      badge: language === 'ar' ? 'جديد' : 'New'
    }
  ];

  return (
    <div className="min-h-screen-safe bg-[#080c14] text-slate-100 font-sans pb-28 md:pb-20">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#080c14]/90 border-b border-slate-800/90 pt-[env(safe-area-inset-top,0px)]">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)} 
              className="h-9 px-3 flex items-center gap-1 rounded-shape-sm bg-[#0d131f] border border-slate-800/90 text-slate-100 hover:text-accent transition-theme active:scale-95 cursor-pointer"
            >
              {dir === 'rtl' ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              <span className="text-xs font-bold">{dir === 'rtl' ? 'رجوع' : 'Back'}</span>
            </button>
            <div className="flex items-center gap-2">
              {logo ? (
                <img src={resolveImageUrl(logo, 'general')} alt={siteName} className="w-7 h-7 rounded-[6px] object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-[6px] bg-[#0d131f] border border-slate-800/90 flex items-center justify-center">
                  <Cpu className="w-3.5 h-3.5 text-accent" />
                </div>
              )}
              <h1 className="text-sm font-bold tracking-wide uppercase">
                {language === 'ar' ? 'استوديو بيربليكستا' : 'Perplexta Studio'}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {studioFeatures.map((feat) => (
            <div 
              key={feat.id}
              onClick={feat.action}
              className="p-5 rounded-shape-sm bg-[#090d16] border border-slate-800/90 hover:border-accent/60 active:scale-[0.99] transition-all cursor-pointer flex flex-col justify-between group shadow-xs space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-shape-sm bg-[#0d131f] border border-slate-800/90 flex items-center justify-center group-hover:scale-105 transition-transform">
                    {feat.icon}
                  </div>
                  <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-[#0d131f] text-slate-400 border border-slate-800/90">
                    {feat.badge}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 group-hover:text-accent transition-colors flex items-center justify-between">
                    <span>{feat.title}</span>
                    <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-accent" />
                  </h3>
                  <p 
                    className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed"
                    style={{
                      direction: language === 'ar' ? 'rtl' : 'ltr',
                      textAlign: language === 'ar' ? 'right' : 'left',
                      unicodeBidi: 'plaintext'
                    }}
                  >
                    {feat.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="pt-2 space-y-4 text-center">
          <div className="p-5 rounded-shape-sm border border-slate-800/90 bg-[#090d16] max-w-xl mx-auto space-y-2 shadow-xs">
            <div className="flex items-center justify-center gap-2 text-slate-100">
              <ShieldCheck className="w-4 h-4 text-accent" />
              <h4 className="text-xs font-bold uppercase tracking-wider">
                {language === 'ar' ? 'أمان وحماية البيانات المتقدمة' : 'Enterprise Data Security & Privacy'}
              </h4>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {language === 'ar'
                ? 'كافة المحركات وأنظمة الربط والتشفير تعمل داخل بيئة معزولة لضمان خصوصية بيانات المستخدمين وأمان العمليات.'
                : 'All engines, orchestration layers, and encryption routines are isolated to guarantee data privacy and operational security.'}
            </p>
          </div>
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-[#080c14] border-t border-slate-800/90 select-none py-3.5 px-4 md:px-6 shadow-md">
        <div className="max-w-5xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] sm:text-[11px] text-slate-300">
          <nav className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 font-bold text-accent">
            <button 
              type="button"
              onClick={() => navigate('/about')} 
              className="cursor-pointer hover:underline bg-transparent border-0 p-0 text-inherit font-inherit transition-colors duration-150"
            >
              {language === 'ar' ? 'من نحن' : 'About Us'}
            </button>
            <span className="text-slate-400 select-none">•</span>
            <button 
              type="button"
              onClick={() => navigate('/terms')} 
              className="cursor-pointer hover:underline bg-transparent border-0 p-0 text-inherit font-inherit transition-colors duration-150"
            >
              {language === 'ar' ? 'شروط الخدمة' : 'Terms of Service'}
            </button>
            <span className="text-slate-400 select-none">•</span>
            <button 
              type="button"
              onClick={() => navigate('/privacy')} 
              className="cursor-pointer hover:underline bg-transparent border-0 p-0 text-inherit font-inherit transition-colors duration-150"
            >
              {language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
            </button>
          </nav>
          <p className="font-sans tracking-wide leading-relaxed text-slate-400 whitespace-nowrap text-[9px] sm:text-[11px]">
            {language === 'ar' 
              ? 'جميع الحقوق محفوظة © 2026 بيربليكستا'
              : '© 2026 Perplexta. All rights reserved.'
            }
          </p>
        </div>
      </footer>
    </div>
  );
};
