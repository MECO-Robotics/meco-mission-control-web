import type { TaskRecord } from "@/types/recordsExecution";

import type { WorkLogsViewState } from "./workLogsViewState";

interface WorkLogsSummarySectionProps {
  onOpenTask: (task: TaskRecord) => void;
  summary: WorkLogsViewState["summary"];
  taskById: WorkLogsViewState["taskById"];
}

function formatHours(hours: number) {
  return `${hours.toLocaleString(undefined, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}h`;
}

function TimeMetricGraphic({
  colorClassName,
  hours,
  label,
  maxHours,
}: {
  colorClassName: string;
  hours: number;
  label: string;
  maxHours: number;
}) {
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const normalizedRatio = maxHours > 0 ? Math.max(0, Math.min(1, hours / maxHours)) : 0;
  const strokeDashoffset = circumference * (1 - normalizedRatio);

  return (
    <article className="risk-time-card">
      <h3>{label}</h3>
      <div className="risk-time-card-graphic" role="img" aria-label={`${label}: ${formatHours(hours)}`}>
        <svg viewBox="0 0 140 140">
          <circle className="risk-time-ring-track" cx="70" cy="70" r={radius} />
          <circle
            className={`risk-time-ring-fill ${colorClassName}`}
            cx="70"
            cy="70"
            r={radius}
            style={{
              strokeDasharray: `${circumference} ${circumference}`,
              strokeDashoffset,
            }}
          />
        </svg>
        <div className="risk-time-card-value">
          <strong className="font-mono">{formatHours(hours)}</strong>
        </div>
      </div>
    </article>
  );
}

export function WorkLogsSummarySection({
  onOpenTask,
  summary,
  taskById,
}: WorkLogsSummarySectionProps) {
  return (
    <>
      <div className="risk-time-metrics-shell">
        <TimeMetricGraphic
          colorClassName="risk-time-ring-planned"
          hours={summary.plannedHours}
          label="Time planned"
          maxHours={summary.maxMetricHours}
        />
        <TimeMetricGraphic
          colorClassName="risk-time-ring-done"
          hours={summary.loggedHours}
          label="Work done"
          maxHours={summary.maxMetricHours}
        />
      </div>

      <div className="risk-time-progress-shell">
        <p className="risk-time-progress-label">
          {summary.plannedHours > 0
            ? `${Math.round((summary.loggedHours / summary.plannedHours) * 100)}% of planned hours logged`
            : "No planned hours for current log scope yet"}
        </p>
        <div className="risk-time-progress-track" aria-hidden="true">
          <span style={{ width: summary.clampedCompletionWidth }} />
        </div>
        <p className="risk-time-progress-caption">
          {summary.isOverPlan
            ? `${formatHours(summary.overrunHours)} over plan`
            : `${formatHours(summary.remainingHours)} remaining to plan`}
        </p>
      </div>

      <div className="summary-row worklog-summary-stat-grid">
        <article className="worklog-summary-stat-card">
          <h3>Logs captured</h3>
          <strong className="font-mono">{summary.totalLogs}</strong>
        </article>
        <article className="worklog-summary-stat-card">
          <h3>Avg hours / log</h3>
          <strong className="font-mono">{formatHours(summary.averageHoursPerLog)}</strong>
        </article>
        <article className="worklog-summary-stat-card">
          <h3>Active contributors</h3>
          <strong className="font-mono">{summary.activeContributorCount}</strong>
        </article>
        <article className="worklog-summary-stat-card">
          <h3>Tasks represented</h3>
          <strong className="font-mono">{summary.tasksWithLogsCount}</strong>
        </article>
      </div>

      <div className="summary-row">
        <article className="worklog-summary-card">
          <h3>Top contributors</h3>
          {summary.topContributors.length === 0 ? (
            <p className="section-copy">No logged work yet.</p>
          ) : (
            <ol className="worklog-summary-list">
              {summary.topContributors.map((entry) => (
                <li className="worklog-summary-list-item" key={entry.id}>
                  <span className="worklog-summary-list-label">{entry.name}</span>
                  <strong className="font-mono">{formatHours(entry.hours)}</strong>
                </li>
              ))}
            </ol>
          )}
        </article>

        <article className="worklog-summary-card">
          <h3>Most logged tasks</h3>
          {summary.topTasks.length === 0 ? (
            <p className="section-copy">No task-linked logs yet.</p>
          ) : (
            <ol className="worklog-summary-list">
              {summary.topTasks.map((entry) => {
                const task = taskById[entry.id];

                return (
                  <li className="worklog-summary-list-item" key={entry.id}>
                    <div className="worklog-summary-task-meta">
                      {task ? (
                        <button
                          className="worklog-summary-task-link"
                          onClick={() => onOpenTask(task)}
                          type="button"
                        >
                          {entry.title}
                        </button>
                      ) : (
                        <span className="worklog-summary-list-label">{entry.title}</span>
                      )}
                      <small>{entry.subsystemName}</small>
                    </div>
                    <strong className="font-mono">{formatHours(entry.hours)}</strong>
                  </li>
                );
              })}
            </ol>
          )}
        </article>
      </div>
    </>
  );
}
