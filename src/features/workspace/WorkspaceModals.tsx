import type { Dispatch, FormEvent, SetStateAction } from "react";
import type {
  ArtifactPayload,
  ArtifactStatus,
  BootstrapPayload,
  ManufacturingItemPayload,
  MaterialPayload,
  MechanismPayload,
  PartDefinitionPayload,
  PartInstancePayload,
  PurchaseItemPayload,
  SubsystemPayload,
  TaskPayload,
  TaskRecord,
  WorkLogPayload,
  WorkstreamPayload,
} from "@/types";
import {
  buildIterationOptions,
  getProjectTaskTargetLabel,
  setTaskPrimaryTargetSelection,
  toggleTaskTargetSelection,
  type TaskTargetKind,
} from "@/lib/appUtils";

interface TaskEditorModalProps {
  activeTask: TaskRecord | null;
  bootstrap: BootstrapPayload;
  closeTaskModal: () => void;
  disciplinesById: Record<string, BootstrapPayload["disciplines"][number]>;
  eventsById: Record<string, BootstrapPayload["events"][number]>;
  handleDeleteTask: (taskId: string) => Promise<void>;
  handleTaskSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isDeletingTask: boolean;
  isSavingTask: boolean;
  mechanismsById: Record<string, BootstrapPayload["mechanisms"][number]>;
  mentors: BootstrapPayload["members"];
  partDefinitionsById: Record<string, BootstrapPayload["partDefinitions"][number]>;
  partInstancesById: Record<string, BootstrapPayload["partInstances"][number]>;
  students: BootstrapPayload["members"];
  taskDraft: TaskPayload;
  taskDraftBlockers: string;
  taskModalMode: "create" | "edit";
  showCreateTypeToggle?: boolean;
  onSwitchCreateTypeToMilestone?: () => void;
  setTaskDraft: Dispatch<SetStateAction<TaskPayload>>;
  setTaskDraftBlockers: (value: string) => void;
}

export function TaskEditorModal({
  activeTask,
  bootstrap,
  closeTaskModal,
  handleDeleteTask,
  handleTaskSubmit,
  isDeletingTask,
  isSavingTask,
  mechanismsById,
  mentors,
  partDefinitionsById,
  partInstancesById,
  students,
  taskDraft,
  taskDraftBlockers,
  taskModalMode,
  showCreateTypeToggle,
  onSwitchCreateTypeToMilestone,
  setTaskDraft,
  setTaskDraftBlockers,
}: TaskEditorModalProps) {
  const projectsById = Object.fromEntries(
    bootstrap.projects.map((project) => [project.id, project]),
  ) as Record<string, BootstrapPayload["projects"][number]>;
  const subsystemsById = Object.fromEntries(
    bootstrap.subsystems.map((subsystem) => [subsystem.id, subsystem]),
  ) as Record<string, BootstrapPayload["subsystems"][number]>;
  const selectedProject = taskDraft.projectId ? projectsById[taskDraft.projectId] : null;
  const targetGroupLabel = getProjectTaskTargetLabel(selectedProject);
  const targetFallback = `No ${targetGroupLabel === "Subsystems" ? "subsystem" : "workstream"}`;
  const projectSubsystems = bootstrap.subsystems.filter(
    (subsystem) => subsystem.projectId === taskDraft.projectId,
  );
  const selectedSubsystemIds =
    taskDraft.subsystemIds.length > 0
      ? taskDraft.subsystemIds
      : taskDraft.subsystemId
        ? [taskDraft.subsystemId]
        : [];
  const selectedPrimaryTargetId = selectedSubsystemIds[0] ?? "";
  const projectMechanisms = bootstrap.mechanisms.filter(
    (mechanism) => mechanism.subsystemId === selectedPrimaryTargetId,
  );
  const projectPartInstances = bootstrap.partInstances.filter(
    (partInstance) => partInstance.subsystemId === selectedPrimaryTargetId,
  );
  const selectedMechanismIds =
    taskDraft.mechanismIds.length > 0
      ? taskDraft.mechanismIds
      : taskDraft.mechanismId
        ? [taskDraft.mechanismId]
        : [];
  const selectedPartInstanceIds =
    taskDraft.partInstanceIds.length > 0
      ? taskDraft.partInstanceIds
      : taskDraft.partInstanceId
        ? [taskDraft.partInstanceId]
        : [];
  const selectedAssigneeIds =
    taskDraft.assigneeIds.length > 0
      ? taskDraft.assigneeIds
      : taskDraft.ownerId
        ? [taskDraft.ownerId]
        : [];
  const getPartInstanceLabel = (partInstance: BootstrapPayload["partInstances"][number]) => {
    const partDefinition = partDefinitionsById[partInstance.partDefinitionId];

    return partDefinition ? `${partInstance.name} (${partDefinition.name})` : partInstance.name;
  };
  const selectedScopeChips = [
    ...selectedMechanismIds.map((id) => ({
      key: `mechanism-${id}`,
      label: mechanismsById[id]?.name,
    })),
    ...selectedPartInstanceIds.map((id) => ({
      key: `part-instance-${id}`,
      label: partInstancesById[id] ? getPartInstanceLabel(partInstancesById[id]) : undefined,
    })),
  ].filter((chip): chip is { key: string; label: string } => Boolean(chip.label));
  const updatePrimaryTarget = (subsystemId: string) => {
    setTaskDraft((current) => setTaskPrimaryTargetSelection(current, bootstrap, subsystemId));
  };
  const toggleTarget = (kind: TaskTargetKind, id: string) => {
    setTaskDraft((current) =>
      toggleTaskTargetSelection(current, bootstrap, {
        kind,
        id,
      }),
    );
  };
  const renderTargetOption = (
    kind: TaskTargetKind,
    id: string,
    label: string,
    detail: string | null,
    checked: boolean,
  ) => (
    <label
      className={`task-target-option${checked ? " is-selected" : ""}`}
      key={`${kind}-${id}`}
    >
      <input
        checked={checked}
        onChange={() => toggleTarget(kind, id)}
        type="checkbox"
      />
      <span className="task-target-option-copy">
        <span>{label}</span>
        {detail ? <small>{detail}</small> : null}
      </span>
    </label>
  );

  return (
    <div className="modal-scrim" role="presentation" style={{ zIndex: 2000 }}>
      <section aria-modal="true" className="modal-card" role="dialog" style={{ background: "var(--bg-panel)", border: "1px solid var(--border-base)" }}>
        <div className="panel-header compact-header">
          <div>
            <p className="eyebrow" style={{ color: "var(--meco-blue)" }}>Task editor</p>
            {taskModalMode === "create" && showCreateTypeToggle ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.25rem" }}>
                <h2 style={{ color: "var(--text-title)", margin: 0 }}>Create</h2>
                <button className="primary-action" type="button">
                  Task
                </button>
                <button
                  className="secondary-action"
                  onClick={onSwitchCreateTypeToMilestone}
                  type="button"
                >
                  Milestone
                </button>
              </div>
            ) : (
              <h2 style={{ color: "var(--text-title)" }}>{taskModalMode === "create" ? "Create task" : activeTask?.title ?? "Edit task"}</h2>
            )}
          </div>
          <button className="icon-button" onClick={closeTaskModal} type="button" style={{ color: "var(--text-copy)", background: "transparent" }}>
            Close
          </button>
        </div>
        <form className="modal-form" onSubmit={handleTaskSubmit} style={{ color: "var(--text-copy)" }}>
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Title</span>
            <input
              onChange={(event) =>
                setTaskDraft((current) => ({ ...current, title: event.target.value }))
              }
              required
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={taskDraft.title}
            />
          </label>
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Summary</span>
            <textarea
              onChange={(event) =>
                setTaskDraft((current) => ({ ...current, summary: event.target.value }))
              }
              required
              rows={3}
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={taskDraft.summary}
            />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Project</span>
            <select
              onChange={(event) =>
                setTaskDraft((current) => {
                  const projectId = event.target.value;
                  const subsystemId =
                    bootstrap.subsystems.find((subsystem) => subsystem.projectId === projectId)
                      ?.id ?? "";

                  return {
                    ...current,
                    projectId,
                    workstreamId: null,
                    workstreamIds: [],
                    subsystemId,
                    subsystemIds: subsystemId ? [subsystemId] : [],
                    mechanismId: null,
                    mechanismIds: [],
                    partInstanceId: null,
                    partInstanceIds: [],
                  };
                })
              }
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={taskDraft.projectId}
            >
              {bootstrap.projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Discipline</span>
            <select
              onChange={(event) =>
                setTaskDraft((current) => ({ ...current, disciplineId: event.target.value }))
              }
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={taskDraft.disciplineId}
            >
              {bootstrap.disciplines.map((discipline) => (
                <option key={discipline.id} value={discipline.id}>
                  {discipline.name}
                </option>
              ))}
            </select>
          </label>
          <div className="field modal-wide task-target-picker">
            <span style={{ color: "var(--text-title)" }}>Targets</span>
            <label className="task-target-primary">
              <span>{targetGroupLabel === "Subsystems" ? "Subsystem" : "Workstream"}</span>
              <select
                onChange={(event) => updatePrimaryTarget(event.target.value)}
                required
                style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
                value={selectedPrimaryTargetId}
              >
                <option value="" disabled>
                  {targetFallback}
                </option>
                {projectSubsystems.map((subsystem) => (
                  <option key={subsystem.id} value={subsystem.id}>
                    {subsystem.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="task-target-selected" aria-live="polite">
              {selectedScopeChips.length > 0 ? (
                selectedScopeChips.map((chip) => (
                  <span className="task-target-chip" key={chip.key}>
                    {chip.label}
                  </span>
                ))
              ) : (
                <span className="task-target-empty">All mechanisms and part instances</span>
              )}
            </div>
            <div className="task-target-grid">
              <div className="task-target-group">
                <span className="task-target-group-title">Mechanisms</span>
                {projectMechanisms.map((mechanism) =>
                  renderTargetOption(
                    "mechanism",
                    mechanism.id,
                    mechanism.name,
                    subsystemsById[mechanism.subsystemId]?.name ?? null,
                    selectedMechanismIds.includes(mechanism.id),
                  ),
                )}
              </div>
              <div className="task-target-group">
                <span className="task-target-group-title">Part instances</span>
                {projectPartInstances.map((partInstance) =>
                  renderTargetOption(
                    "part-instance",
                    partInstance.id,
                    getPartInstanceLabel(partInstance),
                    [
                      subsystemsById[partInstance.subsystemId]?.name,
                      partInstance.mechanismId
                        ? mechanismsById[partInstance.mechanismId]?.name
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" / ") || null,
                    selectedPartInstanceIds.includes(partInstance.id),
                  ),
                )}
              </div>
            </div>
          </div>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Target event</span>
            <select
              onChange={(event) =>
                setTaskDraft((current) => ({
                  ...current,
                  targetEventId: event.target.value || null,
                }))
              }
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={taskDraft.targetEventId ?? ""}
            >
              <option value="">No event</option>
              {bootstrap.events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Owner</span>
            <select
              onChange={(event) => {
                const ownerId = event.target.value || null;
                setTaskDraft((current) => ({
                  ...current,
                  ownerId,
                  assigneeIds: ownerId
                    ? Array.from(new Set([...current.assigneeIds, ownerId]))
                    : current.assigneeIds,
                }));
              }}
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={taskDraft.ownerId ?? ""}
            >
              <option value="">Unassigned</option>
              {students.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Assigned students</span>
            <select
              multiple
              onChange={(event) => {
                const assigneeIds = Array.from(
                  event.currentTarget.selectedOptions,
                  (option) => option.value,
                );
                setTaskDraft((current) => ({
                  ...current,
                  assigneeIds: Array.from(
                    new Set(
                      [...assigneeIds, current.ownerId].filter(
                        (memberId): memberId is string => Boolean(memberId),
                      ),
                    ),
                  ),
                }));
              }}
              size={Math.min(students.length || 1, 5)}
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={selectedAssigneeIds}
            >
              {students.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Mentor</span>
            <select
              onChange={(event) =>
                setTaskDraft((current) => ({
                  ...current,
                  mentorId: event.target.value || null,
                }))
              }
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={taskDraft.mentorId ?? ""}
            >
              <option value="">Unassigned</option>
              {mentors.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Status</span>
            <select
              onChange={(event) =>
                setTaskDraft((current) => ({
                  ...current,
                  status: event.target.value as TaskPayload["status"],
                }))
              }
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={taskDraft.status}
            >
              <option value="not-started">Not started</option>
              <option value="in-progress">In progress</option>
              <option value="waiting-for-qa">Waiting for QA</option>
              <option value="complete">Complete</option>
            </select>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Priority</span>
            <select
              onChange={(event) =>
                setTaskDraft((current) => ({
                  ...current,
                  priority: event.target.value as TaskPayload["priority"],
                }))
              }
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={taskDraft.priority}
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Start date</span>
            <input
              onChange={(event) =>
                setTaskDraft((current) => ({ ...current, startDate: event.target.value }))
              }
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              type="date"
              value={taskDraft.startDate}
            />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Due date</span>
            <input
              onChange={(event) =>
                setTaskDraft((current) => ({ ...current, dueDate: event.target.value }))
              }
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              type="date"
              value={taskDraft.dueDate}
            />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Estimated hours</span>
            <input
              min="0"
              onChange={(event) =>
                setTaskDraft((current) => ({
                  ...current,
                  estimatedHours: Number(event.target.value),
                }))
              }
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              type="number"
              value={taskDraft.estimatedHours}
            />
          </label>
          {taskModalMode === "edit" ? (
            <label className="field">
              <span style={{ color: "var(--text-title)" }}>Actual hours</span>
              <input
                min="0"
                onChange={(event) =>
                  setTaskDraft((current) => ({
                    ...current,
                    actualHours: Number(event.target.value),
                  }))
                }
                style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
                step="0.5"
                type="number"
                value={taskDraft.actualHours}
              />
            </label>
          ) : null}
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Blockers</span>
            <input
              onChange={(event) => setTaskDraftBlockers(event.target.value)}
              placeholder="Comma-separated blockers"
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={taskDraftBlockers}
            />
          </label>
          <div className="checkbox-row modal-wide">
            <label className="checkbox-field">
              <input
                checked={taskDraft.requiresDocumentation}
                onChange={(event) =>
                  setTaskDraft((current) => ({
                    ...current,
                    requiresDocumentation: event.target.checked,
                  }))
                }
                type="checkbox"
              />
              <span style={{ color: "var(--text-title)" }}>Requires documentation</span>
            </label>
            <label className="checkbox-field">
              <input
                checked={taskDraft.documentationLinked}
                onChange={(event) =>
                  setTaskDraft((current) => ({
                    ...current,
                    documentationLinked: event.target.checked,
                  }))
                }
                type="checkbox"
              />
              <span style={{ color: "var(--text-title)" }}>Documentation linked</span>
            </label>
          </div>
          <div className="modal-actions modal-wide">
            {taskModalMode === "edit" && activeTask?.id ? (
              <button
                className="danger-action"
                disabled={isDeletingTask || isSavingTask}
                onClick={() => {
                  void handleDeleteTask(activeTask.id);
                }}
                type="button"
              >
                {isDeletingTask ? "Deleting..." : "Delete task"}
              </button>
            ) : null}
            <button className="secondary-action" onClick={closeTaskModal} style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }} type="button">
              Cancel
            </button>
            <button className="primary-action" disabled={isSavingTask || isDeletingTask} type="submit">
              {isSavingTask
                ? "Saving..."
                : taskModalMode === "create"
                  ? "Create task"
                  : "Save changes"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

interface WorkLogEditorModalProps {
  bootstrap: BootstrapPayload;
  closeWorkLogModal: () => void;
  handleWorkLogSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSavingWorkLog: boolean;
  setWorkLogDraft: Dispatch<SetStateAction<WorkLogPayload>>;
  workLogDraft: WorkLogPayload;
}

export function WorkLogEditorModal({
  bootstrap,
  closeWorkLogModal,
  handleWorkLogSubmit,
  isSavingWorkLog,
  setWorkLogDraft,
  workLogDraft,
}: WorkLogEditorModalProps) {
  const selectedTask = bootstrap.tasks.find(
    (task) => task.id === workLogDraft.taskId,
  );
  const selectedSubsystem = selectedTask
    ? bootstrap.subsystems.find(
        (subsystem) => subsystem.id === selectedTask.subsystemId,
      )
    : null;

  return (
    <div className="modal-scrim" role="presentation" style={{ zIndex: 2000 }}>
      <section
        aria-modal="true"
        className="modal-card"
        role="dialog"
        style={{ background: "var(--bg-panel)", border: "1px solid var(--border-base)" }}
      >
        <div className="panel-header compact-header">
          <div>
            <p className="eyebrow" style={{ color: "var(--meco-blue)" }}>
              Work log editor
            </p>
            <h2 style={{ color: "var(--text-title)" }}>Add work log</h2>
          </div>
          <button
            className="icon-button"
            onClick={closeWorkLogModal}
            type="button"
            style={{ color: "var(--text-copy)", background: "transparent" }}
          >
            Close
          </button>
        </div>

        <form
          className="modal-form"
          onSubmit={handleWorkLogSubmit}
          style={{ color: "var(--text-copy)" }}
        >
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Task</span>
            <select
              onChange={(event) =>
                setWorkLogDraft((current) => ({
                  ...current,
                  taskId: event.target.value,
                }))
              }
              required
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={workLogDraft.taskId}
            >
              <option value="" disabled>
                Choose a task
              </option>
              {bootstrap.tasks.map((task) => {
                const subsystemName =
                  task.subsystemIds
                    .map(
                      (subsystemId) =>
                        bootstrap.subsystems.find((subsystem) => subsystem.id === subsystemId)
                          ?.name,
                    )
                    .filter(Boolean)
                    .join(", ") || "Unknown subsystem";

                return (
                  <option key={task.id} value={task.id}>
                    {task.title} - {subsystemName}
                  </option>
                );
              })}
            </select>
            {bootstrap.tasks.length === 0 ? (
              <small style={{ color: "var(--text-copy)" }}>
                No tasks are available in this filtered workspace.
              </small>
            ) : null}
            {selectedTask ? (
              <small style={{ color: "var(--text-copy)" }}>
                {selectedSubsystem?.name ?? "Unknown subsystem"} - {selectedTask.summary}
              </small>
            ) : null}
          </label>

          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Date</span>
            <input
              onChange={(event) =>
                setWorkLogDraft((current) => ({
                  ...current,
                  date: event.target.value,
                }))
              }
              required
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              type="date"
              value={workLogDraft.date}
            />
          </label>

          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Hours</span>
            <input
              min="0.5"
              onChange={(event) =>
                setWorkLogDraft((current) => ({
                  ...current,
                  hours: Number(event.target.value),
                }))
              }
              required
              step="0.5"
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              type="number"
              value={workLogDraft.hours}
            />
          </label>

          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Participants</span>
            <select
              multiple
              onChange={(event) =>
                setWorkLogDraft((current) => ({
                  ...current,
                  participantIds: Array.from(
                    event.currentTarget.selectedOptions,
                    (option) => option.value,
                  ),
                }))
              }
              size={Math.min(bootstrap.members.length || 1, 5)}
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={workLogDraft.participantIds}
            >
              {bootstrap.members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
            <small style={{ color: "var(--text-copy)" }}>
              Hold Ctrl or Cmd to select multiple people.
            </small>
          </label>

          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Notes</span>
            <textarea
              onChange={(event) =>
                setWorkLogDraft((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              placeholder="What got done?"
              rows={3}
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={workLogDraft.notes}
            />
          </label>

          <div className="modal-actions modal-wide">
            <button
              className="secondary-action"
              onClick={closeWorkLogModal}
              type="button"
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
            >
              Cancel
            </button>
            <button
              className="primary-action"
              disabled={isSavingWorkLog || bootstrap.tasks.length === 0 || bootstrap.members.length === 0}
              type="submit"
            >
              {isSavingWorkLog ? "Saving..." : "Add work log"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

interface PurchaseEditorModalProps {
  bootstrap: BootstrapPayload;
  closePurchaseModal: () => void;
  handlePurchaseSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSavingPurchase: boolean;
  purchaseDraft: PurchaseItemPayload;
  purchaseFinalCost: string;
  purchaseModalMode: "create" | "edit";
  setPurchaseDraft: Dispatch<SetStateAction<PurchaseItemPayload>>;
  setPurchaseFinalCost: (value: string) => void;
}

export function PurchaseEditorModal({
  bootstrap,
  closePurchaseModal,
  handlePurchaseSubmit,
  isSavingPurchase,
  purchaseDraft,
  purchaseFinalCost,
  purchaseModalMode,
  setPurchaseDraft,
  setPurchaseFinalCost,
}: PurchaseEditorModalProps) {
  const selectedPartDefinition = bootstrap.partDefinitions.find(
    (partDefinition) => partDefinition.id === purchaseDraft.partDefinitionId,
  );

  return (
    <div className="modal-scrim" role="presentation" style={{ zIndex: 2000 }}>
      <section aria-modal="true" className="modal-card" role="dialog" style={{ background: "var(--bg-panel)", border: "1px solid var(--border-base)" }}>
        <div className="panel-header compact-header">
          <div>
            <p className="eyebrow" style={{ color: "var(--meco-blue)" }}>Purchase editor</p>
            <h2 style={{ color: "var(--text-title)" }}>
              {purchaseModalMode === "create"
                ? "Add purchase"
                : "Edit purchase"}
            </h2>
          </div>
          <button className="icon-button" onClick={closePurchaseModal} type="button" style={{ color: "var(--text-copy)", background: "transparent" }}>
            Close
          </button>
        </div>
        <form className="modal-form" onSubmit={handlePurchaseSubmit} style={{ color: "var(--text-copy)" }}>
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Part</span>
            <select
              onChange={(event) => {
                const partDefinitionId = event.target.value;
                const partDefinition = bootstrap.partDefinitions.find(
                  (candidate) => candidate.id === partDefinitionId,
                );

                setPurchaseDraft((current) => ({
                  ...current,
                  partDefinitionId,
                  title: partDefinition?.name ?? current.title,
                }));
              }}
              required
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={purchaseDraft.partDefinitionId ?? ""}
            >
              <option value="">Select a real part from the Parts tab...</option>
              {bootstrap.partDefinitions.map((partDefinition) => (
                <option key={partDefinition.id} value={partDefinition.id}>
                  {partDefinition.partNumber} - {partDefinition.name} (Rev {partDefinition.revision})
                </option>
              ))}
            </select>
            <small style={{ color: "var(--text-copy)" }}>
              {selectedPartDefinition
                ? `Stored as ${selectedPartDefinition.name}.`
                : "Purchases can only be logged against a real part from the catalog."}
            </small>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Subsystem</span>
            <select
              onChange={(event) =>
                setPurchaseDraft((current) => ({
                  ...current,
                  subsystemId: event.target.value,
                }))
              }
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={purchaseDraft.subsystemId}
            >
              {bootstrap.subsystems.map((subsystem) => (
                <option key={subsystem.id} value={subsystem.id}>
                  {subsystem.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Requester</span>
            <select
              onChange={(event) =>
                setPurchaseDraft((current) => ({
                  ...current,
                  requestedById: event.target.value || null,
                }))
              }
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={purchaseDraft.requestedById ?? ""}
            >
              <option value="">Unassigned</option>
              {bootstrap.members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Vendor</span>
            <input
              onChange={(event) =>
                setPurchaseDraft((current) => ({
                  ...current,
                  vendor: event.target.value,
                }))
              }
              required
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={purchaseDraft.vendor}
            />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Link label</span>
            <input
              onChange={(event) =>
                setPurchaseDraft((current) => ({
                  ...current,
                  linkLabel: event.target.value,
                }))
              }
              required
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={purchaseDraft.linkLabel}
            />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Quantity</span>
            <input
              min="1"
              onChange={(event) =>
                setPurchaseDraft((current) => ({
                  ...current,
                  quantity: Number(event.target.value),
                }))
              }
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              type="number"
              value={purchaseDraft.quantity}
            />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Status</span>
            <select
              onChange={(event) =>
                setPurchaseDraft((current) => ({
                  ...current,
                  status: event.target.value as PurchaseItemPayload["status"],
                }))
              }
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={purchaseDraft.status}
            >
              <option value="requested">Requested</option>
              <option value="approved">Approved</option>
              <option value="purchased">Purchased</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
            </select>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Estimated cost</span>
            <input
              min="0"
              onChange={(event) =>
                setPurchaseDraft((current) => ({
                  ...current,
                  estimatedCost: Number(event.target.value),
                }))
              }
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              type="number"
              value={purchaseDraft.estimatedCost}
            />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Final cost</span>
            <input
              min="0"
              onChange={(event) => setPurchaseFinalCost(event.target.value)}
              placeholder="Optional"
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              type="number"
              value={purchaseFinalCost}
            />
          </label>
          <div className="checkbox-row modal-wide">
            <label className="checkbox-field">
              <input
                checked={purchaseDraft.approvedByMentor}
                onChange={(event) =>
                  setPurchaseDraft((current) => ({
                    ...current,
                    approvedByMentor: event.target.checked,
                  }))
                }
                type="checkbox"
              />
              <span style={{ color: "var(--text-title)" }}>Mentor approved</span>
            </label>
          </div>
          <div className="modal-actions modal-wide">
            <button className="secondary-action" onClick={closePurchaseModal} style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }} type="button">
              Cancel
            </button>
            <button className="primary-action" disabled={isSavingPurchase} type="submit">
              {isSavingPurchase
                ? "Saving..."
                : purchaseModalMode === "create"
                  ? "Add purchase"
                  : "Save changes"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

interface ManufacturingEditorModalProps {
  bootstrap: BootstrapPayload;
  closeManufacturingModal: () => void;
  handleManufacturingSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSavingManufacturing: boolean;
  manufacturingDraft: ManufacturingItemPayload;
  manufacturingModalMode: "create" | "edit";
  setManufacturingDraft: Dispatch<SetStateAction<ManufacturingItemPayload>>;
}

export function ManufacturingEditorModal({
  bootstrap,
  closeManufacturingModal,
  handleManufacturingSubmit,
  isSavingManufacturing,
  manufacturingDraft,
  manufacturingModalMode,
  setManufacturingDraft,
}: ManufacturingEditorModalProps) {
  const COMMON_MATERIALS = [
    "Aluminum 6061", "Steel 4130", "Polycarbonate",
    "PLA - Black", "PLA - Blue", "PETG", "TPU",
    "Delrin", "Wood"
  ];
  const materialOptions = bootstrap.materials.length > 0
    ? bootstrap.materials
    : COMMON_MATERIALS.map((name) => ({ id: name, name }));
  const filteredPartInstances = bootstrap.partInstances.filter(
    (partInstance) => partInstance.subsystemId === manufacturingDraft.subsystemId,
  );
  const selectedPartDefinition = manufacturingDraft.partDefinitionId
    ? bootstrap.partDefinitions.find(
        (partDefinition) => partDefinition.id === manufacturingDraft.partDefinitionId,
      )
    : null;
  const isPartSelectionRequired = manufacturingDraft.process !== "fabrication";

  return (
    <div className="modal-scrim" role="presentation" style={{ zIndex: 2000 }}>
      <section aria-modal="true" className="modal-card" role="dialog" style={{ background: "var(--bg-panel)", border: "1px solid var(--border-base)" }}>
        <div className="panel-header compact-header">
          <div>
            <p className="eyebrow" style={{ color: "var(--meco-blue)" }}>Manufacturing editor</p>
            <h2 style={{ color: "var(--text-title)" }}>
              {manufacturingModalMode === "create"
                ? manufacturingDraft.process === "cnc"
                  ? "Add CNC job"
                  : "Add 3D print job"
                : "Edit manufacturing job"}
            </h2>
          </div>
          <button className="icon-button" onClick={closeManufacturingModal} type="button" style={{ color: "var(--text-copy)", background: "transparent" }}>
            Close
          </button>
        </div>
        <form className="modal-form" onSubmit={handleManufacturingSubmit} style={{ color: "var(--text-copy)" }}>
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Title</span>
            <input
              onChange={(event) =>
                setManufacturingDraft((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              readOnly={isPartSelectionRequired}
              required={!isPartSelectionRequired}
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={manufacturingDraft.title}
            />
            <small style={{ color: "var(--text-copy)" }}>
              {isPartSelectionRequired
                ? "CNC and 3D print jobs inherit their title from the selected catalog part."
                : "Fabrication jobs can still use a freeform title."}
            </small>
          </label>
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Part</span>
            <select
              onChange={(event) => {
                const partDefinitionId = event.target.value;
                const partDefinition = bootstrap.partDefinitions.find(
                  (candidate) => candidate.id === partDefinitionId,
                );

                setManufacturingDraft((current) => ({
                  ...current,
                  partDefinitionId: partDefinitionId || null,
                  title: isPartSelectionRequired
                    ? partDefinition?.name ?? current.title
                    : current.title,
                }));
              }}
              required={isPartSelectionRequired}
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={manufacturingDraft.partDefinitionId ?? ""}
            >
              <option value="">
                {isPartSelectionRequired
                  ? "Select a real part from the Parts tab..."
                  : "Optional for fabrication jobs"}
              </option>
              {bootstrap.partDefinitions.map((partDefinition) => (
                <option key={partDefinition.id} value={partDefinition.id}>
                  {partDefinition.partNumber} - {partDefinition.name} (Rev {partDefinition.revision})
                </option>
              ))}
            </select>
            <small style={{ color: "var(--text-copy)" }}>
              {isPartSelectionRequired
                ? selectedPartDefinition
                  ? `Stored as ${selectedPartDefinition.name}.`
                  : "CNC and 3D print jobs must be tied to a real part."
                : selectedPartDefinition
                  ? "This optional catalog link will not overwrite the fabrication title."
                  : "Fabrication jobs can stay freeform if they are not tied to a catalog part."}
            </small>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Subsystem</span>
            <select
              onChange={(event) =>
                setManufacturingDraft((current) => {
                  const subsystemId = event.target.value;
                  return {
                    ...current,
                    subsystemId,
                    partInstanceId:
                      bootstrap.partInstances.find(
                        (partInstance) => partInstance.subsystemId === subsystemId,
                      )?.id ?? null,
                  };
                })
              }
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={manufacturingDraft.subsystemId}
            >
              {bootstrap.subsystems.map((subsystem) => (
                <option key={subsystem.id} value={subsystem.id}>
                  {subsystem.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Requester</span>
            <select
              onChange={(event) =>
                setManufacturingDraft((current) => ({
                  ...current,
                  requestedById: event.target.value || null,
                }))
              }
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={manufacturingDraft.requestedById ?? ""}
            >
              <option value="">Unassigned</option>
              {bootstrap.members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Process</span>
            <select
              onChange={(event) =>
                setManufacturingDraft((current) => ({
                  ...current,
                  process: event.target.value as ManufacturingItemPayload["process"],
                }))
              }
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={manufacturingDraft.process}
            >
              <option value="cnc">CNC</option>
              <option value="3d-print">3D print</option>
              <option value="fabrication">Fabrication</option>
            </select>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Due date</span>
            <input
              onChange={(event) =>
                setManufacturingDraft((current) => ({
                  ...current,
                  dueDate: event.target.value,
                }))
              }
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              type="date"
              value={manufacturingDraft.dueDate}
            />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Material</span>
            <select
              onChange={(event) => {
                const selectedId = event.target.value;
                const material = bootstrap.materials.find((item) => item.id === selectedId);
                setManufacturingDraft((current) => ({
                  ...current,
                  materialId: material?.id ?? null,
                  material: material?.name ?? selectedId,
                }));
              }}
              required
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={manufacturingDraft.materialId ?? manufacturingDraft.material}
            >
              <option value="">Select material...</option>
              {materialOptions.map((material) => (
                <option key={material.id} value={material.id}>{material.name}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Part instance</span>
            <select
              onChange={(event) =>
                setManufacturingDraft((current) => ({
                  ...current,
                  partInstanceId: event.target.value || null,
                }))
              }
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={manufacturingDraft.partInstanceId ?? ""}
            >
              <option value="">No linked part</option>
              {filteredPartInstances.map((partInstance) => (
                <option key={partInstance.id} value={partInstance.id}>
                  {partInstance.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Quantity</span>
            <input
              min="1"
              onChange={(event) =>
                setManufacturingDraft((current) => ({
                  ...current,
                  quantity: Number(event.target.value),
                }))
              }
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              type="number"
              value={manufacturingDraft.quantity}
            />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Status</span>
            <select
              onChange={(event) =>
                setManufacturingDraft((current) => ({
                  ...current,
                  status: event.target.value as ManufacturingItemPayload["status"],
                }))
              }
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={manufacturingDraft.status}
            >
              <option value="requested">Requested</option>
              <option value="approved">Approved</option>
              <option value="in-progress">In progress</option>
              <option value="qa">QA</option>
              <option value="complete">Complete</option>
            </select>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Batch label</span>
            <input
              onChange={(event) =>
                setManufacturingDraft((current) => ({
                  ...current,
                  batchLabel: event.target.value,
                }))
              }
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              placeholder="Optional"
              value={manufacturingDraft.batchLabel ?? ""}
            />
          </label>
          <div className="checkbox-row modal-wide">
            <label className="checkbox-field">
              <input
                checked={manufacturingDraft.mentorReviewed}
                onChange={(event) =>
                  setManufacturingDraft((current) => ({
                    ...current,
                    mentorReviewed: event.target.checked,
                  }))
                }
                type="checkbox"
              />
              <span style={{ color: "var(--text-title)" }}>Mentor reviewed</span>
            </label>
          </div>
          <div className="modal-actions modal-wide">
            <button
              className="secondary-action"
              onClick={closeManufacturingModal}
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              type="button"
            >
              Cancel
            </button>
            <button
              className="primary-action"
              disabled={isSavingManufacturing}
              type="submit"
            >
              {isSavingManufacturing
                ? "Saving..."
                : manufacturingModalMode === "create"
                  ? "Add job"
                  : "Save changes"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

interface MaterialEditorModalProps {
  closeMaterialModal: () => void;
  handleDeleteMaterial: (id: string) => void;
  handleMaterialSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isDeletingMaterial: boolean;
  isSavingMaterial: boolean;
  materialDraft: MaterialPayload;
  materialModalMode: "create" | "edit";
  activeMaterialId: string | null;
  setMaterialDraft: Dispatch<SetStateAction<MaterialPayload>>;
}

export function MaterialEditorModal({
  closeMaterialModal,
  handleDeleteMaterial,
  handleMaterialSubmit,
  isDeletingMaterial,
  isSavingMaterial,
  materialDraft,
  materialModalMode,
  activeMaterialId,
  setMaterialDraft,
}: MaterialEditorModalProps) {
  return (
    <div className="modal-scrim" role="presentation" style={{ zIndex: 2000 }}>
      <section aria-modal="true" className="modal-card" role="dialog" style={{ background: "var(--bg-panel)", border: "1px solid var(--border-base)" }}>
        <div className="panel-header compact-header">
          <div>
            <p className="eyebrow" style={{ color: "var(--meco-blue)" }}>Material editor</p>
            <h2 style={{ color: "var(--text-title)" }}>{materialModalMode === "create" ? "Add material" : "Edit material"}</h2>
          </div>
          <button className="icon-button" onClick={closeMaterialModal} type="button" style={{ color: "var(--text-copy)", background: "transparent" }}>Close</button>
        </div>
        <form className="modal-form" onSubmit={handleMaterialSubmit} style={{ color: "var(--text-copy)" }}>
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Name</span>
            <input onChange={(event) => setMaterialDraft((current) => ({ ...current, name: event.target.value }))} required style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }} value={materialDraft.name} />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Category</span>
            <select onChange={(event) => setMaterialDraft((current) => ({ ...current, category: event.target.value as MaterialPayload["category"] }))} style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }} value={materialDraft.category}>
              <option value="metal">Metal</option>
              <option value="plastic">Plastic</option>
              <option value="filament">Filament</option>
              <option value="electronics">Electronics</option>
              <option value="hardware">Hardware</option>
              <option value="consumable">Consumable</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Unit</span>
            <input onChange={(event) => setMaterialDraft((current) => ({ ...current, unit: event.target.value }))} required style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }} value={materialDraft.unit} />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>On hand</span>
            <input min="0" onChange={(event) => setMaterialDraft((current) => ({ ...current, onHandQuantity: Number(event.target.value) }))} style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }} type="number" value={materialDraft.onHandQuantity} />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Reorder point</span>
            <input min="0" onChange={(event) => setMaterialDraft((current) => ({ ...current, reorderPoint: Number(event.target.value) }))} style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }} type="number" value={materialDraft.reorderPoint} />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Location</span>
            <input onChange={(event) => setMaterialDraft((current) => ({ ...current, location: event.target.value }))} style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }} value={materialDraft.location} />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Vendor</span>
            <input onChange={(event) => setMaterialDraft((current) => ({ ...current, vendor: event.target.value }))} style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }} value={materialDraft.vendor} />
          </label>
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Notes</span>
            <textarea onChange={(event) => setMaterialDraft((current) => ({ ...current, notes: event.target.value }))} rows={3} style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }} value={materialDraft.notes} />
          </label>
          <div className="modal-actions modal-wide">
            {materialModalMode === "edit" && activeMaterialId ? (
              <button
                className="danger-action"
                disabled={isDeletingMaterial || isSavingMaterial}
                onClick={() => handleDeleteMaterial(activeMaterialId)}
                type="button"
              >
                {isDeletingMaterial ? "Deleting..." : "Delete material"}
              </button>
            ) : null}
            <button className="secondary-action" onClick={closeMaterialModal} style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }} type="button">Cancel</button>
            <button className="primary-action" disabled={isSavingMaterial} type="submit">{isSavingMaterial ? "Saving..." : materialModalMode === "create" ? "Add material" : "Save changes"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

interface ArtifactEditorModalProps {
  activeArtifactId: string | null;
  artifactDraft: ArtifactPayload;
  artifactModalMode: "create" | "edit";
  bootstrap: BootstrapPayload;
  closeArtifactModal: () => void;
  handleArtifactSubmit: (event: FormEvent<HTMLFormElement>) => void;
  handleDeleteArtifact: (artifactId: string) => Promise<void>;
  isDeletingArtifact: boolean;
  isSavingArtifact: boolean;
  setArtifactDraft: Dispatch<SetStateAction<ArtifactPayload>>;
}

export function ArtifactEditorModal({
  activeArtifactId,
  artifactDraft,
  artifactModalMode,
  bootstrap,
  closeArtifactModal,
  handleArtifactSubmit,
  handleDeleteArtifact,
  isDeletingArtifact,
  isSavingArtifact,
  setArtifactDraft,
}: ArtifactEditorModalProps) {
  const filteredWorkstreams = bootstrap.workstreams.filter(
    (workstream) => workstream.projectId === artifactDraft.projectId,
  );

  return (
    <div className="modal-scrim" role="presentation" style={{ zIndex: 2000 }}>
      <section
        aria-modal="true"
        className="modal-card"
        role="dialog"
        style={{
          background: "var(--bg-panel)",
          border: "1px solid var(--border-base)",
        }}
      >
        <div className="panel-header compact-header">
          <div>
            <p className="eyebrow" style={{ color: "var(--meco-blue)" }}>
              Artifact editor
            </p>
            <h2 style={{ color: "var(--text-title)" }}>
              {artifactModalMode === "create" ? "Add artifact" : "Edit artifact"}
            </h2>
          </div>
          <button
            className="icon-button"
            onClick={closeArtifactModal}
            style={{ color: "var(--text-copy)", background: "transparent" }}
            type="button"
          >
            Close
          </button>
        </div>
        <form
          className="modal-form"
          onSubmit={handleArtifactSubmit}
          style={{ color: "var(--text-copy)" }}
        >
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Title</span>
            <input
              onChange={(event) =>
                setArtifactDraft((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              required
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={artifactDraft.title}
            />
          </label>

          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Project</span>
            <select
              onChange={(event) =>
                setArtifactDraft((current) => {
                  const projectId = event.target.value;
                  const defaultWorkstreamId =
                    bootstrap.workstreams.find(
                      (workstream) => workstream.projectId === projectId,
                    )?.id ?? null;
                  return {
                    ...current,
                    projectId,
                    workstreamId: defaultWorkstreamId,
                  };
                })
              }
              required
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={artifactDraft.projectId}
            >
              <option value="" disabled>
                Select project
              </option>
              {bootstrap.projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Workflow</span>
            <select
              onChange={(event) =>
                setArtifactDraft((current) => ({
                  ...current,
                  workstreamId: event.target.value || null,
                }))
              }
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={artifactDraft.workstreamId ?? ""}
            >
              <option value="">Project-level artifact</option>
              {filteredWorkstreams.map((workstream) => (
                <option key={workstream.id} value={workstream.id}>
                  {workstream.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Status</span>
            <select
              onChange={(event) =>
                setArtifactDraft((current) => ({
                  ...current,
                  status: event.target.value as ArtifactStatus,
                }))
              }
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={artifactDraft.status}
            >
              <option value="draft">Draft</option>
              <option value="in-review">In review</option>
              <option value="published">Published</option>
            </select>
          </label>

          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Summary</span>
            <textarea
              onChange={(event) =>
                setArtifactDraft((current) => ({
                  ...current,
                  summary: event.target.value,
                }))
              }
              rows={3}
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={artifactDraft.summary}
            />
          </label>

          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Link</span>
            <input
              onChange={(event) =>
                setArtifactDraft((current) => ({
                  ...current,
                  link: event.target.value,
                }))
              }
              placeholder="https://..."
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              type="url"
              value={artifactDraft.link}
            />
          </label>

          <div className="modal-actions modal-wide">
            {artifactModalMode === "edit" && activeArtifactId ? (
              <button
                className="danger-action"
                disabled={isDeletingArtifact || isSavingArtifact}
                onClick={() => {
                  void handleDeleteArtifact(activeArtifactId);
                }}
                type="button"
              >
                {isDeletingArtifact ? "Deleting..." : "Delete artifact"}
              </button>
            ) : null}
            <button
              className="secondary-action"
              onClick={closeArtifactModal}
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              type="button"
            >
              Cancel
            </button>
            <button
              className="primary-action"
              disabled={isSavingArtifact || isDeletingArtifact}
              type="submit"
            >
              {isSavingArtifact
                ? "Saving..."
                : artifactModalMode === "create"
                  ? "Add artifact"
                  : "Save changes"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

interface WorkstreamEditorModalProps {
  bootstrap: BootstrapPayload;
  closeWorkstreamModal: () => void;
  handleWorkstreamSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSavingWorkstream: boolean;
  setWorkstreamDraft: Dispatch<SetStateAction<WorkstreamPayload>>;
  workstreamDraft: WorkstreamPayload;
}

export function WorkstreamEditorModal({
  bootstrap,
  closeWorkstreamModal,
  handleWorkstreamSubmit,
  isSavingWorkstream,
  setWorkstreamDraft,
  workstreamDraft,
}: WorkstreamEditorModalProps) {
  return (
    <div className="modal-scrim" role="presentation" style={{ zIndex: 2000 }}>
      <section
        aria-modal="true"
        className="modal-card"
        role="dialog"
        style={{
          background: "var(--bg-panel)",
          border: "1px solid var(--border-base)",
        }}
      >
        <div className="panel-header compact-header">
          <div>
            <p className="eyebrow" style={{ color: "var(--meco-blue)" }}>
              Workflow editor
            </p>
            <h2 style={{ color: "var(--text-title)" }}>Add workflow</h2>
          </div>
          <button
            className="icon-button"
            onClick={closeWorkstreamModal}
            style={{ color: "var(--text-copy)", background: "transparent" }}
            type="button"
          >
            Close
          </button>
        </div>

        <form
          className="modal-form"
          onSubmit={handleWorkstreamSubmit}
          style={{ color: "var(--text-copy)" }}
        >
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Name</span>
            <input
              onChange={(event) =>
                setWorkstreamDraft((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              required
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={workstreamDraft.name}
            />
          </label>

          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Project</span>
            <select
              onChange={(event) =>
                setWorkstreamDraft((current) => ({
                  ...current,
                  projectId: event.target.value,
                }))
              }
              required
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={workstreamDraft.projectId}
            >
              <option value="" disabled>
                Select project
              </option>
              {bootstrap.projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Description</span>
            <textarea
              onChange={(event) =>
                setWorkstreamDraft((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              required
              rows={3}
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={workstreamDraft.description}
            />
          </label>

          <div className="modal-actions modal-wide">
            <button
              className="secondary-action"
              onClick={closeWorkstreamModal}
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              type="button"
            >
              Cancel
            </button>
            <button className="primary-action" disabled={isSavingWorkstream} type="submit">
              {isSavingWorkstream ? "Saving..." : "Add workflow"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

interface PartDefinitionEditorModalProps {
  bootstrap: BootstrapPayload;
  activePartDefinitionId: string | null;
  closePartDefinitionModal: () => void;
  handleDeletePartDefinition: (id: string) => void;
  handlePartDefinitionSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isDeletingPartDefinition: boolean;
  isSavingPartDefinition: boolean;
  partDefinitionDraft: PartDefinitionPayload;
  partDefinitionModalMode: "create" | "edit";
  setPartDefinitionDraft: Dispatch<SetStateAction<PartDefinitionPayload>>;
}

interface SubsystemEditorModalProps {
  activeSubsystemId: string | null;
  bootstrap: BootstrapPayload;
  closeSubsystemModal: () => void;
  handleSubsystemSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSavingSubsystem: boolean;
  subsystemDraft: SubsystemPayload;
  subsystemDraftRisks: string;
  subsystemModalMode: "create" | "edit";
  setSubsystemDraft: Dispatch<SetStateAction<SubsystemPayload>>;
  setSubsystemDraftRisks: (value: string) => void;
}

interface MechanismEditorModalProps {
  activeMechanismId: string | null;
  bootstrap: BootstrapPayload;
  closeMechanismModal: () => void;
  handleDeleteMechanism: (mechanismId: string) => void;
  handleMechanismSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isDeletingMechanism: boolean;
  isSavingMechanism: boolean;
  mechanismDraft: MechanismPayload;
  mechanismModalMode: "create" | "edit";
  setMechanismDraft: Dispatch<SetStateAction<MechanismPayload>>;
}

export function PartDefinitionEditorModal({
  bootstrap,
  activePartDefinitionId,
  closePartDefinitionModal,
  handleDeletePartDefinition,
  handlePartDefinitionSubmit,
  isDeletingPartDefinition,
  isSavingPartDefinition,
  partDefinitionDraft,
  partDefinitionModalMode,
  setPartDefinitionDraft,
}: PartDefinitionEditorModalProps) {
  const partDefinitionIterationOptions = buildIterationOptions(
    bootstrap.partDefinitions.map((partDefinition) => partDefinition.iteration),
    partDefinitionDraft.iteration,
  );

  return (
    <div className="modal-scrim" role="presentation" style={{ zIndex: 2000 }}>
      <section aria-modal="true" className="modal-card" role="dialog" style={{ background: "var(--bg-panel)", border: "1px solid var(--border-base)" }}>
        <div className="panel-header compact-header">
          <div>
            <p className="eyebrow" style={{ color: "var(--meco-blue)" }}>Part definition editor</p>
            <h2 style={{ color: "var(--text-title)" }}>{partDefinitionModalMode === "create" ? "Add part definition" : "Edit part definition"}</h2>
          </div>
          <button className="icon-button" onClick={closePartDefinitionModal} type="button" style={{ color: "var(--text-copy)", background: "transparent" }}>Close</button>
        </div>
        <form className="modal-form" onSubmit={handlePartDefinitionSubmit} style={{ color: "var(--text-copy)" }}>
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Name</span>
            <input onChange={(event) => setPartDefinitionDraft((current) => ({ ...current, name: event.target.value }))} required style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }} value={partDefinitionDraft.name} />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Part number</span>
            <input onChange={(event) => setPartDefinitionDraft((current) => ({ ...current, partNumber: event.target.value }))} required style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }} value={partDefinitionDraft.partNumber} />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Revision</span>
            <input onChange={(event) => setPartDefinitionDraft((current) => ({ ...current, revision: event.target.value }))} required style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }} value={partDefinitionDraft.revision} />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Part iteration</span>
            <select
              onChange={(event) =>
                setPartDefinitionDraft((current) => ({
                  ...current,
                  iteration: Number(event.target.value),
                }))
              }
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={partDefinitionDraft.iteration ?? 1}
            >
              {partDefinitionIterationOptions.map((iteration) => (
                <option key={iteration} value={iteration}>
                  Iteration {iteration}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Type</span>
            <input onChange={(event) => setPartDefinitionDraft((current) => ({ ...current, type: event.target.value }))} required style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }} value={partDefinitionDraft.type} />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Source</span>
            <input onChange={(event) => setPartDefinitionDraft((current) => ({ ...current, source: event.target.value }))} style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }} value={partDefinitionDraft.source} />
          </label>
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Default material</span>
            <select onChange={(event) => setPartDefinitionDraft((current) => ({ ...current, materialId: event.target.value || null }))} style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }} value={partDefinitionDraft.materialId ?? ""}>
              <option value="">No material</option>
              {bootstrap.materials.map((material) => <option key={material.id} value={material.id}>{material.name}</option>)}
            </select>
          </label>
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Description</span>
            <textarea onChange={(event) => setPartDefinitionDraft((current) => ({ ...current, description: event.target.value }))} rows={3} style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }} value={partDefinitionDraft.description} />
          </label>
          <div className="modal-actions modal-wide">
            {partDefinitionModalMode === "edit" && activePartDefinitionId ? (
              <button
                className="danger-action"
                disabled={isDeletingPartDefinition || isSavingPartDefinition}
                onClick={() => handleDeletePartDefinition(activePartDefinitionId)}
                type="button"
              >
                {isDeletingPartDefinition ? "Deleting..." : "Delete part definition"}
              </button>
            ) : null}
            <button className="secondary-action" onClick={closePartDefinitionModal} style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }} type="button">Cancel</button>
            <button className="primary-action" disabled={isSavingPartDefinition || isDeletingPartDefinition} type="submit">{isSavingPartDefinition ? "Saving..." : partDefinitionModalMode === "create" ? "Add part" : "Save changes"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

interface PartInstanceEditorModalProps {
  bootstrap: BootstrapPayload;
  closePartInstanceModal: () => void;
  handlePartInstanceSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSavingPartInstance: boolean;
  partDefinitionDraftsById: Record<string, BootstrapPayload["partDefinitions"][number]>;
  partInstanceDraft: PartInstancePayload;
  partInstanceModalMode: "create" | "edit";
  setPartInstanceDraft: Dispatch<SetStateAction<PartInstancePayload>>;
}

export function PartInstanceEditorModal({
  bootstrap,
  closePartInstanceModal,
  handlePartInstanceSubmit,
  isSavingPartInstance,
  partDefinitionDraftsById,
  partInstanceDraft,
  partInstanceModalMode,
  setPartInstanceDraft,
}: PartInstanceEditorModalProps) {
  const filteredMechanisms = bootstrap.mechanisms.filter(
    (mechanism) => mechanism.subsystemId === partInstanceDraft.subsystemId,
  );

  return (
    <div className="modal-scrim" role="presentation" style={{ zIndex: 2000 }}>
      <section aria-modal="true" className="modal-card" role="dialog" style={{ background: "var(--bg-panel)", border: "1px solid var(--border-base)" }}>
        <div className="panel-header compact-header">
          <div>
            <p className="eyebrow" style={{ color: "var(--meco-blue)" }}>Part instance editor</p>
            <h2 style={{ color: "var(--text-title)" }}>{partInstanceModalMode === "create" ? "Add part instance" : "Edit part instance"}</h2>
          </div>
          <button className="icon-button" onClick={closePartInstanceModal} type="button" style={{ color: "var(--text-copy)", background: "transparent" }}>Close</button>
        </div>
        <form className="modal-form" onSubmit={handlePartInstanceSubmit} style={{ color: "var(--text-copy)" }}>
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Name</span>
            <input onChange={(event) => setPartInstanceDraft((current) => ({ ...current, name: event.target.value }))} placeholder={partDefinitionDraftsById[partInstanceDraft.partDefinitionId]?.name ?? "Installed part name"} required style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }} value={partInstanceDraft.name} />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Part definition</span>
            <select onChange={(event) => setPartInstanceDraft((current) => ({ ...current, partDefinitionId: event.target.value }))} required style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }} value={partInstanceDraft.partDefinitionId}>
              {bootstrap.partDefinitions.map((partDefinition) => <option key={partDefinition.id} value={partDefinition.id}>{partDefinition.partNumber} - {partDefinition.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Subsystem</span>
            <select
              onChange={(event) =>
                setPartInstanceDraft((current) => {
                  const subsystemId = event.target.value;
                  const nextMechanisms = bootstrap.mechanisms.filter(
                    (mechanism) => mechanism.subsystemId === subsystemId,
                  );

                  return {
                    ...current,
                    subsystemId,
                    mechanismId: nextMechanisms[0]?.id ?? null,
                  };
                })
              }
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={partInstanceDraft.subsystemId}
            >
              {bootstrap.subsystems.map((subsystem) => <option key={subsystem.id} value={subsystem.id}>{subsystem.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Mechanism</span>
            <select
              onChange={(event) =>
                setPartInstanceDraft((current) => {
                  const mechanismId = event.target.value || null;
                  const selectedMechanism = mechanismId
                    ? bootstrap.mechanisms.find((mechanism) => mechanism.id === mechanismId) ?? null
                    : null;

                  return {
                    ...current,
                    subsystemId: selectedMechanism?.subsystemId ?? current.subsystemId,
                    mechanismId,
                  };
                })
              }
              required
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={partInstanceDraft.mechanismId ?? ""}
            >
              {filteredMechanisms.map((mechanism) => <option key={mechanism.id} value={mechanism.id}>{mechanism.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Quantity</span>
            <input min="1" onChange={(event) => setPartInstanceDraft((current) => ({ ...current, quantity: Number(event.target.value) }))} style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }} type="number" value={partInstanceDraft.quantity} />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Status</span>
            <select onChange={(event) => setPartInstanceDraft((current) => ({ ...current, status: event.target.value as PartInstancePayload["status"] }))} style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }} value={partInstanceDraft.status}>
              <option value="planned">Planned</option>
              <option value="needed">Needed</option>
              <option value="available">Available</option>
              <option value="installed">Installed</option>
              <option value="retired">Retired</option>
            </select>
          </label>
          <div className="checkbox-row modal-wide">
            <label className="checkbox-field">
              <input checked={partInstanceDraft.trackIndividually} onChange={(event) => setPartInstanceDraft((current) => ({ ...current, trackIndividually: event.target.checked }))} type="checkbox" />
              <span style={{ color: "var(--text-title)" }}>Track each physical part separately</span>
            </label>
          </div>
          <div className="modal-actions modal-wide">
            <button className="secondary-action" onClick={closePartInstanceModal} style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }} type="button">Cancel</button>
            <button className="primary-action" disabled={isSavingPartInstance} type="submit">{isSavingPartInstance ? "Saving..." : partInstanceModalMode === "create" ? "Add instance" : "Save changes"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

export function SubsystemEditorModal({
  activeSubsystemId,
  bootstrap,
  closeSubsystemModal,
  handleSubsystemSubmit,
  isSavingSubsystem,
  subsystemDraft,
  subsystemDraftRisks,
  subsystemModalMode,
  setSubsystemDraft,
  setSubsystemDraftRisks,
}: SubsystemEditorModalProps) {
  const mentorOptions = bootstrap.members.filter(
    (member) => member.role === "mentor" || member.role === "admin",
  );
  const currentSubsystem = activeSubsystemId
    ? bootstrap.subsystems.find((subsystem) => subsystem.id === activeSubsystemId) ?? null
    : null;
  const parentSubsystemOptions = bootstrap.subsystems.filter(
    (subsystem) => subsystem.id !== activeSubsystemId,
  );
  const parentSubsystemName = subsystemDraft.parentSubsystemId
    ? bootstrap.subsystems.find(
        (subsystem) => subsystem.id === subsystemDraft.parentSubsystemId,
      )?.name ?? "Unknown"
    : null;
  const subsystemIterationOptions = buildIterationOptions(
    bootstrap.subsystems
      .filter((subsystem) => subsystem.projectId === subsystemDraft.projectId)
      .map((subsystem) => subsystem.iteration),
    subsystemDraft.iteration,
  );

  return (
    <div className="modal-scrim" role="presentation" style={{ zIndex: 2000 }}>
      <section
        aria-modal="true"
        className="modal-card"
        role="dialog"
        style={{ background: "var(--bg-panel)", border: "1px solid var(--border-base)" }}
      >
        <div className="panel-header compact-header">
          <div>
            <p className="eyebrow" style={{ color: "var(--meco-blue)" }}>
              Subsystem editor
            </p>
            <h2 style={{ color: "var(--text-title)" }}>
              {subsystemModalMode === "create"
                ? "Add subsystem"
                : bootstrap.subsystems.find((subsystem) => subsystem.id === activeSubsystemId)?.name ??
                  "Edit subsystem"}
            </h2>
          </div>
          <button
            className="icon-button"
            onClick={closeSubsystemModal}
            type="button"
            style={{ color: "var(--text-copy)", background: "transparent" }}
          >
            Close
          </button>
        </div>

        <form
          className="modal-form"
          onSubmit={handleSubsystemSubmit}
          style={{ color: "var(--text-copy)" }}
        >
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Name</span>
            <input
              onChange={(event) =>
                setSubsystemDraft((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              required
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={subsystemDraft.name}
            />
          </label>

          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Description</span>
            <textarea
              onChange={(event) =>
                setSubsystemDraft((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              required
              rows={3}
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={subsystemDraft.description}
            />
          </label>

          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Subsystem iteration</span>
            <select
              onChange={(event) =>
                setSubsystemDraft((current) => ({
                  ...current,
                  iteration: Number(event.target.value),
                }))
              }
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={subsystemDraft.iteration ?? 1}
            >
              {subsystemIterationOptions.map((iteration) => (
                <option key={iteration} value={iteration}>
                  Iteration {iteration}
                </option>
              ))}
            </select>
          </label>

          {subsystemModalMode === "create" ? (
            <label className="field">
              <span style={{ color: "var(--text-title)" }}>Parent subsystem</span>
              <select
                onChange={(event) =>
                  setSubsystemDraft((current) => ({
                    ...current,
                    parentSubsystemId: event.target.value || null,
                  }))
                }
                style={{
                  background: "var(--bg-row-alt)",
                  color: "var(--text-title)",
                  border: "1px solid var(--border-base)",
                }}
                value={subsystemDraft.parentSubsystemId ?? ""}
              >
                <option value="">No parent (root subsystem)</option>
                {parentSubsystemOptions.map((subsystem) => (
                  <option key={subsystem.id} value={subsystem.id}>
                    {subsystem.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="field modal-wide">
              <span style={{ color: "var(--text-title)" }}>Parent subsystem</span>
              <p style={{ margin: 0, color: "var(--text-copy)" }}>
                {currentSubsystem?.isCore
                  ? "Drivetrain is the root subsystem and has no parent."
                  : parentSubsystemName ?? "Unassigned"}
              </p>
            </div>
          )}

          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Responsible engineer</span>
            <select
              onChange={(event) =>
                setSubsystemDraft((current) => ({
                  ...current,
                  responsibleEngineerId: event.target.value || null,
                }))
              }
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={subsystemDraft.responsibleEngineerId ?? ""}
            >
              <option value="">Unassigned</option>
              {bootstrap.members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Mentors</span>
            <select
              multiple
              onChange={(event) =>
                setSubsystemDraft((current) => ({
                  ...current,
                  mentorIds: Array.from(event.currentTarget.selectedOptions, (option) => option.value),
                }))
              }
              size={Math.min(mentorOptions.length || 1, 5)}
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={subsystemDraft.mentorIds}
            >
              {mentorOptions.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Risks</span>
            <textarea
              onChange={(event) => setSubsystemDraftRisks(event.target.value)}
              placeholder="Comma-separated risks"
              rows={3}
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={subsystemDraftRisks}
            />
          </label>

          <div className="modal-actions modal-wide">
            <button
              className="secondary-action"
              onClick={closeSubsystemModal}
              type="button"
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
            >
              Cancel
            </button>
            <button className="primary-action" disabled={isSavingSubsystem} type="submit">
              {isSavingSubsystem
                ? "Saving..."
                : subsystemModalMode === "create"
                  ? "Add subsystem"
                  : "Save changes"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export function MechanismEditorModal({
  activeMechanismId,
  bootstrap,
  closeMechanismModal,
  handleDeleteMechanism,
  handleMechanismSubmit,
  isDeletingMechanism,
  isSavingMechanism,
  mechanismDraft,
  mechanismModalMode,
  setMechanismDraft,
}: MechanismEditorModalProps) {
  const mechanismIterationOptions = buildIterationOptions(
    bootstrap.mechanisms
      .filter((mechanism) => mechanism.subsystemId === mechanismDraft.subsystemId)
      .map((mechanism) => mechanism.iteration),
    mechanismDraft.iteration,
  );

  return (
    <div className="modal-scrim" role="presentation" style={{ zIndex: 2000 }}>
      <section
        aria-modal="true"
        className="modal-card"
        role="dialog"
        style={{ background: "var(--bg-panel)", border: "1px solid var(--border-base)" }}
      >
        <div className="panel-header compact-header">
          <div>
            <p className="eyebrow" style={{ color: "var(--meco-blue)" }}>
              Mechanism editor
            </p>
            <h2 style={{ color: "var(--text-title)" }}>
              {mechanismModalMode === "create" ? "Add mechanism" : "Edit mechanism"}
            </h2>
          </div>
          <button
            className="icon-button"
            onClick={closeMechanismModal}
            type="button"
            style={{ color: "var(--text-copy)", background: "transparent" }}
          >
            Close
          </button>
        </div>

        <form
          className="modal-form"
          onSubmit={handleMechanismSubmit}
          style={{ color: "var(--text-copy)" }}
        >
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Subsystem</span>
            <select
              onChange={(event) =>
                setMechanismDraft((current) => ({
                  ...current,
                  subsystemId: event.target.value,
                }))
              }
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={mechanismDraft.subsystemId}
            >
              {bootstrap.subsystems.map((subsystem) => (
                <option key={subsystem.id} value={subsystem.id}>
                  {subsystem.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Mechanism iteration</span>
            <select
              onChange={(event) =>
                setMechanismDraft((current) => ({
                  ...current,
                  iteration: Number(event.target.value),
                }))
              }
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={mechanismDraft.iteration ?? 1}
            >
              {mechanismIterationOptions.map((iteration) => (
                <option key={iteration} value={iteration}>
                  Iteration {iteration}
                </option>
              ))}
            </select>
          </label>

          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Name</span>
            <input
              onChange={(event) =>
                setMechanismDraft((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              required
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={mechanismDraft.name}
            />
          </label>

          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Description</span>
            <textarea
              onChange={(event) =>
                setMechanismDraft((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              required
              rows={3}
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={mechanismDraft.description}
            />
          </label>

          <div className="modal-actions modal-wide">
            {mechanismModalMode === "edit" && activeMechanismId ? (
              <button
                className="danger-action"
                disabled={isDeletingMechanism || isSavingMechanism}
                onClick={() => handleDeleteMechanism(activeMechanismId)}
                type="button"
              >
                {isDeletingMechanism ? "Deleting..." : "Delete mechanism"}
              </button>
            ) : null}
            <button
              className="secondary-action"
              onClick={closeMechanismModal}
              type="button"
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
            >
              Cancel
            </button>
            <button className="primary-action" disabled={isSavingMechanism} type="submit">
              {isSavingMechanism
                ? "Saving..."
                : mechanismModalMode === "create"
                  ? "Add mechanism"
                  : "Save changes"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}


