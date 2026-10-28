/**
 * Video Utilities for Perplexta Platform
 * Handles YouTube URL parsing, embed link generation, and video specs.
 */

export function extractYouTubeId(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = url.trim().match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export function getYouTubeEmbedUrl(url: string | null | undefined, autoplay = true): string | null {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;
  const params = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    rel: '0',
    modestbranding: '1',
    playsinline: '1'
  });
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}
