import type {
  ArtifactPayload,
  ArtifactRecord,
  BootstrapPayload,
  ManufacturingItemPayload,
  ManufacturingItemRecord,
  MaterialPayload,
  MaterialRecord,
  MechanismPayload,
  PartDefinitionPayload,
  PartDefinitionRecord,
  PartInstancePayload,
  PartInstanceRecord,
  PurchaseItemPayload,
  PurchaseItemRecord,
  ReportPayload,
  ReportType,
  QaReportPayload,
  SubsystemPayload,
  SubsystemRecord,
  TaskPayload,
  TaskRecord,
  TaskDependencyDraft,
  TestResultPayload,
  WorkLogPayload,
  WorkstreamPayload,
  WorkstreamRecord,
} from "@/types";
import {
    resolveWorkspaceColor,
} from "@/features/workspace/shared/workspaceColors";
import { localTodayDate } from "@/lib/dateUtils";
import { getDefaultTaskDisciplineIdForProject } from "@/lib/taskDisciplines";
import { getTaskOpenBlockersForTask } from "@/features/workspace/shared/taskPlanning";

export function toErrorMessage(error: unknown) {
    if (error instanceof Error) return error.message;
    return "Something went wrong while checking your session.";
}

export function getDefaultSubsystemId(bootstrap: BootstrapPayload) {
    return (
        bootstrap.subsystems.find(
            (subsystem) => subsystem.isCore && !subsystem.isArchived,
        )?.id ??
        bootstrap.subsystems.find((subsystem) => !subsystem.isArchived)?.id ??
        bootstrap.subsystems.find((subsystem) => subsystem.isCore)?.id ??
        bootstrap.subsystems[0]?.id ??
        ""
    );
}

export function formatDate(value: string) {
    return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
    });
}

export function formatCurrency(value: number | undefined) {
    if (typeof value !== "number") return "Pending";
    return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(value);
}

export function dateDiffInDays(start: string, end: string) {
    const startDate = new Date(`${start}T00:00:00`);
    const endDate = new Date(`${end}T00:00:00`);
    return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
}

export function splitList(value: string) {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export function joinList(values: string[]) {
    return values.join(", ");
}

function normalizeEmail(value: string | null | undefined) {
    return value?.trim().toLowerCase() ?? "";
}

export function findMemberForSessionUser(
    members: BootstrapPayload["members"],
    sessionUser: { email: string } | null | undefined,
) {
    const sessionEmail = normalizeEmail(sessionUser?.email);
    if (!sessionEmail) {
        return null;
    }

    return members.find((member) => normalizeEmail(member.email) === sessionEmail) ?? null;
}

function uniqueIds(values: Array<string | null | undefined>) {
    return Array.from(
        new Set(values.filter((value): value is string => Boolean(value))),
    );
}

export function getMemberActiveSeasonIds(
    member: Pick<BootstrapPayload["members"][number], "seasonId" | "activeSeasonIds">,
) {
    const seasonIds = uniqueIds([...(member.activeSeasonIds ?? []), member.seasonId]);
    return seasonIds.length > 0 ? seasonIds : [member.seasonId];
}

export function isMemberActiveInSeason(
    member: Pick<BootstrapPayload["members"][number], "seasonId" | "activeSeasonIds">,
    seasonId: string,
) {
    return getMemberActiveSeasonIds(member).includes(seasonId);
}

export function getPartDefinitionActiveSeasonIds(
    partDefinition: Pick<BootstrapPayload["partDefinitions"][number], "seasonId" | "activeSeasonIds">,
) {
    const seasonIds = uniqueIds([...(partDefinition.activeSeasonIds ?? []), partDefinition.seasonId]);
    return seasonIds.length > 0 ? seasonIds : [partDefinition.seasonId];
}

export function isPartDefinitionActiveInSeason(
    partDefinition: Pick<BootstrapPayload["partDefinitions"][number], "seasonId" | "activeSeasonIds">,
    seasonId: string,
) {
    return getPartDefinitionActiveSeasonIds(partDefinition).includes(seasonId);
}

export function normalizeIteration(value: number | null | undefined) {
    return Number.isFinite(value) && value && value >= 1 ? Math.trunc(value) : 1;
}

export function formatIterationVersion(value: number | null | undefined) {
    return `v${normalizeIteration(value)}`;
}

export function buildIterationOptions(
    iterations: Array<number | null | undefined>,
    selectedIteration: number | null | undefined,
) {
    const highestIteration = Math.max(
        normalizeIteration(selectedIteration),
        ...iterations.map(normalizeIteration),
    );
    const optionCount = Math.max(5, highestIteration + 1);

    return Array.from({ length: optionCount }, (_, index) => index + 1);
}

export type TaskTargetKind = "workstream" | "subsystem" | "mechanism" | "part-instance";

export interface TaskTargetSelection {
    kind: TaskTargetKind;
    id: string;
}

export function getProjectTaskTargetLabel(
    project: Pick<BootstrapPayload["projects"][number], "projectType"> | null | undefined,
) {
    return project?.projectType === "robot" ? "Subsystems" : "Workstreams";
}

function getTaskTargetArrays(payload: TaskPayload) {
  return {
        subsystemIds: payload.subsystemIds.length
            ? payload.subsystemIds
            : uniqueIds([payload.subsystemId]),
        mechanismIds: payload.mechanismIds.length
            ? payload.mechanismIds
            : uniqueIds([payload.mechanismId]),
        partInstanceIds: payload.partInstanceIds.length
            ? payload.partInstanceIds
            : uniqueIds([payload.partInstanceId]),
    };
}

function removeId(ids: string[], id: string) {
    return ids.filter((currentId) => currentId !== id);
}

function normalizeTaskTargetPayload(
    payload: TaskPayload,
    bootstrap: BootstrapPayload,
    targets: {
        subsystemIds: string[];
        mechanismIds: string[];
        partInstanceIds: string[];
    },
) {
    const mechanismsById = Object.fromEntries(
        bootstrap.mechanisms.map((mechanism) => [mechanism.id, mechanism]),
    ) as Record<string, BootstrapPayload["mechanisms"][number]>;
    const partInstancesById = Object.fromEntries(
        bootstrap.partInstances.map((partInstance) => [partInstance.id, partInstance]),
    ) as Record<string, BootstrapPayload["partInstances"][number]>;
    let subsystemIds = uniqueIds(targets.subsystemIds);
    let mechanismIds = uniqueIds(targets.mechanismIds);
    const partInstanceIds = uniqueIds(targets.partInstanceIds);

    mechanismIds.forEach((mechanismId) => {
        const mechanism = mechanismsById[mechanismId];

        if (mechanism) {
            subsystemIds = uniqueIds([...subsystemIds, mechanism.subsystemId]);
        }
    });

    partInstanceIds.forEach((partInstanceId) => {
        const partInstance = partInstancesById[partInstanceId];

        if (!partInstance) {
            return;
        }

        subsystemIds = uniqueIds([...subsystemIds, partInstance.subsystemId]);

        if (partInstance.mechanismId) {
            mechanismIds = uniqueIds([...mechanismIds, partInstance.mechanismId]);
        }
    });

    const normalizedSubsystemIds = uniqueIds(subsystemIds);
    const normalizedMechanismIds = uniqueIds(mechanismIds);
    const normalizedPartInstanceIds = uniqueIds(partInstanceIds);

    return {
        ...payload,
        workstreamId: null,
        workstreamIds: [],
        subsystemId: normalizedSubsystemIds[0] ?? "",
        subsystemIds: normalizedSubsystemIds,
        mechanismId: normalizedMechanismIds[0] ?? null,
        mechanismIds: normalizedMechanismIds,
        partInstanceId: normalizedPartInstanceIds[0] ?? null,
        partInstanceIds: normalizedPartInstanceIds,
    };
}

export function setTaskPrimaryTargetSelection(
    payload: TaskPayload,
    bootstrap: BootstrapPayload,
    subsystemId: string,
): TaskPayload {
    const selectedSubsystem = bootstrap.subsystems.find(
        (subsystem) => subsystem.id === subsystemId,
    );
    if (!selectedSubsystem) {
        return normalizeTaskTargetPayload(payload, bootstrap, {
            subsystemIds: [],
            mechanismIds: [],
            partInstanceIds: [],
        });
    }

    const mechanismIds = payload.mechanismIds.filter((mechanismId) =>
        bootstrap.mechanisms.some(
            (mechanism) =>
                mechanism.id === mechanismId && mechanism.subsystemId === selectedSubsystem.id,
        ),
    );
    const partInstanceIds = payload.partInstanceIds.filter((partInstanceId) =>
        bootstrap.partInstances.some(
            (partInstance) =>
                partInstance.id === partInstanceId &&
                partInstance.subsystemId === selectedSubsystem.id,
        ),
    );

    return normalizeTaskTargetPayload(payload, bootstrap, {
        subsystemIds: [selectedSubsystem.id],
        mechanismIds,
        partInstanceIds,
    });
}

export function toggleTaskTargetSelection(
    payload: TaskPayload,
    bootstrap: BootstrapPayload,
    selection: TaskTargetSelection,
): TaskPayload {
    const mechanismsById = Object.fromEntries(
        bootstrap.mechanisms.map((mechanism) => [mechanism.id, mechanism]),
    ) as Record<string, BootstrapPayload["mechanisms"][number]>;
    const partInstancesById = Object.fromEntries(
        bootstrap.partInstances.map((partInstance) => [partInstance.id, partInstance]),
    ) as Record<string, BootstrapPayload["partInstances"][number]>;

    let { subsystemIds, mechanismIds, partInstanceIds } =
        getTaskTargetArrays(payload);

    if (selection.kind === "workstream" || selection.kind === "subsystem") {
        if (subsystemIds.includes(selection.id)) {
            const removedMechanismIds = new Set(
                bootstrap.mechanisms
                    .filter((mechanism) => mechanism.subsystemId === selection.id)
                    .map((mechanism) => mechanism.id),
            );

            subsystemIds = removeId(subsystemIds, selection.id);
            mechanismIds = mechanismIds.filter(
                (mechanismId) => mechanismsById[mechanismId]?.subsystemId !== selection.id,
            );
            partInstanceIds = partInstanceIds.filter((partInstanceId) => {
                const partInstance = partInstancesById[partInstanceId];

                return Boolean(
                    partInstance &&
                        partInstance.subsystemId !== selection.id &&
                        (!partInstance.mechanismId ||
                            !removedMechanismIds.has(partInstance.mechanismId)),
                );
            });
        } else {
            subsystemIds = uniqueIds([...subsystemIds, selection.id]);
        }
    }

    if (selection.kind === "mechanism") {
        const mechanism = mechanismsById[selection.id];

        if (!mechanism) {
            return payload;
        }

        if (mechanismIds.includes(selection.id)) {
            mechanismIds = removeId(mechanismIds, selection.id);
            partInstanceIds = partInstanceIds.filter(
                (partInstanceId) =>
                    partInstancesById[partInstanceId]?.mechanismId !== selection.id,
            );
        } else {
            mechanismIds = uniqueIds([...mechanismIds, selection.id]);
            subsystemIds = uniqueIds([...subsystemIds, mechanism.subsystemId]);
        }
    }

    if (selection.kind === "part-instance") {
        const partInstance = partInstancesById[selection.id];

        if (!partInstance) {
            return payload;
        }

        if (partInstanceIds.includes(selection.id)) {
            partInstanceIds = removeId(partInstanceIds, selection.id);
        } else {
            partInstanceIds = uniqueIds([...partInstanceIds, selection.id]);
            subsystemIds = uniqueIds([...subsystemIds, partInstance.subsystemId]);

            if (partInstance.mechanismId) {
                mechanismIds = uniqueIds([...mechanismIds, partInstance.mechanismId]);
            }
        }
    }

    return normalizeTaskTargetPayload(payload, bootstrap, {
        subsystemIds,
        mechanismIds,
        partInstanceIds,
    });
}

export function buildEmptyTaskPayload(bootstrap: BootstrapPayload): TaskPayload {
    const firstProject = bootstrap.projects[0]?.id ?? "";
    const firstSubsystem = getDefaultSubsystemId(bootstrap);
    const firstDiscipline = getDefaultTaskDisciplineIdForProject(bootstrap.projects[0]);
    const firstEvent = bootstrap.events[0]?.id ?? null;
    const firstStudent =
        bootstrap.members.find((m) => m.role === "lead")?.id ??
        bootstrap.members.find((m) => m.role === "student")?.id ??
        bootstrap.members[0]?.id ??
        null;
    const firstMentor = bootstrap.members.find((m) => m.role === "mentor")?.id ?? bootstrap.members[0]?.id ?? null;
    const today = localTodayDate();

    return {
        projectId: firstProject,
        workstreamId: null,
        workstreamIds: [],
        title: "",
        summary: "",
        photoUrl: "",
        subsystemId: firstSubsystem,
        subsystemIds: uniqueIds([firstSubsystem]),
        disciplineId: firstDiscipline,
        mechanismId: null,
        mechanismIds: [],
        partInstanceId: null,
        partInstanceIds: [],
        artifactId: null,
        artifactIds: [],
        targetEventId: firstEvent,
        ownerId: firstStudent,
        assigneeIds: uniqueIds([firstStudent]),
        mentorId: firstMentor,
        startDate: today,
        dueDate: today,
        priority: "medium",
        status: "not-started",
        estimatedHours: 4,
        actualHours: 0,
        blockers: [],
        taskBlockers: [],
        linkedManufacturingIds: [],
        linkedPurchaseIds: [],
        requiresDocumentation: false,
        documentationLinked: false,
    };
}

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

function getManufacturingMaterialFromPart(
    bootstrap: BootstrapPayload,
    partDefinition: PartDefinitionRecord | null,
): MaterialRecord | null {
    if (!partDefinition?.materialId) return null;
    return bootstrap.materials.find((material) => material.id === partDefinition.materialId) ?? null;
}

function getPreferredManufacturingPartInstance(
    bootstrap: BootstrapPayload,
    partDefinitionId: string,
    subsystemId: string,
): PartInstanceRecord | null {
    return (
        bootstrap.partInstances.find(
            (partInstance) =>
                partInstance.partDefinitionId === partDefinitionId &&
                partInstance.subsystemId === subsystemId,
        ) ??
        bootstrap.partInstances.find((partInstance) => partInstance.partDefinitionId === partDefinitionId) ??
        null
    );
}

function getSubsystemManufacturingPartInstance(
    bootstrap: BootstrapPayload,
    partDefinitionId: string | null,
    subsystemId: string,
): PartInstanceRecord | null {
    return (
        bootstrap.partInstances.find(
            (partInstance) =>
                partInstance.subsystemId === subsystemId &&
                (!partDefinitionId || partInstance.partDefinitionId === partDefinitionId),
        ) ?? null
    );
}

function getManufacturingDraftPartInstanceIds(draft: ManufacturingItemPayload) {
    return draft.partInstanceIds.length ? uniqueIds(draft.partInstanceIds) : uniqueIds([draft.partInstanceId]);
}

function getManufacturingPartInstancesByIds(
    bootstrap: BootstrapPayload,
    partInstanceIds: string[],
) {
    const partInstancesById = Object.fromEntries(
        bootstrap.partInstances.map((partInstance) => [partInstance.id, partInstance]),
    ) as Record<string, PartInstanceRecord>;

    return partInstanceIds
        .map((partInstanceId) => partInstancesById[partInstanceId])
        .filter((partInstance): partInstance is PartInstanceRecord => Boolean(partInstance));
}

function getManufacturingQuantityFromInstances(
    draft: ManufacturingItemPayload,
    partInstances: PartInstanceRecord[],
) {
    return partInstances.length > 0
        ? partInstances.reduce((total, partInstance) => total + Math.max(1, partInstance.quantity), 0)
        : draft.quantity;
}

function normalizeManufacturingPartInstanceSelection(
    bootstrap: BootstrapPayload,
    draft: ManufacturingItemPayload,
    partInstanceIds: string[],
) {
    const validPartInstanceIds = new Set(
        getManufacturingPartInstanceOptions(bootstrap, draft).map((partInstance) => partInstance.id),
    );
    const selectedPartInstances = getManufacturingPartInstancesByIds(
        bootstrap,
        uniqueIds(partInstanceIds).filter((partInstanceId) => validPartInstanceIds.has(partInstanceId)),
    );
    const primaryPartInstance = selectedPartInstances[0] ?? null;

    return {
        ...draft,
        partInstanceId: primaryPartInstance?.id ?? null,
        partInstanceIds: selectedPartInstances.map((partInstance) => partInstance.id),
        quantity: getManufacturingQuantityFromInstances(draft, selectedPartInstances),
        subsystemId: primaryPartInstance?.subsystemId ?? draft.subsystemId,
    };
}

export function getManufacturingPartInstanceOptions(
    bootstrap: BootstrapPayload,
    draft: ManufacturingItemPayload,
) {
    if (!draft.partDefinitionId) {
        return [];
    }

    return bootstrap.partInstances.filter(
        (partInstance) => partInstance.partDefinitionId === draft.partDefinitionId,
    );
}

export function inferManufacturingDraftFromPartSelection(
    bootstrap: BootstrapPayload,
    draft: ManufacturingItemPayload,
    partDefinitionId: string,
): ManufacturingItemPayload {
    const partDefinition = bootstrap.partDefinitions.find((part) => part.id === partDefinitionId) ?? null;
    if (!partDefinition) {
        return {
            ...draft,
            partDefinitionId: null,
            partInstanceId: null,
            partInstanceIds: [],
        };
    }

    const material = getManufacturingMaterialFromPart(bootstrap, partDefinition);
    const partInstance = getPreferredManufacturingPartInstance(
        bootstrap,
        partDefinition.id,
        draft.subsystemId,
    );
    const availablePartInstanceIds = new Set(
        bootstrap.partInstances
            .filter((candidate) => candidate.partDefinitionId === partDefinition.id)
            .map((candidate) => candidate.id),
    );
    const selectedPartInstanceIds = getManufacturingDraftPartInstanceIds(draft).filter(
        (partInstanceId) => availablePartInstanceIds.has(partInstanceId),
    );
    const nextPartInstanceIds = selectedPartInstanceIds.length
        ? selectedPartInstanceIds
        : uniqueIds([partInstance?.id]);

    return normalizeManufacturingPartInstanceSelection(bootstrap, {
        ...draft,
        title: partDefinition.name,
        material: material?.name ?? "",
        materialId: material?.id ?? null,
        partDefinitionId: partDefinition.id,
    }, nextPartInstanceIds);
}

export function inferManufacturingDraftFromSubsystemSelection(
    bootstrap: BootstrapPayload,
    draft: ManufacturingItemPayload,
    subsystemId: string,
): ManufacturingItemPayload {
    const partInstance = getSubsystemManufacturingPartInstance(
        bootstrap,
        draft.partDefinitionId,
        subsystemId,
    );

    return normalizeManufacturingPartInstanceSelection(bootstrap, {
        ...draft,
        subsystemId,
    }, uniqueIds([partInstance?.id]));
}

export function inferManufacturingDraftFromPartInstanceSelection(
    bootstrap: BootstrapPayload,
    draft: ManufacturingItemPayload,
    partInstanceId: string,
): ManufacturingItemPayload {
    const partInstance = bootstrap.partInstances.find((item) => item.id === partInstanceId) ?? null;
    if (!partInstance) {
        return {
            ...draft,
            partInstanceId: null,
            partInstanceIds: [],
        };
    }

    const partDefinition =
        bootstrap.partDefinitions.find((part) => part.id === partInstance.partDefinitionId) ?? null;
    const material = getManufacturingMaterialFromPart(bootstrap, partDefinition);

    return normalizeManufacturingPartInstanceSelection(bootstrap, {
        ...draft,
        title: partDefinition?.name ?? draft.title,
        material: material?.name ?? "",
        materialId: material?.id ?? null,
        partDefinitionId: partDefinition?.id ?? draft.partDefinitionId,
    }, [partInstance.id]);
}

export function toggleManufacturingDraftPartInstanceSelection(
    bootstrap: BootstrapPayload,
    draft: ManufacturingItemPayload,
    partInstanceId: string,
): ManufacturingItemPayload {
    const partInstance = bootstrap.partInstances.find((item) => item.id === partInstanceId) ?? null;
    if (!partInstance) {
        return normalizeManufacturingPartInstanceSelection(
            bootstrap,
            draft,
            getManufacturingDraftPartInstanceIds(draft),
        );
    }

    const currentPartInstanceIds = getManufacturingDraftPartInstanceIds(draft);
    const nextPartInstanceIds = currentPartInstanceIds.includes(partInstance.id)
        ? removeId(currentPartInstanceIds, partInstance.id)
        : uniqueIds([...currentPartInstanceIds, partInstance.id]);
    const partDefinition =
        bootstrap.partDefinitions.find((part) => part.id === partInstance.partDefinitionId) ?? null;
    const material = getManufacturingMaterialFromPart(bootstrap, partDefinition);

    return normalizeManufacturingPartInstanceSelection(bootstrap, {
        ...draft,
        title: partDefinition?.name ?? draft.title,
        material: material?.name ?? "",
        materialId: material?.id ?? null,
        partDefinitionId: partDefinition?.id ?? draft.partDefinitionId,
    }, nextPartInstanceIds);
}

export function inferManufacturingDraftFromProcessSelection(
    bootstrap: BootstrapPayload,
    draft: ManufacturingItemPayload,
    process: ManufacturingItemPayload["process"],
): ManufacturingItemPayload {
    const nextDraft = {
        ...draft,
        process,
        inHouse: process === "cnc" ? draft.inHouse ?? true : false,
    };

    if (nextDraft.partDefinitionId) {
        return inferManufacturingDraftFromPartSelection(
            bootstrap,
            nextDraft,
            nextDraft.partDefinitionId,
        );
    }

    const defaultPartDefinition = bootstrap.partDefinitions[0] ?? null;
    return defaultPartDefinition
        ? inferManufacturingDraftFromPartSelection(bootstrap, nextDraft, defaultPartDefinition.id)
        : nextDraft;
}

export function buildEmptyManufacturingPayload(
    bootstrap: BootstrapPayload,
    process: ManufacturingItemPayload["process"],
    defaultRequesterId: string | null = null,
): ManufacturingItemPayload {
    const firstMaterial = bootstrap.materials[0] ?? null;
    const firstPartDefinition = bootstrap.partDefinitions[0] ?? null;
    const requesterId =
        defaultRequesterId &&
        bootstrap.members.some((member) => member.id === defaultRequesterId)
            ? defaultRequesterId
            : bootstrap.members[0]?.id ?? null;
    const basePayload: ManufacturingItemPayload = {
        title: firstPartDefinition?.name ?? "",
        subsystemId: getDefaultSubsystemId(bootstrap),
        requestedById: requesterId,
        process,
        dueDate: localTodayDate(),
        material: firstMaterial?.name ?? "",
        materialId: firstMaterial?.id ?? null,
        partDefinitionId: firstPartDefinition?.id ?? null,
        partInstanceId: null,
        partInstanceIds: [],
        quantity: 1,
        status: "requested",
        mentorReviewed: false,
        inHouse: process === "cnc",
        batchLabel: "",
    };
    return firstPartDefinition
        ? inferManufacturingDraftFromPartSelection(bootstrap, basePayload, firstPartDefinition.id)
        : basePayload;
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

function getTaskDependencyDrafts(
  task: TaskRecord,
  bootstrap?: BootstrapPayload,
): TaskDependencyDraft[] {
  const explicitDependencies = bootstrap?.taskDependencies?.filter(
    (dependency) => dependency.downstreamTaskId === task.id,
  );

  if (explicitDependencies && explicitDependencies.length > 0) {
    return explicitDependencies.map((dependency) => ({
      id: dependency.id,
      upstreamTaskId: dependency.upstreamTaskId,
      dependencyType: dependency.dependencyType,
    }));
  }

  return uniqueIds(task.dependencyIds ?? []).map((upstreamTaskId) => ({
    upstreamTaskId,
    dependencyType: "finish_to_start",
  }));
}

export function buildEmptyReportPayload(
  bootstrap: BootstrapPayload,
  reportType: ReportType,
  defaults: {
    taskId?: string | null;
    eventId?: string | null;
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
  const event = defaults.eventId
    ? bootstrap.events.find((candidate) => candidate.id === defaults.eventId) ?? null
    : bootstrap.events[0] ?? null;
  const resolvedProjectId =
    defaults.projectId ??
    task?.projectId ??
    event?.projectIds?.[0] ??
    bootstrap.projects[0]?.id ??
    "";
  const resolvedWorkstreamId =
    defaults.workstreamId !== undefined
      ? defaults.workstreamId
      : task?.workstreamId ?? null;

  return {
    reportType,
    projectId: resolvedProjectId,
    taskId: defaults.taskId ?? task?.id ?? null,
    eventId: defaults.eventId ?? event?.id ?? null,
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
  const event = bootstrap.events[0] ?? null;

  return buildEmptyReportPayload(bootstrap, "EventTest", {
    eventId: event?.id ?? "",
    projectId: event?.projectIds?.[0] ?? bootstrap.projects[0]?.id ?? "",
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
        defaults.projectId &&
        bootstrap.projects.some((project) => project.id === defaults.projectId)
            ? defaults.projectId
            : bootstrap.projects[0]?.id ?? "";

    const resolvedWorkstreamId =
        defaults.workstreamId !== undefined
            ? defaults.workstreamId
            : bootstrap.workstreams.find((workstream) => workstream.projectId === resolvedProjectId)?.id ??
              null;

    const projectScopedWorkstreamId =
        resolvedWorkstreamId &&
        bootstrap.workstreams.some(
            (workstream) =>
                workstream.id === resolvedWorkstreamId &&
                workstream.projectId === resolvedProjectId,
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
        defaults.projectId &&
        bootstrap.projects.some((project) => project.id === defaults.projectId)
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
        subsystemId && subsystemId.length > 0
            ? subsystemId
            : getDefaultSubsystemId(bootstrap);

    return {
        subsystemId: firstSubsystem,
        name: "",
        description: "",
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
            : bootstrap.mechanisms.find((mechanism) => mechanism.subsystemId === firstSubsystem)?.id ??
              null;
    return {
        subsystemId: firstSubsystem,
        mechanismId: firstMechanism,
        partDefinitionId: defaults.partDefinitionId ?? bootstrap.partDefinitions[0]?.id ?? "",
        name: "",
        quantity: 1,
        trackIndividually: false,
        status: "planned",
        photoUrl: "",
    };
}

export const taskToPayload = (task: TaskRecord, bootstrap?: BootstrapPayload): TaskPayload => ({
  ...task,
  workstreamIds: task.workstreamIds?.length ? task.workstreamIds : uniqueIds([task.workstreamId]),
  subsystemIds: task.subsystemIds?.length ? task.subsystemIds : uniqueIds([task.subsystemId]),
  mechanismIds: task.mechanismIds?.length ? task.mechanismIds : uniqueIds([task.mechanismId]),
  partInstanceIds: task.partInstanceIds?.length ? task.partInstanceIds : uniqueIds([task.partInstanceId]),
  artifactId: task.artifactId ?? null,
  artifactIds: task.artifactIds?.length ? uniqueIds(task.artifactIds) : uniqueIds([task.artifactId]),
  photoUrl: task.photoUrl ?? "",
  assigneeIds: task.assigneeIds?.length ? uniqueIds(task.assigneeIds) : uniqueIds([task.ownerId]),
  blockers: task.blockers?.length ? uniqueIds(task.blockers) : [],
  taskBlockers: bootstrap
    ? getTaskOpenBlockersForTask(task.id, bootstrap).map((blocker) => ({
        id: blocker.id,
        blockerType: blocker.blockerType,
        blockerId: blocker.blockerId,
        description: blocker.description,
        severity: blocker.severity,
      }))
    : [],
  taskDependencies: getTaskDependencyDrafts(task, bootstrap),
});

export const purchaseToPayload = (item: PurchaseItemRecord): PurchaseItemPayload => ({
    ...item,
    partDefinitionId: item.partDefinitionId ?? null,
    finalCost: item.finalCost ?? undefined,
});

export const manufacturingToPayload = (item: ManufacturingItemRecord): ManufacturingItemPayload => ({
    ...item,
    materialId: item.materialId ?? null,
    partDefinitionId: item.partDefinitionId ?? null,
    partInstanceId: item.partInstanceId ?? null,
    partInstanceIds: item.partInstanceIds?.length ? uniqueIds(item.partInstanceIds) : uniqueIds([item.partInstanceId]),
    inHouse: item.process === "cnc" ? item.inHouse ?? true : false,
    batchLabel: item.batchLabel ?? "",
});

export const materialToPayload = (item: MaterialRecord): MaterialPayload => ({ ...item });

export const artifactToPayload = (item: ArtifactRecord): ArtifactPayload => ({
    ...item,
    workstreamId: item.workstreamId ?? null,
    summary: item.summary ?? "",
    link: item.link ?? "",
    isArchived: item.isArchived ?? false,
    updatedAt: item.updatedAt || new Date().toISOString(),
});

export const partDefinitionToPayload = (item: PartDefinitionRecord): PartDefinitionPayload => ({
    ...item,
    seasonId: item.seasonId,
    activeSeasonIds: item.activeSeasonIds ?? [item.seasonId],
    iteration: normalizeIteration(item.iteration),
    isArchived: item.isArchived ?? false,
    materialId: item.materialId ?? null,
    photoUrl: item.photoUrl ?? "",
});

export const subsystemToPayload = (item: SubsystemRecord): SubsystemPayload => ({
    ...item,
    color: resolveWorkspaceColor(item.color, `${item.projectId}:${item.id}:${item.name}`, item.iteration),
    isArchived: item.isArchived ?? false,
    iteration: normalizeIteration(item.iteration),
    photoUrl: item.photoUrl ?? "",
});

export const mechanismToPayload = (item: {
    subsystemId: string;
    name: string;
    description: string;
    iteration?: number;
    isArchived?: boolean;
    photoUrl?: string;
}): MechanismPayload => ({
    ...item,
    isArchived: item.isArchived ?? false,
    iteration: normalizeIteration(item.iteration),
    photoUrl: item.photoUrl ?? "",
});

export const workstreamToPayload = (item: WorkstreamRecord): WorkstreamPayload => ({
    ...item,
    color: resolveWorkspaceColor(item.color, `${item.projectId}:${item.id}:${item.name}`),
    isArchived: item.isArchived ?? false,
});

export const partInstanceToPayload = (item: PartInstanceRecord): PartInstancePayload => ({
    ...item,
    mechanismId: item.mechanismId ?? null,
    photoUrl: item.photoUrl ?? "",
});
