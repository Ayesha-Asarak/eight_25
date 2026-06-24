import type { CheerioAPI } from 'cheerio';

const DEFAULT_MAX_LENGTH = 5000;

/**
 * Extracts a plain-text content excerpt from the page for use as the AI input.
 *
 * - Uses <main> if present (avoids nav/footer noise), else falls back to <body>
 * - Strips all HTML tags via Cheerio's .text()
 * - Normalises whitespace (collapses newlines and spaces)
 * - Truncates to maxLength characters and appends '…' when truncated
 *
 * This value is NOT part of PageMetrics — it is passed separately to the AI
 * layer as AIStructuredInput.contentExcerpt. Keeping it here ensures all
 * content extraction stays in the metrics layer.
 */
export function extractContentExcerpt(
  $: CheerioAPI,
  maxLength: number = DEFAULT_MAX_LENGTH,
): string {
  const source = $('main').length > 0 ? $('main') : $('body');
  const raw = source.text();

  // Normalise whitespace: collapse runs of whitespace/newlines to single space
  const normalised = raw.replace(/\s+/g, ' ').trim();

  if (normalised.length <= maxLength) return normalised;

  return normalised.slice(0, maxLength) + '…';
}
