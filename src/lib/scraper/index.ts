import type { CheerioAPI } from 'cheerio';
import type { PageMetrics } from '@/types/audit';
import { fetchPage } from './fetch-page';
import { parseHtml } from './parse-html';
import { extractMetrics } from '@/lib/metrics/index';
import { extractContentExcerpt } from '@/lib/metrics/extract-content-excerpt';

export interface ScrapeResult {
  html: string;
  $: CheerioAPI;
  metrics: PageMetrics;
  /** Plain-text excerpt (≤5000 chars) for the AI layer */
  contentExcerpt: string;
}

/**
 * Public entry point for the entire scraping pipeline.
 *
 * Accepts a URL and returns all data the API route and AI layer need:
 *   - raw HTML (for debugging)
 *   - Cheerio root (in case the route needs DOM access)
 *   - fully validated PageMetrics
 *   - plain-text content excerpt for OpenAI
 *
 * The API route calls this function; it never calls individual extractors directly.
 */
export async function scrapePage(url: string): Promise<ScrapeResult> {
  const html = await fetchPage(url);
  const $ = parseHtml(html);
  const metrics = extractMetrics($, url);
  const contentExcerpt = extractContentExcerpt($);

  return { html, $, metrics, contentExcerpt };
}
