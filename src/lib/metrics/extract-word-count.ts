import type { CheerioAPI } from 'cheerio';

/**
 * Counts the total number of words in the page's main content.
 *
 * Strategy (documented trade-off):
 * 1. Prefer <main> if it exists — avoids counting nav/footer noise
 * 2. Fall back to <body> otherwise
 *
 * Limitation: when <main> is absent, word count includes nav, footer, and
 * sidebar text. Acceptable for v1 — noted in README trade-offs.
 */
export function extractWordCount($: CheerioAPI): number {
  const source = $('main').length > 0 ? $('main') : $('body');
  const text = source.text();

  if (!text.trim()) return 0;

  // Split on any whitespace sequence and filter out empty tokens
  return text.trim().split(/\s+/).filter(Boolean).length;
}
