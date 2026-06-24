import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ZodError, ZodIssueCode } from 'zod';
import { mapToAuditError } from './map-error';
import { FetchError, ParseError } from '@/lib/scraper/errors';
import {
  MissingApiKeyError,
  OpenAIResponseError,
  ValidationError,
} from '@/lib/ai/errors';

// Suppress console.error output during tests — mapToAuditError always logs.
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

// Helper to build a minimal ZodError without running a schema parse.
function makeZodError(message: string): ZodError {
  return new ZodError([
    {
      code: ZodIssueCode.custom,
      path: ['url'],
      message,
    },
  ]);
}

describe('mapToAuditError', () => {
  // ---------------------------------------------------------------------------
  // ZodError → 400 INVALID_URL
  // ---------------------------------------------------------------------------

  it('maps ZodError to 400 INVALID_URL', () => {
    const err = makeZodError('Please enter a valid URL.');
    const { status, body } = mapToAuditError(err);
    expect(status).toBe(400);
    expect(body.code).toBe('INVALID_URL');
  });

  it('uses the first ZodError message in the response body', () => {
    const err = makeZodError('URL is required.');
    const { body } = mapToAuditError(err);
    expect(body.error).toBe('URL is required.');
  });

  it('falls back to a default message when ZodError has no issues', () => {
    const err = new ZodError([]);
    const { body } = mapToAuditError(err);
    expect(body.error).toMatch(/valid URL/i);
  });

  // ---------------------------------------------------------------------------
  // FetchError → 422 FETCH_FAILED
  // ---------------------------------------------------------------------------

  it('maps FetchError to 422 FETCH_FAILED', () => {
    const err = new FetchError('https://example.com', new Error('ENOTFOUND'));
    const { status, body } = mapToAuditError(err);
    expect(status).toBe(422);
    expect(body.code).toBe('FETCH_FAILED');
  });

  it('maps FetchError with HTTP status code to 422 FETCH_FAILED', () => {
    const err = new FetchError('https://example.com', null, 403);
    const { status, body } = mapToAuditError(err);
    expect(status).toBe(422);
    expect(body.code).toBe('FETCH_FAILED');
  });

  // ---------------------------------------------------------------------------
  // ParseError → 422 PARSE_FAILED
  // ---------------------------------------------------------------------------

  it('maps ParseError to 422 PARSE_FAILED', () => {
    const err = new ParseError('empty HTML');
    const { status, body } = mapToAuditError(err);
    expect(status).toBe(422);
    expect(body.code).toBe('PARSE_FAILED');
  });

  // ---------------------------------------------------------------------------
  // AI errors
  // ---------------------------------------------------------------------------

  it('maps MissingApiKeyError to 500 AI_FAILED', () => {
    const err = new MissingApiKeyError();
    const { status, body } = mapToAuditError(err);
    expect(status).toBe(500);
    expect(body.code).toBe('AI_FAILED');
  });

  it('maps ValidationError to 502 AI_FAILED', () => {
    const err = new ValidationError(new Error('schema mismatch'));
    const { status, body } = mapToAuditError(err);
    expect(status).toBe(502);
    expect(body.code).toBe('AI_FAILED');
  });

  it('maps OpenAIResponseError to 502 AI_FAILED', () => {
    const err = new OpenAIResponseError('null content', new Error());
    const { status, body } = mapToAuditError(err);
    expect(status).toBe(502);
    expect(body.code).toBe('AI_FAILED');
  });

  // ---------------------------------------------------------------------------
  // Unknown errors → 500 UNKNOWN
  // ---------------------------------------------------------------------------

  it('maps a generic Error to 500 UNKNOWN', () => {
    const { status, body } = mapToAuditError(new Error('something broke'));
    expect(status).toBe(500);
    expect(body.code).toBe('UNKNOWN');
  });

  it('maps a plain string throw to 500 UNKNOWN', () => {
    const { status, body } = mapToAuditError('oops');
    expect(status).toBe(500);
    expect(body.code).toBe('UNKNOWN');
  });

  it('maps null to 500 UNKNOWN', () => {
    const { status, body } = mapToAuditError(null);
    expect(status).toBe(500);
    expect(body.code).toBe('UNKNOWN');
  });

  // ---------------------------------------------------------------------------
  // Response body shape
  // ---------------------------------------------------------------------------

  it('always returns an object with error string and code string', () => {
    const cases: unknown[] = [
      makeZodError('bad'),
      new FetchError('https://x.com', null),
      new ParseError('x'),
      new MissingApiKeyError(),
      new ValidationError(),
      new OpenAIResponseError('x'),
      new Error('generic'),
      null,
    ];
    for (const c of cases) {
      const { body } = mapToAuditError(c);
      expect(typeof body.error).toBe('string');
      expect(typeof body.code).toBe('string');
    }
  });
});
