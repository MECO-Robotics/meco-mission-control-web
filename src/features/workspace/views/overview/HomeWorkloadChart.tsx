import { HOME_WORKLOAD_STATES, type HomeWorkloadMode, type HomeWorkloadModel, type HomeWorkloadState } from "./homeWorkloadModel";

export function HomeWorkloadChart({ model, mode, onSelect }: {
  model: HomeWorkloadModel;
  mode: HomeWorkloadMode;
  onSelect: (rowId: string, state: HomeWorkloadState | null) => void;
}) {
  const max = Math.max(1, ...model.rows.map(row => row.tasks.length));
  return (
    <section className="home-workload-chart" aria-labelledby="home-workload-title">
      <div className="workspace-section-heading">
        <h2 id="home-workload-title">Work by {mode === "team" ? "team" : "individual"}</h2>
        <span>{model.taskCount} unfinished tasks · {model.rows.length} {mode === "team" ? "teams" : "people"}</span>
      </div>
      <div className="home-workload-legend" aria-label="Task states">
        {HOME_WORKLOAD_STATES.map(state => <span key={state.id}>
          <span className={`home-task-status-swatch home-tone-${state.tone}`} aria-hidden="true" />{state.label}
        </span>)}
      </div>
      <div className="home-workload-rows" role="region" aria-label="Work distribution groups" tabIndex={0}>
        {model.rows.map(row => <div className="home-workload-row" key={row.id}>
          <button className="home-workload-label" type="button" onClick={() => onSelect(row.id, null)}
            aria-label={`${row.label}: ${row.tasks.length} unfinished tasks`}>{row.label}</button>
          <div className="home-workload-track" style={{ width: `${row.tasks.length / max * 100}%` }}>
            {HOME_WORKLOAD_STATES.map(state => {
              const count = row.tasksByState[state.id].length;
              return count ? <button className={`home-workload-segment home-tone-${state.tone}`} key={state.id} type="button"
                style={{ flexGrow: count }} onClick={() => onSelect(row.id, state.id)}
                aria-label={`${row.label}, ${state.label}: ${count} tasks`} title={`${state.label}: ${count}`}>{count}</button> : null;
            })}
          </div>
          <strong className="home-workload-count">{row.tasks.length}</strong>
        </div>)}
      </div>
      {!model.taskCount ? <p className="empty-state">No unfinished tasks in this scope.</p> : null}
      <p className="home-chart-caption">{model.hasSharedAssignments
        ? "Shared tasks appear for each assigned person; row totals can overlap."
        : "Each unfinished task appears once."}</p>
    </section>
  );
}
