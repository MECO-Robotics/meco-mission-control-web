import type { ArtifactRecord } from "@/types/recordsInventory";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { MilestoneRecord, TaskBlockerRecord, TaskDependencyRecord, TaskRecord } from "@/types/recordsExecution";
import type { ProjectRecord } from "@/types/recordsOrganization";
import { localTodayDate } from "@/lib/dateUtils";

export const LEGACY_SEASON_ID = "season-default";
export const LEGACY_PROJECT_ID = "project-default";

export const REQUIRED_PROJECTS_PER_SEASON: Array<{
  key: "robot" | "media" | "outreach" | "operations" | "strategy" | "training";
  name: string;
  projectType: ProjectRecord["projectType"];
}> = [
  { key: "robot", name: "Robot", projectType: "robot" },
  { key: "media", name: "Media", projectType: "other" },
  { key: "outreach", name: "Outreach", projectType: "outreach" },
  { key: "operations", name: "Operations", projectType: "operations" },
  { key: "strategy", name: "Strategy", projectType: "other" },
  { key: "training", name: "Training", projectType: "other" },
];

export type ProjectBucket = (typeof REQUIRED_PROJECTS_PER_SEASON)[number]["key"];
export type NonRobotProjectBucket = Exclude<ProjectBucket, "robot">;

export type LegacyBootstrapPayload = Partial<
  Omit<BootstrapPayload, "artifacts" | "milestones" | "tasks">
> & {
  tasks?: Array<Partial<TaskRecord> & { requirementId?: string | null }>;
  artifacts?: Array<Partial<ArtifactRecord>>;
  milestones?: Array<Partial<MilestoneRecord>>;
  taskDependencies?: Array<
    Partial<TaskDependencyRecord> & {
      upstreamTaskId?: string;
      downstreamTaskId?: string;
    }
  >;
  taskBlockers?: Array<Partial<TaskBlockerRecord>>;
};

export function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function dateOnly(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const candidate = value.slice(0, 10);
  return isIsoDate(candidate) ? candidate : null;
}

export function toTitleFromId(value: string) {
  const normalized = value
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

  if (normalized.length === 0) {
    return "Default";
  }

  return normalized.replace(/\b([a-z])/g, (match) => match.toUpperCase());
}

export function toSlug(value: string) {
  const normalized = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized.length > 0 ? normalized : "project";
}

export function toNumberOrZero(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  return 0;
}

export function reserveUniqueId(candidate: string, fallback: string, usedIds: Set<string>) {
  const base = (candidate.trim().length > 0 ? candidate.trim() : fallback.trim()) || fallback;
  if (!usedIds.has(base)) {
    usedIds.add(base);
    return base;
  }

  let counter = 2;
  while (usedIds.has(`${base}-${counter}`)) {
    counter += 1;
  }

  const id = `${base}-${counter}`;
  usedIds.add(id);
  return id;
}

export function uniqueIds(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

export function getRequiredProjectTemplate(bucket: ProjectBucket) {
  return REQUIRED_PROJECTS_PER_SEASON.find((template) => template.key === bucket);
}

export function resolveProjectAlias(
  projectId: unknown,
  projectIds: Set<string>,
  projectIdAliases: Map<string, string>,
) {
  if (typeof projectId !== "string") {
    return null;
  }

  return projectIdAliases.get(projectId) ?? (projectIds.has(projectId) ? projectId : null);
}

export function classifyProjectBucket(project: Pick<ProjectRecord, "name" | "projectType">) {
  const name = project.name.toLowerCase();

  if (project.projectType === "robot" || /\brobot\b/.test(name)) {
    return "robot";
  }

  if (/\bmedia\b/.test(name)) {
    return "media";
  }

  if (project.projectType === "outreach" || /\boutreach\b/.test(name)) {
    return "outreach";
  }

  if (
    project.projectType === "operations" ||
    /\boperations?\b/.test(name) ||
    /\bbusiness\b/.test(name)
  ) {
    return "operations";
  }

  if (/\bstrategy\b/.test(name)) {
    return "strategy";
  }

  if (/\btraining\b/.test(name) || /\bscouting\b/.test(name)) {
    return "training";
  }

  return null;
}

export function inferPlanningWindow(source: Pick<LegacyBootstrapPayload, "tasks" | "milestones">) {
  const dates: string[] = [];
  const tasks = source.tasks ?? [];
  const milestones = source.milestones ?? [];

  tasks.forEach((task) => {
    if (isIsoDate(task.startDate)) {
      dates.push(task.startDate);
    }

    if (isIsoDate(task.dueDate)) {
      dates.push(task.dueDate);
    }
  });

  milestones.forEach((milestone) => {
    const milestoneStart = dateOnly(milestone.startDateTime);
    const milestoneEnd = dateOnly(milestone.endDateTime);

    if (milestoneStart) {
      dates.push(milestoneStart);
    }

    if (milestoneEnd) {
      dates.push(milestoneEnd);
    }
  });

  dates.sort((left, right) => left.localeCompare(right));

  const fallbackDate = localTodayDate();
  return {
    startDate: dates[0] ?? fallbackDate,
    endDate: dates[dates.length - 1] ?? dates[0] ?? fallbackDate,
  };
}
