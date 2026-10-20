import { useMemo, useState } from "react";

import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import { buildAttentionQueue, type AttentionQueueRow } from "@/features/workspace/views/attention/attentionQueue";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { formatMilestoneDateTime, formatMilestoneReadinessLabel, formatMilestoneStatusLabel } from "@/features/workspace/views/milestones/milestonesViewUtils";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { MilestoneRecord } from "@/types/recordsExecution";
import type { TaskStatus } from "@/types/common";
import { HomeActionRequired, groupHomeActions } from "./HomeActionRequired";
import { HomeTaskStatusDistribution } from "./HomeTaskStatusDistribution";
import { HomeMilestoneTimeline } from "./HomeMilestoneTimeline";
import { ModalDialog } from "@/components/ModalDialog";
import { buildHomeViewModel, HOME_TASK_STATUSES } from "./overviewViewModel";

interface HomeViewProps {
  activePersonFilter?: FilterSelection;
  bootstrap: BootstrapPayload;
  onOpenActionItem: (item: AttentionQueueRow) => void;
  onOpenAllActions: () => void;
  onOpenTask: (taskId: string) => void;
  onOpenSchedule: (milestoneId: string) => void;
  projectId?: string | null;
  scopeLabel?: string;
  today?: Date;
}

type Selection = { kind: "tasks"; status: TaskStatus | null } | { kind: "actions"; group: string | null } | { kind: "milestone"; id: string };

export function HomeView({ activePersonFilter = [], bootstrap, onOpenActionItem, onOpenAllActions, onOpenTask,
  onOpenSchedule, projectId = null, scopeLabel = "All projects", today = new Date() }: HomeViewProps) {
  const model = useMemo(() => buildHomeViewModel({ activePersonFilter, bootstrap, projectId, today }),
    [activePersonFilter, bootstrap, projectId, today]);
  const actionItems = useMemo(() => buildAttentionQueue({ activePersonFilter, bootstrap, projectId, today }),
    [activePersonFilter, bootstrap, projectId, today]);
  // Store selection identity, so refreshes never leave stale record snapshots in a dialog.
  const [selection, setSelection] = useState<Selection | null>(null);
  const close = () => setSelection(null);
  const taskStatus = selection?.kind === "tasks" ? selection.status : null;
  const actionGroup = selection?.kind === "actions" && selection.group
    ? groupHomeActions(actionItems).find(group => group.id === selection.group) : null;
  const selectedTasks = taskStatus ? model.tasksByStatus[taskStatus] : HOME_TASK_STATUSES.flatMap(({ id }) => model.tasksByStatus[id]);
  const selectedActions = actionGroup?.items ?? actionItems;
  const milestone: MilestoneRecord | undefined = selection?.kind === "milestone"
    ? model.upcomingMilestones.find(item => item.id === selection.id) : undefined;
  const title = selection?.kind === "tasks" ? HOME_TASK_STATUSES.find(({ id }) => id === taskStatus)?.label ?? "All tasks"
    : selection?.kind === "actions" ? actionGroup?.label ?? "Action Required" : milestone?.title ?? "Milestone unavailable";

  return (
    <section className={`panel dense-panel overview-shell home-view ${WORKSPACE_PANEL_CLASS}`}>
      <div className="home-dashboard-lead-grid">
        <HomeActionRequired items={actionItems} onSelect={group => setSelection({ kind: "actions", group })} />
        <HomeTaskStatusDistribution tasksByStatus={model.tasksByStatus}
          onSelect={status => setSelection({ kind: "tasks", status })} />
      </div>
      <HomeMilestoneTimeline milestones={model.upcomingMilestones} today={today}
        onSelect={item => setSelection({ kind: "milestone", id: item.id })} />
      {selection ? <ModalDialog label={title} onClose={close} dismissOnBackdrop>
        <section className="modal-card modal-panel-surface home-drilldown">
          <div className="panel-header compact-header">
            <div><h2>{title}</h2><span>{scopeLabel}</span></div>
            <button className="icon-button" type="button" onClick={close} aria-label="Close dashboard details">Close</button>
          </div>
        {selection.kind === "tasks" ? <>
          <p>{selectedTasks.length} tasks</p>
          <ul className="workspace-record-list home-drilldown-list">{selectedTasks.map(task => <li key={task.id}>
            <button className="home-record-button" type="button" onClick={() => { close(); onOpenTask(task.id); }}>
              <strong>{task.title}</strong><span>{HOME_TASK_STATUSES.find(status => status.id === task.status)?.label}</span>
            </button>
          </li>)}</ul>
          {!selectedTasks.length ? <p className="empty-state">No tasks have this status in this scope.</p> : null}
        </> : selection.kind === "actions" ? <>
          <p>{selectedActions.length} actions</p>
          <ul className="workspace-record-list home-drilldown-list">{selectedActions.map(item => <li key={item.key}>
            <button className="home-record-button" type="button" onClick={() => { close(); onOpenActionItem(item); }}>
              <strong>{item.title}</strong><span>{item.source === "task" ? "Task" : "Risk"} · {item.context}</span>
              <span>{item.reasons.join(" · ")}</span>
            </button>
          </li>)}</ul>
          {!selectedActions.length ? <p className="empty-state">No current action items in this scope.</p> : null}
          <button className="secondary-action" type="button" onClick={() => { close(); onOpenAllActions(); }}>Open Risks</button>
        </> : milestone ? <>
          <dl className="home-milestone-details">
            <dt>Date</dt><dd><time dateTime={milestone.startAt}>{formatMilestoneDateTime(milestone.startAt)}</time></dd>
            <dt>Status</dt><dd>{formatMilestoneStatusLabel(milestone.status) ?? "Status unknown"}</dd>
            <dt>Readiness</dt><dd>{formatMilestoneReadinessLabel(milestone.readinessStatus)}</dd>
          </dl>
          <button className="secondary-action" type="button" onClick={() => { close(); onOpenSchedule(milestone.id); }}>Open in Schedule</button>
        </> : <p className="empty-state">This milestone is no longer upcoming in this scope.</p>}
      </section>
      </ModalDialog> : null}
    </section>
  );
}
