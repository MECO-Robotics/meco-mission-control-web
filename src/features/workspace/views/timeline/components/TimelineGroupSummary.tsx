import type { TimelineTaskSpan } from "../timelineViewModel";
import type { TimelineTaskPresentation } from "../model/timelineTaskPresentation";
export function TimelineGroupSummary({ tasks, presentations, gridRow, firstDayGridColumn,
  taskColumnIndex, taskColumnWidth, taskStickyLeft, onExpand, onMouseEnter, onMouseLeave,
}: {
  tasks: TimelineTaskSpan[];
  presentations: Record<string, TimelineTaskPresentation>;
  gridRow: number;
  firstDayGridColumn: number;
  taskColumnIndex: number;
  taskColumnWidth: number;
  taskStickyLeft: number;
  onExpand?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  if (!tasks.length) return null;
  const uniqueTasks = [...new Map(tasks.map((task) => [task.id, task])).values()];
  const start = Math.min(...uniqueTasks.map((task) => task.offset));
  const end = Math.max(...uniqueTasks.map((task) => task.offset + task.span));
  const complete = uniqueTasks.filter((task) => task.status === "complete").length;
  const blocked = uniqueTasks.filter((task) => presentations[task.id].signal === "blocked").length;
  const overdue = uniqueTasks.filter((task) => presentations[task.id].overdueDays > 0).length;
  const counts = `${uniqueTasks.length} tasks · ${complete} complete · ${blocked} blocked · ${overdue} overdue`;
  return <>
    <button type="button" className="timeline-task-name-cell timeline-group-summary-name" onClick={onExpand}
      aria-label={`Expand group: ${counts}`} style={{ gridRow, gridColumn: taskColumnIndex,
        width: taskColumnWidth, left: taskStickyLeft }}>
      <strong>Group span</strong><span>{counts}</span>
    </button>
    <button type="button" className="timeline-group-span" onClick={onExpand}
      aria-label={`Expand group: ${counts}`} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}
      style={{ gridRow, gridColumn: `${start + firstDayGridColumn} / span ${Math.max(1, end - start)}` }}>
      Group span
    </button>
  </>;
}
