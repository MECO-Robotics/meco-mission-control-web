import type { BootstrapPayload } from "@/types/bootstrap";

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
