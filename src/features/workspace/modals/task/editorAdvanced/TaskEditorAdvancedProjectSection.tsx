import type { Dispatch, SetStateAction } from "react";

import { getTaskDisciplinesForProject } from "@/lib/taskDisciplines";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskPayload } from "@/types/payloads";

interface TaskEditorAdvancedProjectSectionProps {
  availableDisciplines: ReturnType<typeof getTaskDisciplinesForProject>;
  handleProjectChange: (projectId: string) => void;
  projectsById: Record<string, BootstrapPayload["projects"][number]>;
  setTaskDraft: Dispatch<SetStateAction<TaskPayload>>;
  taskDraft: TaskPayload;
}

export function TaskEditorAdvancedProjectSection({
  availableDisciplines,
  handleProjectChange,
  projectsById,
  setTaskDraft,
  taskDraft,
}: TaskEditorAdvancedProjectSectionProps) {
  return (
    <>
      <label className="field">
        <span style={{ color: "var(--text-title)" }}>Project</span>
        <select
          onChange={(milestone) => handleProjectChange(milestone.target.value)}
          style={{
            background: "var(--bg-row-alt)",
            color: "var(--text-title)",
            border: "1px solid var(--border-base)",
          }}
          value={taskDraft.projectId}
        >
          {Object.values(projectsById).map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span style={{ color: "var(--text-title)" }}>Discipline</span>
        <select
          onChange={(milestone) =>
            setTaskDraft((current) => ({ ...current, disciplineId: milestone.target.value }))
          }
          style={{
            background: "var(--bg-row-alt)",
            color: "var(--text-title)",
            border: "1px solid var(--border-base)",
          }}
          value={taskDraft.disciplineId}
        >
          {availableDisciplines.map((discipline) => (
            <option key={discipline.id} value={discipline.id}>
              {discipline.name}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
