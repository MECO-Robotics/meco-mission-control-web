import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskRecord } from "@/types/recordsExecution";

export function getTaskQaRequestBlockReason(
  task: TaskRecord,
  memberId: string | null,
  bootstrap: Pick<BootstrapPayload, "members" | "qaRequests">,
  acknowledgedTaskIds: readonly string[] = [],
) {
  if (!memberId || !task.assigneeIds.includes(memberId) && task.ownerId !== memberId) return "You must be assigned to this task to request QA.";
  const member = bootstrap.members.find((candidate) => candidate.id === memberId);
  if (!member || !(member.role === "student" || member.role === "lead")) return "Only assigned students and leads can request QA for this task.";
  if (task.status === "not-started") return "Start this task before requesting QA.";
  if (task.status === "unrecorded") return "Record task progress before requesting QA.";
  if (task.status === "complete") return "Completed tasks cannot request QA.";
  if (task.isBlocked || task.isWaitingOnDependency) return "Resolve this task’s blocker before requesting QA.";
  const existing = bootstrap.qaRequests.find((request) =>
    request.targetRefs.some((ref) => ref.kind === "task" && ref.id === task.id) &&
    (request.status === "requested" || request.status === "in-review"),
  );
  if (existing || acknowledgedTaskIds.includes(task.id) || task.status === "waiting-for-qa") return "QA has already been requested for this task.";
  const mentor = bootstrap.members.find((candidate) => candidate.id === task.mentorId && candidate.role === "mentor");
  if (!mentor) return "Assign an eligible mentor before requesting QA.";
  return null;
}
