import type { CSSProperties } from "react";
import { Workflow } from "lucide-react";
import { IconSubsystems } from "@/components/shared/Icons";
import { getTaskQueueDisciplineIcon } from "./taskQueueDisciplineBadge";
import type { TaskQueueLaneLabel } from "./taskQueueSwimlanes";

export function TaskQueueSwimlaneLabel({ name, kind, code, accentColor }: TaskQueueLaneLabel) {
  const icon = kind === "team" ? getTaskQueueDisciplineIcon(code)
    : kind === "subsystem" ? <IconSubsystems /> : <Workflow size={14} />;
  return (
    <span className="task-queue-lane-label">
      <span aria-hidden="true" style={{ "--kanban-lane-accent": accentColor } as CSSProperties}>{icon}</span>
      {name}
    </span>
  );
}
