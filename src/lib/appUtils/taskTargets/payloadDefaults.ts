import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskPayload } from "@/types/payloads/task";
import { getDefaultWorkTypeIdForProject } from "@/lib/taskDisciplines";
import { localTodayDate } from "@/lib/dateUtils";
import { getDefaultSubsystemId } from "@/lib/appUtils/common";
import { uniqueIds } from "../internal";

export function buildEmptyTaskPayload(bootstrap: BootstrapPayload): TaskPayload {
  const firstProject = bootstrap.projects[0]?.id ?? "";
  const firstProjectRecord = bootstrap.projects[0] ?? null;
  const firstWorkType = getDefaultWorkTypeIdForProject(bootstrap, firstProjectRecord);
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
    workstreamIds: [],
    title: "",
    summary: "",
    photoUrl: "",
    subsystemIds: firstProjectRecord?.projectType === "robot" ? uniqueIds([getDefaultSubsystemId(bootstrap)]) : [],
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
