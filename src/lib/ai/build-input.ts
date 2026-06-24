import type { PageMetrics } from '@/types/audit';
import type { AIStructuredInput } from '@/types/prompt-log';
import { CONTENT_EXCERPT_MAX_LENGTH } from './constants';

/**
 * Assembles the structured payload sent to the AI layer.
 *
 * This is the boundary between Phase 1 (deterministic extraction)
 * and Phase 2 (AI analysis). It combines metrics + content excerpt
 * into a single typed object — never includes raw HTML.
 */
export function buildAIStructuredInput(
  metrics: PageMetrics,
  contentExcerpt: string,
): AIStructuredInput {
  // Defensive truncation — extract-content-excerpt.ts already handles this,
  // but we guard here in case callers bypass it.
  const safeExcerpt =
    contentExcerpt.length > CONTENT_EXCERPT_MAX_LENGTH
      ? contentExcerpt.slice(0, CONTENT_EXCERPT_MAX_LENGTH) + '…'
      : contentExcerpt;

  return {
    url: metrics.url,
    metrics,
    contentExcerpt: safeExcerpt,
  };
}
