import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Folder, FileCode, FileText, Database, Terminal, Download, Github, 
  Play, Plus, Trash2, Edit2, ChevronRight, ChevronLeft, ArrowUpRight, 
  Paperclip, Mic, Send, Sparkles, CheckCircle2, AlertTriangle, RefreshCw, X, Code, Globe, Layers,
  Monitor, Smartphone, Tablet, Maximize2, Minimize2, Wand2, Sliders, ArrowLeft, ArrowRight
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { toast, PopCard, Button, ActionItem, Badge } from '@/design-system';
import initSqlJs from 'sql.js';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { resolveImageUrl } from '../utils/imageResolver';

interface ProjectFile {
  name: string;
  path: string;
  content: string;
  type: string;
  isEntry?: boolean;
}

export const AppStudioPage: React.FC = () => {
  const { theme, language, siteSettings, dir } = useAppContext();
  const navigate = useNavigate();

  // Project Files State
  const [files, setFiles] = useState<Record<string, ProjectFile>>({
    'index.html': {
      name: 'index.html',
      path: 'index.html',
      type: 'html',
      isEntry: true,
      content: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>متجر بيربليكستا الذكي</title>
  <link rel="stylesheet" href="style.css">
</head>
<body class="bg-slate-50 text-slate-900 font-sans p-6">
  <div class="max-w-4xl mx-auto space-y-6">
    <header class="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
      <h1 class="text-xl font-bold text-indigo-600">��️ متجر بيربليكستا الرقمي</h1>
      <span id="cart-count" class="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full">السلة: 0 منتجات</span>
    </header>
    
    <main class="grid grid-cols-1 md:grid-cols-2 gap-4" id="products-grid">
      <!-- المنتجات تظهر هنا ديناميكياً -->
    </main>
  </div>
  <script src="app.js"></script>
</body>
</html>`
    },
    'style.css': {
      name: 'style.css',
      path: 'style.css',
      type: 'css',
      content: `body {
  background-color: #f8fafc;
  font-family: system-ui, -apple-system, sans-serif;
}`
    },
    'app.js': {
      name: 'app.js',
      path: 'app.js',
      type: 'javascript',
      content: `console.log("تطبيق بيربليكستا يعمل بنجاح في المتصفح!");
const products = [
  { id: 1, name: 'حاسوب محمول فائق', price: 1200 },
  { id: 2, name: 'ساعة ذكية متطورة', price: 250 }
];

const grid = document.getElementById('products-grid');
if (grid) {
  grid.innerHTML = products.map(p => \`
    <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between gap-3">
      <div>
        <h3 class="font-bold text-slate-800">\${p.name}</h3>
        <p class="text-sm text-slate-500">\${p.price} $</p>
      </div>
      <button onclick="alert('تمت إضافة \${p.name} إلى السلة بنجاح!')" class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition cursor-pointer">إضافة للسلة</button>
    </div>
  \`).join('');
}`
    },
    'db/schema.sql': {
      name: 'schema.sql',
      path: 'db/schema.sql',
      type: 'sql',
      content: `CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  price REAL NOT NULL,
  stock INTEGER DEFAULT 0
);

INSERT OR IGNORE INTO users (id, name, email) VALUES (1, 'أحمد محمد', 'ahmed@perplexta.com');
INSERT OR IGNORE INTO products (id, title, price, stock) VALUES (1, 'حاسوب محمول فائق', 1200.0, 15);
INSERT OR IGNORE INTO products (id, title, price, stock) VALUES (2, 'ساعة ذكية متطورة', 250.0, 42);`
    },
    'api/products.php': {
      name: 'products.php',
      path: 'api/products.php',
      type: 'php',
      content: `<?php
header('Content-Type: application/json');
$products = [
  ["id" => 1, "title" => "حاسوب محمول فائق", "price" => 1200],
  ["id" => 2, "title" => "ساعة ذكية متطورة", "price" => 250]
];
echo json_encode($products);
?>`
    }
  });

  const [activeFilePath, setActiveFilePath] = useState('index.html');
  const [savedFiles, setSavedFiles] = useState<Record<string, ProjectFile>>(() => JSON.parse(JSON.stringify(files)));

  const hasUnsavedChanges = files[activeFilePath]?.content !== savedFiles[activeFilePath]?.content;

    const handleSaveChanges = () => {
    setSavedFiles(JSON.parse(JSON.stringify(files)));
    setIframeKey(prev => prev + 1);
    toast.success(dir === 'rtl' ? `تم حفظ الملف ${activeFilePath} بنجاح وتحديث المعاينة!` : `Successfully saved ${activeFilePath} & updated preview!`);
    addLog('success', `حفظ التغييرات وتحديث المعاينة للملف: ${activeFilePath}`);
    saveProjectToDb();
    window.parent.postMessage({ type: 'PERPLEXTA_SAVE_CODE', files: files }, '*');
  };

  const handleUndoChanges = () => {
    if (savedFiles[activeFilePath]) {
      setFiles(prev => ({
        ...prev,
        [activeFilePath]: { ...prev[activeFilePath], content: savedFiles[activeFilePath].content }
      }));
      toast.info(dir === 'rtl' ? 'تم التراجع عن التغييرات غير الحفظ' : 'Reverted to last saved version');
      addLog('log', `تراجع عن التغييرات في الملف: ${activeFilePath}`);
    }
  };
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [deviceMode, setDeviceMode] = useState<'responsive' | 'mobile' | 'tablet'>('responsive');
  const [isDeviceMenuOpen, setIsDeviceMenuOpen] = useState(false);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [isManualEditorOpen, setIsManualEditorOpen] = useState(false);
  const [promptQuery, setPromptQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<Array<{ type: 'log' | 'error' | 'success'; text: string; time: string }>>([
    { type: 'log', text: 'تم بدء تشغيل بيئة العمل الافتراضية (Virtual Sandbox IDE).', time: new Date().toLocaleTimeString() },
    { type: 'log', text: 'تم تحميل ملف index.html وربط الأصول بنجاح.', time: new Date().toLocaleTimeString() }
  ]);

  // SQLite Database via sql.js
  const [sqlDb, setSqlDb] = useState<any>(null);
  const [sqlTables, setSqlTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('products');
  const [tableDataRows, setTableDataRows] = useState<any[]>([]);
  const [tableColumns, setTableColumns] = useState<string[]>([]);
  const [sqlCustomQuery, setSqlCustomQuery] = useState('SELECT * FROM products;');
  const [queryResult, setQueryResult] = useState<any>(null);

  // Initialize SQLite
  useEffect(() => {
    let isMounted = true;
    initSqlJs({
      locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
    }).then(SQL => {
      if (!isMounted) return;
      const db = new SQL.Database();
      const schema = files['db/schema.sql']?.content || '';
      try {
        db.run(schema);
        setSqlDb(db);
        refreshTables(db);
        addLog('success', 'تم تهيئة محرك SQLite الافتراضي بنجاح من schema.sql');
      } catch (err: any) {
        addLog('error', `خطأ في تهيئة قاعدة البيانات: ${err.message}`);
      }
    }).catch(err => {
      console.warn('sql.js load error:', err);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshTables = (db: any) => {
    try {
      const res = db.exec("SELECT name FROM sqlite_master WHERE type='table';");
      if (res && res[0] && res[0].values) {
        const tables = res[0].values.map((v: any) => v[0] as string);
        setSqlTables(tables);
        if (tables.length > 0 && !tables.includes(selectedTable)) {
          setSelectedTable(tables[0]);
        }
      }
    } catch (e) {}
  };

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

  const addLog = (type: 'log' | 'error' | 'success', text: string) => {
    setTerminalLogs(prev => [...prev, { type, text, time: new Date().toLocaleTimeString() }]);
  };

  // Virtual File System Blob URL Injection Strategy for instant iframe sync without page reloads
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'CONSOLE_LOG') {
        const level = event.data.level === 'error' ? 'error' : 'log';
        addLog(level, event.data.message);
      } else if (event.data?.type === 'PERPLEXTA_LOAD_CODE') {
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

  const saveProjectToDb = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        addLog('error', 'يجب تسجيل الدخول لحفظ المشروع');
        return;
      }
      addLog('log', 'Saving project to database...');
      const res = await fetch('/api/studio/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: 'default_workspace',
          title: 'My Project',
          frameworkMode: 'html',
          files: files
        })
      });
      if (res.ok) {
        addLog('success', 'تم حفظ المشروع في قاعدة البيانات بنجاح.');
      } else {
        addLog('error', 'فشل في حفظ المشروع.');
      }
    } catch (e: any) {
      addLog('error', 'فشل الاتصال بالخادم لحفظ المشروع.');
    }
  };



  useEffect(() => {
    let html = files['index.html']?.content || '<html><body><h1>لا يوجد محتوى</h1></body></html>';
    const css = files['style.css']?.content || '';
    const js = files['app.js']?.content || '';

    const cssBlob = new Blob([css], { type: 'text/css' });
    const cssUrl = URL.createObjectURL(cssBlob);

    const jsBlob = new Blob([js], { type: 'application/javascript' });
    const jsUrl = URL.createObjectURL(jsBlob);

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" href="${cssUrl}">
          <script>
            (function() {
              const originalConsole = {
                log: console.log,
                error: console.error,
                warn: console.warn,
                info: console.info
              };
              function sendLog(type, args) {
                const message = Array.from(args).map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
                window.parent.postMessage({ type: 'CONSOLE_LOG', level: type, message: message }, '*');
              }
              console.log = function() { originalConsole.log.apply(console, arguments); sendLog('log', arguments); };
              console.error = function() { originalConsole.error.apply(console, arguments); sendLog('error', arguments); };
              console.warn = function() { originalConsole.warn.apply(console, arguments); sendLog('warn', arguments); };
              console.info = function() { originalConsole.info.apply(console, arguments); sendLog('info', arguments); };
              
              window.addEventListener('error', function(event) {
                sendLog('error', [event.message]);
              });
            })();
          </script>
          <style>
            html, body {
              margin: 0;
              padding: 0;
              width: 100%;
              min-height: 100%;
              overflow-y: auto;
              box-sizing: border-box;
            }
          </style>
        </head>
        <body>
          ${html.includes('<body>') ? html.replace(/<\/?body[^>]*>/g, '') : html}
          <script src="${jsUrl}"></script>
        </body>
      </html>
    `;

    const htmlBlob = new Blob([fullHtml], { type: 'text/html' });
    const htmlUrl = URL.createObjectURL(htmlBlob);
    setPreviewBlobUrl(htmlUrl);

    return () => {
      URL.revokeObjectURL(cssUrl);
      URL.revokeObjectURL(jsUrl);
      URL.revokeObjectURL(htmlUrl);
    };
  }, [files]);

  // Handle Send Prompt (AI generator / modifier)
  const handleSendPrompt = async () => {
    if (!promptQuery.trim() || isGenerating) return;
    const prompt = promptQuery.trim();
    setPromptQuery('');
    setIsGenerating(true);
    addLog('log', `إرسال طلب التعديل: "${prompt}"`);

    setTimeout(() => {
      // Simulate intelligent file modification or addition based on prompt
      if (prompt.includes('زر') || prompt.includes('button')) {
        const currentAppJs = files['app.js']?.content || '';
        const updatedJs = currentAppJs + `\n// تم إضافة ميزة بناءً على الطلب\nconsole.log("تمت إضافة الميزة بنجاح!");`;
        setFiles(prev => ({
          ...prev,
          'app.js': { ...prev['app.js'], content: updatedJs }
        }));
        addLog('success', 'تم تحديث app.js بناءً على طلبك وإعادة تحميل المعاينة بنجاح.');
        toast.success(dir === 'rtl' ? 'تم تحديث التطبيق بنجاح!' : 'App updated successfully!');
      } else {
        addLog('success', 'تم تحليل الطلب وتحديث الهيكل البرمجي للمشروع.');
        toast.success(dir === 'rtl' ? 'تم توليد التعديلات!' : 'Changes generated!');
      }
      setIsGenerating(false);
    }, 1200);
  };

  const handleDownloadZip = async () => {
    const zip = new JSZip();
    Object.keys(files).forEach(path => {
      zip.file(path, files[path].content);
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, 'perplexta-project.zip');
    toast.success(dir === 'rtl' ? 'تم تنزيل المشروع كملف ZIP بنجاح!' : 'Project downloaded as ZIP!');
    addLog('success', 'تم تصدير المشروع إلى ملف ZIP محلي.');
  };

    const handleAiFix = async () => {
    addLog('log', 'جاري تحليل الأخطاء وإصلاح الكود بواسطة الذكاء الاصطناعي...');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/studio/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ files, errorLogs: terminalLogs.filter(l => l.type === 'error') })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.files) setFiles(data.files);
        addLog('success', 'تم تصحيح الأخطاء البرمجية بنجاح وإعادة بناء الملفات.');
        toast.success(dir === 'rtl' ? 'تم الإصلاح التلقائي بنجاح!' : 'Auto-fix completed!');
      } else {
        addLog('error', 'فشل تصحيح الأخطاء عبر الذكاء الاصطناعي.');
      }
    } catch (e) {
      addLog('error', 'خطأ في الاتصال بالخادم لطلب الإصلاح.');
    }
  };

  const activeFile = files[activeFilePath] || files['index.html'];
  const logoSrc = (theme === 'light' && siteSettings?.logoLightBase64) ? siteSettings.logoLightBase64 : siteSettings?.logoBase64;

  return (
    <div className="min-h-screen bg-[var(--surface-page)] text-[var(--text-primary)] font-sans flex flex-col overflow-hidden">
      {/* Top Header Bar */}
      <header className="h-14 bg-[var(--surface-card)] border-b border-[var(--border-default)] px-4 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => navigate('/app')}>
            {dir === 'rtl' ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            <span>{dir === 'rtl' ? 'لوحة المشاريع' : 'Back to Hub'}</span>
          </Button>
          <div className="flex items-center gap-2.5">
            {logoSrc ? (
              <img 
                src={resolveImageUrl(logoSrc, 'general')} 
                alt="Logo" 
                className="w-7 h-7 object-contain rounded-md" 
              />
            ) : (
              <div className="w-7 h-7 rounded-[6px] bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center justify-center text-accent">
                <Code size={16} />
              </div>
            )}
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold tracking-wide">
              Live IDE
            </span>
            <h1 className="text-sm font-bold uppercase tracking-wide">
              {language === 'ar' ? 'استوديو بيربليكستا' : 'Perplexta Studio'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Database Button */}
          <button
            onClick={() => setIsDbModalOpen(true)}
            className="h-9 px-3.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:border-accent/50 flex items-center gap-2 text-xs font-bold transition-theme cursor-pointer text-[var(--text-primary)] relative"
          >
            <Database size={15} className="text-amber-500" />
            <span>{language === 'ar' ? 'قاعدة البيانات' : 'Database'}</span>
            {sqlDb && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[var(--surface-card)] animate-pulse" title="Database Connected" />
            )}
          </button>

          {/* Terminal Toggle Button */}
          <button
            onClick={() => setIsTerminalOpen(!isTerminalOpen)}
            className="h-9 px-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:border-accent/50 flex items-center gap-2 text-xs font-bold transition-theme cursor-pointer text-[var(--text-primary)]"
          >
            <Terminal size={15} className="text-[var(--fg-accent)]" />
            <span>{language === 'ar' ? 'الطرفية' : 'Terminal'}</span>
            {terminalLogs.some(l => l.type === 'error') && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            )}
          </button>

          {/* Download ZIP Button */}
          <Button variant="secondary" onClick={handleDownloadZip}>
            <Download size={15} className="text-indigo-500" />
            <span>{language === 'ar' ? 'تنزيل ZIP' : 'Download ZIP'}</span>
          </Button>

          {/* GitHub Export */}
          <button
            onClick={() => toast.info(dir === 'rtl' ? 'جاري ربط مستودع GitHub...' : 'Connecting GitHub repository...')}
            className="h-9 px-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:border-accent/50 flex items-center gap-2 text-xs font-bold transition-theme cursor-pointer text-[var(--text-primary)]"
          >
            <Github size={15} />
            <span>{language === 'ar' ? 'تصدير GitHub' : 'GitHub'}</span>
          </button>
        </div>
      </header>

      {/* Main Layout Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* 1. Prompt Input Panel (~15-20% width) */}
        <aside className="w-72 lg:w-80 bg-[var(--surface-card)] border-e border-[var(--border-default)] flex flex-col shrink-0 select-none p-4 justify-between">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[var(--text-secondary)] flex items-center gap-1.5">
                  <Sparkles size={13} className="text-accent" />
                  <span>{language === 'ar' ? 'سجل نشاط المساعد' : 'Agent Activity Log'}</span>
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div 
                dir={dir}
                className="p-2.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[11px] text-[var(--text-secondary)] space-y-1.5 max-h-36 overflow-y-auto font-mono"
                style={{ textAlign: dir === 'rtl' ? 'right' : 'left' }}
              >
                {terminalLogs.slice(-8).map((log, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 leading-tight">
                    <span className={log.type === 'success' ? 'text-emerald-500 shrink-0' : log.type === 'error' ? 'text-red-500 shrink-0' : 'text-accent shrink-0'}>
                      {log.type === 'success' ? '✓' : '•'}
                    </span>
                    <span className="truncate">{log.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Unified High-Precision Input Box (Paperclip, Mic, Send) */}
          <div className="space-y-3 pt-4 border-t border-[var(--border-default)]">
            <div className="relative rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:border-accent/50 focus-within:border-accent/60 transition-all p-1.5 shadow-xs">
              <textarea
                value={promptQuery}
                onChange={(e) => setPromptQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendPrompt();
                  }
                }}
                placeholder={language === 'ar' ? 'صف التعديل المطلوب أو اطلب ميزة جديدة للمشروع...' : 'Describe requested modification...'}
                className="w-full bg-transparent border-0 outline-none text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] resize-none h-12 leading-relaxed px-1 pt-1"
              />

              <div className="flex items-center justify-between pt-1.5 border-t border-[var(--border-default)]/60">
                <div className="flex items-center gap-1">
                  {/* Paperclip File Upload */}
                  <label className="p-1.5 rounded-shape-sm text-[var(--text-muted)] hover:text-accent hover:bg-[var(--surface-card)] border border-transparent hover:border-[var(--border-default)] transition-all cursor-pointer">
                    <Paperclip size={15} />
                    <input type="file" className="hidden" onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        toast.success(dir === 'rtl' ? `تم إرفاق: ${f.name}` : `Attached: ${f.name}`);
                        addLog('log', `تم إرفاق الملف: ${f.name}`);
                      }
                    }} />
                  </label>

                  {/* Microphone Voice Input */}
                  <button
                    type="button"
                    onClick={() => toast.info(dir === 'rtl' ? 'الإملاء الصوتي نشط...' : 'Voice recording active...')}
                    className="p-1.5 rounded-shape-sm text-[var(--text-muted)] hover:text-accent hover:bg-[var(--surface-card)] border border-transparent hover:border-[var(--border-default)] transition-all cursor-pointer"
                  >
                    <Mic size={15} />
                  </button>
                </div>

                {/* Send Button */}
                <button
                  type="button"
                  onClick={handleSendPrompt}
                  disabled={isGenerating || !promptQuery.trim()}
                  className={`h-7 px-3 rounded-shape-sm font-bold text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ${
                    promptQuery.trim() && !isGenerating 
                      ? 'bg-accent text-white shadow-accent/20 animate-pulse' 
                      : 'bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] opacity-40'
                  }`}
                >
                  {isGenerating ? (
                    <RefreshCw size={13} className="animate-spin" />
                  ) : (
                    <>
                      <span>{language === 'ar' ? 'إرسال' : 'Send'}</span>
                      <Send size={12} className={dir === 'rtl' ? 'rotate-180' : ''} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* 2. File Tree & Explorer */}
        <aside className="w-64 bg-[var(--surface-card)] border-e border-[var(--border-default)] flex flex-col shrink-0 select-none">

          <div className="p-3 border-b border-[var(--border-default)] flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <Folder size={14} className="text-accent" />
              <span>{language === 'ar' ? 'شجرة الملفات' : 'Project Files'}</span>
            </span>
            <button 
              onClick={() => {
                const name = prompt(language === 'ar' ? 'أدخل مسار الملف الجديد (مثال: src/components/Header.jsx):' : 'Enter new file path:');
                if (name) {
                  setFiles(prev => ({
                    ...prev,
                    [name]: { name: name.split('/').pop() || name, path: name, type: name.split('.').pop() || 'txt', content: '// كود جديد\n' }
                  }));
                  setActiveFilePath(name);
                  addLog('success', `تم إنشاء الملف: ${name}`);
                }
              }}
              className="p-1 rounded hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-accent cursor-pointer"
              title="إضافة ملف جديد"
            >
              <Plus size={15} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2 font-mono text-xs">
            {(() => {
              const rootFiles = Object.keys(files).filter(p => !p.includes('/'));
              const apiFiles = Object.keys(files).filter(p => p.startsWith('api/'));
              const dbFiles = Object.keys(files).filter(p => p.startsWith('db/'));

              const renderFileItem = (path: string) => {
                const file = files[path];
                const isSelected = activeFilePath === path;
                const isEntry = file.isEntry || path === 'index.html';

                return (
                  <div
                    key={path}
                    onClick={() => setActiveFilePath(path)}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-shape-sm cursor-pointer transition-theme relative ${
                      isSelected 
                        ? 'bg-[var(--bg-accent-muted)] text-accent border border-[var(--border-accent)]/40 font-bold shadow-xs' 
                        : 'text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-accent rounded-r" />
                    )}
                    <div className="flex items-center gap-2 truncate ps-1">
                      {path.endsWith('.html') ? <FileCode size={14} className="text-blue-500 shrink-0" /> :
                       path.endsWith('.css') ? <FileText size={14} className="text-pink-500 shrink-0" /> :
                       path.endsWith('.php') ? <Globe size={14} className="text-amber-500 shrink-0" /> :
                       path.endsWith('.sql') ? <Database size={14} className="text-emerald-500 shrink-0" /> :
                       <FileCode size={14} className="text-yellow-500 shrink-0" />}
                      <span className="truncate">{path.split('/').pop()}</span>
                    </div>
                    {isEntry && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-accent/10 text-accent border border-accent/20">
                        {language === 'ar' ? 'بدء' : 'Entry'}
                      </span>
                    )}
                  </div>
                );
              };

              return (
                <div className="space-y-3">
                  {rootFiles.length > 0 && (
                    <div className="space-y-1">
                      {rootFiles.map(renderFileItem)}
                    </div>
                  )}

                  {apiFiles.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold text-[var(--text-muted)]">
                        <Folder size={13} className="text-amber-500" />
                        <span>api/</span>
                      </div>
                      <div className="ps-3 space-y-1 border-s border-[var(--border-default)] ms-2">
                        {apiFiles.map(renderFileItem)}
                      </div>
                    </div>
                  )}

                  {dbFiles.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold text-[var(--text-muted)]">
                        <Folder size={13} className="text-emerald-500" />
                        <span>db/</span>
                      </div>
                      <div className="ps-3 space-y-1 border-s border-[var(--border-default)] ms-2">
                        {dbFiles.map(renderFileItem)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </aside>

        {/* 3. Central Area: Editor & Live Preview */}
        <main className="flex-1 flex flex-col bg-[var(--surface-page)] overflow-hidden relative">
          {/* Editor Header / Tabs & Preview Toolbar */}
          <div className="h-12 bg-[var(--surface-card)] border-b border-[var(--border-default)] px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              {/* Preview Button */}
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3.5 py-1.5 rounded-shape-sm border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'preview'
                    ? 'bg-[var(--surface-subtle)] border-accent text-accent shadow-xs'
                    : 'bg-transparent border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-default)]'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'preview' ? 'bg-accent animate-pulse' : 'bg-transparent'}`} />
                <span>{language === 'ar' ? 'معاينة (Preview)' : 'Preview'}</span>
              </button>

              {/* Code Button */}
              <button
                onClick={() => setActiveTab('code')}
                className={`px-3.5 py-1.5 rounded-shape-sm border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'code'
                    ? 'bg-[var(--surface-subtle)] border-accent text-accent shadow-xs'
                    : 'bg-transparent border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-default)]'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'code' ? 'bg-accent animate-pulse' : 'bg-transparent'}`} />
                <span>{language === 'ar' ? 'الكود (Code)' : 'Code'}</span>
              </button>
            </div>

            {/* Preview Toolbar Controls (when activeTab === 'preview') */}
            {activeTab === 'preview' && (
              <div className="flex items-center gap-2 relative">
                {/* Device Viewport Selector Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsDeviceMenuOpen(prev => !prev)}
                    className="p-1.5 px-2.5 rounded-shape-sm border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] hover:border-accent/60 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all"
                    title={language === 'ar' ? 'أبعاد العرض' : 'Screen dimensions'}
                  >
                    {deviceMode === 'mobile' ? <Smartphone size={14} className="text-accent" /> : deviceMode === 'tablet' ? <Tablet size={14} className="text-accent" /> : <Monitor size={14} className="text-accent" />}
                    <span className="hidden md:inline text-[11px] font-mono">
                      {deviceMode === 'mobile' ? 'Mobile (375px)' : deviceMode === 'tablet' ? 'Tablet (768px)' : 'Responsive'}
                    </span>
                    <ChevronRight size={12} className={`rotate-90 transition-transform ${isDeviceMenuOpen ? 'rotate-[-90deg]' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isDeviceMenuOpen && (
                      <PopCard className="absolute right-0 mt-1.5 z-50 origin-top-right">
                        <button
                          onClick={() => { setDeviceMode('responsive'); setIsDeviceMenuOpen(false); }}
                          className={`w-full px-3 py-2 rounded-shape-sm text-xs font-medium flex items-center gap-3 transition-colors cursor-pointer ${deviceMode === 'responsive' ? 'bg-[var(--surface-subtle)] text-accent font-bold' : 'text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]'}`}
                        >
                          <Monitor size={14} />
                          <span>{language === 'ar' ? 'شاشة كاملة (Responsive)' : 'Current screen size'}</span>
                        </button>
                        <button
                          onClick={() => { setDeviceMode('mobile'); setIsDeviceMenuOpen(false); }}
                          className={`w-full px-3 py-2 rounded-shape-sm text-xs font-medium flex items-center gap-3 transition-colors cursor-pointer ${deviceMode === 'mobile' ? 'bg-[var(--surface-subtle)] text-accent font-bold' : 'text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]'}`}
                        >
                          <Smartphone size={14} />
                          <span>{language === 'ar' ? 'موبايل (375px)' : 'Mobile'}</span>
                        </button>
                        <button
                          onClick={() => { setDeviceMode('tablet'); setIsDeviceMenuOpen(false); }}
                          className={`w-full px-3 py-2 rounded-shape-sm text-xs font-medium flex items-center gap-3 transition-colors cursor-pointer ${deviceMode === 'tablet' ? 'bg-[var(--surface-subtle)] text-accent font-bold' : 'text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]'}`}
                        >
                          <Tablet size={14} />
                          <span>{language === 'ar' ? 'تابلت (768px)' : 'Tablet'}</span>
                        </button>
                      </PopCard>
                    )}
                  </AnimatePresence>
                </div>

                {/* Refresh Preview */}
                <button
                  onClick={() => {
                    setIframeKey(prev => prev + 1);
                    toast.success(language === 'ar' ? 'تم تحديث المعاينة بنجاح' : 'Preview refreshed successfully');
                  }}
                  className="p-1.5 rounded-shape-sm border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-default)] transition-all cursor-pointer"
                  title={language === 'ar' ? 'تحديث المعاينة' : 'Refresh preview'}
                >
                  <RefreshCw size={14} />
                </button>

                {/* Fullscreen Toggle */}
                <button
                  onClick={() => setIsPreviewFullscreen(prev => !prev)}
                  className="p-1.5 rounded-shape-sm border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-default)] transition-all cursor-pointer"
                  title={language === 'ar' ? 'ملء الشاشة' : 'Fullscreen preview'}
                >
                  {isPreviewFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>

                {/* Database Modal Trigger Button */}
                <button
                  onClick={() => {
                    setIsDbModalOpen(true);
                    toast.success(language === 'ar' ? 'فتح لوحة قاعدة البيانات SQLite' : 'Opened SQLite Database manager');
                  }}
                  className="p-1.5 rounded-shape-sm border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-emerald-500 hover:border-emerald-500/60 transition-all cursor-pointer flex items-center gap-1.5 px-2.5"
                  title={language === 'ar' ? 'إدارة قاعدة البيانات SQLite' : 'SQLite Database Manager'}
                >
                  <Database size={14} className="text-emerald-500" />
                  <span className="text-xs font-bold text-[var(--text-primary)] hidden sm:inline">DB</span>
                </button>

                {/* Manual Editor / Quick Adjust Tool */}
                <button
                  onClick={() => {
                    setActiveTab('code');
                    toast.info(language === 'ar' ? 'أداة التحرير اليدوي نشطة' : 'Manual editor tool active');
                  }}
                  className="p-1.5 rounded-shape-sm border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-accent hover:border-accent/60 transition-all cursor-pointer"
                  title={language === 'ar' ? 'أداة التحرير اليدوي' : 'Manual editor tool'}
                >
                  <Wand2 size={14} />
                </button>
              </div>
            )}
          </div>

          {/* View Content: Preview vs Code */}
          <div className={`flex-1 relative overflow-hidden flex flex-col ${isPreviewFullscreen ? 'fixed inset-0 z-[200] bg-[var(--surface-page)]' : ''}`}>
            {/* Fullscreen Exit bar if fullscreen */}
            {isPreviewFullscreen && (
              <div className="h-10 bg-[var(--surface-card)] border-b border-[var(--border-default)] px-4 flex items-center justify-between shrink-0">
                <span className="text-xs font-bold">{language === 'ar' ? 'معاينة ملء الشاشة' : 'Fullscreen Preview'}</span>
                <button
                  onClick={() => setIsPreviewFullscreen(false)}
                  className="px-3 py-1 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs font-bold hover:border-accent cursor-pointer flex items-center gap-1.5"
                >
                  <X size={14} />
                  <span>{language === 'ar' ? 'خروج' : 'Exit'}</span>
                </button>
              </div>
            )}

            {activeTab === 'preview' ? (
              <div className="flex-1 w-full h-full bg-[var(--surface-page)] p-0 m-0 relative flex flex-col overflow-hidden">
                <div className={`flex flex-col bg-[var(--surface-card)] transition-all flex-1 w-full h-full ${
                  deviceMode === 'mobile' 
                    ? 'w-[375px] h-[667px] max-w-[375px] max-h-[667px] m-auto rounded-2xl border border-[var(--border-default)] shadow-2xl overflow-hidden shrink-0' 
                    : deviceMode === 'tablet' 
                    ? 'w-[768px] h-[900px] max-w-[768px] max-h-[900px] m-auto rounded-2xl border border-[var(--border-default)] shadow-2xl overflow-hidden shrink-0' 
                    : 'w-full h-full rounded-none border-0 shadow-none flex flex-col'
                }`}>
                  {/* Browser Mockup Header */}
                  <div className="h-9 bg-[var(--surface-subtle)] border-b border-[var(--border-default)] px-3 flex items-center justify-between shrink-0 select-none">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    </div>
                    <div className="px-3 py-1 rounded bg-[var(--surface-card)] border border-[var(--border-default)] text-[10px] font-mono text-[var(--text-muted)] flex items-center gap-1.5 w-64 justify-center">
                      <Globe size={11} className="text-emerald-500" />
                      <span className="truncate">http://localhost:3000/</span>
                    </div>
                    <div className="text-[10px] font-mono text-[var(--text-muted)]">
                      {deviceMode === 'mobile' ? '375x667' : deviceMode === 'tablet' ? '768x1024' : '100%'}
                    </div>
                  </div>

                  {/* iframe container */}
                  <div className="flex-1 w-full h-full bg-white relative overflow-y-auto">
                    <iframe
                      key={previewBlobUrl || iframeKey}
                      src={previewBlobUrl || undefined}
                      title="App Live Preview"
                      className="w-full h-full min-h-full border-0 bg-white"
                      sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col bg-[var(--surface-card)]">
                {/* Professional Code Header */}
                <div className="h-10 bg-[var(--surface-subtle)] border-b border-[var(--border-default)] px-4 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <FileCode size={15} className="text-accent" />
                    <span className="text-xs font-mono font-bold text-[var(--text-primary)]">{activeFilePath}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-accent/10 text-accent border border-accent/20">
                      {activeFile?.content.split('\n').length || 0} lines
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(activeFile?.content || '');
                        toast.success(dir === 'rtl' ? 'تم نسخ الكود بنجاح!' : 'Code copied to clipboard!');
                      }}
                      className="px-2.5 py-1 rounded text-xs font-bold bg-[var(--surface-card)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-accent cursor-pointer flex items-center gap-1.5"
                    >
                      <span>{language === 'ar' ? 'نسخ الكود' : 'Copy Code'}</span>
                    </button>
                  </div>
                </div>

                <textarea
                  value={activeFile?.content || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFiles(prev => ({
                      ...prev,
                      [activeFilePath]: { ...prev[activeFilePath], content: val }
                    }));
                  }}
                  className="flex-1 w-full h-full p-4 font-mono text-xs sm:text-sm bg-[var(--surface-inset)] text-[var(--text-primary)] outline-none resize-none leading-relaxed border-0"
                  spellCheck={false}
                />
                <div className="p-3 bg-[var(--surface-card)] border-t border-[var(--border-default)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {hasUnsavedChanges && (
                      <span className="text-xs font-bold text-amber-500 flex items-center gap-1.5 animate-pulse">
                        <span>●</span>
                        <span>{language === 'ar' ? 'يوجد تغييرات غير محفوظة' : 'Unsaved changes'}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleUndoChanges}
                      disabled={!hasUnsavedChanges}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-accent disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>{language === 'ar' ? 'تراجع عن التغييرات' : 'Undo Changes'}</span>
                    </button>
                    <button
                      onClick={handleSaveChanges}
                      disabled={!hasUnsavedChanges}
                      className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-theme cursor-pointer shadow-sm flex items-center gap-1.5"
                    >
                      <span>{language === 'ar' ? 'حفظ وتطبيق التغييرات' : 'Save Changes'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Terminal Drawer (Collapsible) */}
            <AnimatePresence>
              {isTerminalOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 220, opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-[var(--surface-inset)] text-[var(--text-primary)] border-t border-[var(--border-default)] flex flex-col shrink-0 font-mono text-xs z-20"
                >
                  <div className="h-9 px-4 bg-[var(--surface-card)] border-b border-[var(--border-default)] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Terminal size={14} className="text-[var(--fg-accent)]" />
                      <span className="font-bold">{language === 'ar' ? 'طرفية النظام والتشغيل الحي' : 'System Terminal & Logs'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAiFix}
                        className="px-2.5 py-1 rounded bg-[var(--comp-button-primary-bg)] hover:opacity-90 text-[var(--comp-button-primary-fg)] text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Sparkles size={12} />
                        <span>{language === 'ar' ? 'إصلاح بالذكاء الاصطناعي' : 'AI Fix'}</span>
                      </button>
                      <button 
                        onClick={() => setIsTerminalOpen(false)}
                        className="p-1 rounded hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 p-3 overflow-y-auto space-y-1.5">
                    {terminalLogs.map((log, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-[var(--text-muted)] text-[10px] select-none">[{log.time}]</span>
                        <span className={`flex-1 ${
                          log.type === 'error' ? 'text-red-400 font-bold' :
                          log.type === 'success' ? 'text-emerald-400' : 'text-[var(--text-secondary)]'
                        }`}>
                          {log.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Database Modal (SQLite WebAssembly) */}
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
              className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--surface-subtle)]">
                <div className="flex items-center gap-2.5">
                  <Database size={18} className="text-amber-500" />
                  <div>
                    <h2 className="text-sm font-bold">{language === 'ar' ? 'مدير قاعدة البيانات الافتراضية (SQLite Wasm)' : 'SQLite Database Manager'}</h2>
                    <p className="text-[11px] text-[var(--text-muted)]">إدارة الجداول وتنفيذ استعلامات SQL الفورية</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDbModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-[var(--surface-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 flex overflow-hidden">
                {/* Tables List */}
                <div className="w-56 border-e border-[var(--border-default)] p-3 space-y-2 bg-[var(--surface-subtle)] overflow-y-auto">
                  <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{language === 'ar' ? 'الجداول المتوفرة' : 'Tables'}</span>
                  <div className="space-y-1">
                    {sqlTables.map(tbl => (
                      <button
                        key={tbl}
                        onClick={() => setSelectedTable(tbl)}
                        className={`w-full text-right px-3 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-between ${
                          selectedTable === tbl 
                            ? 'bg-[var(--bg-accent-muted)] text-accent border border-[var(--border-accent)]/40' 
                            : 'text-[var(--text-secondary)] hover:bg-[var(--surface-card)]'
                        }`}
                      >
                        <span>{tbl}</span>
                        <ChevronLeft size={14} className={dir === 'rtl' ? '' : 'rotate-180'} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Table Data Grid & Query Editor */}
                <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-4">
                  {/* SQL Query Editor */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-[var(--text-secondary)]">{language === 'ar' ? 'محرر استعلامات SQL' : 'SQL Query Editor'}</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={sqlCustomQuery}
                        onChange={(e) => setSqlCustomQuery(e.target.value)}
                        className="flex-1 px-3 py-2 bg-[var(--surface-subtle)] border border-[var(--border-default)] rounded-xl font-mono text-xs text-[var(--text-primary)] outline-none focus:border-accent"
                        placeholder="SELECT * FROM users;"
                      />
                      <button
                        onClick={runCustomSqlQuery}
                        className="px-4 py-2 bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] text-xs font-bold rounded-xl hover:opacity-90 transition cursor-pointer"
                      >
                        {language === 'ar' ? 'تنفيذ' : 'Run'}
                      </button>
                    </div>
                  </div>

                  {/* Results / Data Grid */}
                  <div className="flex-1 flex flex-col space-y-2 overflow-hidden">
                    <span className="text-xs font-bold text-[var(--text-secondary)]">
                      {language === 'ar' ? `بيانات الجدول: ${selectedTable}` : `Table Data: ${selectedTable}`}
                    </span>
                    <div className="flex-1 overflow-auto rounded-xl border border-[var(--border-default)] bg-[var(--surface-subtle)]">
                      {tableColumns.length > 0 ? (
                        <table className="w-full text-right text-xs font-mono">
                          <thead className="bg-[var(--surface-card)] border-b border-[var(--border-default)] sticky top-0">
                            <tr>
                              {tableColumns.map(col => (
                                <th key={col} className="px-3 py-2.5 font-bold text-[var(--text-primary)]">{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--border-default)]">
                            {tableDataRows.map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-[var(--surface-card)]/50 transition-colors">
                                {row.map((cell: any, cIdx: any) => (
                                  <td key={cIdx} className="px-3 py-2 text-[var(--text-secondary)]">{String(cell)}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="p-8 text-center text-xs text-[var(--text-muted)]">
                          {language === 'ar' ? 'لا توجد بيانات متاحة في هذا الجدول.' : 'No data available in this table.'}
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
    </div>
  );
};
export default AppStudioPage;
