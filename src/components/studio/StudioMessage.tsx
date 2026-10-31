import React from 'react';
import { Paperclip, ExternalLink } from 'lucide-react';
import { StudioCodeBlock } from './StudioCodeBlock';
import { StudioTodoList, type StudioTodoItem } from './StudioTodoList';
import type { StudioAttachmentItem } from './types';

export interface StudioClarifyRecapItem {
  question: string;
  answer: string;
}

export interface StudioMessageData {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  openingContent?: string;
  todos?: StudioTodoItem[];
  clarifyRecap?: {
    skipped?: boolean;
    items?: StudioClarifyRecapItem[];
  };
  timestamp?: string;
  thinking?: string;
  filesUpdated?: string[];
  suggestions?: (string | { label: string; prompt: string })[];
  attachments?: StudioAttachmentItem[];
  templateOrigin?: {
    slug: string;
    name: string;
    thumbnail?: string;
  };
}

interface StudioMessageProps {
  message: StudioMessageData;
  onSelectSuggestion?: (prompt: string, label?: string) => void;
  onRegenerateSuggestions?: () => void;
  isRegeneratingSuggestions?: boolean;
  onSelectFile?: (filePath: string) => void;
  language?: string;
  isStreaming?: boolean;
}

export const StudioMessage: React.FC<StudioMessageProps> = ({
  message,
  language = 'ar'
}) => {
  const isUser = message.role === 'user';
  const isAr = language === 'ar';

  const renderInlineMarkdown = (line: string, lineKey: string) => {
    const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
    const parts = line.split(tokenRegex);

    return parts.map((part, i) => {
      if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
        return (
          <code
            key={`${lineKey}-${i}`}
            className="px-1.5 py-0.5 mx-0.5 rounded-shape-xs bg-[var(--surface-inset)] border border-[var(--border-default)] font-mono text-[11px] text-blue-500"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        return (
          <strong key={`${lineKey}-${i}`} className="font-bold text-[var(--text-primary)]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        return (
          <a
            key={`${lineKey}-${i}`}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-500 hover:underline font-medium"
          >
            <span>{linkMatch[1]}</span>
            <ExternalLink size={11} />
          </a>
        );
      }
      return <React.Fragment key={`${lineKey}-${i}`}>{part}</React.Fragment>;
    });
  };

  const renderMarkdownBlock = (blockText: string, blockIdx: number) => {
    const lines = blockText.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: { ordered: boolean; text: string }[] = [];

    const flushList = (keyPrefix: string) => {
      if (listItems.length === 0) return;
      const isOrdered = listItems[0].ordered;
      const ListTag = isOrdered ? 'ol' : 'ul';
      elements.push(
        <ListTag
          key={`${keyPrefix}-list`}
          className={`my-1.5 space-y-1 ps-5 ${isOrdered ? 'list-decimal' : 'list-disc'} text-[var(--text-primary)]`}
        >
          {listItems.map((item, idx) => (
            <li key={`${keyPrefix}-li-${idx}`} className="leading-relaxed">
              {renderInlineMarkdown(item.text, `${keyPrefix}-li-${idx}`)}
            </li>
          ))}
        </ListTag>
      );
      listItems = [];
    };

    lines.forEach((rawLine, lineIdx) => {
      const line = rawLine.trimEnd();
      const key = `b${blockIdx}-l${lineIdx}`;

      const ulMatch = line.match(/^\s*[-*]\s+(.+)$/);
      const olMatch = line.match(/^\s*\d+\.\s+(.+)$/);

      if (ulMatch) {
        if (listItems.length > 0 && listItems[0].ordered) flushList(key);
        listItems.push({ ordered: false, text: ulMatch[1] });
        return;
      }
      if (olMatch) {
        if (listItems.length > 0 && !listItems[0].ordered) flushList(key);
        listItems.push({ ordered: true, text: olMatch[1] });
        return;
      }

      flushList(key);

      if (!line.trim()) {
        elements.push(<div key={key} className="h-1.5" />);
        return;
      }

      if (line.startsWith('### ')) {
        elements.push(
          <h4 key={key} className="text-xs md:text-sm font-bold text-[var(--text-primary)] mt-2 mb-1">
            {renderInlineMarkdown(line.slice(4), key)}
          </h4>
        );
        return;
      }

      if (line.startsWith('## ')) {
        elements.push(
          <h3 key={key} className="text-sm md:text-base font-bold text-[var(--text-primary)] mt-2.5 mb-1">
            {renderInlineMarkdown(line.slice(3), key)}
          </h3>
        );
        return;
      }

      if (line.startsWith('# ')) {
        elements.push(
          <h2 key={key} className="text-base font-bold text-[var(--text-primary)] mt-3 mb-1.5">
            {renderInlineMarkdown(line.slice(2), key)}
          </h2>
        );
        return;
      }

      elements.push(
        <p key={key} className="leading-relaxed whitespace-pre-wrap">
          {renderInlineMarkdown(line, key)}
        </p>
      );
    });

    flushList(`b${blockIdx}-end`);
    return <div key={`md-${blockIdx}`} className="space-y-0.5">{elements}</div>;
  };

  const renderFormattedContent = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const firstLineEnd = part.indexOf('\n');
        const lang = firstLineEnd !== -1 ? part.slice(3, firstLineEnd).trim() || 'typescript' : 'typescript';
        const codeContent = firstLineEnd !== -1 ? part.slice(firstLineEnd + 1, -3) : part.slice(3, -3);
        return <StudioCodeBlock key={index} language={lang} code={codeContent} />;
      }
      return renderMarkdownBlock(part, index);
    });
  };

  // User Message Bubble (matches .message.user-message in Builder)
  if (isUser) {
    return (
      <div className="w-full flex flex-col items-end font-sans my-1">
        <div className="max-w-[88%] px-3.5 py-2.5 rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] text-xs md:text-[13.5px] text-[var(--text-primary)] leading-relaxed shadow-2xs break-words space-y-2">
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pb-1">
              {message.attachments.map((att) => (
                <div
                  key={att.id}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[11px] text-[var(--text-primary)]"
                >
                  <Paperclip size={11} className="text-blue-500 shrink-0" />
                  <span className="truncate max-w-[150px] font-medium">{att.name}</span>
                </div>
              ))}
            </div>
          )}
          <div>{renderFormattedContent(message.content)}</div>
        </div>
      </div>
    );
  }

  // Clarify Recap Bubble (matches .clarify-summary in clarify.js)
  if (message.clarifyRecap) {
    return (
      <div className="w-full my-1.5 font-sans">
        <div className="px-3.5 py-2.5 rounded-shape-md bg-[var(--surface-subtle)]/80 border border-[var(--border-default)] text-xs text-[var(--text-secondary)] space-y-1.5">
          {message.clarifyRecap.skipped ? (
            <p className="text-[var(--text-muted)] italic">
              {isAr
                ? 'تم تخطي الأسئلة — جاري البناء باستخدام أفضل الإعدادات الافتراضية.'
                : 'Skipped the questions — building with sensible defaults.'}
            </p>
          ) : (
            <>
              <div className="font-bold text-[var(--text-primary)]">
                {isAr ? 'تم اعتماد الاختيارات — جاري البناء وفق:' : 'Got it — building with:'}
              </div>
              <ul className="space-y-1 ps-4 list-disc">
                {(message.clarifyRecap.items || []).map((item, idx) => (
                  <li key={idx} className="leading-snug">
                    <span className="text-[var(--text-muted)]">{item.question}: </span>
                    <strong className="font-bold text-[var(--text-primary)]">{item.answer}</strong>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    );
  }

  // Assistant Message Stream (matches .message.ai-message + inline .todo-list in Builder)
  const hasOpening = Boolean(message.openingContent && message.openingContent.trim());
  const hasTodos = Boolean(message.todos && message.todos.length > 0);
  const hasClosing = Boolean(
    message.content &&
      message.content.trim() &&
      (!hasOpening || message.content.trim() !== message.openingContent?.trim())
  );

  return (
    <div className="w-full space-y-2.5 font-sans my-1">
      {/* 1. Opening Sentence Bubble (before Todo Checklist) */}
      {hasOpening && (
        <div className="text-xs md:text-[13.5px] text-[var(--text-primary)] leading-relaxed px-1 break-words">
          {renderFormattedContent(message.openingContent!)}
        </div>
      )}

      {/* 2. Inline Todo Checklist Card (persisted in chat history just like Builder's todo.js) */}
      {hasTodos && <StudioTodoList todos={message.todos!} language={isAr ? 'ar' : 'en'} />}

      {/* 3. Main / Closing Response Bubble */}
      {hasClosing && (
        <div className="text-xs md:text-[13.5px] text-[var(--text-primary)] leading-relaxed px-1 break-words">
          {renderFormattedContent(message.content)}
        </div>
      )}
    </div>
  );
};
