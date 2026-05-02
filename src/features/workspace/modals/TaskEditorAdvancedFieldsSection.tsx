import type { Dispatch, SetStateAction } from "react";
import type { BootstrapPayload, TaskPayload, TaskRecord } from "@/types";
import { PhotoUploadField } from "../shared/PhotoUploadField";
import {
  getTaskPrimaryTargetName,
  getTaskPrimaryTargetNameOptions,
  getTaskSelectedMechanismIds,
  getTaskSelectedPartInstanceIds,
  getTaskSelectedPrimaryTargetId,
  getTaskSelectedScopeChips,
  getTaskTargetGroupLabel,
  setTaskPrimaryTargetSelection,
  toggleTaskTargetSelection,
  type TaskTargetKind,
} from "../shared/taskTargeting";
import { formatIterationVersion } from "@/lib/appUtils";
import {
  getDefaultTaskDisciplineIdForProject,
  getTaskDisciplinesForProject,
  isTaskDisciplineAllowedForProject,
} from "@/lib/taskDisciplines";
import { formatTaskStatusLabel } from "../shared/workspaceOptions";

interface TaskEditorAdvancedFieldsSectionProps {
  activeTask: TaskRecord | null;
  bootstrap: BootstrapPayload;
  closeTaskModal: () => void;
  currentTaskId: string | null;
  isDeletingTask: boolean;
  isSavingTask: boolean;
  requestPhotoUpload: (projectId: string, file: File) => Promise<string>;
  setTaskDraft: Dispatch<SetStateAction<TaskPayload>>;
  taskDraft: TaskPayload;
}

export function TaskEditorAdvancedFieldsSection({
  bootstrap,
  closeTaskModal,
  currentTaskId,
  isDeletingTask,
  isSavingTask,
  requestPhotoUpload,
  setTaskDraft,
  taskDraft,
}: TaskEditorAdvancedFieldsSectionProps) {
  const projectsById = Object.fromEntries(
    bootstrap.projects.map((project) => [project.id, project] as const),
  ) as Record<string, BootstrapPayload["projects"][number]>;
  const taskPhotoProjectId = taskDraft.projectId || bootstrap.projects[0]?.id || null;
  const selectedProject = taskDraft.projectId ? projectsById[taskDraft.projectId] : null;
  const availableDisciplines = getTaskDisciplinesForProject(selectedProject);
  const targetGroupLabel = getTaskTargetGroupLabel(selectedProject);
  const targetFallback = `No ${targetGroupLabel === "Subsystems" ? "subsystem" : "workstream"}`;
  const subsystemsById = Object.fromEntries(
    bootstrap.subsystems.map((subsystem) => [subsystem.id, subsystem] as const),
  ) as Record<string, BootstrapPayload["subsystems"][number]>;
  const mechanismsById = Object.fromEntries(
    bootstrap.mechanisms.map((mechanism) => [mechanism.id, mechanism] as const),
  ) as Record<string, BootstrapPayload["mechanisms"][number]>;
  const partDefinitionsById = Object.fromEntries(
    bootstrap.partDefinitions.map((partDefinition) => [partDefinition.id, partDefinition] as const),
  ) as Record<string, BootstrapPayload["partDefinitions"][number]>;
  const projectSubsystems = bootstrap.subsystems.filter(
    (subsystem) => subsystem.projectId === taskDraft.projectId,
  );
  const sortedProjectSubsystems = [...projectSubsystems].sort(
    (left, right) => left.name.localeCompare(right.name) || left.iteration - right.iteration,
  );
  const selectedPrimaryTargetId = getTaskSelectedPrimaryTargetId(taskDraft);
  const selectedPrimaryTarget = selectedPrimaryTargetId
    ? subsystemsById[selectedPrimaryTargetId] ?? null
    : null;
  const primaryTargetNameOptions = getTaskPrimaryTargetNameOptions(sortedProjectSubsystems);
  const selectedPrimaryTargetName =
    getTaskPrimaryTargetName(selectedPrimaryTargetId, subsystemsById) || primaryTargetNameOptions[0] || "";
  const selectedPrimaryTargetIterations = sortedProjectSubsystems.filter(
    (subsystem) => subsystem.name === selectedPrimaryTargetName,
  );
  const projectMechanisms = bootstrap.mechanisms.filter(
    (mechanism) => mechanism.subsystemId === selectedPrimaryTargetId,
  );
  const projectPartInstances = bootstrap.partInstances.filter(
    (partInstance) => partInstance.subsystemId === selectedPrimaryTargetId,
  );
  const selectedMechanismIds = getTaskSelectedMechanismIds(taskDraft);
  const selectedPartInstanceIds = getTaskSelectedPartInstanceIds(taskDraft);
  const selectedScopeChips = getTaskSelectedScopeChips(taskDraft, {
    mechanismsById,
    partInstancesById: Object.fromEntries(
      bootstrap.partInstances.map((partInstance) => [partInstance.id, partInstance] as const),
    ),
    partDefinitionsById,
    formatIterationVersion,
  });
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
    <label className={`task-target-option${checked ? " is-selected" : ""}`} key={`${kind}-${id}`}>
      <input checked={checked} onChange={() => toggleTarget(kind, id)} type="checkbox" />
      <span className="task-target-option-copy">
        <span>{label}</span>
        {detail ? <small>{detail}</small> : null}
      </span>
    </label>
  );
  const updatePrimaryTarget = (subsystemId: string) => {
    setTaskDraft((current) => setTaskPrimaryTargetSelection(current, bootstrap, subsystemId));
  };
  const updatePrimaryTargetName = (subsystemName: string) => {
    const subsystemMatches = sortedProjectSubsystems.filter((subsystem) => subsystem.name === subsystemName);
    const nextPrimaryTarget =
      subsystemMatches.find((subsystem) => subsystem.id === selectedPrimaryTargetId) ??
      subsystemMatches[0] ??
      null;

    updatePrimaryTarget(nextPrimaryTarget?.id ?? "");
  };

  return (
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
                  bootstrap.subsystems.find((subsystem) => subsystem.projectId === projectId)?.id ?? "";
                const validDependencyTaskIds = new Set(
                  bootstrap.tasks
                    .filter((task) => task.projectId === projectId && task.id !== currentTaskId)
                    .map((task) => task.id),
                );

                return {
                  ...current,
                  projectId,
                  disciplineId: isTaskDisciplineAllowedForProject(nextProject, current.disciplineId)
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
                    dependency.kind === "task"
                      ? validDependencyTaskIds.has(dependency.refId)
                      : dependency.kind === "milestone" || dependency.kind === "event"
                        ? bootstrap.events.some(
                            (event) =>
                              (event.projectIds.length === 0 || event.projectIds.includes(projectId)) &&
                              event.id === dependency.refId,
                          )
                        : dependency.kind === "part_instance"
                          ? bootstrap.partInstances.some((partInstance) => {
                              if (partInstance.id !== dependency.refId) {
                                return false;
                              }

                              return bootstrap.subsystems.some(
                                (subsystem) =>
                                  subsystem.id === partInstance.subsystemId && subsystem.projectId === projectId,
                              );
                            })
                          : false,
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
  );
}
