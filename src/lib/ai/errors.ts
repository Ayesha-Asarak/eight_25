/**
 * Typed domain errors for the AI layer.
 * Caught in the API route and mapped to user-friendly AuditErrorResponse messages.
 */

export class AnalysisError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'AnalysisError';
    this.cause = cause;
  }
}

export class MissingApiKeyError extends AnalysisError {
  constructor(detail?: string) {
    super(
      detail ??
        'GEMINI_API_KEY is not set. Add it to .env.local and restart the dev server.',
    );
    this.name = 'MissingApiKeyError';
  }
}

export class OpenAIResponseError extends AnalysisError {
  constructor(reason: string, cause?: unknown) {
    super(`Gemini returned an unexpected response: ${reason}`);
    this.name = 'OpenAIResponseError';
    this.cause = cause;
  }
}

export class QuotaExceededError extends AnalysisError {
  constructor(cause?: unknown) {
    super(
      'Gemini API quota exceeded. Wait a minute and try again, or create a new API key in a fresh Google Cloud project at https://aistudio.google.com/app/apikey.',
    );
    this.name = 'QuotaExceededError';
    this.cause = cause;
  }
}

export class ModelUnavailableError extends AnalysisError {
  constructor(cause?: unknown) {
    super(
      'Gemini is temporarily overloaded (503). Wait a minute and try again — your API key is fine.',
    );
    this.name = 'ModelUnavailableError';
    this.cause = cause;
  }
}

export class ValidationError extends AnalysisError {
  constructor(cause?: unknown) {
    super(
      'AI response did not match the expected schema after retrying. The model may have returned malformed JSON.',
    );
    this.name = 'ValidationError';
    this.cause = cause;
  }
}
