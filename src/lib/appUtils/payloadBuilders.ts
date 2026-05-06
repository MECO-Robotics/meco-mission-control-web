import type { ArtifactPayload, MaterialPayload, MechanismPayload, PartDefinitionPayload, PartInstancePayload, PurchaseItemPayload, QaReportPayload, ReportPayload, SubsystemPayload, TestResultPayload, WorkLogPayload, WorkstreamPayload } from "@/types/payloads";
import type { BootstrapPayload } from "@/types/bootstrap";
import { getDefaultSubsystemId } from "@/lib/appUtils/common";
import { localTodayDate } from "@/lib/dateUtils";
import { resolveWorkspaceColor } from "@/features/workspace/shared/model/workspaceColors";

export function buildEmptyPurchasePayload(bootstrap: BootstrapPayload): PurchaseItemPayload {
  const firstPartDefinition = bootstrap.partDefinitions[0] ?? null;

  return {
    title: firstPartDefinition?.name ?? "",
    subsystemId: getDefaultSubsystemId(bootstrap),
    requestedById: bootstrap.members[0]?.id ?? null,
    partDefinitionId: firstPartDefinition?.id ?? null,
    quantity: 1,
    vendor: "",
    linkLabel: "",
    estimatedCost: 0,
    finalCost: undefined,
    approvedByMentor: false,
    status: "requested",
  };
}

export function buildEmptyWorkLogPayload(
  bootstrap: BootstrapPayload,
  defaultParticipantId: string | null = null,
): WorkLogPayload {
  const participantId =
    defaultParticipantId &&
    bootstrap.members.some((member) => member.id === defaultParticipantId)
      ? defaultParticipantId
      : bootstrap.members[0]?.id ?? null;

  return {
    taskId: bootstrap.tasks[0]?.id ?? "",
    date: localTodayDate(),
    hours: 1,
    participantIds: participantId ? [participantId] : [],
    notes: "",
    photoUrl: "",
  };
}

export function buildEmptyReportPayload(
  bootstrap: BootstrapPayload,
  reportType: ReportPayload["reportType"],
  defaults: {
    taskId?: string | null;
    milestoneId?: string | null;
    projectId?: string;
    workstreamId?: string | null;
    createdByMemberId?: string | null;
    result?: string;
    summary?: string;
    notes?: string;
    photoUrl?: string;
    participantIds?: string[];
    mentorApproved?: boolean;
    reviewedAt?: string;
    title?: string;
    status?: ReportPayload["status"];
    findings?: string[];
  } = {},
): ReportPayload {
  const today = localTodayDate();
  const task = defaults.taskId
    ? bootstrap.tasks.find((candidate) => candidate.id === defaults.taskId) ?? null
    : bootstrap.tasks[0] ?? null;
  const milestone = defaults.milestoneId
    ? bootstrap.milestones.find((candidate) => candidate.id === defaults.milestoneId) ?? null
    : bootstrap.milestones[0] ?? null;
  const resolvedProjectId =
    defaults.projectId ??
    task?.projectId ??
    milestone?.projectIds?.[0] ??
    bootstrap.projects[0]?.id ??
    "";
  const resolvedWorkstreamId =
    defaults.workstreamId !== undefined ? defaults.workstreamId : task?.workstreamId ?? null;

  return {
    reportType,
    projectId: resolvedProjectId,
    taskId: defaults.taskId ?? task?.id ?? null,
    milestoneId: defaults.milestoneId ?? milestone?.id ?? null,
    workstreamId: resolvedWorkstreamId,
    createdByMemberId: defaults.createdByMemberId ?? bootstrap.members[0]?.id ?? null,
    result: defaults.result ?? "pass",
    summary: defaults.summary ?? "",
    notes: defaults.notes ?? "",
    photoUrl: defaults.photoUrl ?? "",
    createdAt: today,
    participantIds: defaults.participantIds ?? [],
    mentorApproved: defaults.mentorApproved ?? false,
    reviewedAt: defaults.reviewedAt ?? today,
    title: defaults.title ?? "",
    status: defaults.status ?? "pass",
    findings: defaults.findings ?? [],
  };
}

export function buildEmptyQaReportPayload(
  bootstrap: BootstrapPayload,
  defaultParticipantId: string | null = null,
): QaReportPayload {
  const task = bootstrap.tasks[0] ?? null;
  const participantId =
    defaultParticipantId &&
    bootstrap.members.some((member) => member.id === defaultParticipantId)
      ? defaultParticipantId
      : bootstrap.members[0]?.id ?? null;

  return buildEmptyReportPayload(bootstrap, "QA", {
    taskId: task?.id ?? "",
    projectId: task?.projectId ?? bootstrap.projects[0]?.id ?? "",
    workstreamId: task?.workstreamId ?? null,
    participantIds: participantId ? [participantId] : [],
    result: "pass",
    mentorApproved: false,
    notes: "",
    reviewedAt: localTodayDate(),
    photoUrl: "",
  });
}

export function buildEmptyTestResultPayload(bootstrap: BootstrapPayload): TestResultPayload {
  const milestone = bootstrap.milestones[0] ?? null;

  return buildEmptyReportPayload(bootstrap, "MilestoneTest", {
    milestoneId: milestone?.id ?? "",
    projectId: milestone?.projectIds?.[0] ?? bootstrap.projects[0]?.id ?? "",
    result: "pass",
    summary: "",
    notes: "",
    title: "",
    status: "pass",
    findings: [],
    photoUrl: "",
  });
}

export function buildEmptyMaterialPayload(): MaterialPayload {
  return {
    name: "",
    category: "metal",
    unit: "pcs",
    onHandQuantity: 0,
    reorderPoint: 0,
    location: "",
    vendor: "",
    notes: "",
  };
}

export function buildEmptyArtifactPayload(
  bootstrap: BootstrapPayload,
  defaults: {
    projectId?: string;
    workstreamId?: string | null;
    kind?: ArtifactPayload["kind"];
  } = {},
): ArtifactPayload {
  const resolvedProjectId =
    defaults.projectId && bootstrap.projects.some((project) => project.id === defaults.projectId)
      ? defaults.projectId
      : bootstrap.projects[0]?.id ?? "";

  const resolvedWorkstreamId =
    defaults.workstreamId !== undefined
      ? defaults.workstreamId
      : bootstrap.workstreams.find((workstream) => workstream.projectId === resolvedProjectId)?.id ?? null;

  const projectScopedWorkstreamId =
    resolvedWorkstreamId &&
    bootstrap.workstreams.some(
      (workstream) =>
        workstream.id === resolvedWorkstreamId && workstream.projectId === resolvedProjectId,
    )
      ? resolvedWorkstreamId
      : null;

  return {
    projectId: resolvedProjectId,
    workstreamId: projectScopedWorkstreamId,
    kind: defaults.kind ?? "document",
    title: "",
    summary: "",
    status: "draft",
    link: "",
    isArchived: false,
    updatedAt: new Date().toISOString(),
  };
}

export function buildEmptyWorkstreamPayload(
  bootstrap: BootstrapPayload,
  defaults: { projectId?: string } = {},
): WorkstreamPayload {
  const resolvedProjectId =
    defaults.projectId && bootstrap.projects.some((project) => project.id === defaults.projectId)
      ? defaults.projectId
      : bootstrap.projects[0]?.id ?? "";

  return {
    projectId: resolvedProjectId,
    name: "",
    color: resolveWorkspaceColor(null, `${resolvedProjectId}:workstream`, 0),
    description: "",
    isArchived: false,
  };
}

export function buildEmptyPartDefinitionPayload(bootstrap: BootstrapPayload): PartDefinitionPayload {
  return {
    seasonId: bootstrap.seasons[0]?.id,
    activeSeasonIds: bootstrap.seasons[0]?.id ? [bootstrap.seasons[0].id] : [],
    name: "",
    partNumber: "",
    revision: "A",
    iteration: 1,
    isArchived: false,
    isHardware: false,
    type: "custom",
    source: "",
    materialId: bootstrap.materials[0]?.id ?? null,
    description: "",
    photoUrl: "",
  };
}

export function buildEmptySubsystemPayload(bootstrap: BootstrapPayload): SubsystemPayload {
  const defaultProjectId = bootstrap.projects[0]?.id ?? "";
  const defaultParentSubsystemId =
    (
      bootstrap.subsystems.find(
        (subsystem) => subsystem.projectId === defaultProjectId && !subsystem.isArchived,
      )?.id ??
      bootstrap.subsystems.find((subsystem) => subsystem.projectId === defaultProjectId)?.id ??
      getDefaultSubsystemId(bootstrap)
    ) || null;
  const firstResponsibleEngineer =
    bootstrap.members.find((member) => member.role === "lead")?.id ??
    bootstrap.members.find((member) => member.role === "student")?.id ??
    bootstrap.members[0]?.id ??
    null;
  const firstMentor = bootstrap.members.find((member) => member.role === "mentor")?.id ?? null;

  return {
    projectId: defaultProjectId,
    name: "",
    color: resolveWorkspaceColor(null, `${defaultProjectId}:subsystem`, 1),
    description: "",
    photoUrl: "",
    iteration: 1,
    isArchived: false,
    parentSubsystemId: defaultParentSubsystemId,
    responsibleEngineerId: firstResponsibleEngineer,
    mentorIds: firstMentor ? [firstMentor] : [],
    risks: [],
  };
}

export function buildEmptyMechanismPayload(
  bootstrap: BootstrapPayload,
  subsystemId?: string,
): MechanismPayload {
  const firstSubsystem =
    subsystemId && subsystemId.length > 0 ? subsystemId : getDefaultSubsystemId(bootstrap);

  return {
    subsystemId: firstSubsystem,
    name: "",
    description: "",
    googleSheetsUrl: "",
    photoUrl: "",
    iteration: 1,
    isArchived: false,
  };
}

export function buildEmptyPartInstancePayload(
  bootstrap: BootstrapPayload,
  defaults: {
    subsystemId?: string;
    mechanismId?: string | null;
    partDefinitionId?: string;
  } = {},
): PartInstancePayload {
  const firstSubsystem = defaults.subsystemId ?? getDefaultSubsystemId(bootstrap);
  const firstMechanism =
    defaults.mechanismId !== undefined
      ? defaults.mechanismId
      : bootstrap.mechanisms.find((mechanism) => mechanism.subsystemId === firstSubsystem)?.id ?? null;
  return {
    subsystemId: firstSubsystem,
    mechanismId: firstMechanism,
    partDefinitionId: defaults.partDefinitionId ?? bootstrap.partDefinitions[0]?.id ?? "",
    name: "",
    quantity: 1,
    trackIndividually: false,
    status: "not ready",
    photoUrl: "",
  };
}
