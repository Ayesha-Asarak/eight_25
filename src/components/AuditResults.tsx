import type { AuditResult } from '@/types/audit';
import { MetricsPanel } from './MetricsPanel';
import { InsightsPanel } from './InsightsPanel';
import { RecommendationsPanel } from './RecommendationsPanel';

interface AuditResultsProps {
  result: AuditResult;
}

function formatAuditedAt(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function AuditResults({ result }: AuditResultsProps) {
  return (
    <div className="space-y-10">
      {/* Audit metadata */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
        <span className="font-medium text-gray-800">Audited:</span>{' '}
        <a
          href={result.metrics.url}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all text-blue-600 hover:underline"
        >
          {result.metrics.url}
        </a>{' '}
        <span className="mx-2 text-gray-300">·</span>
        <time dateTime={result.auditedAt}>{formatAuditedAt(result.auditedAt)}</time>
      </div>

      {/* ── FACTUAL METRICS ─────────────────────────────────── */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-6">
        <MetricsPanel metrics={result.metrics} />
      </div>

      {/* ── DIVIDER ─────────────────────────────────────────── */}
      <div className="relative flex items-center">
        <div className="flex-1 border-t border-gray-200" />
        <span className="mx-4 shrink-0 rounded-full border border-violet-200 bg-violet-50 px-4 py-1 text-xs font-medium text-violet-600">
          AI‑generated analysis below
        </span>
        <div className="flex-1 border-t border-gray-200" />
      </div>

      {/* ── AI INSIGHTS ─────────────────────────────────────── */}
      <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-6">
        <InsightsPanel insights={result.insights} />
      </div>

      {/* ── RECOMMENDATIONS ─────────────────────────────────── */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-6">
        <RecommendationsPanel recommendations={result.insights.recommendations} />
      </div>
    </div>
  );
}
