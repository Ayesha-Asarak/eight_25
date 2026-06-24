import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkRateLimit } from './rate-limit';

/** Builds a minimal Request with an X-Forwarded-For header. */
function makeRequest(ip = '1.2.3.4'): Request {
  return new Request('https://example.com/api/audit', {
    method: 'POST',
    headers: { 'x-forwarded-for': ip },
  });
}

// Isolate each test — the in-memory store persists between calls in the same
// module instance, so we reset it by reloading the module in each test file run.
// Because vitest reloads modules per file by default, the store starts fresh.

describe('checkRateLimit', () => {
  it('allows the first request', () => {
    const result = checkRateLimit(makeRequest('10.0.0.1'));
    expect(result.allowed).toBe(true);
  });

  it('tracks remaining count correctly', () => {
    const ip = '10.0.0.2';
    const first = checkRateLimit(makeRequest(ip));
    expect(first.remaining).toBe(4); // 5 max - 1 used

    const second = checkRateLimit(makeRequest(ip));
    expect(second.remaining).toBe(3);
  });

  it('blocks the 6th request from the same IP', () => {
    const ip = '10.0.0.3';
    // Make 5 allowed requests
    for (let i = 0; i < 5; i++) {
      const r = checkRateLimit(makeRequest(ip));
      expect(r.allowed).toBe(true);
    }
    // 6th should be blocked
    const blocked = checkRateLimit(makeRequest(ip));
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('does not block a different IP', () => {
    const ipA = '10.0.0.4';
    const ipB = '10.0.0.5';
    // Exhaust ipA
    for (let i = 0; i < 5; i++) checkRateLimit(makeRequest(ipA));
    expect(checkRateLimit(makeRequest(ipA)).allowed).toBe(false);

    // ipB is unaffected
    expect(checkRateLimit(makeRequest(ipB)).allowed).toBe(true);
  });

  it('evicts old timestamps outside the window', () => {
    const ip = '10.0.0.6';
    const realNow = Date.now();

    // Simulate 5 requests 20 minutes ago (outside the 15-min window)
    const oldTime = realNow - 20 * 60 * 1000;
    vi.spyOn(Date, 'now').mockReturnValue(oldTime);
    for (let i = 0; i < 5; i++) checkRateLimit(makeRequest(ip));
    vi.spyOn(Date, 'now').mockRestore();

    // Now at real time — old timestamps evicted, window is fresh
    const result = checkRateLimit(makeRequest(ip));
    expect(result.allowed).toBe(true);
  });

  it('uses "unknown" as IP when no forwarded header is present', () => {
    const req = new Request('https://example.com/api/audit', { method: 'POST' });
    const result = checkRateLimit(req);
    expect(result.allowed).toBe(true); // first request from unknown
  });

  it('uses the first IP in a comma-separated X-Forwarded-For header', () => {
    const req = new Request('https://example.com/api/audit', {
      method: 'POST',
      headers: { 'x-forwarded-for': '203.0.113.1, 10.0.0.1' },
    });
    const result = checkRateLimit(req);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });
});
