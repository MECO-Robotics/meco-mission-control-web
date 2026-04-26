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
  SubsystemPayload,
  SubsystemRecord,
  TaskPayload,
  TaskRecord,
  WorkLogPayload,
  WorkstreamPayload,
} from "@/types";

export function toErrorMessage(error: unknown) {
    if (error instanceof Error) return error.message;
    return "Something went wrong while checking your session.";
}

export function getDefaultSubsystemId(bootstrap: BootstrapPayload) {
    return bootstrap.subsystems.find((subsystem) => subsystem.isCore)?.id ?? bootstrap.subsystems[0]?.id ?? "";
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

function uniqueIds(values: Array<string | null | undefined>) {
    return Array.from(
        new Set(values.filter((value): value is string => Boolean(value))),
    );
}

export function normalizeIteration(value: number | null | undefined) {
    return Number.isFinite(value) && value && value >= 1 ? Math.trunc(value) : 1;
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
    const firstDiscipline = bootstrap.disciplines[0]?.id ?? "";
    const firstEvent = bootstrap.events[0]?.id ?? null;
    const firstStudent =
        bootstrap.members.find((m) => m.role === "lead")?.id ??
        bootstrap.members.find((m) => m.role === "student")?.id ??
        bootstrap.members[0]?.id ??
        null;
    const firstMentor = bootstrap.members.find((m) => m.role === "mentor")?.id ?? bootstrap.members[0]?.id ?? null;
    const today = new Date().toISOString().slice(0, 10);

    return {
        projectId: firstProject,
        workstreamId: null,
        workstreamIds: [],
        title: "",
        summary: "",
        subsystemId: firstSubsystem,
        subsystemIds: uniqueIds([firstSubsystem]),
        disciplineId: firstDiscipline,
        mechanismId: null,
        mechanismIds: [],
        partInstanceId: null,
        partInstanceIds: [],
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
        dependencyIds: [],
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

export function buildEmptyManufacturingPayload(bootstrap: BootstrapPayload, process: ManufacturingItemPayload["process"]): ManufacturingItemPayload {
    const firstMaterial = bootstrap.materials[0] ?? null;
    const firstPartDefinition = process === "fabrication" ? null : bootstrap.partDefinitions[0] ?? null;
    return {
        title: firstPartDefinition?.name ?? "",
        subsystemId: getDefaultSubsystemId(bootstrap),
        requestedById: bootstrap.members[0]?.id ?? null,
        process,
        dueDate: new Date().toISOString().slice(0, 10),
        material: firstMaterial?.name ?? "",
        materialId: firstMaterial?.id ?? null,
        partDefinitionId: firstPartDefinition?.id ?? null,
        partInstanceId: bootstrap.partInstances[0]?.id ?? null,
        quantity: 1,
        status: "requested",
        mentorReviewed: false,
        batchLabel: "",
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
    date: new Date().toISOString().slice(0, 10),
    hours: 1,
    participantIds: participantId ? [participantId] : [],
    notes: "",
  };
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
        description: "",
    };
}

export function buildEmptyPartDefinitionPayload(bootstrap: BootstrapPayload): PartDefinitionPayload {
    return {
        name: "",
        partNumber: "",
        revision: "A",
        iteration: 1,
        type: "custom",
        source: "",
        materialId: bootstrap.materials[0]?.id ?? null,
        description: "",
    };
}

export function buildEmptySubsystemPayload(bootstrap: BootstrapPayload): SubsystemPayload {
    const defaultProjectId = bootstrap.projects[0]?.id ?? "";
    const defaultParentSubsystemId =
        (
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
        description: "",
        iteration: 1,
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
        iteration: 1,
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
    };
}

export const taskToPayload = (task: TaskRecord): TaskPayload => ({
    ...task,
    workstreamIds: task.workstreamIds?.length ? task.workstreamIds : uniqueIds([task.workstreamId]),
    subsystemIds: task.subsystemIds?.length ? task.subsystemIds : uniqueIds([task.subsystemId]),
    mechanismIds: task.mechanismIds?.length ? task.mechanismIds : uniqueIds([task.mechanismId]),
    partInstanceIds: task.partInstanceIds?.length ? task.partInstanceIds : uniqueIds([task.partInstanceId]),
    assigneeIds: task.assigneeIds?.length ? uniqueIds(task.assigneeIds) : uniqueIds([task.ownerId]),
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
    batchLabel: item.batchLabel ?? "",
});

export const materialToPayload = (item: MaterialRecord): MaterialPayload => ({ ...item });

export const artifactToPayload = (item: ArtifactRecord): ArtifactPayload => ({
    ...item,
    workstreamId: item.workstreamId ?? null,
    summary: item.summary ?? "",
    link: item.link ?? "",
    updatedAt: item.updatedAt || new Date().toISOString(),
});

export const partDefinitionToPayload = (item: PartDefinitionRecord): PartDefinitionPayload => ({
    ...item,
    iteration: normalizeIteration(item.iteration),
    materialId: item.materialId ?? null,
});

export const subsystemToPayload = (item: SubsystemRecord): SubsystemPayload => ({
    ...item,
    iteration: normalizeIteration(item.iteration),
});

export const mechanismToPayload = (item: {
    subsystemId: string;
    name: string;
    description: string;
    iteration?: number;
}): MechanismPayload => ({
    ...item,
    iteration: normalizeIteration(item.iteration),
});

export const partInstanceToPayload = (item: PartInstanceRecord): PartInstancePayload => ({
    ...item,
    mechanismId: item.mechanismId ?? null,
});

