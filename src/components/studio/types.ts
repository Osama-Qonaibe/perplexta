export interface StarterPrompt {
  label: string;
  prompt: string;
  labelAr?: string;
  promptAr?: string;
}

export interface StudioTemplateFeature {
  icon?: string;
  title: string;
  body?: string;
  description?: string;
}

export interface StudioTemplateFaq {
  q: string;
  a: string;
}

export interface StudioTemplate {
  slug: string;
  name: string;
  category: string;
  description: string;
  thumbnail: string;
  updated?: string;
  workers?: string[];
  suggestions?: (string | { label: string; prompt: string })[];
  files?: Record<string, string>;
  filePaths?: string[];
  instructions?: string;
  features?: StudioTemplateFeature[];
  faq?: StudioTemplateFaq[];
  pageTitle?: string;
  pageDescription?: string;
  ogTagline?: string;
  page?: string;
}

export interface StudioFileItem {
  path: string;
  name: string;
  content: string;
  type?: string;
  isModified?: boolean;
  isEntry?: boolean;
}

export interface StudioEditTarget {
  tag: string;
  id?: string;
  className?: string;
  classes?: string;
  text?: string;
  selector?: string;
}

export interface StudioAttachmentItem {
  id?: string;
  name: string;
  type: string;
  url?: string;
  content?: string;
}

export interface StudioToolCall {
  id: string;
  name: string; // e.g., 'write_file', 'edit_file', 'delete_file', 'ask_clarification', 'update_todo', 'run_tests'
  args?: Record<string, any>;
  result?: any;
  error?: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  turnId?: string;
  timestamp?: string;
}

export interface StudioChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content?: string;
  text?: string;
  openingContent?: string;
  todos?: Array<{ id: string; title: string; status: 'completed' | 'in_progress' | 'pending' }>;
  clarifyRecap?: {
    skipped?: boolean;
    items?: Array<{ question: string; answer: string }>;
  };
  timestamp?: string;
  thinking?: string;
  status?: 'busy' | 'done' | 'error';
  logs?: string[];
  filesUpdated?: string[];
  toolCalls?: StudioToolCall[];
  toolResults?: Array<{ callId: string; toolName: string; success: boolean; output?: string; error?: string }>;
  isError?: boolean;
  suggestions?: (string | { label: string; prompt: string })[];
  attachments?: StudioAttachmentItem[];
  editTarget?: StudioEditTarget | null;
}

export interface StudioProjectSummary {
  id: string;
  name: string;
  updatedAt: string;
  thumbnail?: string;
  filesCount: number;
  pinned?: boolean;
}

export type StudioMode = 'preview' | 'code';
