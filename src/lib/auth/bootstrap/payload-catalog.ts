import type { ArtifactRecord, ManufacturingItemRecord, MaterialRecord, PartDefinitionRecord, PartInstanceRecord, PurchaseItemRecord } from "@/types/recordsInventory";
import type { MilestoneRecord, WorkLogRecord } from "@/types/recordsExecution";
import type { MechanismRecord, MemberRecord, SubsystemRecord } from "@/types/recordsOrganization";
import { resolveWorkspaceColor } from "@/features/workspace/shared/model/workspaceColors";
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

function getPartInstanceMergeKey(
  partInstance: Pick<PartInstanceRecord, "subsystemId" | "mechanismId" | "partDefinitionId">,
) {
  return [partInstance.subsystemId, partInstance.mechanismId ?? "", partInstance.partDefinitionId].join(
    "::",
  );
}

function normalizeCatalogPartInstances(partInstances: PartInstanceRecord[]) {
  const remappedPartInstanceIds = new Map<string, string>();
  const partInstancesByKey = new Map<string, PartInstanceRecord>();
  const normalizedPartInstances: PartInstanceRecord[] = [];

  for (const partInstance of partInstances) {
    const mergeKey = getPartInstanceMergeKey(partInstance);
    const existingPartInstance = partInstancesByKey.get(mergeKey);

    if (existingPartInstance) {
      existingPartInstance.quantity += partInstance.quantity;
      remappedPartInstanceIds.set(partInstance.id, existingPartInstance.id);
      continue;
    }

    partInstancesByKey.set(mergeKey, partInstance);
    normalizedPartInstances.push(partInstance);
  }

  return {
    partInstances: normalizedPartInstances,
    remappedPartInstanceIds,
  };
}

export interface NormalizedBootstrapCatalogRecords {
  members: MemberRecord[];
  subsystems: SubsystemRecord[];
  mechanisms: MechanismRecord[];
  materials: MaterialRecord[];
  artifacts: ArtifactRecord[];
  partDefinitions: PartDefinitionRecord[];
  partInstances: PartInstanceRecord[];
  milestones: MilestoneRecord[];
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
  const milestones: MilestoneRecord[] = (source.milestones ?? []).map((milestone, index) => {
    const explicitProjectIds = Array.isArray(milestone.projectIds)
      ? Array.from(
          new Set(
            milestone.projectIds
              .map((projectId) =>
                resolveProjectAlias(projectId, projectIds, planning.projectIdAliases),
              )
              .filter((projectId): projectId is string => Boolean(projectId)),
          ),
        )
      : [];
    const fallbackMilestoneDate = planning.seasons[0]?.startDate ?? localTodayDate();

    return {
      id: milestone.id ?? `milestone-${index + 1}`,
      title: milestone.title ?? `Milestone ${index + 1}`,
      type: milestone.type ?? "internal-review",
      startDateTime: milestone.startDateTime ?? `${fallbackMilestoneDate}T12:00:00`,
      endDateTime: milestone.endDateTime ?? null,
      isExternal: milestone.isExternal ?? false,
      description: milestone.description ?? "",
      projectIds: explicitProjectIds,
    };
  });
  const normalizedPartInstanceData = normalizeCatalogPartInstances(
    (source.partInstances ?? []).map((partInstance) => ({
      ...partInstance,
      mechanismId: partInstance.mechanismId ?? null,
      status: partInstance.status ?? "not ready",
    })),
  );

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
      googleSheetsUrl: typeof mechanism.googleSheetsUrl === "string" ? mechanism.googleSheetsUrl : "",
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
    partInstances: normalizedPartInstanceData.partInstances,
    milestones,
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
      const partInstanceIds = uniqueIds(
        (item.partInstanceIds?.length ? item.partInstanceIds : item.partInstanceId ? [item.partInstanceId] : [])
          .map((partInstanceId) =>
            normalizedPartInstanceData.remappedPartInstanceIds.get(partInstanceId) ?? partInstanceId,
          ),
      );

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
