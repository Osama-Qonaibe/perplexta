import type { StarterPrompt, StudioTemplate } from './types';
import rawTemplates from './templatesData.json';
import { CORE_TEMPLATES_PAYLOADS } from './templateLoader';

export const STARTER_PROMPTS: StarterPrompt[] = [
  {
    label: 'To-do list app',
    labelAr: 'تطبيق إدارة المهام',
    prompt: 'Build a clean to-do list app where I can add tasks, mark them complete, and delete them, with everything saved between visits. Add priorities, deadlines, categories, search, sidebar, import/export, and dark mode support.',
    promptAr: 'ابنِ تطبيق إدارة مهام متكامل يتيح إضافة المهام، تعليمها كمكتملة، وحذفها مع حفظ البيانات تلقائياً، وأضف الأولويات، المواعيد النهائية، التصنيفات، البحث، القائمة الجانبية، والوضع الليلي.'
  },
  {
    label: 'Portfolio site',
    labelAr: 'موقع معرض أعمال',
    prompt: 'Build a modern personal portfolio site with a hero section, an about section, a projects grid, and a contact form. Add a testimonials section, a skills section, a contact form, a dark mode toggle.',
    promptAr: 'ابنِ موقع محفظة أعمال شخصي عصري يضم قسم ترحيبي، نبذة تعريفية، شبكة مشاريع تفاعلية، قسم مهارات، آراء العملاء، نموذج تواصل، وتبديل الوضع الليلي.'
  },
  {
    label: 'Pomodoro timer',
    labelAr: 'مؤقت بومودورو للتركيز',
    prompt: 'Build a Pomodoro focus timer with start, pause, and reset controls, automatic work and break intervals, and a count of completed sessions. Add a dark mode toggle, a sound notification for breaks, and a settings menu.',
    promptAr: 'ابنِ مؤقت تركيز بومودورو مع أزرار بدء وإيقاف وإعادة ضبط، فترات عمل واستراحة تلقائية، عداد للجلسات المكتملة، تنبيه صوتي، وقائمة إعدادات.'
  },
  {
    label: 'Expense tracker',
    labelAr: 'متتبع المصروفات',
    prompt: 'Build an expense tracker where I can log expenses with a category and amount, see a running total, and view a chart of spending by category.',
    promptAr: 'ابنِ تطبيق لتتبع المصروفات يتيح تسجيل النفقات حسب الفئة والمبلغ، عرض الإجمالي الفوري، ورسم بياني تفاعلي لتوزيع الإنفاق.'
  },
  {
    label: 'Landing page',
    labelAr: 'صفحة هبوط منتج',
    prompt: 'Build a sleek product landing page with a hero, feature highlights, a pricing section, and a call-to-action button.',
    promptAr: 'صمم صفحة هبوط احترافية لمنتج رقمي مع قسم رئيسي جذاب، عرض المميزات، جدول خطط الأسعار، وأزرار دعوة لاتخاذ إجراء.'
  },
  {
    label: 'Weather app',
    labelAr: 'تطبيق الطقس',
    prompt: 'Build a weather app where I can search for a city and see the current conditions and a multi-day forecast.',
    promptAr: 'ابنِ تطبيق طقس تفاعلي يتيح البحث عن أي مدينة وعرض حالة الطقس الحالية والتوقعات لعدة أيام بتصميم بصري أنيق.'
  },
  {
    label: 'Solitaire game',
    labelAr: 'لعبة سوليتير',
    prompt: 'Build a Klondike solitaire card game with drag-and-drop cards, a draw pile, four suit foundations, automatic win detection, and a new-game button. Include smooth animations and undo functionality.',
    promptAr: 'ابنِ لعبة ورق سوليتير تفاعلية مع دعم السحب والإفلات، كومة السحب، القواعد الأربع، اكتشاف الفوز تلقائياً، وزر تراجع ولعبة جديدة.'
  },
  {
    label: 'Markdown notes',
    labelAr: 'تطبيق ملاحظات Markdown',
    prompt: 'Build a markdown notes app with a list of notes, a live side-by-side editor and preview, full-text search, and everything saved between visits. Add a formatting toolbar above the editor.',
    promptAr: 'ابنِ تطبيق ملاحظات يدعم Markdown مع قائمة ملاحظات، محرر ومعاينة فورية جنباً إلى جنب، شريط تنسيق، وبحث نصي شامل.'
  },
  {
    label: 'Habit tracker',
    labelAr: 'متتبع العادات اليومية',
    prompt: 'Build a habit tracker where I can add daily habits, check them off each day, see a calendar grid of my streaks, and keep my progress saved between visits.',
    promptAr: 'ابنِ متتبع عادات يومية يتيح إضافة العادات، إنجازها يومياً، وعرض شبكة تقويم لسلاسل الإنجاز مع حفظ التقدم.'
  },
  {
    label: 'Recipe book',
    labelAr: 'كتاب وصفات الطبخ',
    prompt: 'Build a recipe book app where I can add recipes with ingredients and steps, browse them in a card grid, filter by category, and save everything between visits.',
    promptAr: 'ابنِ تطبيق كتاب وصفات يتيح إضافة الوصفات مع المكونات والخطوات، استعراضها في شبكة بطاقات، وتصفيتها حسب التصنيف.'
  },
  {
    label: 'Drawing canvas',
    labelAr: 'لوحة رسم رقمية',
    prompt: 'Build a drawing canvas app with adjustable brush size and color, an eraser, undo and redo, a clear button, and a way to download the drawing as an image.',
    promptAr: 'ابنِ تطبيق لوحة رسم رقمية مع التحكم بحجم ولون الفرشاة، ممحاة، تراجع وإعادة، مسح اللوحة، وتنزيل الرسمة كصورة.'
  },
  {
    label: 'Quiz game',
    labelAr: 'لعبة ثقافية وتحدي أسئلة',
    prompt: 'Build a multiple-choice quiz game that shows one question at a time, gives instant feedback on each answer, tracks the score, and shows a results summary at the end.',
    promptAr: 'ابنِ لعبة أسئلة متعددة الخيارات تعرض سؤالاً تلو الآخر مع تقييم فوري للإجابة، مؤقت زمني، حساب النقاط، وملخص للنتيجة.'
  },
  {
    label: 'Kanban board',
    labelAr: 'لوحة مهام كانبان',
    prompt: 'Build a Kanban board with To Do, In Progress, and Done columns where I can add cards, drag them between columns, edit and delete them, and keep everything saved between visits.',
    promptAr: 'ابنِ لوحة كانبان لإدارة المشاريع بأعمدة (قيد الانتظار، جاري العمل، مكتمل) مع سحب وإفلات البطاقات وتعديلها وحفظها.'
  },
  {
    label: 'Budget planner',
    labelAr: 'مخطط الميزانية الشهرية',
    prompt: 'Build a monthly budget planner where I can set income, add budget categories with limits, log spending against each, and see how much is left in each category with a visual progress bar.',
    promptAr: 'ابنِ مخطط ميزانية شهرية لتحديد الدخل، إضافة فئات الإنفاق بحدود معينة، وتسجيل المصروفات مع أشرطة تقدم بصرية.'
  },
  {
    label: 'Flashcards',
    labelAr: 'بطاقات تعليمية ذكية',
    prompt: 'Build a flashcard study app where I can create decks of cards with a front and back, flip through them one at a time, shuffle the deck, and track study progress.',
    promptAr: 'ابنِ تطبيق بطاقات استذكار (Flashcards) يتيح إنشاء مجموعات بطاقات بوجهين، تقليبها بحركة ثلاثية الأبعاد، خلطها، وتتبع التقدم.'
  },
  {
    label: 'Calculator',
    labelAr: 'آلة حاسبة علمية',
    prompt: 'Build a clean calculator with the standard arithmetic operations, a clear and backspace button, keyboard support, and a running history of recent calculations. Add scientific mode.',
    promptAr: 'ابنِ آلة حاسبة أنيقة تدعم العمليات الحسابية والعلمية، اختصارات لوحة المفاتيح، وسجل العمليات السابقة.'
  },
  {
    label: 'Language learning app',
    labelAr: 'تطبيق تعلم اللغات',
    prompt: 'Build a language learning app where I can learn a new language by practicing vocabulary and grammar, with a quiz mode, a progress tracker, and flashcards.',
    promptAr: 'ابنِ تطبيق لتعلم اللغات يتضمن تمارين المفردات والقواعد، وضع اختبارات تفاعلي، وتتبع مستوى التقدم اليومي.'
  },
  {
    label: 'Music player',
    labelAr: 'مشغل موسيقى عصري',
    prompt: 'Build a music player UI with a playlist, play, pause, next, and previous controls, a seek bar with elapsed and total time, and a volume slider.',
    promptAr: 'صمم واجهة مشغل موسيقى احترافية مع قائمة تشغيل، أزرار تحكم كاملة، شريط تقدم زمني، ومؤثرات بصرية للصوت.'
  },
  {
    label: 'Memory game',
    labelAr: 'لعبة تقوية الذاكرة',
    prompt: 'Build a memory matching card game on a grid where I flip two cards at a time to find pairs, track the number of moves and elapsed time, and celebrate when all pairs are matched.',
    promptAr: 'ابنِ لعبة مطابقة البطاقات لتقوية الذاكرة مع حساب عدد الحركات والوقت المنقضي وتأثيرات احتفالية عند الفوز.'
  },
  {
    label: 'Countdown timer',
    labelAr: 'مؤقت عد تنازلي للمناسبات',
    prompt: 'Build a countdown timer where I can set hours, minutes, and seconds, start, pause, and reset it, and get a clear visual and audible alert when it reaches zero.',
    promptAr: 'ابنِ مؤقت عد تنازلي احترافي مع ضبط الساعات والدقائق والثواني وتنبيه بصري وصوتي عند انتهاء الوقت.'
  },
  {
    label: 'Blog template',
    labelAr: 'قالب مدونة تقنية',
    prompt: 'Build a clean blog homepage template with a header, a list of post previews with titles, dates, and excerpts, a sidebar with categories, and a single-post reading view.',
    promptAr: 'صمم قالب مدونة احترافي يضم قائمة المقالات، التصنيفات الجانبية، البحث، ووضع قراءة مريح للمقال الكامل.'
  },
  {
    label: 'AI chatbot',
    labelAr: 'واجهة محادثة ذكية',
    prompt: 'Build an AI chatbot with a clean chat interface where I can send messages and get streaming replies, with a typing indicator, message history saved between visits, and a button to start a new conversation.',
    promptAr: 'صمم واجهة محادثة ذكية متكاملة مع سجل محادثات محفوظ، مؤشر كتابة حي، وتنسيق متقدم للرسائل والأكواد.'
  },
  {
    label: 'Personal finance tracker',
    labelAr: 'لوحة إدارة المالية الشخصية',
    prompt: 'Build a personal finance tracker where I can track my income, expenses, and savings, with a budget planner, a spending tracker, and a savings goal tracker.',
    promptAr: 'ابنِ لوحة تحكم لإدارة المالية الشخصية لمتابعة الدخل والمصروفات والمدخرات وأهداف الادخار برسوم بيانية.'
  }
];

export const STUDIO_TEMPLATES: StudioTemplate[] = (rawTemplates as any[]).map(t => ({
  slug: t.slug,
  name: t.name,
  category: t.category || 'Website',
  description: t.description || '',
  updated: t.updated || '2026-10-22',
  thumbnail: `https://raw.githubusercontent.com/Osama-Qonaibe/builder/main/src/templates/${t.slug}/screenshot.png`,
  suggestions: Array.isArray(t.suggestions) ? t.suggestions : [],
  instructions: t.instructions || '',
  features: Array.isArray(t.features) ? t.features : [],
  faq: Array.isArray(t.faq) ? t.faq : [],
  pageTitle: t.pageTitle || `${t.name} Template`,
  pageDescription: t.pageDescription || t.description || '',
  ogTagline: t.ogTagline || t.description || '',
  filePaths: Array.isArray(t.filePaths) ? t.filePaths : ['index.html', 'styles.css', 'app.js'],
  files: CORE_TEMPLATES_PAYLOADS[t.slug]
}));

export const CORE_TEMPLATES_MAP: Record<string, StudioTemplate> = Object.fromEntries(
  STUDIO_TEMPLATES.map(t => [t.slug, t])
);

export const TEMPLATE_CATEGORIES: string[] = [
  'All',
  ...Array.from(new Set(STUDIO_TEMPLATES.map(t => t.category)))
];

