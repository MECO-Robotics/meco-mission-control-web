import type { OverviewMetric } from "./overviewViewModel";

interface OverviewMetricGridProps {
  metrics: OverviewMetric[];
}

export function OverviewMetricGrid({ metrics }: OverviewMetricGridProps) {
  return (
    <div className="overview-metric-grid">
      {metrics.map((metric) => (
        <article className="overview-metric-card" data-tone={metric.tone ?? "neutral"} key={metric.id}>
          <strong>{metric.value}</strong>
          <small>{metric.label}</small>
        </article>
      ))}
    </div>
  );
}
