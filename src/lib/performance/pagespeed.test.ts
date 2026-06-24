import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchPageSpeedScores } from './pagespeed';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal valid PageSpeed API response shape. */
function makeApiResponse(scores: Record<string, number | null>) {
  return {
    lighthouseResult: {
      categories: {
        performance: { score: scores.performance },
        accessibility: { score: scores.accessibility },
        'best-practices': { score: scores['best-practices'] },
        seo: { score: scores.seo },
      },
    },
  };
}

function mockFetch(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response);
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

describe('fetchPageSpeedScores', () => {
  it('returns rounded 0–100 integer scores from a valid response', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch(
        makeApiResponse({
          performance: 0.89,
          accessibility: 0.95,
          'best-practices': 1.0,
          seo: 0.72,
        }),
      ),
    );

    const scores = await fetchPageSpeedScores('https://example.com');

    expect(scores.performanceScore).toBe(89);
    expect(scores.accessibilityScore).toBe(95);
    expect(scores.bestPracticesScore).toBe(100);
    expect(scores.seoScore).toBe(72);
  });

  it('rounds fractional scores correctly (e.g. 0.915 → 92)', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch(
        makeApiResponse({
          performance: 0.915,
          accessibility: 0.915,
          'best-practices': 0.915,
          seo: 0.915,
        }),
      ),
    );

    const scores = await fetchPageSpeedScores('https://example.com');
    expect(scores.performanceScore).toBe(92);
  });

  it('returns null for a category whose score is null in the response', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch(
        makeApiResponse({
          performance: 0.8,
          accessibility: null,
          'best-practices': 0.9,
          seo: null,
        }),
      ),
    );

    const scores = await fetchPageSpeedScores('https://example.com');
    expect(scores.performanceScore).toBe(80);
    expect(scores.accessibilityScore).toBeNull();
    expect(scores.seoScore).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // Missing / malformed response
  // ---------------------------------------------------------------------------

  it('returns all nulls when lighthouseResult is missing', async () => {
    vi.stubGlobal('fetch', mockFetch({ id: 'https://example.com' }));

    const scores = await fetchPageSpeedScores('https://example.com');
    expect(scores).toEqual({
      performanceScore: null,
      accessibilityScore: null,
      bestPracticesScore: null,
      seoScore: null,
    });
  });

  it('returns all nulls when categories object is empty', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch({ lighthouseResult: { categories: {} } }),
    );

    const scores = await fetchPageSpeedScores('https://example.com');
    expect(scores.performanceScore).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // HTTP errors
  // ---------------------------------------------------------------------------

  it('returns all nulls on a 400 response', async () => {
    vi.stubGlobal('fetch', mockFetch({ error: { code: 400 } }, 400));

    const scores = await fetchPageSpeedScores('https://example.com');
    expect(scores).toEqual({
      performanceScore: null,
      accessibilityScore: null,
      bestPracticesScore: null,
      seoScore: null,
    });
  });

  it('returns all nulls on a 500 response', async () => {
    vi.stubGlobal('fetch', mockFetch({ error: 'internal' }, 500));

    const scores = await fetchPageSpeedScores('https://example.com');
    expect(scores.performanceScore).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // Network / timeout errors
  // ---------------------------------------------------------------------------

  it('returns all nulls when fetch throws a network error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('ENOTFOUND')),
    );

    const scores = await fetchPageSpeedScores('https://example.com');
    expect(scores).toEqual({
      performanceScore: null,
      accessibilityScore: null,
      bestPracticesScore: null,
      seoScore: null,
    });
  });

  it('returns all nulls when fetch is aborted (timeout)', async () => {
    const abortError = Object.assign(new Error('The operation was aborted.'), {
      name: 'AbortError',
    });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortError));

    const scores = await fetchPageSpeedScores('https://example.com');
    expect(scores.performanceScore).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // API key handling
  // ---------------------------------------------------------------------------

  it('includes API key in URL when GOOGLE_PAGESPEED_API_KEY is set', async () => {
    const mockFn = mockFetch(makeApiResponse({ performance: 0.9, accessibility: 0.9, 'best-practices': 0.9, seo: 0.9 }));
    vi.stubGlobal('fetch', mockFn);
    vi.stubEnv('GOOGLE_PAGESPEED_API_KEY', 'test-key-123');

    await fetchPageSpeedScores('https://example.com');

    const calledUrl = mockFn.mock.calls[0]?.[0] as string;
    expect(calledUrl).toContain('key=test-key-123');
  });

  it('does not include key param when GOOGLE_PAGESPEED_API_KEY is not set', async () => {
    const mockFn = mockFetch(makeApiResponse({ performance: 0.9, accessibility: 0.9, 'best-practices': 0.9, seo: 0.9 }));
    vi.stubGlobal('fetch', mockFn);
    vi.stubEnv('GOOGLE_PAGESPEED_API_KEY', '');

    await fetchPageSpeedScores('https://example.com');

    const calledUrl = mockFn.mock.calls[0]?.[0] as string;
    expect(calledUrl).not.toContain('key=');
  });
});
