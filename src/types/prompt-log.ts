import type { PageMetrics, AuditInsights } from './audit';

/**
 * Structured input that gets sent to Gemini.
 * Metrics are included as-is; HTML is never sent — only a truncated text excerpt.
 */
export interface AIStructuredInput {
  url: string;
  metrics: PageMetrics;
  /** First ~5000 chars of main body text — HTML stripped */
  contentExcerpt: string;
}

/**
 * Full prompt log entry — one per Gemini call.
 * Written to docs/prompt-logs/{date}/{id}.md in development.
 * Curated examples committed to docs/prompt-logs/examples/ for submission.
 */
export interface PromptLogEntry {
  /** UUID v4 */
  id: string;
  url: string;
  /** ISO 8601 timestamp */
  timestamp: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  structuredInput: AIStructuredInput;
  /** Raw string from Gemini before JSON.parse or Zod validation */
  rawModelOutput: string;
  /** Parsed and validated output — undefined if validation failed */
  parsedOutput?: AuditInsights;
  /** Gemini usage stats if available */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
