import type { RobotMapSummaryModel } from "./robotMapViewModel";

interface RobotMapSummaryProps {
  summary: RobotMapSummaryModel;
}

export function RobotMapSummary({ summary }: RobotMapSummaryProps) {
  return (
    <div className="robot-map-summary-grid">
      <article className="robot-map-summary-card">
        <strong>{summary.subsystemCount}</strong>
        <small>Subsystems</small>
      </article>
      <article className="robot-map-summary-card">
        <strong>{summary.mechanismCount}</strong>
        <small>Mechanisms</small>
      </article>
      <article className="robot-map-summary-card">
        <strong>{summary.partInstanceCount}</strong>
        <small>Part instances</small>
      </article>
      <article className="robot-map-summary-card">
        <strong>{summary.openTaskCount}</strong>
        <small>Open tasks</small>
      </article>
      <article className="robot-map-summary-card">
        <strong>{summary.activeRiskCount}</strong>
        <small>High risks</small>
      </article>
    </div>
  );
}
