import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import type { PageMetrics, AuditInsights } from '@/types/audit';
import type { PromptLogEntry } from '@/types/prompt-log';
import { formatPromptLogMarkdown, writePromptLog } from './prompt-logger';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const sampleMetrics: PageMetrics = JSON.parse(
  readFileSync(
    join(__dirname, '../ai/__fixtures__/sample-metrics.json'),
    'utf-8',
  ),
);

const validInsights: AuditInsights = JSON.parse(
  readFileSync(
    join(__dirname, '../ai/__fixtures__/valid-insights.json'),
    'utf-8',
  ),
);

const sampleEntry: PromptLogEntry = {
  id: 'test-uuid-1234',
  url: 'https://www.eight25media.com/',
  timestamp: '2026-06-24T09:00:00.000Z',
  model: 'gpt-4o',
  systemPrompt: 'You are a web agency auditor.',
  userPrompt: 'Audit this page: https://www.eight25media.com/',
  structuredInput: {
    url: 'https://www.eight25media.com/',
    metrics: sampleMetrics,
    contentExcerpt: 'We build high-performing marketing websites.',
  },
  rawModelOutput: JSON.stringify(validInsights),
  parsedOutput: validInsights,
  usage: { promptTokens: 800, completionTokens: 400, totalTokens: 1200 },
};

// ── formatPromptLogMarkdown ───────────────────────────────────────────────────

describe('formatPromptLogMarkdown', () => {
  it('includes the URL and timestamp in the header', () => {
    const md = formatPromptLogMarkdown(sampleEntry);
    expect(md).toContain(sampleEntry.url);
    expect(md).toContain(sampleEntry.timestamp);
  });

  it('includes the system prompt', () => {
    const md = formatPromptLogMarkdown(sampleEntry);
    expect(md).toContain(sampleEntry.systemPrompt);
  });

  it('includes the user prompt', () => {
    const md = formatPromptLogMarkdown(sampleEntry);
    expect(md).toContain(sampleEntry.userPrompt);
  });

  it('includes the structured input as JSON', () => {
    const md = formatPromptLogMarkdown(sampleEntry);
    expect(md).toContain('"wordCount"');
    expect(md).toContain('"contentExcerpt"');
  });

  it('includes the raw model output', () => {
    const md = formatPromptLogMarkdown(sampleEntry);
    expect(md).toContain(sampleEntry.rawModelOutput);
  });

  it('includes token usage when available', () => {
    const md = formatPromptLogMarkdown(sampleEntry);
    expect(md).toContain('800');
    expect(md).toContain('400');
    expect(md).toContain('1200');
  });

  it('notes token usage unavailable when not provided', () => {
    const entryNoUsage = { ...sampleEntry, usage: undefined };
    const md = formatPromptLogMarkdown(entryNoUsage);
    expect(md).toContain('not available');
  });

  it('notes validation failure when parsedOutput is undefined', () => {
    const failedEntry = { ...sampleEntry, parsedOutput: undefined };
    const md = formatPromptLogMarkdown(failedEntry);
    expect(md).toContain('FAILED');
  });
});

// ── writePromptLog ────────────────────────────────────────────────────────────

describe('writePromptLog', () => {
  it('writes a file and returns its path', async () => {
    const tmpDir = join(tmpdir(), `prompt-log-test-${Date.now()}`);

    const filePath = await writePromptLog(sampleEntry, tmpDir);

    expect(filePath).toContain(sampleEntry.id);
    expect(filePath).toContain('.md');

    const written = readFileSync(filePath, 'utf-8');
    expect(written).toContain(sampleEntry.url);
    expect(written).toContain(sampleEntry.systemPrompt);
  });
});
