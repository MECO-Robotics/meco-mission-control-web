import { AppTopbarSlotPortal } from "@/components/layout/AppTopbarSlotPortal";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";

import type { ScopeMetricRow } from "../RiskMetrics";
import { RiskMetricsSection } from "../RiskMetricsSection";
import type { RiskMetricsData } from "../riskViewData/riskViewDataScope";

interface RiskMetricsPanelProps {
  embedded?: boolean;
  mechanismMetrics: ScopeMetricRow[];
  metricsSearch: string;
  onMetricsSearchChange: (search: string) => void;
  subsystemMetrics: ScopeMetricRow[];
  metrics: RiskMetricsData;
}

export function RiskMetricsPanel({
  embedded = false,
  mechanismMetrics,
  metricsSearch,
  onMetricsSearchChange,
  subsystemMetrics,
  metrics,
}: RiskMetricsPanelProps) {
  return (
    <>
      {!embedded ? <AppTopbarSlotPortal slot="controls">
        <div className="panel-actions filter-toolbar risk-metrics-toolbar">
          <TopbarResponsiveSearch
            ariaLabel="Search metrics"
            compactPlaceholder="Search"
            onChange={onMetricsSearchChange}
            placeholder="Search metrics..."
            value={metricsSearch}
          />
        </div>
      </AppTopbarSlotPortal> : null}

      <RiskMetricsSection
        {...metrics}
        mechanismMetrics={mechanismMetrics}
        subsystemMetrics={subsystemMetrics}
      />
    </>
  );
}
