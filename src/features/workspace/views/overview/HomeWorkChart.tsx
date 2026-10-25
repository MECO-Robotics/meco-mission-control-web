import { HOME_PRESSURE_BUCKETS, type HomePressureBucket } from "./homePressureModel";
import { HOME_WORKLOAD_STATES, type HomeWorkloadModel, type HomeWorkloadState } from "./homeWorkloadModel";

const riskCountLabel = (count: number) => `${count} ${count === 1 ? "risk" : "risks"}`;

export function HomeWorkChart({ groupBy, onGroupChange, model, onSelectWorkload, onSelectRisks }: {
  groupBy: HomePressureBucket;
  onGroupChange: (group: HomePressureBucket) => void;
  model: HomeWorkloadModel;
  onSelectWorkload: (rowId: string, state: HomeWorkloadState | null) => void;
  onSelectRisks: (rowId: string | null) => void;
}) {
  const max = Math.max(1, ...model.rows.map(row => row.tasks.length));
  return <section className="home-work-chart home-workload-chart" aria-labelledby="home-work-chart-title">
    <div className="workspace-section-heading home-chart-heading">
      <h2 id="home-work-chart-title">Work and pressure</h2>
      <div className="workspace-presentation-controls home-chart-controls">
        <label>Group by <select aria-label="Work grouped by" value={groupBy}
          onChange={event => onGroupChange(event.target.value as HomePressureBucket)}>
          {HOME_PRESSURE_BUCKETS.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select></label>
      </div>
    </div>
    <div className="home-workload-totals">
      <span>{model.taskCount} unfinished tasks · {model.attentionCount} need attention</span>
      <button className="home-workload-risks" type="button" onClick={() => onSelectRisks(null)}
        disabled={!model.risks.length} aria-label={`All ${riskCountLabel(model.risks.length)}`}>{riskCountLabel(model.risks.length)}</button>
    </div>
    <div className="home-workload-legend" aria-label="Task states">
      {HOME_WORKLOAD_STATES.map(state => <span key={state.id}>
        <span className={`home-task-status-swatch home-tone-${state.tone}`} aria-hidden="true" />{state.label}
      </span>)}
    </div>
    <div className="home-workload-rows" role="region" aria-label="Work distribution groups" tabIndex={0}>
      {model.rows.map(row => <div className="home-workload-row" key={row.id}>
        <button className="home-workload-label" type="button" disabled={!row.tasks.length}
          onClick={() => onSelectWorkload(row.id, null)} aria-label={`${row.label}: ${row.tasks.length} unfinished tasks`}>{row.label}</button>
        <div className="home-workload-track" style={{ width: `${row.tasks.length / max * 100}%` }}>
          {HOME_WORKLOAD_STATES.map(state => {
            const count = row.tasksByState[state.id].length;
            return count ? <button className={`home-workload-segment home-tone-${state.tone}`} key={state.id} type="button"
              style={{ flexGrow: count }} onClick={() => onSelectWorkload(row.id, state.id)}
              aria-label={`${row.label}, ${state.label}: ${count} tasks`} title={`${state.label}: ${count}`}>{count}</button> : null;
          })}
        </div>
        <strong className="home-workload-count">{row.tasks.length}</strong>
        <button className="home-workload-risks" type="button" disabled={!row.risks.length}
          onClick={() => onSelectRisks(row.id)} aria-label={`${row.label}: ${riskCountLabel(row.risks.length)}`}>{riskCountLabel(row.risks.length)}</button>
      </div>)}
    </div>
    {!model.rows.length ? <p className="empty-state">No unfinished tasks or active risks in this scope.</p> : null}
    <p className="home-chart-caption">Pressure highlights blocked, overdue, due-soon and QA tasks. Risks are counted separately.
      {model.hasSharedAssignments ? " Records linked to several groups appear in each; totals count each record once." : " Each record appears once."}</p>
  </section>;
}
