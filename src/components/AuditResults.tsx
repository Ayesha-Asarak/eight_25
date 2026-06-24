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
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

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
    <div className="space-y-6">
      {/* ── Audited bar ───────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm" style={{ color: '#6B7280' }}>
        <div className="flex items-center gap-2 flex-wrap">
          <span style={{ color: '#374151' }}>Audited:</span>
          <a
            href={result.metrics.url}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all font-medium hover:underline"
            style={{ color: '#3B5BDB' }}
          >
            {result.metrics.url}
          </a>
          <span style={{ color: '#D1D5DB' }}>·</span>
          <time dateTime={result.auditedAt}>{formatAuditedAt(result.auditedAt)}</time>
        </div>
        <button
          onClick={() => downloadJson(result)}
          className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition hover:bg-white"
          style={{ color: '#374151', border: '1px solid #D1D5DB', backgroundColor: 'transparent' }}
          aria-label="Download full audit report as JSON"
        >
          Download JSON
        </button>
      </div>

      {/* ── Factual Metrics ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <MetricsPanel metrics={result.metrics} />
      </div>

      {/* ── Divider ───────────────────────────────────────────── */}
      <div className="relative flex items-center py-2">
        <div className="flex-1" style={{ borderTop: '1px solid #E5E7EB' }} />
        <span
          className="mx-4 shrink-0 rounded-full px-4 py-1.5 text-xs font-medium flex items-center gap-1.5"
          style={{ border: '1px solid #E5E7EB', backgroundColor: 'white', color: '#6B7280' }}
        >
          <span style={{ color: '#3B5BDB' }}>+</span>
          AI-Generated Analysis
        </span>
        <div className="flex-1" style={{ borderTop: '1px solid #E5E7EB' }} />
      </div>

      {/* ── AI Insights ───────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <InsightsPanel insights={result.insights} />
      </div>

      {/* ── Recommendations ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <RecommendationsPanel recommendations={result.insights.recommendations} />
      </div>
    </div>
  );
}
