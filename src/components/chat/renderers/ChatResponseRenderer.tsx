import React, { useState, useEffect, useMemo, useRef } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CollapsibleTable } from './CollapsibleTable';
import { CodeBlock } from './CodeBlock';
import { MarkdownLink, BlockquoteWithActions } from './MarkdownElements';
import { Message } from '../types';
import { AssistantIcon } from '@/design-system';
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
  const processedLines = lines.map((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('|')) {
      inTable = true;
      // If last streaming line has pipes but doesn't end with a pipe, auto-close it
      if (idx === lines.length - 1 && !trimmed.endsWith('|')) {
        return line + ' |';
      }
    } else if (inTable && trimmed === '') {
      inTable = false;
    }
    return line;
  });

  return processedLines.join('\n');
}

/**
 * Detects RTL vs LTR language direction dynamically from string content.
 */
function detectLanguageDirection(text: string, defaultDir: 'ltr' | 'rtl' = 'rtl'): 'ltr' | 'rtl' {
  if (!text) return defaultDir;
  // Match Arabic / Hebrew character ranges
  const rtlRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0590-\u05FF]/;
  const firstStrongChar = text.match(/[\w\u0600-\u06FF\u0750-\u077F]/);
  if (firstStrongChar && rtlRegex.test(firstStrongChar[0])) {
    return 'rtl';
  }
  return rtlRegex.test(text.slice(0, 200)) ? 'rtl' : 'ltr';
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

  // Helper to safely format children with citations if provided
  const formatChildren = (children: any) => {
    if (renderChildrenWithCitations) {
      return renderChildrenWithCitations(children, msg);
    }
    return children;
  };

  // Smooth, real-time character typewriter buffer
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
      <h1 className="text-[16px] sm:text-[18px] font-black text-[var(--text-primary)] dark:text-slate-100 mt-5 mb-2.5 leading-snug border-b border-[var(--border-default)] dark:border-slate-800/80 pb-1 w-full text-start rtl:text-right ltr:text-left">
        {formatChildren(children)}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-[15px] sm:text-[16px] font-black text-[var(--text-primary)] dark:text-slate-100 mt-5 mb-2.5 leading-snug border-b border-[var(--border-default)] dark:border-slate-800/80 pb-1 w-full text-start rtl:text-right ltr:text-left">
        {formatChildren(children)}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-[13.5px] sm:text-[14.5px] font-extrabold text-[var(--fg-accent)]  mt-4 mb-1.5 leading-snug text-start rtl:text-right ltr:text-left">
        {formatChildren(children)}
      </h3>
    ),
    h4: ({ children }: any) => (
      <h4 className="text-[12.5px] sm:text-[13px] font-extrabold text-[var(--fg-accent)]/90  mt-4 mb-1.5 text-start rtl:text-right ltr:text-left">
        {formatChildren(children)}
      </h4>
    ),
    table: ({ children, node }: any) => {
      const linePos = node?.position?.start?.line || '0';
      const tableKey = `${msg.id || msg.client_id || 'msg'}_tbl_${linePos}`;
      const isStreamingTable = isLastMessage && (isGenerating || isStillTyping);
      return (
        <CollapsibleTable tableKey={tableKey} dir={detectedDir} isStreaming={isStreamingTable}>
          {children}
        </CollapsibleTable>
      );
    },
    thead: ({ children }: any) => (
      <thead className="bg-[var(--surface-subtle)] border-b border-[var(--border-default)] text-[var(--text-primary)] font-bold select-none transition-colors">
        {children}
      </thead>
    ),
    tbody: ({ children }: any) => (
      <tbody className="divide-y divide-[var(--border-default)]/50 bg-[var(--surface-card)] font-normal transition-colors">
        {children}
      </tbody>
    ),
    tr: ({ children }: any) => (
      <tr className="hover:bg-[var(--surface-subtle)]/50 odd:bg-transparent even:bg-[var(--surface-subtle)]/25 transition-colors">
        {children}
      </tr>
    ),
    th: ({ children, style }: any) => {
      const isCentered = style?.textAlign === 'center';
      return (
        <th
          className={`py-2.5 sm:py-3 px-3.5 sm:px-4 font-bold text-[var(--text-primary)] border-e border-[var(--border-default)]/60 last:border-e-0 min-w-[100px] sm:min-w-[120px] whitespace-normal break-words tabular-nums text-xs sm:text-[13px] leading-relaxed select-none ${
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
          className={`py-2.5 sm:py-3 px-3.5 sm:px-4 text-[var(--text-secondary)] border-e border-[var(--border-default)]/40 last:border-e-0 align-top leading-relaxed min-w-[100px] sm:min-w-[120px] whitespace-normal break-words tabular-nums text-xs sm:text-[13px] transition-colors ${
            isCentered ? 'text-center' : detectedDir === 'rtl' ? 'text-right' : 'text-left'
          }`}
          style={{
            ...style,
            textAlign: isCentered ? 'center' : detectedDir === 'rtl' ? 'right' : 'left'
          }}
        >
          {formatChildren(children)}
        </td>
      );
    },
    ul: ({ children }: any) => (
      <ul className="list-disc ps-5 pe-5 mb-3 space-y-1.5 text-sm text-[var(--text-secondary)] dark:text-slate-300 marker:text-[var(--fg-accent)]  text-start rtl:text-right ltr:text-left">
        {children}
      </ul>
    ),
    ol: ({ children }: any) => (
      <ol className="list-decimal ps-5 pe-5 mb-3 space-y-1.5 text-sm text-[var(--text-secondary)] dark:text-slate-300 marker:text-[var(--fg-accent)]  text-start rtl:text-right ltr:text-left">
        {children}
      </ol>
    ),
    li: ({ children }: any) => (
      <li className="leading-relaxed text-[var(--text-primary)] dark:text-slate-200 text-start rtl:text-right ltr:text-left">
        {formatChildren(children)}
      </li>
    ),
    code: ({ className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '');
      const isInline = !match && !String(children).includes('\n');
      if (isInline) {
        return (
          <code 
            dir="ltr" 
            className="inline-block mx-0.5 px-1.5 py-0.5 rounded-md bg-[var(--surface-subtle)] dark:bg-[var(--surface-code)] border border-[var(--border-default)] dark:border-slate-800/80 text-xs font-mono text-[var(--fg-accent)]  font-semibold dir-ltr text-left" 
            style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
            {...props}
          >
            {children}
          </code>
        );
      }
      return (
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
          <div className="my-4 max-w-full sm:max-w-[500px] w-full rounded-[var(--radius-md)] overflow-hidden border border-[var(--border-default)] shadow-sm bg-[var(--surface-card)]">
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
    p: ({ children, node }: any) => {
      const isStreamingActive = isLastMessage && (isGenerating || isStillTyping);
      const isLastParagraph =
        node && node.parent && node.parent.children[node.parent.children.length - 1] === node;

      return (
        <p className="mb-3.5 leading-[1.7] text-[var(--text-primary)] dark:text-slate-200 text-start rtl:text-right ltr:text-left inline-block w-full font-medium transition-all duration-75">
          {formatChildren(children)}
          {isStreamingActive && isLastParagraph && (
            <span className="inline-flex items-center gap-1 ms-1.5 align-middle select-none shrink-0 pointer-events-none">
              <AssistantIcon size={11} isSpinning={true} dir={detectedDir} className="text-accent shrink-0" />
              <span className="typing-cursor-accent" />
            </span>
          )}
        </p>
      );
    }
  }), [detectedDir, msg, theme, isLastMessage, isGenerating, isStillTyping, renderChildrenWithCitations, chatMarkdownComponents]);

  return (
    <div dir={detectedDir} className="w-full text-start rtl:text-right ltr:text-left transition-all">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {sanitizedContent}
      </Markdown>
    </div>
  );
};
