import type {
  ArtifactRecord,
  BootstrapPayload,
  EventRecord,
  ProjectRecord,
  SeasonRecord,
  TaskBlockerRecord,
  TaskDependencyRecord,
  TaskRecord,
  WorkstreamRecord,
} from "@/types";
import { resolveWorkspaceColor } from "@/features/workspace/shared/workspaceColors";
import { localTodayDate } from "@/lib/dateUtils";

const LEGACY_SEASON_ID = "season-default";
const LEGACY_PROJECT_ID = "project-default";
const REQUIRED_PROJECTS_PER_SEASON: Array<{
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

type ProjectBucket = (typeof REQUIRED_PROJECTS_PER_SEASON)[number]["key"];
type NonRobotProjectBucket = Exclude<ProjectBucket, "robot">;

export type LegacyBootstrapPayload = Partial<
  Omit<BootstrapPayload, "artifacts" | "events" | "tasks">
> & {
  tasks?: Array<Partial<TaskRecord> & { requirementId?: string | null }>;
  artifacts?: Array<Partial<ArtifactRecord>>;
  events?: Array<Partial<EventRecord>>;
  taskDependencies?: Array<
    Partial<TaskDependencyRecord> & {
      upstreamTaskId?: string;
      downstreamTaskId?: string;
    }
  >;
  taskBlockers?: Array<Partial<TaskBlockerRecord>>;
};

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function dateOnly(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const candidate = value.slice(0, 10);
  return isIsoDate(candidate) ? candidate : null;
}

function toTitleFromId(value: string) {
  const normalized = value
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

  if (normalized.length === 0) {
    return "Default";
  }

  return normalized.replace(/\b([a-z])/g, (match) => match.toUpperCase());
}

function toSlug(value: string) {
  const normalized = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized.length > 0 ? normalized : "project";
}

function toNumberOrZero(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  return 0;
}

function reserveUniqueId(candidate: string, fallback: string, usedIds: Set<string>) {
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

function uniqueIds(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function getRequiredProjectTemplate(bucket: ProjectBucket) {
  return REQUIRED_PROJECTS_PER_SEASON.find((template) => template.key === bucket);
}

function resolveProjectAlias(
  projectId: unknown,
  projectIds: Set<string>,
  projectIdAliases: Map<string, string>,
) {
  if (typeof projectId !== "string") {
    return null;
  }

  return projectIdAliases.get(projectId) ?? (projectIds.has(projectId) ? projectId : null);
}

function classifyProjectBucket(project: Pick<ProjectRecord, "name" | "projectType">) {
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

function inferPlanningWindow(source: LegacyBootstrapPayload) {
  const dates: string[] = [];
  const tasks = source.tasks ?? [];
  const events = source.events ?? [];

  tasks.forEach((task) => {
    if (isIsoDate(task.startDate)) {
      dates.push(task.startDate);
    }

    if (isIsoDate(task.dueDate)) {
      dates.push(task.dueDate);
    }
  });

  events.forEach((event) => {
    const eventStart = dateOnly(event.startDateTime);
    const eventEnd = dateOnly(event.endDateTime);

    if (eventStart) {
      dates.push(eventStart);
    }

    if (eventEnd) {
      dates.push(eventEnd);
    }
  });

  dates.sort((left, right) => left.localeCompare(right));

  const fallbackDate = localTodayDate();
  return {
    startDate: dates[0] ?? fallbackDate,
    endDate: dates[dates.length - 1] ?? dates[0] ?? fallbackDate,
  };
}

export function normalizePlanningRecords(source: LegacyBootstrapPayload) {
  const sourceTasks = source.tasks ?? [];
  const sourceSeasons = source.seasons ?? [];
  const sourceProjects = source.projects ?? [];
  const sourceWorkstreams = source.workstreams ?? [];
  const sourceSubsystems = source.subsystems ?? [];
  const sourceDisciplines = source.disciplines ?? [];
  const { startDate, endDate } = inferPlanningWindow(source);

  let seasons: SeasonRecord[] = sourceSeasons;
  if (seasons.length === 0) {
    const seasonIdsFromProjects = Array.from(
      new Set(
        sourceProjects
          .map((project) => project.seasonId)
          .filter(
            (seasonId): seasonId is string =>
              typeof seasonId === "string" && seasonId.length > 0,
          ),
      ),
    );
    const seasonIds =
      seasonIdsFromProjects.length > 0 ? seasonIdsFromProjects : [LEGACY_SEASON_ID];

    seasons = seasonIds.map((seasonId) => ({
      id: seasonId,
      name: seasonIdsFromProjects.length > 0 ? toTitleFromId(seasonId) : "Tutorial season",
      type: "season",
      startDate,
      endDate,
    }));
  }
  const defaultSeasonId = seasons[0]?.id ?? LEGACY_SEASON_ID;

  const usedProjectIds = new Set<string>();
  const projectIdAliases = new Map<string, string>();
  const nonRobotProjectsBySeason = new Map<string, Map<NonRobotProjectBucket, string>>();
  const projects: ProjectRecord[] = [];

  sourceProjects.forEach((project, index) => {
    const originalProjectId = project.id;
    const projectId = reserveUniqueId(
      originalProjectId ?? "",
      `project-${index + 1}`,
      usedProjectIds,
    );
    const seasonId = seasons.some((season) => season.id === project.seasonId)
      ? project.seasonId
      : defaultSeasonId;
    const projectName = project.name ?? `Project ${index + 1}`;
    const projectType = project.projectType ?? "robot";
    const bucket = classifyProjectBucket({
      name: projectName,
      projectType,
    });

    if (bucket === "robot") {
      projectIdAliases.set(projectId, projectId);
      if (originalProjectId) {
        projectIdAliases.set(originalProjectId, projectId);
      }

      projects.push({
        id: projectId,
        seasonId,
        name: projectName,
        projectType,
        description: project.description ?? "",
        status: project.status ?? "active",
      });
      return;
    }

    const canonicalBucket: NonRobotProjectBucket = bucket ?? "strategy";
    const seasonProjects =
      nonRobotProjectsBySeason.get(seasonId) ?? new Map<NonRobotProjectBucket, string>();
    nonRobotProjectsBySeason.set(seasonId, seasonProjects);

    const existingProjectId = seasonProjects.get(canonicalBucket);
    if (existingProjectId) {
      projectIdAliases.set(projectId, existingProjectId);
      if (originalProjectId) {
        projectIdAliases.set(originalProjectId, existingProjectId);
      }
      return;
    }

    const template = getRequiredProjectTemplate(canonicalBucket);
    if (!template) {
      return;
    }

    seasonProjects.set(canonicalBucket, projectId);
    projectIdAliases.set(projectId, projectId);
    if (originalProjectId) {
      projectIdAliases.set(originalProjectId, projectId);
    }

    projects.push({
      id: projectId,
      seasonId,
      name: template.name,
      projectType: template.projectType,
      description:
        project.description ?? `${template.name} scope for ${toTitleFromId(seasonId)}.`,
      status: project.status ?? "active",
    });
  });

  seasons.forEach((season) => {
    const existingBuckets = new Set(
      projects
        .filter((project) => project.seasonId === season.id)
        .map((project) => classifyProjectBucket(project))
        .filter(
          (bucket): bucket is NonNullable<ReturnType<typeof classifyProjectBucket>> =>
            bucket !== null,
        ),
    );

    REQUIRED_PROJECTS_PER_SEASON.forEach((template) => {
      if (existingBuckets.has(template.key)) {
        return;
      }

      const generatedId = reserveUniqueId(
        `${toSlug(season.id)}-${template.key}`,
        `${LEGACY_PROJECT_ID}-${template.key}`,
        usedProjectIds,
      );

      projects.push({
        id: generatedId,
        seasonId: season.id,
        name: template.name,
        projectType: template.projectType,
        description: `${template.name} scope for ${season.name}.`,
        status: "active",
      });
    });
  });

  const projectIds = new Set(projects.map((project) => project.id));
  const defaultProjectId =
    projects.find(
      (project) =>
        project.seasonId === defaultSeasonId &&
        classifyProjectBucket(project) === "robot",
    )?.id ?? projects[0]?.id ?? LEGACY_PROJECT_ID;
  const subsystemById = new Map(sourceSubsystems.map((subsystem) => [subsystem.id, subsystem]));
  const inferredWorkstreamBySubsystemId = new Map<string, string>();

  let workstreams: WorkstreamRecord[] = sourceWorkstreams.map((workstream, index) => ({
    id: workstream.id ?? `workstream-${index + 1}`,
    projectId:
      resolveProjectAlias(workstream.projectId, projectIds, projectIdAliases) ?? defaultProjectId,
    name: workstream.name ?? `Workstream ${index + 1}`,
    color: resolveWorkspaceColor(
      workstream.color,
      `${workstream.projectId ?? defaultProjectId}:${workstream.id ?? workstream.name ?? index}`,
      index,
    ),
    description: workstream.description ?? "",
    isArchived: workstream.isArchived ?? false,
  }));

  if (workstreams.length === 0) {
    const subsystemIds = Array.from(
      new Set([
        ...sourceSubsystems.map((subsystem) => subsystem.id),
        ...sourceTasks
          .map((task) => task.subsystemId)
          .filter(
            (subsystemId): subsystemId is string =>
              typeof subsystemId === "string" && subsystemId.length > 0,
          ),
      ]),
    );

    workstreams = subsystemIds.map((subsystemId, index) => {
      const subsystem = subsystemById.get(subsystemId);
      const workstreamId = `workstream-${subsystemId}`;
      inferredWorkstreamBySubsystemId.set(subsystemId, workstreamId);

      return {
        id: workstreamId,
        projectId: defaultProjectId,
        name: subsystem?.name ?? `Workstream ${index + 1}`,
        color: resolveWorkspaceColor(
          subsystem?.color,
          `${defaultProjectId}:${subsystemId}:${subsystem?.name ?? index}`,
          index,
        ),
        description: subsystem?.description ?? "",
        isArchived: false,
      };
    });
  } else {
    sourceSubsystems.forEach((subsystem) => {
      const matchingWorkstream = workstreams.find(
        (workstream) => workstream.name.toLowerCase() === subsystem.name.toLowerCase(),
      );

      if (matchingWorkstream) {
        inferredWorkstreamBySubsystemId.set(subsystem.id, matchingWorkstream.id);
      }
    });
  }

  const workstreamIds = new Set(workstreams.map((workstream) => workstream.id));
  const defaultSubsystemId = sourceSubsystems[0]?.id ?? "";
  const defaultDisciplineId = sourceDisciplines[0]?.id ?? "";

  const tasks: TaskRecord[] = sourceTasks.map((task, index) => {
    const taskProjectId =
      resolveProjectAlias(task.projectId, projectIds, projectIdAliases) ?? defaultProjectId;
    const taskSubsystemId =
      typeof task.subsystemId === "string" && task.subsystemId.length > 0
        ? task.subsystemId
        : defaultSubsystemId;
    const inferredWorkstreamId = taskSubsystemId
      ? inferredWorkstreamBySubsystemId.get(taskSubsystemId) ?? null
      : null;
    const taskWorkstreamId =
      typeof task.workstreamId === "string" && workstreamIds.has(task.workstreamId)
        ? task.workstreamId
        : inferredWorkstreamId;
    const taskWorkstreamIds =
      Array.isArray(task.workstreamIds) && task.workstreamIds.length > 0
        ? uniqueIds(task.workstreamIds.filter((workstreamId) => workstreamIds.has(workstreamId)))
        : uniqueIds([taskWorkstreamId]);
    const taskStartDate = isIsoDate(task.startDate) ? task.startDate : startDate;
    const taskDueDate = isIsoDate(task.dueDate) ? task.dueDate : taskStartDate;
    const taskMechanismIds = Array.isArray(task.mechanismIds)
      ? uniqueIds(task.mechanismIds)
      : uniqueIds([task.mechanismId]);
    const taskPartInstanceIds = Array.isArray(task.partInstanceIds)
      ? uniqueIds(task.partInstanceIds)
      : uniqueIds([task.partInstanceId]);
    const taskArtifactIds = Array.isArray(task.artifactIds)
      ? uniqueIds(task.artifactIds)
      : uniqueIds([task.artifactId]);
    const taskAssigneeIds = Array.isArray(task.assigneeIds)
      ? uniqueIds(task.assigneeIds)
      : uniqueIds([task.ownerId]);

    return {
      id: task.id ?? `task-${index + 1}`,
      projectId: taskProjectId,
      workstreamId: taskWorkstreamId,
      workstreamIds: taskWorkstreamIds,
      title: task.title ?? "Untitled task",
      summary: task.summary ?? "",
      subsystemId: taskSubsystemId,
      subsystemIds:
        Array.isArray(task.subsystemIds) && task.subsystemIds.length > 0
          ? uniqueIds(task.subsystemIds)
          : uniqueIds([taskSubsystemId]),
      disciplineId: task.disciplineId ?? defaultDisciplineId,
      mechanismId: taskMechanismIds[0] ?? null,
      mechanismIds: taskMechanismIds,
      partInstanceId: taskPartInstanceIds[0] ?? null,
      partInstanceIds: taskPartInstanceIds,
      artifactId: taskArtifactIds[0] ?? null,
      artifactIds: taskArtifactIds,
      targetEventId: task.targetEventId ?? null,
      ownerId: task.ownerId ?? null,
      assigneeIds: taskAssigneeIds,
      mentorId: task.mentorId ?? null,
      startDate: taskStartDate,
      dueDate: taskDueDate,
      priority: task.priority ?? "medium",
      status: task.status ?? "not-started",
      dependencyIds: task.dependencyIds ?? [],
      blockers: task.blockers ?? [],
      isBlocked: (task.blockers ?? []).length > 0,
      linkedManufacturingIds: task.linkedManufacturingIds ?? [],
      linkedPurchaseIds: task.linkedPurchaseIds ?? [],
      estimatedHours: toNumberOrZero(task.estimatedHours),
      actualHours: toNumberOrZero(task.actualHours),
      requiresDocumentation: task.requiresDocumentation ?? false,
      documentationLinked: task.documentationLinked ?? false,
    };
  });

  const normalizedDependencies = (source.taskDependencies ?? []).map((dependency, index) => {
    const dependencyRecord = dependency as {
      id?: string;
      kind?: "task" | "milestone" | "part_instance" | "event";
      refId?: string;
      taskId?: string;
      upstreamTaskId?: string;
      downstreamTaskId?: string;
      requiredState?: string;
      dependencyType?: "hard" | "soft" | "blocks" | "finish_to_start";
      createdAt?: string;
    };
    const kind = dependencyRecord.kind ?? "task";
    const dependencyType = dependencyRecord.dependencyType === "soft" ? "soft" : "hard";
    const refId = dependencyRecord.refId ?? dependencyRecord.upstreamTaskId ?? "";
    const taskId = dependencyRecord.taskId ?? dependencyRecord.downstreamTaskId ?? "";

    return {
      id: dependencyRecord.id ?? `task-dependency-${index + 1}`,
      taskId,
      kind,
      refId,
      requiredState:
        dependencyRecord.requiredState ??
        (kind === "part_instance" ? "available" : "complete"),
      dependencyType,
      createdAt: dependencyRecord.createdAt ?? new Date().toISOString(),
    };
  });

  const dependencyIdsByTaskId = new Map<string, string[]>();
  normalizedDependencies.forEach((dependency) => {
    if (dependency.kind !== "task" || dependency.dependencyType === "soft" || !dependency.taskId) {
      return;
    }

    const current = dependencyIdsByTaskId.get(dependency.taskId) ?? [];
    current.push(dependency.refId);
    dependencyIdsByTaskId.set(dependency.taskId, current);
  });

  const blockerDescriptionsByTaskId = new Map<string, string[]>();
  (source.taskBlockers ?? []).forEach((blocker) => {
    if (blocker.status === "resolved" || !blocker.blockedTaskId) {
      return;
    }

    const current = blockerDescriptionsByTaskId.get(blocker.blockedTaskId) ?? [];
    current.push(blocker.description ?? "");
    blockerDescriptionsByTaskId.set(blocker.blockedTaskId, current);
  });

  const normalizedTasks = tasks.map((task) => {
    const dependencyIds =
      task.dependencyIds.length > 0
        ? uniqueIds(task.dependencyIds)
        : dependencyIdsByTaskId.get(task.id) ?? [];
    const blockers =
      task.blockers.length > 0
        ? uniqueIds(task.blockers)
        : blockerDescriptionsByTaskId.get(task.id) ?? [];

    return {
      ...task,
      dependencyIds,
      blockers,
      isBlocked: blockers.length > 0,
    };
  });

  return {
    seasons,
    projects,
    workstreams,
    tasks: normalizedTasks,
    taskDependencies: normalizedDependencies,
    projectIdAliases,
  };
}
