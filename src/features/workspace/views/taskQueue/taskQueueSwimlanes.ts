import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskRecord } from "@/types/recordsExecution";

export function groupTaskQueueSwimlanes(tasks: TaskRecord[], bootstrap: BootstrapPayload) {
  const projects = new Map<string, Map<string, TaskRecord[]>>();
  for (const task of tasks) {
    let disciplines = projects.get(task.projectId);
    if (!disciplines) {
      disciplines = new Map();
      projects.set(task.projectId, disciplines);
    }
    const group = disciplines.get(task.workTypeId);
    if (group) group.push(task);
    else disciplines.set(task.workTypeId, [task]);
  }

  const projectOrder = [...new Set([...bootstrap.projects.map(({ id }) => id), ...projects.keys()])];
  return projectOrder.flatMap((projectId) => {
    const disciplines = projects.get(projectId);
    if (!disciplines) return [];
    const disciplineOrder = [...new Set([...bootstrap.workTypes.map(({ id }) => id), ...disciplines.keys()])];
    const lanes = disciplineOrder.flatMap((disciplineId) => {
      const laneTasks = disciplines.get(disciplineId);
      if (!laneTasks) return [];
      return [{
        id: disciplineId,
        disciplineName: bootstrap.workTypes.find(({ id }) => id === disciplineId)?.name ?? (disciplineId ? "Unavailable discipline" : "Unassigned discipline"),
        tasks: laneTasks,
      }];
    });
    return [{
      id: projectId,
      projectName: bootstrap.projects.find(({ id }) => id === projectId)?.name ?? "Unavailable project",
      lanes,
    }];
  });
}
