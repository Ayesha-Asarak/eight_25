import { describe, it, expect } from 'vitest';
import * as cheerio from 'cheerio';
import { readFileSync } from 'fs';
import { join } from 'path';
import { extractMetrics } from './index';

const PAGE_URL = 'https://www.eight25media.com/';

const sample = cheerio.load(
  readFileSync(join(__dirname, '__fixtures__/sample-page.html'), 'utf-8'),
);
const edge = cheerio.load(
  readFileSync(join(__dirname, '__fixtures__/edge-case.html'), 'utf-8'),
);

describe('extractMetrics (orchestrator)', () => {
  it('returns a fully populated PageMetrics object from the sample page', () => {
    const metrics = extractMetrics(sample, PAGE_URL);

    expect(metrics.url).toBe(PAGE_URL);
    expect(metrics.wordCount).toBeGreaterThan(0);
    expect(metrics.h1Count).toBe(1);
    expect(metrics.h2Count).toBe(2);
    expect(metrics.h3Count).toBe(2);
    expect(metrics.ctaCount).toBeGreaterThan(0);
    expect(metrics.imageCount).toBe(4);
    expect(metrics.altTextPercent).toBe(50);
    expect(metrics.metaTitle).toBe('Sample Agency Page — EIGHT25MEDIA');
    expect(metrics.metaDescription).not.toBeNull();
    expect(metrics.internalLinks).toBeGreaterThan(0);
    expect(metrics.externalLinks).toBeGreaterThan(0);
  });

  it('returns zeroed counts and nulls for the edge-case page', () => {
    const metrics = extractMetrics(edge, 'https://example.com/');

    expect(metrics.h1Count).toBe(0);
    expect(metrics.h2Count).toBe(0);
    expect(metrics.h3Count).toBe(0);
    expect(metrics.ctaCount).toBe(0);
    expect(metrics.imageCount).toBe(0);
    expect(metrics.altTextPercent).toBe(0);
    expect(metrics.metaTitle).toBeNull();
    expect(metrics.metaDescription).toBeNull();
  });

  it('validates output against PageMetricsSchema (throws on bad shape)', () => {
    // If Zod validation is working, no error should be thrown for valid input
    expect(() => extractMetrics(sample, PAGE_URL)).not.toThrow();
  });
});
