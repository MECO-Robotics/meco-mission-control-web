import type { TaskRecord } from "@/types/recordsExecution";
import type { TaskStatus } from "@/types/common";
import { HOME_TASK_STATUSES } from "./overviewViewModel";

export function HomeTaskStatusDistribution({ tasksByStatus, onSelect }: {
  tasksByStatus: Record<TaskStatus, TaskRecord[]>;
  onSelect: (status: TaskStatus | null) => void;
}) {
  const tasks = HOME_TASK_STATUSES.flatMap(({ id }) => tasksByStatus[id]);
  const total = tasks.length;
  return (
    <section className="home-task-status" aria-labelledby="home-task-status-title">
      <div className="workspace-section-heading">
        <h2 id="home-task-status-title">Task status</h2><span>{total} tasks</span>
      </div>
      <div className="home-status-chart">
        <button className="home-donut-button" disabled={!total} type="button" aria-label={`View all ${total} tasks`}
          onClick={() => onSelect(null)}>
          <svg className="home-donut" viewBox="0 0 120 120" aria-hidden="true">
            <circle className="home-donut-track" cx="60" cy="60" r="46" />
            {HOME_TASK_STATUSES.map(({ id, tone }, index) => {
              const count = tasksByStatus[id].length;
              const size = total ? count / total * 100 : 0;
              const start = total ? HOME_TASK_STATUSES.slice(0, index).reduce((sum, status) => sum + tasksByStatus[status.id].length, 0) / total * 100 : 0;
              return count ? <circle className={`home-donut-arc home-tone-${tone}`} key={id} cx="60" cy="60" r="46"
                pathLength="100" strokeDasharray={`${size} ${100 - size}`} strokeDashoffset={-start}
                transform="rotate(-90 60 60)" /> : null;
            })}
            <text className="home-donut-value" x="60" y="58">{total ? `${Math.round(tasksByStatus.complete.length / total * 100)}%` : "0"}</text>
            <text className="home-donut-label" x="60" y="73">{total ? "complete" : "tasks"}</text>
          </svg>
        </button>
        <div className="home-task-status-legend" aria-label="View tasks by status">
          {HOME_TASK_STATUSES.map(({ id, label, tone }) => (
            <button className="home-task-status-choice" key={id} type="button" disabled={!tasksByStatus[id].length}
              aria-label={`${label}: ${tasksByStatus[id].length} tasks`}
              onClick={() => onSelect(id)}>
              <span className={`home-task-status-swatch home-tone-${tone}`} aria-hidden="true" />
              <span>{label}</span><strong>{tasksByStatus[id].length}</strong>
            </button>
          ))}
        </div>
      </div>
      {!total ? <p className="empty-state">No tasks in this scope.</p> : null}
      <p className="home-chart-caption">Select a status to review its tasks.</p>
    </section>
  );
}
