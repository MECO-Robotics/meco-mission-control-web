import React, { useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskRecord } from "@/types/recordsExecution";
import { IconChevronRight } from "@/components/shared/Icons";
import { localTodayDate } from "@/lib/dateUtils";
import { useTimelineShellSizing } from "./hooks/useTimelineShellSizing";
import { TimelineTaskStatusLogo } from "./TimelineTaskStatusLogo";
import { ProductTimelineDependencies } from "./ProductTimelineDependencies";
import { getProductTimelineTaskLinks } from "./model/productTimelineDependencies";
import { buildProductTimelineProjects, getProductTimelineDateLabelIndices, getProductTimelineInspection, getProductTimelineTaskContext, getProductTimelineTaskSpan } from "./model/productTimelineModel";
import type { GroupBy } from "./model/productTimelineModel";

interface ProductTimelineGridProps {
  bootstrap: BootstrapPayload;
  tasks: TaskRecord[];
  days: string[];
  groupBy: GroupBy;
  viewInterval: "week" | "month" | "all";
  zoom?: number;
  selectedDate: string | null;
  onSelectDate: (day: string) => void;
  onOpenTask: (task: TaskRecord) => void;
  milestoneLane?: ReactNode;
  isAllProjectsView: boolean;
}

export function ProductTimelineGrid({ bootstrap, tasks, days, groupBy, viewInterval, zoom = 1, selectedDate, onSelectDate, onOpenTask, milestoneLane, isAllProjectsView }: ProductTimelineGridProps) {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const workHeaderRef = useRef<HTMLDivElement | null>(null);
  const datesRef = useRef<HTMLDivElement | null>(null);
  const shellWidth = useTimelineShellSizing(shellRef);
  const workWidth = useTimelineShellSizing(workHeaderRef);
  const trackWidth = useTimelineShellSizing(datesRef);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [inspectedId, setInspectedId] = useState<string | null>(null);
  const projects = useMemo(() => buildProductTimelineProjects(bootstrap, tasks, days, groupBy), [bootstrap, tasks, days, groupBy]);
  const today = localTodayDate();
  const inspectionTask = inspectedId ? tasks.find((task) => task.id === inspectedId) : undefined;
  const inspection = inspectionTask ? getProductTimelineInspection(inspectionTask, bootstrap) : null;
  const relatedIds = new Set(inspection ? [...inspection.incoming, ...inspection.downstream].flatMap((item) => item.task ? [item.task.id] : []) : []);
  const clampedZoom = Math.min(4, Math.max(1, zoom));
  const gridWidth = shellWidth && workWidth ? workWidth + Math.max(1, shellWidth - workWidth) * clampedZoom : undefined;
  const dateLabelIndices = getProductTimelineDateLabelIndices(days, trackWidth);
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
        <span className="product-timeline-count">{records.filter((task) => task.status === "complete").length} of {records.length} tasks complete</span>
      </div>
      <div className="product-timeline-track" aria-hidden="true">
        {collapsed.has(id) && (() => {
          const spans = records.map((task) => getProductTimelineTaskSpan(task, days)).filter((span) => span !== null);
          if (!spans.length) return null;
          const start = Math.min(...spans.map((span) => span.start));
          const end = Math.max(...spans.map((span) => span.start + span.span));
          return <span className="product-timeline-summary-span" style={{ left: `${start / days.length * 100}%`, width: `${(end - start) / days.length * 100}%` }} />;
        })()}
      </div>
    </div>
  );

  const renderTask = (task: TaskRecord, groupKey: string) => {
    const context = getProductTimelineTaskContext(task, bootstrap, today);
    const span = getProductTimelineTaskSpan(task, days);
    const rowKey = `${groupKey}:${task.id}`;
    const selected = inspectedId === task.id;
    const signal = context.blocked ? "blocked" : context.waiting ? "waiting-on-dependency" : task.status;
    return <React.Fragment key={rowKey}>
      <div className={`product-timeline-row product-timeline-task${selected ? " is-inspected" : ""}${relatedIds.has(task.id) ? " is-related" : ""}`} data-task-id={task.id} data-group-key={groupKey}>
        <div className="product-timeline-work">
          <button type="button" className="product-timeline-task-title" onClick={() => onOpenTask(task)}>{task.title}</button>
          <span className="product-timeline-task-meta">{context.owner}{context.team ? ` · ${context.team}` : ""}</span>
          {context.unavailableTargets.length > 0 && <span className="product-timeline-task-meta">Unavailable target: {context.unavailableTargets.join(", ")}</span>}
          <div className="product-timeline-task-state">
            <span className="product-timeline-status"><TimelineTaskStatusLogo compact signal={signal} status={task.status} />{context.state}</span>
            {context.blocked && <span className="product-timeline-warning">Blocked</span>}
            {context.waiting && <span className="product-timeline-warning">Waiting on prerequisite</span>}
            {context.overdue && <span className="product-timeline-warning">Overdue</span>}
            {context.hasHandoffs && <button type="button" className="product-timeline-inspect" aria-expanded={selected} aria-label={`Inspect handoffs for ${task.title}`} onClick={() => setInspectedId(selected ? null : task.id )}>Handoffs</button>}
          </div>
        </div>
        <div className="product-timeline-track">
          {span ? <button type="button" data-tutorial-target="timeline-task-bar" className={`product-timeline-bar${task.status === "complete" ? " is-complete" : ""}${span.spillsLeft ? " spills-left" : ""}${span.spillsRight ? " spills-right" : ""}`} style={{ left: `${span.start / days.length * 100}%`, width: `${span.span / days.length * 100}%` }} onClick={() => onOpenTask(task)} aria-label={`Open ${task.title}, ${task.startDate} to ${task.dueDate}`} title={`${task.title}: ${task.startDate} to ${task.dueDate}`} /> : null}
        </div>
      </div>
      {selected && inspection && <div className="product-timeline-inspection" aria-label={`Handoffs for ${task.title}`}>
        {inspection.blockers.length > 0 && <div><strong>Recorded blockers</strong><ul>{inspection.blockers.map((risk) => <li key={risk.id}>{risk.title}</li>)}</ul></div>}
        {task.isBlocked && !inspection.blockers.length && <p>Recorded as blocked. Open task details for context.</p>}
        {([ ["Prerequisites", inspection.incoming], ["Downstream work", inspection.downstream] ] as const).map(([label, items]) => <div key={label}><strong>{label}</strong>{items.length ? <ul>{items.map((item) => <li key={item.id}>{item.task ? <button type="button" className="product-timeline-related-title" onClick={() => onOpenTask(item.task!)}>{item.label}</button> : <span>{item.label}</span>}<span className="product-timeline-relationship">{item.state}</span></li>)}</ul> : <p>None recorded.</p>}</div>)}
      </div>}
    </React.Fragment>;
  };

  return <div ref={shellRef} className="product-timeline-shell" data-tutorial-target="timeline-grid" role="region" aria-label="Product timeline" tabIndex={0}>
    <div className={`product-timeline-grid${viewInterval === "all" ? " is-project-span" : ""}`} style={style}>
      <div className="product-timeline-row product-timeline-header">
        <div ref={workHeaderRef} className="product-timeline-work">Work</div>
        <div ref={datesRef} className={`product-timeline-dates${viewInterval === "all" ? " is-project-span" : ""}`}>
          {days.map((day, index) => <button type="button" key={day} className={`product-timeline-day${day === today ? " is-today" : ""}${day === selectedDate ? " is-selected" : ""}`} aria-label={`Show agenda for ${day}`} aria-pressed={day === selectedDate} title={dateLabel(day, { dateStyle: "full" })} onClick={() => onSelectDate(day)}>
            {viewInterval === "all" ? (dateLabelIndices.has(index) ? <span>{dateLabel(day, { month: "short", day: "numeric" })}</span> : null) : <><span>{dateLabel(day, { weekday: "narrow" })}</span><span>{day.slice(8)}</span></>}
          </button>)}
        </div>
      </div>
      {milestoneLane && <div className="product-timeline-milestone-lane">{milestoneLane}</div>}
      <ProductTimelineDependencies dependencies={getProductTimelineTaskLinks(bootstrap)}>
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
  </div>;
}
