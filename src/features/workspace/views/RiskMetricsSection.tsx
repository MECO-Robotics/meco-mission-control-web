import type { ScopeMetricRow } from "./RiskMetrics";
import {
  MetricHotspotCard,
  MetricScopeTable,
  MetricStatCard,
  TimeMetricGraphic,
  formatHours,
  formatPercent,
} from "./RiskMetrics";

interface RiskMetricsSectionProps {
  activeMechanismCount: number;
  activeSubsystemCount: number;
  attendanceHours: number;
  blockerCount: number;
  clampedCompletionWidth: string;
  completionRate: number;
  completedTaskCount: number;
  deliveredPurchases: number;
  loggedHours: number;
  lowStockMaterials: number;
  maxMetricHours: number;
  mechanismMetrics: ScopeMetricRow[];
  plannedHours: number;
  qaPassCount: number;
  scopedTaskCount: number;
  subsystemMetrics: ScopeMetricRow[];
  supplySignals: number;
  waitingForQaCount: number;
  totalMechanismCount: number;
  totalSubsystemCount: number;
}

export function RiskMetricsSection({
  activeMechanismCount,
  activeSubsystemCount,
  attendanceHours,
  blockerCount,
  clampedCompletionWidth,
  completionRate,
  completedTaskCount,
  deliveredPurchases,
  loggedHours,
  lowStockMaterials,
  maxMetricHours,
  mechanismMetrics,
  plannedHours,
  qaPassCount,
  scopedTaskCount,
  subsystemMetrics,
  supplySignals,
  waitingForQaCount,
  totalMechanismCount,
  totalSubsystemCount,
}: RiskMetricsSectionProps) {
  return (
    <>
      <div className="risk-time-metrics-shell">
        <TimeMetricGraphic
          colorClassName="risk-time-ring-planned"
          hours={plannedHours}
          label="Time planned"
          maxHours={maxMetricHours}
        />
        <TimeMetricGraphic
          colorClassName="risk-time-ring-done"
          hours={loggedHours}
          label="Work logged"
          maxHours={maxMetricHours}
        />
      </div>

      <div className="risk-time-progress-shell">
        <p className="risk-time-progress-label">
          {plannedHours > 0
            ? `${Math.round(completionRate * 100)}% of planned hours logged`
            : "No planned hours yet"}
        </p>
        <div className="risk-time-progress-track" aria-hidden="true">
          <span style={{ width: clampedCompletionWidth }} />
        </div>
        <p className="risk-time-progress-caption">
          {loggedHours > plannedHours
            ? `${formatHours(loggedHours - plannedHours)} over plan`
            : `${formatHours(plannedHours - loggedHours)} remaining to plan`}
        </p>
      </div>

      <div className="metrics-summary-grid">
        <MetricStatCard
          note={`${completedTaskCount} of ${scopedTaskCount} tasks complete`}
          title="Completion rate"
          value={formatPercent(completionRate)}
        />
        <MetricStatCard
          note={`${formatHours(plannedHours)} planned`}
          title="Execution hours"
          value={formatHours(loggedHours)}
        />
        <MetricStatCard
          note="Tasks that still need a next move"
          title="Open tasks"
          value={scopedTaskCount - completedTaskCount}
        />
        <MetricStatCard
          note="Review gates still waiting on a decision"
          title="QA"
          value={waitingForQaCount}
        />
        <MetricStatCard
          note="Unresolved blockers across all tasks"
          title="Blockers"
          value={blockerCount}
        />
        <MetricStatCard
          note={`${activeSubsystemCount} of ${totalSubsystemCount} subsystems have work`}
          title="Subsystem coverage"
          value={activeSubsystemCount}
        />
        <MetricStatCard
          note={`${activeMechanismCount} of ${totalMechanismCount} mechanisms have work`}
          title="Mechanism coverage"
          value={activeMechanismCount}
        />
        <MetricStatCard
          note={`${deliveredPurchases} delivered purchases | ${lowStockMaterials} low-stock materials`}
          title="Supply watch"
          value={supplySignals}
        />
        <MetricStatCard
          note="Attendance records and meeting sign-ins"
          title="Attendance hours"
          value={formatHours(attendanceHours)}
        />
        <MetricStatCard
          note="Mentor-backed QA approvals"
          title="QA passes"
          value={qaPassCount}
        />
      </div>

      <div className="metrics-hotspot-grid">
        <MetricHotspotCard
          rows={subsystemMetrics.slice(0, 3)}
          subtitle="Subsystems sorted by open work and blocker pressure."
          title="Subsystem pressure"
        />
        <MetricHotspotCard
          rows={mechanismMetrics.slice(0, 3)}
          subtitle="Mechanisms sorted by open work and blocker pressure."
          title="Mechanism pressure"
        />
      </div>

      <MetricScopeTable
        rows={subsystemMetrics}
        scopeLabel="Subsystem"
        subtitle="Count tasks, active work, QA pressure, blockers, and logged time at the subsystem level."
        title="Subsystem metrics"
      />

      <MetricScopeTable
        rows={mechanismMetrics}
        scopeLabel="Mechanism"
        subtitle="Track the same signals one layer deeper so mechanism bottlenecks are visible early."
        title="Mechanism metrics"
      />
    </>
  );
}
