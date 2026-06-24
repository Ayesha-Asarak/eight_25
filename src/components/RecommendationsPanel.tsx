import type { Recommendation } from '@/types/audit';

const PRIORITY_STYLES: Record<number, { badge: string; border: string }> = {
  1: {
    badge: 'bg-red-100 text-red-700',
    border: 'border-l-red-400',
  },
  2: {
    badge: 'bg-orange-100 text-orange-700',
    border: 'border-l-orange-400',
  },
  3: {
    badge: 'bg-amber-100 text-amber-700',
    border: 'border-l-amber-400',
  },
  4: {
    badge: 'bg-blue-100 text-blue-700',
    border: 'border-l-blue-400',
  },
  5: {
    badge: 'bg-gray-100 text-gray-600',
    border: 'border-l-gray-300',
  },
};

interface RecommendationCardProps {
  rec: Recommendation;
  index: number;
}

function RecommendationCard({ rec, index }: RecommendationCardProps) {
  const style = PRIORITY_STYLES[rec.priority] ?? PRIORITY_STYLES[5];

  return (
    <div
      className={`rounded-lg border border-gray-200 border-l-4 ${style.border} bg-white p-5 shadow-sm`}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <h3 className="font-semibold text-gray-900">
          <span className="mr-2 text-gray-400">#{index + 1}</span>
          {rec.title}
        </h3>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${style.badge}`}
        >
          P{rec.priority}
        </span>
      </div>

      <p className="mb-3 text-sm text-gray-600">{rec.reasoning}</p>

      {rec.metricRefs.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-gray-400">Grounded in:</span>
          {rec.metricRefs.map((ref) => (
            <span
              key={ref}
              className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600"
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
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 id="recs-heading" className="text-lg font-bold text-gray-900">
            Recommendations
          </h2>
          <p className="text-sm text-amber-600">
            Prioritised by business impact — grounded in extracted metrics
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
          AI‑generated
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
