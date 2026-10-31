import React, { useEffect, useMemo, useRef } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CollapsibleTable } from './CollapsibleTable';
import { CodeBlock } from './CodeBlock';
import { MarkdownLink, BlockquoteWithActions } from './MarkdownElements';
import { Message } from '../types';
import { useTypewriterBuffer } from '../hooks/useTypewriterBuffer';
import { MediaFormatPlayer } from '../../MediaFormatPlayer';

interface ChatResponseRendererProps {
  content: string;
  isGenerating?: boolean;
  isLastMessage?: boolean;
  dir?: 'ltr' | 'rtl';
  theme?: string;
  msg: Message;
  renderChildrenWithCitations?: (children: any, msg: Message) => React.ReactNode;
  chatMarkdownComponents?: any;
}

/**
 * Sanitizes markdown streams so incomplete syntax (like open code fences
 * or unclosed table rows) doesn't cause layout jitter or flickering.
 */
function sanitizeStreamingMarkdown(text: string, isStreaming: boolean): string {
  if (!text) return '';
  if (!isStreaming) return text;

  let sanitized = text;

  // Auto-close code blocks if backticks count is odd
  const fenceMatches = sanitized.match(/```/g);
  if (fenceMatches && fenceMatches.length % 2 !== 0) {
    sanitized += '\n```';
  }

  // Auto-close unclosed double-asterisk bold syntax (e.g. "**Header" -> "**Header**")
  const boldMatches = sanitized.match(/\*\*/g);
  if (boldMatches && boldMatches.length % 2 !== 0) {
    sanitized += '**';
  }

  // Auto-complete incomplete markdown table rows
  const lines = sanitized.split('\n');
  let inTable = false;
  let headerCols = 0;

  const processedLines: string[] = [];
  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const trimmed = line.trim();

    if (trimmed.startsWith('|')) {
      if (!inTable) {
        inTable = true;
        const cells = trimmed.split('|').filter((_, i, arr) => i > 0 && i < arr.length - (trimmed.endsWith('|') ? 1 : 0));
        headerCols = Math.max(2, cells.length);
      }

      // If this is the last line while streaming and it's a partial separator row like "|---", synthesize a valid separator row
      if (idx === lines.length - 1) {
        if (/^\|[\s\-:|]*$/.test(trimmed)) {
          processedLines.push(`| ${Array.from({ length: headerCols }, () => '---').join(' | ')} |`);
          continue;
        }
        if (!trimmed.endsWith('|')) {
          processedLines.push(line + ' |');
          continue;
        }
      }
      processedLines.push(line);
    } else {
      if (inTable && trimmed === '') {
        inTable = false;
        headerCols = 0;
      }
      processedLines.push(line);
    }
  }

  return processedLines.join('\n');
}

/**
 * Detects RTL vs LTR language direction dynamically from string content.
 */
function detectLanguageDirection(text: string, defaultDir: 'ltr' | 'rtl' = 'rtl'): 'ltr' | 'rtl' {
  if (!text) return defaultDir;
  const rtlRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0590-\u05FF]/;
  const firstStrongChar = text.match(/[\w\u0600-\u06FF\u0750-\u077F]/);
  if (firstStrongChar && rtlRegex.test(firstStrongChar[0])) {
    return 'rtl';
  }
  return rtlRegex.test(text.slice(0, 200)) ? 'rtl' : 'ltr';
}

/**
 * Transforms academic methodology tags and status badges into micro-badges.
 */
function renderNodeWithBadges(node: any): any {
  if (typeof node === 'string') {
    const badgeRegex = /(\[(?:دراسة تجريبية|مراجعة أدبية|دراسة حالة|تحليل بعدي|منهج كمي|منهج نوعي|Empirical Study|Literature Review|Case Study|Meta-Analysis|Quantitative|Qualitative)\])/gi;
    if (badgeRegex.test(node)) {
      const parts = node.split(badgeRegex);
      return parts.map((part, index) => {
        const clean = part.replace(/[\[\]]/g, '').trim();
        const lower = clean.toLowerCase();
        if (['دراسة تجريبية', 'empirical study', 'منهج كمي', 'quantitative'].includes(lower)) {
          return (
            <span key={index} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[var(--status-success-subtle)] text-[var(--fg-success)] border border-[var(--fg-success)]/30 my-0.5 me-1.5 shadow-2xs select-none align-middle" style={{ unicodeBidi: 'isolate' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--fg-success)] shrink-0" />
              {clean}
            </span>
          );
        }
        if (['مراجعة أدبية', 'literature review'].includes(lower)) {
          return (
            <span key={index} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 my-0.5 me-1.5 shadow-2xs select-none align-middle" style={{ unicodeBidi: 'isolate' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
              {clean}
            </span>
          );
        }
        if (['دراسة حالة', 'case study'].includes(lower)) {
          return (
            <span key={index} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 my-0.5 me-1.5 shadow-2xs select-none align-middle" style={{ unicodeBidi: 'isolate' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              {clean}
            </span>
          );
        }
        if (['تحليل بعدي', 'meta-analysis', 'منهج نوعي', 'qualitative'].includes(lower)) {
          return (
            <span key={index} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 my-0.5 me-1.5 shadow-2xs select-none align-middle" style={{ unicodeBidi: 'isolate' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
              {clean}
            </span>
          );
        }
        return <span key={index} style={{ unicodeBidi: 'isolate' }}>{part}</span>;
      });
    }
  }
  if (Array.isArray(node)) {
    return node.map((child, i) => <React.Fragment key={i}>{renderNodeWithBadges(child)}</React.Fragment>);
  }
  return node;
}

/**
 * Enhances table cells with inline KPI badges and micro progress bars when a cell is a pure string metric.
 */
function enhanceTableCellValue(children: any, formattedFallback: () => React.ReactNode): React.ReactNode {
  const singleString =
    typeof children === 'string'
      ? children.trim()
      : Array.isArray(children) && children.length === 1 && typeof children[0] === 'string'
      ? children[0].trim()
      : null;

  if (singleString) {
    // 1. Positive / Negative Delta KPI (e.g. +14.2%, -3.5%, ▲ 18%)
    const deltaMatch = singleString.match(/^([+▲-▼])\s*(\d+(?:[.,]\d+)?%?)$/);
    if (deltaMatch) {
      const isPositive = deltaMatch[1] === '+' || deltaMatch[1] === '▲';
      return (
        <span
          className={`inline-flex items-center px-1.5 py-0.5 rounded-shape-xs text-[11px] font-mono font-semibold tabular-nums ${
            isPositive
              ? 'bg-[var(--status-success-subtle)] text-[var(--fg-success)] border border-[var(--fg-success)]/25'
              : 'bg-rose-500/10 text-rose-500 border border-rose-500/25'
          }`}
        >
          {singleString}
        </span>
      );
    }

    // 2. Standalone Percentage (0% - 100%) -> Tabular value + delicate micro progress bar
    const pctMatch = singleString.match(/^(\d{1,3}(?:\.\d+)?)%$/);
    if (pctMatch) {
      const pct = parseFloat(pctMatch[1]);
      if (pct >= 0 && pct <= 100) {
        return (
          <span className="inline-flex items-center gap-2">
            <span className="font-mono tabular-nums font-medium text-[var(--text-primary)]">{singleString}</span>
            <span className="w-11 h-1.5 rounded-shape-full bg-[var(--surface-subtle)] border border-[var(--border-default)]/40 overflow-hidden inline-block shrink-0 align-middle">
              <span
                className="block h-full rounded-shape-full bg-[var(--fg-accent)]/75"
                style={{ width: `${Math.min(100, Math.max(4, pct))}%` }}
              />
            </span>
          </span>
        );
      }
    }
  }

  return formattedFallback();
}

export const ChatResponseRenderer: React.FC<ChatResponseRendererProps> = ({
  content,
  isGenerating = false,
  isLastMessage = false,
  dir: parentDir = 'rtl',
  theme = 'dark',
  msg,
  renderChildrenWithCitations,
  chatMarkdownComponents
}) => {
  const wasGeneratingRef = useRef(isGenerating);
  useEffect(() => {
    wasGeneratingRef.current = isGenerating;
  }, [isGenerating]);

  const formatChildren = (children: any) => {
    let formatted = children;
    if (renderChildrenWithCitations) {
      formatted = renderChildrenWithCitations(children, msg);
    }
    return renderNodeWithBadges(formatted);
  };

  // Poised, deliberate character typewriter buffer
  const { displayedText, isStillTyping } = useTypewriterBuffer(
    content,
    isGenerating,
    isLastMessage
  );

  const sanitizedContent = sanitizeStreamingMarkdown(displayedText, isStillTyping);
  const detectedDir = useMemo(() => detectLanguageDirection(displayedText, parentDir), [displayedText, parentDir]);

  // STABLE MEMOIZED MARKDOWN COMPONENTS TO PREVENT DOM RE-CREATION & JITTERING
  const markdownComponents = useMemo(() => ({
    ...(chatMarkdownComponents || {}),
    h1: ({ children }: any) => (
      <h1 className="text-[17px] sm:text-[19px] font-bold text-[var(--text-primary)] mt-6 mb-3 leading-snug w-full text-start rtl:text-right ltr:text-left" style={{ unicodeBidi: 'isolate' }}>
        {formatChildren(children)}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-[15.5px] sm:text-[17px] font-bold text-[var(--text-primary)] mt-5 mb-2.5 leading-snug w-full text-start rtl:text-right ltr:text-left" style={{ unicodeBidi: 'isolate' }}>
        {formatChildren(children)}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-[14.5px] sm:text-[15.5px] font-semibold text-[var(--text-primary)] mt-4 mb-2 leading-snug text-start rtl:text-right ltr:text-left" style={{ unicodeBidi: 'isolate' }}>
        {formatChildren(children)}
      </h3>
    ),
    h4: ({ children }: any) => (
      <h4 className="text-[13.5px] sm:text-[14.5px] font-semibold text-[var(--text-secondary)] mt-3.5 mb-1.5 leading-snug text-start rtl:text-right ltr:text-left" style={{ unicodeBidi: 'isolate' }}>
        {formatChildren(children)}
      </h4>
    ),
    hr: () => (
      <hr className="my-5 border-t border-[var(--border-default)]/45 w-full" />
    ),
    table: ({ children, node }: any) => {
      const linePos = node?.position?.start?.line || '0';
      const tableKey = `${msg.id || msg.client_id || 'msg'}_tbl_${linePos}`;
      const isStreamingTable = isLastMessage && (isGenerating || isStillTyping);
      return (
        <div className="my-4 w-full">
          <CollapsibleTable tableKey={tableKey} dir={detectedDir} isStreaming={isStreamingTable}>
            {children}
          </CollapsibleTable>
        </div>
      );
    },
    thead: ({ children }: any) => (
      <thead className="bg-[var(--surface-subtle)]/45 border-b border-[var(--border-default)]/55 text-[var(--text-primary)] font-semibold text-xs sm:text-[13px] select-none transition-colors">
        {children}
      </thead>
    ),
    tbody: ({ children }: any) => (
      <tbody className="divide-y divide-[var(--border-default)]/35 bg-transparent font-normal transition-colors">
        {children}
      </tbody>
    ),
    tr: ({ children }: any) => (
      <tr className="hover:bg-[var(--surface-subtle)]/30 transition-colors">
        {children}
      </tr>
    ),
    th: ({ children, style }: any) => {
      const isCentered = style?.textAlign === 'center';
      return (
        <th
          className={`py-2.5 px-3.5 font-semibold text-[var(--text-primary)] min-w-[100px] sm:min-w-[120px] whitespace-normal break-words tabular-nums text-xs sm:text-[13px] leading-relaxed select-none ${
            isCentered ? 'text-center' : detectedDir === 'rtl' ? 'text-right' : 'text-left'
          }`}
          style={{
            ...style,
            textAlign: isCentered ? 'center' : detectedDir === 'rtl' ? 'right' : 'left'
          }}
        >
          {formatChildren(children)}
        </th>
      );
    },
    td: ({ children, style }: any) => {
      const isCentered = style?.textAlign === 'center';
      return (
        <td
          className={`py-2.5 px-3.5 text-[var(--text-secondary)] align-middle leading-relaxed min-w-[100px] sm:min-w-[120px] whitespace-normal break-words tabular-nums text-xs sm:text-[13px] transition-colors ${
            isCentered ? 'text-center' : detectedDir === 'rtl' ? 'text-right' : 'text-left'
          }`}
          style={{
            ...style,
            textAlign: isCentered ? 'center' : detectedDir === 'rtl' ? 'right' : 'left'
          }}
        >
          {enhanceTableCellValue(children, () => formatChildren(children))}
        </td>
      );
    },
    ul: ({ children }: any) => (
      <ul className="list-disc ps-5 pe-3 mb-4 space-y-2 text-[13.5px] sm:text-[14.5px] text-[var(--text-primary)] marker:text-[var(--text-muted)] text-start rtl:text-right ltr:text-left">
        {children}
      </ul>
    ),
    ol: ({ children }: any) => (
      <ol className="list-decimal ps-5 pe-3 mb-4 space-y-2 text-[13.5px] sm:text-[14.5px] text-[var(--text-primary)] marker:text-[var(--text-muted)] text-start rtl:text-right ltr:text-left">
        {children}
      </ol>
    ),
    li: ({ children }: any) => {
      const childrenStr = String(children || '');
      const isLatinBullet = /^[A-Za-z0-9\s.,:\-_\(\)]+$/.test(childrenStr.trim().slice(0, 30));
      return (
        <li 
          className="leading-[1.8] text-[13.5px] sm:text-[14.5px] text-[var(--text-primary)] text-start rtl:text-right ltr:text-left"
          dir={isLatinBullet ? 'ltr' : undefined}
          style={{ unicodeBidi: 'isolate' }}
        >
          {formatChildren(children)}
        </li>
      );
    },
    strong: ({ children }: any) => (
      <strong className="font-semibold text-[var(--text-primary)]" style={{ unicodeBidi: 'isolate' }}>
        {formatChildren(children)}
      </strong>
    ),
    code: ({ className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '');
      const isInline = !match && !String(children).includes('\n');
      if (isInline) {
        return (
          <code 
            dir="ltr" 
            className="inline mx-1 px-1.5 py-0.5 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)]/60 text-xs font-mono text-[var(--text-primary)] font-medium text-left align-baseline" 
            style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
            {...props}
          >
            {children}
          </code>
        );
      }
      return (
        <div className="my-5 w-full">
          <CodeBlock 
            className={className} 
            dir={detectedDir} 
            theme={theme} 
            isGenerating={isGenerating} 
            wasGenerating={wasGeneratingRef.current}
            isLastMessage={isLastMessage} 
            {...props}
          >
            {children}
          </CodeBlock>
        </div>
      );
    },
    a: ({ href, children }: any) => {
      const isVideo = href && /\.(mp4|webm|ogg|mov)$/i.test(href.split(/[#?]/)[0]);
      if (isVideo) {
        let aspect = '16:9';
        if (href.includes('#')) {
          const hash = href.split('#')[1];
          const params = new URLSearchParams(hash);
          if (params.has('aspect')) aspect = params.get('aspect') as string;
        }
        
        return (
          <div className="my-5 max-w-full sm:max-w-[500px] w-full rounded-shape-md overflow-hidden border border-[var(--border-default)] shadow-sm bg-[var(--surface-card)]">
            <MediaFormatPlayer 
              url={href.split('#')[0]} 
              aspectRatio={aspect as any} 
              autoPlay={false} 
              showControls={true} 
            />
          </div>
        );
      }
      return <MarkdownLink href={href}>{children}</MarkdownLink>;
    },
    blockquote: ({ children }: any) => <BlockquoteWithActions dir={detectedDir}>{children}</BlockquoteWithActions>,
    p: ({ children }: any) => {
      const childrenStr = String(children || '');
      const isLatinParagraph = /^[A-Za-z0-9\s.,:\-_\(\)]+$/.test(childrenStr.trim().slice(0, 30));

      return (
        <p 
          className="mb-4 leading-[1.8] text-[13.5px] sm:text-[14.5px] text-[var(--text-primary)] text-start rtl:text-right ltr:text-left w-full font-normal"
          dir={isLatinParagraph ? 'ltr' : undefined}
          style={{ unicodeBidi: 'isolate' }}
        >
          {formatChildren(children)}
        </p>
      );
    }
  }), [detectedDir, msg, theme, isLastMessage, isGenerating, isStillTyping, renderChildrenWithCitations, chatMarkdownComponents]);

  return (
    <div dir={detectedDir} className="w-full text-start rtl:text-right ltr:text-left leading-relaxed font-sans space-y-4">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {sanitizedContent}
      </Markdown>
    </div>
  );
};
