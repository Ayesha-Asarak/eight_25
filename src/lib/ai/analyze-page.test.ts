import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { PageMetrics } from '@/types/audit';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const sampleMetrics: PageMetrics = JSON.parse(
  readFileSync(join(__dirname, '__fixtures__/sample-metrics.json'), 'utf-8'),
);

const validInsightsJson = readFileSync(
  join(__dirname, '__fixtures__/valid-insights.json'),
  'utf-8',
);

const invalidInsightsJson = readFileSync(
  join(__dirname, '__fixtures__/invalid-insights.json'),
  'utf-8',
);

// ── Mocks ─────────────────────────────────────────────────────────────────────

// Mock callOpenAI so no real API calls are made
vi.mock('./openai-client', () => ({
  callOpenAI: vi.fn(),
}));

// Mock writePromptLog to avoid filesystem writes in tests
vi.mock('@/lib/logging/prompt-logger', () => ({
  writePromptLog: vi.fn().mockResolvedValue('/tmp/test-log.md'),
}));

import { callOpenAI } from './openai-client';
import { writePromptLog } from '@/lib/logging/prompt-logger';
import { analyzePage } from './analyze-page';
import { ValidationError } from './errors';

const mockCallOpenAI = vi.mocked(callOpenAI);
const mockWritePromptLog = vi.mocked(writePromptLog);

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('analyzePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns validated AuditInsights on a successful response', async () => {
    mockCallOpenAI.mockResolvedValueOnce({
      rawContent: validInsightsJson,
      usage: { promptTokens: 800, completionTokens: 400, totalTokens: 1200 },
    });

    const result = await analyzePage(sampleMetrics, 'Sample page content.');

    expect(result.insights.seo).toBeDefined();
    expect(result.insights.messaging).toBeDefined();
    expect(result.insights.cta).toBeDefined();
    expect(result.insights.contentDepth).toBeDefined();
    expect(result.insights.ux).toBeDefined();
    expect(result.insights.recommendations.length).toBeGreaterThanOrEqual(3);
    expect(result.insights.recommendations.length).toBeLessThanOrEqual(5);
  });

  it('writes a prompt log on success', async () => {
    mockCallOpenAI.mockResolvedValueOnce({ rawContent: validInsightsJson });

    await analyzePage(sampleMetrics, 'Content.');

    expect(mockWritePromptLog).toHaveBeenCalledOnce();
    const logEntry = mockWritePromptLog.mock.calls[0][0];
    expect(logEntry.url).toBe(sampleMetrics.url);
    expect(logEntry.systemPrompt).toBeTruthy();
    expect(logEntry.userPrompt).toContain(sampleMetrics.url);
    expect(logEntry.rawModelOutput).toBe(validInsightsJson);
    expect(logEntry.parsedOutput).toBeDefined();
  });

  it('retries once on invalid JSON schema and succeeds on second attempt', async () => {
    mockCallOpenAI
      .mockResolvedValueOnce({ rawContent: invalidInsightsJson })  // first: fails Zod
      .mockResolvedValueOnce({ rawContent: validInsightsJson });    // second: passes

    const result = await analyzePage(sampleMetrics, 'Content.');

    expect(mockCallOpenAI).toHaveBeenCalledTimes(2);
    expect(result.insights.seo).toBeDefined();
  });

  it('throws ValidationError after exhausting retries', async () => {
    mockCallOpenAI.mockResolvedValue({ rawContent: invalidInsightsJson });

    await expect(analyzePage(sampleMetrics, 'Content.')).rejects.toThrow(ValidationError);
    expect(mockCallOpenAI).toHaveBeenCalledTimes(2); // original + 1 retry
  });

  it('writes a log even when validation fails', async () => {
    mockCallOpenAI.mockResolvedValue({ rawContent: invalidInsightsJson });

    await expect(analyzePage(sampleMetrics, 'Content.')).rejects.toThrow();

    expect(mockWritePromptLog).toHaveBeenCalledOnce();
    const logEntry = mockWritePromptLog.mock.calls[0][0];
    expect(logEntry.parsedOutput).toBeUndefined();
    expect(logEntry.rawModelOutput).toBe(invalidInsightsJson);
  });

  it('returns the log file path', async () => {
    mockCallOpenAI.mockResolvedValueOnce({ rawContent: validInsightsJson });

    const result = await analyzePage(sampleMetrics, 'Content.');
    expect(result.logPath).toBe('/tmp/test-log.md');
  });
});
