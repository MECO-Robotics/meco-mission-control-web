import {
  MetricStatCard,
  formatAgeDays,
  formatHours,
  formatPercent,
} from "./RiskMetrics";

export interface RiskMetricsSectionData {
  blockerBreakdown: {
    designIssue: number;
    lostBrokenPart: number;
    lostBrokenTool: number;
    supplyMaterial: number;
    other: number;
  };
  buildHealthActions: string[];
  buildHealthReasons: string[];
  buildHealthStatus: "On Track" | "Behind" | "Ahead" | "At Risk";
  clampedCompletionWidth: string;
  completedTaskCount: number;
  hoursLoggedRate: number;
  loggedHours: number;
  logsThisWeekHours: number | null;
  lowStockMaterials: number;
  mentorActionRequiredCount: number | null;
  oldestBlockerAgeDays: number | null;
  oldestQaWaitingAgeDays: number | null;
  ownerlessTaskCount: number;
  pendingPurchaseCount: number;
  planStatus: "On Track" | "Behind" | "Ahead" | "At Risk";
  plannedHours: number;
  qaPassCount: number;
  qaWaitingCount: number;
  remainingPlannedHours: number;
  scopedTaskCount: number;
  staleSubsystemCount: number | null;
  staleTaskCount: number | null;
  staleTaskThresholdDays: number;
  staleTaskUnavailableCount: number;
  studentRevisionRequiredCount: number | null;
  supplySignals: number;
  taskCompletionRate: number;
  taskCompletionWidth: string;
  totalMechanismCount: number;
  totalSubsystemCount: number;
  untouchedMechanismCount: number;
  unresolvedBlockerCount: number;
  expectedProgressRate: number | null;
  activeSubsystemCount: number;
  activeMechanismCount: number;
}

function getStatusClassName(status: "On Track" | "Behind" | "Ahead" | "At Risk") {
  switch (status) {
    case "At Risk":
      return "status-pill status-pill-danger";
    case "Behind":
      return "status-pill status-pill-warning";
    case "Ahead":
      return "status-pill status-pill-success";
    default:
      return "status-pill status-pill-info";
  }
}

function renderBlockerBreakdown(breakdown: RiskMetricsSectionData["blockerBreakdown"]) {
  const entries = [
    ["design issue", breakdown.designIssue],
    ["lost/broken part", breakdown.lostBrokenPart],
    ["lost/broken tool", breakdown.lostBrokenTool],
    ["supply/material", breakdown.supplyMaterial],
    ["other", breakdown.other],
  ] as const;
  const populatedEntries = entries.filter((entry) => entry[1] > 0);

  if (populatedEntries.length === 0) {
    return "Breakdown unavailable for current scope";
  }

  return populatedEntries.map(([label, count]) => `${count} ${label}`).join(" · ");
}

function formatThisWeekHours(logsThisWeekHours: number | null) {
  if (logsThisWeekHours === null) {
    return "This-week trend unavailable";
  }

  return `+${formatHours(logsThisWeekHours)} this week`;
}

function buildQaAttentionNote({
  mentorActionRequiredCount,
  oldestQaWaitingAgeDays,
  qaWaitingCount,
  studentRevisionRequiredCount,
}: {
  mentorActionRequiredCount: number | null;
  oldestQaWaitingAgeDays: number | null;
  qaWaitingCount: number;
  studentRevisionRequiredCount: number | null;
}) {
  if (qaWaitingCount === 0) {
    return "No tasks are currently waiting on QA";
  }

  const detailParts = [
    `Oldest waiting: ${formatAgeDays(oldestQaWaitingAgeDays)}`,
    mentorActionRequiredCount === null
      ? "Mentor action unavailable"
      : `${mentorActionRequiredCount} mentor action required`,
    studentRevisionRequiredCount === null
      ? "Student revision unavailable"
      : `${studentRevisionRequiredCount} student revision required`,
  ];

  return detailParts.join(" · ");
}

export function MetricsTopSummary(data: RiskMetricsSectionData) {
  return (
    <div className="metrics-top-grid">
      <article className="worklog-summary-card metrics-health-card">
        <div className="metrics-health-header">
          <p className="eyebrow metrics-section-eyebrow">Build Health</p>
          <span className={getStatusClassName(data.buildHealthStatus)}>{data.buildHealthStatus}</span>
        </div>
        <h3>Build Health: {data.buildHealthStatus}</h3>
        <p className="section-copy">Main reasons</p>
        <ul className="metrics-health-list">
          {data.buildHealthReasons.length > 0 ? (
            data.buildHealthReasons.map((reason) => <li key={reason}>{reason}</li>)
          ) : (
            <li>No immediate risk signals in current scope.</li>
          )}
        </ul>
        <p className="section-copy">Next actions</p>
        <ul className="metrics-health-list metrics-health-list-actions">
          {data.buildHealthActions.length > 0 ? (
            data.buildHealthActions.map((action) => <li key={action}>{action}</li>)
          ) : (
            <li>Continue current execution cadence.</li>
          )}
        </ul>
      </article>

      <article className="worklog-summary-card metrics-plan-card">
        <div className="metrics-health-header">
          <p className="eyebrow metrics-section-eyebrow">Plan vs Actual</p>
          <span className={getStatusClassName(data.planStatus)}>{data.planStatus}</span>
        </div>
        <h3>Plan vs Actual</h3>
        <p className="metrics-plan-line">
          <strong>{formatHours(data.plannedHours)}</strong> planned
        </p>
        <p className="metrics-plan-line">
          <strong>{formatHours(data.loggedHours)}</strong> logged
        </p>
        <p className="metrics-plan-line">
          <strong>{formatHours(data.remainingPlannedHours)}</strong> remaining
        </p>
        <p className="risk-time-progress-label">
          {formatPercent(data.hoursLoggedRate)} of planned hours logged
        </p>
        <div className="risk-time-progress-track" aria-hidden="true">
          <span style={{ width: data.clampedCompletionWidth }} />
        </div>
        <p className="risk-time-progress-caption">{formatThisWeekHours(data.logsThisWeekHours)}</p>
        {data.expectedProgressRate !== null ? (
          <p className="risk-time-progress-caption">Expected by today: {formatPercent(data.expectedProgressRate)}</p>
        ) : null}
      </article>
    </div>
  );
}

export function MetricsProgressSection(data: RiskMetricsSectionData) {
  return (
    <section className="metrics-intent-section">
      <div className="panel-header compact-header metrics-intent-header">
        <h3>Progress</h3>
      </div>
      <div className="metrics-summary-grid">
        <MetricStatCard
          note={`${data.completedTaskCount} of ${data.scopedTaskCount} tasks closed`}
          title="Task completion"
          value={formatPercent(data.taskCompletionRate)}
        />
        <MetricStatCard
          note={`${formatPercent(data.hoursLoggedRate)} of ${formatHours(data.plannedHours)} planned`}
          title="Logged work"
          value={formatHours(data.loggedHours)}
        />
        <MetricStatCard
          note="Remaining planned hours"
          title="Planned work remaining"
          value={formatHours(data.remainingPlannedHours)}
        />
        <MetricStatCard
          note="Mentor-backed QA passes"
          title="QA passes"
          value={data.qaPassCount}
        />
      </div>
      <div className="metrics-task-progress-rail" aria-hidden="true">
        <span style={{ width: data.taskCompletionWidth }} />
      </div>
      <p className="risk-time-progress-caption">{formatPercent(data.taskCompletionRate)} of tasks complete</p>
    </section>
  );
}

export function MetricsNeedsAttentionSection(data: RiskMetricsSectionData) {
  return (
    <section className="metrics-intent-section">
      <div className="panel-header compact-header metrics-intent-header">
        <h3>Needs Attention</h3>
      </div>
      <div className="metrics-summary-grid">
        <MetricStatCard
          note={`${renderBlockerBreakdown(data.blockerBreakdown)} · Oldest: ${formatAgeDays(data.oldestBlockerAgeDays)}`}
          title="Blockers"
          tone="priority"
          value={data.unresolvedBlockerCount}
        />
        <MetricStatCard
          note={buildQaAttentionNote({
            mentorActionRequiredCount: data.mentorActionRequiredCount,
            oldestQaWaitingAgeDays: data.oldestQaWaitingAgeDays,
            qaWaitingCount: data.qaWaitingCount,
            studentRevisionRequiredCount: data.studentRevisionRequiredCount,
          })}
          title="QA waiting"
          tone="priority"
          value={data.qaWaitingCount}
        />
        <MetricStatCard
          note={`${data.pendingPurchaseCount} pending purchases · ${data.lowStockMaterials} low-stock materials`}
          title="Supply risks"
          value={data.supplySignals}
        />
        <MetricStatCard
          note={`No activity for ${data.staleTaskThresholdDays}+ days${
            data.staleTaskUnavailableCount > 0
              ? ` · ${data.staleTaskUnavailableCount} task${data.staleTaskUnavailableCount === 1 ? "" : "s"} missing timestamp data`
              : ""
          }`}
          title="Stale tasks"
          value={data.staleTaskCount ?? "Unavailable"}
        />
        <MetricStatCard
          note="Open tasks without owner or assignee"
          title="Ownerless tasks"
          value={data.ownerlessTaskCount}
        />
      </div>
    </section>
  );
}

export function MetricsCoverageSection(data: RiskMetricsSectionData) {
  return (
    <section className="metrics-intent-section">
      <div className="panel-header compact-header metrics-intent-header">
        <h3>Coverage</h3>
      </div>
      <div className="metrics-summary-grid">
        <MetricStatCard
          note={`${data.activeSubsystemCount} of ${data.totalSubsystemCount} subsystems with active work`}
          title="Subsystem coverage"
          value={data.activeSubsystemCount}
        />
        <MetricStatCard
          note={`${data.activeMechanismCount} of ${data.totalMechanismCount} mechanisms with active work`}
          title="Mechanism coverage"
          value={data.activeMechanismCount}
        />
        <MetricStatCard
          note="Mechanisms with no scoped tasks"
          title="Untouched mechanisms"
          value={data.untouchedMechanismCount}
        />
        <MetricStatCard
          note="Subsystems with active work and stale activity"
          title="Stale subsystems"
          value={data.staleSubsystemCount ?? "Unavailable"}
        />
      </div>
    </section>
  );
}
