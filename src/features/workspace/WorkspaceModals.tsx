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
  QaReportPayload,
  SubsystemPayload,
  TaskPayload,
  TaskRecord,
  TaskDependencyType,
  TestResultPayload,
  WorkLogPayload,
  WorkstreamPayload,
} from "@/types";
import {
  buildIterationOptions,
  formatIterationVersion,
  getManufacturingPartInstanceOptions,
  getProjectTaskTargetLabel,
  inferManufacturingDraftFromPartSelection,
  setTaskPrimaryTargetSelection,
  toggleManufacturingDraftPartInstanceSelection,
  toggleTaskTargetSelection,
  type TaskTargetKind,
} from "@/lib/appUtils";
import { PhotoUploadField } from "@/features/workspace/shared/PhotoUploadField";
import {
  formatTaskPlanningState,
  getTaskBlocksDependencies,
  getTaskOpenBlockersForTask,
  getTaskWaitingOnDependencies,
  getTaskPlanningState,
} from "@/features/workspace/shared/taskPlanning";

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
  requestPhotoUpload: (projectId: string, file: File) => Promise<string>;
  taskDraft: TaskPayload;
  taskModalMode: "create" | "edit";
  showCreateTypeToggle?: boolean;
  onSwitchCreateTypeToMilestone?: () => void;
  setTaskDraft: Dispatch<SetStateAction<TaskPayload>>;
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
  requestPhotoUpload,
  taskDraft,
  taskModalMode,
  showCreateTypeToggle,
  onSwitchCreateTypeToMilestone,
  setTaskDraft,
}: TaskEditorModalProps) {
  const projectsById = Object.fromEntries(
    bootstrap.projects.map((project) => [project.id, project]),
  ) as Record<string, BootstrapPayload["projects"][number]>;
  const taskPhotoProjectId = taskDraft.projectId || bootstrap.projects[0]?.id || null;
  const subsystemsById = Object.fromEntries(
    bootstrap.subsystems.map((subsystem) => [subsystem.id, subsystem]),
  ) as Record<string, BootstrapPayload["subsystems"][number]>;
  const selectedProject = taskDraft.projectId ? projectsById[taskDraft.projectId] : null;
  const targetGroupLabel = getProjectTaskTargetLabel(selectedProject);
  const targetFallback = `No ${targetGroupLabel === "Subsystems" ? "subsystem" : "workstream"}`;
  const projectSubsystems = bootstrap.subsystems.filter(
    (subsystem) => subsystem.projectId === taskDraft.projectId,
  );
  const sortedProjectSubsystems = [...projectSubsystems].sort(
    (left, right) =>
      left.name.localeCompare(right.name) || left.iteration - right.iteration,
  );
  const selectedSubsystemIds =
    taskDraft.subsystemIds.length > 0
      ? taskDraft.subsystemIds
      : taskDraft.subsystemId
        ? [taskDraft.subsystemId]
        : [];
  const selectedPrimaryTargetId = selectedSubsystemIds[0] ?? "";
  const selectedPrimaryTarget = selectedPrimaryTargetId
    ? subsystemsById[selectedPrimaryTargetId] ?? null
    : null;
  const primaryTargetNameOptions = Array.from(
    new Set(sortedProjectSubsystems.map((subsystem) => subsystem.name)),
  );
  const selectedPrimaryTargetName =
    selectedPrimaryTarget?.name ?? primaryTargetNameOptions[0] ?? "";
  const selectedPrimaryTargetIterations = sortedProjectSubsystems.filter(
    (subsystem) => subsystem.name === selectedPrimaryTargetName,
  );
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
  const getSubsystemLabel = (subsystem: BootstrapPayload["subsystems"][number]) =>
    `${subsystem.name} (${formatIterationVersion(subsystem.iteration)})`;
  const getMechanismLabel = (mechanism: BootstrapPayload["mechanisms"][number]) =>
    `${mechanism.name} (${formatIterationVersion(mechanism.iteration)})`;
  const getPartInstanceLabel = (partInstance: BootstrapPayload["partInstances"][number]) => {
    const partDefinition = partDefinitionsById[partInstance.partDefinitionId];
    const partDefinitionLabel = partDefinition
      ? `${partDefinition.name} (${formatIterationVersion(partDefinition.iteration)})`
      : null;

    return partDefinitionLabel
      ? `${partInstance.name} (${partDefinitionLabel})`
      : partInstance.name;
  };
  const selectedScopeChips = [
    ...selectedMechanismIds.map((id) => ({
      key: `mechanism-${id}`,
      label: mechanismsById[id] ? getMechanismLabel(mechanismsById[id]) : undefined,
    })),
    ...selectedPartInstanceIds.map((id) => ({
      key: `part-instance-${id}`,
      label: partInstancesById[id] ? getPartInstanceLabel(partInstancesById[id]) : undefined,
    })),
  ].filter((chip): chip is { key: string; label: string } => Boolean(chip.label));
  const currentTaskId = activeTask?.id ?? null;
  const dependencyTaskOptions = [...bootstrap.tasks]
    .filter((task) => task.projectId === taskDraft.projectId && task.id !== currentTaskId)
    .sort((left, right) => left.title.localeCompare(right.title));
  const dependencyDrafts = taskDraft.taskDependencies ?? [];
  const visibleDependencyDrafts =
    dependencyDrafts.length > 0
      ? dependencyDrafts
      : [{ upstreamTaskId: "", dependencyType: "finish_to_start" as TaskDependencyType }];
  const dependencyTypeLabels: Record<TaskDependencyType, string> = {
    blocks: "Blocks",
    soft: "Soft",
    finish_to_start: "Finish to start",
  };
  const updatePrimaryTarget = (subsystemId: string) => {
    setTaskDraft((current) => setTaskPrimaryTargetSelection(current, bootstrap, subsystemId));
  };
  const updatePrimaryTargetName = (subsystemName: string) => {
    const subsystemMatches = sortedProjectSubsystems.filter(
      (subsystem) => subsystem.name === subsystemName,
    );
    const nextPrimaryTarget =
      subsystemMatches.find((subsystem) => subsystem.id === selectedPrimaryTargetId) ??
      subsystemMatches[0] ??
      null;

    updatePrimaryTarget(nextPrimaryTarget?.id ?? "");
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
  const updateDependencyDraft = (
    index: number,
    updates: Partial<NonNullable<TaskPayload["taskDependencies"]>[number]>,
  ) => {
    setTaskDraft((current) => {
      const nextDependencyDrafts = [...(current.taskDependencies ?? [])];
      const existingDraft =
        nextDependencyDrafts[index] ?? {
          upstreamTaskId: "",
          dependencyType: "finish_to_start" as TaskDependencyType,
        };

      nextDependencyDrafts[index] = {
        ...existingDraft,
        ...updates,
      };

      return {
        ...current,
        taskDependencies: nextDependencyDrafts,
      };
    });
  };
  const addDependencyDraft = () => {
    setTaskDraft((current) => ({
      ...current,
      taskDependencies: [
        ...(current.taskDependencies ?? []),
        {
          upstreamTaskId: "",
          dependencyType: "finish_to_start" as TaskDependencyType,
        },
      ],
    }));
  };
  const removeDependencyDraft = (index: number) => {
    setTaskDraft((current) => ({
      ...current,
      taskDependencies: (current.taskDependencies ?? []).filter(
        (_dependency, currentIndex) => currentIndex !== index,
      ),
    }));
  };

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
          <PhotoUploadField
            currentUrl={taskDraft.photoUrl}
            label="Task photo"
            onChange={(value) => setTaskDraft((current) => ({ ...current, photoUrl: value }))}
            onUpload={async (file) => {
              if (!taskPhotoProjectId) {
                throw new Error("No project is available for photo upload.");
              }

              return requestPhotoUpload(taskPhotoProjectId, file);
            }}
          />
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Project</span>
            <select
              onChange={(event) =>
                setTaskDraft((current) => {
                  const projectId = event.target.value;
                  const subsystemId =
                    bootstrap.subsystems.find((subsystem) => subsystem.projectId === projectId)
                      ?.id ?? "";
                  const validDependencyTaskIds = new Set(
                    bootstrap.tasks
                      .filter((task) => task.projectId === projectId && task.id !== currentTaskId)
                      .map((task) => task.id),
                  );

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
                    taskDependencies: (current.taskDependencies ?? []).filter((dependency) =>
                      validDependencyTaskIds.has(dependency.upstreamTaskId),
                    ),
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
                onChange={(event) => updatePrimaryTargetName(event.target.value)}
                required
                style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
                value={selectedPrimaryTargetName}
              >
                <option value="" disabled>
                  {targetFallback}
                </option>
                {primaryTargetNameOptions.map((subsystemName) => (
                  <option key={subsystemName} value={subsystemName}>
                    {subsystemName}
                  </option>
                ))}
              </select>
            </label>
            <label className="task-target-primary">
              <span>Iteration</span>
              <select
                onChange={(event) => updatePrimaryTarget(event.target.value)}
                required
                style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
                value={selectedPrimaryTargetId}
              >
                <option value="" disabled>
                  Select iteration
                </option>
                {selectedPrimaryTargetIterations.map((subsystem) => (
                  <option key={subsystem.id} value={subsystem.id}>
                    {formatIterationVersion(subsystem.iteration)}
                  </option>
                ))}
              </select>
            </label>
            <div className="task-target-selected" aria-live="polite">
              {selectedPrimaryTarget ? (
                <span className="task-target-chip">
                  {getSubsystemLabel(selectedPrimaryTarget)}
                </span>
              ) : null}
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
                    getMechanismLabel(mechanism),
                    subsystemsById[mechanism.subsystemId]
                      ? getSubsystemLabel(subsystemsById[mechanism.subsystemId])
                      : null,
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
                      partInstance.subsystemId && subsystemsById[partInstance.subsystemId]
                        ? getSubsystemLabel(subsystemsById[partInstance.subsystemId])
                        : null,
                      partInstance.mechanismId && mechanismsById[partInstance.mechanismId]
                        ? getMechanismLabel(mechanismsById[partInstance.mechanismId])
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
          <div className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Dependencies</span>
            <p style={{ margin: "0.25rem 0 0", color: "var(--text-copy)" }}>
              Planned sequencing between tasks. Use blocking dependencies for normal order.
            </p>
            <div style={{ display: "grid", gap: "0.75rem", marginTop: "0.75rem" }}>
              {visibleDependencyDrafts.map((dependency, index) => (
                <div
                  key={dependency.id ?? `dependency-${index}`}
                  style={{
                    display: "grid",
                    gap: "0.75rem",
                    padding: "0.75rem",
                    border: "1px solid var(--border-base)",
                    borderRadius: "12px",
                    background: "var(--bg-row-alt)",
                  }}
                >
                  <label className="field">
                    <span style={{ color: "var(--text-title)" }}>Depends on</span>
                    <select
                      onChange={(event) =>
                        updateDependencyDraft(index, {
                          upstreamTaskId: event.target.value,
                        })
                      }
                      style={{
                        background: "var(--bg-panel)",
                        color: "var(--text-title)",
                        border: "1px solid var(--border-base)",
                      }}
                      value={dependency.upstreamTaskId}
                    >
                      <option value="">Select task</option>
                      {dependencyTaskOptions.map((task) => (
                        <option key={task.id} value={task.id}>
                          {task.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span style={{ color: "var(--text-title)" }}>Dependency type</span>
                    <select
                      onChange={(event) =>
                        updateDependencyDraft(index, {
                          dependencyType: event.target.value as TaskDependencyType,
                        })
                      }
                      style={{
                        background: "var(--bg-panel)",
                        color: "var(--text-title)",
                        border: "1px solid var(--border-base)",
                      }}
                      value={dependency.dependencyType}
                    >
                      {Object.entries(dependencyTypeLabels).map(([type, label]) => (
                        <option key={type} value={type}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {dependencyDrafts.length > 0 ? (
                    <button
                      className="secondary-action"
                      onClick={() => removeDependencyDraft(index)}
                      type="button"
                    >
                      Remove dependency
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
            <button
              className="secondary-action"
              onClick={addDependencyDraft}
              style={{ marginTop: "0.75rem" }}
              type="button"
            >
              Add dependency
            </button>
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
  const projectsById = Object.fromEntries(
    bootstrap.projects.map((project) => [project.id, project]),
  ) as Record<string, BootstrapPayload["projects"][number]>;
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
  const linkedEvent =
    activeTask.targetEventId && eventsById[activeTask.targetEventId]
      ? eventsById[activeTask.targetEventId]
      : null;
  const planningState = getTaskPlanningState(activeTask, bootstrap);
  const openBlockers = getTaskOpenBlockersForTask(activeTask.id, bootstrap);
  const waitingOnDependencies = getTaskWaitingOnDependencies(activeTask.id, bootstrap);
  const blockingDependencies = getTaskBlocksDependencies(activeTask.id, bootstrap);
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
  const dependencyTaskLabel = (taskId: string) => blockerTaskNamesById.get(taskId) ?? "Unknown task";

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
              Task details
            </p>
            <h2 style={{ color: "var(--text-title)" }}>{activeTask.title}</h2>
          </div>
          <button
            className="icon-button"
            onClick={closeTaskDetailsModal}
            style={{ color: "var(--text-copy)", background: "transparent" }}
            type="button"
          >
            Close
          </button>
        </div>

        <div className="modal-form" style={{ color: "var(--text-copy)" }}>
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Summary</span>
            <p style={{ margin: "0.25rem 0 0", color: "var(--text-copy)" }}>
              {activeTask.summary || "No summary provided."}
            </p>
          </label>

          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Project</span>
            <p style={{ margin: "0.25rem 0 0", color: "var(--text-copy)" }}>
              {projectsById[activeTask.projectId]?.name ?? "Unknown"}
            </p>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Discipline</span>
            <p style={{ margin: "0.25rem 0 0", color: "var(--text-copy)" }}>
              {activeTask.disciplineId
                ? disciplinesById[activeTask.disciplineId]?.name ?? "Unknown"
                : "Not set"}
            </p>
          </label>

          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Status</span>
            <p style={{ margin: "0.25rem 0 0", color: "var(--text-copy)", textTransform: "capitalize" }}>
              {activeTask.status.replace("-", " ")}
            </p>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Planning state</span>
            <p style={{ margin: "0.25rem 0 0", color: "var(--text-copy)", textTransform: "capitalize" }}>
              {formatTaskPlanningState(planningState)}
            </p>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Priority</span>
            <p style={{ margin: "0.25rem 0 0", color: "var(--text-copy)", textTransform: "capitalize" }}>
              {activeTask.priority}
            </p>
          </label>

          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Due date</span>
            <p style={{ margin: "0.25rem 0 0", color: "var(--text-copy)" }}>
              {formatTaskDetailDate(activeTask.dueDate)}
            </p>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Estimate</span>
            <p style={{ margin: "0.25rem 0 0", color: "var(--text-copy)" }}>
              {activeTask.estimatedHours}h
            </p>
          </label>

          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Actual hours</span>
            <p style={{ margin: "0.25rem 0 0", color: "var(--text-copy)" }}>
              {activeTask.actualHours}h
            </p>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Assigned</span>
            <p style={{ margin: "0.25rem 0 0", color: "var(--text-copy)" }}>
              {assigneeNames.length > 0 ? assigneeNames.join(", ") : "Unassigned"}
            </p>
          </label>

          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Subsystems</span>
            <p style={{ margin: "0.25rem 0 0", color: "var(--text-copy)" }}>
              {subsystemNames.length > 0 ? subsystemNames.join(", ") : "No subsystem linked"}
            </p>
          </label>

          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Mechanisms</span>
            <p style={{ margin: "0.25rem 0 0", color: "var(--text-copy)" }}>
              {mechanismNames.length > 0 ? mechanismNames.join(", ") : "No mechanism linked"}
            </p>
          </label>

          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Parts</span>
            <p style={{ margin: "0.25rem 0 0", color: "var(--text-copy)" }}>
              {partLabels.length > 0 ? partLabels.join(", ") : "No part linked"}
            </p>
          </label>

          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Target milestone</span>
            <p style={{ margin: "0.25rem 0 0", color: "var(--text-copy)" }}>
              {linkedEvent ? linkedEvent.title : "No target milestone"}
            </p>
          </label>

          <div className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Blocked by</span>
            {openBlockers.length > 0 ? (
              <div className="workspace-detail-list" style={{ marginTop: "0.5rem" }}>
                {openBlockerRows.map((blocker) => (
                  <div
                    className="workspace-detail-list-item"
                    key={blocker.id}
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.75rem 0",
                      borderTop: "1px solid var(--border-base)",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ color: "var(--text-title)" }}>{blocker.description}</strong>
                      <div style={{ color: "var(--text-copy)", fontSize: "0.8rem" }}>
                        {blocker.blockerType.replace("_", " ")}
                        {blocker.blockerType === "task" && blocker.blockerTaskName
                          ? ` · ${blocker.blockerTaskName}`
                          : ""}
                        {blocker.severity ? ` · ${blocker.severity}` : ""}
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
              <p style={{ margin: "0.25rem 0 0", color: "var(--text-copy)" }}>None</p>
            )}
          </div>

          <div className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Waiting on</span>
            {waitingOnDependencies.length > 0 ? (
              <div style={{ marginTop: "0.5rem" }}>
                {waitingOnDependencies.map((dependency) => (
                  <p
                    key={dependency.id}
                    style={{ margin: "0.25rem 0", color: "var(--text-copy)" }}
                  >
                    {dependencyTaskLabel(dependency.upstreamTaskId)}
                    {" "}
                    <span style={{ textTransform: "lowercase" }}>
                      ({dependency.dependencyType.replace("_", " ")})
                    </span>
                  </p>
                ))}
              </div>
            ) : (
              <p style={{ margin: "0.25rem 0 0", color: "var(--text-copy)" }}>None</p>
            )}
          </div>

          <div className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Blocks</span>
            {blockingDependencies.length > 0 ? (
              <div style={{ marginTop: "0.5rem" }}>
                {blockingDependencies.map((dependency) => (
                  <p
                    key={dependency.id}
                    style={{ margin: "0.25rem 0", color: "var(--text-copy)" }}
                  >
                    {dependencyTaskLabel(dependency.downstreamTaskId)}
                    {" "}
                    <span style={{ textTransform: "lowercase" }}>
                      ({dependency.dependencyType.replace("_", " ")})
                    </span>
                  </p>
                ))}
              </div>
            ) : (
              <p style={{ margin: "0.25rem 0 0", color: "var(--text-copy)" }}>None</p>
            )}
          </div>

          <div className="checkbox-row modal-wide">
            <label className="checkbox-field">
              <input checked={activeTask.requiresDocumentation} disabled type="checkbox" />
              <span style={{ color: "var(--text-title)" }}>Requires documentation</span>
            </label>
            <label className="checkbox-field">
              <input checked={activeTask.documentationLinked} disabled type="checkbox" />
              <span style={{ color: "var(--text-title)" }}>Documentation linked</span>
            </label>
          </div>

          <div className="modal-actions modal-wide">
            <button
              className="secondary-action"
              onClick={closeTaskDetailsModal}
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              type="button"
            >
              Close
            </button>
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

interface WorkLogEditorModalProps {
  bootstrap: BootstrapPayload;
  closeWorkLogModal: () => void;
  handleWorkLogSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSavingWorkLog: boolean;
  requestPhotoUpload: (projectId: string, file: File) => Promise<string>;
  setWorkLogDraft: Dispatch<SetStateAction<WorkLogPayload>>;
  workLogDraft: WorkLogPayload;
}

export function WorkLogEditorModal({
  bootstrap,
  closeWorkLogModal,
  handleWorkLogSubmit,
  isSavingWorkLog,
  requestPhotoUpload,
  setWorkLogDraft,
  workLogDraft,
}: WorkLogEditorModalProps) {
  const selectedTask = bootstrap.tasks.find(
    (task) => task.id === workLogDraft.taskId,
  );
  const workLogPhotoProjectId = selectedTask?.projectId ?? bootstrap.projects[0]?.id ?? null;
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
          <PhotoUploadField
            currentUrl={workLogDraft.photoUrl}
            label="Work log photo"
            onChange={(value) => setWorkLogDraft((current) => ({ ...current, photoUrl: value }))}
            onUpload={async (file) => {
              if (!workLogPhotoProjectId) {
                throw new Error("No project is available for photo upload.");
              }

              return requestPhotoUpload(workLogPhotoProjectId, file);
            }}
          />

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

interface QaReportEditorModalProps {
  bootstrap: BootstrapPayload;
  closeQaReportModal: () => void;
  handleQaReportSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSavingQaReport: boolean;
  requestPhotoUpload: (projectId: string, file: File) => Promise<string>;
  qaReportDraft: QaReportPayload;
  setQaReportDraft: Dispatch<SetStateAction<QaReportPayload>>;
}

export function QaReportEditorModal({
  bootstrap,
  closeQaReportModal,
  handleQaReportSubmit,
  isSavingQaReport,
  requestPhotoUpload,
  qaReportDraft,
  setQaReportDraft,
}: QaReportEditorModalProps) {
  const selectedTask = bootstrap.tasks.find((task) => task.id === qaReportDraft.taskId);
  const qaReportPhotoProjectId = selectedTask?.projectId ?? bootstrap.projects[0]?.id ?? null;

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
              QA report
            </p>
            <h2 style={{ color: "var(--text-title)" }}>Add QA report</h2>
          </div>
          <button
            className="icon-button"
            onClick={closeQaReportModal}
            style={{ color: "var(--text-copy)", background: "transparent" }}
            type="button"
          >
            Close
          </button>
        </div>

        <form
          className="modal-form"
          onSubmit={handleQaReportSubmit}
          style={{ color: "var(--text-copy)" }}
        >
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Task</span>
            <select
              onChange={(event) =>
                setQaReportDraft((current) => ({
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
              value={qaReportDraft.taskId ?? ""}
            >
              <option disabled value="">
                Choose a task
              </option>
              {bootstrap.tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
            {selectedTask ? (
              <small style={{ color: "var(--text-copy)" }}>{selectedTask.summary}</small>
            ) : null}
          </label>

          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Result</span>
            <select
              onChange={(event) =>
                setQaReportDraft((current) => ({
                  ...current,
                  result: event.target.value as QaReportPayload["result"],
                }))
              }
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={qaReportDraft.result}
            >
              <option value="pass">Pass</option>
              <option value="minor-fix">Minor fix</option>
              <option value="iteration-worthy">Iteration worthy</option>
            </select>
          </label>

          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Reviewed date</span>
            <input
              onChange={(event) =>
                setQaReportDraft((current) => ({
                  ...current,
                  reviewedAt: event.target.value,
                }))
              }
              required
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              type="date"
              value={qaReportDraft.reviewedAt}
            />
          </label>

          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Participants</span>
            <select
              multiple
              onChange={(event) =>
                setQaReportDraft((current) => ({
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
              value={qaReportDraft.participantIds}
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

          <label className="checkbox-field modal-wide">
            <input
              checked={qaReportDraft.mentorApproved}
              onChange={(event) =>
                setQaReportDraft((current) => ({
                  ...current,
                  mentorApproved: event.target.checked,
                }))
              }
              type="checkbox"
            />
            <span style={{ color: "var(--text-title)" }}>Mentor approved</span>
          </label>

          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Notes</span>
            <textarea
              onChange={(event) =>
                setQaReportDraft((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              placeholder="QA observations and follow-up."
              rows={3}
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={qaReportDraft.notes}
            />
          </label>
          <PhotoUploadField
            accept="image/*,video/*"
            currentUrl={qaReportDraft.photoUrl}
            label="QA report media"
            onChange={(value) => setQaReportDraft((current) => ({ ...current, photoUrl: value }))}
            onUpload={async (file) => {
              if (!qaReportPhotoProjectId) {
                throw new Error("No project is available for photo upload.");
              }

              return requestPhotoUpload(qaReportPhotoProjectId, file);
            }}
          />

          <div className="modal-actions modal-wide">
            <button
              className="secondary-action"
              onClick={closeQaReportModal}
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
              disabled={
                isSavingQaReport ||
                bootstrap.tasks.length === 0 ||
                bootstrap.members.length === 0
              }
              type="submit"
            >
              {isSavingQaReport ? "Saving..." : "Add QA report"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

interface EventReportEditorModalProps {
  bootstrap: BootstrapPayload;
  closeEventReportModal: () => void;
  eventReportDraft: TestResultPayload;
  eventReportFindings: string;
  handleEventReportSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSavingEventReport: boolean;
  requestPhotoUpload: (projectId: string, file: File) => Promise<string>;
  setEventReportDraft: Dispatch<SetStateAction<TestResultPayload>>;
  setEventReportFindings: (value: string) => void;
}

export function EventReportEditorModal({
  bootstrap,
  closeEventReportModal,
  eventReportDraft,
  eventReportFindings,
  handleEventReportSubmit,
  isSavingEventReport,
  requestPhotoUpload,
  setEventReportDraft,
  setEventReportFindings,
}: EventReportEditorModalProps) {
  const selectedEvent = bootstrap.events.find((item) => item.id === eventReportDraft.eventId);
  const eventReportPhotoProjectId =
    selectedEvent?.projectIds[0] ?? bootstrap.projects[0]?.id ?? null;

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
              Event report
            </p>
            <h2 style={{ color: "var(--text-title)" }}>Add event report</h2>
          </div>
          <button
            className="icon-button"
            onClick={closeEventReportModal}
            style={{ color: "var(--text-copy)", background: "transparent" }}
            type="button"
          >
            Close
          </button>
        </div>

        <form
          className="modal-form"
          onSubmit={handleEventReportSubmit}
          style={{ color: "var(--text-copy)" }}
        >
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Event</span>
            <select
              onChange={(event) =>
                setEventReportDraft((current) => ({
                  ...current,
                  eventId: event.target.value,
                }))
              }
              required
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={eventReportDraft.eventId ?? ""}
            >
              <option disabled value="">
                Choose an event
              </option>
              {bootstrap.events.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
            {selectedEvent ? (
              <small style={{ color: "var(--text-copy)" }}>{selectedEvent.description}</small>
            ) : null}
          </label>

          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Title</span>
            <input
              onChange={(event) =>
                setEventReportDraft((current) => ({
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
              value={eventReportDraft.title ?? ""}
            />
          </label>

          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Status</span>
            <select
              onChange={(event) =>
                setEventReportDraft((current) => ({
                  ...current,
                  status: event.target.value as TestResultPayload["status"],
                }))
              }
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={eventReportDraft.status}
            >
              <option value="pass">Pass</option>
              <option value="fail">Fail</option>
              <option value="blocked">Blocked</option>
            </select>
          </label>

          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Findings (one per line)</span>
            <textarea
              onChange={(event) => setEventReportFindings(event.target.value)}
              placeholder="Add findings from this event."
              rows={4}
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={eventReportFindings}
            />
          </label>
          <PhotoUploadField
            accept="image/*,video/*"
            currentUrl={eventReportDraft.photoUrl}
            label="Event report media"
            onChange={(value) =>
              setEventReportDraft((current) => ({ ...current, photoUrl: value }))
            }
            onUpload={async (file) => {
              if (!eventReportPhotoProjectId) {
                throw new Error("No project is available for photo upload.");
              }

              return requestPhotoUpload(eventReportPhotoProjectId, file);
            }}
          />

          <div className="modal-actions modal-wide">
            <button
              className="secondary-action"
              onClick={closeEventReportModal}
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
              disabled={isSavingEventReport || bootstrap.events.length === 0}
              type="submit"
            >
              {isSavingEventReport ? "Saving..." : "Add event report"}
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
  const filteredPartInstances = getManufacturingPartInstanceOptions(bootstrap, manufacturingDraft);
  const selectedPartDefinition = manufacturingDraft.partDefinitionId
    ? bootstrap.partDefinitions.find(
        (partDefinition) => partDefinition.id === manufacturingDraft.partDefinitionId,
      )
    : null;
  const selectedPartInstanceIds = manufacturingDraft.partInstanceIds.length
    ? manufacturingDraft.partInstanceIds
    : manufacturingDraft.partInstanceId
      ? [manufacturingDraft.partInstanceId]
      : [];
  const subsystemsById = Object.fromEntries(
    bootstrap.subsystems.map((subsystem) => [subsystem.id, subsystem]),
  ) as Record<string, BootstrapPayload["subsystems"][number]>;
  const mechanismsById = Object.fromEntries(
    bootstrap.mechanisms.map((mechanism) => [mechanism.id, mechanism]),
  ) as Record<string, BootstrapPayload["mechanisms"][number]>;
  const getPartInstanceSubtitle = (partInstance: BootstrapPayload["partInstances"][number]) =>
    [
      subsystemsById[partInstance.subsystemId]?.name ?? "Unknown subsystem",
      partInstance.mechanismId ? mechanismsById[partInstance.mechanismId]?.name ?? "Unknown mechanism" : null,
    ].filter(Boolean).join(" / ");
  const togglePartInstance = (partInstanceId: string) => {
    setManufacturingDraft((current) =>
      toggleManufacturingDraftPartInstanceSelection(bootstrap, current, partInstanceId),
    );
  };

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
                  : manufacturingDraft.process === "3d-print"
                    ? "Add 3D print job"
                    : "Add fabrication job"
                : "Edit manufacturing job"}
            </h2>
          </div>
          <button className="icon-button" onClick={closeManufacturingModal} type="button" style={{ color: "var(--text-copy)", background: "transparent" }}>
            Close
          </button>
        </div>
        <form className="modal-form" onSubmit={handleManufacturingSubmit} style={{ color: "var(--text-copy)" }}>
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Part definition</span>
            <select
              onChange={(event) => {
                const partDefinitionId = event.target.value;

                setManufacturingDraft((current) =>
                  inferManufacturingDraftFromPartSelection(
                    bootstrap,
                    current,
                    partDefinitionId,
                  ),
                );
              }}
              required
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              value={manufacturingDraft.partDefinitionId ?? ""}
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
                ? `${selectedPartDefinition.name} will be used as the job title.`
                : "Choose the catalog part before selecting the instances being made."}
            </small>
          </label>
          <div className="field modal-wide task-target-picker">
            <span style={{ color: "var(--text-title)" }}>Part instances</span>
            <div className="task-target-group">
              <span className="task-target-group-title">Instances being made</span>
              {filteredPartInstances.length > 0 ? (
                filteredPartInstances.map((partInstance) => {
                  const isSelected = selectedPartInstanceIds.includes(partInstance.id);

                  return (
                    <label
                      className={`task-target-option${isSelected ? " is-selected" : ""}`}
                      key={partInstance.id}
                    >
                      <input
                        checked={isSelected}
                        onChange={() => togglePartInstance(partInstance.id)}
                        type="checkbox"
                      />
                      <span className="task-target-option-copy">
                        <span>{partInstance.name}</span>
                        <small>{getPartInstanceSubtitle(partInstance)}</small>
                      </span>
                    </label>
                  );
                })
              ) : (
                <span className="task-target-empty">
                  {selectedPartDefinition
                    ? "No part instances exist for this part definition yet."
                    : "Choose a part definition first."}
                </span>
              )}
            </div>
          </div>
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
          {manufacturingDraft.process === "cnc" ? (
            <div className="checkbox-row modal-wide">
              <label className="checkbox-field">
                <input
                  checked={manufacturingDraft.inHouse}
                  onChange={(event) =>
                    setManufacturingDraft((current) => ({
                      ...current,
                      inHouse: event.target.checked,
                    }))
                  }
                  type="checkbox"
                />
                <span style={{ color: "var(--text-title)" }}>In-house</span>
              </label>
            </div>
          ) : null}
          {manufacturingModalMode === "edit" ? (
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
          ) : null}
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
            <span style={{ color: "var(--text-title)" }}>On hand</span>
            <input
              min="0"
              onChange={(event) => {
                const onHandQuantity = Number(event.target.value);
                setMaterialDraft((current) => ({
                  ...current,
                  onHandQuantity,
                  reorderPoint:
                    materialModalMode === "create"
                      ? Math.floor(onHandQuantity / 2)
                      : current.reorderPoint,
                }));
              }}
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              type="number"
              value={materialDraft.onHandQuantity}
            />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Reorder point</span>
            <input
              disabled={materialModalMode === "create"}
              min="0"
              onChange={(event) =>
                setMaterialDraft((current) => ({
                  ...current,
                  reorderPoint: Number(event.target.value),
                }))
              }
              style={{ background: "var(--bg-row-alt)", color: "var(--text-title)", border: "1px solid var(--border-base)" }}
              type="number"
              value={materialDraft.reorderPoint}
            />
            {materialModalMode === "create" ? (
              <small style={{ color: "var(--text-copy)" }}>
                Auto-set to 50% of on-hand quantity while adding.
              </small>
            ) : null}
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
  handleToggleArtifactArchived: (artifactId: string) => Promise<void>;
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
  handleToggleArtifactArchived,
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
            {artifactModalMode === "edit" && activeArtifactId ? (
              <button
                className={artifactDraft.isArchived ? "secondary-action" : "danger-action"}
                disabled={isSavingArtifact || isDeletingArtifact}
                onClick={() => {
                  void handleToggleArtifactArchived(activeArtifactId);
                }}
                type="button"
              >
                {artifactDraft.isArchived ? "Restore artifact" : "Archive artifact"}
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
  activeWorkstreamId: string | null;
  bootstrap: BootstrapPayload;
  closeWorkstreamModal: () => void;
  handleToggleWorkstreamArchived: (workstreamId: string) => void;
  handleWorkstreamSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSavingWorkstream: boolean;
  setWorkstreamDraft: Dispatch<SetStateAction<WorkstreamPayload>>;
  workstreamDraft: WorkstreamPayload;
  workstreamModalMode: "create" | "edit";
}

export function WorkstreamEditorModal({
  activeWorkstreamId,
  bootstrap,
  closeWorkstreamModal,
  handleToggleWorkstreamArchived,
  handleWorkstreamSubmit,
  isSavingWorkstream,
  setWorkstreamDraft,
  workstreamDraft,
  workstreamModalMode,
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
            <h2 style={{ color: "var(--text-title)" }}>
              {workstreamModalMode === "create" ? "Add workflow" : "Edit workflow"}
            </h2>
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
            {workstreamModalMode === "edit" && activeWorkstreamId ? (
              <button
                className={workstreamDraft.isArchived ? "secondary-action" : "danger-action"}
                disabled={isSavingWorkstream}
                onClick={() => handleToggleWorkstreamArchived(activeWorkstreamId)}
                type="button"
              >
                {workstreamDraft.isArchived ? "Restore workflow" : "Archive workflow"}
              </button>
            ) : null}
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
              {isSavingWorkstream
                ? "Saving..."
                : workstreamModalMode === "create"
                  ? "Add workflow"
                  : "Save changes"}
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
  handleTogglePartDefinitionArchived: (id: string) => void;
  handlePartDefinitionSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isDeletingPartDefinition: boolean;
  isSavingPartDefinition: boolean;
  requestPhotoUpload: (projectId: string, file: File) => Promise<string>;
  partDefinitionDraft: PartDefinitionPayload;
  partDefinitionModalMode: "create" | "edit";
  setPartDefinitionDraft: Dispatch<SetStateAction<PartDefinitionPayload>>;
}

interface SubsystemEditorModalProps {
  activeSubsystemId: string | null;
  bootstrap: BootstrapPayload;
  closeSubsystemModal: () => void;
  handleToggleSubsystemArchived: (subsystemId: string) => void;
  handleSubsystemSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSavingSubsystem: boolean;
  requestPhotoUpload: (projectId: string, file: File) => Promise<string>;
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
  handleToggleMechanismArchived: (mechanismId: string) => void;
  handleMechanismSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isDeletingMechanism: boolean;
  isSavingMechanism: boolean;
  requestPhotoUpload: (projectId: string, file: File) => Promise<string>;
  mechanismDraft: MechanismPayload;
  mechanismModalMode: "create" | "edit";
  setMechanismDraft: Dispatch<SetStateAction<MechanismPayload>>;
}

export function PartDefinitionEditorModal({
  bootstrap,
  activePartDefinitionId,
  closePartDefinitionModal,
  handleDeletePartDefinition,
  handleTogglePartDefinitionArchived,
  handlePartDefinitionSubmit,
  isDeletingPartDefinition,
  isSavingPartDefinition,
  requestPhotoUpload,
  partDefinitionDraft,
  partDefinitionModalMode,
  setPartDefinitionDraft,
}: PartDefinitionEditorModalProps) {
  const partDefinitionIterationOptions = buildIterationOptions(
    bootstrap.partDefinitions.map((partDefinition) => partDefinition.iteration),
    partDefinitionDraft.iteration,
  );
  const partDefinitionPhotoProjectId = bootstrap.projects[0]?.id ?? null;

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
          {partDefinitionModalMode === "edit" ? (
            <label className="field">
              <span style={{ color: "var(--text-title)" }}>Iteration</span>
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
                    {formatIterationVersion(iteration)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
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
          <PhotoUploadField
            currentUrl={partDefinitionDraft.photoUrl}
            label="Part photo"
            onChange={(value) =>
              setPartDefinitionDraft((current) => ({ ...current, photoUrl: value }))
            }
            onUpload={async (file) => {
              if (!partDefinitionPhotoProjectId) {
                throw new Error("No project is available for photo upload.");
              }

              return requestPhotoUpload(partDefinitionPhotoProjectId, file);
            }}
          />
          <div className="modal-actions modal-wide">
            {partDefinitionModalMode === "edit" && activePartDefinitionId ? (
              <button
                className={partDefinitionDraft.isArchived ? "secondary-action" : "danger-action"}
                disabled={isDeletingPartDefinition || isSavingPartDefinition}
                onClick={() => handleTogglePartDefinitionArchived(activePartDefinitionId)}
                type="button"
              >
                {partDefinitionDraft.isArchived
                  ? "Restore part definition"
                  : "Archive part definition"}
              </button>
            ) : null}
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
  requestPhotoUpload: (projectId: string, file: File) => Promise<string>;
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
  requestPhotoUpload,
  partDefinitionDraftsById,
  partInstanceDraft,
  partInstanceModalMode,
  setPartInstanceDraft,
}: PartInstanceEditorModalProps) {
  const filteredMechanisms = bootstrap.mechanisms.filter(
    (mechanism) => mechanism.subsystemId === partInstanceDraft.subsystemId,
  );
  const partInstancePhotoProjectId =
    bootstrap.subsystems.find((subsystem) => subsystem.id === partInstanceDraft.subsystemId)
      ?.projectId ?? bootstrap.projects[0]?.id ?? null;

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
          <PhotoUploadField
            currentUrl={partInstanceDraft.photoUrl}
            label="Part photo"
            onChange={(value) =>
              setPartInstanceDraft((current) => ({ ...current, photoUrl: value }))
            }
            onUpload={async (file) => {
              if (!partInstancePhotoProjectId) {
                throw new Error("No project is available for photo upload.");
              }

              return requestPhotoUpload(partInstancePhotoProjectId, file);
            }}
          />
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
  handleToggleSubsystemArchived,
  handleSubsystemSubmit,
  isSavingSubsystem,
  requestPhotoUpload,
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
  const subsystemPhotoProjectId = subsystemDraft.projectId || bootstrap.projects[0]?.id || null;

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

          {subsystemModalMode === "edit" ? (
            <label className="field">
              <span style={{ color: "var(--text-title)" }}>Iteration</span>
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
                    {formatIterationVersion(iteration)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

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
          <PhotoUploadField
            currentUrl={subsystemDraft.photoUrl}
            label="Subsystem photo"
            onChange={(value) => setSubsystemDraft((current) => ({ ...current, photoUrl: value }))}
            onUpload={async (file) => {
              if (!subsystemPhotoProjectId) {
                throw new Error("No project is available for photo upload.");
              }

              return requestPhotoUpload(subsystemPhotoProjectId, file);
            }}
          />

          <div className="modal-actions modal-wide">
            {subsystemModalMode === "edit" && activeSubsystemId ? (
              <button
                className={subsystemDraft.isArchived ? "secondary-action" : "danger-action"}
                disabled={isSavingSubsystem}
                onClick={() => handleToggleSubsystemArchived(activeSubsystemId)}
                type="button"
              >
                {subsystemDraft.isArchived ? "Restore subsystem" : "Archive subsystem"}
              </button>
            ) : null}
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
  handleToggleMechanismArchived,
  handleMechanismSubmit,
  isDeletingMechanism,
  isSavingMechanism,
  requestPhotoUpload,
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
  const mechanismPhotoProjectId =
    bootstrap.subsystems.find((subsystem) => subsystem.id === mechanismDraft.subsystemId)
      ?.projectId ?? bootstrap.projects[0]?.id ?? null;

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

          {mechanismModalMode === "edit" ? (
            <label className="field">
              <span style={{ color: "var(--text-title)" }}>Iteration</span>
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
                    {formatIterationVersion(iteration)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

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
          <PhotoUploadField
            currentUrl={mechanismDraft.photoUrl}
            label="Mechanism photo"
            onChange={(value) =>
              setMechanismDraft((current) => ({ ...current, photoUrl: value }))
            }
            onUpload={async (file) => {
              if (!mechanismPhotoProjectId) {
                throw new Error("No project is available for photo upload.");
              }

              return requestPhotoUpload(mechanismPhotoProjectId, file);
            }}
          />

          <div className="modal-actions modal-wide">
            {mechanismModalMode === "edit" && activeMechanismId ? (
              <button
                className={mechanismDraft.isArchived ? "secondary-action" : "danger-action"}
                disabled={isDeletingMechanism || isSavingMechanism}
                onClick={() => handleToggleMechanismArchived(activeMechanismId)}
                type="button"
              >
                {mechanismDraft.isArchived ? "Restore mechanism" : "Archive mechanism"}
              </button>
            ) : null}
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
