import type { ReactNode } from "react";

import { TableCell } from "@/features/workspace/shared/table/workspaceTableChrome";

import { formatAgeDays, formatHours, formatPercent } from "./riskMetricsFormatting";
import type { ScopeMetricRow } from "./riskMetricsTypes";

export function MetricStatCard({
  title,
  value,
  note,
  tone = "default",
}: {
  note: string;
  title: string;
  tone?: "default" | "priority";
  value: ReactNode;
}) {
  return (
    <article
      className={`worklog-summary-stat-card metrics-summary-card ${
        tone === "priority" ? "metrics-summary-card-priority" : ""
      }`}
    >
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
                <div className="metrics-hotspot-title-row">
                  <strong>{row.name}</strong>
                  {row.blockerCount > 0 ? (
                    <span className="status-pill status-pill-danger">Blocked</span>
                  ) : row.waitingForQaCount > 0 ? (
                    <span className="status-pill status-pill-warning">QA</span>
                  ) : (
                    <span className="status-pill status-pill-neutral">Active</span>
                  )}
                </div>
                <small>{row.subtitle}</small>
                <small className="metrics-hotspot-signal">
                  {row.activeTaskCount} open · {row.inProgressTaskCount} in progress · {row.waitingForQaCount} waiting QA
                </small>
                <small className="metrics-hotspot-signal">
                  Last activity: {formatAgeDays(row.lastActivityAgeDays)}
                  {row.ownerLabel ? ` · Owner: ${row.ownerLabel}` : ""}
                </small>
                <small className="metrics-hotspot-signal">
                  {row.blockerCount > 0
                    ? `Oldest blocker: ${formatAgeDays(row.oldestBlockerAgeDays)} · Reason: ${row.mostSevereReason ?? "Blocker"}`
                    : row.mostSevereReason ?? "No blocker pressure"}
                </small>
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
                  {formatPercent(row.taskCompletionRate)}
                </strong>
                <div className="metrics-completion-track" aria-hidden="true">
                  <span style={{ width: `${Math.max(0, Math.min(100, row.taskCompletionRate * 100))}%` }} />
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
