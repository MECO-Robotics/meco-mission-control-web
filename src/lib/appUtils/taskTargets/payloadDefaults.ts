import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskPayload } from "@/types/payloads/task";
import { getDefaultWorkTypeIdForProject } from "@/lib/taskDisciplines";
import { localTodayDate } from "@/lib/dateUtils";
import { uniqueIds } from "../internal";

export function buildEmptyTaskPayload(bootstrap: BootstrapPayload, preferredProjectId?: string | null): TaskPayload {
  const firstProjectRecord = bootstrap.projects.find(({ id }) => id === preferredProjectId) ?? bootstrap.projects[0] ?? null;
  const firstProject = firstProjectRecord?.id ?? "";
  const firstWorkType = getDefaultWorkTypeIdForProject(bootstrap, firstProjectRecord);
  const firstStudent =
    bootstrap.members.find((m) => m.role === "lead")?.id ??
    bootstrap.members.find((m) => m.role === "student")?.id ??
    null;
  const firstMentor = bootstrap.members.find((m) => m.role === "mentor")?.id ?? null;
  const today = localTodayDate();

  return {
    projectId: firstProject,
    workstreamIds: [],
    title: "",
    summary: "",
    photoUrl: "",
    subsystemIds: firstProjectRecord?.projectType === "robot" ? uniqueIds([
      bootstrap.subsystems.find((item) => item.projectId === firstProject && item.isCore && !item.isArchived)?.id ??
      bootstrap.subsystems.find((item) => item.projectId === firstProject && !item.isArchived)?.id ??
      bootstrap.subsystems.find((item) => item.projectId === firstProject && item.isCore)?.id ??
      bootstrap.subsystems.find((item) => item.projectId === firstProject)?.id ??
      "",
    ]) : [],
    workTypeId: firstWorkType,
    responsibleGroupId: null,
    mechanismIds: [],
    partInstanceIds: [],
    scheduleRefs: [],
    requestedById: null,
    ownerId: firstStudent,
    assigneeIds: uniqueIds([firstStudent]),
    mentorId: firstMentor,
    startDate: today,
    dueDate: today,
    priority: "medium",
    status: "not-started",
    checklistItems: [],
    estimatedHours: 4,
    taskDependencies: [],
    manufacturingDetails: null,
    requiresDocumentation: false,
  };
}
