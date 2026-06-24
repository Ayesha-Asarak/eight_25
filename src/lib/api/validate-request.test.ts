import { describe, it, expect } from 'vitest';
import { ZodError } from 'zod';
import { validateAuditRequest } from './validate-request';

describe('validateAuditRequest', () => {
  // ---------------------------------------------------------------------------
  // Valid inputs
  // ---------------------------------------------------------------------------

  it('accepts a well-formed https URL', () => {
    const result = validateAuditRequest({ url: 'https://example.com' });
    expect(result.url).toBe('https://example.com');
  });

  it('accepts a well-formed http URL', () => {
    const result = validateAuditRequest({ url: 'http://example.com/path?q=1' });
    expect(result.url).toBe('http://example.com/path?q=1');
  });

  it('prepends https:// when the protocol is omitted', () => {
    const result = validateAuditRequest({ url: 'example.com' });
    expect(result.url).toBe('https://example.com');
  });

  it('prepends https:// for subdomain without protocol', () => {
    const result = validateAuditRequest({ url: 'www.example.com/page' });
    expect(result.url).toBe('https://www.example.com/page');
  });

  it('does not double-prepend https:// for already-valid URLs', () => {
    const result = validateAuditRequest({ url: 'https://example.com' });
    expect(result.url).not.toContain('https://https://');
  });

  // ---------------------------------------------------------------------------
  // Invalid inputs
  // ---------------------------------------------------------------------------

  it('throws ZodError when url is missing', () => {
    expect(() => validateAuditRequest({})).toThrow(ZodError);
  });

  it('throws ZodError when url is an empty string', () => {
    expect(() => validateAuditRequest({ url: '' })).toThrow(ZodError);
  });

  it('throws ZodError for a plaintext non-URL like "not a url"', () => {
    expect(() => validateAuditRequest({ url: 'not a url' })).toThrow(ZodError);
  });

  it('throws ZodError when body is null', () => {
    expect(() => validateAuditRequest(null)).toThrow(ZodError);
  });

  it('throws ZodError when body is a number', () => {
    expect(() => validateAuditRequest(42)).toThrow(ZodError);
  });

  it('throws ZodError when url field is a number', () => {
    expect(() => validateAuditRequest({ url: 42 })).toThrow(ZodError);
  });

  it('includes a useful error message for missing url', () => {
    let caughtError: ZodError | null = null;
    try {
      validateAuditRequest({});
    } catch (err) {
      if (err instanceof ZodError) caughtError = err;
    }
    expect(caughtError).not.toBeNull();
    expect(caughtError!.errors[0]?.message).toContain('required');
  });

  it('includes a useful error message for invalid URL format', () => {
    let caughtError: ZodError | null = null;
    try {
      validateAuditRequest({ url: 'not a url' });
    } catch (err) {
      if (err instanceof ZodError) caughtError = err;
    }
    expect(caughtError).not.toBeNull();
    expect(caughtError!.errors[0]?.message).toMatch(/valid URL/i);
  });
});
