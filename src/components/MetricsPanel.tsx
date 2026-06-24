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

      {/* PageSpeed / Lighthouse scores */}
      <div className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-700">
            PageSpeed / Lighthouse Scores
          </p>
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-600">
            via Google
          </span>
        </div>
        {metrics.performanceScore === null &&
        metrics.accessibilityScore === null &&
        metrics.bestPracticesScore === null &&
        metrics.seoScore === null ? (
          <p className="text-sm italic text-gray-400">
            PageSpeed scores unavailable — add{' '}
            <code className="rounded bg-gray-100 px-1 text-xs">
              GOOGLE_PAGESPEED_API_KEY
            </code>{' '}
            to your environment or the API timed out.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ScoreCard label="Performance" value={metrics.performanceScore} />
            <ScoreCard label="Accessibility" value={metrics.accessibilityScore} />
            <ScoreCard label="Best Practices" value={metrics.bestPracticesScore} />
            <ScoreCard label="SEO" value={metrics.seoScore} />
          </div>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// ScoreCard — colour-coded Lighthouse score display
// ---------------------------------------------------------------------------

interface ScoreCardProps {
  label: string;
  value: number | null;
}

function scoreColor(value: number): string {
  if (value >= 90) return 'text-green-600';
  if (value >= 50) return 'text-amber-600';
  return 'text-red-600';
}

function ScoreCard({ label, value }: ScoreCardProps) {
  return (
    <div className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-blue-500">{label}</p>
      {value === null ? (
        <p className="mt-1 text-xl font-bold italic text-gray-400">N/A</p>
      ) : (
        <p className={`mt-1 text-xl font-bold ${scoreColor(value)}`}>
          {value}
          <span className="ml-0.5 text-sm font-normal text-gray-400">/100</span>
        </p>
      )}
    </div>
  );
}
