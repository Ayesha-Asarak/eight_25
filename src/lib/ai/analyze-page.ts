import type { PageMetrics, AuditInsights } from '@/types/audit';
import { AuditInsightsSchema } from '@/types/audit';
import { writePromptLog } from '@/lib/logging/prompt-logger';
import { buildAIStructuredInput } from './build-input';
import { SYSTEM_PROMPT } from './prompts/system';
import { buildUserPrompt } from './prompts/user-template';
import { callOpenAI } from './openai-client';
import { AUDIT_MODEL, MAX_VALIDATION_RETRIES } from './constants';
import { ValidationError } from './errors';

export interface AnalyzePageResult {
  insights: AuditInsights;
  /** Path to the written prompt log file */
  logPath: string;
}

/**
 * Top-level AI orchestrator.
 *
 * Flow:
 * 1. Build structured input from metrics + excerpt
 * 2. Render system and user prompts
 * 3. Call OpenAI (retry once on Zod validation failure)
 * 4. Write prompt log — always, even on failure
 * 5. Return validated AuditInsights
 *
 * This is the only function the API route calls in the AI layer.
 */
export async function analyzePage(
  metrics: PageMetrics,
  contentExcerpt: string,
): Promise<AnalyzePageResult> {
  const structuredInput = buildAIStructuredInput(metrics, contentExcerpt);
  const systemPrompt = SYSTEM_PROMPT;
  const userPrompt = buildUserPrompt(structuredInput);

  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  let rawContent = '';
  let callUsage: Awaited<ReturnType<typeof callOpenAI>>['usage'];
  let lastError: unknown;

  // Attempt OpenAI call with one retry on schema validation failure
  for (let attempt = 0; attempt <= MAX_VALIDATION_RETRIES; attempt++) {
    try {
      const result = await callOpenAI({ systemPrompt, userPrompt });
      rawContent = result.rawContent;
      callUsage = result.usage;

      const parsed = AuditInsightsSchema.parse(JSON.parse(rawContent));

      // Success — log and return
      const logPath = await writePromptLog({
        id,
        url: metrics.url,
        timestamp,
        model: AUDIT_MODEL,
        systemPrompt,
        userPrompt,
        structuredInput,
        rawModelOutput: rawContent,
        parsedOutput: parsed,
        usage: callUsage,
      });

      return { insights: parsed, logPath };
    } catch (err) {
      lastError = err;

      // On the last attempt, fall through to failure handling below
      if (attempt < MAX_VALIDATION_RETRIES) continue;
    }
  }

  // All attempts failed — log with undefined parsedOutput and throw
  await writePromptLog({
    id,
    url: metrics.url,
    timestamp,
    model: AUDIT_MODEL,
    systemPrompt,
    userPrompt,
    structuredInput,
    rawModelOutput: rawContent,
    parsedOutput: undefined,
    usage: undefined,
  }).catch(() => {
    // Never let logging failure mask the real error
  });

  throw new ValidationError(lastError);
}
