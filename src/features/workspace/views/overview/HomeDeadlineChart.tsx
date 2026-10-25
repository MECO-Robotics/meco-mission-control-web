import { parseLocalDate } from "@/lib/dateUtils";
import type { HomeDeadlineBucket, HomeDeadlineModel } from "./homeDeadlineModel";
import { HOME_TASK_STATUSES } from "./overviewViewModel";

const deadlineStatuses = HOME_TASK_STATUSES.filter(status => status.id !== "complete");

function counts(bucket: HomeDeadlineBucket) {
  return `${bucket.tasks.length} ${bucket.tasks.length === 1 ? "task" : "tasks"}, ${bucket.milestones.length} ${bucket.milestones.length === 1 ? "milestone" : "milestones"}`;
}

export function HomeDeadlineChart({ model, onSelect }: {
  model: HomeDeadlineModel;
  onSelect: (key: string) => void;
}) {
  const hasUpcoming = model.days.some(day => day.tasks.length || day.milestones.length);
  return <section className="home-deadline-chart" aria-labelledby="home-deadlines-title">
    <div className="workspace-section-heading">
      <h2 id="home-deadlines-title">Next 14 days</h2>
      <button className="home-deadline-overdue" type="button" onClick={() => onSelect("overdue")}
        aria-label={`Overdue: ${counts(model.overdue)}`}>
        Overdue <strong>{model.overdue.tasks.length}</strong> tasks · <strong>{model.overdue.milestones.length}</strong> milestones
      </button>
    </div>
    <div className="home-deadline-legend" aria-label="Task status colors">
      {deadlineStatuses.map(status => <span key={status.id}>
        <span className={`home-task-status-swatch home-tone-${status.tone}`} aria-hidden="true" />{status.label}
      </span>)}
    </div>
    <div className="home-deadline-columns" role="group" aria-label="Daily task deadlines and milestone dates">
      {model.days.map(day => {
        const date = parseLocalDate(day.key)!;
        const statuses = deadlineStatuses.map(status => ({ ...status, count: day.tasks.filter(task => task.status === status.id).length }));
        const breakdown = statuses.map(status => `${status.label}: ${status.count}`).join(", ");
        const description = `${day.key}: ${counts(day)}${day.tasks.length ? `. ${breakdown}` : ""}`;
        return <button className="home-deadline-day" key={day.key} type="button"
          aria-label={description} title={description} onClick={() => onSelect(day.key)}>
          <span className="home-deadline-count" aria-hidden="true">{day.tasks.length}</span>
          <span className="home-deadline-track" aria-hidden="true">
            <span className="home-deadline-bar"
              style={{ height: `${model.maxTaskCount ? day.tasks.length / model.maxTaskCount * 100 : 0}%` }}>
              {statuses.filter(status => status.count).map(status => <span key={status.id}
                className={`home-deadline-segment home-tone-${status.tone}`} style={{ flexGrow: status.count }} />)}
            </span>
          </span>
          <span className="home-deadline-milestones" aria-hidden="true">{day.milestones.length ? <>◆ {day.milestones.length}</> : "\u00a0"}</span>
          <time className="home-deadline-date" dateTime={day.key}>
            {date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </time>
        </button>;
      })}
    </div>
    <p className="home-chart-caption">Bars: tasks due · ◆: milestones</p>
    {!hasUpcoming ? <p className="empty-state">No unfinished tasks or milestones are dated in the next 14 days.</p> : null}
  </section>;
}
