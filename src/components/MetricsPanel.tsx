import type { PageMetrics } from '@/types/audit';

// ---------------------------------------------------------------------------
// MetricCard — individual count stat
// ---------------------------------------------------------------------------

interface MetricCardProps {
  label: string;
  value: string | number | null;
  sub?: string;
  highlight?: 'red' | 'none';
  badge?: string;
}

function MetricCard({ label, value, sub, highlight = 'none', badge }: MetricCardProps) {
  const display = value === null || value === undefined ? 'Not found' : String(value);
  const isMissing = value === null || value === undefined;
  const isRed = highlight === 'red';

  // For ALT TEXT progress bar: extract numeric percentage if available
  const numericValue =
    isRed && typeof value === 'string'
      ? parseFloat(value.replace('%', ''))
      : null;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={
        isRed
          ? { backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }
          : { backgroundColor: '#fff', border: '1px solid #E5E7EB' }
      }
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-1 mb-1">
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: isRed ? '#EF4444' : '#5B72B8' }}
          >
            {label}
          </p>
          {badge && (
            <span
              className="text-xs font-semibold rounded px-1.5 py-0.5"
              style={{ color: '#EF4444', backgroundColor: '#FEE2E2' }}
            >
              {badge}
            </span>
          )}
        </div>
        <p
          className={`text-3xl font-bold tracking-tight ${isMissing ? 'italic' : ''}`}
          style={{ color: isRed ? '#EF4444' : isMissing ? '#9CA3AF' : '#111827' }}
        >
          {display}
        </p>
        {sub && (
          <p className="mt-0.5 text-xs" style={{ color: isRed ? '#F87171' : '#9CA3AF' }}>
            {sub}
          </p>
        )}
      </div>

      {/* Progress bar — shown only on ALT TEXT (red highlight) */}
      {isRed && numericValue !== null && (
        <div className="h-1.5" style={{ backgroundColor: '#FECACA' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(numericValue, 100)}%`,
              backgroundColor: '#EF4444',
            }}
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MetaCard — full-width meta title / description
// ---------------------------------------------------------------------------

function MetaCard({ label, value }: { label: string; value: string | null }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ backgroundColor: '#fff', border: '1px solid #E5E7EB' }}
    >
      <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#5B72B8' }}>
        {label}
      </p>
      <p className="text-sm font-medium" style={{ color: value ? '#111827' : '#9CA3AF' }}>
        {value ?? <span className="italic">Not found</span>}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MetricsPanel
// ---------------------------------------------------------------------------

interface MetricsPanelProps {
  metrics: PageMetrics;
}

export function MetricsPanel({ metrics }: MetricsPanelProps) {
  const altStatus = `${metrics.imageCount} image${metrics.imageCount === 1 ? '' : 's'} total`;
  const altLow = metrics.imageCount > 0 && metrics.altTextPercent < 50;

  return (
    <section aria-labelledby="metrics-heading">
      {/* Section heading */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-start gap-3">
          <div
            className="shrink-0 w-1 self-stretch rounded-full mt-0.5"
            style={{ backgroundColor: '#3B5BDB' }}
            aria-hidden="true"
          />
          <div>
            <h2 id="metrics-heading" className="text-lg font-bold" style={{ color: '#111827' }}>
              Factual Metrics
            </h2>
            <p className="text-sm" style={{ color: '#3B5BDB' }}>
              Extracted deterministically — no AI involved
            </p>
          </div>
        </div>
        <span
          className="shrink-0 text-xs font-semibold uppercase tracking-widest rounded px-2 py-1"
          style={{ color: '#6B7280', border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}
        >
          Factual
        </span>
      </div>

      {/* Meta */}
      <div className="space-y-2 mb-4">
        <MetaCard label="Meta Title" value={metrics.metaTitle} />
        <MetaCard label="Meta Description" value={metrics.metaDescription} />
      </div>

      {/* Counts grid */}
      <div className="grid grid-cols-3 gap-3">
        <MetricCard label="Word Count" value={metrics.wordCount} sub="total words" />
        <MetricCard label="H1 Headings" value={metrics.h1Count} />
        <MetricCard label="H2 Headings" value={metrics.h2Count} />
        <MetricCard label="H3 Headings" value={metrics.h3Count} />
        <MetricCard label="CTAs Found" value={metrics.ctaCount} sub="heuristic" />
        <MetricCard label="Internal Links" value={metrics.internalLinks} sub="same domain" />
        <MetricCard label="External Links" value={metrics.externalLinks} sub="other domains" />
        <MetricCard label="Images" value={metrics.imageCount} />
        <MetricCard
          label="Alt Text"
          value={`${metrics.altTextPercent}%`}
          sub={altStatus}
          highlight={altLow ? 'red' : 'none'}
          badge={altLow ? 'Low' : undefined}
        />
      </div>

      {/* PageSpeed / Lighthouse — only shown when scores are available */}
      {(metrics.performanceScore !== null ||
        metrics.accessibilityScore !== null ||
        metrics.bestPracticesScore !== null ||
        metrics.seoScore !== null) && (
        <div className="mt-5">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-sm font-semibold" style={{ color: '#374151' }}>
              PageSpeed / Lighthouse Scores
            </p>
            <span
              className="rounded-full px-2 py-0.5 text-xs font-medium"
              style={{ backgroundColor: '#EFF6FF', color: '#3B5BDB' }}
            >
              via Google
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ScoreCard label="Performance" value={metrics.performanceScore} />
            <ScoreCard label="Accessibility" value={metrics.accessibilityScore} />
            <ScoreCard label="Best Practices" value={metrics.bestPracticesScore} />
            <ScoreCard label="SEO" value={metrics.seoScore} />
          </div>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// ScoreCard
// ---------------------------------------------------------------------------

interface ScoreCardProps {
  label: string;
  value: number | null;
}

function scoreColor(value: number): string {
  if (value >= 90) return '#16A34A';
  if (value >= 50) return '#D97706';
  return '#DC2626';
}

function ScoreCard({ label, value }: ScoreCardProps) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ backgroundColor: '#fff', border: '1px solid #E5E7EB' }}
    >
      <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#5B72B8' }}>
        {label}
      </p>
      {value === null ? (
        <p className="text-2xl font-bold italic" style={{ color: '#9CA3AF' }}>N/A</p>
      ) : (
        <p className="text-2xl font-bold" style={{ color: scoreColor(value) }}>
          {value}
          <span className="ml-0.5 text-sm font-normal" style={{ color: '#9CA3AF' }}>/100</span>
        </p>
      )}
    </div>
  );
}
