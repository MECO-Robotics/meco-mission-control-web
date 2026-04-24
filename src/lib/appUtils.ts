import type {
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
} from "../types";

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

export function buildEmptyTaskPayload(bootstrap: BootstrapPayload): TaskPayload {
    const firstSubsystem = getDefaultSubsystemId(bootstrap);
    const firstDiscipline = bootstrap.disciplines[0]?.id ?? "";
    const firstRequirement =
        bootstrap.requirements.find((requirement) => requirement.subsystemId === firstSubsystem)?.id ??
        null;
    const firstMechanism =
        bootstrap.mechanisms.find((mechanism) => mechanism.subsystemId === firstSubsystem)?.id ??
        null;
    const firstPartInstance =
        firstMechanism
            ? bootstrap.partInstances.find(
                (partInstance) => partInstance.mechanismId === firstMechanism,
            )?.id ?? null
            : null;
    const firstEvent = bootstrap.events[0]?.id ?? null;
    const firstStudent =
        bootstrap.members.find((m) => m.role === "lead")?.id ??
        bootstrap.members.find((m) => m.role === "student")?.id ??
        bootstrap.members[0]?.id ??
        null;
    const firstMentor = bootstrap.members.find((m) => m.role === "mentor")?.id ?? bootstrap.members[0]?.id ?? null;
    const today = new Date().toISOString().slice(0, 10);

    return {
        title: "",
        summary: "",
        subsystemId: firstSubsystem,
        disciplineId: firstDiscipline,
        requirementId: firstRequirement,
        mechanismId: firstMechanism,
        partInstanceId: firstPartInstance,
        targetEventId: firstEvent,
        ownerId: firstStudent,
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

export function buildEmptyPartDefinitionPayload(bootstrap: BootstrapPayload): PartDefinitionPayload {
    return {
        name: "",
        partNumber: "",
        revision: "A",
        type: "custom",
        source: "",
        materialId: bootstrap.materials[0]?.id ?? null,
        description: "",
    };
}

export function buildEmptySubsystemPayload(bootstrap: BootstrapPayload): SubsystemPayload {
    const defaultParentSubsystemId = getDefaultSubsystemId(bootstrap) || null;
    const firstResponsibleEngineer =
        bootstrap.members.find((member) => member.role === "lead")?.id ??
        bootstrap.members.find((member) => member.role === "student")?.id ??
        bootstrap.members[0]?.id ??
        null;
    const firstMentor = bootstrap.members.find((member) => member.role === "mentor")?.id ?? null;

    return {
        name: "",
        description: "",
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

export const taskToPayload = (task: TaskRecord): TaskPayload => ({ ...task });

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

export const partDefinitionToPayload = (item: PartDefinitionRecord): PartDefinitionPayload => ({
    ...item,
    materialId: item.materialId ?? null,
});

export const subsystemToPayload = (item: SubsystemRecord): SubsystemPayload => ({
    ...item,
});

export const mechanismToPayload = (item: {
    subsystemId: string;
    name: string;
    description: string;
}): MechanismPayload => ({
    ...item,
});

export const partInstanceToPayload = (item: PartInstanceRecord): PartInstancePayload => ({
    ...item,
    mechanismId: item.mechanismId ?? null,
});
