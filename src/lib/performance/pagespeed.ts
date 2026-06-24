/**
 * Google PageSpeed Insights API v5 fetcher.
 *
 * Architecture note:
 * - Lives in performance/ — NOT in metrics/ (metrics/ is pure DOM extraction).
 * - Called from the API route in parallel with scrapePage().
 * - Never throws: always returns { scores } where each score is number | null.
 *   This means a PageSpeed failure never blocks the audit.
 *
 * Trade-offs:
 * - Uses external Google API — adds ~5–15s latency (run in parallel).
 * - Optional API key: without key, Google quota is ~2 req/100s per IP.
 * - Vercel Hobby 10s limit: scores may return null on slow responses.
 * - Not in-process Lighthouse: avoids Chrome/memory limits on serverless.
 */

const PAGESPEED_API_BASE = 'https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed';
const CATEGORIES = ['PERFORMANCE', 'ACCESSIBILITY', 'BEST_PRACTICES', 'SEO'] as const;
const FETCH_TIMEOUT_MS = 12_000;

export interface PageSpeedScores {
  performanceScore: number | null;
  accessibilityScore: number | null;
  bestPracticesScore: number | null;
  seoScore: number | null;
}

const NULL_SCORES: PageSpeedScores = {
  performanceScore: null,
  accessibilityScore: null,
  bestPracticesScore: null,
  seoScore: null,
};

/**
 * Rounds a 0–1 Lighthouse score to a 0–100 integer.
 * Returns null if the value is missing or not a number.
 */
function toScore(value: unknown): number | null {
  if (typeof value !== 'number' || isNaN(value)) return null;
  return Math.round(value * 100);
}

/**
 * Fetches Lighthouse category scores from the Google PageSpeed Insights API.
 *
 * Returns null scores (not null/undefined itself) on any failure:
 * - Missing API key (proceeds without key at lower quota)
 * - Network error or timeout
 * - Non-2xx HTTP response
 * - Unexpected response shape
 */
export async function fetchPageSpeedScores(url: string): Promise<PageSpeedScores> {
  try {
    const params = new URLSearchParams({ url, strategy: 'mobile' });
    for (const cat of CATEGORIES) {
      params.append('category', cat);
    }

    const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
    if (apiKey) params.set('key', apiKey);

    const endpoint = `${PAGESPEED_API_BASE}?${params.toString()}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(endpoint, { signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res.ok) {
      console.warn(
        `[performance] PageSpeed API returned ${res.status} for ${url} — scores will be null`,
      );
      return NULL_SCORES;
    }

    const data = (await res.json()) as Record<string, unknown>;
    const categories = (
      data as { lighthouseResult?: { categories?: Record<string, { score?: unknown }> } }
    ).lighthouseResult?.categories;

    if (!categories) return NULL_SCORES;

    return {
      performanceScore: toScore(categories['performance']?.score),
      accessibilityScore: toScore(categories['accessibility']?.score),
      bestPracticesScore: toScore(categories['best-practices']?.score),
      seoScore: toScore(categories['seo']?.score),
    };
  } catch (err) {
    const reason =
      err instanceof Error && err.name === 'AbortError'
        ? 'timeout'
        : err instanceof Error
          ? err.message
          : 'unknown error';
    console.warn(`[performance] PageSpeed fetch failed for ${url}: ${reason} — scores will be null`);
    return NULL_SCORES;
  }
}
