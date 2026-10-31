import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Folder, FileCode, Database, Terminal, Download, Plus, Trash2, Edit2, ChevronRight, ChevronLeft, ArrowUpRight, Paperclip, Mic, Send, Sparkles, AlertTriangle, RefreshCw, X, Code, Globe, Layers, Monitor, Smartphone, Tablet, Wand2, Sliders, ArrowLeft, Square, Clock, Loader2, Key, MousePointer, History, RotateCcw, HardDrive, Check, Copy, ChevronDown, ShieldCheck, Lock, User, LogOut, Activity, Wallet, BrainCircuit } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { toast, PopCard, AssistantIcon, UnifiedCloudSyncBadge } from '@/design-system';
import initSqlJs from 'sql.js';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { resolveImageUrl, DEFAULT_AVATAR } from '../utils/imageResolver';
import { NotificationIconRenderer } from '../utils/imageProcessor';
import { TemplatesHub } from '../components/studio/TemplatesHub';
import { StudioConversation } from '../components/studio/StudioConversation';
import { StudioComposer } from '../components/studio/StudioComposer';
import { StudioStartScreen } from '../components/studio/StudioStartScreen';
import { StudioWorkspaceLayout } from '../components/studio/StudioWorkspaceLayout';
import { StudioHeader } from '../components/studio/StudioHeader';
import { StudioProjectDrawer } from '../components/studio/StudioProjectDrawer';
import { StudioPreviewPanel } from '../components/studio/StudioPreviewPanel';
import { StudioPreviewToolbar } from '../components/studio/StudioPreviewToolbar';
import { StudioCodeWorkspace } from '../components/studio/StudioCodeWorkspace';
import { StudioVersionsPanel } from '../components/studio/StudioVersionsPanel';
import { StudioIssuesPanel, type StudioIssueItem } from '../components/studio/StudioIssuesPanel';
import { StudioPublishPopover } from '../components/studio/StudioPublishPopover';
import { StudioNewFileDialog, StudioRenameDialog, StudioDeleteConfirmDialog } from '../components/studio/StudioProjectDialogs';
import type { StudioToolProgressStep } from '../components/studio/StudioBuildProgress';
import type { StudioTodoItem } from '../components/studio/StudioTodoList';
import type { StudioClarifyQuestion } from '../components/studio/StudioClarifyCard';
import type { StudioQueuedMessageItem } from '../components/studio/StudioMessageQueue';
import { SYSTEM_PROMPT } from '../components/studio/prompt';
import {
  getDynamicSystemPrompt,
  friendlyTodoLabelForFile,
  prepareHistoryForAI,
  formatClarificationRecap,
  buildFollowUpSuggestions
} from '../components/studio/studioEngine';
import { CORE_TEMPLATES_PAYLOADS, fetchStudioTemplateFiles } from '../components/studio/templateLoader';
import { CORE_TEMPLATES_MAP } from '../components/studio/templatesData';
import type { StudioTemplate, StudioChatMessage, StudioEditTarget } from '../components/studio/types';

interface ProjectFile {
  name: string;
  path: string;
  content: string;
  type: string;
  isEntry?: boolean;
}


export const AppStudioPage: React.FC = () => {
  const { theme, language, siteSettings, dir, token, user, setIsAuthModalOpen, logout, t } = useAppContext();
  const navigate = useNavigate();

  const getAuthToken = useCallback(() => {
    try {
      if (token) return token;
      if (typeof window !== 'undefined') {
        const direct = localStorage.getItem('token') || localStorage.getItem('auth_token') || sessionStorage.getItem('token');
        if (direct) return direct;
        const appToken = localStorage.getItem('app_token');
        if (appToken) return appToken;
      }
    } catch (e) {}
    return '';
  }, [token]);

  // Project Files State (Clean Initial Sovereign Launchpad with Logo)
  const isArInit = language === 'ar';
  const isDarkInit = theme === 'dark';
  const [files, setFiles] = useState<Record<string, ProjectFile>>({
    'index.html': {
      name: 'index.html',
      path: 'index.html',
      type: 'html',
      isEntry: true,
      content: `<!DOCTYPE html>
<html lang="${isArInit ? 'ar' : 'en'}" dir="${dir}" class="${isDarkInit ? 'dark' : ''} h-full">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isArInit ? 'استوديو البرمجيات - مشروع جديد' : 'Software Studio - New Project'}</title>
  <script src="/api/studio/proxy/tailwind"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Tajawal:wght@300;400;500;700;800;900&display=swap" rel="stylesheet">
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      min-height: 100%;
    }
  </style>
</head>
<body class="${isDarkInit ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} font-['Inter','Tajawal',sans-serif] min-h-screen w-full selection:bg-blue-600 selection:text-white">
  <div class="w-full min-h-screen flex flex-col items-center justify-center p-6 sm:p-10">
    <div class="max-w-md w-full text-center space-y-6">
    <!-- Brand Logo Glow Icon -->
    <div class="relative mx-auto w-16 h-16 rounded-shape-md bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-xl shadow-blue-500/25 flex items-center justify-center">
      <div class="w-full h-full ${isDarkInit ? 'bg-slate-900' : 'bg-white'} rounded-shape-sm flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="text-blue-500" style="width: 32px; height: 32px; max-width: 32px; max-height: 32px;">
          <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
          <polyline points="2 17 12 22 22 17"></polyline>
          <polyline points="2 12 12 17 22 12"></polyline>
        </svg>
      </div>
    </div>
    
    <div class="space-y-3">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-shape-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold">
        <span class="w-2 h-2 rounded-shape-full bg-blue-500 animate-ping"></span>
        <span>${isArInit ? 'جاهز للتطوير' : 'Ready to Build'}</span>
      </div>
      <h1 class="text-2xl font-black text-slate-900 dark:text-white">${isArInit ? 'استوديو تطوير البرمجيات' : 'Software Studio'}</h1>
      <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
        ${isArInit
          ? 'أدخل وصف التطبيق أو الميزة المطلوبة في لوحة المحادثة لتوليد ملفات المشروع وتشغيل المعاينة المباشرة.'
          : 'Enter your application description in the chat panel to generate project files and launch the live preview.'}
      </p>
    </div>
  </div>
</body>
</html>`
    }
  });

  const [mobileActiveTab, setMobileActiveTab] = useState<'preview' | 'chat' | 'files'>('preview');
  const [sideNavActiveTab, setSideNavActiveTab] = useState<'chat' | 'files' | 'projects' | 'versions' | 'db'>('chat');

  const [projectId, setProjectId] = useState<string>(() => {
    return localStorage.getItem('perplexta_active_project_id') || ('proj_' + Date.now());
  });
  const [projectName, setProjectName] = useState<string>(() => {
    return localStorage.getItem('perplexta_active_project_name') || (language === 'ar' ? 'مشروع جديد' : 'New Project');
  });
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);

  const [activeFilePath, setActiveFilePath] = useState('index.html');
  const [openTabs, setOpenTabs] = useState<string[]>(['index.html']);
  const closeTab = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTabs = openTabs.filter(t => t !== path);
    setOpenTabs(newTabs);
    if (activeFilePath === path) {
      setActiveFilePath(newTabs[newTabs.length - 1] || '');
    }
  };

  const openFile = (path: string) => {
    setActiveFilePath(path);
    setOpenTabs(prev => (prev.includes(path) ? prev : [...prev, path]));
    if (activeTab !== 'code') {
      setActiveTab('code');
    }
    setMobileActiveTab('preview');
  };
  const [pipelinePhase, setPipelinePhase] = useState<1 | 2 | 3 | null>(null);
  const [fileStatuses, setFileStatuses] = useState<Record<string, 'pending' | 'writing' | 'completed' | 'error'>>({});
  const [activeBlueprint, setActiveBlueprint] = useState<any>(null);
  const [isUploadMenuOpen, setIsUploadMenuOpen] = useState(false);

  // Progressive contextual suggestions state mapping & Short-Title -> Full-Prompt Catalog (Bilingual AR + EN)
  const [clickedSuggestions, setClickedSuggestions] = useState<string[]>([]);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  const PROGRESSIVE_SUGGESTIONS_MAP: Record<string, string> = {
    'صمم متجر إلكتروني احترافي للمنتجات الرقمية يضم واجهة هبوط عصرية مع سكرول أنيميشن، شبكة منتجات قابلة للتصفية، وسلة مشتريات منبثقة تفاعلية تحسب المجموع تلقائياً.': 'أضف نظام إدارة مخزون ذكي مع لوحة تحكم تظهر تنبيهات عند قرب نفاذ الكمية ونظام كوبونات خصم.',
    'أنشئ صفحة هبوط (SaaS) تفاعلية للشركات التقنية مع قسم مميزات متحرك، جدول خطط أسعار مقارن، ونموذج تواصل ذكي مع التحقق من البيانات.': 'أضف نظام اشتراكات شهري وسنوي مع بوابة دفع تجريبية وتوليد فواتير تلقائي بصيغة PDF.',
    'طور لوحة تحكم وإحصائيات متكاملة (Admin Dashboard) تضم رسوم بيانية تفاعلية لبيانات المبيعات، جداول قابلة للفرز، ونظام إدارة مستخدمين مع حالات ظهور مختلفة.': 'اربط لوحة التحكم بقاعدة بيانات SQLite لتخزين وتعديل بيانات المبيعات والمستخدمين بشكل حي ومؤمن.',
    'ابنِ موقع محفظة أعمال (Portfolio) إبداعي للمصممين مع معرض أعمال شبكي، نظام تبديل الوضع الليلي والنهاري، وتأثيرات انتقال سلسة بين الأقسام.': 'أضف صفحة تفصيلية لكل مشروع مع معرض صور منزلق متقدم (Slider) ونظام تقييم تفاعلي للأعمال.',
    'Design a professional digital products store featuring a modern landing interface with scroll animations, a filterable product grid, and an interactive popup shopping cart that auto-calculates totals.': 'Add a smart inventory management system with a dashboard that shows alerts when stock is low and a discount coupon system.',
    'Create an interactive SaaS landing page for tech startups with animated feature sections, a comparative pricing table, and a smart contact form with validation logic.': 'Add a monthly/annual subscription system with a demo payment gateway and automatic PDF invoice generation.',
    'Develop a comprehensive Admin Dashboard featuring interactive sales data charts, sortable data tables, and a user management system with various UI states.': 'Connect the dashboard to a SQLite database to live-store and edit sales and user data securely.',
    'Build a creative Portfolio website for designers with a grid-based work gallery, seamless dark/light mode switching, and smooth section transition effects.': 'Add a detailed page for each project with an advanced image slider and an interactive project rating system.'
  };

  const STUDIO_SUGGESTIONS_CATALOG: Array<{ labelAr: string; labelEn: string; fullAr: string; fullEn: string; aliases?: string[] }> = [
    {
      labelAr: 'متجر منتجات رقمية',
      labelEn: 'Digital Products Store',
      fullAr: 'صمم متجر إلكتروني احترافي للمنتجات الرقمية يضم واجهة هبوط عصرية مع سكرول أنيميشن، شبكة منتجات قابلة للتصفية، وسلة مشتريات منبثقة تفاعلية تحسب المجموع تلقائياً.',
      fullEn: 'Design a professional digital products store featuring a modern landing interface with scroll animations, a filterable product grid, and an interactive popup shopping cart that auto-calculates totals.'
    },
    {
      labelAr: 'منصة SaaS تقنية',
      labelEn: 'SaaS Landing Page',
      fullAr: 'أنشئ صفحة هبوط (SaaS) تفاعلية للشركات التقنية مع قسم مميزات متحرك، جدول خطط أسعار مقارن، ونموذج تواصل ذكي مع التحقق من البيانات.',
      fullEn: 'Create an interactive SaaS landing page for tech startups with animated feature sections, a comparative pricing table, and a smart contact form with validation logic.'
    },
    {
      labelAr: 'لوحة تحكم وإحصائيات',
      labelEn: 'Admin Dashboard',
      fullAr: 'طور لوحة تحكم وإحصائيات متكاملة (Admin Dashboard) تضم رسوم بيانية تفاعلية لبيانات المبيعات، جداول قابلة للفرز، ونظام إدارة مستخدمين مع حالات ظهور مختلفة.',
      fullEn: 'Develop a comprehensive Admin Dashboard featuring interactive sales data charts, sortable data tables, and a user management system with various UI states.'
    },
    {
      labelAr: 'معرض أعمال إبداعي',
      labelEn: 'Creative Portfolio',
      fullAr: 'ابنِ موقع محفظة أعمال (Portfolio) إبداعي للمصممين مع معرض أعمال شبكي، نظام تبديل الوضع الليلي والنهاري، وتأثيرات انتقال سلسة بين الأقسام.',
      fullEn: 'Build a creative Portfolio website for designers with a grid-based work gallery, seamless dark/light mode switching, and smooth section transition effects.'
    },
    {
      labelAr: 'إدارة مخزون وكوبونات',
      labelEn: 'Inventory & Coupons',
      fullAr: 'أضف نظام إدارة مخزون ذكي مع لوحة تحكم تظهر تنبيهات عند قرب نفاذ الكمية ونظام كوبونات خصم.',
      fullEn: 'Add a smart inventory management system with a dashboard that shows alerts when stock is low and a discount coupon system.',
      aliases: ['إضافة نظام كوبونات خصم وتخفيضات تفاعلي', 'Add discount coupons system', 'إضافة نظام كوبونات خصم وحساب الضريبة تلقائياً']
    },
    {
      labelAr: 'اشتراكات وفواتير PDF',
      labelEn: 'Subscriptions & PDF Invoices',
      fullAr: 'أضف نظام اشتراكات شهري وسنوي مع بوابة دفع تجريبية وتوليد فواتير تلقائي بصيغة PDF.',
      fullEn: 'Add a monthly/annual subscription system with a demo payment gateway and automatic PDF invoice generation.',
      aliases: ['ربط سلة المشتريات ببوابات دفع ذكية وفواتير مفصلة', 'Connect dynamic checkout & checkout forms', 'إنشاء لوحة إحصائيات المبيعات وتصدير الفواتير']
    },
    {
      labelAr: 'ربط قاعدة بيانات SQLite',
      labelEn: 'Connect SQLite DB',
      fullAr: 'اربط لوحة التحكم بقاعدة بيانات SQLite لتخزين وتعديل بيانات المبيعات والمستخدمين بشكل حي ومؤمن.',
      fullEn: 'Connect the dashboard to a SQLite database to live-store and edit sales and user data securely.'
    },
    {
      labelAr: 'معرض منزلق وتقييمات',
      labelEn: 'Image Slider & Ratings',
      fullAr: 'أضف صفحة تفصيلية لكل مشروع مع معرض صور منزلق متقدم (Slider) ونظام تقييم تفاعلي للأعمال.',
      fullEn: 'Add a detailed page for each project with an advanced image slider and an interactive project rating system.'
    },
    {
      labelAr: 'تسجيل دخول وحسابات',
      labelEn: 'User Login & Accounts',
      fullAr: 'طور نظام مصادقة وحسابات عملاء متكامل يضم نافذة تسجيل دخول وإنشاء حساب مع التحقق من الحقول، وإدارة الملف الشخصي وقاعدة بيانات المستخدمين.',
      fullEn: 'Build a complete user authentication and accounts module with sign-in/register modals, form validation, user profile state, and SQLite persistence.',
      aliases: ['تطوير بطاقة تسجيل دخول وقاعدة بيانات للمستخدمين', 'Build user login card & SQLite DB', 'تطوير نافذة تسجيل دخول وحسابات العملاء']
    },
    {
      labelAr: 'مراجعات وآراء العملاء',
      labelEn: 'Customer Testimonials',
      fullAr: 'صمم قسم مراجعات وآراء العملاء بشكل تفاعلي متحرك مع إمكانية إضافة تقييم جديد بالنجوم والفرز حسب التقييم.',
      fullEn: 'Design an interactive animated customer testimonials section with live star rating submission and sorting.',
      aliases: ['تصميم قسم مراجعات وآراء العملاء بشكل تفاعلي متحرك', 'Design dynamic animated testimonials section']
    },
    {
      labelAr: 'تحسين التجاوب للجوال',
      labelEn: 'Mobile Responsive UI',
      fullAr: 'حسّن التجاوب البصري الكامل مع شاشات الهواتف والأجهزة اللوحية، مع إضافة قائمة تنقل متجاوبة للجوال وتأثيرات حركية سلسة.',
      fullEn: 'Optimize full mobile and tablet responsive layouts with a collapsible mobile navigation drawer and smooth micro-interactions.',
      aliases: ['تحسين التجاوب البصري الكامل مع شاشات الجوال والتابلت', 'Perfect full mobile and tablet responsive layouts']
    },
    {
      labelAr: 'لوحة إدارة المشروع',
      labelEn: 'Admin Control Panel',
      fullAr: 'برمج لوحة إحصائيات وإدارة متكاملة للمشروع تتيح إضافة وتعديل وحذف العناصر مع رسوم بيانية حية للأداء.',
      fullEn: 'Build an interactive admin control panel allowing full CRUD operations on items with live performance charts.',
      aliases: ['برمجة لوحة إحصائيات وإدارة للمشروع', 'Build interactive admin dashboard panel']
    }
  ];


  // Sync initial splash screen or template payload when project opens
  useEffect(() => {

    const existingFileKeys = Object.keys(files);
    const indexContent = files['index.html']?.content || '';
    const isDefaultSplash = 
      existingFileKeys.length === 1 && 
      existingFileKeys[0] === 'index.html' && 
      (indexContent.includes('جاهز للتطوير') || indexContent.includes('Ready to Build') || indexContent.includes('Software Studio') || indexContent.includes('استوديو تطوير البرمجيات')) &&
      indexContent.length < 2500;

    const normName = (projectName || '').toLowerCase().trim();
    
    // Auto-detect template slug from project name
    let targetSlug = '';
    if (normName.includes('auto repair') || normName.includes('copperhill')) targetSlug = 'auto-repair';
    else if (normName.includes('ai image') || normName.includes('image generator')) targetSlug = 'ai-image-studio';
    else if (normName.includes('barber') || normName.includes('blade & comb')) targetSlug = 'barbershop';
    else if (normName.includes('coffee') || normName.includes('brew & bean')) targetSlug = 'coffee-shop';
    else if (normName.includes('bakery') || normName.includes('golden crust')) targetSlug = 'bakery';
    else if (normName.includes('law') || normName.includes('sterling')) targetSlug = 'law-firm';
    else if (normName.includes('ai chat')) targetSlug = 'ai-chat';
    else if (normName.includes('landing')) targetSlug = 'landing-page';

    if (isDefaultSplash && targetSlug && CORE_TEMPLATES_PAYLOADS[targetSlug]) {
      const payload = CORE_TEMPLATES_PAYLOADS[targetSlug];
      const newFiles: Record<string, ProjectFile> = {};
      Object.entries(payload).forEach(([path, content]) => {
        const ext = path.split('.').pop() || 'txt';
        newFiles[path] = {
          name: path,
          path: path,
          content: String(content),
          type: ext,
          isEntry: path === 'index.html'
        };
      });
      setFiles(newFiles);
      setSavedFiles(JSON.parse(JSON.stringify(newFiles)));
      setActiveFilePath('index.html');
      setOpenTabs(['index.html']);
      setIframeKey(prev => prev + 1);
      return;
    }

    if (isDefaultSplash) {
      const isAr = language === 'ar';
      const isDark = theme === 'dark';
      const updatedContent = `<!DOCTYPE html>
<html lang="${isAr ? 'ar' : 'en'}" dir="${dir}" class="${isDark ? 'dark' : ''} h-full">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isAr ? 'استوديو البرمجيات - مشروع جديد' : 'Software Studio - New Project'}</title>
  <script src="/api/studio/proxy/tailwind"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Tajawal:wght@300;400;500;700;800;900&display=swap" rel="stylesheet">
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      min-height: 100%;
    }
  </style>
</head>
<body class="${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} font-['Inter','Tajawal',sans-serif] min-h-screen w-full selection:bg-blue-600 selection:text-white">
  <div class="w-full min-h-screen flex flex-col items-center justify-center p-6 sm:p-10">
    <div class="max-w-md w-full text-center space-y-6">
    <!-- Brand Logo Glow Icon -->
    <div class="relative mx-auto w-16 h-16 rounded-shape-md bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-xl shadow-blue-500/25 flex items-center justify-center">
      <div class="w-full h-full ${isDark ? 'bg-slate-900' : 'bg-white'} rounded-shape-sm flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="text-blue-500" style="width: 32px; height: 32px; max-width: 32px; max-height: 32px;">
          <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
          <polyline points="2 17 12 22 22 17"></polyline>
          <polyline points="2 12 12 17 22 12"></polyline>
        </svg>
      </div>
    </div>
    
    <div class="space-y-3">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-shape-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold">
        <span class="w-2 h-2 rounded-shape-full bg-blue-500 animate-ping"></span>
        <span>${isAr ? 'جاهز للتطوير' : 'Ready to Build'}</span>
      </div>
      <h1 class="text-2xl font-black text-slate-900 dark:text-white">${isAr ? 'استوديو تطوير البرمجيات' : 'Software Studio'}</h1>
      <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
        ${isAr
          ? 'أدخل وصف التطبيق أو الميزة المطلوبة في لوحة المحادثة لتوليد ملفات المشروع وتشغيل المعاينة المباشرة.'
          : 'Enter your application description in the chat panel to generate project files and launch the live preview.'}
      </p>
    </div>
  </div>
</body>
</html>`;
      setFiles(prev => ({
        ...prev,
        'index.html': { ...prev['index.html'], content: updatedContent }
      }));
      setSavedFiles(prev => ({
        ...prev,
        'index.html': { ...prev['index.html'], content: updatedContent }
      }));
      setIframeKey(prev => prev + 1);
    }
  }, [language, dir, projectName, theme]);

  // Pro Cloud Studio Features (Inspect Mode, Env Vars, Self-Healing)
  const [isInspectMode, setIsInspectMode] = useState(false);
  const [isEnvModalOpen, setIsEnvModalOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isTemplatesHubOpen, setIsTemplatesHubOpen] = useState(false);
  const [selectedStudioTemplate, setSelectedStudioTemplate] = useState<StudioTemplate | null>(null);
  const [isStartScreenOpen, setIsStartScreenOpen] = useState(true);
  const [isProjectDrawerOpen, setIsProjectDrawerOpen] = useState(false);
  const [isVersionsPanelOpen, setIsVersionsPanelOpen] = useState(false);
  const [isIssuesPanelOpen, setIsIssuesPanelOpen] = useState(false);
  const [isPublishPopoverOpen, setIsPublishPopoverOpen] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [editTarget, setEditTarget] = useState<StudioEditTarget | null>(null);
  const [queuedMessages, setQueuedMessages] = useState<StudioQueuedMessageItem[]>([]);
  const [clarifyQuestions, setClarifyQuestions] = useState<StudioClarifyQuestion[]>([]);
  const [clarifyLeadIn, setClarifyLeadIn] = useState<string>('');
  const [pendingClarifyPrompt, setPendingClarifyPrompt] = useState<string>('');
  const [streamedTodos, setStreamedTodos] = useState<StudioTodoItem[]>([]);
  const [isRegeneratingSuggestions, setIsRegeneratingSuggestions] = useState(false);
  const recentSuggestionLabelsRef = useRef<string[]>([]);
  const [userIssues, setUserIssues] = useState<StudioIssueItem[]>([]);
  const [templateOrigin, setTemplateOrigin] = useState<{ slug: string; name: string; category?: string; thumbnail?: string } | null>(null);
  const [envVars, setEnvVars] = useState<Record<string, string>>({
    VITE_APP_TITLE: 'Perplexta App',
    VITE_API_URL: '/api'
  });
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvVal, setNewEnvVal] = useState('');
  const [runtimeError, setRuntimeError] = useState<{ message: string; file?: string } | null>(null);
  const [savedFiles, setSavedFiles] = useState<Record<string, ProjectFile>>(() => JSON.parse(JSON.stringify(files)));
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'local' | 'error'>(() => (user ? 'synced' : 'local'));
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const speechRecognitionRef = useRef<any>(null);
  const [userWorkspaces, setUserWorkspaces] = useState<any[]>([]);
  const [studioUsage, setStudioUsage] = useState<any>(null);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false);
  const [workspaceSnapshots, setWorkspaceSnapshots] = useState<any[]>([]);
  const [newSnapshotName, setNewSnapshotName] = useState('');
  const [isSnapshotLoading, setIsSnapshotLoading] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const toggleLogs = (msgId: string) => {
    setExpandedLogs(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  // Platform Confirmation & Deletion Modals State
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; title: string } | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  const [projectToRename, setProjectToRename] = useState<{ id: string; title: string } | null>(null);
  const [renameText, setRenameText] = useState('');
  const [isRenamingProject, setIsRenamingProject] = useState(false);

  const [snapshotToRestore, setSnapshotToRestore] = useState<{ id: number; name: string } | null>(null);
  const [isRestoringSnapshot, setIsRestoringSnapshot] = useState(false);

  const [fileToDelete, setFileToDelete] = useState<string | null>(null);

  const [isNewFileModalOpen, setIsNewFileModalOpen] = useState(false);
  const [newFilePathInput, setNewFilePathInput] = useState('');

  const [fileToRename, setFileToRename] = useState<string | null>(null);
  const [newFilePathRename, setNewFilePathRename] = useState('');
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<Array<{ type: 'log' | 'error' | 'success'; text: string; time: string }>>([
    {
      type: 'log',
      text: isArInit
        ? 'تم تشغيل بيئة التطوير الافتراضية.'
        : 'Development environment initialized.',
      time: new Date().toLocaleTimeString()
    },
    {
      type: 'log',
      text: isArInit
        ? 'تم تحميل ملف نقطة البدء وربط الموارد.'
        : 'Loaded entry point and mounted resources.',
      time: new Date().toLocaleTimeString()
    }
  ]);

  const [terminalInput, setTerminalInput] = useState('');

  const handleTerminalCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = terminalInput.trim();
    if (!cmd) return;
    setTerminalInput('');
    addLog('log', `$ ${cmd}`);

    const lower = cmd.toLowerCase();
    if (lower === 'clear' || lower === 'cls') {
      setTerminalLogs([]);
    } else if (lower === 'help') {
      addLog('log', language === 'ar' ? 'الأوامر المتاحة: help, clear, files, lint, fix, refresh, status, db' : 'Available commands: help, clear, files, lint, fix, refresh, status, db');
    } else if (lower === 'files' || lower === 'ls') {
      const list = Object.keys(files).map(k => `• ${k} (${files[k].content.length})`).join(' | ');
      addLog('log', language === 'ar' ? `ملفات المشروع: ${list}` : `Project files: ${list}`);
    } else if (lower === 'lint' || lower === 'check') {
      addLog('log', language === 'ar' ? 'جاري فحص سلامة الكود...' : 'Running code diagnostics...');
      let errorsFound = false;
      if (!files['index.html']?.content.includes('<html')) {
        addLog('error', language === 'ar' ? 'تنبيه: ملف نقطة البدء لا يحتوي على الوسم الأساسي' : 'Warning: Entry file is missing root HTML tag');
        errorsFound = true;
      }
      if (!errorsFound) {
        addLog('success', language === 'ar' ? 'فحص الكود: جميع الملفات سليمة.' : 'Diagnostics passed: All project files are valid.');
      }
    } else if (lower === 'fix') {
      handleAiFix();
    } else if (lower === 'refresh') {
      setIframeKey(prev => prev + 1);
      addLog('success', language === 'ar' ? 'تم تحديث شاشة المعاينة.' : 'Live preview refreshed.');
    } else if (lower === 'status') {
      addLog('log', language === 'ar'
        ? `الملفات: ${Object.keys(files).length} | النشط: ${activeFilePath} | قاعدة البيانات: ${sqlDb ? `متصلة (${sqlTables.length} جداول)` : 'غير مهيأة'}`
        : `Files: ${Object.keys(files).length} | Active: ${activeFilePath} | Database: ${sqlDb ? `Ready (${sqlTables.length} tables)` : 'Offline'}`);
    } else if (lower === 'db') {
      setIsDbModalOpen(true);
      addLog('success', language === 'ar' ? 'تم فتح إدارة قاعدة البيانات.' : 'Opened Database Manager.');
    } else {
      addLog('error', language === 'ar' ? `أمر غير معروف: "${cmd}".` : `Unknown command: "${cmd}".`);
    }
  };

  // AI Assistant Chat Messages & State (starts empty on new project, matching Osama-Qonaibe/builder)
  const [chatMessages, setChatMessages] = useState<StudioChatMessage[]>([]);

  const hasExecutedHubPromptRef = useRef(false);

  // Keep syncStatus accurately aligned with authentication state
  useEffect(() => {
    if (!user) {
      setSyncStatus('local');
    } else if (syncStatus === 'local') {
      setSyncStatus('synced');
    }
  }, [user]);

  // Post-Authentication restoration effect for pending app prompt or template
  useEffect(() => {
    if (!user) return;

    try {
      const pendingAppPrompt = sessionStorage.getItem('pending_app_prompt');
      if (pendingAppPrompt) {
        sessionStorage.removeItem('pending_app_prompt');
        setTimeout(() => {
          handleSendPrompt(pendingAppPrompt);
        }, 300);
      }

      const pendingTemplatePayload = sessionStorage.getItem('pending_app_template_payload');
      if (pendingTemplatePayload) {
        const proj = JSON.parse(pendingTemplatePayload);
        sessionStorage.removeItem('pending_app_template_payload');
        sessionStorage.removeItem('pending_app_template');
        if (proj.files) {
          setFiles(proj.files);
          setSavedFiles(proj.files);
          setIframeKey(prev => prev + 1);
        }
        if (proj.name) setProjectName(proj.name);
        if (proj.id) setProjectId(proj.id);
      }
    } catch (e) {}
  }, [user]);

  // Consume incoming project or prompt from Hub, or restore persistent workspace
  useEffect(() => {
    if (hasExecutedHubPromptRef.current) return;
    try {
      const pendingPrompt = sessionStorage.getItem('pending_ai_prompt');
      const rawHub = sessionStorage.getItem('current_active_project');

      if (!user && (pendingPrompt || rawHub)) {
        if (rawHub) {
          try {
            sessionStorage.setItem('pending_app_template_payload', rawHub);
          } catch (e) {}
        }
        if (pendingPrompt) {
          try {
            sessionStorage.setItem('pending_app_prompt', pendingPrompt);
          } catch (e) {}
        }
        setIsAuthModalOpen(true);
        return;
      }

      if (rawHub) {
        const proj = JSON.parse(rawHub);
        if (proj.id) {
          setProjectId(proj.id);
          localStorage.setItem('perplexta_active_project_id', proj.id);
        }
        if (proj.name) {
          setProjectName(proj.name);
          localStorage.setItem('perplexta_active_project_name', proj.name);
        }
        if (proj.files && Object.keys(proj.files).length > 0) {
          setFiles(proj.files);
          setSavedFiles(proj.files);
          setIframeKey(prev => prev + 1);
          sessionStorage.removeItem('current_active_project');
          sessionStorage.removeItem('pending_ai_prompt');
          return;
        }
      }

      if (pendingPrompt && pendingPrompt.trim().length > 0) {
        hasExecutedHubPromptRef.current = true;
        const promptToRun = pendingPrompt.trim();
        sessionStorage.removeItem('pending_ai_prompt');
        sessionStorage.removeItem('current_active_project');

        toast.info(language === 'ar' ? 'بدء تنفيذ أمر التوليد الذكي فورا...' : 'Starting immediate AI generation task...');
        setTimeout(() => {
          handleSendPrompt(promptToRun);
        }, 350);
        return;
      } else if (rawHub) {
        const proj = JSON.parse(rawHub);
        if (proj.description && proj.description.trim().length > 0) {
          hasExecutedHubPromptRef.current = true;
          const promptToRun = proj.description.trim();
          sessionStorage.removeItem('current_active_project');
          setTimeout(() => {
            handleSendPrompt(promptToRun);
          }, 350);
          return;
        }
      }

      const savedWorkspace = localStorage.getItem('perplexta_studio_workspace_v2');
      if (savedWorkspace) {
        const parsed = JSON.parse(savedWorkspace);
        if (parsed.projectId) {
          setProjectId(parsed.projectId);
          localStorage.setItem('perplexta_active_project_id', parsed.projectId);
        }
        if (parsed.projectName) {
          const cleanName = String(parsed.projectName)
            .replace(/استوديو بيربليكستا السيادي/g, 'استوديو تطوير البرمجيات')
            .replace(/\(IDE\)/g, '')
            .trim();
          setProjectName(cleanName);
          localStorage.setItem('perplexta_active_project_name', cleanName);
        }
        if (parsed.files && Object.keys(parsed.files).length > 0) {
          const restoredKeys = Object.keys(parsed.files);
          const idxContent = String(parsed.files['index.html']?.content || '');
          const isSavedLaunchpad =
            restoredKeys.length === 1 &&
            restoredKeys[0] === 'index.html' &&
            (idxContent.includes('جاهز للتطوير') ||
              idxContent.includes('Ready to Build') ||
              idxContent.includes('مشروع جديد فارغ') ||
              idxContent.includes('أدخل وصف التطبيق أو الميزة المطلوبة') ||
              idxContent.includes('Enter your application description in the chat panel'));

          if (!isSavedLaunchpad || (parsed.templateOrigin && parsed.templateOrigin.slug)) {
            setFiles(parsed.files);
            setSavedFiles(parsed.files);
            const targetActive = (parsed.activeFilePath && parsed.files[parsed.activeFilePath])
              ? parsed.activeFilePath
              : (restoredKeys.includes('index.html') ? 'index.html' : (restoredKeys[0] || 'index.html'));
            setActiveFilePath(targetActive);
            setOpenTabs(restoredKeys.slice(0, 5));
            if (parsed.envVars && typeof parsed.envVars === 'object') {
              setEnvVars(prev => ({ ...prev, ...parsed.envVars }));
            }
            if (Array.isArray(parsed.chatMessages) && parsed.chatMessages.length > 0) {
              const filteredMsgs = parsed.chatMessages.filter(
                (m: StudioChatMessage) =>
                  m.id !== 'welcome_1' &&
                  !(String(m.id || '').startsWith('welcome_') && !String(m.id || '').startsWith('welcome_tmpl_'))
              );
              setChatMessages(filteredMsgs);
            }
            if (Array.isArray(parsed.terminalLogs) && parsed.terminalLogs.length > 0) {
              setTerminalLogs(parsed.terminalLogs);
            }
            if (parsed.templateOrigin && typeof parsed.templateOrigin === 'object' && parsed.templateOrigin.slug) {
              setTemplateOrigin(parsed.templateOrigin);
            }
            setIsStartScreenOpen(false);
            setIframeKey(prev => prev + 1);
          }
        }
      }
    } catch (e) {
      console.warn('Error restoring studio workspace memory:', e);
    }
  }, []);

  // Listen to postMessage from preview iframe for console logs, runtime errors, and element inspector
  useEffect(() => {
    const handleIframeMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;
      const { type, level, message, info } = event.data;

      if (type === 'CONSOLE_LOG') {
        // Filter out harmless iframe WebSocket HMR connection errors
        const isWsError = typeof message === 'string' && (
          message.includes('WebSocket closed without opened') ||
          message.includes('failed to connect to websocket') ||
          message.includes('[vite]: failed to connect') ||
          message.includes('ws://') ||
          message.includes('wss://')
        );

        if (level === 'error') {
          if (isWsError) {
            addLog('log', `[معاينة Vite]: ${message}`);
            return;
          }
          addLog('error', `[المعاينة الحية]: ${message}`);
          setRuntimeError({ message });
        } else {
          addLog('log', `[المعاينة]: ${message}`);
        }
      } else if (type === 'INSPECT_ELEMENT_CLICK' && info) {
        setIsInspectMode(false);
        const tagDesc = info.tag ? `<${info.tag}${info.className ? ` class="${info.className}"` : ''}>` : 'العنصر المحدد';
        const textDesc = info.text ? ` بالنص "${info.text}"` : '';
        const generatedPrompt = `🎯 قم بتعديل وتطوير المكون والتصميم الخاص بـ ${tagDesc}${textDesc}: `;
        setPromptQuery(generatedPrompt);
        toast.success(language === 'ar' ? '🎯 تم التقاط العنصر بنجاح! صف التعديل المطلوب برمجياً' : 'Captured element! Describe your desired change.');
      }
    };

    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, [dir]);

  // Auto-Save Workspace State to Persistent Local Storage and Hub Registry with Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (!projectId) return;
        if (files && Object.keys(files).length > 0) {
          localStorage.setItem('perplexta_studio_workspace_v2', JSON.stringify({
            projectId,
            projectName,
            files,
            activeFilePath,
            envVars,
            chatMessages,
            templateOrigin,
            terminalLogs: terminalLogs.slice(-30)
          }));

          // Keep Hub Projects Registry updated in real time
          const rawHub = localStorage.getItem('perplexta_hub_projects');
          let hubList: any[] = rawHub ? JSON.parse(rawHub) : [];
          if (!Array.isArray(hubList)) hubList = [];

          const existingIdx = hubList.findIndex(p => p.id === projectId);
          const hubProj = {
            id: projectId,
            name: projectName,
            description: files['index.html'] ? 'مشروع تفاعلي مكتمل في استوديو بيربليكستا' : 'مشروع ويب جديد قيد البناء',
            techStack: 'HTML5 / JS / SQLite',
            updatedAt: language === 'ar' ? 'الآن' : 'Just now',
            dbSize: '128 KB',
            tablesCount: Object.keys(files).length,
            recordsCount: 1,
            isAutoSaved: true,
            files: files
          };

          if (existingIdx >= 0) {
            hubList[existingIdx] = { ...hubList[existingIdx], ...hubProj };
          } else {
            hubList.unshift(hubProj);
          }
          localStorage.setItem('perplexta_hub_projects', JSON.stringify(hubList));
        }
      } catch (_) {}
    }, 2000);

    return () => clearTimeout(timer);
  }, [files, activeFilePath, envVars, chatMessages, terminalLogs, projectId, projectName, dir, language]);

  const hasUnsavedChanges = files[activeFilePath]?.content !== savedFiles[activeFilePath]?.content;

  const handleSaveChanges = () => {
    setSavedFiles(JSON.parse(JSON.stringify(files)));
    setIframeKey(prev => prev + 1);
    toast.success(language === 'ar' ? `تم حفظ الملف ${activeFilePath} بنجاح وتحديث المعاينة!` : `Successfully saved ${activeFilePath} & updated preview!`);
    addLog('success', `حفظ التغييرات وتحديث المعاينة للملف: ${activeFilePath}`);
    saveProjectToDb();
  };

  const handleUndoChanges = () => {
    if (savedFiles[activeFilePath]) {
      setFiles(prev => ({
        ...prev,
        [activeFilePath]: { ...prev[activeFilePath], content: savedFiles[activeFilePath].content }
      }));
      toast.info(language === 'ar' ? 'تم التراجع عن التغييرات غير الحفظ' : 'Reverted to last saved version');
      addLog('log', `تراجع عن التغييرات في الملف: ${activeFilePath}`);
    }
  };
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [deviceMode, setDeviceMode] = useState<'responsive' | 'mobile' | 'tablet'>('responsive');
  const [isDeviceMenuOpen, setIsDeviceMenuOpen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [promptQuery, setPromptQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamStatusMessage, setStreamStatusMessage] = useState<string>('');
  const [liveStreamText, setLiveStreamText] = useState<string>('');
  const [currentlyWritingFile, setCurrentlyWritingFile] = useState<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setStreamStatusMessage('');
    setLiveStreamText('');
    setCurrentlyWritingFile('');
    setFileStatuses(prev => {
      const next: Record<string, 'pending' | 'writing' | 'completed' | 'error'> = {};
      Object.keys(prev).forEach(k => {
        next[k] = files[k]?.content?.trim() ? 'completed' : 'pending';
      });
      return next;
    });
    setIframeKey(prev => prev + 1);
    addLog('log', 'تم إيقاف عملية التوليد في الوقت الفعلي مع الاحتفاظ بالملفات المكتملة.');
    setChatMessages(prev => [
      ...prev,
      {
        id: `stop_${Date.now()}`,
        role: 'assistant',
        text: language === 'ar' ? 'تم إيقاف عملية التوليد بناءً على طلبك، وتم الاحتفاظ بجميع الملفات التي اكتمل إنشاؤها في شجرة المشروع.' : 'Generation stopped by user. All completed files have been preserved in the project tree.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    toast.info(language === 'ar' ? 'تم إيقاف التوليد' : 'Generation stopped');
  };

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isGenerating]);


  // Terminal & Logs State
  const addLog = useCallback((type: 'log' | 'error' | 'success', text: string) => {
    setTerminalLogs(prev => [...prev, { type, text, time: new Date().toLocaleTimeString() }]);
  }, []);

  // SQLite Database via sql.js
  const [sqlDb, setSqlDb] = useState<any>(null);
  const [sqlTables, setSqlTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableDataRows, setTableDataRows] = useState<any[]>([]);
  const [tableColumns, setTableColumns] = useState<string[]>([]);
  const [sqlCustomQuery, setSqlCustomQuery] = useState('SELECT * FROM products;');
  const [queryResult, setQueryResult] = useState<any>(null);

  const refreshTables = useCallback((db: any) => {
    try {
      if (!db) return;
      const res = db.exec("SELECT name FROM sqlite_master WHERE type='table';");
      if (res && res[0] && res[0].values) {
        const tables = res[0].values.map((v: any) => v[0] as string);
        setSqlTables(tables);
        if (tables.length > 0 && !tables.includes(selectedTable)) {
          setSelectedTable(tables[0]);
        }
      }
    } catch (e) {}
  }, [selectedTable]);

  // Initialize SQLite
  useEffect(() => {
    let isMounted = true;
    try {
      const sqlInitializer = typeof initSqlJs === 'function' ? initSqlJs : (initSqlJs as any)?.default;
      if (typeof sqlInitializer === 'function') {
        sqlInitializer({
          locateFile: (file: string) => `/${file}`
        }).then((SQL: any) => {
          if (!isMounted) return;
          const db = new SQL.Database();
          const schema = files['db/schema.sql']?.content || '';
          try {
            if (schema) db.run(schema);
            setSqlDb(db);
            refreshTables(db);
            addLog('success', 'تم تهيئة محرك SQLite الافتراضي بنجاح من schema.sql');
          } catch (err: any) {
            addLog('error', `خطأ في تهيئة قاعدة البيانات: ${err.message}`);
          }
        }).catch((err: any) => {
          console.warn('sql.js load error:', err);
        });
      }
    } catch (err) {
      console.warn('sql.js initialization error:', err);
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // Re-sync SQLite database whenever db/schema.sql content changes
  useEffect(() => {
    const schemaContent = files['db/schema.sql']?.content;
    if (!sqlDb || !schemaContent) return;
    try {
      sqlDb.run(schemaContent);
      refreshTables(sqlDb);
    } catch (err: any) {
      // Ignore duplicate table creation notices during incremental typing
    }
  }, [files, sqlDb, refreshTables]);

  // Load table data when selectedTable changes
  useEffect(() => {
    if (!sqlDb || !selectedTable) return;
    try {
      const res = sqlDb.exec(`SELECT * FROM ${selectedTable};`);
      if (res && res[0]) {
        setTableColumns(res[0].columns);
        setTableDataRows(res[0].values);
      } else {
        setTableColumns([]);
        setTableDataRows([]);
      }
    } catch (e) {
      setTableColumns([]);
      setTableDataRows([]);
    }
  }, [sqlDb, selectedTable, isDbModalOpen]);

  const runCustomSqlQuery = () => {
    if (!sqlDb) return;
    try {
      const res = sqlDb.exec(sqlCustomQuery);
      if (res && res[0]) {
        setQueryResult({ columns: res[0].columns, values: res[0].values });
        addLog('success', `تنفيذ الاستعلام بنجاح: ${sqlCustomQuery}`);
      } else {
        setQueryResult({ success: true, message: 'تم تنفيذ الاستعلام بنجاح (لا توجد نتائج مرجعة).' });
        addLog('success', 'تم تنفيذ الاستعلام بنجاح.');
      }
      refreshTables(sqlDb);
    } catch (err: any) {
      setQueryResult({ error: err.message });
      addLog('error', `خطأ SQL: ${err.message}`);
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PERPLEXTA_LOAD_CODE') {
        // Load code from host (database)
        if (event.data.files) {
          setFiles(event.data.files);
          addLog('success', 'Project loaded successfully via host event');
        }
      } else if (event.data?.type === 'PERPLEXTA_SAVE_CODE') {
        // Handle trigger save
        saveProjectToDb();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const saveProjectToDb = async (overrideId?: string, overrideTitle?: string, overrideFiles?: Record<string, ProjectFile>, overrideEnvVars?: Record<string, string>) => {
    const token = getAuthToken();
    if (!user || !token) {
      setSyncStatus('local');
      return;
    }
    const targetId = overrideId || projectId;
    if (!targetId) {
      setSyncStatus('local');
      return;
    }
    const targetTitle = overrideTitle || projectName || (language === 'ar' ? 'مشروع جديد' : 'My Project');
    const targetFiles = overrideFiles || files;
    const targetEnvVars = overrideEnvVars || envVars;

    setSyncStatus('saving');
    try {
      const res = await fetch('/api/studio/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: targetId,
          title: targetTitle,
          description: targetFiles['index.html'] ? 'مشروع ويب تفاعلي في استوديو بيربليكستا' : 'مسودة مشروع جديد',
          frameworkMode: 'html',
          files: targetFiles,
          chatHistory: chatMessages.slice(-50),
          isPublic: false,
          metadata: { envVars: targetEnvVars }
        })
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.localOnly || data.limitReached) {
          setSyncStatus('local');
          if (data.limitReached && data.message) {
            toast.warning(data.message);
            addLog('log', data.message);
          }
        } else {
          setSyncStatus('synced');
          addLog('success', `تم حفظ (${targetTitle}) سحابياً في قاعدة البيانات بنجاح.`);
          fetchStudioUsage();
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 403 && (errData.error === 'STUDIO_PROJECTS_LIMIT_REACHED' || errData.error === 'STUDIO_STORAGE_LIMIT_EXCEEDED')) {
          setSyncStatus('error');
          const msg = language === 'ar' ? (errData.message || 'تم بلوغ حد الاستوديو في خطتك') : (errData.messageEn || 'Studio quota limit reached for your plan');
          toast.error(msg);
          addLog('error', msg);
        } else {
          setSyncStatus('error');
        }
      }
    } catch (e: any) {
      console.warn('Auto-save workspace error:', e);
      setSyncStatus('error');
    }
  };

  const fetchStudioUsage = async () => {
    try {
      if (!user) return;
      const token = getAuthToken();
      if (!token) return;
      const res = await fetch('/api/studio/usage', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStudioUsage(data);
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    if (user) {
      fetchStudioUsage();
      fetchUserWorkspaces();
    } else {
      setStudioUsage(null);
      setUserWorkspaces([]);
    }
  }, [user]);

  const fetchUserWorkspaces = async () => {
    if (!user) {
      setUserWorkspaces([]);
      return [];
    }
    setIsLoadingWorkspaces(true);
    try {
      const token = getAuthToken();
      if (!token) {
        setUserWorkspaces([]);
        return [];
      }
      const res = await fetch('/api/studio/workspaces', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setUserWorkspaces(list);
        return list;
      }
    } catch (err) {
      console.warn('Failed to fetch workspaces:', err);
    } finally {
      setIsLoadingWorkspaces(false);
    }
    return [];
  };

  const fetchSnapshots = async (wsId: string) => {
    try {
      if (!user) return;
      const token = getAuthToken();
      if (!token) return;
      const res = await fetch(`/api/studio/workspaces/${wsId}/snapshots`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWorkspaceSnapshots(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn('Failed to fetch snapshots:', err);
    }
  };

  const handleCreateSnapshot = async (customName?: string, customFiles?: Record<string, ProjectFile>) => {
    const nameToUse = (customName || newSnapshotName).trim();
    if (!nameToUse) return;
    
    setIsSnapshotLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/studio/workspaces/${projectId}/snapshots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ versionName: nameToUse, files: customFiles || files })
      });
      if (res.ok) {
        if (!customName) {
          toast.success(language === 'ar' ? 'تم إنشاء لقطة الإصدار بنجاح!' : 'Snapshot created!');
          setNewSnapshotName('');
        }
        fetchSnapshots(projectId);
      }
    } catch (err: any) {
      if (!customName) toast.error(err.message);
    } finally {
      setIsSnapshotLoading(false);
    }
  };

  const handleRestoreSnapshot = (snapshotId: number, versionName: string) => {
    setSnapshotToRestore({ id: snapshotId, name: versionName });
  };

  const executeRestoreSnapshot = async () => {
    if (!snapshotToRestore) return;
    setIsRestoringSnapshot(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/studio/workspaces/${projectId}/snapshots/${snapshotToRestore.id}/restore`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.files) {
          setFiles(data.files);
          setSavedFiles(data.files);
          const restoredKeys = Object.keys(data.files);
          const nextActive = restoredKeys.includes('index.html') ? 'index.html' : (restoredKeys[0] || '');
          setActiveFilePath(nextActive);
          setOpenTabs(restoredKeys.slice(0, 5));
          setIframeKey(prev => prev + 1);
          toast.success(language === 'ar' ? `تم استعادة الإصدار (${snapshotToRestore.name}) بنجاح!` : `Restored ${snapshotToRestore.name}!`);
          addLog('success', `تم استعادة الإصدار: ${snapshotToRestore.name}`);
        }
        setSnapshotToRestore(null);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsRestoringSnapshot(false);
    }
  };

  const handleSwitchWorkspace = async (ws: any) => {
    if (ws.id === projectId) {
      return;
    }
    // Safely auto-save the current project before switching
    await saveProjectToDb();

    const loadedFiles = typeof ws.files === 'string' ? JSON.parse(ws.files) : (ws.files || {});
    const loadedKeys = Object.keys(loadedFiles);
    const entryFile = loadedKeys.includes('index.html') ? 'index.html' : (loadedKeys[0] || 'index.html');
    setProjectId(ws.id);
    setProjectName(ws.title);
    setFiles(loadedFiles);
    setSavedFiles(loadedFiles);
    setActiveFilePath(entryFile);
    setOpenTabs(loadedKeys.length > 0 ? loadedKeys.slice(0, 5) : ['index.html']);
    setIsStartScreenOpen(false);
    if (ws.metadata && typeof ws.metadata === 'object' && ws.metadata.envVars) {
      setEnvVars(ws.metadata.envVars);
    }
    if (Array.isArray(ws.chat_history) && ws.chat_history.length > 0) {
      setChatMessages(
        ws.chat_history.filter(
          (m: StudioChatMessage) =>
            m.id !== 'welcome_1' &&
            !(String(m.id || '').startsWith('welcome_') && !String(m.id || '').startsWith('welcome_tmpl_'))
        )
      );
    } else {
      setChatMessages([]);
    }
    setIframeKey(prev => prev + 1);

    localStorage.setItem('perplexta_active_project_id', ws.id);
    localStorage.setItem('perplexta_active_project_name', ws.title);
    toast.success(language === 'ar' ? `تم تحميل مشروع: ${ws.title}` : `Loaded project: ${ws.title}`);
    addLog('success', `تم التبديل إلى المشروع السحابي: ${ws.title}`);
  };

  const handleDeleteWorkspacePrompt = (wsId: string, wsTitle: string) => {
    setProjectToDelete({ id: wsId, title: wsTitle });
    setDeleteConfirmText('');
  };

  const executeDeleteWorkspace = async () => {
    if (!projectToDelete) return;
    if (deleteConfirmText.trim() !== projectToDelete.title.trim()) {
      toast.error(language === 'ar' ? 'يرجى كتابة اسم المشروع بدقة لتأكيد الحذف' : 'Please type the exact project name to confirm');
      return;
    }

    setIsDeletingProject(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/studio/workspaces/${projectToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        // Clean Hub projects from LocalStorage
        try {
          const rawHub = localStorage.getItem('perplexta_hub_projects');
          if (rawHub) {
            let hubList = JSON.parse(rawHub);
            if (Array.isArray(hubList)) {
              hubList = hubList.filter((p: any) => p.id !== projectToDelete.id);
              localStorage.setItem('perplexta_hub_projects', JSON.stringify(hubList));
            }
          }
        } catch (_) {}

        // Clean local active workspace storage if active
        try {
          const rawCurrent = localStorage.getItem('perplexta_studio_workspace_v2');
          if (rawCurrent) {
            const currentObj = JSON.parse(rawCurrent);
            if (currentObj && currentObj.projectId === projectToDelete.id) {
              localStorage.removeItem('perplexta_studio_workspace_v2');
            }
          }
        } catch (_) {}

        toast.success(language === 'ar' ? `تم حذف المشروع "${projectToDelete.title}" وكافة مشتقاته وإصداراته نهائياً من قاعدة البيانات!` : `Permanently deleted "${projectToDelete.title}" and all snapshots!`);
        addLog('success', `تم حذف المشروع السحابي ومشتقاته من قاعدة البيانات: ${projectToDelete.title}`);
        
        const fetchedList = await fetchUserWorkspaces();
        fetchStudioUsage();
        const remainingList = Array.isArray(fetchedList) && fetchedList.length > 0
          ? fetchedList
          : userWorkspaces.filter(w => w.id !== projectToDelete.id);

        if (projectToDelete.id === projectId) {
          if (remainingList.length > 0) {
            // Switch to the top remaining workspace
            const nextTarget = remainingList[0];
            setProjectId(nextTarget.id);
            setProjectName(nextTarget.title);
            const loadedFiles = typeof nextTarget.files === 'string' ? JSON.parse(nextTarget.files) : (nextTarget.files || {});
            const loadedKeys = Object.keys(loadedFiles);
            setFiles(loadedFiles);
            setSavedFiles(loadedFiles);
            setActiveFilePath(loadedKeys.includes('index.html') ? 'index.html' : (loadedKeys[0] || 'index.html'));
            setOpenTabs(loadedKeys.length > 0 ? loadedKeys.slice(0, 5) : ['index.html']);
            if (nextTarget.metadata && typeof nextTarget.metadata === 'object' && nextTarget.metadata.envVars) {
              setEnvVars(nextTarget.metadata.envVars);
            }
            if (Array.isArray(nextTarget.chat_history) && nextTarget.chat_history.length > 0) {
              setChatMessages(nextTarget.chat_history);
            }
            setIframeKey(prev => prev + 1);
            localStorage.setItem('perplexta_active_project_id', nextTarget.id);
            localStorage.setItem('perplexta_active_project_name', nextTarget.title);
            toast.info(language === 'ar' ? `الانتقال إلى مشروع: ${nextTarget.title}` : `Switched to project: ${nextTarget.title}`);
          } else {
            // Enter Standby Mode without creating a new database record
            setProjectId('');
            setProjectName(language === 'ar' ? 'استوديو التطبيقات' : 'App Studio');
            try {
              localStorage.removeItem('perplexta_active_project_id');
              localStorage.removeItem('perplexta_active_project_name');
              localStorage.removeItem('perplexta_studio_workspace_v2');
              sessionStorage.removeItem('current_active_project');
            } catch (_) {}

            const standbyFiles: Record<string, ProjectFile> = {
              'index.html': {
                name: 'index.html',
                path: 'index.html',
                type: 'html',
                isEntry: true,
                content: `<!DOCTYPE html>
<html lang="${language === 'ar' ? 'ar' : 'en'}" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${language === 'ar' ? 'استوديو البرمجيات' : 'Software Studio'}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Tajawal:wght@300;400;500;700;800;900&display=swap" rel="stylesheet">
</head>
<body class="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-['Inter','Tajawal',sans-serif] min-h-screen flex items-center justify-center p-6">
  <div class="max-w-md w-full text-center space-y-6">
    <div class="relative mx-auto w-16 h-16 rounded-shape-md bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-xl flex items-center justify-center">
      <div class="w-full h-full bg-slate-900 rounded-shape-sm flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="text-blue-500">
          <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
          <polyline points="2 17 12 22 22 17"></polyline>
          <polyline points="2 12 12 17 22 12"></polyline>
        </svg>
      </div>
    </div>
    
    <div class="space-y-3">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-shape-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs font-bold">
        <span>${language === 'ar' ? 'وضع الاستعداد' : 'Standby Mode'}</span>
      </div>
      <h1 class="text-2xl font-black text-slate-900 dark:text-white">${language === 'ar' ? 'استوديو التطبيقات' : 'App Studio'}</h1>
      <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
        ${language === 'ar'
          ? 'اختر مشروعاً من القائمة الجانبية للتعديل عليه، أو أنشئ مشروعاً جديداً للبدء.'
          : 'Select a project from the sidebar to edit, or create a new project to get started.'}
      </p>
    </div>
  </div>
</body>
</html>`
              }
            };

            setFiles(standbyFiles);
            setSavedFiles(standbyFiles);
            setActiveFilePath('index.html');
            setOpenTabs(['index.html']);
            setIframeKey(prev => prev + 1);

            setChatMessages([
              {
                id: `standby_${Date.now()}`,
                role: 'assistant',
                text: language === 'ar'
                  ? 'تم حذف المشروع بنجاح. يمكنك اختيار مشروع آخر من القائمة أو بدء مشروع جديد بإدخال وصف للطلب.'
                  : 'Project deleted successfully. Select an existing project from the list or describe a new app to start.',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            ]);
          }
        }
        setProjectToDelete(null);
        setDeleteConfirmText('');
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || (language === 'ar' ? 'فشل حذف المشروع' : 'Failed to delete project'));
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsDeletingProject(false);
    }
  };

  const handleRenameWorkspacePrompt = (wsId: string, currentTitle: string) => {
    setProjectToRename({ id: wsId, title: currentTitle });
    setRenameText(currentTitle);
  };

  const executeRenameWorkspace = async () => {
    if (!projectToRename || !renameText.trim()) return;

    setIsRenamingProject(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/studio/workspaces/${projectToRename.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ title: renameText.trim() })
      });
      if (res.ok) {
        toast.success(language === 'ar' ? `تم تعديل اسم المشروع إلى "${renameText.trim()}"` : `Renamed to "${renameText.trim()}"`);
        if (projectToRename.id === projectId) {
          setProjectName(renameText.trim());
          localStorage.setItem('perplexta_active_project_name', renameText.trim());
        }
        fetchUserWorkspaces();
        setProjectToRename(null);
        setRenameText('');
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || (language === 'ar' ? 'فشل تعديل اسم المشروع' : 'Failed to rename project'));
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsRenamingProject(false);
    }
  };

  const executeDeleteFile = () => {
    if (!fileToDelete) return;
    const path = fileToDelete;
    const updatedFiles = { ...files };
    delete updatedFiles[path];
    setFiles(updatedFiles);
    setSavedFiles(prev => {
      const next = { ...prev };
      delete next[path];
      return next;
    });
    const remainingTabs = openTabs.filter(t => t !== path);
    setOpenTabs(remainingTabs);
    if (activeFilePath === path) {
      const fallbackPath = remainingTabs[remainingTabs.length - 1] || Object.keys(updatedFiles)[0] || '';
      setActiveFilePath(fallbackPath);
    }
    setFileToDelete(null);
    setIframeKey(prev => prev + 1);
    saveProjectToDb(projectId, projectName, updatedFiles);
    toast.success(language === 'ar' ? 'تم حذف الملف بنجاح' : 'File deleted successfully');
  };

  const handleUploadZip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const zip = new JSZip();
      const zipData = await zip.loadAsync(file);
      const newFiles: Record<string, ProjectFile> = { ...files };

      const promises = Object.keys(zipData.files).map(async (filename) => {
        const zipFile = zipData.files[filename];
        if (!zipFile.dir) {
          const fileContent = await zipFile.async('string');
          const ext = filename.split('.').pop() || 'text';
          newFiles[filename] = {
            name: filename.split('/').pop() || filename,
            path: filename,
            content: fileContent,
            type: ext
          };
        }
      });

      await Promise.all(promises);
      const extractedKeys = Object.keys(newFiles);
      const nextActive = extractedKeys.includes('index.html') ? 'index.html' : (extractedKeys[0] || activeFilePath);
      setFiles(newFiles);
      setSavedFiles(newFiles);
      setActiveFilePath(nextActive);
      setOpenTabs(extractedKeys.slice(0, 5));
      setIframeKey(prev => prev + 1);
      saveProjectToDb(projectId, projectName, newFiles);
      toast.success(language === 'ar' ? 'تم رفع الملفات من الأرشيف بنجاح!' : 'Files extracted and uploaded successfully!');
      addLog('success', `تم رفع أرشيف ZIP: ${file.name}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    const newFiles: Record<string, ProjectFile> = { ...files };
    let count = 0;
    const uploadedPaths: string[] = [];

    Array.from(uploadedFiles).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const ext = file.name.split('.').pop() || 'text';
        newFiles[file.name] = {
          name: file.name,
          path: file.name,
          content: content,
          type: ext
        };
        uploadedPaths.push(file.name);
        count++;
        if (count === uploadedFiles.length) {
          setFiles({ ...newFiles });
          setSavedFiles({ ...newFiles });
          setOpenTabs(prev => Array.from(new Set([...prev, ...uploadedPaths])));
          if (uploadedPaths.length > 0) {
            setActiveFilePath(uploadedPaths[0]);
          }
          setIframeKey(prev => prev + 1);
          saveProjectToDb(projectId, projectName, newFiles);
          toast.success(language === 'ar' ? `تم رفع ${uploadedFiles.length} ملفات!` : `Uploaded ${uploadedFiles.length} files!`);
          addLog('success', `تم رفع ${uploadedFiles.length} ملفات يدوياً.`);
        }
      };
      reader.readAsText(file);
    });
    
    if (e.target) e.target.value = '';
  };
  // Clean Virtual HTML Bundler for flawless instant iframe sync without Blob URL CSP blocking
  const previewSrcDoc = useMemo(() => {
    let rawHtml = files['index.html']?.content || '<div class="p-8 text-center text-slate-400">جاري تحميل المشروع...</div>';
    if (rawHtml.includes('\\n') && (rawHtml.match(/\\n/g)?.length || 0) > 3) {
      rawHtml = rawHtml
        .replace(/\\r\\n/g, '\n')
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"');
    }

    // Replace relative local <script src="..."> and <link href="..."> tags to avoid 404 network fetch errors in srcdoc
    let htmlContent = rawHtml
      .replace(/<script\s+[^>]*src=["'](?!https?:\/\/|\/\/|\/api\/)[^"']+\.(?:jsx?|tsx?|js|ts)["'][^>]*>\s*<\/script>/gi, '')
      .replace(/<link\s+[^>]*href=["'](?!https?:\/\/|\/\/|\/api\/)[^"']+\.css["'][^>]*\/?>/gi, '')
      // Rewrite any remaining external CDN links inside user html to our local, cached, CSP-immune proxy
      .replace(/https:\/\/unpkg\.com\/scrollreveal(?:\/dist\/scrollreveal\.min\.js)?/gi, '/api/studio/proxy/scrollreveal')
      .replace(/https:\/\/unpkg\.com\/lucide@latest\/dist\/umd\/lucide\.js/gi, '/api/studio/proxy/lucide')
      .replace(/https:\/\/unpkg\.com\/lucide@latest/gi, '/api/studio/proxy/lucide')
      .replace(/https:\/\/cdn\.tailwindcss\.com/gi, '/api/studio/proxy/tailwind');

    // Collect all CSS files
    let allCss = Object.keys(files)
      .filter(p => p.endsWith('.css'))
      .map(p => {
        let c = files[p].content || '';
        if (c.includes('\\n') && (c.match(/\\n/g)?.length || 0) > 2) c = c.replace(/\\n/g, '\n');
        return `/* --- ${p} --- */\n${c}`;
      })
      .join('\n\n');

    // Resolve relative asset references (e.g. icon.svg, logo.svg) from project files into data URIs
    Object.entries(files).forEach(([filePath, fileObj]) => {
      if (!fileObj || typeof fileObj.content !== 'string') return;
      const fileName = filePath.replace(/^\/+/, '');
      if (fileName.endsWith('.svg')) {
        const svgContent = fileObj.content.trim();
        if (svgContent.startsWith('<svg') || svgContent.includes('<svg')) {
          const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
          const escapedName = fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`(['"])(?:\\.\\/|\\/)?${escapedName}(['"])`, 'g');
          htmlContent = htmlContent.replace(regex, `$1${dataUri}$2`);
          allCss = allCss.replace(regex, `$1${dataUri}$2`);
        }
      }
    });

    // Collect and topologically sort all JS, JSX, TS, TSX files (filtering out build/config files)
    const configBlacklist = ['vite.config.js', 'vite.config.ts', 'tailwind.config.js', 'tailwind.config.cjs', 'postcss.config.js', 'package.json', 'tsconfig.json'];
    const allCodeFiles = Object.keys(files)
      .filter(p => !configBlacklist.some(cfg => p.endsWith(cfg)))
      .filter(p => p.endsWith('.js') || p.endsWith('.jsx') || p.endsWith('.ts') || p.endsWith('.tsx'))
      .filter(p => files[p] && typeof files[p].content === 'string' && files[p].content.trim().length > 0);

    const getFilePriority = (path: string) => {
      const lower = path.toLowerCase();
      if (lower.includes('types') || lower.includes('constants') || lower.includes('config')) return 1;
      if (lower.includes('data') || lower.includes('mock') || lower.includes('store') || lower.includes('seed')) return 2;
      if (lower.includes('utils') || lower.includes('helpers') || lower.includes('services') || lower.includes('api')) return 3;
      if (lower.includes('context') || lower.includes('hooks')) return 4;
      if (lower.includes('components') || lower.includes('ui') || lower.includes('widgets')) return 5;
      if (lower.includes('pages') || lower.includes('sections')) return 6;
      if (lower.endsWith('app.jsx') || lower.endsWith('app.tsx')) return 7;
      if (lower.endsWith('main.jsx') || lower.endsWith('main.tsx') || lower.endsWith('index.jsx') || lower.endsWith('index.tsx') || lower === 'src/app.js' || lower === 'app.js' || lower === 'script.js' || lower === 'main.js') return 8;
      return 5;
    };

    const sortedFiles = [...allCodeFiles].sort((a, b) => getFilePriority(a) - getFilePriority(b));

    // If the project contains custom React code, and index.html still contains the initial launchpad splash card,
    // upgrade index.html automatically to an app container so the app can mount cleanly.
    const isDarkTheme = theme === 'dark';
    const isLaunchpadSplash = (htmlContent.includes('Ready to Build') || htmlContent.includes('جاهز للتطوير') || htmlContent.includes('Software Studio') || htmlContent.includes('استوديو تطوير البرمجيات')) && htmlContent.length < 3200;
    const hasReactMount = sortedFiles.some(p => {
      const c = files[p]?.content || '';
      return c.includes('createRoot') || c.includes('ReactDOM.render') || c.includes("getElementById('root')") || c.includes("getElementById('app')");
    });
    if (hasReactMount && isLaunchpadSplash) {
      htmlContent = `<!DOCTYPE html>
<html lang="${language === 'ar' ? 'ar' : 'en'}" dir="${dir}" class="${isDarkTheme ? 'dark' : ''}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName || 'Studio Live Preview'}</title>
</head>
<body class="min-h-screen ${isDarkTheme ? 'bg-[#0d1117] text-slate-100' : 'bg-white text-slate-900'} font-['Inter','Tajawal',sans-serif] selection:bg-blue-600 selection:text-white antialiased">
  <div id="root"></div>
  <div id="app"></div>
</body>
</html>`;
    }

    const cleanEsmForBrowser = (code: string) => {
      if (!code) return '';
      let rawCode = code;
      if (rawCode.includes('\\n') && (rawCode.match(/\\n/g)?.length || 0) > 3) {
        rawCode = rawCode.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"');
      }

      // Parse export { val1, val2 } and bind each to window, then remove the export statement
      const exportBlockRegex = /export\s*\{([\s\S]*?)\};?/g;
      let match;
      let cleanCode = rawCode;
      let binds = '';
      while ((match = exportBlockRegex.exec(rawCode)) !== null) {
        const exports = match[1].split(',').map(x => x.trim());
        exports.forEach(exp => {
          if (exp) {
            const parts = exp.split(/\s+as\s+/i);
            const orig = parts[0].trim();
            const alias = parts[parts.length - 1].trim();
            if (alias && alias !== 'default') {
              binds += `\ntry { window.${alias} = ${orig}; } catch(_) {}`;
            }
          }
        });
      }
      cleanCode = cleanCode.replace(exportBlockRegex, '') + binds;

      return cleanCode
        .replace(/import\.meta\.env/g, '(window.__VITE_ENV__ || window.process?.env || {})')
        .replace(/import\s*\{([\s\S]*?)\}\s*from\s*['"]lucide-react['"];?/g, 'const {$1} = window.LucideIconProxy || {};')
        .replace(/import\s+[\s\S]*?\s+from\s+['"][^'"]+['"];?/g, '')
        .replace(/import\s+['"][^'"]+['"];?/g, '')
        .replace(/export\s+default\s+function\s+([A-Za-z0-9_]+)/g, 'window.$1 = $1; function $1')
        .replace(/export\s+default\s+function\s*/g, 'function ')
        .replace(/export\s+default\s+class\s+([A-Za-z0-9_]+)/g, 'window.$1 = $1; class $1')
        .replace(/export\s+default\s+class\s*/g, 'class ')
        .replace(/export\s+default\s+([A-Za-z0-9_]+);?/g, 'window.$1 = $1;')
        .replace(/export\s+const\s+([A-Za-z0-9_]+)\s*=/g, 'const $1 = window.$1 =')
        .replace(/export\s+let\s+([A-Za-z0-9_]+)\s*=/g, 'let $1 = window.$1 =')
        .replace(/export\s+var\s+([A-Za-z0-9_]+)\s*=/g, 'var $1 = window.$1 =')
        .replace(/export\s+function\s+([A-Za-z0-9_]+)/g, 'window.$1 = $1; function $1')
        .replace(/export\s+(let|var|class|type|interface)\s+/g, '$1 ');
    };

    // Separate JS code files from CSS style files to prevent syntax errors from wrapping CSS in script tags
    const jsCodeFiles = sortedFiles.filter(p => 
      p.endsWith('.js') || p.endsWith('.jsx') || p.endsWith('.ts') || p.endsWith('.tsx')
    );
    const cssFiles = sortedFiles.filter(p => p.endsWith('.css'));
    const cssStylesHtml = cssFiles
      .map(p => `<style data-file="${p}">\n/* --- CSS File: ${p} --- */\n${files[p]?.content || ''}\n</style>`)
      .join('\n');

    const entryCandidates = [
      'src/main.tsx', 'src/main.jsx', 'src/main.js', 'src/main.ts',
      'src/index.tsx', 'src/index.jsx', 'src/index.js', 'src/index.ts',
      'src/App.tsx', 'src/App.jsx', 'src/App.js', 'src/App.ts',
      'src/app.tsx', 'src/app.jsx', 'src/app.js', 'src/app.ts',
      'main.tsx', 'main.jsx', 'main.js', 'main.ts',
      'App.tsx', 'App.jsx', 'App.js',
      'app.js', 'script.js', 'index.js'
    ];

    const entryFilePath = entryCandidates.find(p => files[p] && typeof files[p].content === 'string' && files[p].content.trim().length > 0) || (jsCodeFiles.length > 0 ? jsCodeFiles[jsCodeFiles.length - 1] : '');

    const hasBabelFiles = jsCodeFiles.some(p => p.endsWith('.jsx') || p.endsWith('.tsx'));

    let combinedScriptsHtml = '';
    if (hasBabelFiles) {
      const combinedBabelCode = jsCodeFiles
        .map(p => `/* --- File: ${p} --- */\n${cleanEsmForBrowser(files[p].content)}`)
        .join('\n\n');
      combinedScriptsHtml = `
      <script type="text/babel" data-presets="typescript,react,env" data-file="bundle">
        ${combinedBabelCode}
        window.addEventListener('DOMContentLoaded', function() {
          if (typeof window.initLucideIcons === 'function') window.initLucideIcons();
        });
        setTimeout(function() {
          if (typeof window.initLucideIcons === 'function') window.initLucideIcons();
        }, 120);
      </script>`;
    } else {
      const otherJsFiles = jsCodeFiles.filter(p => p !== entryFilePath);
      const otherJsScripts = otherJsFiles
        .map(p => `
        <script data-file="${p}">
          /* --- File: ${p} --- */
          ${cleanEsmForBrowser(files[p].content)}
        </script>`).join('\n');
      const rawEntry = entryFilePath && files[entryFilePath] ? files[entryFilePath].content : '';
      const entryJs = (entryFilePath && (entryFilePath.endsWith('.js') || entryFilePath.endsWith('.ts') || entryFilePath.endsWith('.jsx') || entryFilePath.endsWith('.tsx')))
        ? cleanEsmForBrowser(rawEntry)
        : '';
      combinedScriptsHtml = `
      ${otherJsScripts}
      ${entryJs ? `<script data-file="${entryFilePath || 'entry'}">
        /* --- Entry File: ${entryFilePath} --- */
        ${entryJs}
        window.addEventListener('DOMContentLoaded', function() {
          if (typeof window.initLucideIcons === 'function') window.initLucideIcons();
        });
        window.addEventListener('load', function() {
          if (typeof window.initLucideIcons === 'function') window.initLucideIcons();
        });
        setTimeout(function() {
          if (typeof window.initLucideIcons === 'function') window.initLucideIcons();
        }, 80);
      </script>` : ''}`;
    }

    // Guarantee both #root and #app containers exist only when React/JSX/TSX mount is present
    if (hasReactMount && !htmlContent.includes('id="root"') && !htmlContent.includes('id="app"')) {
      const defaultContainers = '<div id="root"></div><div id="app"></div>';
      if (htmlContent.includes('</body>')) {
        htmlContent = htmlContent.replace('</body>', () => defaultContainers + '</body>');
      } else {
        htmlContent += defaultContainers;
      }
    }

    // Only inject Tailwind CDN if the project does not have its own comprehensive custom CSS stylesheet or explicitly uses Tailwind
    const hasSubstantialCustomCss = allCss.trim().length > 400;
    const usesTailwind = rawHtml.includes('tailwind') || !hasSubstantialCustomCss || hasBabelFiles;

    const injectionHead = `
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Tajawal:wght@300;400;500;700;800;900&family=Oswald:wght@500;700&display=swap" rel="stylesheet">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" crossorigin="anonymous" referrerpolicy="no-referrer" />
      ${usesTailwind ? '<script src="/api/studio/proxy/tailwind"></script>' : ''}
      ${hasBabelFiles || hasReactMount ? `
      <script src="/api/studio/proxy/react"></script>
      <script src="/api/studio/proxy/react-dom"></script>
      <script src="/api/studio/proxy/babel"></script>
      <script src="/api/studio/proxy/lucide"></script>
      <script src="/api/studio/proxy/chartjs"></script>` : ''}`;

    const injectionHeadEnd = `
      <script>
        // Event listener race-condition polyfill for DOMContentLoaded and load events in iframes
        (function() {
          const originalAddEventListener = EventTarget.prototype.addEventListener;
          EventTarget.prototype.addEventListener = function(type, listener, options) {
            if (type === 'DOMContentLoaded' && (document.readyState === 'interactive' || document.readyState === 'complete')) {
              try { listener.call(this, { type: 'DOMContentLoaded', target: document, currentTarget: document }); } catch(e) { console.error('DOMContentLoaded race polyfill bypass:', e); }
              return;
            }
            if (type === 'load' && document.readyState === 'complete') {
              try { listener.call(this, { type: 'load', target: window, currentTarget: window }); } catch(e) { console.error('load race polyfill bypass:', e); }
              return;
            }
            return originalAddEventListener.apply(this, arguments);
          };
        })();

        // Expose common React hooks globally so stripped imports work seamlessly
        if (window.React) {
          window.useState = window.React.useState;
          window.useEffect = window.React.useEffect;
          window.useRef = window.React.useRef;
          window.useMemo = window.React.useMemo;
          window.useCallback = window.React.useCallback;
          window.useContext = window.React.useContext;
          window.createContext = window.React.createContext;
          window.useReducer = window.React.useReducer;
          window.Fragment = window.React.Fragment;
        }

        window.initLucideIcons = function() {
          try {
            if (window.lucide && typeof window.lucide.createIcons === 'function') {
              window.lucide.createIcons();
            } else if (window.Lucide && typeof window.Lucide.createIcons === 'function') {
              window.Lucide.createIcons();
            }
          } catch(_) {}
        };
        // Polyfill Lucide React icon components
        window.LucideIconProxy = new Proxy({}, {
          get: function(target, prop) {
            if (typeof prop === 'string' && prop !== 'then' && prop !== 'prototype') {
              return function LucideIconComponent(props) {
                var cls = (props && props.className) ? props.className + ' lucide' : 'w-5 h-5 inline-block lucide';
                var iconName = prop.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
                return React.createElement('i', Object.assign({ 'data-lucide': iconName, className: cls }, props));
              };
            }
            return undefined;
          }
        });
        // Guarantee ReactDOM.createRoot compatibility
        if (window.ReactDOM && !window.ReactDOM.createRoot) {
          window.ReactDOM.createRoot = function(container) {
            return {
              render: function(element) {
                window.ReactDOM.render(element, container);
              }
            };
          };
        }
        if (window.ReactDOM && window.ReactDOM.createRoot) {
          window.createRoot = window.ReactDOM.createRoot.bind(window.ReactDOM);
        }
        if (typeof tailwind !== 'undefined') {
          tailwind.config = {
            darkMode: 'class',
            theme: {
              extend: {
                fontFamily: {
                  sans: ['Inter', 'Tajawal', 'system-ui', 'sans-serif'],
                  tajawal: ['Tajawal', 'sans-serif'],
                }
              }
            }
          };
        }
      </script>
      <style>
        :where(html) {
          margin: 0;
          padding: 0;
          width: 100%;
          min-height: 100%;
          background-color: ${isDarkTheme ? '#0d1117' : '#ffffff'};
          color: ${isDarkTheme ? '#f1f5f9' : '#0f172a'};
        }
        :where(body) {
          margin: 0;
          padding: 0;
          width: 100%;
          min-height: 100vh;
          font-family: 'Inter', 'Tajawal', system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        ${hasReactMount ? `#root, #app { width: 100%; min-height: 100vh; }` : ''}
        ${allCss}
      </style>
      <script>
        (function() {
          const originalConsole = {
            log: console.log,
            error: console.error,
            warn: console.warn,
            info: console.info
          };
          function sendLog(type, args) {
            try {
              const message = Array.from(args).map(arg => {
                if (arg instanceof Error) return arg.message + '\n' + (arg.stack || '');
                if (typeof arg === 'object' && arg !== null) {
                  try { return arg.message || arg.description || JSON.stringify(arg, Object.getOwnPropertyNames(arg)); } catch(_) { return String(arg); }
                }
                return String(arg);
              }).join(' ');
              window.parent.postMessage({ type: 'CONSOLE_LOG', level: type, message: message }, '*');
            } catch(e) {}
          }
          console.log = function() { originalConsole.log.apply(console, arguments); sendLog('log', arguments); };
          console.error = function() { originalConsole.error.apply(console, arguments); sendLog('error', arguments); };
          console.warn = function() { originalConsole.warn.apply(console, arguments); sendLog('warn', arguments); };
          console.info = function() { originalConsole.info.apply(console, arguments); sendLog('info', arguments); };
          
          window.process = window.process || { env: {} };
          window.process.env = Object.assign(window.process.env, ${JSON.stringify(envVars)});
          window.__VITE_ENV__ = Object.assign({}, window.process.env);
          
          window.addEventListener('error', function(event) {
            var msg = String(event.message || '');
            if (msg.includes('WebSocket') || msg.includes('websocket') || msg.includes('ws://')) return;
            sendLog('error', [msg]);
          });
          window.addEventListener('unhandledrejection', function(event) {
            var reasonMsg = String(event.reason?.message || event.reason || '');
            if (reasonMsg.includes('WebSocket') || reasonMsg.includes('websocket') || reasonMsg.includes('ws://')) return;
            sendLog('error', ['Unhandled Promise Rejection: ' + reasonMsg]);
          });

          // Global Image Fallback Polyfill (prevents broken image placeholder icons)
          window.addEventListener('error', function(e) {
            if (e.target && e.target.tagName === 'IMG') {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=600&q=80';
            }
          }, true);

          ${isInspectMode ? `
          // Inspect Mode Script
          document.addEventListener('mouseover', function(e) {
            e.stopPropagation();
            if (e.target && e.target.style) {
              e.target.dataset.oldOutline = e.target.style.outline;
              e.target.style.outline = '2px dashed #38bdf8';
              e.target.style.cursor = 'crosshair';
            }
          });
          document.addEventListener('mouseout', function(e) {
            e.stopPropagation();
            if (e.target && e.target.style) {
              e.target.style.outline = e.target.dataset.oldOutline || '';
            }
          });
          document.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var info = {
              tag: e.target.tagName ? e.target.tagName.toLowerCase() : 'element',
              text: (e.target.innerText || e.target.textContent || '').slice(0, 60).trim(),
              className: e.target.className || '',
              id: e.target.id || ''
            };
            window.parent.postMessage({ type: 'INSPECT_ELEMENT_CLICK', info: info }, '*');
          }, true);
          ` : ''}
        })();
      </script>
    `;

    const injectionScripts = combinedScriptsHtml;

    // Clean up flex-centering body classes from generated/loaded apps so websites take full viewport width and flow naturally
    if (/<body[^>]*>/i.test(htmlContent)) {
      const isNotSplashOnly = sortedFiles.length > 0 || (!htmlContent.includes('Ready to Build') && !htmlContent.includes('جاهز للتطوير'));
      if (isNotSplashOnly) {
        htmlContent = htmlContent.replace(/<body([^>]*)>/i, (_m, attrs) => {
          if (/class=["']/i.test(attrs)) {
            const cleanAttrs = attrs.replace(/class=["']([^"']*)["']/i, (_match: string, cVal: string) => {
              const cleaned = cVal
                .replace(/\bitems-center\b/g, '')
                .replace(/\bjustify-center\b/g, '')
                .replace(/\bflex-col\b/g, '')
                .replace(/\bflex\b/g, '')
                .replace(/\s+/g, ' ')
                .trim();
              return `class="${cleaned}"`;
            });
            return `<body${cleanAttrs}>`;
          }
          return `<body${attrs}>`;
        });
      }
    }

    // Robustly inject head scripts using callback replacer to prevent $1/$& string corruption
    const fullHead = injectionHead + injectionHeadEnd;
    if (/<head[^>]*>/i.test(htmlContent)) {
      htmlContent = htmlContent.replace(/(<head[^>]*>)/i, (match) => `${match}${fullHead}`);
    } else if (/<html[^>]*>/i.test(htmlContent)) {
      htmlContent = htmlContent.replace(/(<html[^>]*>)/i, (match) => `${match}<head>${fullHead}</head>`);
    } else {
      htmlContent = `<!DOCTYPE html><html lang="${language === 'ar' ? 'ar' : 'en'}" dir="${dir}" class="${isDarkTheme ? 'dark' : ''}"><head>${fullHead}</head><body>${htmlContent}</body></html>`;
    }

    // Ensure <html> tag class is synchronized with active platform theme
    if (/<html[^>]*>/i.test(htmlContent)) {
      htmlContent = htmlContent.replace(/<html([^>]*)>/i, (m, attrs) => {
        if (isDarkTheme) {
          if (/class=["']/i.test(attrs)) {
            return attrs.includes('dark') ? m : `<html${attrs.replace(/class=["']([^"']*)["']/i, 'class="$1 dark"')}>`;
          }
          return `<html${attrs} class="dark">`;
        } else {
          if (/class=["']/i.test(attrs)) {
            return `<html${attrs.replace(/class=["']([^"']*)["']/i, (_match: string, cVal: string) => {
              const cleaned = cVal.replace(/\bdark\b/g, '').trim();
              return cleaned ? `class="${cleaned}"` : '';
            })}>`;
          }
          return m;
        }
      });
    }

    // Robustly inject body scripts using callback replacer to prevent $1/$& string corruption in JS code
    if (/<\/body>/i.test(htmlContent)) {
      htmlContent = htmlContent.replace(/(<\/body>)/i, (match) => `${injectionScripts}${match}`);
    } else if (/<\/html>/i.test(htmlContent)) {
      htmlContent = htmlContent.replace(/(<\/html>)/i, (match) => `${injectionScripts}${match}`);
    } else {
      htmlContent = htmlContent + injectionScripts;
    }

    return htmlContent;
  }, [files, language, dir, isInspectMode, envVars, theme]);

  const handleOpenInNewTab = async () => {
    try {
      const newWin = window.open('about:blank', '_blank');
      if (!user) {
        if (newWin) {
          newWin.document.open();
          newWin.document.write(previewSrcDoc);
          newWin.document.close();
        }
        toast.success(language === 'ar' ? 'تم فتح المعاينة الحية في نافذة متصفح جديدة!' : 'Opened live preview in new browser tab!');
        return;
      }

      const lang = language === 'ar' ? 'ar' : 'en';
      const direction = language === 'ar' ? 'rtl' : 'ltr';
      const previewUrl = `/api/studio/workspaces/${projectId}/preview?lang=${lang}&dir=${direction}`;

      await saveProjectToDb();

      if (newWin) {
        newWin.location.href = previewUrl;
      } else {
        window.open(previewUrl, '_blank');
      }
      toast.success(language === 'ar' ? 'تم فتح المعاينة الحية في نافذة متصفح جديدة!' : 'Opened live preview in new browser tab!');
    } catch (err: any) {
      console.error('Failed to open preview tab:', err);
      toast.error(language === 'ar' ? 'تعذر فتح نافذة المتصفح الجديدة' : 'Failed to open preview tab');
    }
  };

  const toggleVoiceRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error(language === 'ar' ? 'متصفحك لا يدعم التعرف على الصوت.' : 'Speech recognition is not supported in your browser.');
      return;
    }

    if (isRecordingVoice) {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      setIsRecordingVoice(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'ar' ? 'ar-SA' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecordingVoice(true);
      toast.info(language === 'ar' ? 'جاري الاستماع...' : 'Listening...');
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setPromptQuery(prev => (prev ? `${prev} ${transcript}` : transcript));
      setIsRecordingVoice(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecordingVoice(false);
      toast.error(language === 'ar' ? 'حدث خطأ في التعرف على الصوت.' : 'Speech recognition error.');
    };

    recognition.onend = () => {
      setIsRecordingVoice(false);
    };

    speechRecognitionRef.current = recognition;
    recognition.start();
  };

  // Handle Send Prompt (Real AI Assistant Engine with Clarify, Todos, Surgical Edits, Template Context & Live Preview Verification)
  const handleSendPrompt = async (
    customPrompt?: string,
    turnOptions?: {
      allowClarify?: boolean;
      clarificationContext?: string;
      skipUserMessage?: boolean;
      displayUserText?: string;
    }
  ) => {
    const promptToSend = (typeof customPrompt === 'string' ? customPrompt : promptQuery).trim();
    if (!promptToSend || isGenerating) return;

    if (!user) {
      try {
        sessionStorage.setItem('pending_app_prompt', promptToSend);
      } catch (e) {}
      setIsAuthModalOpen(true);
      return;
    }

    if (typeof customPrompt === 'string') {
      setClickedSuggestions(prev => [...prev, customPrompt]);
      recentSuggestionLabelsRef.current = [...recentSuggestionLabelsRef.current, customPrompt].slice(-25);
    }

    const activeProjId = projectId || ('proj_' + Date.now());
    if (!projectId) {
      setProjectId(activeProjId);
      localStorage.setItem('perplexta_active_project_id', activeProjId);
    }
    
    setPromptQuery('');
    setIsGenerating(true);
    setCurrentlyWritingFile('');
    setRuntimeError(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    if (!turnOptions?.skipUserMessage) {
      const userMsgId = `user_${Date.now()}`;
      const userMsg: StudioChatMessage = {
        id: userMsgId,
        role: 'user',
        text: turnOptions?.displayUserText || promptToSend,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, userMsg]);
    }
    addLog('log', `إرسال طلب التطوير: "${promptToSend}"`);

    const existingFileKeys = Object.keys(files);
    const indexContent = files['index.html']?.content || '';
    const isDefaultLaunchpad =
      existingFileKeys.length === 0 ||
      (existingFileKeys.length === 1 &&
        existingFileKeys[0] === 'index.html' &&
        (indexContent.includes('جاهز للتطوير') ||
          indexContent.includes('Ready to Build') ||
          indexContent.includes('منصة جاهزة للتطوير') ||
          indexContent.length < 2500));

    // Refined incremental instructions: Ensure the AI adds to the project rather than replacing it.
    let finalPrompt = promptToSend;
    if (!isDefaultLaunchpad) {
      const incrementalInstruction = language === 'ar'
        ? "\n\n⚠️ تعليمات هامة للمهندس: هذا المشروع قائم بالفعل. يرجى إضافة الميزات المطلوبة أعلاه بدقة مع الحفاظ الكامل على الهيكل الحالي والكود الموجود. لا تقم بمسح أو إعادة كتابة المشروع بالكامل. قم بإجراء تحديثات جراحية دقيقة (Surgical Incremental Updates) للملفات المعنية فقط."
        : "\n\n⚠️ IMPORTANT ARCHITECT INSTRUCTION: This is an existing project. Please strictly add the requested features/changes while preserving all current structure and existing code. DO NOT rewrite the entire project from scratch; perform surgical incremental updates only on the relevant files.";
      finalPrompt += incrementalInstruction;
    }

    setIsStartScreenOpen(false);
    setPipelinePhase(1);
    setStreamStatusMessage(language === 'ar' ? 'جاري التخطيط والتحضير...' : 'Planning and preparing...');
    setLiveStreamText('');
    setStreamedTodos([]);

    let streamedFilesMap: Record<string, ProjectFile> = {};
    let latestBlueprint: any = null;
    let rawChunkAccumulator = '';
    let clarifyReceivedInStream = false;
    let streamOpeningText = '';
    let latestStreamedTodos: StudioTodoItem[] = [];

    try {
      const token = getAuthToken();
      const historyPayload = prepareHistoryForAI(chatMessages, { maxMessages: 12 });

      // Filter out remote image asset placeholders when sending code files to the AI
      const codeOnlyFiles: Record<string, ProjectFile> = {};
      Object.entries(files).forEach(([k, v]) => {
        if (!/\.(png|jpg|jpeg|webp|gif|ico)$/i.test(k)) {
          codeOnlyFiles[k] = v;
        }
      });

      const activeTemplateInstructions = templateOrigin?.slug
        ? CORE_TEMPLATES_MAP[templateOrigin.slug]?.instructions
        : '';
      const effectiveSystemPrompt = getDynamicSystemPrompt(
        projectName,
        codeOnlyFiles as any,
        activeFilePath,
        templateOrigin
          ? {
              slug: templateOrigin.slug,
              name: templateOrigin.name,
              instructions: activeTemplateInstructions
            }
          : null,
        language
      );

      const res = await fetch('/api/studio/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        signal: controller.signal,
        body: JSON.stringify({
          prompt: finalPrompt,
          systemPrompt: effectiveSystemPrompt,
          files: codeOnlyFiles,
          activeFilePath,
          isNewProject: isDefaultLaunchpad,
          history: historyPayload,
          templateOrigin: templateOrigin
            ? {
                ...templateOrigin,
                instructions: activeTemplateInstructions
              }
            : null,
          allowClarify: turnOptions?.allowClarify ?? (!turnOptions?.clarificationContext),
          clarificationContext: turnOptions?.clarificationContext || '',
          language,
          stream: true
        })
      });

      if (res.ok) {
        let completedData: any = null;
        const contentType = res.headers.get('content-type') || '';

        if (contentType.includes('text/event-stream') && res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data:')) {
                const dataStr = trimmed.substring(5).trim();
                let streamErrText = '';
                try {
                  const ev = JSON.parse(dataStr);
                  if (ev.type === 'step') {
                    setStreamStatusMessage(ev.message);
                    addLog('log', ev.message);
                  } else if (ev.type === 'opening' && ev.text) {
                    streamOpeningText = String(ev.text).trim();
                    setStreamStatusMessage(streamOpeningText);
                    addLog('log', streamOpeningText);
                  } else if (ev.type === 'clarify' && Array.isArray(ev.questions) && ev.questions.length > 0) {
                    clarifyReceivedInStream = true;
                    setPendingClarifyPrompt(promptToSend);
                    setClarifyLeadIn(ev.leadIn || streamOpeningText || '');
                    setClarifyQuestions(ev.questions);
                  } else if (ev.type === 'todo' && Array.isArray(ev.todos)) {
                    const mappedTodos: StudioTodoItem[] = ev.todos.map((t: any, idx: number) => ({
                      id: typeof t === 'object' && t.id ? String(t.id) : `todo_${idx}`,
                      title: typeof t === 'string' ? t : String(t.title || t.content || `Step ${idx + 1}`),
                      status: t?.status === 'completed' ? 'completed' : t?.status === 'in_progress' ? 'in_progress' : 'pending'
                    }));
                    latestStreamedTodos = mappedTodos;
                    setStreamedTodos(mappedTodos);
                  } else if (ev.type === 'blueprint' && ev.blueprint) {
                    latestBlueprint = ev.blueprint;
                    setActiveBlueprint(ev.blueprint);
                    setPipelinePhase(2);

                    if (Array.isArray(ev.blueprint.todos) && ev.blueprint.todos.length > 0 && latestStreamedTodos.length === 0) {
                      const mappedBpTodos: StudioTodoItem[] = ev.blueprint.todos.map((t: any, idx: number) => ({
                        id: typeof t === 'object' && t.id ? String(t.id) : `todo_${idx}`,
                        title: typeof t === 'string' ? t : String(t.title || t.content || `Step ${idx + 1}`),
                        status: idx === 0 ? 'in_progress' : 'pending'
                      }));
                      latestStreamedTodos = mappedBpTodos;
                      setStreamedTodos(mappedBpTodos);
                    }

                    const plannedOrder: string[] = Array.isArray(ev.blueprint.file_tree_order)
                      ? ev.blueprint.file_tree_order
                      : Array.isArray(ev.blueprint.files_order)
                      ? ev.blueprint.files_order
                      : [];

                    if (ev.blueprint.project_name && typeof ev.blueprint.project_name === 'string') {
                      if (projectName === 'مشروع جديد' || projectName === 'My Project' || projectName === 'New Project' || projectName.startsWith('مشروع جديد #') || projectName.startsWith('New Project #')) {
                        setProjectName(ev.blueprint.project_name);
                        localStorage.setItem('perplexta_active_project_name', ev.blueprint.project_name);
                      }
                    }

                    if (plannedOrder.length > 0) {
                      setFileStatuses(prev => {
                        const next = { ...prev };
                        plannedOrder.forEach((p: string) => {
                          const cleanPath = String(p).replace(/^\/+/, '').trim();
                          if (cleanPath && next[cleanPath] !== 'completed') {
                            next[cleanPath] = 'pending';
                          }
                        });
                        return next;
                      });

                      // Scaffold pending files directly into the File Tree Explorer so the user sees the project structure immediately
                      setFiles(prev => {
                        const next = { ...prev };
                        plannedOrder.forEach((p: string) => {
                          const cleanPath = String(p).replace(/^\/+/, '').trim();
                          if (cleanPath && !next[cleanPath]) {
                            const ext = cleanPath.split('.').pop()?.toLowerCase() || 'txt';
                            next[cleanPath] = {
                              name: cleanPath.split('/').pop() || cleanPath,
                              path: cleanPath,
                              content: '',
                              type: ext,
                              isEntry: cleanPath === 'index.html'
                            };
                          }
                        });
                        return next;
                      });
                    }
                  } else if (ev.type === 'file_writing' && ev.path) {
                    const targetPath = String(ev.path).replace(/^\/+/, '').trim();
                    setPipelinePhase(2);
                    setCurrentlyWritingFile(targetPath);
                    setStreamStatusMessage(
                      ev.message || friendlyTodoLabelForFile(targetPath, true, language)
                    );
                    setFileStatuses(prev => ({
                      ...prev,
                      [targetPath]: 'writing'
                    }));
                    setFiles(prev => {
                      if (prev[targetPath]) return prev;
                      const ext = targetPath.split('.').pop()?.toLowerCase() || 'txt';
                      return {
                        ...prev,
                        [targetPath]: {
                          name: targetPath.split('/').pop() || targetPath,
                          path: targetPath,
                          content: '',
                          type: ext,
                          isEntry: targetPath === 'index.html'
                        }
                      };
                    });
                    addLog('log', language === 'ar' ? `جاري كتابة الملف: ${targetPath}` : `Writing file: ${targetPath}`);
                  } else if (ev.type === 'file_complete' && ev.path && ev.file) {
                    const targetPath = String(ev.path).replace(/^\/+/, '').trim();
                    streamedFilesMap[targetPath] = ev.file;
                    setFiles(prev => ({
                      ...prev,
                      [targetPath]: ev.file
                    }));
                    setSavedFiles(prev => ({
                      ...prev,
                      [targetPath]: ev.file
                    }));
                    setFileStatuses(prev => ({
                      ...prev,
                      [targetPath]: 'completed'
                    }));
                    setStreamedTodos(prev => {
                      if (prev.length === 0) return prev;
                      const inProgIdx = prev.findIndex(t => t.status === 'in_progress');
                      if (inProgIdx === -1) return prev;
                      const next = prev.map((t, i) => {
                        if (i === inProgIdx) return { ...t, status: 'completed' as const };
                        if (i === inProgIdx + 1 && t.status === 'pending') return { ...t, status: 'in_progress' as const };
                        return t;
                      });
                      latestStreamedTodos = next;
                      return next;
                    });
                    setCurrentlyWritingFile(prev => (prev === targetPath ? '' : prev));
                    if (targetPath === 'index.html' || targetPath.endsWith('.js') || targetPath.endsWith('.jsx') || targetPath.endsWith('.tsx')) {
                      setIframeKey(prev => prev + 1);
                    }
                    addLog('success', language === 'ar' ? `اكتمل بناء الملف: ${targetPath}` : `Completed file: ${targetPath}`);
                  } else if (ev.type === 'chunk') {
                    rawChunkAccumulator += ev.chunk;
                    // Strip out XML tags and blueprint JSON so the live code monitor displays clean source code
                    const cleanPreview = rawChunkAccumulator
                      .replace(/<perplexta_opening>[\s\S]*?<\/perplexta_opening>/gi, '')
                      .replace(/<perplexta_clarify>[\s\S]*?<\/perplexta_clarify>/gi, '')
                      .replace(/<perplexta_todo>[\s\S]*?<\/perplexta_todo>/gi, '')
                      .replace(/<perplexta_blueprint>[\s\S]*?<\/perplexta_blueprint>/gi, '')
                      .replace(/<perplexta_blueprint>[\s\S]*/gi, '')
                      .replace(/<\/?perplexta_(?:file|edit)[^>]*>/gi, '\n')
                      .trim();
                    if (cleanPreview) {
                      setLiveStreamText(cleanPreview.slice(-360));
                    }
                  } else if (ev.type === 'complete') {
                    completedData = ev;
                  } else if (ev.type === 'error') {
                    streamErrText = ev.message || ev.error || (language === 'ar' ? 'فشل توليد التعديلات البرمجية.' : 'Generation failed');
                  }
                } catch (_) {}
                if (streamErrText) {
                  const errChatMsg: StudioChatMessage = {
                    id: `assistant_err_${Date.now()}`,
                    role: 'assistant',
                    text: `⚠️ ${streamErrText}`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  };
                  setChatMessages(prev => [...prev, errChatMsg]);
                  addLog('error', streamErrText);
                  toast.error(streamErrText);
                  return;
                }
              }
            }
          }
        } else {
          completedData = await res.json();
        }

        const data = completedData;

        // If the turn was a Clarifying Questions turn (clarifyOnly), wait for user's response without overwriting files
        if (data?.clarifyOnly || (clarifyReceivedInStream && (!data?.updatedFiles || data.updatedFiles.length === 0))) {
          if (Array.isArray(data?.clarifyQuestions) && data.clarifyQuestions.length > 0) {
            setPendingClarifyPrompt(promptToSend);
            setClarifyLeadIn(data.leadIn || streamOpeningText || '');
            setClarifyQuestions(data.clarifyQuestions);
          }
          addLog('log', language === 'ar' ? 'بانتظار إجابات الأسئلة التوضيحية للمتابعة...' : 'Waiting for clarifying answers to proceed...');
          return;
        }

        if (data && data.files && Object.keys(data.files).length > 0) {
          // Filter out any empty placeholder files that were never populated
          const finalFiles: Record<string, ProjectFile> = {};
          Object.keys(data.files).forEach(k => {
            const f = data.files[k];
            if (f && typeof f.content === 'string' && f.content.trim().length > 0) {
              finalFiles[k] = f;
            }
          });
          const resolvedFiles = Object.keys(finalFiles).length > 0 ? finalFiles : data.files;
          // Preserve any image assets (photos/*, images/*, assets/*) from the current project
          Object.entries(files).forEach(([k, v]) => {
            if (/\.(png|jpg|jpeg|webp|gif|ico)$/i.test(k) && !resolvedFiles[k]) {
              resolvedFiles[k] = v;
            }
          });

          setFiles(resolvedFiles);
          setSavedFiles(resolvedFiles);
          setIframeKey(prev => prev + 1);

          const allResolvedKeys = Object.keys(resolvedFiles);
          const updatedKeys: string[] = Array.isArray(data.updatedFiles) && data.updatedFiles.length > 0
            ? data.updatedFiles
            : Object.keys(streamedFilesMap).length > 0
            ? Object.keys(streamedFilesMap)
            : allResolvedKeys;

          if (allResolvedKeys.includes('index.html')) {
            setActiveFilePath('index.html');
          } else if (updatedKeys.length > 0) {
            setActiveFilePath(updatedKeys[0]);
          }
          setOpenTabs(prev => {
            const validExisting = prev.filter(p => Boolean(resolvedFiles[p]));
            const merged = Array.from(new Set([...validExisting, ...updatedKeys.slice(0, 4)]));
            return merged.length > 0 ? merged : allResolvedKeys.slice(0, 4);
          });

          let updatedProjectTitle = projectName;
          const bp = data.blueprint || latestBlueprint;
          if (bp) {
            setActiveBlueprint(bp);
            if (bp.project_name && typeof bp.project_name === 'string' && (projectName === 'مشروع جديد' || projectName === 'My Project' || projectName === 'New Project' || projectName.startsWith('مشروع جديد #') || projectName.startsWith('New Project #'))) {
              updatedProjectTitle = bp.project_name;
              setProjectName(bp.project_name);
              localStorage.setItem('perplexta_active_project_name', bp.project_name);
            }
          }

          const statuses: Record<string, 'pending' | 'writing' | 'completed' | 'error'> = {};
          allResolvedKeys.forEach((p: string) => {
            statuses[p] = 'completed';
          });
          setFileStatuses(statuses);

          setPipelinePhase(3);
          setStreamStatusMessage(language === 'ar' ? 'جاري التحقق من المعاينة الحية...' : 'Verifying live preview...');

          let dryRunPassed = true;
          if (resolvedFiles['index.html']) {
            const htmlText = resolvedFiles['index.html'].content || '';
            if (!htmlText.includes('<html') && !htmlText.includes('<!DOCTYPE')) {
              addLog('error', language === 'ar' ? 'تحذير الفحص: ملف نقطة البدء ينقصه وسم الصفحة الأساسي' : 'Validation warning: Entry file missing root HTML tag');
              dryRunPassed = false;
            }
          }

          if (dryRunPassed) {
            addLog('success', language === 'ar' ? `تم التحقق من المعاينة الحية بنجاح (${allResolvedKeys.length} ملفات)` : `Verified live preview (${allResolvedKeys.length} files)`);
          }

          // Dynamic SQLite Schema Synchronization
          if (resolvedFiles['db/schema.sql'] && resolvedFiles['db/schema.sql'].content.trim()) {
            try {
              const sqlInitializer = typeof initSqlJs === 'function' ? initSqlJs : (initSqlJs as any)?.default;
              if (typeof sqlInitializer === 'function') {
                sqlInitializer({
                  locateFile: (file: string) => `/${file}`
                }).then((SQL: any) => {
                  const newDb = new SQL.Database();
                  newDb.run(resolvedFiles['db/schema.sql'].content);
                  setSqlDb(newDb);
                  refreshTables(newDb);
                  addLog('success', language === 'ar' ? 'تمت مزامنة مخطط قاعدة البيانات (db/schema.sql) بنجاح' : 'Database schema synchronized');
                }).catch(() => {});
              }
            } catch (err: any) {
              console.warn('SQLite reload error:', err);
            }
          }

          const cleanReplyText = (rawText: string) => {
            if (!rawText) {
              return dir === 'rtl'
                ? 'أصبح مشروعك جاهزاً الآن في المعاينة الحية! يمكنك تجربته مباشرة أو طلب أي تعديل إضافي.'
                : 'Your project is now ready in the live preview! Try it out or ask for any further changes.';
            }
            const cleaned = rawText
              .replace(/<perplexta_opening>[\s\S]*?<\/perplexta_opening>/gi, '')
              .replace(/<perplexta_clarify>[\s\S]*?<\/perplexta_clarify>/gi, '')
              .replace(/<perplexta_todo>[\s\S]*?<\/perplexta_todo>/gi, '')
              .replace(/<perplexta_blueprint>[\s\S]*?<\/perplexta_blueprint>/gi, '')
              .replace(/<perplexta_blueprint>[\s\S]*/gi, '')
              .replace(/<perplexta_file[\s\S]*?<\/perplexta_file>/gi, '')
              .replace(/<perplexta_file[\s\S]*/gi, '')
              .replace(/<perplexta_edit[\s\S]*?<\/perplexta_edit>/gi, '')
              .replace(/<perplexta_edit[\s\S]*/gi, '')
              .replace(/<perplexta_delete[\s\S]*?\/?>/gi, '')
              .replace(/```[\s\S]*?```/gi, '')
              .replace(/```[\s\S]*/gi, '')
              .trim();

            if (!cleaned || cleaned.includes('{') || cleaned.length < 5) {
              return dir === 'rtl'
                ? 'تم بناء وتحديث المشروع بنجاح في شاشة المعاينة الحية.'
                : 'Built and updated your project in the live preview.';
            }
            return cleaned;
          };

          const nextClicked = [...clickedSuggestions, promptToSend];
          setClickedSuggestions(nextClicked);

          // Combine AI-returned suggestions with context-aware Builder follow-ups (never suggesting features already in the HTML)
          const templateSugs = templateOrigin?.slug ? CORE_TEMPLATES_MAP[templateOrigin.slug]?.suggestions : undefined;
          const engineSuggestions = buildFollowUpSuggestions(
            resolvedFiles,
            [...nextClicked, ...recentSuggestionLabelsRef.current],
            Array.isArray(data.suggestions) && data.suggestions.length > 0 ? data.suggestions : templateSugs,
            language
          );

          engineSuggestions.forEach(s => {
            if (!recentSuggestionLabelsRef.current.includes(s.label)) {
              recentSuggestionLabelsRef.current.push(s.label);
            }
          });
          recentSuggestionLabelsRef.current = recentSuggestionLabelsRef.current.slice(-25);

          const finalTodosForMsg: StudioTodoItem[] = Array.isArray(data.todos) && data.todos.length > 0
            ? data.todos.map((t: any, idx: number) => ({
                id: typeof t === 'object' && t.id ? String(t.id) : `todo_${idx}`,
                title: typeof t === 'string' ? t : String(t.title || t.content || `Step ${idx + 1}`),
                status: 'completed' as const
              }))
            : latestStreamedTodos.map(t => ({ ...t, status: 'completed' as const }));

          const assistantMsg: StudioChatMessage = {
            id: `assistant_${Date.now()}`,
            role: 'assistant',
            openingContent: data.opening || streamOpeningText || undefined,
            todos: finalTodosForMsg.length > 0 ? finalTodosForMsg : undefined,
            text: cleanReplyText(data.reply || data.summary),
            logs: Array.isArray(data.logs) ? data.logs : [],
            filesUpdated: updatedKeys,
            suggestions: engineSuggestions.slice(0, 4),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };

          setStreamedTodos([]);
          setChatMessages(prev => [...prev, assistantMsg]);
          if (Array.isArray(data.logs)) {
            data.logs.forEach((logText: string) => addLog('success', logText));
          } else {
            addLog('success', data.summary || 'تم تحديث المشروع بنجاح');
          }
          toast.success(language === 'ar' ? 'تم تحديث المعاينة الحية بنجاح!' : 'Live preview updated!');
          
          await saveProjectToDb(activeProjId, updatedProjectTitle, resolvedFiles);
          if (user && token && activeProjId) {
            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const snapName = language === 'ar'
              ? `إصدار تلقائي - ${timeStr} (${promptToSend.slice(0, 24)})`
              : `Auto Snapshot - ${timeStr} (${promptToSend.slice(0, 24)})`;
            handleCreateSnapshot(snapName, resolvedFiles);
          }
        } else if (data) {
          const fallbackMsg: StudioChatMessage = {
            id: `assistant_${Date.now()}`,
            role: 'assistant',
            text: data.reply || (language === 'ar' ? 'تم فحص ملفات المشروع وتأكيد استقرار البنية الحالية.' : 'Examined project structure and verified stability.'),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setChatMessages(prev => [...prev, fallbackMsg]);
          addLog('log', 'تم تحليل الطلب وتأكيد البنية الحالية.');
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.message || errData.error || (language === 'ar' ? 'فشل توليد التعديلات البرمجية.' : 'Generation failed');
        const errChatMsg: StudioChatMessage = {
          id: `assistant_err_${Date.now()}`,
          role: 'assistant',
          text: `⚠️ ${errMsg}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatMessages(prev => [...prev, errChatMsg]);
        addLog('error', errMsg);
        toast.error(errMsg);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return;
      }
      const errMsg = `خطأ في الاتصال: ${err.message}`;
      addLog('error', errMsg);
      toast.error(language === 'ar' ? 'تعذر الاتصال بخادم الاستوديو' : 'Server connection failed');
    } finally {
      abortControllerRef.current = null;
      setIsGenerating(false);
      setStreamStatusMessage('');
      setLiveStreamText('');
      setCurrentlyWritingFile('');
    }
  };

  // On-demand follow-up suggestion regeneration ("New ideas" / "أفكار جديدة", ported from generateContinueSuggestions in app.js)
  const handleRegenerateSuggestions = useCallback(async () => {
    if (isGenerating || isRegeneratingSuggestions) return;
    setIsRegeneratingSuggestions(true);
    try {
      const token = getAuthToken();
      const htmlSnapshot = files['index.html']?.content || '';
      const transcript = chatMessages
        .slice(-6)
        .map(m => `${m.role.toUpperCase()}: ${(m.text || m.content || '').slice(0, 400)}`)
        .join('\n\n');

      const res = await fetch('/api/studio/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          htmlSnapshot,
          transcript,
          recentLabels: recentSuggestionLabelsRef.current,
          language
        })
      });

      let nextSugs: Array<{ label: string; prompt: string }> = [];
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.suggestions && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
          nextSugs = data.suggestions;
        }
      }

      if (nextSugs.length === 0) {
        nextSugs = buildFollowUpSuggestions(
          files,
          recentSuggestionLabelsRef.current,
          templateOrigin?.slug ? CORE_TEMPLATES_MAP[templateOrigin.slug]?.suggestions : undefined,
          language
        );
      }

      if (nextSugs.length > 0) {
        nextSugs.forEach(s => {
          if (!recentSuggestionLabelsRef.current.includes(s.label)) {
            recentSuggestionLabelsRef.current.push(s.label);
          }
        });
        recentSuggestionLabelsRef.current = recentSuggestionLabelsRef.current.slice(-25);

        setChatMessages(prev => {
          const copy = [...prev];
          for (let i = copy.length - 1; i >= 0; i--) {
            if (copy[i].role === 'assistant') {
              copy[i] = { ...copy[i], suggestions: nextSugs };
              break;
            }
          }
          return copy;
        });
      }
    } catch (_) {
    } finally {
      setIsRegeneratingSuggestions(false);
    }
  }, [isGenerating, isRegeneratingSuggestions, getAuthToken, files, chatMessages, language, templateOrigin]);

  const handleCreateNewProject = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    // 1. Safely save the current project before switching to new blank project
    saveProjectToDb();

    const newProjId = 'proj_' + Date.now();
    const isAr = language === 'ar';
    const newProjName = isAr ? `مشروع جديد #${Math.floor(1000 + Math.random() * 9000)}` : `New Project #${Math.floor(1000 + Math.random() * 9000)}`;
    
    setProjectId(newProjId);
    setProjectName(newProjName);
    try {
      localStorage.setItem('perplexta_active_project_id', newProjId);
      localStorage.setItem('perplexta_active_project_name', newProjName);
      localStorage.removeItem('perplexta_studio_workspace_v2');
      sessionStorage.removeItem('current_active_project');
    } catch (_) {}

    const blankFiles: Record<string, ProjectFile> = {
      'index.html': {
        name: 'index.html',
        path: 'index.html',
        type: 'html',
        isEntry: true,
        content: `<!DOCTYPE html>
<html lang="${isAr ? 'ar' : 'en'}" dir="${dir}" class="h-full">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${newProjName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Tajawal:wght@300;400;500;700;800;900&display=swap" rel="stylesheet">
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      min-height: 100%;
    }
  </style>
</head>
<body class="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-['Inter','Tajawal',sans-serif] min-h-screen w-full selection:bg-blue-600 selection:text-white">
  <div class="w-full min-h-screen flex flex-col items-center justify-center p-6 sm:p-10">
    <div class="max-w-md w-full text-center space-y-6">
    <!-- Brand Logo Glow Icon -->
    <div class="relative mx-auto w-16 h-16 rounded-shape-md bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-xl shadow-blue-500/25 flex items-center justify-center">
      <div class="w-full h-full bg-slate-900 rounded-shape-sm flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="text-blue-500" style="width: 32px; height: 32px; max-width: 32px; max-height: 32px;">
          <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
          <polyline points="2 17 12 22 22 17"></polyline>
          <polyline points="2 12 12 17 22 12"></polyline>
        </svg>
      </div>
    </div>
    
    <div class="space-y-3">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-shape-full bg-blue-500/10 border border-blue-500/20 text-blue-500 dark:text-blue-400 text-xs font-bold">
        <span class="w-2 h-2 rounded-shape-full bg-blue-500 animate-ping"></span>
        <span>${isAr ? 'جاهز للتطوير' : 'Ready to Build'}</span>
      </div>
      <h1 class="text-2xl font-black text-slate-900 dark:text-white">${newProjName}</h1>
      <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
        ${isAr 
          ? 'أدخل وصف التطبيق أو الميزة المطلوبة في لوحة المحادثة لتوليد ملفات المشروع وتشغيل المعاينة المباشرة.'
          : 'Enter your application description in the chat panel to generate project files and launch the live preview.'}
      </p>
    </div>
  </div>
</body>
</html>`
      }
    };

    setFiles(blankFiles);
    setSavedFiles(blankFiles);
    setActiveFilePath('index.html');
    setOpenTabs(['index.html']);
    setIframeKey(prev => prev + 1);
    setTemplateOrigin(null);
    setClarifyQuestions([]);
    setClarifyLeadIn('');
    setPendingClarifyPrompt('');
    setStreamedTodos([]);
    recentSuggestionLabelsRef.current = [];
    setChatMessages([]);
    setIsStartScreenOpen(true);

    setTerminalLogs([
      {
        type: 'log',
        text: isAr
          ? `تم تهيئة بيئة التطوير للمشروع (${newProjName}).`
          : `Initialized development environment for (${newProjName}).`,
        time: new Date().toLocaleTimeString()
      },
      {
        type: 'success',
        text: isAr
          ? 'شجرة الملفات فارغة وجاهزة للهندسة والتوليد.'
          : 'File tree is clean and ready for architecture & synthesis.',
        time: new Date().toLocaleTimeString()
      }
    ]);

    saveProjectToDb(newProjId, newProjName, blankFiles);
    toast.success(isAr ? `تم إنشاء ${newProjName} بنجاح` : `Created ${newProjName} successfully`);
    addLog('success', isAr ? `تم تهيئة وحفظ مساحة عمل جديدة: ${newProjName}` : `Initialized workspace: ${newProjName}`);
  };

  const handleDownloadZip = async () => {
    const zip = new JSZip();
    Object.keys(files).forEach(path => {
      zip.file(path, files[path].content);
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, 'perplexta-project.zip');
    toast.success(language === 'ar' ? 'تم تنزيل المشروع كملف ZIP بنجاح!' : 'Project downloaded as ZIP!');
    addLog('success', language === 'ar' ? 'تم تصدير المشروع إلى ملف ZIP محلي.' : 'Exported project as local ZIP archive.');
  };

  const handleAiFix = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    const errLogs = terminalLogs.filter(l => l.type === 'error').map(l => l.text).slice(-5);
    const fixPrompt = errLogs.length > 0
      ? (dir === 'rtl'
          ? `🛠️ قم بفحص وإصلاح الأخطاء البرمجية المسجلة في الطرفية للملف (${activeFilePath}):\n${errLogs.join('\n')}`
          : `🛠️ Diagnose and fix the following runtime/syntax errors reported in the console for (${activeFilePath}):\n${errLogs.join('\n')}`)
      : (dir === 'rtl'
          ? `🛠️ قم بمراجعة شاملة للكود في (${activeFilePath}) وإصلاح أي أخطاء برمجية أو مشاكل توافقية وتحسين الأداء.`
          : `🛠️ Perform a comprehensive code audit on (${activeFilePath}), fix any bugs or compatibility issues, and optimize performance.`);
    addLog('log', language === 'ar' ? 'جاري تحليل الأخطاء وإصلاح الكود بواسطة مهندس البرمجيات الذكي...' : 'Analyzing errors and repairing code via AI Software Architect...');
    await handleSendPrompt(fixPrompt);
  };

  const activeFile = files[activeFilePath] || files['index.html'];
  const settingsAny = siteSettings as any;
  const logoSrc = (theme === 'light' && siteSettings?.logoLightBase64) 
    ? siteSettings?.logoLightBase64 
    : (siteSettings?.logoBase64 || settingsAny?.logoUrl || settingsAny?.siteLogo || settingsAny?.appLogo || siteSettings?.seoImageUrl);

  // Pre-warm primary destination chunks (ChatPage & ProjectOverviewPage) so Back button navigation has 0ms Suspense delay
  useEffect(() => {
    const timer = setTimeout(() => {
      import('./ChatPage').catch(() => {});
      import('./ProjectOverviewPage').catch(() => {});
    }, 350);
    return () => clearTimeout(timer);
  }, []);

  // Automatically drain queued messages when streaming finishes
  useEffect(() => {
    if (!isGenerating && queuedMessages.length > 0) {
      const nextItem = queuedMessages[0];
      setQueuedMessages(prev => prev.slice(1));
      handleSendPrompt(nextItem.text);
    }
  }, [isGenerating, queuedMessages]);

  // Load any of the 46 Builder templates into Perplexta Studio
  const handleLoadStudioTemplate = useCallback(async (tmpl: StudioTemplate, initialPrompt?: string) => {
    setProjectName(tmpl.name);
    localStorage.setItem('perplexta_active_project_name', tmpl.name);
    setTemplateOrigin({
      slug: tmpl.slug,
      name: tmpl.name,
      category: tmpl.category,
      thumbnail: tmpl.thumbnail
    });
    setIsStartScreenOpen(false);
    setIsTemplatesHubOpen(false);
    setSelectedStudioTemplate(null);
    setActiveTab('preview');
    setMobileActiveTab('preview');

    const fetchedMap = await fetchStudioTemplateFiles(tmpl);
    const newFiles: Record<string, ProjectFile> = {};
    Object.entries(fetchedMap).forEach(([path, content]) => {
      const ext = path.split('.').pop() || 'txt';
      newFiles[path] = {
        name: path.split('/').pop() || path,
        path,
        content: String(content),
        type: ext,
        isEntry: path === 'index.html'
      };
    });

    if (Object.keys(newFiles).length > 0) {
      setFiles(newFiles);
      setSavedFiles(JSON.parse(JSON.stringify(newFiles)));
      const codeKeys = Object.keys(newFiles).filter(k => !/\.(png|jpg|jpeg|webp|gif|ico)$/i.test(k));
      const entry = codeKeys.includes('index.html') ? 'index.html' : (codeKeys[0] || Object.keys(newFiles)[0]);
      setActiveFilePath(entry);
      setOpenTabs(codeKeys.slice(0, 4));
      setIframeKey(prev => prev + 1);
      saveProjectToDb(projectId, tmpl.name, newFiles);
    }

    const welcomeMsg: StudioChatMessage = {
      id: `welcome_tmpl_${Date.now()}`,
      role: 'assistant',
      text: language === 'ar'
        ? `تم تحميل قالب "${tmpl.name}" بجميع ملفاته بنجاح! يمكنك معاينته مباشرة أو اختيار أحد الاقتراحات أدناه لتخصيصه.`
        : `Loaded "${tmpl.name}" template with all source files! Preview it live or pick a suggestion below to customize it.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: tmpl.suggestions || []
    };
    setChatMessages([welcomeMsg]);
    toast.success(language === 'ar' ? `تم تحميل قالب: ${tmpl.name}` : `Loaded template: ${tmpl.name}`);

    if (initialPrompt && initialPrompt.trim()) {
      setPromptQuery(initialPrompt.trim());
      setTimeout(() => {
        promptInputRef.current?.focus();
      }, 150);
    }
  }, [language, projectId]);

  const lastHandledHandoffIdRef = useRef<string>('');

  // Cross-tab & same-tab template handoff listener (ensures only ONE Studio tab stays open)
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel('perplexta_studio_channel');
      }
    } catch (_err) {}

    const sendAck = (requestId?: string) => {
      if (!requestId) return;
      try {
        localStorage.setItem('perplexta_studio_ack', JSON.stringify({ requestId, ts: Date.now() }));
      } catch (_e) {}
      try {
        channel?.postMessage({ type: 'STUDIO_ACK', requestId });
      } catch (_e) {}
    };

    const processHandoffPayload = (payload: any) => {
      if (!payload || typeof payload !== 'object') return;
      const reqId = payload.requestId || `${payload.action || 'USE_TEMPLATE'}_${payload.templateSlug || ''}_${payload.timestamp || ''}`;
      if (reqId && lastHandledHandoffIdRef.current === reqId) {
        sendAck(payload.requestId);
        return;
      }
      if (reqId) {
        lastHandledHandoffIdRef.current = reqId;
      }

      try {
        localStorage.removeItem('pending_studio_template');
      } catch (_e) {}

      sendAck(payload.requestId);

      const action = payload.action || 'USE_TEMPLATE';
      if (action === 'OPEN_ALL_TEMPLATES') {
        setSelectedStudioTemplate(null);
        setIsTemplatesHubOpen(true);
        try {
          window.focus();
        } catch (_e) {}
        return;
      }

      if (action === 'FOCUS_STUDIO') {
        try {
          window.focus();
        } catch (_e) {}
        return;
      }

      if (payload.templateSlug && CORE_TEMPLATES_MAP[payload.templateSlug]) {
        handleLoadStudioTemplate(CORE_TEMPLATES_MAP[payload.templateSlug], payload.initialPrompt);
        try {
          window.focus();
        } catch (_e) {}
      }
    };

    const consumePendingStudioTemplate = () => {
      try {
        const raw = localStorage.getItem('pending_studio_template');
        if (!raw) return;
        const parsed = JSON.parse(raw);
        processHandoffPayload(parsed);
      } catch (_err) {}
    };

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'pending_studio_template' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          processHandoffPayload(parsed);
        } catch (_err) {}
      }
    };

    const handleWindowMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data && e.data.type === 'PERPLEXTA_STUDIO_HANDOFF') {
        processHandoffPayload(e.data);
      }
    };

    if (channel) {
      channel.onmessage = (ev) => {
        if (ev.data && ev.data.type === 'PERPLEXTA_STUDIO_HANDOFF') {
          processHandoffPayload(ev.data);
        }
      };
    }

    consumePendingStudioTemplate();
    window.addEventListener('focus', consumePendingStudioTemplate);
    window.addEventListener('storage', handleStorageEvent);
    window.addEventListener('message', handleWindowMessage);

    return () => {
      window.removeEventListener('focus', consumePendingStudioTemplate);
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('message', handleWindowMessage);
      try {
        channel?.close();
      } catch (_e) {}
    };
  }, [handleLoadStudioTemplate]);

  const activeToolSteps: StudioToolProgressStep[] = useMemo(() => {
    const steps: StudioToolProgressStep[] = [];
    if (streamStatusMessage && isGenerating) {
      steps.push({
        id: 'phase_status',
        toolName: pipelinePhase ? `Phase ${pipelinePhase}` : 'Studio Engine',
        targetFile: currentlyWritingFile || undefined,
        status: 'running',
        detail: streamStatusMessage
      });
    }
    Object.entries(fileStatuses).forEach(([path, status]) => {
      steps.push({
        id: `file_${path}`,
        toolName: status === 'writing' ? 'Writing file' : status === 'completed' ? 'Updated file' : 'Queued file',
        targetFile: path,
        status: status === 'writing' ? 'running' : status === 'completed' ? 'completed' : status === 'error' ? 'error' : 'running'
      });
    });
    return steps;
  }, [streamStatusMessage, isGenerating, pipelinePhase, currentlyWritingFile, fileStatuses]);

  const activeTodos: StudioTodoItem[] = useMemo(() => {
    if (streamedTodos.length > 0) {
      return streamedTodos;
    }
    const plannedOrder: string[] = Array.isArray(activeBlueprint?.file_tree_order)
      ? activeBlueprint.file_tree_order
      : Array.isArray(activeBlueprint?.files_order)
        ? activeBlueprint.files_order
        : [];
    if (plannedOrder.length === 0) return [];
    const seenLabels = new Set<string>();
    const items: StudioTodoItem[] = [];
    plannedOrder.forEach((rawPath, idx) => {
      const cleanPath = String(rawPath).replace(/^\/+/, '').trim();
      const st = fileStatuses[cleanPath];
      const friendlyTitle = friendlyTodoLabelForFile(cleanPath, true, language);
      const titleToUse = seenLabels.has(friendlyTitle) ? `${friendlyTitle} (${cleanPath})` : friendlyTitle;
      seenLabels.add(friendlyTitle);
      items.push({
        id: `todo_${idx}_${cleanPath}`,
        title: titleToUse,
        status: st === 'completed' ? 'completed' : st === 'writing' ? 'in_progress' : 'pending'
      });
    });
    return items;
  }, [streamedTodos, activeBlueprint, fileStatuses, language]);

  const unsavedFilesMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    Object.keys(files).forEach(k => {
      if (files[k]?.content !== savedFiles[k]?.content) {
        map[k] = true;
      }
    });
    return map;
  }, [files, savedFiles]);

  const combinedIssues: StudioIssueItem[] = useMemo(() => {
    const list: StudioIssueItem[] = [...userIssues];
    if (runtimeError) {
      list.unshift({
        id: 'runtime_err_active',
        message: runtimeError.message,
        source: runtimeError.file || activeFilePath,
        type: 'runtime'
      });
    }
    terminalLogs
      .filter(l => l.type === 'error')
      .slice(-5)
      .forEach((l, idx) => {
        if (!list.some(item => item.message === l.text)) {
          list.push({
            id: `term_err_${idx}`,
            message: l.text,
            type: 'runtime'
          });
        }
      });
    return list;
  }, [userIssues, runtimeError, terminalLogs, activeFilePath]);

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full bg-[var(--surface-page)] text-[var(--text-primary)] font-sans flex flex-col overflow-hidden">
      {/* Studio Header Component */}
      <div className="relative shrink-0 z-30 flex items-center bg-[var(--surface-card)] border-b border-[var(--border-default)]">
        <div className="flex-1 min-w-0">
          <StudioHeader
            projectName={projectName}
            onRenameProject={(newName) => {
              setProjectName(newName);
              localStorage.setItem('perplexta_active_project_name', newName);
              saveProjectToDb(projectId, newName);
            }}
            onOpenProjectsDrawer={() => {
              if (!user) {
                setIsAuthModalOpen(true);
                return;
              }
              fetchUserWorkspaces();
              setIsProjectDrawerOpen(true);
            }}
            onOpenTemplates={() => setIsTemplatesHubOpen(true)}
            onTriggerAiFix={handleAiFix}
            onDownloadProject={handleDownloadZip}
            onTogglePublish={() => setIsPublishPopoverOpen(true)}
            isPublished={isPublished}
            isPublishDirty={hasUnsavedChanges}
            isGenerating={isGenerating}
            onCreateNewProject={handleCreateNewProject}
            onOpenVersions={() => setIsVersionsPanelOpen(true)}
            onSharePreview={handleOpenInNewTab}
            onBack={() => {
              saveProjectToDb();
              navigate(user || token ? '/chat' : '/');
            }}
            onToggleStartScreen={() => setIsStartScreenOpen(prev => !prev)}
            isStartScreenOpen={isStartScreenOpen}
            onOpenEnvModal={() => setIsEnvModalOpen(true)}
            language={language === 'en' ? 'en' : 'ar'}
          />
        </div>
      </div>

      {/* Start Screen Launchpad Overlay (StudioStartScreen) */}
      {isStartScreenOpen && (
        <div className="fixed inset-0 top-12 z-40 bg-[var(--surface-page)] flex flex-col overflow-hidden">
          <div className="px-4 py-2 bg-[var(--surface-card)] border-b border-[var(--border-default)] flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-secondary)]">
              {language === 'ar' ? 'شاشة انطلاق الاستوديو — اختر قالباً أو ابدأ بوصف فكرتك' : 'Studio Launchpad — Pick a starter template or describe your idea'}
            </span>
            <button
              type="button"
              onClick={() => setIsStartScreenOpen(false)}
              className="px-3 py-1 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs font-bold text-[var(--text-primary)] hover:border-blue-500 cursor-pointer"
            >
              {language === 'ar' ? 'العودة لمساحة العمل ←' : 'Return to Workspace →'}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <StudioStartScreen
              language={language === 'en' ? 'en' : 'ar'}
              onSendPrompt={(promptText: string) => {
                setIsStartScreenOpen(false);
                handleSendPrompt(promptText);
              }}
              onSelectTemplate={(tmpl) => {
                setSelectedStudioTemplate(tmpl);
              }}
              onOpenAllTemplates={() => setIsTemplatesHubOpen(true)}
            />
          </div>
        </div>
      )}

      {/* Mobile Viewport Navigation Switcher (< md) */}
      <div className="md:hidden flex items-center bg-[var(--surface-card)] border-b border-[var(--border-default)] px-2 py-1.5 shrink-0 justify-around select-none">
        <button
          onClick={() => {
            setMobileActiveTab('chat');
            setSideNavActiveTab('chat');
          }}
          className={`flex-1 h-8 px-2 rounded-shape-sm text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mobileActiveTab === 'chat'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'
          }`}
        >
          <Sparkles size={13} />
          <span>{language === 'ar' ? 'المساعد' : 'Assistant'}</span>
        </button>
        <button
          onClick={() => {
            setMobileActiveTab('files');
            setSideNavActiveTab('files');
          }}
          className={`flex-1 h-8 px-2 rounded-shape-sm text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mobileActiveTab === 'files'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'
          }`}
        >
          <Folder size={13} />
          <span>{language === 'ar' ? 'الملفات' : 'Files'}</span>
        </button>
        <button
          onClick={() => setMobileActiveTab('preview')}
          className={`flex-1 h-8 px-2 rounded-shape-sm text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mobileActiveTab === 'preview'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'
          }`}
        >
          <Monitor size={13} />
          <span>{language === 'ar' ? 'المعاينة' : 'Preview'}</span>
        </button>
      </div>
      <div className="flex-1 flex overflow-hidden bg-[var(--surface-page)]">
        {/* Primary Sidebar - Icon Only Navigation */}
        <aside className="w-13 sm:w-14 bg-[var(--surface-card)] border-r border-[var(--border-default)] flex flex-col items-center py-3.5 gap-3 shrink-0 z-20 select-none">
          <button
            onClick={() => {
              setSideNavActiveTab('chat');
              setMobileActiveTab('chat');
            }}
            className={`w-8 h-8 min-w-[32px] min-h-[32px] max-w-[32px] max-h-[32px] btn-square-primary flex items-center justify-center transition-all cursor-pointer relative group shrink-0 border before:absolute before:-inset-1.5 ${
              sideNavActiveTab === 'chat'
                ? 'bg-[var(--surface-subtle)] border-transparent text-[var(--fg-accent)] shadow-2xs'
                : 'bg-transparent border-[var(--border-default)] hover:border-transparent hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            } rounded-shape-sm`}
            title={language === 'ar' ? 'المساعد الذكي' : 'AI Assistant'}
          >
            {/* Ambient Soft Glow Layer */}
            <div
              className={`absolute -inset-[2px] rounded-shape-md rtl:rounded-es-2xs ltr:rounded-ee-2xs overflow-hidden pointer-events-none z-0 ${
                sideNavActiveTab === 'chat' || isGenerating ? 'opacity-40 blur-[2px]' : 'opacity-0 group-hover:opacity-30 blur-[2px]'
              } transition-opacity duration-300`}
            >
              <div
                className={`absolute -inset-[150%] bg-[conic-gradient(from_0deg,#3b82f6_0%,#8b5cf6_25%,#ec4899_50%,#10b981_75%,#3b82f6_100%)] ${
                  isGenerating ? 'animate-[spin_2s_linear_infinite_reverse]' : 'animate-[spin_5s_linear_infinite_reverse]'
                }`}
              />
            </div>

            {/* Static Outer Mask with Rotating Rainbow Border Light Stream */}
            <div
              className={`absolute -inset-[1px] rounded-shape-md rtl:rounded-es-2xs ltr:rounded-ee-2xs overflow-hidden p-[1.5px] pointer-events-none z-0 ${
                sideNavActiveTab === 'chat' || isGenerating ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              } transition-opacity duration-300`}
            >
              <div
                className={`absolute -inset-[150%] bg-[conic-gradient(from_0deg,#3b82f6_0%,#8b5cf6_25%,#ec4899_50%,#f59e0b_75%,#10b981_88%,#3b82f6_100%)] ${
                  isGenerating ? 'animate-[spin_2s_linear_infinite_reverse]' : 'animate-[spin_5s_linear_infinite_reverse]'
                }`}
              />
              <div className="w-full h-full bg-[var(--surface-card)] rounded-[calc(var(--radius-shape-md,12px)-1px)] rtl:rounded-es-3xs ltr:rounded-ee-3xs relative z-10" />
            </div>

            <div className="relative w-6.5 h-6.5 flex items-center justify-center shrink-0 z-10">
              {logoSrc ? (
                <NotificationIconRenderer
                  src={resolveImageUrl(logoSrc, 'general')}
                  alt="Platform Logo"
                  size={22}
                  className="w-5.5 h-5.5 object-contain block relative z-10"
                  fallbackIcon={<AssistantIcon size={22} fallbackType="sparkles" className="text-accent relative z-10" />}
                />
              ) : (
                <AssistantIcon size={22} fallbackType="sparkles" className="text-accent relative z-10" />
              )}
            </div>
            <span className="absolute start-12 sm:start-14 px-2 py-1 bg-[var(--surface-card)] text-[var(--text-primary)] border border-[var(--border-default)] shadow-md text-[10px] rounded-shape-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              {language === 'ar' ? 'المساعد الذكي' : 'AI Assistant'}
            </span>
          </button>

          <button
            onClick={() => {
              setSideNavActiveTab('files');
              setMobileActiveTab('files');
            }}
            className={`w-8 h-8 rounded-shape-sm flex items-center justify-center transition-all cursor-pointer relative group shrink-0 before:absolute before:-inset-1.5 ${
              sideNavActiveTab === 'files' ? 'bg-accent text-white shadow-md shadow-accent/20' : 'text-[var(--text-muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]'
            }`}
            title={language === 'ar' ? 'ملفات المشروع' : 'Project Files'}
          >
            <Folder size={16} />
            <span className="absolute start-12 sm:start-14 px-2 py-1 bg-[var(--surface-card)] text-[var(--text-primary)] border border-[var(--border-default)] shadow-md text-[10px] rounded-shape-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              {language === 'ar' ? 'ملفات المشروع' : 'Project Files'}
            </span>
          </button>

          <button
            onClick={() => {
              if (!user) { setIsAuthModalOpen(true); return; }
              fetchUserWorkspaces();
              setSideNavActiveTab('projects');
              if (mobileActiveTab === 'preview') setMobileActiveTab('files');
            }}
            className={`w-8 h-8 rounded-shape-sm flex items-center justify-center transition-all cursor-pointer relative group shrink-0 before:absolute before:-inset-1.5 ${
              sideNavActiveTab === 'projects' ? 'bg-accent text-white shadow-md shadow-accent/20' : 'text-[var(--text-muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]'
            }`}
            title={language === 'ar' ? 'كل المشاريع' : 'All Projects'}
          >
            <Layers size={16} />
            <span className="absolute start-12 sm:start-14 px-2 py-1 bg-[var(--surface-card)] text-[var(--text-primary)] border border-[var(--border-default)] shadow-md text-[10px] rounded-shape-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              {language === 'ar' ? 'كل المشاريع' : 'All Projects'}
            </span>
          </button>

          <button
            onClick={() => {
              if (!user) { setIsAuthModalOpen(true); return; }
              fetchSnapshots(projectId);
              setSideNavActiveTab('versions');
              if (mobileActiveTab === 'preview') setMobileActiveTab('files');
            }}
            className={`w-8 h-8 rounded-shape-sm flex items-center justify-center transition-all cursor-pointer relative group shrink-0 before:absolute before:-inset-1.5 ${
              sideNavActiveTab === 'versions' ? 'bg-accent text-white shadow-md shadow-accent/20' : 'text-[var(--text-muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]'
            }`}
            title={language === 'ar' ? 'إصدارات التطوير' : 'History'}
          >
            <History size={16} />
            <span className="absolute start-12 sm:start-14 px-2 py-1 bg-[var(--surface-card)] text-[var(--text-primary)] border border-[var(--border-default)] shadow-md text-[10px] rounded-shape-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              {language === 'ar' ? 'إصدارات التطوير' : 'History'}
            </span>
          </button>

          <button
            onClick={() => {
              setSideNavActiveTab('db');
              if (mobileActiveTab === 'preview') setMobileActiveTab('files');
            }}
            className={`w-8 h-8 rounded-shape-sm flex items-center justify-center transition-all cursor-pointer relative group shrink-0 before:absolute before:-inset-1.5 ${
              sideNavActiveTab === 'db' ? 'bg-accent text-white shadow-md shadow-accent/20' : 'text-[var(--text-muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]'
            }`}
            title={language === 'ar' ? 'قاعدة البيانات' : 'Database'}
          >
            <Database size={16} />
            <span className="absolute start-12 sm:start-14 px-2 py-1 bg-[var(--surface-card)] text-[var(--text-primary)] border border-[var(--border-default)] shadow-md text-[10px] rounded-shape-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              {language === 'ar' ? 'قاعدة البيانات' : 'Database'}
            </span>
          </button>

          <div className="mt-auto pb-3 flex flex-col gap-3 items-center">
            <button
              onClick={() => {
                setIsTerminalOpen(!isTerminalOpen);
                if (!isTerminalOpen) setMobileActiveTab('preview');
              }}
              className={`w-8 h-8 rounded-shape-sm flex items-center justify-center transition-all cursor-pointer relative group shrink-0 before:absolute before:-inset-1.5 ${
                isTerminalOpen ? 'bg-amber-500/10 text-amber-500' : 'text-[var(--text-muted)] hover:bg-[var(--surface-subtle)] hover:text-amber-500'
              }`}
              title={language === 'ar' ? 'منفذ الأوامر والتعلم' : 'Terminal & Logs'}
            >
              <Terminal size={16} />
              {terminalLogs.some(l => l.type === 'error') && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
              <span className="absolute start-12 sm:start-14 px-2 py-1 bg-[var(--surface-card)] text-[var(--text-primary)] border border-[var(--border-default)] shadow-md text-[10px] rounded-shape-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                {language === 'ar' ? 'منفذ الأوامر' : 'Terminal'}
              </span>
            </button>

            <div className="h-px w-6 bg-[var(--border-default)]" />

            {/* User Avatar Button with Hover & Click Popover User Menu & Logout (Exact Replica of Main Sidebar) */}
            <div className="relative group/avatar">
              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    setIsAuthModalOpen(true);
                  } else {
                    setIsUserMenuOpen(prev => !prev);
                  }
                }}
                style={{
                  borderColor: user?.subscription?.plan_color || 'var(--border-default)'
                }}
                className="w-8 h-8 rounded-shape-sm flex items-center justify-center transition-colors duration-fast cursor-pointer relative border bg-[var(--surface-subtle)] overflow-hidden shrink-0 shadow-2xs before:absolute before:-inset-1.5"
                title={user ? (user.name || user.email || (language === 'ar' ? 'الملف الشخصي' : 'Profile')) : (language === 'ar' ? 'تسجيل الدخول' : 'Sign In')}
              >
                {user?.avatar ? (
                  <img
                    src={resolveImageUrl(user.avatar, 'avatar')}
                    alt={user.name || 'User Avatar'}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR;
                    }}
                  />
                ) : (
                  <User size={15} className="text-[var(--text-muted)] group-hover/avatar:text-[var(--text-primary)] transition-colors duration-fast" />
                )}
              </button>

              {user && (() => {
                const rawProfileLinks = [
                  {
                    id: 'account',
                    label: t('accountSettings') || (dir === 'rtl' ? 'إعدادات الحساب' : 'Account Settings'),
                    icon: User,
                    path: '/settings/account'
                  },
                  {
                    id: 'usage',
                    label: t('consumption') || (dir === 'rtl' ? 'الاستهلاك والحدود' : 'Usage & Limits'),
                    icon: Activity,
                    path: '/settings/usage'
                  },
                  {
                    id: 'wallet',
                    label: t('wallet') || (dir === 'rtl' ? 'المحفظة والرصيد' : 'Wallet'),
                    icon: Wallet,
                    path: '/settings/wallet'
                  },
                  {
                    id: 'memory',
                    label: t('memoryCenter') || (dir === 'rtl' ? 'ذاكرة المساعد' : 'Memory Center'),
                    icon: BrainCircuit,
                    path: '/settings/memory'
                  }
                ];

                const sortedProfileLinks = [...rawProfileLinks].sort((a, b) => {
                  const lenA = a.label.trim().length;
                  const lenB = b.label.trim().length;
                  return lenA !== lenB ? lenA - lenB : a.label.localeCompare(b.label);
                });

                return (
                  <div
                    dir={dir}
                    className={`absolute bottom-0 start-11 w-60 p-1.5 rounded-shape-md border shadow-2xl z-50 bg-[var(--surface-card)] border-[var(--border-default)] flex flex-col gap-0.5 font-sans transition-all duration-200 before:content-[''] before:absolute before:-inset-3 before:-z-10 ${
                      isUserMenuOpen
                        ? 'opacity-100 pointer-events-auto scale-100'
                        : 'opacity-0 pointer-events-none group-hover/avatar:opacity-100 group-hover/avatar:pointer-events-auto scale-95 group-hover/avatar:scale-100'
                    }`}
                  >
                    {/* User profile header summary */}
                    <div className="flex items-center gap-2.5 px-2.5 py-2 border-b border-[var(--border-default)] mb-1 overflow-hidden">
                      <div
                        className="w-7 h-7 rounded-shape-sm flex items-center justify-center flex-shrink-0 overflow-hidden border transition-colors duration-fast"
                        style={{ borderColor: user.subscription?.plan_color || 'var(--border-default)' }}
                      >
                        {user.avatar ? (
                          <img
                            src={resolveImageUrl(user.avatar, 'avatar')}
                            alt={user.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR; }}
                          />
                        ) : (
                          <User size={14} className="text-[var(--text-muted)]" />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1 text-start overflow-hidden">
                        <span className="font-bold text-xs truncate leading-tight text-[var(--text-primary)]">{user.name}</span>
                        <span className="text-[9.5px] text-[var(--text-muted)] truncate leading-tight mt-0.5 font-medium">
                          {t(`role_${(user.role || 'user').toLowerCase()}`) || user.role || 'Member'}
                        </span>
                      </div>
                      {user.subscription?.plan_name_en && (
                        <span
                          className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-shape-xs border border-current leading-none shrink-0"
                          style={{ color: user.subscription?.plan_color || 'var(--text-primary)' }}
                        >
                          {user.subscription?.plan_name_en}
                        </span>
                      )}
                    </div>

                    {/* Menu options sorted hierarchically */}
                    {sortedProfileLinks.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            navigate(item.path);
                          }}
                          className="group w-full h-[36px] min-h-[36px] flex items-center gap-2.5 px-3 py-2 rounded-shape-sm border border-transparent bg-transparent hover:bg-[var(--surface-subtle)]/25 transition-all duration-fast cursor-pointer select-none text-start text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-98"
                        >
                          <Icon size={14} className="text-[var(--text-muted)] group-hover:text-[var(--fg-accent)] shrink-0 transition-colors duration-fast" />
                          <span className="truncate min-w-0 flex-1 text-xs font-medium text-[var(--text-primary)] group-hover:text-[var(--text-primary)] transition-colors duration-fast">
                            {item.label}
                          </span>
                        </button>
                      );
                    })}

                    <div className="h-px bg-[var(--border-default)] my-1 mx-1" />

                    {/* Logout */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="group w-full h-[36px] min-h-[36px] flex items-center gap-2.5 px-3 py-2 rounded-shape-sm border border-transparent bg-transparent hover:bg-red-500/10 text-[var(--fg-danger)] transition-all duration-fast cursor-pointer select-none text-start active:scale-98"
                    >
                      <LogOut size={14} className="text-[var(--fg-danger)] group-hover:opacity-90 shrink-0 transition-colors duration-fast" />
                      <span className="truncate min-w-0 flex-1 text-xs font-bold text-[var(--fg-danger)] group-hover:opacity-90 transition-colors duration-fast">
                        {t('logout') || (dir === 'rtl' ? 'تسجيل الخروج' : 'Logout')}
                      </span>
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        </aside>

        {/* Secondary Contextual Tool Panel */}
        <aside className={`w-full md:w-80 sm:md:w-96 bg-[var(--surface-card)] border-r border-[var(--border-default)] flex-col overflow-hidden shrink-0 z-10 text-[var(--text-primary)] transition-all duration-200 ${
          isChatCollapsed ? 'md:!w-0 md:opacity-0 md:border-r-0' : ''
        } ${
          mobileActiveTab !== 'preview' ? 'flex' : 'hidden md:flex'
        }`}>
          <AnimatePresence mode="wait">
            {sideNavActiveTab === 'chat' && (
              <motion.div 
                key="chat-tab"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <div className="h-10 px-3.5 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--surface-card)] relative shrink-0 select-none">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-shape-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider">
                      {language === 'ar' ? 'المساعد الذكي للاستوديو' : 'Studio AI Architect'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] bg-[var(--surface-subtle)] px-2 py-0.5 rounded-shape-xs border border-[var(--border-default)]">
                    {isGenerating ? (language === 'ar' ? 'جاري البناء...' : 'Building...') : (language === 'ar' ? 'جاهز' : 'Ready')}
                  </span>
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
                </div>
                
                <div className="flex-1 flex flex-col overflow-hidden bg-[var(--surface-page)] relative">
                  <div className="flex-1 overflow-hidden flex flex-col">
                    <StudioConversation 
                      messages={chatMessages.map(m => ({
                        id: m.id,
                        role: m.role as any,
                        content: m.text || m.content || '',
                        openingContent: m.openingContent,
                        todos: m.todos,
                        clarifyRecap: m.clarifyRecap,
                        timestamp: m.timestamp,
                        thinking: m.logs?.join('\n'),
                        filesUpdated: m.filesUpdated,
                        suggestions: m.suggestions,
                        attachments: m.attachments
                      }))}
                      isStreaming={isGenerating}
                      language={language === 'en' ? 'en' : 'ar'}
                      onSelectSuggestion={(s, label) => {
                        if (label) {
                          recentSuggestionLabelsRef.current = [...recentSuggestionLabelsRef.current, label].slice(-25);
                        }
                        if (s.trim().endsWith(':')) {
                          setPromptQuery(s.endsWith(' ') ? s : `${s} `);
                          toast.info(
                            language === 'ar'
                              ? 'أضف بياناتك الخاصة بعد النقطتين في صندوق المحادثة ثم اضغط إرسال'
                              : 'Type your details in the input box and press Send'
                          );
                        } else {
                          setPromptQuery(s);
                          handleSendPrompt(s, { allowClarify: false });
                        }
                      }}
                      onRegenerateSuggestions={handleRegenerateSuggestions}
                      isRegeneratingSuggestions={isRegeneratingSuggestions}
                      onSelectFile={(path) => {
                        openFile(path);
                        setActiveTab('code');
                      }}
                      toolSteps={activeToolSteps}
                      todos={activeTodos}
                      clarifyQuestions={clarifyQuestions}
                      clarifyLeadIn={clarifyLeadIn}
                      onSubmitClarification={(answers) => {
                        const activeQs = [...clarifyQuestions];
                        const leadInSnapshot = clarifyLeadIn;
                        const basePrompt = pendingClarifyPrompt || promptQuery || (language === 'ar' ? 'ابنِ المشروع المطلوب' : 'Build the requested project');
                        setClarifyQuestions([]);
                        setClarifyLeadIn('');
                        setPendingClarifyPrompt('');
                        const recap = formatClarificationRecap(activeQs, answers, { language });
                        const recapItems = activeQs
                          .map(q => ({
                            question: q.question,
                            answer: (answers[q.id] || []).join(', ')
                          }))
                          .filter(item => item.answer.trim().length > 0);
                        setChatMessages(prev => [
                          ...prev,
                          ...(leadInSnapshot
                            ? [
                                {
                                  id: `clarify_lead_${Date.now()}`,
                                  role: 'assistant' as const,
                                  text: leadInSnapshot,
                                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                }
                              ]
                            : []),
                          {
                            id: `clarify_recap_${Date.now()}`,
                            role: 'assistant' as const,
                            text: recap.userDisplayMessage,
                            clarifyRecap: {
                              skipped: false,
                              items: recapItems
                            },
                            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          }
                        ]);
                        handleSendPrompt(basePrompt, {
                          allowClarify: false,
                          clarificationContext: recap.promptContext,
                          skipUserMessage: true
                        });
                      }}
                      onSkipClarification={() => {
                        const activeQs = [...clarifyQuestions];
                        const leadInSnapshot = clarifyLeadIn;
                        const basePrompt = pendingClarifyPrompt || promptQuery || (language === 'ar' ? 'ابنِ المشروع المطلوب' : 'Build the requested project');
                        setClarifyQuestions([]);
                        setClarifyLeadIn('');
                        setPendingClarifyPrompt('');
                        const recap = formatClarificationRecap(activeQs, {}, { skipped: true, language });
                        setChatMessages(prev => [
                          ...prev,
                          ...(leadInSnapshot
                            ? [
                                {
                                  id: `clarify_lead_${Date.now()}`,
                                  role: 'assistant' as const,
                                  text: leadInSnapshot,
                                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                }
                              ]
                            : []),
                          {
                            id: `clarify_recap_${Date.now()}`,
                            role: 'assistant' as const,
                            text: recap.userDisplayMessage,
                            clarifyRecap: {
                              skipped: true,
                              items: []
                            },
                            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          }
                        ]);
                        handleSendPrompt(basePrompt, {
                          allowClarify: false,
                          clarificationContext: recap.promptContext,
                          skipUserMessage: true
                        });
                      }}
                      queuedMessages={queuedMessages}
                      onRemoveQueued={(id) => setQueuedMessages(prev => prev.filter(q => q.id !== id))}
                      onEditQueued={(id) => {
                        const target = queuedMessages.find(q => q.id === id);
                        if (target) {
                          setPromptQuery(target.text);
                          setQueuedMessages(prev => prev.filter(q => q.id !== id));
                        }
                      }}
                      onSendQueuedNow={(id) => {
                        const target = queuedMessages.find(q => q.id === id);
                        if (target) {
                          setQueuedMessages(prev => prev.filter(q => q.id !== id));
                          handleStopGeneration();
                          setTimeout(() => handleSendPrompt(target.text, { allowClarify: false }), 120);
                        }
                      }}
                      templateOrigin={templateOrigin}
                    />
                  </div>

                  <div className="p-3 border-t border-[var(--border-default)] bg-[var(--surface-card)] shadow-2xl z-10">
                    <StudioComposer 
                      onSendMessage={(text) => {
                        // If a Clarify card is currently active, typing a direct reply resolves it immediately (like clarify.js submitDirectReply)
                        if (clarifyQuestions.length > 0) {
                          const activeQs = [...clarifyQuestions];
                          const basePrompt = pendingClarifyPrompt || text;
                          setClarifyQuestions([]);
                          setClarifyLeadIn('');
                          setPendingClarifyPrompt('');
                          const recap = formatClarificationRecap(activeQs, {}, { directReply: text, language });
                          handleSendPrompt(basePrompt, {
                            allowClarify: false,
                            clarificationContext: recap.promptContext,
                            displayUserText: text
                          });
                          return;
                        }
                        const prefix = editTarget
                          ? `[Target Element: <${editTarget.tag.toLowerCase()}${editTarget.id ? `#${editTarget.id}` : ''}${editTarget.classes ? `.${editTarget.classes.trim().replace(/\s+/g, '.')}` : ''}>]\n`
                          : '';
                        if (editTarget) setEditTarget(null);
                        handleSendPrompt(`${prefix}${text}`, { allowClarify: !prefix });
                      }}
                      onQueueMessage={(text) => {
                        setQueuedMessages(prev => [
                          ...prev,
                          {
                            id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                            text,
                            createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          }
                        ]);
                      }}
                      isStreaming={isGenerating}
                      onStopStreaming={handleStopGeneration}
                      initialValue={promptQuery}
                      editTarget={editTarget}
                      onClearEditTarget={() => setEditTarget(null)}
                      language={language === 'en' ? 'en' : 'ar'}
                      placeholder={
                        clarifyQuestions.length > 0
                          ? (language === 'ar' ? 'أو أجب مباشرة هنا...' : 'Or reply directly…')
                          : (language === 'ar' ? 'اطلب ميزة، تعديل، أو إصلاح...' : 'Ask for changes, new features, or fixes...')
                      }
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {sideNavActiveTab === 'files' && (
              <motion.div 
                key="files-tab"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <div className="h-10 px-4 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--surface-subtle)]/50 shrink-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-[10px] font-bold leading-none uppercase tracking-wider text-[var(--text-primary)]">
                      {language === 'ar' ? 'مستعرض الملفات' : 'Explorer'}
                    </h2>
                    <span className="text-[9px] text-[var(--text-muted)] font-mono leading-none">
                      ({Object.keys(files).length})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => setIsNewFileModalOpen(true)}
                      className="w-7 h-7 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)] inline-flex items-center justify-center hover:border-accent/40 text-accent transition-colors cursor-pointer shrink-0"
                      title={language === 'ar' ? 'ملف جديد' : 'New File'}
                    >
                      <Plus size={13} />
                    </button>
                    <div className="relative group/upload flex items-center">
                      <button 
                        type="button"
                        onClick={() => setIsUploadMenuOpen(prev => !prev)}
                        className="w-7 h-7 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)] inline-flex items-center justify-center hover:border-accent/40 text-[var(--text-muted)] hover:text-accent transition-colors cursor-pointer shrink-0 relative before:absolute before:-inset-1.5"
                        title={language === 'ar' ? 'رفع ملفات' : 'Upload'}
                      >
                        <HardDrive size={13} />
                      </button>
                      <div className={`absolute end-0 top-full mt-1 ${isUploadMenuOpen ? 'flex' : 'hidden group-hover/upload:flex'} flex-col bg-[var(--surface-card)] border border-[var(--border-default)] rounded-shape-sm shadow-xl z-50 p-1 w-32`}>
                        <button onClick={() => { setIsUploadMenuOpen(false); fileInputRef.current?.click(); }} className="flex items-center gap-2 px-2 py-1.5 text-[10px] hover:bg-[var(--surface-subtle)] rounded-shape-xs transition-colors text-start cursor-pointer">
                          <FileCode size={12} /> {language === 'ar' ? 'رفع ملف' : 'Upload File'}
                        </button>
                        <button onClick={() => { setIsUploadMenuOpen(false); zipInputRef.current?.click(); }} className="flex items-center gap-2 px-2 py-1.5 text-[10px] hover:bg-[var(--surface-subtle)] rounded-shape-xs transition-colors text-start cursor-pointer">
                          <Folder size={12} /> {language === 'ar' ? 'رفع Zip' : 'Upload Zip'}
                        </button>
                      </div>
                    </div>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleUploadFile} multiple className="hidden" />
                  <input type="file" ref={zipInputRef} onChange={handleUploadZip} accept=".zip" className="hidden" />
                </div>
                
                <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
                  {Object.keys(files).length === 0 ? (
                    <div className="py-12 text-center text-[10px] text-[var(--text-muted)] border border-dashed border-[var(--border-default)] rounded-shape-md m-2">
                      {language === 'ar' ? 'المشروع فارغ. ابدأ برفع ملفات أو وصف ما تريد بناءه.' : 'Project is empty. Start by uploading files or describing what to build.'}
                    </div>
                  ) : Object.keys(files).sort().map(path => {
                    const isActive = activeFilePath === path;
                    const isWriting = currentlyWritingFile === path;
                    const isUnsaved = savedFiles[path]?.content !== files[path]?.content;
                    
                    return (
                      <div
                        key={path}
                        className={`group relative w-full h-9 px-3 rounded-shape-sm flex items-center gap-3 transition-all cursor-pointer ${
                          isActive 
                            ? 'bg-accent/10 text-accent font-bold' 
                            : 'text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]'
                        }`}
                        onClick={() => openFile(path)}
                      >
                        <div className="shrink-0 relative">
                          {path.endsWith('.html') ? <Globe size={14} /> : path.endsWith('.sql') ? <Database size={14} /> : <FileCode size={14} />}
                          {isWriting && <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full animate-ping" />}
                          {isUnsaved && !isWriting && <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-amber-500 rounded-full" />}
                        </div>
                        <span className="text-[11px] truncate flex-1 text-start">{path}</span>
                        <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
                          <button onClick={(e) => { e.stopPropagation(); setFileToRename(path); setNewFilePathRename(path); }} className="p-1 hover:text-accent cursor-pointer" title={language === 'ar' ? 'إعادة تسمية' : 'Rename'}><Edit2 size={11} /></button>
                          <button onClick={(e) => { e.stopPropagation(); setFileToDelete(path); }} className="p-1 hover:text-red-500 cursor-pointer" title={language === 'ar' ? 'حذف' : 'Delete'}><Trash2 size={11} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {sideNavActiveTab === 'projects' && (
              <motion.div 
                key="projects-tab"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <div className="h-10 px-4 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--surface-card)] shrink-0">
                  <h2 className="text-xs font-bold leading-none uppercase tracking-wider text-[var(--text-primary)]">
                    {language === 'ar' ? 'المشاريع' : 'Projects'}
                  </h2>
                  <button
                    onClick={handleCreateNewProject}
                    className="w-7 h-7 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:bg-accent hover:text-white hover:border-accent text-accent inline-flex items-center justify-center transition-all cursor-pointer shrink-0"
                    title={language === 'ar' ? 'مشروع جديد' : 'New Project'}
                  >
                    <Plus size={13} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                  {userWorkspaces.map(ws => {
                    const isActive = ws.id === projectId;
                    return (
                      <div
                        key={ws.id}
                        onClick={() => handleSwitchWorkspace(ws)}
                        className={`group relative w-full px-3 py-2 rounded-shape-sm border text-start transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                          isActive 
                            ? 'bg-accent/10 border-accent/40 text-accent font-bold shadow-2xs' 
                            : 'bg-[var(--surface-card)] border-[var(--border-default)] hover:bg-[var(--surface-subtle)] hover:border-accent/30 text-[var(--text-primary)]'
                        }`}
                      >
                        {/* Project Name */}
                        <h4 className="text-xs font-bold truncate flex-1 min-w-0">
                          {ws.title}
                        </h4>

                        {/* Date & Hover Actions aligned on the same horizontal line */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="hidden md:inline text-[10px] font-mono text-[var(--text-muted)] md:group-hover:hidden transition-all">
                            {new Date(ws.updated_at).toLocaleDateString()}
                          </span>

                          <div className="flex md:hidden md:group-hover:flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRenameWorkspacePrompt(ws.id, ws.title);
                              }}
                              className="p-1 hover:bg-accent/15 rounded-shape-xs text-[var(--text-muted)] hover:text-accent transition-colors cursor-pointer"
                              title={language === 'ar' ? 'إعادة تسمية' : 'Rename'}
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteWorkspacePrompt(ws.id, ws.title);
                              }}
                              className="p-1 hover:bg-red-500/15 rounded-shape-xs text-[var(--text-muted)] hover:text-red-500 transition-colors cursor-pointer"
                              title={language === 'ar' ? 'حذف' : 'Delete'}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {sideNavActiveTab === 'versions' && (
              <motion.div 
                key="versions-tab"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <div className="h-10 px-4 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--surface-subtle)]/50 shrink-0">
                  <h2 className="text-xs font-bold leading-none uppercase tracking-wider text-[var(--text-primary)]">
                    {language === 'ar' ? 'إصدارات التطوير' : 'Versions'}
                  </h2>
                  <History size={14} className="text-accent shrink-0" />
                </div>

                <div className="p-3 border-b border-[var(--border-default)] bg-[var(--surface-subtle)]/30">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSnapshotName}
                      onChange={(e) => setNewSnapshotName(e.target.value)}
                      placeholder={language === 'ar' ? 'اسم نقطة الرجوع...' : 'Snapshot name...'}
                      className="flex-1 h-8 px-2.5 bg-[var(--surface-card)] border border-[var(--border-default)] rounded-shape-sm text-[11px] text-[var(--text-primary)] outline-none focus:border-accent"
                    />
                    <button
                      onClick={() => handleCreateSnapshot()}
                      disabled={!newSnapshotName.trim() || isSnapshotLoading}
                      className="h-8 w-8 rounded-shape-sm bg-accent text-white flex items-center justify-center hover:opacity-90 disabled:opacity-40 cursor-pointer shadow-sm shrink-0"
                      title={language === 'ar' ? 'حفظ نسخة' : 'Save'}
                    >
                      {isSnapshotLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {workspaceSnapshots.length > 0 ? workspaceSnapshots.map(snap => (
                    <div key={snap.id} className="p-3 rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] group hover:border-accent/30 transition-all">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-[var(--text-primary)] truncate">{snap.version_name}</span>
                        <button 
                          onClick={() => handleRestoreSnapshot(snap.id, snap.version_name)} 
                          className="px-2 py-1 bg-accent text-white rounded-shape-xs text-[10px] font-bold opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity cursor-pointer whitespace-nowrap"
                        >
                          {language === 'ar' ? 'استعادة' : 'Restore'}
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-[9px] text-[var(--text-muted)] font-mono">
                        <Clock size={10} />
                        <span>{new Date(snap.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  )) : (
                    <div className="py-12 text-center text-xs text-[var(--text-muted)] flex flex-col items-center gap-2">
                      <History size={24} className="opacity-20" />
                      <p>{language === 'ar' ? 'لا توجد إصدارات محفوظة بعد' : 'No versions saved yet'}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {sideNavActiveTab === 'db' && (
              <motion.div 
                key="db-tab"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <div className="h-10 px-4 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--surface-subtle)]/50 shrink-0">
                  <h2 className="text-xs font-bold leading-none uppercase tracking-wider text-[var(--text-primary)]">
                    {language === 'ar' ? 'قاعدة البيانات' : 'Database'}
                  </h2>
                  <button onClick={() => setIsDbModalOpen(true)} className="w-8 h-8 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)] inline-flex items-center justify-center hover:border-accent/40 text-accent transition-colors cursor-pointer shrink-0" title={language === 'ar' ? 'تكبير' : 'Expand'}><ArrowUpRight size={13} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">{language === 'ar' ? 'الجداول المتوفرة' : 'Tables'}</span>
                    {sqlTables.length > 0 ? sqlTables.map(tbl => (
                      <button 
                        key={tbl} 
                        onClick={() => { setSelectedTable(tbl); setIsDbModalOpen(true); }} 
                        className={`w-full px-3 h-8 min-h-[32px] max-h-[32px] rounded-shape-sm border flex items-center justify-between text-start text-xs font-mono leading-[23px] transition-all cursor-pointer ${selectedTable === tbl ? 'bg-accent/10 border-accent/30 text-accent font-bold' : 'bg-[var(--surface-card)] border-[var(--border-default)] hover:border-accent/30'}`}
                      >
                        <span className="truncate h-[23px] leading-[23px] flex items-center">{tbl}</span>
                        <ChevronRight size={12} className={language === 'ar' ? 'rotate-180' : ''} />
                      </button>
                    )) : (
                      <div className="py-8 text-center text-[10px] text-[var(--text-muted)] border border-dashed border-[var(--border-default)] rounded-shape-md">
                        {language === 'ar' ? 'لا توجد جداول' : 'No tables'}
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => setIsDbModalOpen(true)}
                    className="w-full h-8 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[10px] font-bold text-[var(--text-primary)] hover:border-accent transition-all cursor-pointer"
                  >
                    {language === 'ar' ? 'فتح مدير قاعدة البيانات' : 'Open SQL Manager'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </aside>
        {/* Main Canvas Area */}
        <main className={`flex-1 flex flex-col overflow-hidden relative bg-[var(--surface-page)] p-2 md:p-3 md:pb-3.5 ${
          mobileActiveTab === 'preview' ? 'flex' : 'hidden md:flex'
        }`}>
          {/* Framed Studio Canvas Card (inspired by Builder .preview-pane) */}
          <div className="flex-1 flex flex-col overflow-hidden relative bg-[var(--surface-card)] border border-[var(--border-default)] rounded-xl shadow-xs">
            {/* Control Bar for Canvas (StudioPreviewToolbar) */}
            <StudioPreviewToolbar
              activeTab={activeTab}
              onChangeTab={setActiveTab}
              viewportDevice={deviceMode === 'responsive' ? 'desktop' : deviceMode}
              onChangeViewportDevice={(dev) => setDeviceMode(dev === 'desktop' ? 'responsive' : dev)}
              onRefreshPreview={() => setIframeKey(prev => prev + 1)}
              isInspectMode={isInspectMode}
              onToggleInspectMode={() => setIsInspectMode(prev => !prev)}
              onPopOutPreview={handleOpenInNewTab}
              isChatCollapsed={isChatCollapsed}
              onToggleChatCollapsed={() => setIsChatCollapsed(prev => !prev)}
              hasUnsavedCode={hasUnsavedChanges}
              issuesCount={combinedIssues.filter(i => !i.resolved).length}
              isIssuesOpen={isIssuesPanelOpen}
              onToggleIssues={() => setIsIssuesPanelOpen(prev => !prev)}
              versionsCount={workspaceSnapshots.length}
              isVersionsOpen={isVersionsPanelOpen}
              onToggleVersions={() => setIsVersionsPanelOpen(prev => !prev)}
              language={language === 'en' ? 'en' : 'ar'}
            />

            {/* View Content: Preview vs Code */}
            <div className="flex-1 relative overflow-hidden w-full min-h-0">
              {/* Live Preview Panel */}
              <div className={`absolute inset-0 w-full h-full overflow-hidden ${activeTab !== 'preview' ? 'hidden' : 'block'}`}>
                <StudioPreviewPanel
                  key={iframeKey}
                  iframeSrcDoc={previewSrcDoc}
                  viewportDevice={deviceMode === 'responsive' ? 'desktop' : deviceMode}
                  isInspectMode={isInspectMode}
                  onInspectElementCaptured={(target) => {
                    setEditTarget(target);
                    setIsInspectMode(false);
                    setSideNavActiveTab('chat');
                    setMobileActiveTab('chat');
                    toast.success(
                      language === 'ar'
                        ? `تم تحديد العنصر <${target.tag.toLowerCase()}> للتعديل`
                        : `Selected <${target.tag.toLowerCase()}> for editing`
                    );
                  }}
                  isUpdating={isGenerating}
                  errorMsg={runtimeError?.message || null}
                  onAutoFixError={(errMsg) => {
                    handleSendPrompt(language === 'ar' ? `إصلاح الخطأ: "${errMsg}"` : `Fix error: "${errMsg}"`);
                    setRuntimeError(null);
                  }}
                  onReload={() => setIframeKey(prev => prev + 1)}
                  language={language === 'en' ? 'en' : 'ar'}
                />
              </div>

              {/* Code Editor Panel */}
              <div className={`absolute inset-0 w-full h-full overflow-hidden ${activeTab !== 'code' ? 'hidden' : 'flex'}`}>
                <StudioCodeWorkspace
                  files={files}
                  activeFilePath={activeFilePath}
                  openTabs={openTabs}
                  onSelectFile={openFile}
                  onCloseTab={closeTab}
                  onUpdateFileContent={(path, content) => {
                    setFiles(prev => ({
                      ...prev,
                      [path]: { ...prev[path], content }
                    }));
                  }}
                  onCreateNewFile={() => setIsNewFileModalOpen(true)}
                  onDeleteFile={(path) => setFileToDelete(path)}
                  onRenameFile={(path) => {
                    setFileToRename(path);
                    setNewFilePathRename(path);
                  }}
                  onSaveFile={() => handleSaveChanges()}
                  onRevertFile={() => handleUndoChanges()}
                  unsavedFiles={unsavedFilesMap}
                  language={language === 'en' ? 'en' : 'ar'}
                />
              </div>
            </div>
            {/* Terminal Drawer (Bottom Docked) */}
            <AnimatePresence>
              {isTerminalOpen && (
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="absolute bottom-0 inset-x-0 h-64 bg-[var(--surface-card)] border-t border-[var(--border-default)] shadow-2xl z-40 flex flex-col"
                >
                  <div className="h-9 px-4 bg-[var(--surface-subtle)] border-b border-[var(--border-default)] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <Terminal size={14} className="text-amber-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-primary)]">
                        {language === 'ar' ? 'نافذة الأوامر (الطرفية)' : 'Terminal'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setTerminalLogs([])}
                        className="p-1 hover:bg-[var(--surface-card)] rounded-shape-xs text-[var(--text-muted)] hover:text-rose-500 transition-colors cursor-pointer"
                        title={language === 'ar' ? 'مسح السجل' : 'Clear'}
                      >
                        <Trash2 size={13} />
                      </button>
                      <button
                        onClick={() => setIsTerminalOpen(false)}
                        className="p-1 hover:bg-[var(--surface-card)] rounded-shape-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] space-y-1 bg-slate-950 text-slate-300 selection:bg-blue-500/30">
                    {terminalLogs.map((log, i) => (
                      <div key={i} className="flex gap-2 leading-relaxed">
                        <span className="text-[var(--text-muted)] shrink-0 opacity-50">[{log.time}]</span>
                        <span className={
                          log.type === 'error' ? 'text-rose-400' : 
                          log.type === 'success' ? 'text-[var(--fg-success)]' : 
                          'text-slate-300'
                        }>
                          {log.text}
                        </span>
                      </div>
                    ))}
                    <div className="h-4" />
                  </div>

                  <form 
                    onSubmit={handleTerminalCommand}
                    className="h-9 bg-slate-900 border-t border-white/5 flex items-center px-3 gap-2"
                  >
                    <span className="text-accent font-bold">$</span>
                    <input 
                      type="text"
                      value={terminalInput}
                      onChange={(e) => setTerminalInput(e.target.value)}
                      placeholder={language === 'ar' ? 'اكتب أمراً هنا...' : 'Type a command...'}
                      className="flex-1 bg-transparent border-0 outline-none text-slate-200 text-xs font-mono"
                    />
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Database Modal */}
      <AnimatePresence>
        {isDbModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsDbModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-shape-lg w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--surface-subtle)]">
                <div className="flex items-center gap-2.5">
                  <Database size={18} className="text-[var(--fg-success)]" />
                  <div>
                    <h2 className="text-sm font-bold text-[var(--text-primary)]">{language === 'ar' ? 'إدارة قاعدة البيانات' : 'Database Manager'}</h2>
                    <p className="text-[11px] text-[var(--text-muted)]">{language === 'ar' ? 'إدارة الجداول واستعراض السجلات وتنفيذ الاستعلامات' : 'Manage tables, inspect records, and execute queries'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDbModalOpen(false)}
                  className="h-8 w-8 flex items-center justify-center rounded-shape-sm hover:bg-[var(--surface-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 flex overflow-hidden">
                {/* Tables List */}
                <div className="w-56 border-e border-[var(--border-default)] p-3 space-y-2 bg-[var(--surface-subtle)] overflow-y-auto shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{language === 'ar' ? 'الجداول المتوفرة' : 'Tables'}</span>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">({sqlTables.length})</span>
                  </div>
                  <div className="space-y-1">
                    {sqlTables.map(tbl => (
                      <button
                        key={tbl}
                        onClick={() => {
                          setSelectedTable(tbl);
                          setQueryResult(null);
                        }}
                        className={`w-full text-start px-2.5 h-8 rounded-shape-sm text-xs font-mono font-medium transition-all cursor-pointer flex items-center justify-between ${
                          selectedTable === tbl 
                            ? 'bg-[var(--bg-accent-muted)] text-accent border border-[var(--border-accent)]/40 shadow-2xs font-bold' 
                            : 'text-[var(--text-secondary)] hover:bg-[var(--surface-card)]'
                        }`}
                      >
                        <span className="truncate">{tbl}</span>
                        <ChevronLeft size={13} className={language === 'ar' ? '' : 'rotate-180'} />
                      </button>
                    ))}

                    {sqlTables.length === 0 && (
                      <div className="p-3 text-center space-y-2">
                        <p className="text-[11px] text-[var(--text-muted)] leading-tight">
                          {language === 'ar' ? 'لا توجد جداول منشأة بعد في قاعدة البيانات.' : 'No tables created yet.'}
                        </p>
                        <button
                          onClick={() => {
                            if (sqlDb) {
                              const seedSql = `
                                CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT, email TEXT, role TEXT);
                                INSERT INTO users VALUES (1, 'أحمد محمود', 'ahmed@perplexta.ai', 'admin'), (2, 'سارة خليل', 'sara@perplexta.ai', 'developer');
                                CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY, title TEXT, price REAL, stock INTEGER);
                                INSERT INTO products VALUES (1, 'Perplexta Pro License', 49.99, 100), (2, 'AI Cloud Compute Token', 19.99, 500);
                              `;
                              sqlDb.run(seedSql);
                              refreshTables(sqlDb);
                              setSelectedTable('products');
                              addLog('success', language === 'ar' ? 'تم إنشاء جداول تجريبية (users, products) بنجاح' : 'Created sample tables (users, products) successfully');
                              toast.success(language === 'ar' ? 'تم إنشاء الجداول التجريبية بنجاح!' : 'Created sample tables successfully!');
                            }
                          }}
                          className="w-full h-8 px-2 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] text-[10px] font-semibold hover:opacity-90 transition-all cursor-pointer shadow-2xs flex items-center justify-center"
                        >
                          {language === 'ar' ? '+ إنشاء جداول تجريبية' : '+ Create Sample Tables'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Table Data Grid & Query Editor */}
                <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-4">
                  {/* SQL Query Editor */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-[var(--text-secondary)]">{language === 'ar' ? 'محرر الاستعلامات' : 'SQL Query Editor'}</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={sqlCustomQuery}
                        onChange={(e) => setSqlCustomQuery(e.target.value)}
                        className="flex-1 h-8 px-2.5 bg-[var(--surface-subtle)] border border-[var(--border-default)] rounded-shape-sm font-mono text-xs text-[var(--text-primary)] outline-none focus:border-accent"
                        placeholder="SELECT * FROM products;"
                      />
                      <button
                        onClick={runCustomSqlQuery}
                        className="h-8 px-3.5 bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] text-xs font-semibold rounded-shape-sm hover:opacity-90 transition cursor-pointer shadow-2xs flex items-center justify-center"
                      >
                        {language === 'ar' ? 'تنفيذ' : 'Run'}
                      </button>
                    </div>
                  </div>

                  {/* Query feedback if present */}
                  {queryResult && (
                    <div className={`p-2.5 rounded-shape-sm text-xs font-mono border ${
                      queryResult.error
                        ? 'bg-red-500/10 text-red-500 border-red-500/30'
                        : 'bg-[var(--bg-success-muted)] text-[var(--fg-success)] border-[color-mix(in_srgb,var(--fg-success)_30%,transparent)]'
                    }`}>
                      {queryResult.error ? (language === 'ar' ? `خطأ: ${queryResult.error}` : `Error: ${queryResult.error}`) : (queryResult.message || (language === 'ar' ? `تم استرجاع ${queryResult.values?.length || 0} سجل` : `Retrieved ${queryResult.values?.length || 0} rows`))}
                    </div>
                  )}

                  {/* Results / Data Grid */}
                  <div className="flex-1 flex flex-col space-y-2 overflow-hidden">
                    <span className="text-xs font-bold text-[var(--text-secondary)]">
                      {queryResult?.columns 
                        ? (language === 'ar' ? 'نتائج الاستعلام:' : 'Query Results:') 
                        : (language === 'ar' ? `بيانات الجدول: ${selectedTable || '—'}` : `Table Data: ${selectedTable || '—'}`)}
                    </span>
                    <div className="flex-1 overflow-auto rounded-shape-sm border border-[var(--border-default)] bg-[var(--surface-subtle)]">
                      {(queryResult?.columns || tableColumns).length > 0 ? (
                        <table className="w-full text-start text-xs font-mono">
                          <thead className="bg-[var(--surface-card)] border-b border-[var(--border-default)] sticky top-0">
                            <tr>
                              {(queryResult?.columns || tableColumns).map((col: string) => (
                                <th key={col} className="px-3 py-2.5 font-bold text-[var(--text-primary)]">{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--border-default)]">
                            {(queryResult?.values || tableDataRows).map((row: any, rIdx: number) => (
                              <tr key={rIdx} className="hover:bg-[var(--surface-card)]/50 transition-colors">
                                {row.map((cell: any, cIdx: number) => (
                                  <td key={cIdx} className="px-3 py-2 text-[var(--text-secondary)]">{String(cell)}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="p-8 text-center text-xs text-[var(--text-muted)] space-y-2">
                          <p>{language === 'ar' ? 'لا توجد بيانات متاحة في هذا الجدول.' : 'No data available in this table.'}</p>
                          <p className="text-[11px] text-[var(--text-muted)]">
                            {language === 'ar' ? 'يمكنك تشغيل استعلام لإدراج أو تعديل البيانات.' : 'Execute a query to insert or inspect data.'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Environment Variables Modal */}
      <AnimatePresence>
        {isEnvModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setIsEnvModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                <div className="flex items-center gap-2">
                  <Key size={18} className="text-accent" />
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    {language === 'ar' ? 'متغيرات البيئة' : 'Environment Variables'}
                  </h3>
                </div>
                <button onClick={() => setIsEnvModalOpen(false)} className="p-1 rounded-shape-xs hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2.5 max-h-60 overflow-y-auto">
                {Object.keys(envVars).map(key => (
                  <div key={key} className="flex items-center justify-between p-2.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs font-mono">
                    <div>
                      <span className="font-bold text-accent">{key}</span>
                      <p className="text-[10px] text-[var(--text-muted)] truncate max-w-[220px]">{envVars[key]}</p>
                    </div>
                    <button
                      onClick={() => {
                        const updated = { ...envVars };
                        delete updated[key];
                        setEnvVars(updated);
                        setIframeKey(prev => prev + 1);
                        saveProjectToDb(projectId, projectName, files, updated);
                        toast.info(language === 'ar' ? `تم حذف ${key}` : `Removed ${key}`);
                      }}
                      className="p-1 text-[var(--text-muted)] hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-[var(--border-default)] space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="KEY (e.g. VITE_KEY)"
                    value={newEnvKey}
                    onChange={(e) => setNewEnvKey(e.target.value.toUpperCase())}
                    className="h-8 px-2.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] font-mono outline-none focus:border-accent"
                  />
                  <input
                    type="text"
                    placeholder="VALUE"
                    value={newEnvVal}
                    onChange={(e) => setNewEnvVal(e.target.value)}
                    className="h-8 px-2.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] font-mono outline-none focus:border-accent"
                  />
                </div>
                <button
                  onClick={() => {
                    if (newEnvKey.trim()) {
                      const updated = { ...envVars, [newEnvKey.trim()]: newEnvVal.trim() };
                      setEnvVars(updated);
                      setNewEnvKey('');
                      setNewEnvVal('');
                      setIframeKey(prev => prev + 1);
                      saveProjectToDb(projectId, projectName, files, updated);
                      toast.success(language === 'ar' ? 'تم حفظ وحقن متغير البيئة بنجاح!' : 'Saved and injected environment variable!');
                    }
                  }}
                  className="w-full h-8 bg-accent hover:opacity-90 text-[var(--comp-button-primary-fg)] rounded-shape-sm text-xs font-semibold cursor-pointer transition-colors shadow-2xs flex items-center justify-center"
                >
                  {language === 'ar' ? 'إضافة وحقن متغيّر البيئة' : 'Add & Inject Variable'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>



      {/* Cloud Project Deletion Confirmation Modal with Name Typing Verification */}
      <AnimatePresence>
        {projectToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => {
              if (!isDeletingProject) {
                setProjectToDelete(null);
                setDeleteConfirmText('');
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-shape-md bg-[var(--surface-card)] border border-rose-500/40 shadow-2xl p-5 space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-shape-sm bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0">
                  <AlertTriangle size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    {language === 'ar' ? 'تأكيد حذف المشروع السحابي نهائياً' : 'Permanently Delete Cloud Project'}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                    {language === 'ar'
                      ? 'هذا الإجراء سيقوم بحذف المشروع وكافة ملفاته وسجل المحادثة المرتبط به نهائياً من قاعدة البيانات ولا يمكن التراجع عنه.'
                      : 'This will permanently delete this project and all its files from the cloud database. This action cannot be undone.'}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-shape-sm bg-rose-500/5 border border-rose-500/20 space-y-2">
                <label className="text-[11px] font-bold text-[var(--text-secondary)] block">
                  {language === 'ar' ? 'لتأكيد الحذف، اكتب اسم المشروع أدناه:' : 'To confirm deletion, type the project name below:'}
                </label>
                <div className="p-1.5 px-2 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)] font-mono text-xs font-bold text-rose-400 select-all">
                  {projectToDelete.title}
                </div>
                <input
                  type="text"
                  autoFocus
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={projectToDelete.title}
                  className="w-full h-8 px-2.5 bg-[var(--surface-subtle)] border border-[var(--border-default)] rounded-shape-sm text-xs font-mono text-[var(--text-primary)] outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  disabled={isDeletingProject}
                  onClick={() => {
                    setProjectToDelete(null);
                    setDeleteConfirmText('');
                  }}
                  className="h-8 px-3.5 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-secondary)] cursor-pointer transition-colors"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={deleteConfirmText.trim() !== projectToDelete.title.trim() || isDeletingProject}
                  onClick={executeDeleteWorkspace}
                  className="h-8 px-4 rounded-shape-sm bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold cursor-pointer transition-all shadow-2xs flex items-center gap-1.5"
                >
                  {isDeletingProject ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  <span>{language === 'ar' ? 'تأكيد الحذف النهائي' : 'Confirm Delete'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cloud Project Rename Modal */}
      <AnimatePresence>
        {projectToRename && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => {
              if (!isRenamingProject) {
                setProjectToRename(null);
                setRenameText('');
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] shadow-2xl p-5 space-y-4"
            >
              <div className="flex items-center gap-2.5 border-b border-[var(--border-default)] pb-3">
                <div className="w-8 h-8 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center justify-center text-accent">
                  <Edit2 size={15} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    {language === 'ar' ? 'تعديل اسم المشروع السحابي' : 'Rename Cloud Project'}
                  </h3>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    {language === 'ar' ? 'قم بتحديث عنوان المشروع المحفوظ في حسابك' : 'Update project title in your account'}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)]">
                  {language === 'ar' ? 'اسم المشروع الجديد:' : 'New Project Name:'}
                </label>
                <input
                  type="text"
                  autoFocus
                  value={renameText}
                  onChange={(e) => setRenameText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      executeRenameWorkspace();
                    }
                  }}
                  className="w-full h-8 px-2.5 bg-[var(--surface-subtle)] border border-[var(--border-default)] rounded-shape-sm text-xs text-[var(--text-primary)] outline-none focus:border-accent"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  disabled={isRenamingProject}
                  onClick={() => {
                    setProjectToRename(null);
                    setRenameText('');
                  }}
                  className="h-8 px-3.5 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-secondary)] cursor-pointer transition-colors"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={!renameText.trim() || isRenamingProject}
                  onClick={executeRenameWorkspace}
                  className="h-8 px-4 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] hover:opacity-90 disabled:opacity-40 text-xs font-bold cursor-pointer transition-all shadow-2xs flex items-center gap-1.5"
                >
                  {isRenamingProject ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  <span>{language === 'ar' ? 'حفظ الاسم' : 'Save Name'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Snapshot Restore Confirmation Modal */}
      <AnimatePresence>
        {snapshotToRestore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => {
              if (!isRestoringSnapshot) setSnapshotToRestore(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-shape-md bg-[var(--surface-card)] border border-accent/40 shadow-2xl p-5 space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-shape-sm bg-accent/10 border border-accent/30 flex items-center justify-center text-accent shrink-0">
                  <RotateCcw size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    {language === 'ar' ? 'تأكيد استعادة الإصدار المحفوظ' : 'Restore Version Snapshot'}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                    {language === 'ar'
                      ? `هل أنت متأكد من رغبتك في استعادة الإصدار "${snapshotToRestore.name}"؟ سيتم استبدال محتويات الملفات الحالية في المحرر بملفات هذا الإصدار.`
                      : `Are you sure you want to restore snapshot "${snapshotToRestore.name}"? Current workspace files will be replaced with this version.`}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  disabled={isRestoringSnapshot}
                  onClick={() => setSnapshotToRestore(null)}
                  className="h-8 px-3.5 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-secondary)] cursor-pointer transition-colors"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={isRestoringSnapshot}
                  onClick={executeRestoreSnapshot}
                  className="h-8 px-4 rounded-shape-sm bg-accent text-[var(--comp-button-primary-fg)] hover:opacity-90 disabled:opacity-40 text-xs font-bold cursor-pointer transition-all shadow-2xs flex items-center gap-1.5"
                >
                  {isRestoringSnapshot ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
                  <span>{language === 'ar' ? 'تأكيد الاستعادة' : 'Confirm Restore'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Delete Confirmation Modal */}
      <AnimatePresence>
        {fileToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setFileToDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-shape-md bg-[var(--surface-card)] border border-rose-500/30 shadow-2xl p-5 space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-shape-sm bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0">
                  <Trash2 size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    {language === 'ar' ? 'حذف ملف من المشروع' : 'Delete File'}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1 font-mono break-all">
                    {fileToDelete}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={() => setFileToDelete(null)}
                  className="h-8 px-3 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-secondary)] cursor-pointer transition-colors"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={executeDeleteFile}
                  className="h-8 px-3.5 rounded-shape-sm bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer transition-all shadow-2xs"
                >
                  {language === 'ar' ? 'حذف' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New File Creation Modal */}
      <AnimatePresence>
        {isNewFileModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsNewFileModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] shadow-2xl p-5 space-y-4"
            >
              <div className="flex items-center gap-2.5 border-b border-[var(--border-default)] pb-3">
                <div className="w-8 h-8 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center justify-center text-accent">
                  <Plus size={15} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    {language === 'ar' ? 'إنشاء ملف جديد في المشروع' : 'Create New Project File'}
                  </h3>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    {language === 'ar' ? 'حدد مسار واسم الملف مع الامتداد المناسب' : 'Specify the file path with valid extension'}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)]">
                  {language === 'ar' ? 'مسار الملف (مثال: src/components/Card.jsx):' : 'File Path (e.g. src/components/Card.jsx):'}
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="src/components/Header.jsx"
                  value={newFilePathInput}
                  onChange={(e) => setNewFilePathInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newFilePathInput.trim()) {
                      e.preventDefault();
                      const path = newFilePathInput.trim();
                      const createdFile: ProjectFile = { name: path.split('/').pop() || path, path, type: path.split('.').pop() || 'txt', content: '// كود جديد\n' };
                      const nextFiles = { ...files, [path]: createdFile };
                      setFiles(nextFiles);
                      setSavedFiles(prev => ({ ...prev, [path]: createdFile }));
                      openFile(path);
                      saveProjectToDb(projectId, projectName, nextFiles);
                      addLog('success', `تم إنشاء الملف: ${path}`);
                      setIsNewFileModalOpen(false);
                      setNewFilePathInput('');
                      toast.success(language === 'ar' ? `تم إنشاء ${path}` : `Created ${path}`);
                    }
                  }}
                  className="w-full h-8 px-2.5 bg-[var(--surface-subtle)] border border-[var(--border-default)] rounded-shape-sm text-xs font-mono text-[var(--text-primary)] outline-none focus:border-accent"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={() => setIsNewFileModalOpen(false)}
                  className="h-8 px-3.5 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-secondary)] cursor-pointer transition-colors"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={!newFilePathInput.trim()}
                  onClick={() => {
                    const path = newFilePathInput.trim();
                    if (!path) return;
                    const createdFile: ProjectFile = { name: path.split('/').pop() || path, path, type: path.split('.').pop() || 'txt', content: '// كود جديد\n' };
                    const nextFiles = { ...files, [path]: createdFile };
                    setFiles(nextFiles);
                    setSavedFiles(prev => ({ ...prev, [path]: createdFile }));
                    openFile(path);
                    saveProjectToDb(projectId, projectName, nextFiles);
                    addLog('success', `تم إنشاء الملف: ${path}`);
                    setIsNewFileModalOpen(false);
                    setNewFilePathInput('');
                    toast.success(language === 'ar' ? `تم إنشاء ${path}` : `Created ${path}`);
                  }}
                  className="h-8 px-4 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] hover:opacity-90 disabled:opacity-40 text-xs font-bold cursor-pointer transition-all shadow-2xs flex items-center gap-1.5"
                >
                  <Plus size={13} />
                  <span>{language === 'ar' ? 'إنشاء الملف' : 'Create File'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Rename Modal */}
      <AnimatePresence>
        {fileToRename && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setFileToRename(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] shadow-2xl p-5 space-y-4"
            >
              <div className="flex items-center gap-2.5 border-b border-[var(--border-default)] pb-3">
                <div className="w-8 h-8 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center justify-center text-accent">
                  <Edit2 size={15} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    {language === 'ar' ? 'إعادة تسمية الملف' : 'Rename File'}
                  </h3>
                  <p className="text-[10px] text-[var(--text-muted)] font-mono">
                    {fileToRename}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)]">
                  {language === 'ar' ? 'المسار الجديد:' : 'New Path:'}
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newFilePathRename}
                  onChange={(e) => setNewFilePathRename(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newFilePathRename.trim() && newFilePathRename.trim() !== fileToRename) {
                      e.preventDefault();
                      const trimmed = newFilePathRename.trim();
                      const oldPath = fileToRename;
                      const fileData = files[oldPath];
                      const renamedFile: ProjectFile = {
                        ...fileData,
                        name: trimmed.split('/').pop() || trimmed,
                        path: trimmed,
                        type: trimmed.split('.').pop() || 'txt'
                      };
                      const nextFiles = { ...files };
                      delete nextFiles[oldPath];
                      nextFiles[trimmed] = renamedFile;
                      setFiles(nextFiles);
                      setSavedFiles(prev => {
                        const next = { ...prev };
                        delete next[oldPath];
                        next[trimmed] = renamedFile;
                        return next;
                      });
                      setOpenTabs(prev => prev.map(t => (t === oldPath ? trimmed : t)));
                      if (activeFilePath === oldPath) {
                        setActiveFilePath(trimmed);
                      }
                      saveProjectToDb(projectId, projectName, nextFiles);
                      addLog('log', `تم تغيير اسم الملف من ${oldPath} إلى ${trimmed}`);
                      setFileToRename(null);
                      toast.success(language === 'ar' ? 'تمت إعادة التسمية بنجاح' : 'Renamed successfully');
                    }
                  }}
                  className="w-full h-8 px-2.5 bg-[var(--surface-subtle)] border border-[var(--border-default)] rounded-shape-sm text-xs font-mono text-[var(--text-primary)] outline-none focus:border-accent"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={() => setFileToRename(null)}
                  className="h-8 px-3.5 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-secondary)] cursor-pointer transition-colors"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={!newFilePathRename.trim() || newFilePathRename.trim() === fileToRename}
                  onClick={() => {
                    const trimmed = newFilePathRename.trim();
                    const oldPath = fileToRename;
                    if (!trimmed || trimmed === oldPath) return;
                    const fileData = files[oldPath];
                    const renamedFile: ProjectFile = {
                      ...fileData,
                      name: trimmed.split('/').pop() || trimmed,
                      path: trimmed,
                      type: trimmed.split('.').pop() || 'txt'
                    };
                    const nextFiles = { ...files };
                    delete nextFiles[oldPath];
                    nextFiles[trimmed] = renamedFile;
                    setFiles(nextFiles);
                    setSavedFiles(prev => {
                      const next = { ...prev };
                      delete next[oldPath];
                      next[trimmed] = renamedFile;
                      return next;
                    });
                    setOpenTabs(prev => prev.map(t => (t === oldPath ? trimmed : t)));
                    if (activeFilePath === oldPath) {
                      setActiveFilePath(trimmed);
                    }
                    saveProjectToDb(projectId, projectName, nextFiles);
                    addLog('log', `تم تغيير اسم الملف من ${oldPath} إلى ${trimmed}`);
                    setFileToRename(null);
                    toast.success(language === 'ar' ? 'تمت إعادة التسمية بنجاح' : 'Renamed successfully');
                  }}
                  className="h-8 px-4 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] hover:opacity-90 disabled:opacity-40 text-xs font-bold cursor-pointer transition-all shadow-2xs flex items-center gap-1.5"
                >
                  <Check size={13} />
                  <span>{language === 'ar' ? 'تحديث الاسم' : 'Update'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <StudioProjectDrawer
        isOpen={isProjectDrawerOpen}
        onClose={() => setIsProjectDrawerOpen(false)}
        projects={userWorkspaces.map(ws => ({
          id: ws.id,
          name: ws.title,
          updatedAt: new Date(ws.updated_at).toLocaleDateString(),
          filesCount: ws.files ? Object.keys(ws.files).length : undefined
        }))}
        activeProjectId={projectId}
        onSelectProject={(id) => {
          const targetWs = userWorkspaces.find(w => w.id === id);
          if (targetWs) {
            handleSwitchWorkspace(targetWs);
          }
        }}
        onCreateNewProject={handleCreateNewProject}
        onDeleteProject={(id, name) => handleDeleteWorkspacePrompt(id, name)}
        onRenameProject={(id, name) => handleRenameWorkspacePrompt(id, name)}
        language={language === 'en' ? 'en' : 'ar'}
      />

      <StudioVersionsPanel
        isOpen={isVersionsPanelOpen}
        onClose={() => setIsVersionsPanelOpen(false)}
        snapshots={workspaceSnapshots.map(s => ({
          id: String(s.id),
          timestamp: new Date(s.created_at).toLocaleString(),
          label: s.version_name,
          filesCount: Object.keys(files).length
        }))}
        onRestoreSnapshot={(snapId) => {
          const target = workspaceSnapshots.find(s => String(s.id) === String(snapId));
          if (target) {
            handleRestoreSnapshot(target.id, target.version_name);
          }
        }}
        onCreateSnapshot={(label) => {
          setNewSnapshotName(label);
          handleCreateSnapshot(label);
        }}
        language={language === 'en' ? 'en' : 'ar'}
      />

      <StudioIssuesPanel
        isOpen={isIssuesPanelOpen}
        onClose={() => setIsIssuesPanelOpen(false)}
        issues={combinedIssues}
        onTriggerAiFix={(issueMsg) => {
          if (issueMsg) {
            handleSendPrompt(language === 'ar' ? `الرجاء إصلاح المشكلة التالية:\n${issueMsg}` : `Please fix the following issue:\n${issueMsg}`);
            setRuntimeError(null);
          } else {
            handleAiFix();
          }
        }}
        onAddUserIssue={(msg) => {
          setUserIssues(prev => [
            ...prev,
            {
              id: `usr_iss_${Date.now()}`,
              message: msg,
              type: 'user',
              resolved: false
            }
          ]);
        }}
        onToggleResolveIssue={(id) => {
          if (id === 'runtime_err_active') {
            setRuntimeError(null);
            return;
          }
          setUserIssues(prev => prev.map(i => (i.id === id ? { ...i, resolved: !i.resolved } : i)));
        }}
        onClearResolved={() => {
          setUserIssues(prev => prev.filter(i => !i.resolved));
        }}
        language={language === 'en' ? 'en' : 'ar'}
      />

      <StudioPublishPopover
        isOpen={isPublishPopoverOpen}
        onClose={() => setIsPublishPopoverOpen(false)}
        projectName={projectName}
        isPublished={isPublished}
        hasUnpublishedChanges={hasUnsavedChanges}
        onTogglePublishStatus={() => {
          const next = !isPublished;
          setIsPublished(next);
          if (next) {
            saveProjectToDb(projectId, projectName, files);
            toast.success(language === 'ar' ? 'تم نشر التطبيق على الرابط المباشر بنجاح!' : 'Application published live!');
          } else {
            toast.info(language === 'ar' ? 'تم إلغاء نشر التطبيق' : 'Application unpublished');
          }
        }}
        onUpdatePublished={() => {
          handleSaveChanges();
          toast.success(language === 'ar' ? 'تم تحديث النسخة المنشورة بنجاح!' : 'Published version updated!');
        }}
        language={language === 'en' ? 'en' : 'ar'}
      />

      <TemplatesHub
        isOpen={isTemplatesHubOpen}
        onClose={() => setIsTemplatesHubOpen(false)}
        language={language === 'en' ? 'en' : 'ar'}
        selectedTemplate={selectedStudioTemplate}
        onSelectTemplate={setSelectedStudioTemplate}
        onUseTemplate={handleLoadStudioTemplate}
      />
    </div>
  );
};
export default AppStudioPage;
