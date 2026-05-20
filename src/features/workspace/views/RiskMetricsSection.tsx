import type { ScopeMetricRow } from "./RiskMetrics";
import { MetricHotspotCard, MetricScopeTable } from "./RiskMetrics";
import {
  MetricsCoverageSection,
  MetricsNeedsAttentionSection,
  MetricsProgressSection,
  MetricsTopSummary,
  type RiskMetricsSectionData,
} from "./riskMetricsSectionCards";

interface RiskMetricsSectionProps extends RiskMetricsSectionData {
  mechanismMetrics: ScopeMetricRow[];
  subsystemMetrics: ScopeMetricRow[];
}

export function RiskMetricsSection({
  mechanismMetrics,
  subsystemMetrics,
  ...data
}: RiskMetricsSectionProps) {
  return (
    <div className="metrics-dashboard-shell">
      <MetricsTopSummary {...data} />
      <MetricsProgressSection {...data} />
      <MetricsNeedsAttentionSection {...data} />
      <MetricsCoverageSection {...data} />

      <div className="metrics-hotspot-grid">
        <MetricHotspotCard
          rows={subsystemMetrics.slice(0, 4)}
          subtitle="Diagnostic pressure view with blockers, QA queue, activity age, and ownership context."
          title="Subsystem pressure"
        />
        <MetricHotspotCard
          rows={mechanismMetrics.slice(0, 4)}
          subtitle="Mechanism pressure ordered by blocker and QA urgency."
          title="Mechanism pressure"
        />
      </div>

      <MetricScopeTable
        rows={subsystemMetrics}
        scopeLabel="Subsystem"
        subtitle="Task volume, open queues, blockers, and completion signals by subsystem."
        title="Subsystem metrics"
      />

      <MetricScopeTable
        rows={mechanismMetrics}
        scopeLabel="Mechanism"
        subtitle="The same diagnostic signals one level deeper to expose mechanism bottlenecks."
        title="Mechanism metrics"
      />
    </div>
  );
}
