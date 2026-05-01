import type {
  ArtifactPayload,
  ArtifactRecord,
  BootstrapPayload,
  EventPayload,
  EventRecord,
  ManufacturingItemPayload,
  ManufacturingItemRecord,
  MaterialPayload,
  MaterialRecord,
  MechanismPayload,
  MechanismRecord,
  MemberCreatePayload,
  MemberPayload,
  MemberRecord,
  PartDefinitionPayload,
  PartDefinitionRecord,
  PartInstancePayload,
  PartInstanceRecord,
  ProjectCreatePayload,
  ProjectPayload,
  ProjectRecord,
  PurchaseItemPayload,
  PurchaseItemRecord,
  ReportFindingPayload,
  ReportFindingRecord,
  ReportPayload,
  ReportRecord,
  QaReportPayload,
  RiskPayload,
  RiskRecord,
  SeasonCreatePayload,
  SeasonRecord,
  SubsystemPayload,
  SubsystemRecord,
  TaskPayload,
  TaskBlockerPayload,
  TaskBlockerRecord,
  TaskDependencyPayload,
  TaskDependencyRecord,
  TaskRecord,
  TestResultPayload,
  WorkLogPayload,
  WorkLogRecord,
  WorkstreamPayload,
  WorkstreamRecord,
} from "@/types";
import { resolveWorkspaceColor } from "@/features/workspace/shared/workspaceColors";
import { localTodayDate } from "@/lib/dateUtils";

const DEFAULT_API_BASE_URL = "/api";
const SESSION_STORAGE_KEY = "meco.session.token";

const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL
).replace(/\/+$/, "");

export interface AuthConfig {
  enabled: boolean;
  googleClientId: string | null;
  hostedDomain: string;
  emailEnabled: boolean;
  devBypassAvailable: boolean;
}

export interface SessionUser {
  accountId: string;
  authProvider: "google" | "email";
  email: string;
  name: string;
  picture: string | null;
  hostedDomain: string;
}

export interface SessionResponse {
  token: string;
  user: SessionUser;
}

export interface EmailCodeDeliveryResponse {
  sentTo: string;
  expiresInMinutes: number;
}

export interface GoogleCredentialResponse {
  credential?: string;
}

export interface MediaUploadResponse {
  expiresInSeconds: number;
  headers: Record<string, string>;
  key: string;
  method: "PUT";
  publicUrl: string;
  uploadUrl: string;
}

class ApiError extends Error {
  readonly statusCode: number;

  constructor(
    message: string,
    statusCode: number,
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}

let googleScriptPromise: Promise<void> | null = null;

type GoogleTrustedTypesPolicy = {
  createScriptURL: (value: string) => string;
};

type WindowWithGoogleTrustedTypesPolicy = Window & {
  trustedTypes?: {
    createPolicy: (
      name: string,
      rules: {
        createScriptURL: (value: string) => string;
      },
    ) => GoogleTrustedTypesPolicy;
  };
  __mecoGoogleTrustedTypesPolicy?: GoogleTrustedTypesPolicy;
};

function isLocalHostname(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1"
  );
}

function readLocalGoogleClientIdOverride() {
  if (!import.meta.env.DEV || typeof window === "undefined") {
    return null;
  }

  if (!isLocalHostname(window.location.hostname)) {
    return null;
  }

  const override = import.meta.env.VITE_LOCAL_GOOGLE_CLIENT_ID?.trim();
  return override ? override : null;
}

export function isSecureGoogleAuthHost() {
  if (typeof window === "undefined") {
    return false;
  }

  return isLocalHostname(window.location.hostname) || window.location.protocol === "https:";
}

function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${apiBaseUrl}${normalizedPath}`;
}

function getGoogleTrustedTypesPolicy() {
  if (typeof window === "undefined") {
    return null;
  }

  const targetWindow = window as WindowWithGoogleTrustedTypesPolicy;
  if (!targetWindow.trustedTypes) {
    return null;
  }

  if (!targetWindow.__mecoGoogleTrustedTypesPolicy) {
    targetWindow.__mecoGoogleTrustedTypesPolicy = targetWindow.trustedTypes.createPolicy(
      "meco-web-google",
      {
        createScriptURL: (value: string) => value,
      },
    );
  }

  return targetWindow.__mecoGoogleTrustedTypesPolicy;
}

async function readJson<T>(response: Response): Promise<T> {
  const rawBody = await response.text().catch(() => "");
  let payload: { message?: string } | null = null;

  if (rawBody) {
    try {
      payload = JSON.parse(rawBody) as { message?: string };
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const statusText = response.statusText ? `: ${response.statusText}` : "";
    const textMessage = rawBody.trim();
    const fallbackMessage =
      payload?.message ??
      (textMessage.length > 0 ? textMessage : null) ??
      `Server Error (${response.status})${statusText}`;
    throw new ApiError(
      fallbackMessage,
      response.status,
    );
  }

  if (payload === null) {
    throw new ApiError(
      "The server returned an empty or invalid response.",
      502,
    );
  }

  return payload as T;
}

async function requestApi<T>(
  path: string,
  options: RequestInit = {},
  onUnauthorized?: () => void,
) {
  const token = loadStoredSessionToken();
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers,
  });

  try {
    return await readJson<T>(response);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 401) {
      clearStoredSessionToken();
      onUnauthorized?.();
    }
    throw error;
  }
}

async function postJson<T>(path: string, body: unknown) {
  const response = await fetch(buildApiUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return readJson<T>(response);
}

async function requestUpload(
  endpoint: string,
  failureMessage: string,
  projectId: string,
  file: File,
  onUnauthorized?: () => void,
) {
  const presignedUpload = await requestApi<MediaUploadResponse>(
    endpoint,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectId,
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
      }),
    },
    onUnauthorized,
  );

  const uploadResponse = await fetch(presignedUpload.uploadUrl, {
    method: presignedUpload.method,
    headers: presignedUpload.headers,
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new ApiError(failureMessage, uploadResponse.status);
  }

  return presignedUpload.publicUrl;
}

export async function requestImageUpload(
  projectId: string,
  file: File,
  onUnauthorized?: () => void,
) {
  return requestUpload("/media/presign-upload", "Photo upload failed unexpectedly.", projectId, file, onUnauthorized);
}

export async function requestVideoUpload(
  projectId: string,
  file: File,
  onUnauthorized?: () => void,
) {
  return requestUpload("/media/presign-video-upload", "Video upload failed unexpectedly.", projectId, file, onUnauthorized);
}

function isAuthConfig(payload: unknown): payload is AuthConfig {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const candidate = payload as Record<string, unknown>;
  return (
    typeof candidate.enabled === "boolean" &&
    (typeof candidate.googleClientId === "string" ||
      candidate.googleClientId === null) &&
    typeof candidate.hostedDomain === "string" &&
    typeof candidate.emailEnabled === "boolean" &&
    (candidate.devBypassAvailable === undefined ||
      typeof candidate.devBypassAvailable === "boolean")
  );
}

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

type LegacyBootstrapPayload = Partial<Omit<BootstrapPayload, "artifacts" | "events" | "tasks">> & {
  tasks?: Array<Partial<TaskRecord> & { requirementId?: string | null }>;
  artifacts?: Array<Partial<ArtifactRecord>>;
  events?: Array<Partial<EventRecord>>;
  taskDependencies?: Array<Partial<TaskDependencyRecord>>;
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

function isArtifactKind(value: unknown): value is ArtifactRecord["kind"] {
  return value === "document" || value === "nontechnical";
}

function isArtifactStatus(value: unknown): value is ArtifactRecord["status"] {
  return value === "draft" || value === "in-review" || value === "published";
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
  return Array.from(
    new Set(values.filter((value): value is string => Boolean(value))),
  );
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

function normalizePlanningRecords(source: LegacyBootstrapPayload) {
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
          .filter((seasonId): seasonId is string => typeof seasonId === "string" && seasonId.length > 0),
      ),
    );
    const seasonIds = seasonIdsFromProjects.length > 0 ? seasonIdsFromProjects : [LEGACY_SEASON_ID];

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
      description: project.description ?? `${template.name} scope for ${toTitleFromId(seasonId)}.`,
      status: project.status ?? "active",
    });
  });

  seasons.forEach((season) => {
    const existingBuckets = new Set(
      projects
        .filter((project) => project.seasonId === season.id)
        .map((project) => classifyProjectBucket(project))
        .filter((bucket): bucket is NonNullable<ReturnType<typeof classifyProjectBucket>> => bucket !== null),
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
    )?.id ??
    projects[0]?.id ??
    LEGACY_PROJECT_ID;
  const subsystemById = new Map(sourceSubsystems.map((subsystem) => [subsystem.id, subsystem]));
  const inferredWorkstreamBySubsystemId = new Map<string, string>();

  let workstreams: WorkstreamRecord[] = sourceWorkstreams.map((workstream, index) => ({
    id: workstream.id ?? `workstream-${index + 1}`,
    projectId:
      resolveProjectAlias(workstream.projectId, projectIds, projectIdAliases) ??
      defaultProjectId,
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
      new Set(
        [
          ...sourceSubsystems.map((subsystem) => subsystem.id),
          ...sourceTasks
            .map((task) => task.subsystemId)
            .filter((subsystemId): subsystemId is string => typeof subsystemId === "string" && subsystemId.length > 0),
        ],
      ),
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
        ? task.workstreamIds.filter((workstreamId) => workstreamIds.has(workstreamId))
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
      linkedManufacturingIds: task.linkedManufacturingIds ?? [],
      linkedPurchaseIds: task.linkedPurchaseIds ?? [],
      estimatedHours: toNumberOrZero(task.estimatedHours),
      actualHours: toNumberOrZero(task.actualHours),
      requiresDocumentation: task.requiresDocumentation ?? false,
      documentationLinked: task.documentationLinked ?? false,
    };
  });
  const dependencyIdsByTaskId = new Map<string, string[]>();
  (source.taskDependencies ?? []).forEach((dependency) => {
    if (dependency.dependencyType === "soft") {
      return;
    }

    const downstreamTaskId = dependency.downstreamTaskId;
    if (!downstreamTaskId) {
      return;
    }

    const current = dependencyIdsByTaskId.get(downstreamTaskId) ?? [];
    current.push(dependency.upstreamTaskId ?? "");
    dependencyIdsByTaskId.set(downstreamTaskId, current);
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
  const normalizedTasks = tasks.map((task) => ({
    ...task,
    dependencyIds:
      task.dependencyIds.length > 0 ? uniqueIds(task.dependencyIds) : dependencyIdsByTaskId.get(task.id) ?? [],
    blockers:
      task.blockers.length > 0 ? uniqueIds(task.blockers) : blockerDescriptionsByTaskId.get(task.id) ?? [],
  }));

  return {
    seasons,
    projects,
    workstreams,
    tasks: normalizedTasks,
    projectIdAliases,
  };
}

function normalizeBootstrapPayload(payload: BootstrapPayload): BootstrapPayload {
  const source = payload as LegacyBootstrapPayload;
  const planning = normalizePlanningRecords(source);
  const defaultSeasonId = planning.seasons[0]?.id ?? LEGACY_SEASON_ID;
  const defaultProjectId = planning.projects[0]?.id ?? LEGACY_PROJECT_ID;
  const projectIds = new Set(planning.projects.map((project) => project.id));
  const workstreamsById = new Map(
    planning.workstreams.map((workstream) => [workstream.id, workstream] as const),
  );
  const artifacts: ArtifactRecord[] = (source.artifacts ?? []).map((artifact, index) => {
    const projectId =
      resolveProjectAlias(artifact.projectId, projectIds, planning.projectIdAliases) ??
      defaultProjectId;
    const requestedWorkstreamId =
      typeof artifact.workstreamId === "string" && artifact.workstreamId.trim().length > 0
        ? artifact.workstreamId
        : null;
    const workstream = requestedWorkstreamId
      ? workstreamsById.get(requestedWorkstreamId)
      : null;
    const workstreamId =
      workstream && workstream.projectId === projectId ? workstream.id : null;

    return {
      id: artifact.id ?? `artifact-${index + 1}`,
      projectId,
      workstreamId,
      kind: isArtifactKind(artifact.kind) ? artifact.kind : "document",
      title: artifact.title ?? `Artifact ${index + 1}`,
      summary: artifact.summary ?? "",
      status: isArtifactStatus(artifact.status) ? artifact.status : "draft",
      link: artifact.link ?? "",
      isArchived: artifact.isArchived ?? false,
      updatedAt:
        typeof artifact.updatedAt === "string" && artifact.updatedAt.trim().length > 0
          ? artifact.updatedAt
          : new Date().toISOString(),
    };
  });
  const subsystems: SubsystemRecord[] = (source.subsystems ?? []).map((subsystem) => ({
    ...subsystem,
    color: resolveWorkspaceColor(
      subsystem.color,
      `${subsystem.projectId ?? defaultProjectId}:${subsystem.id}:${subsystem.name}`,
      subsystem.iteration ?? 0,
    ),
    isArchived: subsystem.isArchived ?? false,
    projectId:
      resolveProjectAlias(subsystem.projectId, projectIds, planning.projectIdAliases) ??
      defaultProjectId,
  }));
  const subsystemProjectIdsById = new Map(
    subsystems.map((subsystem) => [subsystem.id, subsystem.projectId] as const),
  );
  const events: EventRecord[] = (source.events ?? []).map((event, index) => {
    const relatedSubsystemIds = Array.isArray(event.relatedSubsystemIds)
      ? uniqueIds(event.relatedSubsystemIds)
      : [];
    const explicitProjectIds = Array.isArray(event.projectIds)
      ? uniqueIds(
          event.projectIds.map((projectId) =>
            resolveProjectAlias(projectId, projectIds, planning.projectIdAliases),
          ),
        )
      : [];
    const inferredProjectIds = uniqueIds(
      relatedSubsystemIds.map((subsystemId) => subsystemProjectIdsById.get(subsystemId)),
    );
    const fallbackEventDate =
      planning.seasons[0]?.startDate ?? localTodayDate();

    return {
      id: event.id ?? `event-${index + 1}`,
      title: event.title ?? `Event ${index + 1}`,
      type: event.type ?? "internal-review",
      startDateTime: event.startDateTime ?? `${fallbackEventDate}T12:00:00`,
      endDateTime: event.endDateTime ?? null,
      isExternal: event.isExternal ?? false,
      description: event.description ?? "",
      projectIds: explicitProjectIds.length > 0 ? explicitProjectIds : inferredProjectIds,
      relatedSubsystemIds,
    };
  });
  const reports: ReportRecord[] = (Array.isArray(source.reports) && source.reports.length > 0
    ? source.reports
    : [
        ...(source.qaReports ?? []).map<ReportRecord>((report) => ({
          ...report,
          reportType: "QA",
          projectId:
            resolveProjectAlias(report.projectId, projectIds, planning.projectIdAliases) ??
            defaultProjectId,
          taskId: report.taskId ?? null,
          eventId: null,
          workstreamId: report.workstreamId ?? null,
          createdByMemberId: report.createdByMemberId ?? null,
          result: report.result ?? "pass",
          summary: report.summary ?? report.notes ?? "",
          notes: report.notes ?? "",
          createdAt: report.createdAt ?? report.reviewedAt ?? localTodayDate(),
        })),
        ...(source.testResults ?? []).map<ReportRecord>((result) => ({
          ...result,
          reportType: "EventTest",
          projectId:
            resolveProjectAlias(result.projectId, projectIds, planning.projectIdAliases) ??
            defaultProjectId,
          taskId: result.taskId ?? null,
          eventId: result.eventId ?? null,
          workstreamId: result.workstreamId ?? null,
          createdByMemberId: result.createdByMemberId ?? null,
          result: result.result ?? result.status ?? "pass",
          summary: result.summary ?? result.title ?? "",
          notes: result.notes ?? result.findings?.join("\n") ?? "",
          createdAt: result.createdAt ?? localTodayDate(),
          title: result.title ?? "",
          status: result.status ?? "pass",
          findings: result.findings ?? [],
        })),
      ]
  ).map((report) => ({
    ...report,
    reportType:
      report.reportType === "QA" ||
      report.reportType === "EventTest" ||
      report.reportType === "Practice" ||
      report.reportType === "Competition" ||
      report.reportType === "Review"
        ? report.reportType
        : "QA",
    taskId: report.taskId ?? null,
    eventId: report.eventId ?? null,
    workstreamId: report.workstreamId ?? null,
    createdByMemberId: report.createdByMemberId ?? null,
    result: report.result ?? "pass",
    summary: report.summary ?? "",
    notes: report.notes ?? "",
    createdAt: report.createdAt ?? localTodayDate(),
  }));

  const reportsById = new Map(reports.map((report) => [report.id, report] as const));
  const reportFindings: ReportFindingRecord[] = (
    Array.isArray(source.reportFindings) && source.reportFindings.length > 0
      ? source.reportFindings
      : [
          ...(source.qaFindings ?? []).map<ReportFindingRecord>((finding) => ({
            ...finding,
            reportId: finding.qaReportId ?? "",
            mechanismId: null,
            partInstanceId: null,
            artifactInstanceId: null,
            issueType: finding.title ?? "",
            severity: finding.severity ?? "low",
            notes: finding.detail ?? "",
            spawnedTaskId: finding.taskId ?? null,
            spawnedIterationId: null,
            spawnedRiskId: null,
          })),
          ...(source.testFindings ?? []).map<ReportFindingRecord>((finding) => ({
            ...finding,
            reportId: finding.testResultId ?? "",
            mechanismId: null,
            partInstanceId: null,
            artifactInstanceId: null,
            issueType: finding.title ?? "",
            severity: finding.severity ?? "low",
            notes: finding.detail ?? "",
            spawnedTaskId: finding.taskId ?? null,
            spawnedIterationId: null,
            spawnedRiskId: null,
          })),
        ]
  ).map((finding) => ({
    ...finding,
    mechanismId: finding.mechanismId ?? null,
    partInstanceId: finding.partInstanceId ?? null,
    artifactInstanceId: finding.artifactInstanceId ?? null,
    issueType: finding.issueType ?? finding.title ?? "",
    severity: finding.severity ?? "low",
    notes: finding.notes ?? finding.detail ?? "",
    spawnedTaskId: finding.spawnedTaskId ?? null,
    spawnedIterationId: finding.spawnedIterationId ?? null,
    spawnedRiskId: finding.spawnedRiskId ?? null,
  }));

  const qaReports = reports.filter((report) => report.reportType === "QA");
  const testResults = reports.filter((report) => report.reportType !== "QA");
  const qaFindings = reportFindings
    .filter((finding) => {
      const report = reportsById.get(finding.reportId);
      return report?.reportType === "QA";
    })
    .map((finding) => {
      const report = reportsById.get(finding.reportId);
      return {
        id: finding.id,
        qaReportId: finding.reportId || null,
        taskId: finding.taskId ?? report?.taskId ?? null,
        projectId: finding.projectId ?? report?.projectId ?? defaultProjectId,
        workstreamId: finding.workstreamId ?? report?.workstreamId ?? null,
        subsystemId: finding.subsystemId ?? null,
        mechanismId: finding.mechanismId ?? null,
        partInstanceId: finding.partInstanceId ?? null,
        artifactId: finding.artifactInstanceId ?? null,
        title: finding.title ?? finding.issueType,
        detail: finding.detail ?? finding.notes,
        severity: finding.severity,
        status: finding.status ?? "open",
        createdAt: finding.createdAt ?? new Date().toISOString(),
        updatedAt: finding.updatedAt ?? finding.createdAt ?? new Date().toISOString(),
      };
    });
  const testFindings = reportFindings
    .filter((finding) => {
      const report = reportsById.get(finding.reportId);
      return report?.reportType !== "QA";
    })
    .map((finding) => {
      const report = reportsById.get(finding.reportId);
      return {
        id: finding.id,
        testResultId: finding.reportId || null,
        eventId: finding.eventId ?? report?.eventId ?? null,
        taskId: finding.taskId ?? report?.taskId ?? null,
        projectId: finding.projectId ?? report?.projectId ?? defaultProjectId,
        workstreamId: finding.workstreamId ?? report?.workstreamId ?? null,
        subsystemId: finding.subsystemId ?? null,
        mechanismId: finding.mechanismId ?? null,
        partInstanceId: finding.partInstanceId ?? null,
        artifactId: finding.artifactInstanceId ?? null,
        title: finding.title ?? finding.issueType,
        detail: finding.detail ?? finding.notes,
        severity: finding.severity,
        status: finding.status ?? "open",
        createdAt: finding.createdAt ?? new Date().toISOString(),
        updatedAt: finding.updatedAt ?? finding.createdAt ?? new Date().toISOString(),
      };
    });

  return {
    seasons: planning.seasons,
    projects: planning.projects,
    workstreams: planning.workstreams,
    members: (source.members ?? []).map((member) => {
      const seasonId = member.seasonId ?? defaultSeasonId;
      const activeSeasonIds = uniqueIds([...(member.activeSeasonIds ?? []), seasonId]);
      return {
        ...member,
        email: typeof member.email === "string" ? member.email : "",
        elevated:
          typeof member.elevated === "boolean"
            ? member.elevated
            : member.role === "lead" || member.role === "admin",
        seasonId,
        activeSeasonIds: activeSeasonIds.length > 0 ? activeSeasonIds : [seasonId],
      };
    }),
    subsystems,
    disciplines: source.disciplines ?? [],
    mechanisms: (source.mechanisms ?? []).map((mechanism) => ({
      ...mechanism,
      isArchived: mechanism.isArchived ?? false,
    })),
    materials: source.materials ?? [],
    artifacts,
    partDefinitions: (source.partDefinitions ?? []).map((partDefinition) => ({
      ...partDefinition,
      isArchived: partDefinition.isArchived ?? false,
      materialId: partDefinition.materialId ?? null,
      description: partDefinition.description ?? "",
    })),
    partInstances: (source.partInstances ?? []).map((partInstance) => ({
      ...partInstance,
      mechanismId: partInstance.mechanismId ?? null,
      status: partInstance.status ?? "planned",
    })),
    events,
    reports,
    reportFindings,
    qaReports,
    testResults,
    qaFindings,
    testFindings,
    designIterations: source.designIterations ?? [],
    risks: source.risks ?? [],
    tasks: planning.tasks,
    taskDependencies:
      (source.taskDependencies ?? []).map((dependency, index) => ({
        id: dependency.id ?? `task-dependency-${index + 1}`,
        upstreamTaskId: dependency.upstreamTaskId ?? "",
        downstreamTaskId: dependency.downstreamTaskId ?? "",
        dependencyType: dependency.dependencyType ?? "finish_to_start",
        createdAt: dependency.createdAt ?? new Date().toISOString(),
      })),
    taskBlockers:
      (source.taskBlockers ?? []).map((blocker, index) => ({
        id: blocker.id ?? `task-blocker-${index + 1}`,
        blockedTaskId: blocker.blockedTaskId ?? "",
        blockerType: blocker.blockerType ?? "external",
        blockerId: blocker.blockerId ?? null,
        description: blocker.description ?? "",
        severity: blocker.severity ?? "medium",
        status: blocker.status ?? "open",
        createdByMemberId: blocker.createdByMemberId ?? null,
        createdAt: blocker.createdAt ?? new Date().toISOString(),
        resolvedAt: blocker.resolvedAt ?? null,
      })),
    workLogs: (source.workLogs ?? []).map((workLog) => ({
      ...workLog,
      participantIds: workLog.participantIds ?? [],
      notes: workLog.notes ?? "",
    })),
    purchaseItems: (source.purchaseItems ?? []).map((item) => ({
      ...item,
      partDefinitionId: item.partDefinitionId ?? null,
    })),
    manufacturingItems: (source.manufacturingItems ?? []).map((item) => {
      const partInstanceIds = item.partInstanceIds?.length
        ? uniqueIds(item.partInstanceIds)
        : uniqueIds([item.partInstanceId]);

      return {
        ...item,
        materialId: item.materialId ?? null,
        partDefinitionId: item.partDefinitionId ?? null,
        partInstanceId: partInstanceIds[0] ?? null,
        partInstanceIds,
        inHouse: item.process === "cnc" ? item.inHouse ?? true : false,
      };
    }),
  };
}

export async function fetchAuthConfig() {
  const response = await fetch(buildApiUrl("/auth/config"));
  const payload = await readJson<unknown>(response);

  if (!isAuthConfig(payload)) {
    throw new ApiError(
      "The server returned an invalid authentication configuration.",
      502,
    );
  }

  return {
    ...payload,
    devBypassAvailable: payload.devBypassAvailable ?? false,
  };
}

export function resolveGoogleClientId(config: AuthConfig | null) {
  if (!config?.enabled || !config.googleClientId) {
    return null;
  }

  return readLocalGoogleClientIdOverride() ?? config.googleClientId;
}

export function isUsingLocalGoogleClientIdOverride() {
  return readLocalGoogleClientIdOverride() !== null;
}

export function isLocalGoogleAuthHost() {
  return typeof window !== "undefined" && isLocalHostname(window.location.hostname);
}

export async function fetchBootstrap(
  personId?: string | null,
  seasonId?: string | null,
  projectId?: string | null,
  onUnauthorized?: () => void,
) {
  const searchParams = new URLSearchParams();
  if (personId) {
    searchParams.set("personId", personId);
  }
  if (seasonId) {
    searchParams.set("seasonId", seasonId);
  }
  if (projectId) {
    searchParams.set("projectId", projectId);
  }
  const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
  const payload = await requestApi<BootstrapPayload>(
    `/bootstrap${query}`,
    {},
    onUnauthorized,
  );
  return normalizeBootstrapPayload(payload);
}

export async function startInteractiveTutorialSession(onUnauthorized?: () => void) {
  const response = await requestApi<{ ok: boolean }>(
    "/tutorial/session/start",
    {
      method: "POST",
    },
    onUnauthorized,
  );
  return response.ok;
}

export async function resetInteractiveTutorialSession(
  onUnauthorized?: () => void,
  mode: "session" | "baseline" = "session",
) {
  const response = await requestApi<{ ok: boolean }>(
    "/tutorial/session/reset",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mode }),
    },
    onUnauthorized,
  );
  return response.ok;
}

export async function createTask(
  payload: TaskPayload,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: TaskRecord }>(
    "/tasks",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );

  return response.item;
}

export async function createEventRecord(
  payload: EventPayload,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: EventRecord }>(
    "/events",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );

  return response.item;
}

export async function updateEventRecord(
  eventId: string,
  payload: Partial<EventPayload>,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: EventRecord }>(
    `/events/${eventId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );

  return response.item;
}

export async function deleteEventRecord(
  eventId: string,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: EventRecord }>(
    `/events/${eventId}`,
    {
      method: "DELETE",
    },
    onUnauthorized,
  );

  return response.item;
}

export async function createWorkLogRecord(
  payload: WorkLogPayload,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: WorkLogRecord }>(
    "/work-logs",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );

  return response.item;
}

export async function createReportRecord(
  payload: ReportPayload,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: ReportRecord }>(
    "/reports",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );

  return response.item;
}

export async function createReportFindingRecord(
  payload: ReportFindingPayload,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: ReportFindingRecord }>(
    "/report-findings",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );

  return response.item;
}

export async function createQaReportRecord(
  payload: QaReportPayload,
  onUnauthorized?: () => void,
) {
  return createReportRecord(payload, onUnauthorized);
}

export async function createTestResultRecord(
  payload: TestResultPayload,
  onUnauthorized?: () => void,
) {
  return createReportRecord(payload, onUnauthorized);
}

export async function createRiskRecord(
  payload: RiskPayload,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: RiskRecord }>(
    "/risks",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );

  return response.item;
}

export async function updateRiskRecord(
  riskId: string,
  payload: Partial<RiskPayload>,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: RiskRecord }>(
    `/risks/${riskId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );

  return response.item;
}

export async function deleteRiskRecord(
  riskId: string,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: RiskRecord }>(
    `/risks/${riskId}`,
    {
      method: "DELETE",
    },
    onUnauthorized,
  );

  return response.item;
}

export async function createSubsystemRecord(
  payload: SubsystemPayload,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: SubsystemRecord }>(
    "/subsystems",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );

  return response.item;
}

export async function updateSubsystemRecord(
  subsystemId: string,
  payload: Partial<SubsystemPayload>,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: SubsystemRecord }>(
    `/subsystems/${subsystemId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );

  return response.item;
}

export async function createMechanismRecord(
  payload: MechanismPayload,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: MechanismRecord }>(
    "/mechanisms",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );

  return response.item;
}

export async function updateMechanismRecord(
  mechanismId: string,
  payload: Partial<MechanismPayload>,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: MechanismRecord }>(
    `/mechanisms/${mechanismId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );

  return response.item;
}

export async function deleteMechanismRecord(
  mechanismId: string,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: MechanismRecord }>(
    `/mechanisms/${mechanismId}`,
    {
      method: "DELETE",
    },
    onUnauthorized,
  );

  return response.item;
}

export async function updateTaskRecord(
  taskId: string,
  payload: Partial<TaskPayload>,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: TaskRecord }>(
    `/tasks/${taskId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );

  return response.item;
}

export async function deleteTaskRecord(
  taskId: string,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: TaskRecord }>(
    `/tasks/${taskId}`,
    {
      method: "DELETE",
    },
    onUnauthorized,
  );

  return response.item;
}

export async function createTaskDependencyRecord(
  payload: TaskDependencyPayload,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: TaskDependencyRecord }>(
    "/task-dependencies",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );

  return response.item;
}

export async function updateTaskDependencyRecord(
  dependencyId: string,
  payload: Partial<TaskDependencyPayload>,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: TaskDependencyRecord }>(
    `/task-dependencies/${dependencyId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );

  return response.item;
}

export async function deleteTaskDependencyRecord(
  dependencyId: string,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: TaskDependencyRecord }>(
    `/task-dependencies/${dependencyId}`,
    {
      method: "DELETE",
    },
    onUnauthorized,
  );

  return response.item;
}

export async function createTaskBlockerRecord(
  payload: TaskBlockerPayload,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: TaskBlockerRecord }>(
    "/task-blockers",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );

  return response.item;
}

export async function updateTaskBlockerRecord(
  blockerId: string,
  payload: Partial<TaskBlockerPayload>,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: TaskBlockerRecord }>(
    `/task-blockers/${blockerId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );

  return response.item;
}

export async function deleteTaskBlockerRecord(
  blockerId: string,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: TaskBlockerRecord }>(
    `/task-blockers/${blockerId}`,
    {
      method: "DELETE",
    },
    onUnauthorized,
  );

  return response.item;
}

export async function createSeasonRecord(
  payload: SeasonCreatePayload,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: SeasonRecord }>(
    "/seasons",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );

  return response.item;
}

export async function createProjectRecord(
  payload: ProjectCreatePayload,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: ProjectRecord }>(
    "/projects",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );

  return response.item;
}

export async function updateProjectRecord(
  projectId: string,
  payload: Partial<ProjectPayload>,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: ProjectRecord }>(
    `/projects/${projectId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );

  return response.item;
}

export async function createMemberRecord(
  payload: MemberCreatePayload,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: MemberRecord }>(
    "/members",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );

  return response.item;
}

export async function updateMemberRecord(
  memberId: string,
  payload: Partial<MemberPayload>,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: MemberRecord }>(
    `/members/${memberId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );

  return response.item;
}

export async function deleteMemberRecord(
  memberId: string,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: MemberRecord }>(
    `/members/${memberId}`,
    {
      method: "DELETE",
    },
    onUnauthorized,
  );

  return response.item;
}

export async function createMaterialRecord(
  payload: MaterialPayload,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: MaterialRecord }>(
    "/materials",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );

  return response.item;
}

export async function updateMaterialRecord(
  materialId: string,
  payload: Partial<MaterialPayload>,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: MaterialRecord }>(
    `/materials/${materialId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );

  return response.item;
}

export async function deleteMaterialRecord(
  materialId: string,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: MaterialRecord }>(
    `/materials/${materialId}`,
    {
      method: "DELETE",
    },
    onUnauthorized,
  );

  return response.item;
}

export async function fetchArtifactRecords(onUnauthorized?: () => void) {
  const response = await requestApi<{ items: ArtifactRecord[] }>(
    "/artifacts",
    {},
    onUnauthorized,
  );

  return response.items;
}

export async function createArtifactRecord(
  payload: ArtifactPayload,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: ArtifactRecord }>(
    "/artifacts",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );

  return response.item;
}

export async function createWorkstreamRecord(
  payload: WorkstreamPayload,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: WorkstreamRecord }>(
    "/workstreams",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );

  return response.item;
}

export async function updateWorkstreamRecord(
  workstreamId: string,
  payload: Partial<WorkstreamPayload>,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: WorkstreamRecord }>(
    `/workstreams/${workstreamId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );

  return response.item;
}

export async function updateArtifactRecord(
  artifactId: string,
  payload: Partial<ArtifactPayload>,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: ArtifactRecord }>(
    `/artifacts/${artifactId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );

  return response.item;
}

export async function deleteArtifactRecord(
  artifactId: string,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: ArtifactRecord }>(
    `/artifacts/${artifactId}`,
    {
      method: "DELETE",
    },
    onUnauthorized,
  );

  return response.item;
}

export async function createPartDefinitionRecord(
  payload: PartDefinitionPayload,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: PartDefinitionRecord }>(
    "/part-definitions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );

  return response.item;
}

export async function updatePartDefinitionRecord(
  partDefinitionId: string,
  payload: Partial<PartDefinitionPayload>,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: PartDefinitionRecord }>(
    `/part-definitions/${partDefinitionId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );

  return response.item;
}

export async function deletePartDefinitionRecord(
  partDefinitionId: string,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: PartDefinitionRecord }>(
    `/part-definitions/${partDefinitionId}`,
    {
      method: "DELETE",
    },
    onUnauthorized,
  );

  return response.item;
}

export async function createPartInstanceRecord(
  payload: PartInstancePayload,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: PartInstanceRecord }>(
    "/part-instances",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );

  return response.item;
}

export async function updatePartInstanceRecord(
  partInstanceId: string,
  payload: Partial<PartInstancePayload>,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: PartInstanceRecord }>(
    `/part-instances/${partInstanceId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );

  return response.item;
}

export async function deletePartInstanceRecord(
  partInstanceId: string,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: PartInstanceRecord }>(
    `/part-instances/${partInstanceId}`,
    {
      method: "DELETE",
    },
    onUnauthorized,
  );

  return response.item;
}

export async function createPurchaseItemRecord(
  payload: PurchaseItemPayload,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: PurchaseItemRecord }>(
    "/purchases",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );

  return response.item;
}

export async function updatePurchaseItemRecord(
  itemId: string,
  payload: Partial<PurchaseItemPayload>,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: PurchaseItemRecord }>(
    `/purchases/${itemId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );

  return response.item;
}

export async function createManufacturingItemRecord(
  payload: ManufacturingItemPayload,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: ManufacturingItemRecord }>(
    "/manufacturing",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );

  return response.item;
}

export async function updateManufacturingItemRecord(
  itemId: string,
  payload: Partial<ManufacturingItemPayload>,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: ManufacturingItemRecord }>(
    `/manufacturing/${itemId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );

  return response.item;
}

export async function exchangeGoogleCredential(credential: string) {
  return postJson<SessionResponse>("/auth/google", { credential });
}

export async function requestEmailSignInCode(email: string) {
  return postJson<EmailCodeDeliveryResponse>("/auth/email/start", {
    email,
  });
}

export async function verifyEmailSignInCode(email: string, code: string) {
  return postJson<SessionResponse>("/auth/email/verify", {
    email,
    code,
  });
}

export async function requestDevBypassSignIn() {
  return postJson<SessionResponse>("/auth/dev-bypass", {});
}

export async function fetchCurrentUser(token: string) {
  const response = await fetch(buildApiUrl("/auth/me"), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const payload = await readJson<{
    enabled: boolean;
    user: SessionUser | null;
  }>(response);

  if (!payload.user) {
    throw new ApiError("No signed-in session is available.", 401);
  }

  return payload.user;
}

export function loadStoredSessionToken() {
  return window.localStorage.getItem(SESSION_STORAGE_KEY);
}

export function storeSessionToken(token: string) {
  window.localStorage.setItem(SESSION_STORAGE_KEY, token);
}

export function clearStoredSessionToken() {
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function signOutFromGoogle() {
  if (window.google?.accounts.id) {
    window.google.accounts.id.disableAutoSelect();
  }
}

export async function validateSession(): Promise<boolean> {
  try {
    const token = loadStoredSessionToken();
    if (!token) {
      return false;
    }

    await fetchCurrentUser(token);
    return true;
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 401) {
      return false;
    }

    // Keep the current session during transient network/server failures. The
    // request layer still expires sessions immediately on explicit 401s.
    return true;
  }
}

export function loadGoogleIdentityScript() {
  if (window.google?.accounts.id) {
    return Promise.resolve();
  }

  if (googleScriptPromise) {
    return googleScriptPromise;
  }

  googleScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]',
    );
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Google Identity Services failed to load.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    const scriptUrl = "https://accounts.google.com/gsi/client";
    const trustedScriptUrl = getGoogleTrustedTypesPolicy()?.createScriptURL(scriptUrl);
    script.src = (trustedScriptUrl ?? scriptUrl) as string;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      // Clear the promise so subsequent attempts can retry loading the script
      googleScriptPromise = null;
      reject(new Error("Google Identity Services failed to load."));
    };
    document.head.appendChild(script);
  });

  return googleScriptPromise;
}
