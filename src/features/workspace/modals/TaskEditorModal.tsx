import type { Dispatch, FormEvent, SetStateAction } from "react";
import type {
  BootstrapPayload,
  TaskDependencyType,
  TaskPayload,
  TaskRecord,
} from "@/types";
import {
  formatIterationVersion,
  getProjectTaskTargetLabel,
  setTaskPrimaryTargetSelection,
  toggleTaskTargetSelection,
  type TaskTargetKind,
} from "@/lib/appUtils";
import { PhotoUploadField } from "@/features/workspace/shared/PhotoUploadField";
import {
  getDefaultTaskDisciplineIdForProject,
  getTaskDisciplinesForProject,
  isTaskDisciplineAllowedForProject,
} from "@/lib/taskDisciplines";
import { formatTaskStatusLabel } from "@/features/workspace/shared/workspaceOptions";
import { TaskDependencyEditor } from "./TaskDependencyEditor";

interface TaskEditorModalProps {
  activeTask: TaskRecord | null;
  bootstrap: BootstrapPayload;
  closeTaskModal: () => void;
  disciplinesById: Record<string, BootstrapPayload["disciplines"][number]>;
  eventsById: Record<string, BootstrapPayload["events"][number]>;
  handleDeleteTask: (taskId: string) => Promise<void>;
  handleResolveTaskBlocker: (blockerId: string) => Promise<void>;
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
  const availableDisciplines = getTaskDisciplinesForProject(selectedProject);
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
  const isCreateTaskModal = taskModalMode === "create";
  const isEditTaskModal = taskModalMode === "edit";

  return (
    <div className="modal-scrim" role="presentation" style={{ zIndex: 2000 }}>
      <section
        aria-modal="true"
        className="modal-card task-details-modal task-editor-modal"
        role="dialog"
        style={{ background: "var(--bg-panel)", border: "1px solid var(--border-base)" }}
      >
        <div className="panel-header compact-header task-details-header">
          <div>
            <p className="eyebrow" style={{ color: "var(--meco-blue)" }}>
              Task editor
            </p>
            <div className="task-detail-header-title-row">
              <div className="task-detail-header-title-stack">
                <div className="task-detail-header-title-main">
                  {taskModalMode === "create" && showCreateTypeToggle ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        flexWrap: "wrap",
                        width: "100%",
                      }}
                    >
                      <input
                        className="task-editor-title-input"
                        aria-label="Task title"
                        onChange={(event) =>
                          setTaskDraft((current) => ({ ...current, title: event.target.value }))
                        }
                        required
                        value={taskDraft.title}
                      />
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
                    <input
                      className="task-editor-title-input"
                      aria-label="Task title"
                      onChange={(event) =>
                        setTaskDraft((current) => ({ ...current, title: event.target.value }))
                      }
                      required
                      value={taskDraft.title}
                    />
                  )}
                </div>
                <p className="task-detail-copy task-detail-header-meta-line">
                  <span className="task-detail-copy" style={{ color: "var(--text-copy)" }}>
                    Edit the task details below.
                  </span>
                </p>
              </div>
            </div>
          </div>
          <button
            className="icon-button"
            onClick={closeTaskModal}
            type="button"
            style={{ color: "var(--text-copy)", background: "transparent" }}
          >
            Close
          </button>
        </div>
        <form className="modal-form task-details-grid" onSubmit={handleTaskSubmit} style={{ color: "var(--text-copy)" }}>
          <label className="field task-detail-row modal-wide">
            <span style={{ color: "var(--text-title)" }}>Summary</span>
            <textarea
              onChange={(event) =>
                setTaskDraft((current) => ({ ...current, summary: event.target.value }))
              }
              required
              rows={3}
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={taskDraft.summary}
            />
          </label>
          <div className="task-details-section-grid task-details-overview-grid modal-wide">
            <label className="field task-detail-row task-detail-row-chip">
              <span style={{ color: "var(--text-title)" }}>Priority</span>
              <select
                onChange={(event) =>
                  setTaskDraft((current) => ({
                    ...current,
                    priority: event.target.value as TaskPayload["priority"],
                  }))
                }
                style={{
                  background: "var(--bg-row-alt)",
                  color: "var(--text-title)",
                  border: "1px solid var(--border-base)",
                }}
                value={taskDraft.priority}
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>
            <label className="field task-detail-row">
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
                style={{
                  background: "var(--bg-row-alt)",
                  color: "var(--text-title)",
                  border: "1px solid var(--border-base)",
                }}
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
            <div className="task-details-overview-assigned">
              <span style={{ color: "var(--text-title)" }}>Assigned</span>
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
                style={{
                  background: "var(--bg-row-alt)",
                  color: "var(--text-title)",
                  border: "1px solid var(--border-base)",
                }}
                value={selectedAssigneeIds}
              >
                {students.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
            <label className="field task-detail-row">
              <span style={{ color: "var(--text-title)" }}>Mentor</span>
              <select
                onChange={(event) =>
                  setTaskDraft((current) => ({
                    ...current,
                    mentorId: event.target.value || null,
                  }))
                }
                style={{
                  background: "var(--bg-row-alt)",
                  color: "var(--text-title)",
                  border: "1px solid var(--border-base)",
                }}
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
          </div>

          {isCreateTaskModal ? (
            <details className="task-details-section-collapse modal-wide" open>
              <summary className="task-details-section-title task-details-section-summary">
                <span>Advanced</span>
              </summary>
              <div className="task-details-section-grid">
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
                        const nextProject = projectsById[projectId] ?? null;
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
                          disciplineId: isTaskDisciplineAllowedForProject(
                            nextProject,
                            current.disciplineId,
                          )
                            ? current.disciplineId
                            : getDefaultTaskDisciplineIdForProject(nextProject),
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
                    style={{
                      background: "var(--bg-row-alt)",
                      color: "var(--text-title)",
                      border: "1px solid var(--border-base)",
                    }}
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
                    style={{
                      background: "var(--bg-row-alt)",
                      color: "var(--text-title)",
                      border: "1px solid var(--border-base)",
                    }}
                    value={taskDraft.disciplineId}
                  >
                    {availableDisciplines.map((discipline) => (
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
                      style={{
                        background: "var(--bg-row-alt)",
                        color: "var(--text-title)",
                        border: "1px solid var(--border-base)",
                      }}
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
                      style={{
                        background: "var(--bg-row-alt)",
                        color: "var(--text-title)",
                        border: "1px solid var(--border-base)",
                      }}
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
                      <span className="task-target-chip">{getSubsystemLabel(selectedPrimaryTarget)}</span>
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
                <TaskDependencyEditor
                  dependencyDrafts={dependencyDrafts}
                  dependencyTaskOptions={dependencyTaskOptions}
                  dependencyTypeLabels={dependencyTypeLabels}
                  onAdd={addDependencyDraft}
                  onRemove={removeDependencyDraft}
                  onUpdate={updateDependencyDraft}
                  visibleDependencyDrafts={visibleDependencyDrafts}
                />
                <label className="field">
                  <span style={{ color: "var(--text-title)" }}>Target event</span>
                  <select
                    onChange={(event) =>
                      setTaskDraft((current) => ({
                        ...current,
                        targetEventId: event.target.value || null,
                      }))
                    }
                    style={{
                      background: "var(--bg-row-alt)",
                      color: "var(--text-title)",
                      border: "1px solid var(--border-base)",
                    }}
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
                  <span style={{ color: "var(--text-title)" }}>Status</span>
                  <select
                    onChange={(event) =>
                      setTaskDraft((current) => ({
                        ...current,
                        status: event.target.value as TaskPayload["status"],
                      }))
                    }
                    style={{
                      background: "var(--bg-row-alt)",
                      color: "var(--text-title)",
                      border: "1px solid var(--border-base)",
                    }}
                    value={taskDraft.status}
                  >
                    <option value="not-started">Not started</option>
                    <option value="in-progress">In progress</option>
                    <option value="waiting-for-qa">{formatTaskStatusLabel("waiting-for-qa")}</option>
                    <option value="complete">Complete</option>
                  </select>
                </label>
                <label className="field">
                  <span style={{ color: "var(--text-title)" }}>Start date</span>
                  <input
                    onChange={(event) =>
                      setTaskDraft((current) => ({ ...current, startDate: event.target.value }))
                    }
                    style={{
                      background: "var(--bg-row-alt)",
                      color: "var(--text-title)",
                      border: "1px solid var(--border-base)",
                    }}
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
                    style={{
                      background: "var(--bg-row-alt)",
                      color: "var(--text-title)",
                      border: "1px solid var(--border-base)",
                    }}
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
                    style={{
                      background: "var(--bg-row-alt)",
                      color: "var(--text-title)",
                      border: "1px solid var(--border-base)",
                    }}
                    type="number"
                    value={taskDraft.estimatedHours}
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
                  <button
                    className="secondary-action"
                    onClick={closeTaskModal}
                    style={{
                      background: "var(--bg-row-alt)",
                      color: "var(--text-title)",
                      border: "1px solid var(--border-base)",
                    }}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button className="primary-action" disabled={isSavingTask || isDeletingTask} type="submit">
                    {isSavingTask ? "Saving..." : "Create task"}
                  </button>
                </div>
              </div>
            </details>
          ) : (
            <div className="task-details-section-grid modal-wide">
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
                      const nextProject = projectsById[projectId] ?? null;
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
                        disciplineId: isTaskDisciplineAllowedForProject(
                          nextProject,
                          current.disciplineId,
                        )
                          ? current.disciplineId
                          : getDefaultTaskDisciplineIdForProject(nextProject),
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
                  style={{
                    background: "var(--bg-row-alt)",
                    color: "var(--text-title)",
                    border: "1px solid var(--border-base)",
                  }}
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
                  style={{
                    background: "var(--bg-row-alt)",
                    color: "var(--text-title)",
                    border: "1px solid var(--border-base)",
                  }}
                  value={taskDraft.disciplineId}
                >
                  {availableDisciplines.map((discipline) => (
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
                    style={{
                      background: "var(--bg-row-alt)",
                      color: "var(--text-title)",
                      border: "1px solid var(--border-base)",
                    }}
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
                    style={{
                      background: "var(--bg-row-alt)",
                      color: "var(--text-title)",
                      border: "1px solid var(--border-base)",
                    }}
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
                    <span className="task-target-chip">{getSubsystemLabel(selectedPrimaryTarget)}</span>
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
              <TaskDependencyEditor
                dependencyDrafts={dependencyDrafts}
                dependencyTaskOptions={dependencyTaskOptions}
                dependencyTypeLabels={dependencyTypeLabels}
                onAdd={addDependencyDraft}
                onRemove={removeDependencyDraft}
                onUpdate={updateDependencyDraft}
                visibleDependencyDrafts={visibleDependencyDrafts}
              />
              <label className="field">
                <span style={{ color: "var(--text-title)" }}>Target event</span>
                <select
                  onChange={(event) =>
                    setTaskDraft((current) => ({
                      ...current,
                      targetEventId: event.target.value || null,
                    }))
                  }
                  style={{
                    background: "var(--bg-row-alt)",
                    color: "var(--text-title)",
                    border: "1px solid var(--border-base)",
                  }}
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
                <span style={{ color: "var(--text-title)" }}>Status</span>
                <select
                  onChange={(event) =>
                    setTaskDraft((current) => ({
                      ...current,
                      status: event.target.value as TaskPayload["status"],
                    }))
                  }
                  style={{
                    background: "var(--bg-row-alt)",
                    color: "var(--text-title)",
                    border: "1px solid var(--border-base)",
                  }}
                  value={taskDraft.status}
                >
                  <option value="not-started">Not started</option>
                  <option value="in-progress">In progress</option>
                  <option value="waiting-for-qa">{formatTaskStatusLabel("waiting-for-qa")}</option>
                  <option value="complete">Complete</option>
                </select>
              </label>
              <label className="field">
                <span style={{ color: "var(--text-title)" }}>Start date</span>
                <input
                  onChange={(event) =>
                    setTaskDraft((current) => ({ ...current, startDate: event.target.value }))
                  }
                  style={{
                    background: "var(--bg-row-alt)",
                    color: "var(--text-title)",
                    border: "1px solid var(--border-base)",
                  }}
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
                  style={{
                    background: "var(--bg-row-alt)",
                    color: "var(--text-title)",
                    border: "1px solid var(--border-base)",
                  }}
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
                  style={{
                    background: "var(--bg-row-alt)",
                    color: "var(--text-title)",
                    border: "1px solid var(--border-base)",
                  }}
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
                    style={{
                      background: "var(--bg-row-alt)",
                      color: "var(--text-title)",
                      border: "1px solid var(--border-base)",
                    }}
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
                {isEditTaskModal && activeTask?.id ? (
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
                <button
                  className="secondary-action"
                  onClick={closeTaskModal}
                  style={{
                    background: "var(--bg-row-alt)",
                    color: "var(--text-title)",
                    border: "1px solid var(--border-base)",
                  }}
                  type="button"
                  >
                    Cancel
                  </button>
                <button className="primary-action" disabled={isSavingTask || isDeletingTask} type="submit">
                  {isSavingTask ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          )}
        </form>
      </section>
    </div>
  );
}
