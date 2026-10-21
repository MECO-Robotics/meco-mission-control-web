import type { MilestoneRecord } from "@/types/recordsExecution";
import { getMilestoneTypeStyle } from "@/features/workspace/shared/events/eventStyles";
import "./TimelineMilestoneLane.css";

export interface TimelineMilestoneLaneProps {
  days: string[];
  milestones: MilestoneRecord[];
  onOpenMilestone: (id: string) => void;
}

export function TimelineMilestoneLane({ days, milestones, onOpenMilestone }: TimelineMilestoneLaneProps) {
  if (days.length === 0) return null;
  const firstDay = days[0];
  const lastDay = days[days.length - 1];
  const visibleMilestones = milestones.filter((milestone) =>
    milestone.startAt.slice(0, 10) <= lastDay && (milestone.endAt ?? milestone.startAt).slice(0, 10) >= firstDay,
  ).sort((left, right) => left.startAt.localeCompare(right.startAt) || left.id.localeCompare(right.id));
  if (visibleMilestones.length === 0) return null;

  return (
    <div aria-label="Milestones" className="schedule-milestone-lane" role="region">
      <div className="schedule-milestone-label">Milestones</div>
      <div className="schedule-milestone-track" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
        {visibleMilestones.map((milestone) => {
          const startDay = milestone.startAt.slice(0, 10);
          const endDay = (milestone.endAt ?? milestone.startAt).slice(0, 10);
          const startIndex = days.findIndex((day) => day >= startDay);
          const endIndex = days.findLastIndex((day) => day <= endDay);
          const typeStyle = getMilestoneTypeStyle(milestone.type);
          const dates = startDay === endDay ? startDay : `${startDay} – ${endDay}`;
          const tone = milestone.type === "deadline" ? "danger" : milestone.type === "internal-review" ? "success" : "info";
          return (
            <button
              aria-label={`${milestone.title}, ${typeStyle.label}, ${dates}`}
              className="schedule-milestone-marker"
              data-tone={tone}
              key={milestone.id}
              onClick={() => onOpenMilestone(milestone.id)}
              style={{ gridColumn: `${startIndex + 1} / ${endIndex + 2}` }}
              title={`${milestone.title} · ${typeStyle.label} · ${dates}`}
              type="button"
            >
              <span>{milestone.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
