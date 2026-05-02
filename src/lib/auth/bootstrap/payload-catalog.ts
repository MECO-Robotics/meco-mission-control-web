import type {
  ArtifactRecord,
  EventRecord,
  ManufacturingItemRecord,
  MaterialRecord,
  MemberRecord,
  MechanismRecord,
  PartDefinitionRecord,
  PartInstanceRecord,
  PurchaseItemRecord,
  SubsystemRecord,
  WorkLogRecord,
} from "@/types";
import { resolveWorkspaceColor } from "@/features/workspace/shared/model";
import { localTodayDate } from "@/lib/dateUtils";
import type { NormalizedPlanningRecords } from "./planning";
import {
  resolveProjectAlias,
  uniqueIds,
  type LegacyBootstrapPayload,
} from "./shared";

function isArtifactKind(value: unknown): value is ArtifactRecord["kind"] {
  return value === "document" || value === "nontechnical";
}

function isArtifactStatus(value: unknown): value is ArtifactRecord["status"] {
  return value === "draft" || value === "in-review" || value === "published";
}

export interface NormalizedBootstrapCatalogRecords {
  members: MemberRecord[];
  subsystems: SubsystemRecord[];
  mechanisms: MechanismRecord[];
  materials: MaterialRecord[];
  artifacts: ArtifactRecord[];
  partDefinitions: PartDefinitionRecord[];
  partInstances: PartInstanceRecord[];
  events: EventRecord[];
  workLogs: WorkLogRecord[];
  purchaseItems: PurchaseItemRecord[];
  manufacturingItems: ManufacturingItemRecord[];
}

export function normalizeBootstrapCatalogRecords(
  source: LegacyBootstrapPayload,
  planning: NormalizedPlanningRecords,
): NormalizedBootstrapCatalogRecords {
  const defaultSeasonId = planning.seasons[0]?.id ?? "season-default";
  const defaultProjectId = planning.projects[0]?.id ?? "project-default";
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
    const workstream = requestedWorkstreamId ? workstreamsById.get(requestedWorkstreamId) : null;
    const workstreamId = workstream && workstream.projectId === projectId ? workstream.id : null;

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

  const subsystems = (source.subsystems ?? []).map((subsystem) => ({
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
      ? event.relatedSubsystemIds.filter(
          (subsystemId): subsystemId is string =>
            typeof subsystemId === "string" && subsystemId.length > 0,
        )
      : [];
    const explicitProjectIds = Array.isArray(event.projectIds)
      ? Array.from(
          new Set(
            event.projectIds
              .map((projectId) =>
                resolveProjectAlias(projectId, projectIds, planning.projectIdAliases),
              )
              .filter((projectId): projectId is string => Boolean(projectId)),
          ),
        )
      : [];
    const inferredProjectIds = Array.from(
      new Set(
        relatedSubsystemIds
          .map((subsystemId) => subsystemProjectIdsById.get(subsystemId))
          .filter((projectId): projectId is string => Boolean(projectId)),
      ),
    );
    const fallbackEventDate = planning.seasons[0]?.startDate ?? localTodayDate();

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

  return {
    members: (source.members ?? []).map((member) => {
      const seasonId = member.seasonId ?? defaultSeasonId;
      const activeSeasonIds = Array.from(
        new Set([...(member.activeSeasonIds ?? []), seasonId].filter(Boolean)),
      );

      return {
        ...member,
        email: typeof member.email === "string" ? member.email : "",
        photoUrl: typeof member.photoUrl === "string" ? member.photoUrl : "",
        elevated:
          typeof member.elevated === "boolean"
            ? member.elevated
            : member.role === "lead" || member.role === "admin",
        seasonId,
        activeSeasonIds: activeSeasonIds.length > 0 ? activeSeasonIds : [seasonId],
      };
    }),
    subsystems,
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
