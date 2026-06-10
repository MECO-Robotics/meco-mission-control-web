import { useMemo } from "react";

import { AppTopbarSlotPortal } from "@/components/layout/AppTopbarSlotPortal";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskRecord } from "@/types/recordsExecution";

import {
  buildAvailableStudentRoster,
  type AvailableStudentRosterRow,
} from "./availableStudentsRoster";
import { RosterInsightsSummaryCards } from "./RosterInsightsSummaryCards";

interface RosterAvailableStudentsViewProps {
  availabilityBootstrap?: BootstrapPayload;
  bootstrap: BootstrapPayload;
  onCreateTask: () => void;
  onCreateTaskForMember: (memberId: string) => void;
  onOpenTask: (task: TaskRecord) => void;
  selectedProject: BootstrapPayload["projects"][number] | null;
}

function AvailableStudentCard({
  canOpenActiveTask,
  onCreateTask,
  onOpenTask,
  row,
}: {
  canOpenActiveTask: boolean;
  onCreateTask: (memberId: string) => void;
  onOpenTask: (task: TaskRecord) => void;
  row: AvailableStudentRosterRow;
}) {
  return (
    <article className="mc-roster-member-card mc-roster-available-card">
      <div className="mc-roster-member-header">
        <strong>{row.member.name}</strong>
        <span className={`mc-roster-status-badge is-${row.state}`}>{row.stateLabel}</span>
      </div>
      <div className="mc-roster-member-metrics">
        {row.hints.length > 0 ? (
          row.hints.map((hint) => <span key={hint}>{hint}</span>)
        ) : (
          <span>No skill hints</span>
        )}
      </div>
      {row.activeTask ? (
        <div className="mc-roster-task-list">
          {canOpenActiveTask ? (
            <button className="ghost-button" onClick={() => row.activeTask && onOpenTask(row.activeTask)} type="button">
              {row.activeTask.title}
            </button>
          ) : (
            <small className="section-copy">{row.activeTask.title}</small>
          )}
        </div>
      ) : (
        <small className="section-copy">
          {row.todayWorkLogs.length > 0 ? `${row.todayWorkLogs.length} worklog today` : "Ready for assignment"}
        </small>
      )}
      {row.state === "available" ? (
        <button
          className="primary-action roster-available-assign-button"
          onClick={() => onCreateTask(row.member.id)}
          type="button"
        >
          Assign work
        </button>
      ) : null}
    </article>
  );
}

function AvailableStudentGroup({
  emptyCopy,
  onCreateTask,
  onOpenTask,
  scopedTaskIds,
  rows,
  title,
}: {
  emptyCopy: string;
  onCreateTask: (memberId: string) => void;
  onOpenTask: (task: TaskRecord) => void;
  scopedTaskIds: ReadonlySet<string>;
  rows: AvailableStudentRosterRow[];
  title: string;
}) {
  return (
    <section className="mc-roster-available-group">
      <div className="roster-section-title">
        <h3>{title}</h3>
        <span className="sidebar-tab-count">{rows.length}</span>
      </div>
      {rows.length > 0 ? (
        <div className="mc-roster-member-grid">
          {rows.map((row) => (
            <AvailableStudentCard
              canOpenActiveTask={Boolean(
                row.activeTask && scopedTaskIds.has(row.activeTask.id),
              )}
              key={row.member.id}
              onCreateTask={onCreateTask}
              onOpenTask={onOpenTask}
              row={row}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <strong>No students here.</strong>
          <p className="section-copy">{emptyCopy}</p>
        </div>
      )}
    </section>
  );
}

export function RosterAvailableStudentsView({
  availabilityBootstrap,
  bootstrap,
  onCreateTask,
  onCreateTaskForMember,
  onOpenTask,
  selectedProject,
}: RosterAvailableStudentsViewProps) {
  const rosterBootstrap = useMemo(
    () => (availabilityBootstrap ? { ...availabilityBootstrap, members: bootstrap.members } : bootstrap),
    [availabilityBootstrap, bootstrap],
  );
  const roster = useMemo(() => buildAvailableStudentRoster(rosterBootstrap), [rosterBootstrap]);
  const scopedTaskIds = useMemo(() => new Set(bootstrap.tasks.map((task) => task.id)), [bootstrap.tasks]);
  const summaryCards = [
    { id: "present", label: "Present today", value: String(roster.presentCount) },
    { id: "available", label: "Available now", value: String(roster.available.length) },
    { id: "blocked", label: "Blocked / waiting", value: String(roster.blockedWaiting.length) },
    { id: "busy", label: "Already assigned", value: String(roster.busy.length) },
  ];

  return (
    <section className={`panel dense-panel roster-layout mc-roster-insights-shell ${WORKSPACE_PANEL_CLASS}`}>
      <AppTopbarSlotPortal slot="controls">
        <div className="panel-actions filter-toolbar roster-directory-toolbar">
          <button className="primary-action" onClick={onCreateTask} type="button">
            Assign work
          </button>
        </div>
      </AppTopbarSlotPortal>

      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2>Available Students</h2>
          <p className="section-copy">
            {selectedProject ? selectedProject.name : "All projects"} - students present today who can take work
          </p>
        </div>
      </div>

      <RosterInsightsSummaryCards cards={summaryCards} />

      <AvailableStudentGroup
        emptyCopy="Every present student either has an active task, a worklog today, or a blocked/waiting item."
        onCreateTask={onCreateTaskForMember}
        onOpenTask={onOpenTask}
        rows={roster.available}
        scopedTaskIds={scopedTaskIds}
        title="Available now"
      />
      <AvailableStudentGroup
        emptyCopy="No present students are blocked or waiting."
        onCreateTask={onCreateTaskForMember}
        onOpenTask={onOpenTask}
        rows={roster.blockedWaiting}
        scopedTaskIds={scopedTaskIds}
        title="Blocked / waiting"
      />
      <AvailableStudentGroup
        emptyCopy="No present students have active assignments or worklogs today."
        onCreateTask={onCreateTaskForMember}
        onOpenTask={onOpenTask}
        rows={roster.busy}
        scopedTaskIds={scopedTaskIds}
        title="Already assigned"
      />
    </section>
  );
}
