export type TaskTargetKind = "workstream" | "subsystem" | "mechanism" | "part-instance";

export interface TaskTargetSelection {
  kind: TaskTargetKind;
  id: string;
}
