import type { BootstrapPayload } from "@/types/bootstrap";

import { isMemberActiveInSeason } from "@/lib/appUtils/common";

import type { InteractiveTutorialCreationCounts } from "../interactiveTutorialTypes";

export function getInteractiveTutorialCreationCounts(
  payload: BootstrapPayload,
  tutorialProjectId: string | null,
  tutorialSeasonId: string | null,
): InteractiveTutorialCreationCounts {
  const scopedTasks = tutorialProjectId
    ? payload.tasks.filter((task) => task.projectId === tutorialProjectId)
    : payload.tasks;
  const scopedTaskIds = new Set(scopedTasks.map((task) => task.id));
  const scopedSubsystems = tutorialProjectId
    ? payload.subsystems.filter((subsystem) => subsystem.projectId === tutorialProjectId)
    : payload.subsystems;
  const scopedSubsystemIds = new Set(scopedSubsystems.map((subsystem) => subsystem.id));
  const scopedStudents = tutorialSeasonId
    ? payload.members.filter(
        (member) => member.role === "student" && isMemberActiveInSeason(member, tutorialSeasonId),
      )
    : payload.members.filter((member) => member.role === "student");

  return {
    tasks: scopedTasks.length,
    workLogs: payload.workLogs.filter((workLog) => scopedTaskIds.has(workLog.taskId)).length,
    partDefinitions: payload.partDefinitions.length,
    partInstances: payload.partInstances.filter((partInstance) =>
      Boolean(partInstance.intendedSubsystemId && scopedSubsystemIds.has(partInstance.intendedSubsystemId)),
    ).length,
    subsystems: scopedSubsystems.length,
    mechanisms: payload.mechanisms.filter((mechanism) =>
      scopedSubsystemIds.has(mechanism.subsystemId),
    ).length,
    students: scopedStudents.length,
    materials: payload.materials.length,
    purchaseItems: payload.purchaseItems.filter((item) => scopedTaskIds.has(item.taskId)).length,
    milestones: payload.milestones.filter((milestone) =>
      tutorialProjectId ? milestone.projectIds.includes(tutorialProjectId) : true,
    ).length,
    documents: payload.artifacts.filter((artifact) =>
      tutorialProjectId ? artifact.projectId === tutorialProjectId : true,
    ).length,
  };
}
