export interface ThinkingParseResult {
  hasThinking: boolean;
  isThinkingActive: boolean;
  thinkingContent: string;
  cleanContent: string;
}

export interface ServerThinkingParseResult {
  hasThinking: boolean;
  thinkingContent: string;
  cleanContent: string;
}

export function extractThinking(rawText: string | undefined | null): ThinkingParseResult {
  if (!rawText) {
    return {
      hasThinking: false,
      isThinkingActive: false,
      thinkingContent: '',
      cleanContent: ''
    };
  }

  const openTagMatch = rawText.match(/<(?:thinking|think)>/i);
  const closeTagMatch = rawText.match(/<\/(?:thinking|think)>/i);

  if (openTagMatch && closeTagMatch && closeTagMatch.index !== undefined && openTagMatch.index !== undefined) {
    if (closeTagMatch.index > openTagMatch.index) {
      const openTagLen = openTagMatch[0].length;
      const closeTagLen = closeTagMatch[0].length;
      const thinkingStart = openTagMatch.index + openTagLen;
      const thinkingEnd = closeTagMatch.index;

      const thinkingContent = rawText.slice(thinkingStart, thinkingEnd).trim();
      const beforeTag = rawText.slice(0, openTagMatch.index);
      const afterTag = rawText.slice(closeTagMatch.index + closeTagLen);
      const cleanContent = (beforeTag + afterTag).trim();

      return {
        hasThinking: Boolean(thinkingContent.length > 0),
        isThinkingActive: false,
        thinkingContent,
        cleanContent
      };
    }
  }

  if (openTagMatch && (!closeTagMatch || (closeTagMatch.index !== undefined && openTagMatch.index !== undefined && closeTagMatch.index < openTagMatch.index))) {
    const openTagLen = openTagMatch[0].length;
    const thinkingStart = (openTagMatch.index || 0) + openTagLen;
    const thinkingContent = rawText.slice(thinkingStart).trim();
    const beforeTag = rawText.slice(0, openTagMatch.index).trim();

    return {
      hasThinking: true,
      isThinkingActive: true,
      thinkingContent,
      cleanContent: beforeTag
    };
  }

  const legacyMatch = rawText.match(/\[Reasoning\]([\s\S]*?)\[\/Reasoning\]/i);
  if (legacyMatch) {
    const thinkingContent = (legacyMatch[1] || '').trim();
    const cleanContent = rawText.replace(/\[Reasoning\][\s\S]*?\[\/Reasoning\]/i, '').trim();
    return {
      hasThinking: Boolean(thinkingContent.length > 0),
      isThinkingActive: false,
      thinkingContent,
      cleanContent
    };
  }

  return {
    hasThinking: false,
    isThinkingActive: false,
    thinkingContent: '',
    cleanContent: rawText
  };
}

export function extractServerThinking(rawText: string | undefined | null): ServerThinkingParseResult {
  const { hasThinking, thinkingContent, cleanContent } = extractThinking(rawText);
  return {
    hasThinking: Boolean(hasThinking && thinkingContent.length > 0),
    thinkingContent,
    cleanContent
  };
}
