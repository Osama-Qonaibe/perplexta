import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileCode,
  ExternalLink,
  Code,
  Layers,
  Zap,
  Globe,
  Loader2,
  Copy,
  Check,
  HelpCircle,
  Play,
  Image as ImageIcon
} from 'lucide-react';
import { fetchStudioTemplateFiles } from '../components/studio/templateLoader';
import { CORE_TEMPLATES_MAP, STUDIO_TEMPLATES } from '../components/studio/templatesData';
import type { StudioTemplate } from '../components/studio/types';

const GENERAL_FAQS = [
  {
    q: 'Is this template free to use?',
    a: 'Yes. Open it in Studio, customize it with the AI assistant or direct code editor, and publish it without any template license fee.'
  },
  {
    q: 'Can I change the design and sections?',
    a: 'Yes. Every part of the page is editable. Ask for different colors, fonts, sections or layout, and the assistant updates the live preview in place.'
  },
  {
    q: 'Do I need to write code?',
    a: 'No. You can make every change by describing what you want in plain language, or inspect and edit the source files directly in the Code tab if you prefer.'
  }
];

export const TemplateDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<StudioTemplate | null>(null);
  const [files, setFiles] = useState<Record<string, string>>({});
  const [activeFile, setActiveFile] = useState<string>('index.html');
  const [showcaseMode, setShowcaseMode] = useState<'screenshot' | 'live' | 'code'>('screenshot');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isIngesting, setIsIngesting] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const [handedOffToStudioTab, setHandedOffToStudioTab] = useState<boolean>(false);

  useEffect(() => {
    if (!slug) return;
    const found = CORE_TEMPLATES_MAP[slug];
    if (found) {
      setTemplate(found);
      setIsLoading(true);
      fetchStudioTemplateFiles(found)
        .then((loadedFiles) => {
          setFiles(loadedFiles);
          const codeFiles = Object.keys(loadedFiles).filter(
            (k) => !/\.(png|jpg|jpeg|webp|gif|ico)$/i.test(k)
          );
          if (codeFiles.includes('index.html')) {
            setActiveFile('index.html');
          } else if (codeFiles.length > 0) {
            setActiveFile(codeFiles[0]);
          }
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [slug]);

  const dispatchToExistingStudioOrNavigate = async (payload: {
    action: 'USE_TEMPLATE' | 'OPEN_ALL_TEMPLATES' | 'FOCUS_STUDIO';
    templateSlug?: string;
    projectName?: string;
    initialPrompt?: string;
  }) => {
    const requestId = `studio_req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const fullMessage = {
      type: 'PERPLEXTA_STUDIO_HANDOFF',
      requestId,
      ...payload,
      timestamp: Date.now()
    };

    let studioAckReceived = false;
    let channel: BroadcastChannel | null = null;

    try {
      if (typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel('perplexta_studio_channel');
        channel.onmessage = (ev) => {
          if (ev.data && ev.data.type === 'STUDIO_ACK' && ev.data.requestId === requestId) {
            studioAckReceived = true;
          }
        };
      }
    } catch (_e) {}

    const onStorageAck = (e: StorageEvent) => {
      if (e.key === 'perplexta_studio_ack' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && parsed.requestId === requestId) {
            studioAckReceived = true;
          }
        } catch (_err) {}
      }
    };
    window.addEventListener('storage', onStorageAck);

    try {
      localStorage.setItem('pending_studio_template', JSON.stringify(fullMessage));
      if (payload.projectName) {
        localStorage.setItem('perplexta_active_project_name', payload.projectName);
      }
    } catch (_e) {}

    try {
      channel?.postMessage(fullMessage);
    } catch (_e) {}

    // If opened from an active Studio tab via window.opener, directly message & focus it and close this tab
    if (window.opener && !window.opener.closed) {
      try {
        window.opener.postMessage(fullMessage, window.location.origin);
        window.opener.focus();
      } catch (_e) {}
      window.removeEventListener('storage', onStorageAck);
      try {
        channel?.close();
      } catch (_e) {}
      window.close();
      setHandedOffToStudioTab(true);
      return;
    }

    // Wait briefly to see if another open Studio tab acknowledges via BroadcastChannel or storage event
    await new Promise((resolve) => setTimeout(resolve, 240));
    window.removeEventListener('storage', onStorageAck);
    try {
      channel?.close();
    } catch (_e) {}

    if (studioAckReceived) {
      window.close();
      setHandedOffToStudioTab(true);
      return;
    }

    // No open Studio tab exists anywhere — open Studio in the current tab
    navigate('/app', { replace: true });
  };

  const handleUseInStudio = async (initialPrompt?: string) => {
    if (!template) return;
    setIsIngesting(true);
    try {
      await dispatchToExistingStudioOrNavigate({
        action: 'USE_TEMPLATE',
        templateSlug: template.slug,
        projectName: template.name,
        initialPrompt: initialPrompt || ''
      });
    } finally {
      setIsIngesting(false);
    }
  };

  const handleReturnToStudio = async (openAllTemplates = false) => {
    await dispatchToExistingStudioOrNavigate({
      action: openAllTemplates ? 'OPEN_ALL_TEMPLATES' : 'FOCUS_STUDIO'
    });
  };

  const handleCopyFileContent = () => {
    if (files[activeFile]) {
      navigator.clipboard.writeText(files[activeFile]);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Build live preview srcDoc for interactive preview right on the template detail page
  const livePreviewSrcDoc = useMemo(() => {
    const rawHtml = files['index.html'];
    if (!rawHtml) return '';
    let doc = rawHtml
      .replace(/<link\s+[^>]*href=["'](?!https?:\/\/)[^"']+\.css["'][^>]*\/?>/gi, '')
      .replace(/<script\s+[^>]*src=["'](?!https?:\/\/)[^"']+\.js["'][^>]*>\s*<\/script>/gi, '');
    const css = files['styles.css'] || '';
    const js = files['app.js'] || '';
    if (css) {
      doc = doc.replace(/<\/head>/i, () => `<style>${css}</style></head>`);
    }
    if (js) {
      doc = doc.replace(/<\/body>/i, () => `<script>${js}</script></body>`);
    }
    return doc;
  }, [files]);

  const codeFileKeys = useMemo(
    () => Object.keys(files).filter((k) => !/\.(png|jpg|jpeg|webp|gif|ico)$/i.test(k)),
    [files]
  );

  const combinedFaqs = useMemo(() => {
    const specific = Array.isArray(template?.faq) ? template!.faq : [];
    return [...specific, ...GENERAL_FAQS];
  }, [template]);

  const relatedTemplates = useMemo(() => {
    if (!template) return [];
    return STUDIO_TEMPLATES.filter(
      (t) => t.slug !== template.slug && t.category === template.category
    ).slice(0, 3);
  }, [template]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="text-blue-500 animate-spin" />
          <p className="text-sm font-bold text-slate-300">Loading template details & source files...</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex flex-col items-center justify-center p-6 font-sans text-center">
        <div className="max-w-md space-y-4">
          <div className="w-16 h-16 rounded-shape-lg bg-[#131822] border border-slate-800 flex items-center justify-center mx-auto text-amber-500">
            <Zap size={32} />
          </div>
          <h1 className="text-xl font-black">Template not found</h1>
          <p className="text-xs text-slate-400">
            The requested template could not be found. Return to the Studio gallery to browse all 46 templates.
          </p>
          <button
            type="button"
            onClick={() => handleReturnToStudio(false)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-shape-md bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-lg cursor-pointer"
          >
            <ArrowLeft size={15} />
            <span>Back to App Studio</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0e14] text-[#e6edf3] font-sans selection:bg-blue-600 selection:text-white pb-20" dir="ltr">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-40 bg-[#0b0e14]/90 backdrop-blur-md border-b border-[#21262d] px-4 md:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleReturnToStudio(false)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-shape-sm bg-[#161b22] hover:bg-[#21262d] text-[#c9d1d9] hover:text-white text-xs font-semibold transition-all border border-[#30363d] cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Studio Workspace</span>
          </button>
          <div className="h-4 w-px bg-[#30363d] hidden sm:block" />
          <div className="flex items-center gap-2 text-xs text-[#8b949e]">
            <button
              type="button"
              onClick={() => handleReturnToStudio(true)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Templates
            </button>
            <span>/</span>
            <span className="text-[#e6edf3] font-semibold">{template.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleUseInStudio()}
            disabled={isIngesting}
            className="px-4 py-2 rounded-shape-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer"
          >
            {isIngesting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Opening in Studio...</span>
              </>
            ) : (
              <>
                <span>Use this template</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </header>

      {handedOffToStudioTab && (
        <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-4 py-3 text-center text-xs font-bold text-emerald-300 flex items-center justify-center gap-2">
          <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
          <span>
            Template loaded into your active Studio tab! Switch back to your Studio tab to continue editing.
          </span>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 pt-12 space-y-16">
        {/* Hero Section (Matches builder/src/content/templates.js renderTemplatePage) */}
        <section className="max-w-3xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-shape-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <span>Template • {template.category || 'Website'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.12]">
            {template.name} template
          </h1>

          <p className="text-base sm:text-lg text-[#8b949e] leading-relaxed max-w-2xl mx-auto">
            {template.pageDescription || template.description}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleUseInStudio()}
              disabled={isIngesting}
              className="px-6 py-3 rounded-shape-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20 cursor-pointer"
            >
              {isIngesting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Loading in Studio...</span>
                </>
              ) : (
                <>
                  <span>Use this template</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleReturnToStudio(true)}
              className="px-5 py-3 rounded-shape-sm bg-[#161b22] hover:bg-[#21262d] text-[#e6edf3] font-semibold text-sm border border-[#30363d] transition-colors cursor-pointer"
            >
              All templates
            </button>
          </div>

          <p className="text-xs text-[#8b949e]">
            Free to use — customize anything by asking in plain English or Arabic.
          </p>
        </section>

        {/* Framed Browser Window Showcase (.shot-frame) with Screenshot / Live Preview / Code Switcher */}
        <section className="space-y-3">
          <div className="rounded-shape-lg bg-[#161b22] border border-[#30363d] overflow-hidden shadow-2xl">
            {/* Browser Top Chrome (.shot-bar) */}
            <div className="h-11 px-4 bg-[#0d1117] border-b border-[#30363d] flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
                <span className="ml-3 text-xs font-mono text-[#8b949e] hidden sm:inline">
                  {template.slug}/index.html
                </span>
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center bg-[#161b22] p-0.5 rounded-shape-xs border border-[#30363d]">
                <button
                  type="button"
                  onClick={() => setShowcaseMode('screenshot')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-shape-xs text-xs font-semibold cursor-pointer transition-colors ${
                    showcaseMode === 'screenshot'
                      ? 'bg-blue-600 text-white'
                      : 'text-[#8b949e] hover:text-white'
                  }`}
                >
                  <ImageIcon size={12} />
                  <span>Screenshot</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowcaseMode('live')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-shape-xs text-xs font-semibold cursor-pointer transition-colors ${
                    showcaseMode === 'live'
                      ? 'bg-blue-600 text-white'
                      : 'text-[#8b949e] hover:text-white'
                  }`}
                >
                  <Play size={12} />
                  <span>Live Preview</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowcaseMode('code')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-shape-xs text-xs font-semibold cursor-pointer transition-colors ${
                    showcaseMode === 'code'
                      ? 'bg-blue-600 text-white'
                      : 'text-[#8b949e] hover:text-white'
                  }`}
                >
                  <Code size={12} />
                  <span>Source Code ({codeFileKeys.length})</span>
                </button>
              </div>
            </div>

            {/* Browser Viewport Content */}
            {showcaseMode === 'screenshot' && (
              <div className="relative bg-[#0d1117]">
                <img
                  src={template.thumbnail}
                  alt={`Screenshot of the ${template.name} template`}
                  className="w-full max-h-[640px] object-cover object-top block"
                />
              </div>
            )}

            {showcaseMode === 'live' && (
              <div className="w-full h-[640px] bg-white relative">
                <iframe
                  title={`${template.name} Live Preview`}
                  srcDoc={livePreviewSrcDoc}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
                  style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                />
              </div>
            )}

            {showcaseMode === 'code' && (
              <div className="bg-[#0d1117] font-mono text-xs">
                <div className="flex items-center justify-between px-3 bg-[#161b22] border-b border-[#30363d] overflow-x-auto">
                  <div className="flex items-center">
                    {codeFileKeys.map((filePath) => (
                      <button
                        key={filePath}
                        type="button"
                        onClick={() => setActiveFile(filePath)}
                        className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs border-b-2 font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                          activeFile === filePath
                            ? 'border-blue-500 bg-[#0d1117] text-white'
                            : 'border-transparent text-[#8b949e] hover:text-[#e6edf3]'
                        }`}
                      >
                        <FileCode size={13} />
                        <span>{filePath}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyFileContent}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-shape-xs bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] text-[11px] font-sans font-semibold border border-[#30363d] cursor-pointer shrink-0"
                  >
                    {copiedCode ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                    <span>{copiedCode ? 'Copied' : 'Copy file'}</span>
                  </button>
                </div>
                <div className="max-h-[540px] overflow-auto p-4 text-[#e6edf3] leading-[1.65] text-xs whitespace-pre custom-scrollbar">
                  {(files[activeFile] || '').split('\n').map((ln, idx) => (
                    <div key={idx} className="flex">
                      <span className="w-10 pr-4 text-right text-[#6e7681] select-none shrink-0">
                        {idx + 1}
                      </span>
                      <span className="flex-1">{ln || ' '}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* What is in the template (Features Grid) */}
        {template.features && template.features.length > 0 && (
          <section className="space-y-8 pt-6">
            <div className="max-w-2xl space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-400">
                What is in the template
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Built for a real {template.name.toLowerCase()}
              </h2>
              <p className="text-sm text-[#8b949e] leading-relaxed">
                Start with a complete layout and sample copy written for the job, then make it yours in a few messages.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {template.features.map((feat, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-shape-md bg-[#161b22] border border-[#30363d] hover:border-blue-500/40 transition-all space-y-2.5"
                >
                  <div className="w-9 h-9 rounded-shape-sm bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <CheckCircle2 size={18} />
                  </div>
                  <h3 className="text-base font-bold text-white">{feat.title}</h3>
                  {(feat.body || feat.description) && (
                    <p className="text-xs sm:text-sm text-[#8b949e] leading-relaxed">
                      {feat.body || feat.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Quick Customization Prompts (Click to open in Studio with prompt) */}
        {template.suggestions && template.suggestions.length > 0 && (
          <section className="space-y-6 pt-6 border-t border-[#21262d]">
            <div className="max-w-2xl space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-400">
                One-Click Customizations
              </div>
              <h2 className="text-2xl font-black text-white">
                What you can ask the assistant right away
              </h2>
              <p className="text-sm text-[#8b949e]">
                Click any suggestion below to open the template in Studio with this customization ready to run.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {template.suggestions.map((sug, i) => {
                const label = typeof sug === 'string' ? sug : sug.label || sug.prompt;
                const prompt = typeof sug === 'string' ? sug : sug.prompt || sug.label;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleUseInStudio(prompt)}
                    className="group p-4 rounded-shape-md bg-[#161b22] hover:bg-[#1c2128] border border-[#30363d] hover:border-blue-500/50 transition-all text-left flex items-start justify-between gap-3 cursor-pointer"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors flex items-center gap-2">
                        <Sparkles size={14} className="text-blue-400 shrink-0" />
                        <span>{label}</span>
                      </div>
                      {typeof sug !== 'string' && sug.prompt && (
                        <p className="text-xs text-[#8b949e] line-clamp-2 leading-relaxed">
                          “{sug.prompt}”
                        </p>
                      )}
                    </div>
                    <ArrowRight
                      size={15}
                      className="text-[#8b949e] group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-1"
                    />
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* How it works 3-Step Section (from builder/src/content/templates.js) */}
        <section className="space-y-8 pt-6 border-t border-[#21262d]">
          <div className="max-w-2xl space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-400">
              How it works
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Make it yours in three steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-shape-md bg-[#161b22] border border-[#30363d] space-y-3">
              <div className="w-8 h-8 rounded-shape-full bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                1
              </div>
              <h3 className="text-base font-bold text-white">Start from the template</h3>
              <p className="text-xs sm:text-sm text-[#8b949e] leading-relaxed">
                Open the {template.name.toLowerCase()} template in Studio. You get a working project with all the sections, sample content and styles ready to edit.
              </p>
            </div>

            <div className="p-6 rounded-shape-md bg-[#161b22] border border-[#30363d] space-y-3">
              <div className="w-8 h-8 rounded-shape-full bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                2
              </div>
              <h3 className="text-base font-bold text-white">Describe what to change</h3>
              <p className="text-xs sm:text-sm text-[#8b949e] leading-relaxed">
                Ask in plain language for your own name, copy, colors, photos or sections. The assistant edits the project and updates the live preview as you watch.
              </p>
            </div>

            <div className="p-6 rounded-shape-md bg-[#161b22] border border-[#30363d] space-y-3">
              <div className="w-8 h-8 rounded-shape-full bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                3
              </div>
              <h3 className="text-base font-bold text-white">Publish when it is ready</h3>
              <p className="text-xs sm:text-sm text-[#8b949e] leading-relaxed">
                Share your site or app with a live link, export the full source ZIP, or keep iterating as your needs change.
              </p>
            </div>
          </div>
        </section>

        {/* Questions / FAQ Section (from builder/src/content/templates.js) */}
        <section className="space-y-8 pt-6 border-t border-[#21262d]">
          <div className="max-w-2xl space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Questions
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              About the {template.name.toLowerCase()} template
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {combinedFaqs.map((item, idx) => (
              <div
                key={idx}
                className="p-5 rounded-shape-md bg-[#161b22] border border-[#30363d] space-y-2"
              >
                <h3 className="text-sm font-bold text-white flex items-start gap-2">
                  <HelpCircle size={15} className="text-blue-400 shrink-0 mt-0.5" />
                  <span>{item.q}</span>
                </h3>
                <p className="text-xs sm:text-sm text-[#8b949e] leading-relaxed pl-6">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Related Templates */}
        {relatedTemplates.length > 0 && (
          <section className="space-y-6 pt-6 border-t border-[#21262d]">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-white">More {template.category} templates</h2>
              <button
                type="button"
                onClick={() => handleReturnToStudio(true)}
                className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
              >
                <span>Browse all 46 templates</span>
                <ArrowRight size={13} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {relatedTemplates.map((rel) => (
                <Link
                  key={rel.slug}
                  to={`/studio/template/${rel.slug}`}
                  className="group rounded-shape-md bg-[#161b22] border border-[#30363d] hover:border-blue-500/50 overflow-hidden transition-all flex flex-col"
                >
                  <div className="h-40 bg-[#0d1117] overflow-hidden">
                    <img
                      src={rel.thumbnail}
                      alt={rel.name}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4 space-y-1">
                    <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                      {rel.name}
                    </div>
                    <p className="text-xs text-[#8b949e] line-clamp-2">{rel.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Bottom CTA Banner */}
        <section className="rounded-shape-lg bg-gradient-to-br from-[#161b22] to-[#0d1117] border border-blue-500/30 p-8 sm:p-12 text-center space-y-4 shadow-2xl">
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Start with the {template.name.toLowerCase()} template
          </h2>
          <p className="text-sm sm:text-base text-[#8b949e] max-w-xl mx-auto">
            Open it in Studio and describe what you want to change.
          </p>
          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={() => handleUseInStudio()}
              disabled={isIngesting}
              className="px-7 py-3.5 rounded-shape-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-sm flex items-center gap-2 transition-all shadow-lg cursor-pointer"
            >
              <span>Use this template</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};
