import { ModalDialog } from "@/components/ModalDialog";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskStatus } from "@/types/common";
import type { MilestoneRecord, TaskRecord } from "@/types/recordsExecution";
import type { AttentionQueueRow } from "../attention/attentionQueue";
import { parseLocalDate } from "@/lib/dateUtils";
import { formatMilestoneReadinessLabel } from "../milestones/milestonesViewUtils";
import { HomeDependencyTree } from "./HomeDependencyTree";
import type { HomeDependencyModel, HomeDependencySelection } from "./homeDependencyModel";
import type { HomeDeadlineModel } from "./homeDeadlineModel";
import { HOME_WORKLOAD_STATES, type HomeWorkloadModel, type HomeWorkloadState } from "./homeWorkloadModel";
import { HOME_TASK_STATUSES, type HomeViewModel } from "./overviewViewModel";

export type HomeDashboardSelection =
  | { kind: "tasks"; status: TaskStatus | null }
  | { kind: "risks"; rowId: string | null }
  | { kind: "workload"; rowId: string; state: HomeWorkloadState | null }
  | { kind: "deadline"; key: string }
  | { kind: "dependency"; key: string | null };

export function HomeDashboardDetails({ selection, model, workload, deadlines, dependencies,
  bootstrap, scopeLabel, onClose, onOpenTask, onOpenSchedule, onOpenActionItem, onOpenAllActions, onSelectDependency }: {
  selection: HomeDashboardSelection;
  model: HomeViewModel;
  workload: HomeWorkloadModel;
  deadlines: HomeDeadlineModel;
  dependencies: HomeDependencyModel;
  bootstrap: BootstrapPayload;
  scopeLabel: string;
  onClose: () => void;
  onOpenTask: (id: string) => void;
  onOpenSchedule: (id: string) => void;
  onOpenActionItem: (item: AttentionQueueRow) => void;
  onOpenAllActions: () => void;
  onSelectDependency: (selection: HomeDependencySelection) => void;
}) {
  let title: string;
  let tasks: TaskRecord[] = [];
  let milestones: MilestoneRecord[] = [];
  let selectedRisks: AttentionQueueRow[] = [];
  const branch = selection.kind === "dependency" ? dependencies.branches.find(item => item.key === selection.key) : undefined;
  if (selection.kind === "tasks") {
    title = HOME_TASK_STATUSES.find(status => status.id === selection.status)?.label ?? "All tasks";
    tasks = selection.status ? model.tasksByStatus[selection.status] : model.tasks;
  } else if (selection.kind === "risks") {
    const row = workload.rows.find(item => item.id === selection.rowId);
    title = selection.rowId ? `${row?.label ?? "Selected group"} · Risks` : "All risks";
    selectedRisks = selection.rowId ? row?.risks ?? [] : workload.risks;
  } else if (selection.kind === "workload") {
    const row = workload.rows.find(item => item.id === selection.rowId);
    title = `${row?.label ?? "Selected workload"}${selection.state ? ` · ${HOME_WORKLOAD_STATES.find(state => state.id === selection.state)?.label}` : ""}`;
    tasks = selection.state ? row?.tasksByState[selection.state] ?? [] : row?.tasks ?? [];
  } else if (selection.kind === "deadline") {
    const day = selection.key === "overdue" ? deadlines.overdue : deadlines.days.find(item => item.key === selection.key);
    title = selection.key === "overdue" ? "Overdue" : parseLocalDate(selection.key)?.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" }) ?? "Selected date";
    tasks = day?.tasks ?? [];
    milestones = day?.milestones ?? [];
  } else {
    title = selection.key ? branch?.label ?? "Prerequisite unavailable" : "Direct prerequisites";
  }
  const openTask = (id: string) => { onClose(); onOpenTask(id); };
  const openSchedule = (id: string) => { onClose(); onOpenSchedule(id); };
  const part = branch?.selection.kind === "part-instance" ? bootstrap.partInstances.find(item => item.id === branch.selection.id) : undefined;
  return <ModalDialog label={title} onClose={onClose} dismissOnBackdrop>
    <section className="modal-card modal-panel-surface home-drilldown">
      <div className="panel-header compact-header">
        <div><h2>{title}</h2><span>{scopeLabel}</span></div>
        <button className="icon-button" type="button" onClick={onClose} aria-label="Close dashboard details">Close</button>
      </div>
      {selection.kind === "dependency" ? <>
        {part ? <dl className="home-record-details"><dt>Location</dt><dd>{part.location.kind}</dd>
          <dt>Readiness</dt><dd>{formatMilestoneReadinessLabel(part.readinessStatus)}</dd></dl> : null}
        <HomeDependencyTree model={dependencies} bootstrap={bootstrap} expanded selectedKey={selection.key ?? undefined}
          onSelect={onSelectDependency} onOpenTask={openTask} onOpenSchedule={openSchedule} />
      </> : selection.kind === "risks" ? <>
        <p>{selectedRisks.length} risks</p>
        <ul className="workspace-record-list home-drilldown-list">{selectedRisks.map(item => <li key={item.key}>
          <button className="home-record-button" type="button" onClick={() => { onClose(); onOpenActionItem(item); }}>
            <strong>{item.title}</strong><span>Risk · {item.context}</span><span>{item.reasons.join(" · ")}</span>
          </button>
        </li>)}</ul>
        {!selectedRisks.length ? <p className="empty-state">No active risks match this selection.</p> : null}
        <button className="secondary-action" type="button" onClick={() => { onClose(); onOpenAllActions(); }}>Open Risks</button>
      </> : <>
        <p>{tasks.length} tasks{selection.kind === "deadline" ? ` · ${milestones.length} milestones` : ""}</p>
        <ul className="workspace-record-list home-drilldown-list">
          {tasks.map(task => <li key={`task:${task.id}`}><button className="home-record-button" type="button" onClick={() => openTask(task.id)}>
            <strong>{task.title}</strong><span>Task · {HOME_TASK_STATUSES.find(status => status.id === task.status)?.label}</span>
          </button></li>)}
          {milestones.map(milestone => <li key={`milestone:${milestone.id}`}><button className="home-record-button" type="button" onClick={() => openSchedule(milestone.id)}>
            <strong>{milestone.title}</strong><span>Milestone · {formatMilestoneReadinessLabel(milestone.readinessStatus)}</span>
          </button></li>)}
        </ul>
        {!tasks.length && !milestones.length ? <p className="empty-state">No records match this selection in this scope.</p> : null}
      </>}
    </section>
  </ModalDialog>;
}
