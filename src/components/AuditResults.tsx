'use client';

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

/** Derives a safe filename from a URL (strips protocol, replaces special chars). */
function urlToFilename(url: string): string {
  return url
    .replace(/^https?:\/\//, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 60);
}

function downloadJson(result: AuditResult): void {
  const json = JSON.stringify(result, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `audit-${urlToFilename(result.metrics.url)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function AuditResults({ result }: AuditResultsProps) {
  return (
    <div className="space-y-10">
      {/* Audit metadata */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
        <div>
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
        <button
          onClick={() => downloadJson(result)}
          className="shrink-0 rounded border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          aria-label="Download full audit report as JSON"
        >
          Download JSON
        </button>
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
