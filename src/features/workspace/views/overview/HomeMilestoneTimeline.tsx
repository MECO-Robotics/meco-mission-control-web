import type { MilestoneRecord } from "@/types/recordsExecution";
import { formatMilestoneReadinessLabel } from "@/features/workspace/views/milestones/milestonesViewUtils";

// Compare calendar dates rather than elapsed hours across daylight-saving boundaries.
export function milestoneDayOffset(startAt: string, today: Date) {
  const [year, month, day] = startAt.slice(0, 10).split("-").map(Number);
  return Math.round((Date.UTC(year, month - 1, day) - Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000);
}

export function HomeMilestoneTimeline({ milestones, today, onSelect }: {
  milestones: MilestoneRecord[];
  today: Date;
  onSelect: (milestone: MilestoneRecord) => void;
}) {
  const horizon = Math.max(28, ...milestones.map(milestone => milestoneDayOffset(milestone.startAt, today)));
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + horizon);
  const dateLabel = (date: Date) => date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return (
    <section className="home-milestone-timeline" aria-labelledby="home-milestones-title">
      <div className="workspace-section-heading">
        <h2 id="home-milestones-title">Upcoming milestones</h2><span>Next {milestones.length} milestones</span>
      </div>
      {milestones.length ? <>
        <div className="home-milestone-axis" aria-hidden="true"><span>Today</span><span>{dateLabel(end)}</span></div>
        <div className="home-milestone-chart">
          {milestones.map(milestone => {
            const days = milestoneDayOffset(milestone.startAt, today);
            return <button className="home-milestone-row" key={milestone.id} type="button"
              onClick={() => onSelect(milestone)} aria-label={`${milestone.title}, ${days === 0 ? "today" : `in ${days} days`}, ${formatMilestoneReadinessLabel(milestone.readinessStatus)}`}>
              <span className="home-milestone-copy"><strong>{milestone.title}</strong>
                <span>{milestone.startAt.slice(0, 10)} · {formatMilestoneReadinessLabel(milestone.readinessStatus)}</span>
              </span>
              <span className="home-milestone-track" aria-hidden="true">
                <span className="home-milestone-point" data-readiness={milestone.readinessStatus ?? "unknown"}
                  style={{ left: `${days / horizon * 100}%` }}><i /><span>{days === 0 ? "Today" : `${days}d`}</span></span>
              </span>
            </button>;
          })}
        </div>
      </> : <p className="empty-state">No upcoming milestones in this scope.</p>}
    </section>
  );
}
