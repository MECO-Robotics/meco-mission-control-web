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
  ProjectRecord,
  PurchaseItemPayload,
  PurchaseItemRecord,
  SeasonCreatePayload,
  SeasonRecord,
  SubsystemPayload,
  SubsystemRecord,
  TaskPayload,
  TaskRecord,
  WorkLogPayload,
  WorkLogRecord,
  WorkstreamRecord,
} from "@/types";

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
  key: "robot" | "business" | "outreach" | "media" | "training" | "operations";
  name: string;
  projectType: ProjectRecord["projectType"];
}> = [
  { key: "robot", name: "Robot", projectType: "robot" },
  { key: "business", name: "Business", projectType: "other" },
  { key: "outreach", name: "Outreach", projectType: "outreach" },
  { key: "media", name: "Media", projectType: "other" },
  { key: "training", name: "Training", projectType: "other" },
  { key: "operations", name: "Operations", projectType: "operations" },
];

type LegacyBootstrapPayload = Partial<BootstrapPayload> & {
  tasks?: Array<Partial<TaskRecord> & { requirementId?: string | null }>;
  artifacts?: Array<Partial<ArtifactRecord>>;
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

function classifyProjectBucket(project: Pick<ProjectRecord, "name" | "projectType">) {
  const name = project.name.toLowerCase();

  if (project.projectType === "robot" || /\brobot\b/.test(name)) {
    return "robot";
  }

  if (project.projectType === "outreach" || /\boutreach\b/.test(name)) {
    return "outreach";
  }

  if (project.projectType === "operations" || /\boperations?\b/.test(name)) {
    return "operations";
  }

  if (/\bbusiness\b/.test(name)) {
    return "business";
  }

  if (/\bmedia\b/.test(name)) {
    return "media";
  }

  if (/\btraining\b/.test(name)) {
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

  const fallbackDate = new Date().toISOString().slice(0, 10);
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
      name: seasonIdsFromProjects.length > 0 ? toTitleFromId(seasonId) : "Default Season",
      type: "season",
      startDate,
      endDate,
    }));
  }
  const defaultSeasonId = seasons[0]?.id ?? LEGACY_SEASON_ID;

  const usedProjectIds = new Set<string>();
  let projects: ProjectRecord[] = sourceProjects.map((project, index) => {
    const projectId = reserveUniqueId(
      project.id ?? "",
      `project-${index + 1}`,
      usedProjectIds,
    );

    return {
      id: projectId,
      seasonId: seasons.some((season) => season.id === project.seasonId)
        ? project.seasonId
        : defaultSeasonId,
      name: project.name ?? `Project ${index + 1}`,
      projectType: project.projectType ?? "robot",
      description: project.description ?? "",
      status: project.status ?? "active",
    };
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
    projectId: projectIds.has(workstream.projectId) ? workstream.projectId : defaultProjectId,
    name: workstream.name ?? `Workstream ${index + 1}`,
    description: workstream.description ?? "",
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
        description: subsystem?.description ?? "",
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
      typeof task.projectId === "string" && projectIds.has(task.projectId)
        ? task.projectId
        : defaultProjectId;
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
    const taskStartDate = isIsoDate(task.startDate) ? task.startDate : startDate;
    const taskDueDate = isIsoDate(task.dueDate) ? task.dueDate : taskStartDate;

    return {
      id: task.id ?? `task-${index + 1}`,
      projectId: taskProjectId,
      workstreamId: taskWorkstreamId,
      title: task.title ?? "Untitled task",
      summary: task.summary ?? "",
      subsystemId: taskSubsystemId,
      disciplineId: task.disciplineId ?? defaultDisciplineId,
      mechanismId: task.mechanismId ?? null,
      partInstanceId: task.partInstanceId ?? null,
      targetEventId: task.targetEventId ?? null,
      ownerId: task.ownerId ?? null,
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

  return {
    seasons,
    projects,
    workstreams,
    tasks,
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
      typeof artifact.projectId === "string" && projectIds.has(artifact.projectId)
        ? artifact.projectId
        : defaultProjectId;
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
      updatedAt:
        typeof artifact.updatedAt === "string" && artifact.updatedAt.trim().length > 0
          ? artifact.updatedAt
          : new Date().toISOString(),
    };
  });

  return {
    seasons: planning.seasons,
    projects: planning.projects,
    workstreams: planning.workstreams,
    members: (source.members ?? []).map((member) => ({
      ...member,
      email: typeof member.email === "string" ? member.email : "",
      elevated:
        typeof member.elevated === "boolean"
          ? member.elevated
          : member.role === "lead" || member.role === "admin",
      seasonId: member.seasonId ?? defaultSeasonId,
    })),
    subsystems: (source.subsystems ?? []).map((subsystem) => ({
      ...subsystem,
      projectId: subsystem.projectId ?? defaultProjectId,
    })),
    disciplines: source.disciplines ?? [],
    mechanisms: source.mechanisms ?? [],
    materials: source.materials ?? [],
    artifacts,
    partDefinitions: (source.partDefinitions ?? []).map((partDefinition) => ({
      ...partDefinition,
      materialId: partDefinition.materialId ?? null,
      description: partDefinition.description ?? "",
    })),
    partInstances: (source.partInstances ?? []).map((partInstance) => ({
      ...partInstance,
      mechanismId: partInstance.mechanismId ?? null,
      status: partInstance.status ?? "planned",
    })),
    events: source.events ?? [],
    qaReports: source.qaReports ?? [],
    testResults: source.testResults ?? [],
    risks: source.risks ?? [],
    tasks: planning.tasks,
    workLogs: (source.workLogs ?? []).map((workLog) => ({
      ...workLog,
      participantIds: workLog.participantIds ?? [],
      notes: workLog.notes ?? "",
    })),
    purchaseItems: (source.purchaseItems ?? []).map((item) => ({
      ...item,
      partDefinitionId: item.partDefinitionId ?? null,
    })),
    manufacturingItems: (source.manufacturingItems ?? []).map((item) => ({
      ...item,
      materialId: item.materialId ?? null,
      partDefinitionId: item.partDefinitionId ?? null,
      partInstanceId: item.partInstanceId ?? null,
    })),
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
  onUnauthorized?: () => void,
) {
  const query = personId ? `?personId=${encodeURIComponent(personId)}` : "";
  const payload = await requestApi<BootstrapPayload>(
    `/bootstrap${query}`,
    {},
    onUnauthorized,
  );
  return normalizeBootstrapPayload(payload);
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

    // If we can't verify the user (network error or server error), return false to be safe
    return false;
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

