import { GoogleGenAI } from '@google/genai';
import {
  getModelFallbackChain,
  MAX_OUTPUT_TOKENS,
  MAX_API_CALLS_PER_REQUEST,
  MODEL_FALLBACK_DELAY_MS,
} from './constants';
import { GEMINI_AUDIT_INSIGHTS_SCHEMA } from './schema';
import {
  MissingApiKeyError,
  ModelUnavailableError,
  OpenAIResponseError,
  QuotaExceededError,
} from './errors';

export interface GeminiCallResult {
  rawContent: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

function getErrorStatus(err: unknown): number | undefined {
  return err && typeof err === 'object' && 'status' in err
    ? (err as { status: number }).status
    : undefined;
}

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'API call failed';
}

function classifyGeminiError(err: unknown): never {
  const status = getErrorStatus(err);
  const message = getErrorMessage(err);

  if (
    status === 429 ||
    /quota|RESOURCE_EXHAUSTED|rate.?limit/i.test(message)
  ) {
    throw new QuotaExceededError(err);
  }

  if (
    status === 503 ||
    /high demand|UNAVAILABLE|overloaded/i.test(message)
  ) {
    throw new ModelUnavailableError(err);
  }

  throw new OpenAIResponseError(message, err);
}

/**
 * Thin wrapper around the native Gemini generateContent API.
 *
 * Uses the official @google/genai SDK so both AIza and AQ. auth keys work.
 * On 503 (model overloaded), automatically tries fallback models.
 *
 * See: https://ai.google.dev/gemini-api/docs/api-key
 */
export async function callGemini(params: {
  systemPrompt: string;
  userPrompt: string;
}): Promise<GeminiCallResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new MissingApiKeyError();

  if (/^PASTE_/i.test(apiKey) || (apiKey.includes('YOUR') && apiKey.includes('KEY'))) {
    throw new MissingApiKeyError(
      'GEMINI_API_KEY is still a placeholder. Paste your real key into .env.local, save the file (Cmd+S), then restart the dev server.',
    );
  }

  const ai = new GoogleGenAI({ apiKey });
  const models = getModelFallbackChain().slice(0, MAX_API_CALLS_PER_REQUEST);
  let lastQuotaErr: unknown;
  let lastUnavailableErr: unknown;
  let callCount = 0;

  for (const model of models) {
    // Hard cap — never exceed MAX_API_CALLS_PER_REQUEST regardless of chain length
    if (callCount >= MAX_API_CALLS_PER_REQUEST) {
      console.warn('[ai] hard call cap reached — stopping fallback chain');
      break;
    }

    // Brief pause between attempts to avoid rapid-fire quota bursts
    if (callCount > 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, MODEL_FALLBACK_DELAY_MS));
    }

    callCount++;
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.userPrompt,
        config: {
          systemInstruction: params.systemPrompt,
          temperature: 0.3,
          responseMimeType: 'application/json',
          responseJsonSchema: GEMINI_AUDIT_INSIGHTS_SCHEMA,
          maxOutputTokens: MAX_OUTPUT_TOKENS,
        },
      });

      const rawContent = response.text;
      if (!rawContent) {
        throw new OpenAIResponseError('Response content was empty or null');
      }

      const usage = response.usageMetadata
        ? {
            promptTokens: response.usageMetadata.promptTokenCount ?? 0,
            completionTokens: response.usageMetadata.candidatesTokenCount ?? 0,
            totalTokens: response.usageMetadata.totalTokenCount ?? 0,
          }
        : undefined;

      console.info(`[ai] successful response from ${model}`);
      return { rawContent, usage };
    } catch (err) {
      if (err instanceof OpenAIResponseError) throw err;

      const status = getErrorStatus(err);
      const message = getErrorMessage(err);

      // Auth errors will fail on every model — stop immediately
      if (
        status === 400 ||
        /api key|INVALID_ARGUMENT/i.test(message)
      ) {
        throw new MissingApiKeyError(
          'GEMINI_API_KEY was rejected by Google. Check the key in .env.local is saved (Cmd+S) and restart the dev server.',
        );
      }

      // 429 quota exceeded — this model is exhausted, try the next one
      if (
        status === 429 ||
        /quota|RESOURCE_EXHAUSTED|rate.?limit/i.test(message)
      ) {
        console.warn(`[ai] ${model} quota exhausted — trying next model`);
        lastQuotaErr = err;
        continue;
      }

      // 503 overloaded or 404 not found — try the next model
      if (
        status === 503 ||
        status === 404 ||
        /high demand|UNAVAILABLE|overloaded|not found/i.test(message)
      ) {
        console.warn(`[ai] ${model} skipped (${status}) — trying next model`);
        lastUnavailableErr = err;
        continue;
      }

      classifyGeminiError(err);
    }
  }

  // All models exhausted
  if (lastQuotaErr) throw new QuotaExceededError(lastQuotaErr);
  throw new ModelUnavailableError(lastUnavailableErr);
}

// Keep legacy export alias so existing tests and imports don't break
export { callGemini as callOpenAI };
export type { GeminiCallResult as OpenAICallResult };
