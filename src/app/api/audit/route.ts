import { NextResponse } from 'next/server';
import { scrapePage } from '@/lib/scraper/index';
import { analyzePage } from '@/lib/ai/index';
import { fetchPageSpeedScores } from '@/lib/performance/index';
import { validateAuditRequest } from '@/lib/api/validate-request';
import { mapToAuditError } from '@/lib/api/map-error';
import { checkRateLimit } from '@/lib/api/rate-limit';
import { PageMetricsSchema } from '@/types/audit';
import type { AuditResponse, AuditErrorResponse } from '@/types/api';
import type { AuditResult } from '@/types/audit';

/**
 * Increase Vercel function timeout.
 * Hobby plan max = 10s; Pro plan = 60s.
 * Documented in README trade-offs.
 */
export const maxDuration = 60;

export async function POST(request: Request): Promise<NextResponse> {
  // Rate-limit check — before any expensive work
  const rateLimit = checkRateLimit(request);
  if (!rateLimit.allowed) {
    return NextResponse.json<AuditErrorResponse>(
      {
        error: `Too many requests. Please wait ${rateLimit.retryAfterSeconds} seconds before trying again.`,
        code: 'RATE_LIMITED',
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.retryAfterSeconds),
          'X-RateLimit-Remaining': '0',
        },
      },
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { url } = validateAuditRequest(body);

    // Run scrape and PageSpeed in parallel to reduce total latency.
    // fetchPageSpeedScores never throws — returns null scores on any failure.
    const [scrapeResult, pageSpeedScores] = await Promise.all([
      scrapePage(url),
      fetchPageSpeedScores(url),
    ]);

    // Merge PageSpeed scores into the DOM metrics and re-validate.
    const metrics = PageMetricsSchema.parse({
      ...scrapeResult.metrics,
      ...pageSpeedScores,
    });

    const { insights } = await analyzePage(metrics, scrapeResult.contentExcerpt);

    const result: AuditResult = {
      metrics,
      insights,
      auditedAt: new Date().toISOString(),
    };

    return NextResponse.json<AuditResponse>(
      { data: result },
      {
        headers: {
          'X-RateLimit-Remaining': String(rateLimit.remaining),
        },
      },
    );
  } catch (err) {
    const { status, body } = mapToAuditError(err);
    return NextResponse.json(body, { status });
  }
}
