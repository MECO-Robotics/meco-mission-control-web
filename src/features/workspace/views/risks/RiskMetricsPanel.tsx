import { AppTopbarSlotPortal } from "@/components/layout/AppTopbarSlotPortal";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";

import type { ScopeMetricRow } from "../RiskMetrics";
import { RiskMetricsSection } from "../RiskMetricsSection";
import type { useRisksViewModel } from "../riskViewModel";

interface RiskMetricsPanelProps {
  mechanismMetrics: ScopeMetricRow[];
  metricsSearch: string;
  onMetricsSearchChange: (search: string) => void;
  subsystemMetrics: ScopeMetricRow[];
  viewModel: ReturnType<typeof useRisksViewModel>;
}

export function RiskMetricsPanel({
  mechanismMetrics,
  metricsSearch,
  onMetricsSearchChange,
  subsystemMetrics,
  viewModel,
}: RiskMetricsPanelProps) {
  return (
    <>
      <AppTopbarSlotPortal slot="controls">
        <div className="panel-actions filter-toolbar risk-metrics-toolbar">
          <TopbarResponsiveSearch
            ariaLabel="Search metrics"
            compactPlaceholder="Search"
            onChange={onMetricsSearchChange}
            placeholder="Search metrics..."
            value={metricsSearch}
          />
        </div>
      </AppTopbarSlotPortal>

      <RiskMetricsSection
        blockerBreakdown={viewModel.blockerBreakdown}
        buildHealthActions={viewModel.buildHealthActions}
        buildHealthReasons={viewModel.buildHealthReasons}
        buildHealthStatus={viewModel.buildHealthStatus}
        expectedProgressRate={viewModel.expectedProgressRate}
        activeMechanismCount={viewModel.activeMechanismCount}
        activeSubsystemCount={viewModel.activeSubsystemCount}
        completedTaskCount={viewModel.completedTaskCount}
        hoursLoggedRate={viewModel.hoursLoggedRate}
        clampedCompletionWidth={viewModel.clampedCompletionWidth}
        loggedHours={viewModel.loggedHours}
        logsThisWeekHours={viewModel.logsThisWeekHours}
        lowStockMaterials={viewModel.lowStockMaterials}
        mechanismMetrics={mechanismMetrics}
        mentorActionRequiredCount={viewModel.mentorActionRequiredCount}
        oldestBlockerAgeDays={viewModel.oldestBlockerAgeDays}
        oldestQaWaitingAgeDays={viewModel.oldestQaWaitingAgeDays}
        ownerlessTaskCount={viewModel.ownerlessTaskCount}
        pendingPurchaseCount={viewModel.pendingPurchaseCount}
        planStatus={viewModel.planStatus}
        plannedHours={viewModel.plannedHours}
        qaPassCount={viewModel.qaPassCount}
        qaWaitingCount={viewModel.qaWaitingCount}
        remainingPlannedHours={viewModel.remainingPlannedHours}
        scopedTaskCount={viewModel.totalTaskCount}
        staleSubsystemCount={viewModel.staleSubsystemCount}
        staleTaskCount={viewModel.staleTaskCount}
        staleTaskThresholdDays={viewModel.staleTaskThresholdDays}
        staleTaskUnavailableCount={viewModel.staleTaskUnavailableCount}
        studentRevisionRequiredCount={viewModel.studentRevisionRequiredCount}
        subsystemMetrics={subsystemMetrics}
        supplySignals={viewModel.supplySignals}
        taskCompletionRate={viewModel.taskCompletionRate}
        taskCompletionWidth={viewModel.taskCompletionWidth}
        totalMechanismCount={viewModel.totalMechanismCount}
        totalSubsystemCount={viewModel.totalSubsystemCount}
        untouchedMechanismCount={viewModel.untouchedMechanismCount}
        unresolvedBlockerCount={viewModel.unresolvedBlockerCount}
      />
    </>
  );
}
