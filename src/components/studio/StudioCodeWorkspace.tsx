import React, { useState, useRef, useMemo } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileImage,
  Plus,
  Trash2,
  Edit2,
  X,
  Copy,
  Check,
  Search,
  Upload,
  RotateCcw,
  Save,
  ChevronRight,
  ChevronDown,
  Eye,
  Code
} from 'lucide-react';
import type { StudioFileItem } from './types';
export type { StudioFileItem };

interface StudioCodeWorkspaceProps {
  files: Record<string, StudioFileItem>;
  activeFilePath: string;
  openTabs: string[];
  onSelectFile: (path: string) => void;
  onCloseTab: (path: string, e: React.MouseEvent) => void;
  onUpdateFileContent: (path: string, content: string) => void;
  onCreateNewFile?: () => void;
  onDeleteFile?: (path: string) => void;
  onRenameFile?: (path: string) => void;
  onUploadFiles?: (files: FileList) => void;
  onSaveFile?: (path: string) => void;
  onRevertFile?: (path: string) => void;
  unsavedFiles?: Record<string, boolean>;
  language?: 'ar' | 'en';
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Tokenizes a single line of code using GitHub Dark / CodeMirror token colors
 * matching Osama-Qonaibe/builder's src/builder.css (.cm-tok-* palette).
 */
function highlightLineHtml(line: string, ext: string): string {
  if (!line) return ' ';
  const trimmed = line.trim();

  // Full-line comments
  if (
    trimmed.startsWith('//') ||
    trimmed.startsWith('/*') ||
    trimmed.startsWith('*') ||
    trimmed.startsWith('<!--')
  ) {
    return `<span style="color:#8b949e;font-style:italic">${escapeHtml(line)}</span>`;
  }

  if (ext === 'html' || ext === 'svg') {
    // HTML / SVG tokenizer
    const tokenRegex = /(<!--[\s\S]*?-->|<\/?[a-zA-Z0-9:-]+|\s+[a-zA-Z0-9_:-]+(?==)|"[^"]*"|'[^']*'|\/?>)/g;
    let lastIndex = 0;
    let out = '';
    let match: RegExpExecArray | null;
    while ((match = tokenRegex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        out += escapeHtml(line.slice(lastIndex, match.index));
      }
      const tok = match[0];
      if (tok.startsWith('<!--')) {
        out += `<span style="color:#8b949e;font-style:italic">${escapeHtml(tok)}</span>`;
      } else if (tok.startsWith('<') || tok === '>' || tok === '/>') {
        out += `<span style="color:#7ee787">${escapeHtml(tok)}</span>`;
      } else if (tok.startsWith('"') || tok.startsWith("'")) {
        out += `<span style="color:#a5d6ff">${escapeHtml(tok)}</span>`;
      } else {
        out += `<span style="color:#79c0ff">${escapeHtml(tok)}</span>`;
      }
      lastIndex = tokenRegex.lastIndex;
    }
    if (lastIndex < line.length) {
      out += escapeHtml(line.slice(lastIndex));
    }
    return out;
  }

  if (ext === 'css') {
    // CSS tokenizer
    const tokenRegex = /(\/\*[\s\S]*?\*\/|@[a-zA-Z-]+|"[^"]*"|'[^']*'|#[0-9a-fA-F]{3,8}\b|--[a-zA-Z0-9-]+|[a-zA-Z-]+(?=\s*:)|\b\d+(?:\.\d+)?(?:px|rem|em|vh|vw|%|s|ms|deg|fr)?\b)/g;
    let lastIndex = 0;
    let out = '';
    let match: RegExpExecArray | null;
    while ((match = tokenRegex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        out += escapeHtml(line.slice(lastIndex, match.index));
      }
      const tok = match[0];
      if (tok.startsWith('/*')) {
        out += `<span style="color:#8b949e;font-style:italic">${escapeHtml(tok)}</span>`;
      } else if (tok.startsWith('@')) {
        out += `<span style="color:#ff7b72">${escapeHtml(tok)}</span>`;
      } else if (tok.startsWith('"') || tok.startsWith("'")) {
        out += `<span style="color:#a5d6ff">${escapeHtml(tok)}</span>`;
      } else if (tok.startsWith('--')) {
        out += `<span style="color:#ffa657">${escapeHtml(tok)}</span>`;
      } else if (tok.startsWith('#') || /^\d/.test(tok)) {
        out += `<span style="color:#79c0ff">${escapeHtml(tok)}</span>`;
      } else {
        out += `<span style="color:#79c0ff">${escapeHtml(tok)}</span>`;
      }
      lastIndex = tokenRegex.lastIndex;
    }
    if (lastIndex < line.length) {
      out += escapeHtml(line.slice(lastIndex));
    }
    return out;
  }

  // JS / TS / JSON tokenizer
  const jsRegex = /(\/\/.*$|\/\*[\s\S]*?\*\/|`(?:\\[\s\S]|[^`])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:const|let|var|function|return|async|await|if|else|for|while|do|switch|case|break|continue|default|new|try|catch|finally|throw|typeof|instanceof|in|of|class|extends|import|export|from|as|void|delete)\b|\b(?:true|false|null|undefined|NaN|Infinity)\b|\b\d+(?:\.\d+)?\b|\b[A-Z][A-Z0-9_]{2,}\b|\b[a-zA-Z_$][a-zA-Z0-9_$]*(?=\s*\()|[a-zA-Z_$][a-zA-Z0-9_$]*(?=\s*:))/g;
  let lastIndex = 0;
  let out = '';
  let match: RegExpExecArray | null;
  while ((match = jsRegex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      out += escapeHtml(line.slice(lastIndex, match.index));
    }
    const tok = match[0];
    const afterChar = line[jsRegex.lastIndex] || '';
    if (tok.startsWith('//') || tok.startsWith('/*')) {
      out += `<span style="color:#8b949e;font-style:italic">${escapeHtml(tok)}</span>`;
    } else if (tok.startsWith('"') || tok.startsWith("'") || tok.startsWith('`')) {
      out += `<span style="color:#a5d6ff">${escapeHtml(tok)}</span>`;
    } else if (
      /^(const|let|var|function|return|async|await|if|else|for|while|do|switch|case|break|continue|default|new|try|catch|finally|throw|typeof|instanceof|in|of|class|extends|import|export|from|as|void|delete)$/.test(
        tok
      )
    ) {
      out += `<span style="color:#ff7b72">${escapeHtml(tok)}</span>`;
    } else if (/^(true|false|null|undefined|NaN|Infinity|\d+(\.\d+)?)$/.test(tok)) {
      out += `<span style="color:#79c0ff">${escapeHtml(tok)}</span>`;
    } else if (/^[A-Z][A-Z0-9_]{2,}$/.test(tok)) {
      out += `<span style="color:#ffa657">${escapeHtml(tok)}</span>`;
    } else if (afterChar === '(') {
      out += `<span style="color:#d2a8ff">${escapeHtml(tok)}</span>`;
    } else {
      out += `<span style="color:#79c0ff">${escapeHtml(tok)}</span>`;
    }
    lastIndex = jsRegex.lastIndex;
  }
  if (lastIndex < line.length) {
    out += escapeHtml(line.slice(lastIndex));
  }
  return out;
}

function getFileExtension(path: string): string {
  const parts = path.toLowerCase().split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

function isImagePath(path: string): boolean {
  return /\.(png|jpg|jpeg|webp|gif|ico)$/i.test(path);
}

function isSvgPath(path: string): boolean {
  return /\.svg$/i.test(path);
}

function getLanguageLabel(ext: string): string {
  switch (ext) {
    case 'js':
    case 'jsx':
      return 'JavaScript';
    case 'ts':
    case 'tsx':
      return 'TypeScript';
    case 'html':
      return 'HTML';
    case 'css':
      return 'CSS';
    case 'json':
      return 'JSON';
    case 'svg':
      return 'SVG Vector';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'webp':
    case 'gif':
      return 'Image Asset';
    default:
      return 'Plain Text';
  }
}

export const StudioCodeWorkspace: React.FC<StudioCodeWorkspaceProps> = ({
  files,
  activeFilePath,
  openTabs,
  onSelectFile,
  onCloseTab,
  onUpdateFileContent,
  onCreateNewFile,
  onDeleteFile,
  onRenameFile,
  onUploadFiles,
  onSaveFile,
  onRevertFile,
  unsavedFiles = {},
  language = 'ar'
}) => {
  const [copied, setCopied] = useState(false);
  const [fileSearch, setFileSearch] = useState('');
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const [cursorPos, setCursorPos] = useState<{ line: number; col: number }>({ line: 1, col: 1 });
  const [svgViewMode, setSvgViewMode] = useState<'preview' | 'code'>('preview');

  const uploadInputRef = useRef<HTMLInputElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const highlightPreRef = useRef<HTMLPreElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeFile = files[activeFilePath];
  const isAr = language === 'ar';
  const ext = activeFile ? getFileExtension(activeFile.path) : '';
  const isImage = activeFile ? isImagePath(activeFile.path) : false;
  const isSvg = activeFile ? isSvgPath(activeFile.path) : false;

  const handleEditorScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const { scrollTop, scrollLeft } = e.currentTarget;
    if (gutterRef.current) {
      gutterRef.current.scrollTop = scrollTop;
    }
    if (highlightPreRef.current) {
      highlightPreRef.current.scrollTop = scrollTop;
      highlightPreRef.current.scrollLeft = scrollLeft;
    }
  };

  const updateCursorPosition = (el: HTMLTextAreaElement) => {
    const selectionStart = el.selectionStart || 0;
    const textUpToCursor = el.value.slice(0, selectionStart);
    const lines = textUpToCursor.split('\n');
    setCursorPos({
      line: lines.length,
      col: lines[lines.length - 1].length + 1
    });
  };

  const handleCopyCode = () => {
    if (activeFile) {
      navigator.clipboard.writeText(activeFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Group files into folders (e.g. photos/, images/) and root files, matching builder's file tree
  const { foldersMap, rootFiles } = useMemo(() => {
    const fMap: Record<string, StudioFileItem[]> = {};
    const rFiles: StudioFileItem[] = [];
    const list = Object.values(files).filter((f) =>
      f.path.toLowerCase().includes(fileSearch.toLowerCase())
    );
    list.sort((a, b) => a.path.localeCompare(b.path));

    for (const item of list) {
      const slashIdx = item.path.indexOf('/');
      if (slashIdx > 0) {
        const folderName = item.path.slice(0, slashIdx);
        if (!fMap[folderName]) fMap[folderName] = [];
        fMap[folderName].push(item);
      } else {
        rFiles.push(item);
      }
    }
    return { foldersMap: fMap, rootFiles: rFiles };
  }, [files, fileSearch]);

  const lines = useMemo(() => {
    if (!activeFile || isImage) return [''];
    return activeFile.content.split('\n');
  }, [activeFile, isImage]);

  const highlightedLinesHtml = useMemo(() => {
    if (!activeFile || isImage) return [''];
    return lines.map((ln) => highlightLineHtml(ln, ext));
  }, [lines, ext, activeFile, isImage]);

  const lineCount = lines.length;
  const isCurrentFileUnsaved = Boolean(activeFilePath && unsavedFiles[activeFilePath]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      if (activeFilePath && onSaveFile) {
        onSaveFile(activeFilePath);
      }
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const newValue = el.value.substring(0, start) + '  ' + el.value.substring(end);
      onUpdateFileContent(activeFilePath, newValue);
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
          updateCursorPosition(textareaRef.current);
        }
      });
    }
  };

  const toggleFolder = (folder: string) => {
    setCollapsedFolders((prev) => ({ ...prev, [folder]: !prev[folder] }));
  };

  // Compute SVG data URL for visual preview when an .svg file is active
  const svgPreviewSrc = useMemo(() => {
    if (!isSvg || !activeFile) return '';
    const trimmed = activeFile.content.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return `data:image/svg+xml;utf8,${encodeURIComponent(trimmed)}`;
  }, [isSvg, activeFile]);

  return (
    <div className="w-full h-full flex bg-[#0d1117] text-[#e6edf3] font-mono text-xs overflow-hidden select-text" dir="ltr">
      {/* File Explorer Sidebar */}
      <div className="w-52 md:w-60 bg-[#161b22] border-r border-[#30363d] flex flex-col shrink-0">
        {/* Explorer Header + Actions */}
        <div className="h-9 px-3 border-b border-[#30363d] flex items-center justify-between font-sans">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#8b949e] uppercase tracking-wider">
            <span>{isAr ? 'الملفات' : 'Files'}</span>
          </div>
          <div className="flex items-center gap-1">
            {onUploadFiles && (
              <>
                <button
                  type="button"
                  onClick={() => uploadInputRef.current?.click()}
                  className="p-1 rounded-shape-xs hover:bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3] cursor-pointer"
                  title={isAr ? 'رفع ملفات' : 'Upload files'}
                >
                  <Upload size={13} />
                </button>
                <input
                  ref={uploadInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      onUploadFiles(e.target.files);
                      e.target.value = '';
                    }
                  }}
                />
              </>
            )}
            {onCreateNewFile && (
              <button
                type="button"
                onClick={onCreateNewFile}
                className="p-1 rounded-shape-xs hover:bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3] cursor-pointer"
                title={isAr ? 'ملف جديد' : 'New file'}
              >
                <Plus size={14} />
              </button>
            )}
          </div>
        </div>

        {/* File Filter Search */}
        <div className="p-2 border-b border-[#30363d] font-sans">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-2 text-[#8b949e]" />
            <input
              type="text"
              value={fileSearch}
              onChange={(e) => setFileSearch(e.target.value)}
              placeholder={isAr ? 'تصفية الملفات...' : 'Filter files...'}
              className="w-full pl-7 pr-2 py-1 text-[11px] bg-[#0d1117] border border-[#30363d] rounded-shape-xs text-[#e6edf3] placeholder-[#8b949e] outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* File Tree List (Folders first, then root files) */}
        <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
          {Object.entries(foldersMap).map(([folderName, folderFiles]) => {
            const isCollapsed = Boolean(collapsedFolders[folderName]);
            return (
              <div key={`folder-${folderName}`} className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => toggleFolder(folderName)}
                  className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-shape-xs text-left text-xs text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors cursor-pointer"
                >
                  {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                  {isCollapsed ? (
                    <Folder size={13} className="text-[#8b949e] shrink-0" />
                  ) : (
                    <FolderOpen size={13} className="text-blue-400 shrink-0" />
                  )}
                  <span className="truncate font-medium">{folderName}</span>
                </button>
                {!isCollapsed && (
                  <div className="pl-3.5 space-y-0.5 border-l border-[#30363d]/60 ml-2.5">
                    {folderFiles.map((f) => {
                      const isActive = f.path === activeFilePath;
                      const shortName = f.path.slice(folderName.length + 1);
                      const isImg = isImagePath(f.path) || isSvgPath(f.path);
                      return (
                        <div
                          key={f.path}
                          onClick={() => onSelectFile(f.path)}
                          className={`group flex items-center justify-between px-2 py-1 rounded-shape-xs cursor-pointer text-xs transition-colors ${
                            isActive
                              ? 'bg-[#1f6feb]/25 text-white font-semibold'
                              : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate min-w-0">
                            {isImg ? (
                              <FileImage size={13} className={isActive ? 'text-blue-400 shrink-0' : 'text-[#8b949e] shrink-0'} />
                            ) : (
                              <FileCode size={13} className={isActive ? 'text-blue-400 shrink-0' : 'text-[#8b949e] shrink-0'} />
                            )}
                            <span className="truncate">{shortName}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {rootFiles.map((f) => {
            const isActive = f.path === activeFilePath;
            const isUnsaved = Boolean(unsavedFiles[f.path]);
            const isImg = isImagePath(f.path) || isSvgPath(f.path);
            return (
              <div
                key={f.path}
                onClick={() => onSelectFile(f.path)}
                className={`group flex items-center justify-between px-2 py-1.5 rounded-shape-xs cursor-pointer text-xs transition-colors ${
                  isActive
                    ? 'bg-[#1f6feb]/25 text-white font-semibold'
                    : 'text-[#c9d1d9] hover:bg-[#21262d]'
                }`}
              >
                <div className="flex items-center gap-2 truncate min-w-0">
                  {isImg ? (
                    <FileImage size={13} className={isActive ? 'text-blue-400 shrink-0' : 'text-[#8b949e] shrink-0'} />
                  ) : (
                    <FileCode size={13} className={isActive ? 'text-blue-400 shrink-0' : 'text-[#8b949e] shrink-0'} />
                  )}
                  <span className="truncate">{f.path}</span>
                  {isUnsaved && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" title="Unsaved changes" />
                  )}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  {onRenameFile && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRenameFile(f.path);
                      }}
                      className="p-0.5 hover:text-white text-[#8b949e] cursor-pointer"
                      title="Rename"
                    >
                      <Edit2 size={11} />
                    </button>
                  )}
                  {onDeleteFile && !f.isEntry && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFile(f.path);
                      }}
                      className="p-0.5 hover:text-red-400 text-[#8b949e] cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Code Editor Canvas */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0d1117]">
        {/* Top File Header Bar (matches builder's .code-head) */}
        {activeFile && (
          <div className="h-9 px-3.5 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between text-xs text-[#8b949e] font-sans shrink-0">
            <div className="flex items-center gap-1.5 font-mono text-xs text-[#e6edf3] truncate">
              {activeFile.path.split('/').map((part, i, arr) => (
                <React.Fragment key={i}>
                  <span className={i === arr.length - 1 ? 'text-[#e6edf3] font-semibold' : 'text-[#8b949e]'}>
                    {part}
                  </span>
                  {i < arr.length - 1 && <ChevronRight size={12} className="text-[#8b949e] opacity-60" />}
                </React.Fragment>
              ))}
              {isCurrentFileUnsaved && (
                <span className="ml-2 px-1.5 py-0.5 rounded-shape-xs bg-amber-500/15 text-amber-400 text-[10px] font-sans font-bold">
                  Modified
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isSvg && (
                <div className="flex items-center bg-[#0d1117] p-0.5 rounded-shape-xs border border-[#30363d]">
                  <button
                    type="button"
                    onClick={() => setSvgViewMode('preview')}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-shape-xs text-[11px] font-semibold cursor-pointer ${
                      svgViewMode === 'preview' ? 'bg-[#21262d] text-white' : 'text-[#8b949e] hover:text-white'
                    }`}
                  >
                    <Eye size={11} />
                    <span>Preview</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSvgViewMode('code')}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-shape-xs text-[11px] font-semibold cursor-pointer ${
                      svgViewMode === 'code' ? 'bg-[#21262d] text-white' : 'text-[#8b949e] hover:text-white'
                    }`}
                  >
                    <Code size={11} />
                    <span>Code</span>
                  </button>
                </div>
              )}

              {isCurrentFileUnsaved && onRevertFile && (
                <button
                  type="button"
                  onClick={() => onRevertFile(activeFile.path)}
                  className="flex items-center gap-1 px-2 py-1 rounded-shape-xs bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] text-[11px] font-semibold cursor-pointer"
                >
                  <RotateCcw size={11} />
                  <span>Revert</span>
                </button>
              )}

              {isCurrentFileUnsaved && onSaveFile && (
                <button
                  type="button"
                  onClick={() => onSaveFile(activeFile.path)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-shape-xs bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold cursor-pointer"
                >
                  <Save size={11} />
                  <span>Save</span>
                </button>
              )}

              {!isImage && (
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-shape-xs bg-[#21262d] border border-[#30363d] text-[11px] font-medium text-[#c9d1d9] hover:text-white hover:bg-[#30363d] transition-colors cursor-pointer"
                >
                  {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Open File Tabs (if multiple files opened) */}
        {openTabs.length > 1 && (
          <div className="h-8 bg-[#161b22]/60 border-b border-[#30363d] flex items-center px-1 overflow-x-auto custom-scrollbar font-sans shrink-0">
            {openTabs.map((tabPath) => {
              const isTabActive = tabPath === activeFilePath;
              const tabFile = files[tabPath];
              const isTabUnsaved = Boolean(unsavedFiles[tabPath]);
              return (
                <div
                  key={tabPath}
                  onClick={() => onSelectFile(tabPath)}
                  className={`group flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded-t-shape-xs border-t-2 cursor-pointer transition-colors shrink-0 ${
                    isTabActive
                      ? 'bg-[#0d1117] border-blue-500 text-white font-semibold'
                      : 'border-transparent text-[#8b949e] hover:text-[#e6edf3]'
                  }`}
                >
                  <span>{tabFile?.name || tabPath.split('/').pop() || tabPath}</span>
                  {isTabUnsaved && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                  <button
                    type="button"
                    onClick={(e) => onCloseTab(tabPath, e)}
                    className="p-0.5 rounded-shape-xs hover:bg-[#21262d] text-[#8b949e] hover:text-white cursor-pointer"
                  >
                    <X size={10} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Main Content Body: Either Image/SVG Preview OR Syntax-Highlighted Code Editor */}
        {activeFile ? (
          isImage || (isSvg && svgViewMode === 'preview') ? (
            <div
              className="flex-1 flex flex-col items-center justify-center p-8 overflow-auto"
              style={{
                background: 'repeating-conic-gradient(#161b22 0% 25%, #0d1117 0% 50%) 50% / 20px 20px'
              }}
            >
              <img
                src={isSvg ? svgPreviewSrc : activeFile.content}
                alt={activeFile.path}
                className="max-w-full max-h-[75vh] object-contain rounded-shape-xs shadow-2xl"
              />
            </div>
          ) : (
            <div className="flex-1 flex relative overflow-hidden bg-[#0d1117]">
              {/* Line numbers gutter */}
              <div
                ref={gutterRef}
                className="w-13 py-3 bg-[#0d1117] text-[#6e7681] text-right pr-3.5 select-none shrink-0 font-mono text-[12.5px] leading-[1.65] border-r border-[#21262d] overflow-hidden"
              >
                {lines.map((_, idx) => {
                  const num = idx + 1;
                  const isActiveLine = num === cursorPos.line;
                  return (
                    <div
                      key={num}
                      className={isActiveLine ? 'text-[#e6edf3] font-bold' : ''}
                    >
                      {num}
                    </div>
                  );
                })}
              </div>

              {/* Syntax-Highlighted Code Layer + Transparent Editable Textarea Overlay */}
              <div className="flex-1 relative overflow-hidden bg-[#0d1117]">
                <pre
                  ref={highlightPreRef}
                  aria-hidden="true"
                  className="absolute inset-0 m-0 py-3 px-4 font-mono text-[12.5px] leading-[1.65] whitespace-pre overflow-hidden pointer-events-none select-none text-left"
                >
                  {highlightedLinesHtml.map((html, idx) => {
                    const isActiveLine = idx + 1 === cursorPos.line;
                    return (
                      <div
                        key={idx}
                        className={isActiveLine ? 'bg-[#388bfd]/10 -mx-4 px-4' : ''}
                        dangerouslySetInnerHTML={{ __html: html }}
                      />
                    );
                  })}
                </pre>

                <textarea
                  ref={textareaRef}
                  value={activeFile.content}
                  onChange={(e) => {
                    onUpdateFileContent(activeFile.path, e.target.value);
                    updateCursorPosition(e.currentTarget);
                  }}
                  onClick={(e) => updateCursorPosition(e.currentTarget)}
                  onKeyUp={(e) => updateCursorPosition(e.currentTarget)}
                  onScroll={handleEditorScroll}
                  onKeyDown={handleKeyDown}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoComplete="off"
                  dir="ltr"
                  className="absolute inset-0 w-full h-full py-3 px-4 bg-transparent text-transparent caret-white font-mono text-[12.5px] leading-[1.65] whitespace-pre outline-none resize-none border-none overflow-auto custom-scrollbar text-left selection:bg-[#388bfd]/35 selection:text-transparent"
                />
              </div>
            </div>
          )
        ) : (
          <div className="flex-1 flex items-center justify-center text-[#8b949e] font-sans text-xs">
            {isAr ? 'اختر ملفاً من القائمة لعرضه وتعديله' : 'Select a file to view its code'}
          </div>
        )}

        {/* Bottom Status Bar (matches builder's .code-status) */}
        {activeFile && (
          <div className="h-6 px-3.5 bg-[#161b22] border-t border-[#30363d] flex items-center justify-between text-[11px] text-[#8b949e] font-mono shrink-0">
            <div className="flex items-center gap-4">
              {!isImage && (
                <>
                  <span>
                    Ln {cursorPos.line}, Col {cursorPos.col}
                  </span>
                  <span>{lineCount} lines</span>
                </>
              )}
              {isImage && <span>Image Asset Preview</span>}
            </div>
            <div className="flex items-center gap-4">
              <span>UTF-8</span>
              <span className="text-[#c9d1d9]">{getLanguageLabel(ext)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
