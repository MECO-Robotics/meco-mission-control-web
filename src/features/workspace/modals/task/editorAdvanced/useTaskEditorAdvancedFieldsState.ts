import type { Dispatch, SetStateAction } from "react";

import { formatIterationVersion } from "@/lib/appUtils/common";
import {
  getDefaultTaskDisciplineIdForProject,
  getTaskDisciplinesForProject,
  isTaskDisciplineAllowedForProject,
} from "@/lib/taskDisciplines";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskPayload } from "@/types/payloads";

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
} from "../../../shared/task/taskTargeting";

interface UseTaskEditorAdvancedFieldsStateOptions {
  bootstrap: BootstrapPayload;
  currentTaskId: string | null;
  setTaskDraft: Dispatch<SetStateAction<TaskPayload>>;
  taskDraft: TaskPayload;
}

export function useTaskEditorAdvancedFieldsState({
  bootstrap,
  currentTaskId,
  setTaskDraft,
  taskDraft,
}: UseTaskEditorAdvancedFieldsStateOptions) {
  const projectsById = Object.fromEntries(
    bootstrap.projects.map((project) => [project.id, project] as const),
  ) as Record<string, BootstrapPayload["projects"][number]>;
  const subsystemsById = Object.fromEntries(
    bootstrap.subsystems.map((subsystem) => [subsystem.id, subsystem] as const),
  ) as Record<string, BootstrapPayload["subsystems"][number]>;
  const mechanismsById = Object.fromEntries(
    bootstrap.mechanisms.map((mechanism) => [mechanism.id, mechanism] as const),
  ) as Record<string, BootstrapPayload["mechanisms"][number]>;
  const partDefinitionsById = Object.fromEntries(
    bootstrap.partDefinitions.map((partDefinition) => [partDefinition.id, partDefinition] as const),
  ) as Record<string, BootstrapPayload["partDefinitions"][number]>;
  const partInstancesById = Object.fromEntries(
    bootstrap.partInstances.map((partInstance) => [partInstance.id, partInstance] as const),
  ) as Record<string, BootstrapPayload["partInstances"][number]>;

  const taskPhotoProjectId = taskDraft.projectId || bootstrap.projects[0]?.id || null;
  const selectedProject = taskDraft.projectId ? projectsById[taskDraft.projectId] : null;
  const availableDisciplines = getTaskDisciplinesForProject(selectedProject);
  const targetGroupLabel = getTaskTargetGroupLabel(selectedProject);
  const targetFallback = `No ${targetGroupLabel === "Subsystems" ? "subsystem" : "workstream"}`;
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
    partInstancesById,
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
  const handleProjectChange = (projectId: string) => {
    const nextProject = projectsById[projectId] ?? null;
    const subsystemId = bootstrap.subsystems.find((subsystem) => subsystem.projectId === projectId)?.id ?? "";
    const validDependencyTaskIds = new Set(
      bootstrap.tasks.filter((task) => task.projectId === projectId && task.id !== currentTaskId).map((task) => task.id),
    );

    setTaskDraft((current) => ({
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
          : dependency.kind === "milestone"
            ? bootstrap.milestones.some(
                (milestone) =>
                  (milestone.projectIds.length === 0 || milestone.projectIds.includes(projectId)) &&
                  milestone.id === dependency.refId,
              )
            : dependency.kind === "part_instance"
              ? bootstrap.partInstances.some((partInstance) => {
                  if (partInstance.id !== dependency.refId) {
                    return false;
                  }

                  return bootstrap.subsystems.some(
                    (subsystem) => subsystem.id === partInstance.subsystemId && subsystem.projectId === projectId,
                  );
                })
              : false,
      ),
    }));
  };
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
  const toggleTarget = (kind: TaskTargetKind, id: string) => {
    setTaskDraft((current) =>
      toggleTaskTargetSelection(current, bootstrap, {
        kind,
        id,
      }),
    );
  };

  return {
    availableDisciplines,
    getMechanismLabel,
    getPartInstanceLabel,
    getSubsystemLabel,
    handleProjectChange,
    primaryTargetNameOptions,
    projectMechanisms,
    projectPartInstances,
    selectedMechanismIds,
    selectedPartInstanceIds,
    selectedPrimaryTarget,
    selectedPrimaryTargetId,
    selectedPrimaryTargetIterations,
    selectedPrimaryTargetName,
    selectedScopeChips,
    sortedProjectSubsystems,
    subsystemsById,
    targetFallback,
    targetGroupLabel,
    taskPhotoProjectId,
    toggleTarget,
    updatePrimaryTarget,
    updatePrimaryTargetName,
  };
}
