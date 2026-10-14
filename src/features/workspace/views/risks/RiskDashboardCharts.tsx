import type { CSSProperties } from "react";
import type { AreaPressure, DeadlineBucket, RiskChartSelection } from "./riskDashboardModel";

const segments = [
  { id: "blocked", label: "Blocked", tone: "danger" },
  { id: "dependency", label: "Dependency", tone: "warning" },
  { id: "qa", label: "QA", tone: "info" },
  { id: "other", label: "Other work", tone: "neutral" },
] as const;

interface Props {
  areas: AreaPressure[];
  deadlines: DeadlineBucket[];
  selection: RiskChartSelection | null;
  onSelect: (selection: RiskChartSelection) => void;
}

export function RiskDashboardCharts({ areas, deadlines, selection, onSelect }: Props) {
  const maxTasks = Math.max(1, ...areas.map((area) => area.taskCount));
  const maxDeadline = Math.max(1, ...deadlines.flatMap((bucket) => [bucket.taskCount, bucket.riskCount]));
  return <div className="risk-review-charts">
    <section className="risk-chart risk-area-chart" aria-labelledby="risk-areas-title">
      <div className="risk-chart-heading"><h2 id="risk-areas-title">Bottlenecks by area</h2><span>Unfinished tasks</span></div>
      <div className="risk-chart-legend">{segments.map((segment) => <span key={segment.id}><i className={`risk-chart-swatch tone-${segment.tone}`} />{segment.label}</span>)}</div>
      {areas.length ? <div className="risk-area-groups">{[...new Set(areas.map((area) => area.projectId))].map((projectId) => <section className="risk-area-group" key={projectId} aria-label={areas.find((area) => area.projectId === projectId)!.projectLabel}>
        <h3>{areas.find((area) => area.projectId === projectId)!.projectLabel}</h3>
        <ul className="risk-area-bars">{areas.filter((area) => area.projectId === projectId).map((area) => <li key={area.id}>
        <button className="risk-area-name" type="button" aria-pressed={selection?.kind === "area" && selection.areaId === area.id && !selection.segment} onClick={() => onSelect({ kind: "area", areaId: area.id })}><span>{area.label}</span></button>
        <div className="risk-area-bar" style={{ "--risk-bar-width": `${area.taskCount / maxTasks * 100}%` } as CSSProperties}>
          {segments.map((segment) => area[segment.id] ? <button key={segment.id} className={`risk-bar-segment tone-${segment.tone}`} style={{ flexGrow: area[segment.id] }} type="button" aria-label={`${area.label}, ${area.projectLabel}: ${area[segment.id]} ${segment.label.toLowerCase()} tasks of ${area.taskCount}`} aria-pressed={selection?.kind === "area" && selection.areaId === area.id && selection.segment === segment.id} onClick={() => onSelect({ kind: "area", areaId: area.id, segment: segment.id })}>{area[segment.id]}</button> : null)}
        </div>
        <span className="risk-area-total" aria-label={`${area.taskCount} unfinished tasks`}>{area.taskCount}</span>
      </li>)}</ul></section>)}</div> : <p className="risk-chart-empty">No unfinished work in this scope.</p>}
      <p className="risk-chart-note">Tasks in multiple areas appear in each. Select a bar to review its work and linked risks.</p>
    </section>
    <section className="risk-chart risk-deadline-chart" aria-labelledby="risk-deadlines-title">
      <div className="risk-chart-heading"><h2 id="risk-deadlines-title">Deadline exposure</h2></div>
      <div className="risk-deadline-columns"><span /><span>Tasks</span><span>Mitigations</span></div>
      {deadlines.map((bucket) => <div className="risk-deadline-row" key={bucket.id}>
        <span>{bucket.label}</span>
        {(["task", "risk"] as const).map((source) => {
          const count = source === "task" ? bucket.taskCount : bucket.riskCount;
          const tone = bucket.id === "overdue" ? "danger" : bucket.id === "today" || bucket.id === "soon" ? "warning" : "neutral";
          return <button key={source} className={`risk-deadline-bar tone-${tone}`} style={{ "--risk-bar-width": `${count / maxDeadline * 100}%` } as CSSProperties} type="button" disabled={!count} aria-label={`${bucket.label}: ${count} ${source === "task" ? "unfinished tasks" : "risk mitigation deadlines"}`} aria-pressed={selection?.kind === "deadline" && selection.bucket === bucket.id && selection.source === source} onClick={() => onSelect({ kind: "deadline", bucket: bucket.id, source })}><span>{count}</span></button>;
        })}
      </div>)}
      <p className="risk-chart-note">Recorded deadlines, not a delivery forecast.</p>
    </section>
  </div>;
}
