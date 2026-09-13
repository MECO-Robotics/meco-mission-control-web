import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskTargetKind, TaskTargetSelection } from "@/types/taskTarget";
export type { TaskTargetKind, TaskTargetSelection };

export function getProjectTaskTargetLabel(
  project: Pick<BootstrapPayload["projects"][number], "projectType"> | null | undefined,
) {
  return project?.projectType === "robot" ? "Subsystems" : "Workstreams";
}
