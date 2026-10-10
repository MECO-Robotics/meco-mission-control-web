import { setTaskPrimaryTargetSelection } from "@/lib/appUtils/taskTargets/selection";
import type { Dispatch, SetStateAction } from "react";

import { formatIterationVersion } from "@/lib/appUtils/common";
import {
  getDefaultWorkTypeIdForProject,
  getWorkTypesForProject,
  isWorkTypeAllowedForProject,
} from "@/lib/taskDisciplines";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskPayload } from "@/types/payloads/task";

import {
  getTaskPrimaryTargetName,
  getTaskPrimaryTargetNameOptions,
  getTaskPartInstanceLabel,
  getTaskSelectedMechanismIds,
  getTaskSelectedPartInstanceIds,
  getTaskSelectedPrimaryTargetId,
  getTaskSelectedScopeChips,
} from "../../../shared/task/taskTargeting";

interface UseTaskEditorAdvancedFieldsStateOptions {
  bootstrap: BootstrapPayload;
  setTaskDraft: Dispatch<SetStateAction<TaskPayload>>;
  taskDraft: TaskPayload;
}

export function useTaskEditorAdvancedFieldsState({
  bootstrap,
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
  const availableWorkTypes = getWorkTypesForProject(bootstrap, selectedProject);
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
    (partInstance) => partInstance.intendedSubsystemId === selectedPrimaryTargetId ||
      (partInstance.location.kind === "installed" && partInstance.location.subsystemId === selectedPrimaryTargetId),
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
  const getPartInstanceLabel = (partInstance: BootstrapPayload["partInstances"][number]) =>
    getTaskPartInstanceLabel(partInstance, partDefinitionsById, formatIterationVersion);
  const handleProjectChange = (projectId: string) => {
    const nextProject = projectsById[projectId] ?? null;
    const subsystemId = nextProject?.projectType === "robot"
      ? bootstrap.subsystems.find((subsystem) => subsystem.projectId === projectId)?.id ?? ""
      : "";
    const validWorkTypeId = isWorkTypeAllowedForProject(bootstrap, nextProject, taskDraft.workTypeId)
      ? taskDraft.workTypeId
      : getDefaultWorkTypeIdForProject(bootstrap, nextProject);
    const validGroup = bootstrap.responsibleGroups.some((group) =>
      group.id === taskDraft.responsibleGroupId && group.seasonId === nextProject?.seasonId &&
      (group.projectIds.length === 0 || group.projectIds.includes(projectId)),
    );

    setTaskDraft((current) => ({
      ...current,
      projectId,
      workTypeId: validWorkTypeId,
      responsibleGroupId: validGroup ? current.responsibleGroupId : null,
      workstreamIds: [],
      subsystemIds: subsystemId ? [subsystemId] : [],
      mechanismIds: [],
      partInstanceIds: [],
      taskDependencies: current.taskDependencies,
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
  return {
    availableWorkTypes,
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
    taskPhotoProjectId,
    updatePrimaryTarget,
    updatePrimaryTargetName,
  };
}
