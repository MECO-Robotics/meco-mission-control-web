import React, { useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Link2, TriangleAlert } from "lucide-react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskRecord } from "@/types/recordsExecution";
import { IconChevronRight } from "@/components/shared/Icons";
import { ModalDialog } from "@/components/ModalDialog";
import { localTodayDate } from "@/lib/dateUtils";
import { endOfTimelineWeek } from "@/features/workspace/shared/timeline/timelineDateUtils";
import { indexRecordsById } from "@/features/workspace/shared/model/indexRecordsById";
import { TaskAssigneeSummary } from "@/features/workspace/shared/task/TaskAssigneeSummary";
import { TeamIcon } from "@/features/workspace/shared/team/TeamIcon";
import { useTimelineShellSizing } from "./hooks/useTimelineShellSizing";
import { buildTimelineTaskToneStyle } from "./model/timelineTaskColors";
import { TimelineTaskStatusLogo } from "./TimelineTaskStatusLogo";
import { ProductTimelineDependencies } from "./ProductTimelineDependencies";
import { getProductTimelineTaskLinks } from "./model/productTimelineDependencies";
import { buildProductTimelineProjects, getProductTimelineInspection, getProductTimelineTaskContext, getProductTimelineTaskSpan } from "./model/productTimelineModel";
import type { GroupBy } from "./model/productTimelineModel";

interface ProductTimelineGridProps {
  bootstrap: BootstrapPayload;
  tasks: TaskRecord[];
  days: string[];
  groupBy: GroupBy;
  zoom?: number;
  selectedDate: string | null;
  onSelectDate: (day: string) => void;
  onOpenTask: (task: TaskRecord) => void;
  milestoneLane?: ReactNode;
  isAllProjectsView: boolean;
}

export function ProductTimelineGrid({ bootstrap, tasks, days, groupBy, zoom = 1, selectedDate, onSelectDate, onOpenTask, milestoneLane, isAllProjectsView }: ProductTimelineGridProps) {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const workHeaderRef = useRef<HTMLDivElement | null>(null);
  const shellWidth = useTimelineShellSizing(shellRef);
  const workWidth = useTimelineShellSizing(workHeaderRef);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [inspectedId, setInspectedId] = useState<string | null>(null);
  const membersById = useMemo(() => indexRecordsById(bootstrap.members), [bootstrap.members]);
  const projects = useMemo(() => buildProductTimelineProjects(bootstrap, tasks, days, groupBy), [bootstrap, tasks, days, groupBy]);
  const today = localTodayDate();
  const weekEnds = new Set(days.filter((day) => endOfTimelineWeek(day) === day));
  const contexts = useMemo(() => Object.fromEntries(tasks.map((task) => [task.id, getProductTimelineTaskContext(task, bootstrap, today)])), [bootstrap, tasks, today]);
  const inspectionTask = inspectedId ? tasks.find((task) => task.id === inspectedId) : undefined;
  const inspection = inspectionTask ? getProductTimelineInspection(inspectionTask, bootstrap) : null;
  const clampedZoom = Math.min(4, Math.max(1, zoom));
  const gridWidth = shellWidth ? workWidth + Math.max(1, shellWidth - workWidth) * clampedZoom : undefined;
  const style = { "--schedule-day-count": Math.max(1, days.length), "--schedule-zoom": clampedZoom, width: gridWidth } as CSSProperties;
  const toggle = (id: string) => setCollapsed((previous) => {
    const next = new Set(previous);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const dateLabel = (day: string, options: Intl.DateTimeFormatOptions) => new Date(`${day}T12:00:00`).toLocaleDateString(undefined, options);

  const summary = (name: string, records: TaskRecord[], id: string, project = false) => (
    <div className={`product-timeline-row product-timeline-summary${project ? " is-project" : ""}`} key={id}>
      <div className="product-timeline-work">
        <button type="button" className="product-timeline-collapse" aria-expanded={!collapsed.has(id)} onClick={() => toggle(id)}>
          <IconChevronRight /><span>{name}</span>
        </button>
        <span className="product-timeline-count">{records.filter((task) => task.status === "complete").length} of {records.length} tasks complete · {records.filter((task) => contexts[task.id].blocked).length} blocked · {records.filter((task) => contexts[task.id].overdue).length} overdue</span>
      </div>
      <div className="product-timeline-track">
        {collapsed.has(id) && (() => {
          const spans = records.map((task) => getProductTimelineTaskSpan(task, days)).filter((span) => span !== null);
          if (!spans.length) return null;
          const start = Math.min(...spans.map((span) => span.start));
          const end = Math.max(...spans.map((span) => span.start + span.span));
          return <button type="button" aria-label={`Expand ${name}`} onClick={() => toggle(id)} className="product-timeline-summary-span" style={{ left: `${start / days.length * 100}%`, width: `${(end - start) / days.length * 100}%` }}>Group span</button>;
        })()}
      </div>
    </div>
  );

  const renderTask = (task: TaskRecord, groupKey: string) => {
    const context = contexts[task.id];
    const span = getProductTimelineTaskSpan(task, days);
    const rowKey = `${groupKey}:${task.id}`;
    const signal = context.signal;
    const warning = [context.overdueLabel, context.unavailableTargets.length ? `Unavailable target: ${context.unavailableTargets.join(", ")}` : ""].filter(Boolean).join(" · ");
    return <div key={rowKey} className="product-timeline-row product-timeline-task" data-task-id={task.id} data-group-key={groupKey}>
        <div className="product-timeline-work">
          <span className="product-timeline-task-assignees">
            <TaskAssigneeSummary compact task={task} membersById={membersById} />
            {warning && <span className={`product-timeline-warning${context.overdue ? " is-overdue" : ""}`} role="img" aria-label={warning} title={warning}><TriangleAlert size={14} aria-hidden="true" /></span>}
            {context.hasHandoffs && <button type="button" className="product-timeline-inspect" aria-haspopup="dialog" aria-label={`Inspect handoffs for ${task.title}`} title="Inspect handoffs" onClick={() => setInspectedId(task.id)}><Link2 size={14} aria-hidden="true" /></button>}
            <span className="product-timeline-hours" role="img" aria-label={`${task.actualHours}h logged / ${task.estimatedHours}h allocated`} title={`${task.actualHours}h logged / ${task.estimatedHours}h allocated`}>{task.actualHours}h/{task.estimatedHours}h</span>
          </span>
        </div>
        <div className="product-timeline-track">
          {span ? <button type="button" data-tutorial-target="timeline-task-bar" className={`product-timeline-bar${task.status === "complete" ? " is-complete" : ""}${span.spillsLeft ? " spills-left" : ""}${span.spillsRight ? " spills-right" : ""}`} data-status-signal={signal} style={{ ...buildTimelineTaskToneStyle(signal), left: `${span.start / days.length * 100}%`, width: `${span.span / days.length * 100}%` }} onClick={() => onOpenTask(task)} aria-label={`Open ${context.description}`} title={context.description}>
            <span className="product-timeline-status" role="img" aria-label={context.state} title={context.state}><TimelineTaskStatusLogo compact signal={signal} status={task.status} /></span>
            {task.responsibleGroupId && <TeamIcon team={context.team} />}
            <span className="product-timeline-bar-title">{task.title}</span>
          </button> : null}
        </div>
      </div>;
  };

  return <>
    <div ref={shellRef} className="product-timeline-shell" data-tutorial-target="timeline-grid" role="region" aria-label="Product timeline" tabIndex={0}>
    <div className="product-timeline-grid" style={style}>
      {milestoneLane && <div className="product-timeline-milestone-lane">{milestoneLane}</div>}
      <div className="product-timeline-row product-timeline-header">
        <div ref={workHeaderRef} className="product-timeline-work">Work</div>
        <div className="product-timeline-dates">
          {days.map((day) => <button type="button" key={day} className={`product-timeline-day${day === today ? " is-today" : ""}${day === selectedDate ? " is-selected" : ""}${weekEnds.has(day) ? " is-week-end" : ""}`} aria-label={`Show agenda for ${day}`} aria-pressed={day === selectedDate} title={dateLabel(day, { dateStyle: "full" })} onClick={() => onSelectDate(day)}>
            <span>{dateLabel(day, { weekday: "narrow" })}</span><span>{day.slice(8)}</span>
          </button>)}
        </div>
      </div>
      <ProductTimelineDependencies dependencies={getProductTimelineTaskLinks(bootstrap)}>
      {projects.length > 0 && <div className="product-timeline-day-grid" aria-hidden="true">{days.map((day) => <span key={day} className={weekEnds.has(day) ? "is-week-end" : undefined} />)}</div>}
      {projects.length ? projects.map((project) => {
        const projectKey = `project:${project.id}`;
        const projectTasks = Array.from(new Map(project.groups.flatMap((group) => group.tasks).map((task) => [task.id, task])).values());
        return <React.Fragment key={project.id}>
          {isAllProjectsView && summary(project.name, projectTasks, projectKey, true)}
          {(!isAllProjectsView || !collapsed.has(projectKey)) && project.groups.map((group) => {
            const groupKey = `${project.id}:${group.id}`;
            return <React.Fragment key={groupKey}>{summary(group.name, group.tasks, groupKey)}{!collapsed.has(groupKey) && group.tasks.map((task) => renderTask(task, groupKey))}</React.Fragment>;
          })}
        </React.Fragment>;
      }) : <p className="product-timeline-empty">No tasks match this schedule.</p>}
      </ProductTimelineDependencies>
    </div>
    </div>
    {inspectionTask && inspection && <ModalDialog label={`Handoffs for ${inspectionTask.title}`} onClose={() => setInspectedId(null)} dismissOnBackdrop>
      <section className="modal-card product-timeline-handoffs-modal">
        <div className="panel-header compact-header roster-modal-header">
          <h3>Handoffs for {inspectionTask.title}</h3>
          <button type="button" className="secondary-action" aria-label="Close handoffs" onClick={() => setInspectedId(null)}>Close</button>
        </div>
        <div className="product-timeline-handoffs-body">
          {inspection.blockers.length > 0 && <div><strong>Recorded blockers</strong><ul>{inspection.blockers.map((risk) => <li key={risk.id}>{risk.title}</li>)}</ul></div>}
          {inspectionTask.isBlocked && !inspection.blockers.length && <p>Recorded as blocked. Open task details for context.</p>}
          {([ ["Prerequisites", inspection.incoming], ["Downstream work", inspection.downstream] ] as const).map(([label, items]) => <div key={label}><strong>{label}</strong>{items.length ? <ul>{items.map((item) => <li key={item.id}>{item.task ? <button type="button" className="product-timeline-related-title" onClick={() => { setInspectedId(null); onOpenTask(item.task!); }}>{item.label}</button> : <span>{item.label}</span>}<span className="product-timeline-relationship">{item.state}</span></li>)}</ul> : <p>None recorded.</p>}</div>)}
        </div>
      </section>
    </ModalDialog>}
  </>;
}
