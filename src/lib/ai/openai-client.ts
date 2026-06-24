import OpenAI from 'openai';
import { AUDIT_MODEL } from './constants';
import { AUDIT_INSIGHTS_JSON_SCHEMA } from './schema';
import { MissingApiKeyError, OpenAIResponseError } from './errors';

export interface OpenAICallResult {
  rawContent: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Thin wrapper around the OpenAI Chat Completions API.
 *
 * Responsibilities:
 * - Validates API key presence at call time (not import time)
 * - Sends system + user prompts with structured JSON output mode
 * - Returns raw response string for the caller to parse and log
 * - Does NOT parse, validate, or log — that belongs in analyze-page.ts
 */
export async function callOpenAI(params: {
  systemPrompt: string;
  userPrompt: string;
}): Promise<OpenAICallResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new MissingApiKeyError();

  const client = new OpenAI({ apiKey });

  let response: OpenAI.Chat.ChatCompletion;

  try {
    response = await client.chat.completions.create({
      model: AUDIT_MODEL,
      messages: [
        { role: 'system', content: params.systemPrompt },
        { role: 'user', content: params.userPrompt },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: AUDIT_INSIGHTS_JSON_SCHEMA,
      },
      temperature: 0.3,
    });
  } catch (err) {
    throw new OpenAIResponseError(
      err instanceof Error ? err.message : 'API call failed',
      err,
    );
  }

  const rawContent = response.choices[0]?.message?.content;
  if (!rawContent) {
    throw new OpenAIResponseError('Response content was empty or null');
  }

  const usage = response.usage
    ? {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      }
    : undefined;

  return { rawContent, usage };
}
