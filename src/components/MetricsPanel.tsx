import type { PageMetrics } from '@/types/audit';

interface MetricCardProps {
  label: string;
  value: string | number | null;
  sub?: string;
}

function MetricCard({ label, value, sub }: MetricCardProps) {
  const display = value === null || value === undefined ? 'Not found' : String(value);
  const isMissing = value === null || value === undefined;

  return (
    <div className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-blue-500">
        {label}
      </p>
      <p
        className={`mt-1 text-xl font-bold ${isMissing ? 'text-gray-400 italic' : 'text-gray-900'}`}
      >
        {display}
      </p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

interface MetricsPanelProps {
  metrics: PageMetrics;
}

export function MetricsPanel({ metrics }: MetricsPanelProps) {
  const altStatus =
    metrics.imageCount === 0
      ? 'no images'
      : `${metrics.imageCount} image${metrics.imageCount === 1 ? '' : 's'} total`;

  return (
    <section aria-labelledby="metrics-heading">
      <div className="mb-4">
        <h2
          id="metrics-heading"
          className="text-lg font-bold text-gray-900"
        >
          Factual Metrics
        </h2>
        <p className="text-sm text-blue-600">
          Extracted deterministically — no AI involved
        </p>
      </div>

      {/* Meta */}
      <div className="mb-3 space-y-2">
        <MetricCard label="Meta Title" value={metrics.metaTitle} />
        <MetricCard label="Meta Description" value={metrics.metaDescription} />
      </div>

      {/* Counts grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <MetricCard label="Word Count" value={metrics.wordCount} sub="total words" />
        <MetricCard label="H1 Headings" value={metrics.h1Count} />
        <MetricCard label="H2 Headings" value={metrics.h2Count} />
        <MetricCard label="H3 Headings" value={metrics.h3Count} />
        <MetricCard label="CTAs Found" value={metrics.ctaCount} sub="heuristic" />
        <MetricCard
          label="Internal Links"
          value={metrics.internalLinks}
          sub="same domain"
        />
        <MetricCard
          label="External Links"
          value={metrics.externalLinks}
          sub="other domains"
        />
        <MetricCard label="Images" value={metrics.imageCount} />
        <MetricCard
          label="Alt Text"
          value={`${metrics.altTextPercent}%`}
          sub={altStatus}
        />
      </div>
    </section>
  );
}
