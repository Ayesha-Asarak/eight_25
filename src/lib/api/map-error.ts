import { ZodError } from 'zod';
import { FetchError, ParseError } from '@/lib/scraper/errors';
import {
  MissingApiKeyError,
  ModelUnavailableError,
  OpenAIResponseError,
  QuotaExceededError,
  ValidationError,
} from '@/lib/ai/errors';
import type { AuditErrorResponse } from '@/types/api';

export interface MappedError {
  status: number;
  body: AuditErrorResponse;
}

/**
 * Maps domain errors from scraper/AI layers to typed HTTP error responses.
 * Full error details are logged server-side; only user-safe messages go to the client.
 */
export function mapToAuditError(err: unknown): MappedError {
  // Always log the real error server-side
  console.error('[audit] request failed:', err);

  if (err instanceof ZodError) {
    const message = err.errors[0]?.message ?? 'Please enter a valid URL.';
    return {
      status: 400,
      body: { error: message, code: 'INVALID_URL' },
    };
  }

  if (err instanceof FetchError) {
    return {
      status: 422,
      body: {
        error:
          'Could not reach that URL. Make sure it is publicly accessible and try again.',
        code: 'FETCH_FAILED',
      },
    };
  }

  if (err instanceof ParseError) {
    return {
      status: 422,
      body: {
        error: 'Could not parse the page content. The page may use unsupported formats.',
        code: 'PARSE_FAILED',
      },
    };
  }

  if (err instanceof MissingApiKeyError) {
    return {
      status: 500,
      body: {
        error: 'AI analysis is not configured. Please contact the administrator.',
        code: 'AI_FAILED',
      },
    };
  }

  if (err instanceof ModelUnavailableError) {
    return {
      status: 503,
      body: {
        error:
          'Gemini is temporarily overloaded. Wait about a minute and try again — your API key is working.',
        code: 'AI_FAILED',
      },
    };
  }

  if (err instanceof QuotaExceededError) {
    return {
      status: 429,
      body: {
        error:
          'Gemini API quota exceeded. Wait about a minute and try again, or create a new API key in a fresh project at aistudio.google.com/app/apikey.',
        code: 'RATE_LIMITED',
      },
    };
  }

  if (err instanceof ValidationError || err instanceof OpenAIResponseError) {
    return {
      status: 502,
      body: {
        error: 'AI analysis failed to produce a valid response. Please try again.',
        code: 'AI_FAILED',
      },
    };
  }

  return {
    status: 500,
    body: {
      error: 'An unexpected error occurred. Please try again.',
      code: 'UNKNOWN',
    },
  };
}
