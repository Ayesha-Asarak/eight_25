/**
 * Typed domain errors for the scraper layer.
 * These are thrown here and caught in the API route for user-friendly responses.
 */

export class FetchError extends Error {
  readonly url: string;
  readonly statusCode?: number;

  constructor(url: string, cause: unknown, statusCode?: number) {
    const reason =
      statusCode != null
        ? `HTTP ${statusCode}`
        : cause instanceof Error
          ? cause.message
          : 'Unknown error';

    super(`Failed to fetch "${url}": ${reason}`);
    this.name = 'FetchError';
    this.url = url;
    this.statusCode = statusCode;
    this.cause = cause;
  }
}

export class ParseError extends Error {
  constructor(reason: string) {
    super(`Failed to parse HTML: ${reason}`);
    this.name = 'ParseError';
  }
}
