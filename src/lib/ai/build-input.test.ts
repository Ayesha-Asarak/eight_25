import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { PageMetrics } from '@/types/audit';
import { buildAIStructuredInput } from './build-input';
import { CONTENT_EXCERPT_MAX_LENGTH } from './constants';

const sampleMetrics: PageMetrics = JSON.parse(
  readFileSync(join(__dirname, '__fixtures__/sample-metrics.json'), 'utf-8'),
);

describe('buildAIStructuredInput', () => {
  it('returns an AIStructuredInput with url, metrics, and excerpt', () => {
    const result = buildAIStructuredInput(sampleMetrics, 'Some page content here.');
    expect(result.url).toBe(sampleMetrics.url);
    expect(result.metrics).toEqual(sampleMetrics);
    expect(result.contentExcerpt).toBe('Some page content here.');
  });

  it('does not modify metric values', () => {
    const result = buildAIStructuredInput(sampleMetrics, 'content');
    expect(result.metrics.wordCount).toBe(sampleMetrics.wordCount);
    expect(result.metrics.h1Count).toBe(sampleMetrics.h1Count);
    expect(result.metrics.altTextPercent).toBe(sampleMetrics.altTextPercent);
  });

  it('truncates excerpt that exceeds the max length', () => {
    const longExcerpt = 'a'.repeat(CONTENT_EXCERPT_MAX_LENGTH + 100);
    const result = buildAIStructuredInput(sampleMetrics, longExcerpt);
    expect(result.contentExcerpt.length).toBeLessThanOrEqual(CONTENT_EXCERPT_MAX_LENGTH + 1); // +1 for '…'
    expect(result.contentExcerpt.endsWith('…')).toBe(true);
  });

  it('does not truncate excerpt within the limit', () => {
    const shortExcerpt = 'Short content.';
    const result = buildAIStructuredInput(sampleMetrics, shortExcerpt);
    expect(result.contentExcerpt).toBe(shortExcerpt);
  });
});
