import type { ProjectRecord, SeasonRecord, WorkstreamRecord } from "@/types/recordsOrganization";
import type { TaskDependencyRecord, TaskRecord } from "@/types/recordsExecution";
import { inferPlanningWindow, type LegacyBootstrapPayload } from "./shared";
import { normalizePlanningProjects } from "./planning-projects";
import { normalizePlanningWorkstreams } from "./planning-workstreams";

export interface NormalizedPlanningRecords {
  seasons: SeasonRecord[];
  projects: ProjectRecord[];
  workstreams: WorkstreamRecord[];
  tasks: TaskRecord[];
  taskDependencies: TaskDependencyRecord[];
  projectIdAliases: Map<string, string>;
}

export type { LegacyBootstrapPayload } from "./shared";

export function normalizePlanningRecords(source: LegacyBootstrapPayload): NormalizedPlanningRecords {
  const { startDate, endDate } = inferPlanningWindow(source);
  const planningProjects = normalizePlanningProjects(source, startDate, endDate);
  const planningWorkstreams = normalizePlanningWorkstreams(source, planningProjects, startDate);

  return {
    seasons: planningProjects.seasons,
    projects: planningProjects.projects,
    workstreams: planningWorkstreams.workstreams,
    tasks: planningWorkstreams.tasks,
    taskDependencies: planningWorkstreams.taskDependencies,
    projectIdAliases: planningProjects.projectIdAliases,
  };
}
