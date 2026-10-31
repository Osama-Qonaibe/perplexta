import React, { useRef, useEffect, useState } from 'react';
import { StudioMessage, type StudioMessageData } from './StudioMessage';
import { type StudioToolProgressStep } from './StudioBuildProgress';
import { StudioTodoList, type StudioTodoItem } from './StudioTodoList';
import { StudioClarifyCard, type StudioClarifyQuestion } from './StudioClarifyCard';
import { StudioMessageQueue, type StudioQueuedMessageItem } from './StudioMessageQueue';
import { StudioFollowUps } from './StudioFollowUps';
import { Sparkles, Loader2, ArrowDown, LayoutTemplate } from 'lucide-react';

interface StudioConversationProps {
  messages: StudioMessageData[];
  isStreaming?: boolean;
  onSelectSuggestion?: (prompt: string, label?: string) => void;
  onRegenerateSuggestions?: () => void;
  isRegeneratingSuggestions?: boolean;
  onSelectFile?: (filePath: string) => void;
  language?: string;
  // Build progress & tools
  toolSteps?: StudioToolProgressStep[];
  todos?: StudioTodoItem[];
  clarifyQuestions?: StudioClarifyQuestion[];
  clarifyLeadIn?: string;
  onSubmitClarification?: (answers: Record<string, string[]>) => void;
  onSkipClarification?: () => void;
  // Message Queue
  queuedMessages?: StudioQueuedMessageItem[];
  onRemoveQueued?: (id: string) => void;
  onEditQueued?: (id: string, newText: string) => void;
  onSendQueuedNow?: (id: string) => void;
  // Template origin note
  templateOrigin?: {
    slug: string;
    name: string;
    category?: string;
    thumbnail?: string;
  } | null;
}

export const StudioConversation: React.FC<StudioConversationProps> = ({
  messages,
  isStreaming = false,
  onSelectSuggestion,
  onRegenerateSuggestions,
  isRegeneratingSuggestions = false,
  onSelectFile,
  language = 'ar',
  toolSteps = [],
  todos = [],
  clarifyQuestions = [],
  clarifyLeadIn,
  onSubmitClarification,
  onSkipClarification,
  queuedMessages = [],
  onRemoveQueued,
  onEditQueued,
  onSendQueuedNow,
  templateOrigin
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const isAr = language === 'ar';
  const lang = isAr ? 'ar' : 'en';

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (!showScrollBottom) {
      scrollToBottom('smooth');
    }
  }, [messages, isStreaming, toolSteps.length, todos.length, clarifyQuestions.length]);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBottom(distanceFromBottom > 140);
  };

  // Find active running tool step (matches Builder's live tool spinner in handleMessageStream.js)
  const activeToolStep =
    toolSteps.find(s => s.status === 'running') ||
    (isStreaming && toolSteps.length > 0 ? toolSteps[toolSteps.length - 1] : null);

  // Check if the last message already embeds the current todos so we don't duplicate them
  const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
  const lastMsgHasTodos = Boolean(lastMsg && lastMsg.todos && lastMsg.todos.length > 0);

  // Extract latest suggestions from the last assistant message
  const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');
  const latestSuggestions = lastAssistantMsg?.suggestions || [];

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden font-sans">
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 w-full overflow-y-auto px-3.5 py-3 space-y-3 custom-scrollbar"
      >
        {/* Template Origin Banner (exact match to Builder's appendTemplateOriginNote in ui.js) */}
        {templateOrigin && (
          <div className="flex items-center justify-between gap-3 p-2.5 rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] text-xs shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              {templateOrigin.thumbnail ? (
                <img
                  src={templateOrigin.thumbnail}
                  alt={templateOrigin.name}
                  className="w-11 h-8 object-cover rounded-shape-xs border border-[var(--border-default)] shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-shape-xs bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                  <LayoutTemplate size={15} />
                </div>
              )}
              <div className="min-w-0">
                <div className="text-xs text-[var(--text-secondary)] leading-snug">
                  {isAr ? 'مبني من قالب ' : 'Built from the '}
                  <a
                    href={`/studio/template/${templateOrigin.slug}`}
                    target="_blank"
                    rel="opener"
                    className="font-bold text-[var(--text-primary)] underline decoration-[var(--border-default)] hover:decoration-blue-500 hover:text-blue-500 transition-colors"
                  >
                    {templateOrigin.name}
                  </a>
                  {isAr ? '.' : ' template.'}
                </div>
              </div>
            </div>
          </div>
        )}

        {messages.length === 0 && !isStreaming && clarifyQuestions.length === 0 ? (
          <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center p-6 space-y-2.5 text-[var(--text-muted)]">
            <div className="w-10 h-10 rounded-shape-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <Sparkles size={20} />
            </div>
            <p className="text-xs font-bold text-[var(--text-primary)]">
              {isAr ? 'اكتب فكرتك أو التعديل المطلوب بالأسفل' : 'Describe what you want to build or change below'}
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <StudioMessage
              key={msg.id}
              message={msg}
              onSelectFile={onSelectFile}
              language={language}
              isStreaming={isStreaming}
            />
          ))
        )}

        {/* Live Todo Checklist directly in the chat stream (when not yet attached to a message) */}
        {todos.length > 0 && !lastMsgHasTodos && (
          <StudioTodoList todos={todos} language={lang} />
        )}

        {/* Clarifying Questions Card (inline in chat stream like clarify.js) */}
        {clarifyQuestions.length > 0 && onSubmitClarification && onSkipClarification && (
          <StudioClarifyCard
            questions={clarifyQuestions}
            leadIn={clarifyLeadIn}
            onSubmitAnswers={onSubmitClarification}
            onSkip={onSkipClarification}
            language={lang}
          />
        )}

        {/* Live Tool Action Spinner (matches Builder's .tool-executing-spinner in handleMessageStream.js) */}
        {isStreaming && clarifyQuestions.length === 0 && (
          <div className="flex items-center gap-2 px-2 py-1.5 text-[var(--text-secondary)] text-xs font-medium">
            <Loader2 size={14} className="text-blue-500 animate-spin shrink-0" />
            <span className="truncate">
              {activeToolStep?.detail ||
                activeToolStep?.toolName ||
                (isAr ? 'جاري العمل على مشروعك...' : 'Working on your project...')}
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Floating Scroll-To-Bottom Button */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={() => scrollToBottom('smooth')}
          className="absolute bottom-14 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-shape-full bg-[var(--surface-card)] border border-[var(--border-default)] shadow-lg text-[11px] font-bold text-[var(--text-primary)] hover:border-blue-500 transition-all cursor-pointer"
        >
          <ArrowDown size={12} className="text-blue-500" />
          <span>{isAr ? 'أحدث الرسائل' : 'Latest messages'}</span>
        </button>
      )}

      {/* Follow-up Continue Suggestions Bar above Composer (exact match to Builder's #chatSuggestions) */}
      {!isStreaming &&
        clarifyQuestions.length === 0 &&
        (latestSuggestions.length > 0 || isRegeneratingSuggestions) &&
        onSelectSuggestion && (
          <div className="px-3.5 pt-1 pb-1.5 border-t border-[var(--border-default)]/50 bg-[var(--surface-subtle)]/30 shrink-0">
            <StudioFollowUps
              suggestions={latestSuggestions}
              onSelectSuggestion={onSelectSuggestion}
              onRegenerate={onRegenerateSuggestions}
              isRegenerating={isRegeneratingSuggestions}
              language={lang}
              disabled={isStreaming}
            />
          </div>
        )}

      {/* Queued Messages Bar (when user queues messages during active build) */}
      {queuedMessages.length > 0 && onRemoveQueued && onSendQueuedNow && (
        <div className="px-3 pb-2 shrink-0">
          <StudioMessageQueue
            queuedMessages={queuedMessages}
            onRemoveQueued={onRemoveQueued}
            onEditQueued={onEditQueued}
            onSendImmediate={onSendQueuedNow}
            language={lang}
          />
        </div>
      )}
    </div>
  );
};
