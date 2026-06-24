import type { CheerioAPI } from 'cheerio';
import type { AnyNode } from 'domhandler';

/**
 * CTA Detection Heuristic
 * -----------------------
 * Counts unique elements that are likely calls-to-action.
 *
 * Rules applied (a DOM element is counted at most once):
 *   1. All <button> elements
 *   2. Elements with role="button"
 *   3. <a> tags whose class contains: btn, cta, button, action
 *   4. <a> tags whose visible text matches known CTA phrases (case-insensitive)
 *
 * Known limitations:
 *   - Misses JavaScript-rendered buttons (requires a headless browser)
 *   - Misses CSS-only styled CTAs that lack class names or CTA text
 *   - Text matching is English-only
 *   - Image-only CTAs (<a><img></a>) with no text are not matched by rule 4
 */

const CTA_CLASS_PATTERNS = ['btn', 'cta', 'button', 'action'];

const CTA_TEXT_PHRASES = [
  'get started',
  'contact',
  'contact us',
  'sign up',
  'learn more',
  'request',
  'book',
  'book a call',
  'book a demo',
  'download',
  'try',
  'try now',
  'try for free',
  'start',
  'get a quote',
  'schedule',
  'talk to us',
  'free trial',
  'see demo',
  'view demo',
  'watch demo',
];

function matchesCTAClass($el: ReturnType<CheerioAPI>): boolean {
  const className = ($el.attr('class') ?? '').toLowerCase();
  return CTA_CLASS_PATTERNS.some((pattern) => className.includes(pattern));
}

function matchesCTAText($el: ReturnType<CheerioAPI>): boolean {
  const text = $el.text().trim().toLowerCase();
  return CTA_TEXT_PHRASES.some((phrase) => text === phrase || text.startsWith(phrase));
}

export function extractCtas($: CheerioAPI): number {
  // Use a Set to track unique DOM nodes — prevents double-counting
  const ctaNodes = new Set<AnyNode>();

  // Rule 1: all <button> elements
  $('button').each((_, el) => { ctaNodes.add(el); });

  // Rule 2: elements with role="button" (not already a <button>)
  $('[role="button"]').each((_, el) => { ctaNodes.add(el); });

  // Rule 3 + 4: <a> tags with CTA class or CTA text
  $('a').each((_, el) => {
    const $el = $(el);
    if (matchesCTAClass($el) || matchesCTAText($el)) {
      ctaNodes.add(el);
    }
  });

  return ctaNodes.size;
}
