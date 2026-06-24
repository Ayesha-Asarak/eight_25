import type { CheerioAPI } from 'cheerio';
import { PageMetricsSchema, type PageMetrics } from '@/types/audit';
import { extractMeta } from './extract-meta';
import { extractHeadings } from './extract-headings';
import { extractWordCount } from './extract-word-count';
import { extractLinks } from './extract-links';
import { extractImages } from './extract-images';
import { extractCtas } from './extract-ctas';

/**
 * Orchestrates all metric extractors and returns a validated PageMetrics object.
 *
 * This is the single entry point for the metrics layer.
 * Zero AI imports — all extraction is deterministic.
 *
 * @param $ - Cheerio API root from parse-html.ts
 * @param url - The original page URL (used for link classification)
 */
export function extractMetrics($: CheerioAPI, url: string): PageMetrics {
  const meta = extractMeta($);
  const headings = extractHeadings($);
  const wordCount = extractWordCount($);
  const links = extractLinks($, url);
  const images = extractImages($);
  const ctaCount = extractCtas($);

  const raw = {
    url,
    wordCount,
    ...headings,
    ctaCount,
    ...links,
    ...images,
    ...meta,
  };

  // Validate with Zod to catch shape issues early during development
  return PageMetricsSchema.parse(raw);
}
