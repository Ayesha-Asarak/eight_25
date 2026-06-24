import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { PageMetrics } from '@/types/audit';
import type { AIStructuredInput } from '@/types/prompt-log';
import { buildUserPrompt } from './user-template';

const sampleMetrics: PageMetrics = JSON.parse(
  readFileSync(join(__dirname, '../__fixtures__/sample-metrics.json'), 'utf-8'),
);

const sampleInput: AIStructuredInput = {
  url: sampleMetrics.url,
  metrics: sampleMetrics,
  contentExcerpt: 'We build high-performing marketing websites.',
};

describe('buildUserPrompt', () => {
  it('includes the page URL', () => {
    const prompt = buildUserPrompt(sampleInput);
    expect(prompt).toContain(sampleInput.url);
  });

  it('includes the metrics as JSON', () => {
    const prompt = buildUserPrompt(sampleInput);
    expect(prompt).toContain('"wordCount"');
    expect(prompt).toContain('"h1Count"');
    expect(prompt).toContain('"altTextPercent"');
    expect(prompt).toContain('"ctaCount"');
  });

  it('includes the content excerpt', () => {
    const prompt = buildUserPrompt(sampleInput);
    expect(prompt).toContain(sampleInput.contentExcerpt);
  });

  it('instructs to reference metric field names', () => {
    const prompt = buildUserPrompt(sampleInput);
    expect(prompt.toLowerCase()).toContain('metric');
  });

  it('notes truncation when excerpt ends with ellipsis', () => {
    const truncatedInput: AIStructuredInput = {
      ...sampleInput,
      contentExcerpt: 'a'.repeat(5000) + '…',
    };
    const prompt = buildUserPrompt(truncatedInput);
    expect(prompt).toContain('truncated');
  });

  it('is a pure function — same input returns same output', () => {
    expect(buildUserPrompt(sampleInput)).toBe(buildUserPrompt(sampleInput));
  });
});
