import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskPayload } from "@/types/payloads";
import type { TaskRecord } from "@/types/recordsExecution";
import { getDefaultTaskDisciplineIdForProject } from "@/lib/taskDisciplines";
import { localTodayDate } from "@/lib/dateUtils";
import { getDefaultSubsystemId } from "@/lib/appUtils/common";
import { createLookupById, removeId, uniqueIds } from "./internal";
import { getTaskBlockerDrafts, getTaskDependencyDrafts } from "./taskTargets/dependencies";
import { getTaskTargetArrays, normalizeTaskTargetPayload } from "./taskTargets/normalization";

export type TaskTargetKind = "workstream" | "subsystem" | "mechanism" | "part-instance";

export interface TaskTargetSelection {
  kind: TaskTargetKind;
  id: string;
}

export function getProjectTaskTargetLabel(
  project: Pick<BootstrapPayload["projects"][number], "projectType"> | null | undefined,
) {
  return project?.projectType === "robot" ? "Subsystems" : "Workstreams";
}

export function setTaskPrimaryTargetSelection(
  payload: TaskPayload,
  bootstrap: BootstrapPayload,
  subsystemId: string,
): TaskPayload {
  const selectedSubsystem = bootstrap.subsystems.find((subsystem) => subsystem.id === subsystemId);
  if (!selectedSubsystem) {
    return normalizeTaskTargetPayload(payload, bootstrap, {
      subsystemIds: [],
      mechanismIds: [],
      partInstanceIds: [],
    });
  }

  const mechanismIds = payload.mechanismIds.filter((mechanismId) =>
    bootstrap.mechanisms.some(
      (mechanism) => mechanism.id === mechanismId && mechanism.subsystemId === selectedSubsystem.id,
    ),
  );
  const partInstanceIds = payload.partInstanceIds.filter((partInstanceId) =>
    bootstrap.partInstances.some(
      (partInstance) => partInstance.id === partInstanceId && partInstance.subsystemId === selectedSubsystem.id,
    ),
  );

  return normalizeTaskTargetPayload(payload, bootstrap, {
    subsystemIds: [selectedSubsystem.id],
    mechanismIds,
    partInstanceIds,
  });
}

export function toggleTaskTargetSelection(
  payload: TaskPayload,
  bootstrap: BootstrapPayload,
  selection: TaskTargetSelection,
): TaskPayload {
  const mechanismsById = createLookupById(bootstrap.mechanisms);
  const partInstancesById = createLookupById(bootstrap.partInstances);

  let { subsystemIds, mechanismIds, partInstanceIds } = getTaskTargetArrays(payload);

  if (selection.kind === "workstream" || selection.kind === "subsystem") {
    if (subsystemIds.includes(selection.id)) {
      const removedMechanismIds = new Set(
        bootstrap.mechanisms
          .filter((mechanism) => mechanism.subsystemId === selection.id)
          .map((mechanism) => mechanism.id),
      );

      subsystemIds = removeId(subsystemIds, selection.id);
      mechanismIds = mechanismIds.filter(
        (mechanismId) => mechanismsById[mechanismId]?.subsystemId !== selection.id,
      );
      partInstanceIds = partInstanceIds.filter((partInstanceId) => {
        const partInstance = partInstancesById[partInstanceId];

        return Boolean(
          partInstance &&
            partInstance.subsystemId !== selection.id &&
            (!partInstance.mechanismId || !removedMechanismIds.has(partInstance.mechanismId)),
        );
      });
    } else {
      subsystemIds = uniqueIds([...subsystemIds, selection.id]);
    }
  }

  if (selection.kind === "mechanism") {
    const mechanism = mechanismsById[selection.id];

    if (!mechanism) {
      return payload;
    }

    if (mechanismIds.includes(selection.id)) {
      mechanismIds = removeId(mechanismIds, selection.id);
      partInstanceIds = partInstanceIds.filter(
        (partInstanceId) => partInstancesById[partInstanceId]?.mechanismId !== selection.id,
      );
    } else {
      mechanismIds = uniqueIds([...mechanismIds, selection.id]);
      subsystemIds = uniqueIds([...subsystemIds, mechanism.subsystemId]);
    }
  }

  if (selection.kind === "part-instance") {
    const partInstance = partInstancesById[selection.id];

    if (!partInstance) {
      return payload;
    }

    if (partInstanceIds.includes(selection.id)) {
      partInstanceIds = removeId(partInstanceIds, selection.id);
    } else {
      partInstanceIds = uniqueIds([...partInstanceIds, selection.id]);
      subsystemIds = uniqueIds([...subsystemIds, partInstance.subsystemId]);

      if (partInstance.mechanismId) {
        mechanismIds = uniqueIds([...mechanismIds, partInstance.mechanismId]);
      }
    }
  }

  return normalizeTaskTargetPayload(payload, bootstrap, {
    subsystemIds,
    mechanismIds,
    partInstanceIds,
  });
}

export function buildEmptyTaskPayload(bootstrap: BootstrapPayload): TaskPayload {
  const firstProject = bootstrap.projects[0]?.id ?? "";
  const firstSubsystem = getDefaultSubsystemId(bootstrap);
  const firstDiscipline = getDefaultTaskDisciplineIdForProject(bootstrap.projects[0]);
  const firstMilestone = bootstrap.milestones[0]?.id ?? null;
  const firstStudent =
    bootstrap.members.find((m) => m.role === "lead")?.id ??
    bootstrap.members.find((m) => m.role === "student")?.id ??
    bootstrap.members[0]?.id ??
    null;
  const firstMentor =
    bootstrap.members.find((m) => m.role === "mentor")?.id ?? bootstrap.members[0]?.id ?? null;
  const today = localTodayDate();

  return {
    projectId: firstProject,
    workstreamId: null,
    workstreamIds: [],
    title: "",
    summary: "",
    photoUrl: "",
    subsystemId: firstSubsystem,
    subsystemIds: uniqueIds([firstSubsystem]),
    disciplineId: firstDiscipline,
    mechanismId: null,
    mechanismIds: [],
    partInstanceId: null,
    partInstanceIds: [],
    artifactId: null,
    artifactIds: [],
    targetRiskId: null,
    targetMilestoneId: firstMilestone,
    ownerId: firstStudent,
    assigneeIds: uniqueIds([firstStudent]),
    mentorId: firstMentor,
    startDate: today,
    dueDate: today,
    priority: "medium",
    status: "not-started",
    estimatedHours: 4,
    actualHours: 0,
    blockers: [],
    taskDependencies: [],
    taskBlockers: [],
    linkedManufacturingIds: [],
    linkedPurchaseIds: [],
    requiresDocumentation: false,
    documentationLinked: false,
  };
}

export const taskToPayload = (task: TaskRecord, bootstrap?: BootstrapPayload): TaskPayload => ({
  ...task,
  workstreamIds: task.workstreamIds?.length ? task.workstreamIds : uniqueIds([task.workstreamId]),
  subsystemIds: task.subsystemIds?.length ? task.subsystemIds : uniqueIds([task.subsystemId]),
  mechanismIds: task.mechanismIds?.length ? task.mechanismIds : uniqueIds([task.mechanismId]),
  partInstanceIds: task.partInstanceIds?.length ? task.partInstanceIds : uniqueIds([task.partInstanceId]),
  artifactId: task.artifactId ?? null,
  artifactIds: task.artifactIds?.length ? uniqueIds(task.artifactIds) : uniqueIds([task.artifactId]),
  targetRiskId: task.targetRiskId ?? null,
  photoUrl: task.photoUrl ?? "",
  assigneeIds: task.assigneeIds?.length ? uniqueIds(task.assigneeIds) : uniqueIds([task.ownerId]),
  blockers: task.blockers?.length ? uniqueIds(task.blockers) : [],
  taskBlockers: getTaskBlockerDrafts(task, bootstrap),
  taskDependencies: getTaskDependencyDrafts(task, bootstrap),
});
