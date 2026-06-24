import type { Recommendation } from '@/types/audit';

const PRIORITY_COLORS: Record<number, { accent: string; badge: string; badgeBg: string }> = {
  1: { accent: '#DC2626', badge: '#DC2626', badgeBg: '#FEE2E2' },
  2: { accent: '#EA580C', badge: '#EA580C', badgeBg: '#FFEDD5' },
  3: { accent: '#D97706', badge: '#D97706', badgeBg: '#FEF3C7' },
  4: { accent: '#3B5BDB', badge: '#3B5BDB', badgeBg: '#EFF6FF' },
  5: { accent: '#6B7280', badge: '#6B7280', badgeBg: '#F3F4F6' },
};

interface RecommendationCardProps {
  rec: Recommendation;
  index: number;
}

function RecommendationCard({ rec, index }: RecommendationCardProps) {
  const colors = PRIORITY_COLORS[rec.priority] ?? PRIORITY_COLORS[5];

  return (
    <div
      className="rounded-xl p-5"
      style={{
        backgroundColor: '#fff',
        border: '1px solid #E5E7EB',
        borderLeft: `4px solid ${colors.accent}`,
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-semibold text-sm leading-snug" style={{ color: '#111827' }}>
          <span className="mr-2 font-normal" style={{ color: '#9CA3AF' }}>#{index + 1}</span>
          {rec.title}
        </h3>
        <span
          className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold"
          style={{ color: colors.badge, backgroundColor: colors.badgeBg }}
        >
          P{rec.priority}
        </span>
      </div>

      <p className="text-sm mb-3 leading-relaxed" style={{ color: '#6B7280' }}>
        {rec.reasoning}
      </p>

      {rec.metricRefs.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs" style={{ color: '#9CA3AF' }}>Grounded in:</span>
          {rec.metricRefs.map((ref) => (
            <span
              key={ref}
              className="rounded px-2 py-0.5 font-mono text-xs"
              style={{ backgroundColor: '#F3F4F6', color: '#374151' }}
            >
              {ref}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

interface RecommendationsPanelProps {
  recommendations: Recommendation[];
}

export function RecommendationsPanel({ recommendations }: RecommendationsPanelProps) {
  const sorted = [...recommendations].sort((a, b) => a.priority - b.priority);

  return (
    <section aria-labelledby="recs-heading">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-start gap-3">
          <div
            className="shrink-0 w-1 self-stretch rounded-full mt-0.5"
            style={{ backgroundColor: '#D97706' }}
            aria-hidden="true"
          />
          <div>
            <h2 id="recs-heading" className="text-lg font-bold" style={{ color: '#111827' }}>
              Recommendations
            </h2>
            <p className="text-sm" style={{ color: '#D97706' }}>
              Prioritised by business impact — grounded in extracted metrics
            </p>
          </div>
        </div>
        <span
          className="shrink-0 text-xs font-semibold uppercase tracking-widest rounded px-2 py-1"
          style={{ color: '#6B7280', border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}
        >
          AI-Generated
        </span>
      </div>

      <div className="space-y-3">
        {sorted.map((rec, i) => (
          <RecommendationCard key={i} rec={rec} index={i} />
        ))}
      </div>
    </section>
  );
}
