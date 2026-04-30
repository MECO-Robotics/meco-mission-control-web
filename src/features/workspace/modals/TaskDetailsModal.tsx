import type { BootstrapPayload, TaskRecord } from "@/types";
import { formatIterationVersion } from "@/lib/appUtils";
import { formatTaskStatusLabel } from "@/features/workspace/shared/workspaceOptions";
import { getStatusPillClassName } from "@/features/workspace/shared";
import {
  getTaskBlocksDependencies,
  getTaskOpenBlockersForTask,
  getTaskWaitingOnDependencies,
} from "@/features/workspace/shared/taskPlanning";
import { getTimelineTaskStatusSignal } from "@/features/workspace/views/timeline";
import { TimelineTaskStatusLogo } from "@/features/workspace/views/timeline/TimelineTaskStatusLogo";
import type { TimelineTaskStatusSignal } from "@/features/workspace/views/timeline/timelineGridBodyUtils";

interface TaskDetailsModalProps {
  activeTask: TaskRecord;
  bootstrap: BootstrapPayload;
  closeTaskDetailsModal: () => void;
  onEditTask: (task: TaskRecord) => void;
  onResolveTaskBlocker: (blockerId: string) => Promise<void>;
}

function formatTaskDetailDate(dateValue: string): string {
  if (!dateValue) {
    return "Not set";
  }

  const parsedDate = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return dateValue;
  }

  return parsedDate.toLocaleDateString();
}

function isTaskDetailDateOverdue(dateValue: string): boolean {
  if (!dateValue) {
    return false;
  }

  const parsedDate = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return parsedDate.getTime() < today.getTime();
}

function isTaskDetailDateToday(dateValue: string): boolean {
  if (!dateValue) {
    return false;
  }

  const parsedDate = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return parsedDate.getTime() === today.getTime();
}

function TaskDetailsStatusIcon({
  label,
  signal,
}: {
  label: string;
  signal: TimelineTaskStatusSignal;
}) {
  const status =
    signal === "complete" || signal === "in-progress" || signal === "waiting-for-qa" || signal === "not-started"
      ? signal
      : "blocked";
  return (
    <span aria-label={label} className={`task-detail-header-status task-detail-header-status-signal-${signal}`} title={label}>
      <span className="task-detail-header-status-icon">
        <TimelineTaskStatusLogo signal={signal} status={status} />
      </span>
      <span className="task-detail-header-status-caption">{label}</span>
    </span>
  );
}

export function TaskDetailsModal({
  activeTask,
  bootstrap,
  closeTaskDetailsModal,
  onEditTask,
  onResolveTaskBlocker,
}: TaskDetailsModalProps) {
  const membersById = Object.fromEntries(
    bootstrap.members.map((member) => [member.id, member]),
  ) as Record<string, BootstrapPayload["members"][number]>;
  const subsystemsById = Object.fromEntries(
    bootstrap.subsystems.map((subsystem) => [subsystem.id, subsystem]),
  ) as Record<string, BootstrapPayload["subsystems"][number]>;
  const mechanismsById = Object.fromEntries(
    bootstrap.mechanisms.map((mechanism) => [mechanism.id, mechanism]),
  ) as Record<string, BootstrapPayload["mechanisms"][number]>;
  const partInstancesById = Object.fromEntries(
    bootstrap.partInstances.map((partInstance) => [partInstance.id, partInstance]),
  ) as Record<string, BootstrapPayload["partInstances"][number]>;
  const partDefinitionsById = Object.fromEntries(
    bootstrap.partDefinitions.map((partDefinition) => [partDefinition.id, partDefinition]),
  ) as Record<string, BootstrapPayload["partDefinitions"][number]>;
  const disciplinesById = Object.fromEntries(
    bootstrap.disciplines.map((discipline) => [discipline.id, discipline]),
  ) as Record<string, BootstrapPayload["disciplines"][number]>;
  const eventsById = Object.fromEntries(
    bootstrap.events.map((event) => [event.id, event]),
  ) as Record<string, BootstrapPayload["events"][number]>;
  const selectedAssigneeIds =
    activeTask.assigneeIds.length > 0
      ? activeTask.assigneeIds
      : activeTask.ownerId
        ? [activeTask.ownerId]
        : [];
  const selectedSubsystemIds =
    activeTask.subsystemIds.length > 0
      ? activeTask.subsystemIds
      : activeTask.subsystemId
        ? [activeTask.subsystemId]
        : [];
  const selectedMechanismIds =
    activeTask.mechanismIds.length > 0
      ? activeTask.mechanismIds
      : activeTask.mechanismId
        ? [activeTask.mechanismId]
        : [];
  const selectedPartInstanceIds =
    activeTask.partInstanceIds.length > 0
      ? activeTask.partInstanceIds
      : activeTask.partInstanceId
        ? [activeTask.partInstanceId]
        : [];
  const subsystemNames = selectedSubsystemIds
    .map((subsystemId) => {
      const subsystem = subsystemsById[subsystemId];
      return subsystem
        ? `${subsystem.name} (${formatIterationVersion(subsystem.iteration)})`
        : null;
    })
    .filter((name): name is string => Boolean(name));
  const mechanismNames = selectedMechanismIds
    .map((mechanismId) => {
      const mechanism = mechanismsById[mechanismId];
      return mechanism
        ? `${mechanism.name} (${formatIterationVersion(mechanism.iteration)})`
        : null;
    })
    .filter((name): name is string => Boolean(name));
  const partLabels = selectedPartInstanceIds
    .map((partInstanceId) => {
      const partInstance = partInstancesById[partInstanceId];
      if (!partInstance) {
        return null;
      }

      const partDefinition = partDefinitionsById[partInstance.partDefinitionId];
      return partDefinition
        ? `${partInstance.name} (${partDefinition.name} (${formatIterationVersion(partDefinition.iteration)}))`
        : partInstance.name;
    })
    .filter((label): label is string => Boolean(label));
  const assigneeNames = selectedAssigneeIds
    .map((memberId) => membersById[memberId]?.name)
    .filter((name): name is string => Boolean(name));
  const ownerName = activeTask.ownerId ? membersById[activeTask.ownerId]?.name ?? "Unknown" : "Unassigned";
  const mentorName = activeTask.mentorId ? membersById[activeTask.mentorId]?.name ?? "Unknown" : "Unassigned";
  const linkedEvent =
    activeTask.targetEventId && eventsById[activeTask.targetEventId]
      ? eventsById[activeTask.targetEventId]
      : null;
  const openBlockers = getTaskOpenBlockersForTask(activeTask.id, bootstrap);
  const waitingOnDependencies = getTaskWaitingOnDependencies(activeTask.id, bootstrap);
  const blockerTaskNamesById = new Map(
    bootstrap.tasks.map((task) => [task.id, task.title] as const),
  );
  const openBlockerRows = openBlockers.map((blocker) => {
    const blockerTaskName =
      blocker.blockerType === "task" && blocker.blockerId
        ? blockerTaskNamesById.get(blocker.blockerId) ?? "Unknown task"
        : null;

    return {
      ...blocker,
      blockerTaskName,
    };
  });
  const isOverdue = isTaskDetailDateOverdue(activeTask.dueDate);
  const isBlockedByDependency = openBlockers.length > 0;
  const detailStatusSignal = getTimelineTaskStatusSignal(activeTask, bootstrap);
  const detailStatusLabel = isBlockedByDependency ? "Blocked" : formatTaskStatusLabel(activeTask.status);
  const priorityPillClassName = getStatusPillClassName(activeTask.priority);
  const estimatedHours = Number(activeTask.estimatedHours);
  const actualHours = Number(activeTask.actualHours);
  const dueDateText = formatTaskDetailDate(activeTask.dueDate);
  const dueDatePillClassName = activeTask.dueDate
    ? activeTask.status === "complete"
      ? "pill task-detail-deadline-pill task-detail-deadline-pill-success"
      : isOverdue
        ? "pill task-detail-deadline-pill task-detail-deadline-pill-danger"
        : isTaskDetailDateToday(activeTask.dueDate)
          ? "pill task-detail-deadline-pill task-detail-deadline-pill-warning"
          : "pill task-detail-deadline-pill task-detail-deadline-pill-success"
    : "pill status-pill status-pill-neutral";
  const loggedHoursClassName =
    estimatedHours > 0
      ? actualHours === 0
        ? "pill task-detail-hours-pill task-detail-hours-pill-warning"
        : actualHours <= estimatedHours
          ? "pill task-detail-hours-pill task-detail-hours-pill-success"
          : actualHours < estimatedHours * 1.5
            ? "pill task-detail-hours-pill task-detail-hours-pill-warning"
            : "pill task-detail-hours-pill task-detail-hours-pill-danger"
      : "pill task-detail-hours-pill task-detail-hours-pill-neutral";
  const partsText = partLabels.length > 0 ? partLabels.join(", ") : "No part linked";

  return (
    <div className="modal-scrim" role="presentation" style={{ zIndex: 2000 }}>
      <section
        aria-modal="true"
        className="modal-card task-details-modal"
        role="dialog"
        style={{ background: "var(--bg-panel)", border: "1px solid var(--border-base)" }}
      >
        <div className="panel-header compact-header task-details-header">
          <div>
            <p className="eyebrow" style={{ color: "var(--meco-blue)" }}>
              Task details
            </p>
            <div className="task-detail-header-title-row">
              <div className="task-detail-header-title-stack">
                <div className="task-detail-header-title-main">
                  <h2 style={{ color: "var(--text-title)" }}>{activeTask.title}</h2>
                </div>
                <p className="task-detail-copy task-detail-header-meta-line">
                  <span className={dueDatePillClassName}>{dueDateText}</span>
                  <span style={{ color: "var(--text-copy)" }}> {"->"} </span>
                  <span>{linkedEvent ? linkedEvent.title : "No target milestone"}</span>
                </p>
              </div>
              <div className="task-detail-header-side-stack">
                <TaskDetailsStatusIcon label={detailStatusLabel} signal={detailStatusSignal} />
                <span className="task-detail-header-hours-inline task-detail-header-hours-right">
                  <span className="task-detail-header-hours-label">Logged:</span>
                  <span className={loggedHoursClassName}>{actualHours}h</span>
                  <span className="task-detail-hour-separator">/</span>
                  <span className="task-detail-hours-estimate">{estimatedHours}h</span>
                </span>
              </div>
            </div>
          </div>
          <div className="panel-actions">
            <button
              className="icon-button task-details-close-button"
              onClick={closeTaskDetailsModal}
              type="button"
              aria-label="Close task details"
            >
              {"\u00D7"}
            </button>
          </div>
        </div>

        <div className="modal-form task-details-grid" style={{ color: "var(--text-copy)" }}>
          <label className="field task-detail-row modal-wide">
            <span style={{ color: "var(--text-title)" }}>Summary</span>
            <p className="task-detail-copy">
              {activeTask.summary || "No summary provided."}
            </p>
          </label>
          <div className="task-details-section-grid task-details-overview-grid modal-wide">
            <label className="field task-detail-row task-detail-row-chip task-details-overview-priority">
              <span style={{ color: "var(--text-title)" }}>Priority</span>
              <span className={priorityPillClassName}>{activeTask.priority}</span>
            </label>
            <label className="field task-detail-row task-details-overview-owner">
              <span style={{ color: "var(--text-title)" }}>Owner</span>
              <p className="task-detail-copy">{ownerName}</p>
            </label>
            <div className="task-details-overview-assigned">
              <span style={{ color: "var(--text-title)" }}>Assigned</span>
              <div className="task-details-assigned-list">
                {assigneeNames.length > 0 ? (
                  assigneeNames.map((assigneeName, index) => (
                    <div className="task-details-assigned-item" key={`${assigneeName}-${index}`}>
                      <span className="task-detail-ellipsis-reveal" data-full-text={assigneeName}>
                        {assigneeName}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="task-details-assigned-empty">Unassigned</div>
                )}
              </div>
            </div>
            <label className="field task-detail-row task-details-overview-mentor">
              <span style={{ color: "var(--text-title)" }}>Mentor</span>
              <p className="task-detail-copy">{mentorName}</p>
            </label>
          </div>

          <details className="task-details-section-collapse modal-wide">
                        <summary className="task-details-section-title task-details-section-summary">
              <span>Advanced</span>
            </summary>
            <div className="task-details-section-grid">
              <label className="field task-detail-row">
                <span style={{ color: "var(--text-title)" }}>Discipline</span>
                <p className="task-detail-copy">
                  {activeTask.disciplineId
                    ? disciplinesById[activeTask.disciplineId]?.name ?? "Unknown"
                    : "Not set"}
                </p>
              </label>
              <label className="field task-detail-row">
                <span style={{ color: "var(--text-title)" }}>Subsystem</span>
                <p className="task-detail-copy">
                  {subsystemNames.length > 0 ? subsystemNames.join(", ") : "No subsystem linked"}
                </p>
              </label>
                            <label className="field modal-wide task-detail-collapsible-field">
                <details className="task-detail-collapsible">
                  <summary className="task-detail-collapsible-summary">
                    <span className="task-detail-collapsible-icon" aria-hidden="true"></span>
                    <span className="task-detail-copy">Mechanism</span>
                  </summary>
                  <div className="task-detail-collapsible-body">
                    {mechanismNames.length > 0 ? (
                      <div className="task-details-mechanism-list">
                        {mechanismNames.map((mechanismName, index) => (
                          <div className="task-details-mechanism-item" key={`${mechanismName}-${index}`}>
                            <span
                              className="task-detail-ellipsis-reveal"
                              data-full-text={mechanismName}
                            >
                              {mechanismName}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="task-detail-copy task-detail-empty" style={{ margin: "0.25rem 0 0" }}>
                        No mechanism linked
                      </p>
                    )}
                  </div>
                </details>
              </label>

                            <label className="field modal-wide task-detail-collapsible-field">
                <details className="task-detail-collapsible">
                  <summary className="task-detail-collapsible-summary">
                    <span className="task-detail-collapsible-icon" aria-hidden="true"></span>
                    <span className="task-detail-copy">Parts</span>
                  </summary>
                  <div className="task-detail-collapsible-body">
                    <p className="task-detail-copy">
                      <span className="task-detail-ellipsis-reveal" data-full-text={partsText}>
                        {partsText}
                      </span>
                    </p>
                  </div>
                </details>
              </label>

                                          <div className="field modal-wide task-detail-list-shell task-detail-collapsible-field">
                <details className="task-detail-collapsible">
                  <summary className="task-detail-collapsible-summary">
                    <span className="task-detail-collapsible-icon" aria-hidden="true"></span>
                    <span className="task-detail-copy">Blocked by</span>
                  </summary>
                  <div className="task-detail-collapsible-body">
                    {openBlockers.length > 0 ? (
                      <div className="workspace-detail-list task-detail-list" style={{ marginTop: "0.5rem" }}>
                        {openBlockerRows.map((blocker) => (
                          <div className="workspace-detail-list-item task-detail-list-item" key={blocker.id}>
                            <div style={{ minWidth: 0, flex: "1 1 auto", display: "grid", gap: "0.1rem" }}>
                              <strong
                                className="task-detail-ellipsis-reveal"
                                data-full-text={blocker.description}
                                style={{ color: "var(--text-title)" }}
                              >
                                {blocker.description}
                              </strong>
                              <div
                                className="task-detail-ellipsis-reveal"
                                data-full-text={`${blocker.blockerType.replace("_", " ")}${blocker.blockerType === "task" && blocker.blockerTaskName ? ` � ${blocker.blockerTaskName}` : ""}${blocker.severity ? ` � ${blocker.severity}` : ""}`}
                                style={{ color: "var(--text-copy)", fontSize: "0.8rem" }}
                              >
                                {blocker.blockerType.replace("_", " ")}
                                {blocker.blockerType === "task" && blocker.blockerTaskName
                                  ? ` � ${blocker.blockerTaskName}`
                                  : ""}
                                {blocker.severity ? ` � ${blocker.severity}` : ""}
                              </div>
                            </div>
                            <button
                              className="secondary-action"
                              onClick={() => void onResolveTaskBlocker(blocker.id)}
                              type="button"
                            >
                              Resolve
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="task-detail-copy task-detail-empty" style={{ margin: "0.25rem 0 0" }}>None</p>
                    )}
                  </div>
                </details>
              </div>


            </div>
          </details>

          <div className="modal-actions modal-wide">
            <button
              className="primary-action"
              data-tutorial-target="timeline-edit-task-button"
              onClick={() => onEditTask(activeTask)}
              type="button"
            >
              Edit task
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
