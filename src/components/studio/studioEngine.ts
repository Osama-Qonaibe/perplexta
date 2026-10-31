import type { StudioToolProgressStep } from './StudioBuildProgress';
import type { StudioClarifyQuestion } from './StudioClarifyCard';
import type { StudioTodoItem } from './StudioTodoList';
import type { StudioFileItem, StudioChatMessage, StudioToolCall } from './types';

export type { StudioToolProgressStep, StudioClarifyQuestion, StudioFileItem, StudioTodoItem, StudioChatMessage, StudioToolCall };

export interface TemplateNoteOptions {
  slug?: string;
  name: string;
  files: string[];
  instructions?: string;
}

/**
 * Template Context Note Builder
 * Faithfully ported from src/js/template-core.js (buildTemplateNote) in Osama-Qonaibe/builder.
 */
export function buildTemplateNote(opts: TemplateNoteOptions): string {
  const files = Array.isArray(opts.files) ? opts.files : [];
  const fileList = files.join(', ');
  const instructions = typeof opts.instructions === 'string' ? opts.instructions.trim() : '';

  const lines = [
    `This project started from the "${opts.name}" template. Its files (${fileList}) are already in the project workspace.`,
    `The live preview is already open and serves the workspace directly — it updates automatically whenever files change.`,
    `Before changing anything, inspect the existing files involved and build on the existing code. Keep what already works unless the user asks to replace it, and keep following every rule in the system prompt.`
  ];

  if (instructions) {
    lines.push(
      `Rules for this "${opts.name}" project. Keep following them through every change, even when the user rewrites or expands the app, unless the user explicitly asks to drop one: ${instructions}`
    );
  }

  return lines.join('\n\n');
}

/**
 * Common System Prompt - Assistant Behavior, Clarify, Todo, Surgical Edits & Verification
 * Faithfully ported & adapted from src/js/prompt.js (system_prompt_common) in Osama-Qonaibe/builder.
 */
export function getCommonSystemPrompt(language: string = 'ar'): string {
  const isAr = language === 'ar';
  return `You are a helpful AI assistant and senior software architect in Perplexta App Studio that builds and edits web apps, sites, and multi-file projects in a live workspace.
The live preview sits next to the chat and updates automatically as you write or edit files.

### WHEN TO ASK CLARIFYING QUESTIONS vs BUILD IMMEDIATELY:
- If the user's request is genuinely ambiguous or underspecified on key product decisions (e.g., "build a tracker", "اعمل موقع حجوزات", "make a store" without specifying what kind, target audience, or core workflow) AND clarification is allowed for this turn:
  1. Output a short, friendly one-line lead-in inside \`<perplexta_opening>...</perplexta_opening>\`.
  2. Output \`<perplexta_clarify>\` containing a JSON array of 1 to 3 short, plain-language multiple-choice questions (each with 2 to 4 concrete options, no technical jargon):
  \`\`\`
  <perplexta_clarify>
  [
    {
      "id": "q1",
      "question": "${isAr ? 'ما نوع المتجر أو المنتجات التي تريد عرضها؟' : 'What kind of products will the store sell?'}",
      "options": [
        { "id": "o1", "label": "${isAr ? 'منتجات رقمية واشتراكات (موصى به)' : 'Digital products & subscriptions (Recommended)'}", "recommended": true },
        { "id": "o2", "label": "${isAr ? 'أزياء وإكسسوارات' : 'Fashion & accessories'}" },
        { "id": "o3", "label": "${isAr ? 'إلكترونيات وأجهزة ذكية' : 'Electronics & gadgets'}" }
      ]
    }
  ]
  </perplexta_clarify>
  \`\`\`
  3. Stop immediately after \`</perplexta_clarify>\` and wait for the user's response. Do NOT write or edit files in the same turn as \`<perplexta_clarify>\`.
- Ask at most ONCE per request. Once the user answers, skips, or replies directly, proceed immediately to planning and building — NEVER ask a second round of clarifying questions.
- When a request is brief or underspecified but its intent is clear enough to act on, flesh it out into a complete, cohesive, high-quality application with realistic data, working interactivity, and polished styling rather than a skeletal minimum version.

### COMMUNICATION & RESPONSE STYLE:
- **Opening Line**: Start every build or edit turn with ONE short, friendly sentence inside \`<perplexta_opening>...</perplexta_opening>\` telling the user what you are about to build or update.
- **Silent Execution**: While executing blueprint planning, task updates, and file writes/edits, do NOT output running commentary between file blocks.
- **Closing Summary**: After closing the last file or edit block, write a concise, clear summary (2–4 sentences in ${isAr ? 'Arabic' : 'English'}) explaining what was built or updated and how the user can try it in the live preview.
- **Plain Language**: Never mention internal tag or tool names (\`perplexta_blueprint\`, \`perplexta_file\`, \`perplexta_edit\`, \`TodoWrite\`, \`AskClarifyingQuestions\`, etc.) to the user.

### TASK TRACKING (PLAIN-LANGUAGE TODOS):
- Include a \`"todos"\` array inside \`<perplexta_blueprint>\` (or inside \`<perplexta_todo>[...]</perplexta_todo>\`) with 3 to 6 short, plain-language task descriptions written for a non-technical user (e.g., "${isAr ? 'إنشاء الصفحة الرئيسية وهيكلة الواجهة' : 'Creating the main page layout'}", "${isAr ? 'إضافة التنسيقات البصرية والألوان' : 'Adding visual styling and theme'}", "${isAr ? 'برمجة التفاعل والوظائف الحية' : 'Making controls and modals interactive'}").
- Never use raw file paths or internal technical jargon as todo titles.

### READING, WRITING & SURGICAL EDITING:
- **Existing Projects & Templates (THE "NEVER DESTROY, ONLY EVOLVE" RULE)**:
  - When modifying an existing project or starter template, carefully inspect the existing files provided in the context.
  - Keep everything that already works unless the user explicitly asks to replace it.
  - For targeted changes to existing files, you may either use surgical search-and-replace blocks inside \`<perplexta_edit path="..."><<<< SEARCH\\n...\\n====\\n...\\n>>>></perplexta_edit>\` (where the SEARCH block matches existing lines accurately) OR output the updated file in \`<perplexta_file path="...">...</perplexta_file>\` with all existing functionality preserved.
- **New Projects**:
  - Organize the project into a clean, modular multi-file tree (\`index.html\`, \`styles/main.css\`, \`src/data/...\`, \`src/components/...\`, \`src/app.js\`, and \`db/schema.sql\` when data-driven).
  - Write every file completely without placeholders (\`// ... rest of code\`) and without markdown code fences inside \`<perplexta_file>\`.
  - Ensure all interactive buttons, filters, modals, forms, and tabs have working event listeners.
`;
}

/**
 * Dynamic System Prompt Builder
 * Faithfully ported from src/js/prompt.js (system_prompt_dynamic) in Osama-Qonaibe/builder.
 */
export function getDynamicSystemPrompt(
  projectName: string,
  files: Record<string, StudioFileItem>,
  activeFilePath: string,
  templateOrigin?: {
    slug?: string;
    name: string;
    instructions?: string;
  } | null,
  language: string = 'ar'
): string {
  const filePaths = Object.keys(files);
  const fileTreeSummary = Object.values(files)
    .map(f => `- ${f.path} (${(f.content || '').length} chars)`)
    .join('\n');

  const templateNote = templateOrigin?.name
    ? buildTemplateNote({
        slug: templateOrigin.slug,
        name: templateOrigin.name,
        files: filePaths,
        instructions: templateOrigin.instructions
      })
    : '';

  return `${getCommonSystemPrompt(language)}

### DYNAMIC WORKSPACE CONTEXT:
- **Project Name**: ${projectName}
- **Active File in Editor**: ${activeFilePath || 'index.html'}
- **Language Locale**: ${language === 'ar' ? 'Arabic (RTL UI Context)' : 'English (LTR UI Context)'}

${templateNote ? `### TEMPLATE CONTEXT & PERMANENT RULES:\n${templateNote}\n` : ''}
### WORKSPACE FILE TREE (${filePaths.length} files):
${fileTreeSummary || '(Empty workspace)'}
`;
}

/**
 * Friendly plain-language task label generator for files (like todo.js in Builder)
 */
export function friendlyTodoLabelForFile(filePath: string, isNewProject: boolean, language: string = 'ar'): string {
  const isAr = language === 'ar';
  const lower = filePath.toLowerCase();
  if (lower === 'index.html' || lower.endsWith('.html')) {
    return isAr
      ? (isNewProject ? 'إنشاء الصفحة الرئيسية وهيكلة الواجهة' : 'تحديث عناصر الصفحة الرئيسية والواجهة')
      : (isNewProject ? 'Creating the main page and layout' : 'Updating the main page layout');
  }
  if (lower.endsWith('.css')) {
    return isAr
      ? 'إضافة التنسيقات البصرية والألوان المتجاوبة'
      : 'Adding visual styling and responsive layout';
  }
  if (lower.includes('data') || lower.includes('mock') || lower.endsWith('.json')) {
    return isAr
      ? 'تجهيز البيانات والمحتوى التفاعلي'
      : 'Preparing realistic sample data and content';
  }
  if (lower.includes('component') || lower.includes('ui') || lower.endsWith('.jsx') || lower.endsWith('.tsx')) {
    return isAr
      ? 'بناء المكونات والبطاقات التفاعلية'
      : 'Building interactive UI components and views';
  }
  if (lower.endsWith('.sql')) {
    return isAr
      ? 'تهيئة جداول قاعدة البيانات والسجلات الأولية'
      : 'Setting up database tables and initial records';
  }
  if (lower.endsWith('.js') || lower.endsWith('.ts')) {
    return isAr
      ? 'برمجة التفاعل والمنطق التشغيلي للتطبيق'
      : 'Making the application interactive';
  }
  return isAr ? `تجهيز وتحديث ${filePath}` : `Updating ${filePath}`;
}

/**
 * 4-Tier File Edit Matcher (applyFileEdit)
 * Faithfully ported from src/js/helpers.js in Osama-Qonaibe/builder.
 *
 * Tier 0: Exact substring match (with overlapping check).
 * Tier 1: Trailing-whitespace-flexible per line (preserves untouched whitespace).
 * Tier 2: Leading + trailing whitespace flexible with uniform indent delta recovery.
 * Tier 3: Length-preserving Unicode look-alike normalization (smart quotes, NBSP, dashes).
 * Diagnostic: Reports the closest matching line region when no match is found.
 */
const UNICODE_NORM_MAP: Record<string, string> = {
  '\u2018': "'", '\u2019': "'", '\u201A': "'", '\u201B': "'", '\u2032': "'",
  '\u201C': '"', '\u201D': '"', '\u201E': '"', '\u201F': '"', '\u2033': '"',
  '\u00A0': ' ', '\u2002': ' ', '\u2003': ' ', '\u2009': ' ', '\u202F': ' ',
  '\u2010': '-', '\u2011': '-', '\u2012': '-', '\u2013': '-', '\u2014': '-'
};
const UNICODE_NORM_RE = new RegExp(Object.keys(UNICODE_NORM_MAP).join('|'), 'g');

function normalizeUnicodeLookalikes(str: string): string {
  return str.replace(UNICODE_NORM_RE, ch => UNICODE_NORM_MAP[ch] || ch);
}

export function applyFileEdit(content: string, oldContent: string, newContent: string): string {
  if (typeof content !== 'string') throw new Error('File content must be a string.');
  if (typeof oldContent !== 'string' || oldContent.length === 0) {
    throw new Error('old_content must be a non-empty string.');
  }
  if (typeof newContent !== 'string') {
    throw new Error('new_content must be a string.');
  }

  const usesCRLF = content.includes('\r\n');
  const normContent = content.replace(/\r\n/g, '\n');
  const normOld = oldContent.replace(/\r\n/g, '\n');
  const normNew = newContent.replace(/\r\n/g, '\n');

  const finalize = (result: string) => (usesCRLF ? result.replace(/\n/g, '\r\n') : result);

  // Tier 0: Exact match
  const exactIdx = normContent.indexOf(normOld);
  if (exactIdx !== -1) {
    const secondIdx = normContent.indexOf(normOld, exactIdx + 1);
    if (secondIdx !== -1) {
      throw new Error('Multiple occurrences of old_content found. Provide more surrounding context lines.');
    }
    return finalize(
      normContent.slice(0, exactIdx) + normNew + normContent.slice(exactIdx + normOld.length)
    );
  }

  const contentLines = normContent.split('\n');
  const oldLines = normOld.split('\n');
  if (oldLines.length > 1 && oldLines[oldLines.length - 1] === '') {
    oldLines.pop();
  }
  const n = oldLines.length;

  const lineStartOffsets: number[] = [0];
  for (let i = 0; i < contentLines.length; i++) {
    lineStartOffsets.push(lineStartOffsets[i] + contentLines[i].length + 1);
  }

  const spliceLines = (startLine: number, endLine: number, replacement: string) => {
    const startOffset = lineStartOffsets[startLine];
    const endOffset = lineStartOffsets[endLine] - 1;
    return finalize(
      normContent.slice(0, startOffset) +
      replacement +
      normContent.slice(Math.min(endOffset, normContent.length))
    );
  };

  if (n > 0 && n <= contentLines.length) {
    // Tier 1: Trailing-whitespace-flexible match
    const rtrim = (s: string) => s.replace(/[ \t]+$/, '');
    const oldRTrimmed = oldLines.map(rtrim);
    const tier1Matches: number[] = [];
    for (let i = 0; i <= contentLines.length - n; i++) {
      let ok = true;
      for (let j = 0; j < n; j++) {
        if (rtrim(contentLines[i + j]) !== oldRTrimmed[j]) {
          ok = false;
          break;
        }
      }
      if (ok) tier1Matches.push(i);
    }
    if (tier1Matches.length === 1) {
      return spliceLines(tier1Matches[0], tier1Matches[0] + n, normNew);
    }
    if (tier1Matches.length > 1) {
      throw new Error(`Multiple occurrences (${tier1Matches.length}) of old_content found (matching ignoring trailing spaces).`);
    }

    // Tier 2: Leading + trailing whitespace flexible with uniform indent delta
    const strip = (s: string) => s.trim();
    const leadingSpaces = (s: string) => {
      const m = s.match(/^[ \t]*/);
      return m ? m[0].replace(/\t/g, '  ').length : 0;
    };
    const oldStripped = oldLines.map(strip);
    const hasNonBlank = oldStripped.some(l => l.length > 0);
    if (hasNonBlank) {
      const tier2Matches: Array<{ start: number; delta: number }> = [];
      for (let i = 0; i <= contentLines.length - n; i++) {
        let ok = true;
        let delta: number | null = null;
        for (let j = 0; j < n; j++) {
          if (strip(contentLines[i + j]) !== oldStripped[j]) {
            ok = false;
            break;
          }
          if (oldStripped[j].length > 0) {
            const d = leadingSpaces(contentLines[i + j]) - leadingSpaces(oldLines[j]);
            if (delta === null) delta = d;
            else if (d !== delta) {
              ok = false;
              break;
            }
          }
        }
        if (ok) tier2Matches.push({ start: i, delta: delta || 0 });
      }
      if (tier2Matches.length === 1) {
        const { start, delta } = tier2Matches[0];
        const newLines = normNew.split('\n');
        const adjustedNew = newLines
          .map(line => {
            if (line.trim().length === 0) return line;
            if (delta > 0) return ' '.repeat(delta) + line;
            if (delta < 0) {
              const remove = Math.min(-delta, leadingSpaces(line));
              return line.slice(remove);
            }
            return line;
          })
          .join('\n');
        return spliceLines(start, start + n, adjustedNew);
      }
    }
  }

  // Tier 3: Length-preserving Unicode look-alike normalization
  const uContent = normalizeUnicodeLookalikes(normContent);
  const uOld = normalizeUnicodeLookalikes(normOld);
  const uIdx = uContent.indexOf(uOld);
  if (uIdx !== -1 && uContent.indexOf(uOld, uIdx + 1) === -1) {
    return finalize(
      normContent.slice(0, uIdx) + normNew + normContent.slice(uIdx + normOld.length)
    );
  }

  throw new Error('old_content not found in file.');
}

/**
 * Apply multiple sequential edits atomically (ported from src/tools/fs/multi_edit.js)
 */
export function applyMultiFileEdits(
  content: string,
  edits: Array<{ oldContent: string; newContent: string }>
): string {
  let working = content;
  for (let i = 0; i < edits.length; i++) {
    const { oldContent, newContent } = edits[i];
    working = applyFileEdit(working, oldContent, newContent);
  }
  return working;
}

/**
 * Strip lone UTF-16 surrogates recursively (ported from wellFormedDeep in src/js/helpers.js)
 */
export function wellFormedDeep<T>(value: T): T {
  if (typeof value === 'string') {
    const wellFormed = (value as any).toWellFormed
      ? (value as any).toWellFormed()
      : value.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '\uFFFD');
    return wellFormed as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map(wellFormedDeep) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = wellFormedDeep(v);
    }
    return out as T;
  }
  return value;
}

/**
 * Creates a structured tool call record conforming to the Studio Tool Execution Contract
 */
export function createStudioToolCall(
  name: string,
  args?: Record<string, any>,
  status: 'pending' | 'executing' | 'completed' | 'failed' = 'completed',
  options: { turnId?: string; result?: any; error?: string } = {}
): StudioToolCall {
  return {
    id: `tool_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    args: args || {},
    status,
    result: options.result,
    error: options.error,
    turnId: options.turnId,
    timestamp: new Date().toISOString()
  };
}

/**
 * Formats structured tool execution results into a closed-loop context block for the model
 */
export function formatToolExecutionReport(calls?: StudioToolCall[]): string {
  if (!Array.isArray(calls) || calls.length === 0) return '';
  const lines = calls.map(c => {
    const argsSummary = c.args ? Object.entries(c.args).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(', ') : '';
    if (c.status === 'failed' || c.error) {
      return `- [TOOL FAILED] ${c.name}(${argsSummary}): ${c.error || 'Execution encountered an error'}`;
    }
    const resultSummary = typeof c.result === 'string' ? c.result : c.result ? JSON.stringify(c.result).slice(0, 120) : 'OK';
    return `- [TOOL COMPLETED] ${c.name}(${argsSummary}): ${resultSummary}`;
  });
  return `[Tool Execution Results in this Turn]:\n${lines.join('\n')}`;
}

/**
 * Intelligent compaction for older conversation turns (replaces naive 160-char slicing)
 * Preserves user goals, files created/modified, and architectural decisions without losing context.
 */
function compactOlderConversationTurn(msg: StudioChatMessage): string {
  const role = (msg.role || 'user').toUpperCase();
  const text = String(msg.text || msg.content || '').trim();
  const files = Array.isArray(msg.filesUpdated) && msg.filesUpdated.length > 0 ? ` (Files: ${msg.filesUpdated.join(', ')})` : '';
  const todos = Array.isArray(msg.todos) && msg.todos.length > 0 
    ? ` [Todos: ${msg.todos.map(t => t.title).join('; ')}]` 
    : '';

  // For tool execution feedback
  let toolSummary = '';
  if (Array.isArray(msg.toolCalls) && msg.toolCalls.length > 0) {
    const summary = msg.toolCalls.map(tc => `${tc.name}:${tc.status}`).join(', ');
    toolSummary = ` [Tools: ${summary}]`;
  }

  // Extract clean first paragraph or core intent up to 400 characters, respecting sentence boundaries
  let cleanText = text
    .replace(/<perplexta_opening>[\s\S]*?<\/perplexta_opening>/gi, '')
    .replace(/<perplexta_blueprint>[\s\S]*?<\/perplexta_blueprint>/gi, '')
    .replace(/<perplexta_file[\s\S]*?<\/perplexta_file>/gi, '')
    .replace(/<perplexta_edit[\s\S]*?<\/perplexta_edit>/gi, '')
    .replace(/```[\s\S]*?```/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleanText.length > 400) {
    const periodIdx = cleanText.indexOf('.', 250);
    if (periodIdx !== -1 && periodIdx < 500) {
      cleanText = cleanText.slice(0, periodIdx + 1);
    } else {
      cleanText = cleanText.slice(0, 400) + '...';
    }
  }

  return `- [${role}${files}${toolSummary}${todos}]: ${cleanText || 'Project configuration and updates.'}`;
}

/**
 * Prepare Conversation History for AI Model Dispatch
 * Closed-loop architecture faithful to Osama-Qonaibe/builder:
 * - Preserves structured tool execution reports (successes, errors, file changes)
 * - Retains role fidelity without coercing system/tool messages into generic assistant text
 * - Eliminates naive 160-char truncation; uses architectural compaction for older turns
 * - Keeps recent turns 100% full, including full tool feedback so the model can self-correct
 */
export function prepareHistoryForAI(
  messages: StudioChatMessage[],
  options: { maxMessages?: number } = {}
): Array<{ role: 'user' | 'assistant' | 'system'; content: string }> {
  const maxMessages = options.maxMessages ?? 16;
  if (!Array.isArray(messages) || messages.length === 0) return [];

  const processedMessages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];

  for (const msg of messages) {
    if (!msg) continue;
    let text = String(msg.text || msg.content || '').trim();

    // Append text attachments if present
    if (msg.role === 'user' && Array.isArray(msg.attachments) && msg.attachments.length > 0) {
      const docBlocks = msg.attachments
        .filter(att => att && att.content)
        .map(att => `--- Attached file: ${att.name} ---\n${att.content}`);
      if (docBlocks.length > 0) {
        text = text ? `${text}\n\n${docBlocks.join('\n\n')}` : docBlocks.join('\n\n');
      }
    }

    // Embed structured tool execution outcome for closed-loop self-correction
    if (msg.role === 'assistant') {
      const toolReport = formatToolExecutionReport(msg.toolCalls);
      if (toolReport) {
        text = text ? `${text}\n\n${toolReport}` : toolReport;
      }
      if (Array.isArray(msg.filesUpdated) && msg.filesUpdated.length > 0 && !text.includes('Files updated:')) {
        text += `\n[Files updated in workspace: ${msg.filesUpdated.join(', ')}]`;
      }
    }

    // Role mapping: preserve 'system', map 'tool' to 'user' with explicit tool prefix if needed
    let role: 'user' | 'assistant' | 'system' = 'user';
    if (msg.role === 'assistant') {
      role = 'assistant';
    } else if (msg.role === 'system') {
      role = 'system';
    } else if (msg.role === 'tool') {
      role = 'user';
      text = `[Tool Execution Response]:\n${text}`;
    }

    if (!text) continue;

    processedMessages.push({
      role,
      content: wellFormedDeep(text)
    });
  }

  // Long-context compaction when history exceeds maxMessages
  if (processedMessages.length > maxMessages) {
    const olderRaw = messages.slice(0, messages.length - maxMessages);
    const recentTurns = processedMessages.slice(processedMessages.length - maxMessages);
    const summaryLines = olderRaw
      .map(compactOlderConversationTurn)
      .join('\n');

    return [
      {
        role: 'user',
        content: `[Previous Session Architecture & Milestone Summary (${olderRaw.length} earlier turns)]:\n${summaryLines}\n[End of previous summary. Now continuing with current project state.]`
      },
      ...recentTurns
    ];
  }

  return processedMessages;
}

/**
 * Format Clarification Recap for Chat History & Prompt Resumption
 * Faithfully ported from src/tools/chat_ui/clarify.js in Osama-Qonaibe/builder.
 */
export function formatClarificationRecap(
  questions: StudioClarifyQuestion[],
  answers: Record<string, string[]>,
  options: { skipped?: boolean; directReply?: string; language?: string } = {}
): { userDisplayMessage: string; promptContext: string } {
  const isAr = (options.language || 'ar') === 'ar';

  if (options.directReply && options.directReply.trim()) {
    const reply = options.directReply.trim();
    return {
      userDisplayMessage: reply,
      promptContext: `User replied directly to clarifying questions: "${reply}". Proceed immediately to build the complete solution without asking further clarifying questions.`
    };
  }

  if (options.skipped) {
    return {
      userDisplayMessage: isAr
        ? 'تم تخطي الأسئلة التوضيحية — المتابعة بأفضل الإعدادات الافتراضية.'
        : 'Skipped clarifying questions — proceeding with best defaults.',
      promptContext: `User skipped the clarifying questions. Choose sensible, high-quality defaults for each question and build the complete application immediately without asking again.`
    };
  }

  const lines: string[] = [];
  const contextPairs: string[] = [];

  for (const q of questions) {
    const selected = answers[q.id] || [];
    const ansText = selected.length > 0 ? selected.join('، ') : (isAr ? 'افتراضي' : 'Default');
    lines.push(`• **${q.question}**: ${ansText}`);
    contextPairs.push(`- ${q.question} -> ${ansText}`);
  }

  return {
    userDisplayMessage: lines.join('\n'),
    promptContext: `Clarifying questions answered by user:\n${contextPairs.join('\n')}\nNow build the complete application immediately honoring these exact choices. Do NOT ask any more clarifying questions.`
  };
}

/**
 * Post-Turn Follow-Up Suggestion Generator & Filter
 * Ported & adapted from src/js/app.js (SUGGESTION_SYSTEM_PROMPT & generateContinueSuggestions) in Osama-Qonaibe/builder.
 * Inspects the current app's HTML/code so it never suggests features the app already has,
 * and filters out recently shown/clicked labels (_recentSuggestionLabels).
 */
export function buildFollowUpSuggestions(
  files: Record<string, { content?: string; path?: string }>,
  recentLabels: string[],
  templateSuggestions?: Array<string | { label: string; prompt: string }>,
  language: string = 'ar'
): Array<{ label: string; prompt: string }> {
  const isAr = language === 'ar';
  const recentSet = new Set(recentLabels.map(s => s.trim().toLowerCase()));

  const combinedCode = Object.values(files || {})
    .map(f => f?.content || '')
    .join('\n')
    .toLowerCase();

  const candidates: Array<{ label: string; prompt: string; checkPresent?: RegExp }> = [];

  // 1. Include template-specific suggestions first if not yet used
  if (Array.isArray(templateSuggestions)) {
    for (const item of templateSuggestions) {
      if (typeof item === 'string' && item.trim()) {
        candidates.push({ label: item.trim(), prompt: item.trim() });
      } else if (item && typeof item === 'object' && (item.label || item.prompt)) {
        candidates.push({
          label: (item.label || item.prompt).trim(),
          prompt: (item.prompt || item.label).trim()
        });
      }
    }
  }

  // 2. Context-aware candidates that check what the app does NOT already have
  const pool: Array<{ label: string; prompt: string; checkPresent?: RegExp }> = isAr
    ? [
        {
          label: 'إضافة بحث وتصفية فورية',
          prompt: 'أضف شريط بحث فوري وأزرار تصفية حسب الفئة لتسهيل الوصول للعناصر في الصفحة مع تحديث النتائج لحظياً.',
          checkPresent: /searchinput|filterby|بحث فوري|type=["']search["']/i
        },
        {
          label: 'تصدير واستيراد البيانات (CSV / JSON)',
          prompt: 'أضف ميزة تصدير البيانات الحالية إلى ملف CSV أو JSON مع إمكانية طباعة تقرير منسق.',
          checkPresent: /text\/csv|application\/json|downloadcsv|exportdata/i
        },
        {
          label: 'حفظ البيانات تلقائياً في المتصفح',
          prompt: 'اربط جميع النماذج والتغييرات في التطبيق بـ localStorage بحيث تبقى البيانات محفوظة عند إعادة تحميل الصفحة مع زر لاستعادة البيانات الافتراضية.',
          checkPresent: /localstorage\.setitem/i
        },
        {
          label: 'إضافة نافذة تفاصيل وعرض سريع',
          prompt: 'أضف نافذة منبثقة (Modal) احترافية تعرض التفاصيل الكاملة عند النقر على أي عنصر مع إمكانية التعديل السريع.',
          checkPresent: /modal-backdrop|quick-view|تفاصيل العنصر/i
        },
        {
          label: 'إضافة لوحة إحصائيات ورسوم بيانية',
          prompt: 'أضف قسم ملخص إحصائي تفاعلي في أعلى التطبيق يعرض المؤشرات الرئيسية ونسب الإنجاز بشكل بصري واضح.',
          checkPresent: /chart|analytics-summary|نسبة الإنجاز/i
        },
        {
          label: 'دعم اختصارات لوحة المفاتيح والتنقل السريع',
          prompt: 'أضف دعم اختصارات لوحة المفاتيح للعمليات الأساسية (مثل الإضافة السريعة والبحث والإغلاق) مع نافذة مساعدة صغيرة تعرض الاختصارات.',
          checkPresent: /keydown.*ctrlkey|keyboard shortcuts/i
        },
        {
          label: 'نظام إشعارات وتنبيهات تفاعلي (Toasts)',
          prompt: 'أضف نظام إشعارات منبثقة (Toast Notifications) أنيق يؤكد نجاح العمليات مثل الإضافة أو الحفظ أو الحذف.',
          checkPresent: /showtoast|toast-container/i
        },
        {
          label: 'تخصيص المظهر والألوان (Themes)',
          prompt: 'أضف مبدّل للوضع الليلي والنهاري مع إمكانية اختيار لون التمييز الأساسي للتطبيق وحفظ تفضيل المستخدم.',
          checkPresent: /theme-toggle|dark-mode-toggle/i
        }
      ]
    : [
        {
          label: 'Add live search & category filter',
          prompt: 'Add an instant search bar and category filter pills that filter the items on the page in real time.',
          checkPresent: /searchinput|filterby|type=["']search["']/i
        },
        {
          label: 'Export data to CSV / JSON',
          prompt: 'Add an Export button that lets users download the current data as a CSV or JSON file and print a clean summary.',
          checkPresent: /text\/csv|downloadcsv|exportdata/i
        },
        {
          label: 'Persist state in localStorage',
          prompt: 'Save all user changes and entries to localStorage automatically so data persists across page reloads, with a Reset Sample Data option.',
          checkPresent: /localstorage\.setitem/i
        },
        {
          label: 'Add detail & quick-edit modal',
          prompt: 'Add an interactive detail modal when clicking any item so users can view full information and edit fields in place.',
          checkPresent: /modal-backdrop|quick-view/i
        },
        {
          label: 'Add interactive metrics & summary cards',
          prompt: 'Add an interactive analytics summary bar showing key totals, completion percentages, and visual progress bars.',
          checkPresent: /chart|analytics-summary/i
        },
        {
          label: 'Add keyboard shortcuts & quick actions',
          prompt: 'Add keyboard shortcuts for common actions (like quick search, new item, and closing modals) with a compact shortcut hint badge.',
          checkPresent: /keydown.*ctrlkey|keyboard shortcuts/i
        },
        {
          label: 'Add toast notifications & undo',
          prompt: 'Add smooth toast notifications for create, update, and delete actions including a quick Undo button when deleting an item.',
          checkPresent: /showtoast|toast-container/i
        },
        {
          label: 'Add theme & accent color switcher',
          prompt: 'Add a theme switcher supporting Dark/Light mode and custom accent color presets saved to user preferences.',
          checkPresent: /theme-toggle|dark-mode-toggle/i
        }
      ];

  for (const cand of pool) {
    if (cand.checkPresent && cand.checkPresent.test(combinedCode)) {
      continue;
    }
    candidates.push(cand);
  }

  // Deduplicate and filter out recently shown/clicked labels
  const result: Array<{ label: string; prompt: string }> = [];
  const seen = new Set<string>();

  for (const item of candidates) {
    const key = item.label.toLowerCase();
    const promptKey = item.prompt.toLowerCase();
    if (seen.has(key) || recentSet.has(key) || recentSet.has(promptKey)) continue;
    seen.add(key);
    result.push({ label: item.label, prompt: item.prompt });
    if (result.length >= 4) break;
  }

  // If all were filtered out, return top 3 from pool ignoring recentSet
  if (result.length === 0) {
    return pool.slice(0, 3).map(({ label, prompt }) => ({ label, prompt }));
  }

  return result;
}
