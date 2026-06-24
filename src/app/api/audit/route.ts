import { NextResponse } from 'next/server';
import { scrapePage } from '@/lib/scraper/index';
import { analyzePage } from '@/lib/ai/index';
import { validateAuditRequest } from '@/lib/api/validate-request';
import { mapToAuditError } from '@/lib/api/map-error';
import type { AuditResponse } from '@/types/api';
import type { AuditResult } from '@/types/audit';

/**
 * Increase Vercel function timeout.
 * Hobby plan max = 10s; Pro plan = 60s.
 * Document this trade-off in README.
 */
export const maxDuration = 60;

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json().catch(() => ({}));
    const { url } = validateAuditRequest(body);

    const { metrics, contentExcerpt } = await scrapePage(url);
    const { insights } = await analyzePage(metrics, contentExcerpt);

    const result: AuditResult = {
      metrics,
      insights,
      auditedAt: new Date().toISOString(),
    };

    return NextResponse.json<AuditResponse>({ data: result });
  } catch (err) {
    const { status, body } = mapToAuditError(err);
    return NextResponse.json(body, { status });
  }
}
