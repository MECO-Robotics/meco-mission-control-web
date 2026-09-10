import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskPayload } from "@/types/payloads";
import { getDefaultTaskDisciplineIdForProject } from "@/lib/taskDisciplines";
import { localTodayDate } from "@/lib/dateUtils";
import { getDefaultSubsystemId } from "@/lib/appUtils/common";
import { uniqueIds } from "../internal";

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
    taskDependencies: [],
    taskBlockers: [],
    linkedManufacturingIds: [],
    linkedPurchaseIds: [],
    requiresDocumentation: false,
    documentationLinked: false,
  };
}
