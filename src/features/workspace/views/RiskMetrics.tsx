import type { ReactNode } from "react";

import type { TaskRecord } from "@/types/recordsExecution";
import { TableCell } from "@/features/workspace/shared/table/workspaceTableChrome";

export interface ScopeMetricRow {
  id: string;
  name: string;
  subtitle: string;
  taskCount: number;
  activeTaskCount: number;
  completeTaskCount: number;
  waitingForQaCount: number;
  blockerCount: number;
  plannedHours: number;
  loggedHours: number;
  completionRate: number;
  qaPassCount: number;
}

export function formatPercent(ratio: number) {
  return `${Math.round(Math.max(0, ratio) * 100)}%`;
}

export function buildScopeMetrics<T extends { id: string; name: string }>(
  items: T[],
  tasks: TaskRecord[],
  workHoursByTaskId: Map<string, number>,
  qaPassTaskIds: Set<string>,
  getSubtitle: (item: T) => string,
  getLinkedSummary: (item: T) => string,
  matchesTask: (task: TaskRecord, item: T) => boolean,
) {
  return items
    .map((item) => {
      const scopedTasks = tasks.filter((task) => matchesTask(task, item));
      const completeTaskCount = scopedTasks.filter((task) => task.status === "complete").length;
      const waitingForQaCount = scopedTasks.filter(
        (task) => task.status === "waiting-for-qa",
      ).length;
      const blockerCount = scopedTasks.reduce((sum, task) => sum + task.blockers.length, 0);
      const plannedHours = scopedTasks.reduce(
        (sum, task) => sum + Math.max(0, Number(task.estimatedHours) || 0),
        0,
      );
      const loggedHours = scopedTasks.reduce(
        (sum, task) => sum + (workHoursByTaskId.get(task.id) ?? 0),
        0,
      );
      const qaPassCount = scopedTasks.filter((task) => qaPassTaskIds.has(task.id)).length;

      return {
        id: item.id,
        name: item.name,
        subtitle: `${getSubtitle(item)} | ${getLinkedSummary(item)}`,
        taskCount: scopedTasks.length,
        activeTaskCount: scopedTasks.length - completeTaskCount,
        completeTaskCount,
        waitingForQaCount,
        blockerCount,
        plannedHours: Number(plannedHours.toFixed(1)),
        loggedHours: Number(loggedHours.toFixed(1)),
        completionRate: Number(
          (completeTaskCount / Math.max(scopedTasks.length, 1)).toFixed(2),
        ),
        qaPassCount,
      } satisfies ScopeMetricRow;
    })
    .sort((left, right) => {
      const activeOrder = right.activeTaskCount - left.activeTaskCount;
      if (activeOrder !== 0) {
        return activeOrder;
      }

      const blockerOrder = right.blockerCount - left.blockerCount;
      if (blockerOrder !== 0) {
        return blockerOrder;
      }

      const completionOrder = left.completionRate - right.completionRate;
      if (completionOrder !== 0) {
        return completionOrder;
      }

      return left.name.localeCompare(right.name);
    });
}

export function MetricStatCard({
  title,
  value,
  note,
}: {
  note: string;
  title: string;
  value: ReactNode;
}) {
  return (
    <article className="worklog-summary-stat-card metrics-summary-card">
      <h3>{title}</h3>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

export function MetricHotspotCard({
  rows,
  title,
  subtitle,
}: {
  rows: ScopeMetricRow[];
  title: string;
  subtitle: string;
}) {
  return (
    <article className="worklog-summary-card metrics-hotspot-card">
      <h3>{title}</h3>
      <p className="section-copy">{subtitle}</p>
      {rows.length === 0 ? (
        <p className="section-copy">No active work in scope yet.</p>
      ) : (
        <ol className="metrics-hotspot-list">
          {rows.map((row) => (
            <li className="metrics-hotspot-list-item" key={row.id}>
              <div className="metrics-hotspot-meta">
                <strong>{row.name}</strong>
                <small>{row.subtitle}</small>
              </div>
              <span>{row.blockerCount > 0 ? `${row.blockerCount} blockers` : `${row.activeTaskCount} open`}</span>
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}

export function MetricScopeTable({
  rows,
  subtitle,
  title,
  scopeLabel,
}: {
  rows: ScopeMetricRow[];
  scopeLabel: string;
  subtitle: string;
  title: string;
}) {
  const gridTemplateColumns = "minmax(220px, 2fr) 0.75fr 0.75fr 0.85fr 0.8fr 1fr 1.1fr";

  return (
    <article className="metrics-scope-card">
      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <p className="eyebrow metrics-section-eyebrow">{scopeLabel}</p>
          <h3>{title}</h3>
          <p className="section-copy filter-copy">{subtitle}</p>
        </div>
        <p className="metrics-section-count">{rows.length} items</p>
      </div>

      <div className="table-shell metrics-scope-table-shell">
        <div
          className="ops-table ops-table-header metrics-scope-table-header"
          style={{ gridTemplateColumns }}
        >
          <span>{scopeLabel}</span>
          <span>Tasks</span>
          <span>Open</span>
          <span>QA</span>
          <span>Blockers</span>
          <span>Hours</span>
          <span>Completion</span>
        </div>

        {rows.map((row) => (
          <div
            className="ops-table ops-row metrics-scope-row"
            key={row.id}
            style={{ gridTemplateColumns }}
          >
            <TableCell label={scopeLabel}>
              <div className="metrics-scope-entity">
                <strong style={{ color: "var(--text-title)" }}>{row.name}</strong>
                <small>{row.subtitle}</small>
              </div>
            </TableCell>

            <TableCell label="Tasks">
              <strong style={{ color: "var(--text-title)" }}>{row.completeTaskCount}</strong>
              <small>{row.taskCount} total</small>
            </TableCell>

            <TableCell label="Open">{row.activeTaskCount}</TableCell>

            <TableCell label="QA">
              <strong style={{ color: "var(--text-title)" }}>{row.waitingForQaCount}</strong>
              <small>{row.qaPassCount} passes</small>
            </TableCell>

            <TableCell label="Blockers">{row.blockerCount}</TableCell>

            <TableCell label="Hours">
              <strong style={{ color: "var(--text-title)" }}>
                {formatHours(row.plannedHours)}
              </strong>
              <small>{formatHours(row.loggedHours)} logged</small>
            </TableCell>

            <TableCell label="Completion">
              <div className="metrics-completion-cell">
                <strong style={{ color: "var(--text-title)" }}>
                  {formatPercent(row.completionRate)}
                </strong>
                <div className="metrics-completion-track" aria-hidden="true">
                  <span style={{ width: `${Math.max(0, Math.min(100, row.completionRate * 100))}%` }} />
                </div>
              </div>
            </TableCell>
          </div>
        ))}

        {rows.length === 0 ? <p className="empty-state">No items in scope yet.</p> : null}
      </div>
    </article>
  );
}

export function formatHours(hours: number) {
  return `${hours.toLocaleString(undefined, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}h`;
}

export function TimeMetricGraphic({
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
          <circle
            className="risk-time-ring-track"
            cx="70"
            cy="70"
            r={radius}
          />
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
          <strong>{formatHours(hours)}</strong>
        </div>
      </div>
    </article>
  );
}
