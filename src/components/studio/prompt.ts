/**
 * Studio Engine System Prompt & Builders
 * Ported & adapted from src/js/prompt.js and src/js/template-core.js in Osama-Qonaibe/builder.
 */
import {
  getCommonSystemPrompt,
  getDynamicSystemPrompt,
  buildTemplateNote
} from './studioEngine';

export const SYSTEM_PROMPT: string = getCommonSystemPrompt('ar');

export { getCommonSystemPrompt, getDynamicSystemPrompt, buildTemplateNote };
export default SYSTEM_PROMPT;
