import type { BootstrapPayload } from "@/types/bootstrap";

export interface PartMappingsSummaryCard {
  id: string;
  label: string;
  value: number;
}

export interface PartDefinitionMappingRow {
  definition: BootstrapPayload["partDefinitions"][number];
  instanceCount: number;
  isMapped: boolean;
  manufacturingOpenCount: number;
  mechanismLabels: string[];
  openTaskCount: number;
  purchaseOpenCount: number;
  riskCount: number;
  subsystemLabels: string[];
}

export interface MechanismMappingRow {
  definitionCount: number;
  id: string;
  instanceCount: number;
  manufacturingOpenCount: number;
  name: string;
  openTaskCount: number;
  riskCount: number;
  subsystemName: string;
}

export interface PartMappingsViewModel {
  mappedDefinitionRows: PartDefinitionMappingRow[];
  mechanismRows: MechanismMappingRow[];
  summaryCards: PartMappingsSummaryCard[];
  unmappedDefinitionRows: PartDefinitionMappingRow[];
}

const PART_MAPPING_EMPTY_LABEL = "Unassigned";

function linkCountLabels(ids: string[], namesById: Record<string, string>) {
  const countsById = new Map<string, number>();
  ids.forEach((id) => {
    countsById.set(id, (countsById.get(id) ?? 0) + 1);
  });

  return [...countsById.entries()]
    .map(([id, count]) => `${namesById[id] ?? PART_MAPPING_EMPTY_LABEL} (${count})`)
    .sort((left, right) => left.localeCompare(right));
}

function taskLinksToInstances(
  task: BootstrapPayload["tasks"][number],
  instanceIds: Set<string>,
) {
  if (task.partInstanceId && instanceIds.has(task.partInstanceId)) {
    return true;
  }

  return task.partInstanceIds.some((instanceId) => instanceIds.has(instanceId));
}

function taskLinksToMechanism(
  task: BootstrapPayload["tasks"][number],
  mechanismId: string,
  instanceIds: Set<string>,
) {
  if (task.mechanismId === mechanismId || task.mechanismIds.includes(mechanismId)) {
    return true;
  }

  return taskLinksToInstances(task, instanceIds);
}

function manufacturingLinksToInstances(
  item: BootstrapPayload["manufacturingItems"][number],
  instanceIds: Set<string>,
) {
  if (item.partInstanceId && instanceIds.has(item.partInstanceId)) {
    return true;
  }

  return item.partInstanceIds.some((instanceId) => instanceIds.has(instanceId));
}

export function buildPartMappingsViewModel(
  bootstrap: BootstrapPayload,
): PartMappingsViewModel {
  const subsystemsById = Object.fromEntries(
    bootstrap.subsystems.map((subsystem) => [subsystem.id, subsystem] as const),
  );
  const subsystemNamesById = Object.fromEntries(
    bootstrap.subsystems.map((subsystem) => [subsystem.id, subsystem.name] as const),
  );
  const mechanismNamesById = Object.fromEntries(
    bootstrap.mechanisms.map((mechanism) => [mechanism.id, mechanism.name] as const),
  );

  const openTasks = bootstrap.tasks.filter((task) => task.status !== "complete");
  const openManufacturing = bootstrap.manufacturingItems.filter((item) => item.status !== "complete");
  const openPurchases = bootstrap.purchaseItems.filter((item) => item.status !== "delivered");

  const instancesByDefinitionId = new Map<string, BootstrapPayload["partInstances"]>();
  const mechanismInstanceIds = new Map<string, Set<string>>();
  const mechanismDefinitionIds = new Map<string, Set<string>>();

  bootstrap.partInstances.forEach((instance) => {
    const rows = instancesByDefinitionId.get(instance.partDefinitionId) ?? [];
    rows.push(instance);
    instancesByDefinitionId.set(instance.partDefinitionId, rows);

    if (instance.mechanismId) {
      const instanceIds = mechanismInstanceIds.get(instance.mechanismId) ?? new Set<string>();
      instanceIds.add(instance.id);
      mechanismInstanceIds.set(instance.mechanismId, instanceIds);

      const definitionIds = mechanismDefinitionIds.get(instance.mechanismId) ?? new Set<string>();
      definitionIds.add(instance.partDefinitionId);
      mechanismDefinitionIds.set(instance.mechanismId, definitionIds);
    }
  });

  const definitionRows = bootstrap.partDefinitions.map<PartDefinitionMappingRow>((definition) => {
    const instances = instancesByDefinitionId.get(definition.id) ?? [];
    const instanceIds = new Set(instances.map((instance) => instance.id));
    const mechanismIds = new Set(
      instances
        .map((instance) => instance.mechanismId)
        .filter((mechanismId): mechanismId is string => Boolean(mechanismId)),
    );

    const subsystemLabels = linkCountLabels(
      instances.map((instance) => instance.subsystemId),
      subsystemNamesById,
    );
    const mechanismLabels = linkCountLabels(
      instances
        .map((instance) => instance.mechanismId)
        .filter((mechanismId): mechanismId is string => Boolean(mechanismId)),
      mechanismNamesById,
    );

    const openTaskCount = openTasks.filter((task) => taskLinksToInstances(task, instanceIds)).length;
    const riskCount = bootstrap.risks.filter((risk) => {
      if (risk.attachmentType === "part-instance") {
        return instanceIds.has(risk.attachmentId);
      }

      if (risk.attachmentType === "mechanism") {
        return mechanismIds.has(risk.attachmentId);
      }

      return false;
    }).length;

    const manufacturingOpenCount = openManufacturing.filter(
      (item) =>
        item.partDefinitionId === definition.id || manufacturingLinksToInstances(item, instanceIds),
    ).length;
    const purchaseOpenCount = openPurchases.filter(
      (item) => item.partDefinitionId === definition.id,
    ).length;

    return {
      definition,
      instanceCount: instances.length,
      isMapped: instances.length > 0,
      manufacturingOpenCount,
      mechanismLabels,
      openTaskCount,
      purchaseOpenCount,
      riskCount,
      subsystemLabels,
    };
  });

  const mappedDefinitionRows = definitionRows
    .filter((row) => row.isMapped)
    .sort((left, right) => left.definition.name.localeCompare(right.definition.name));
  const unmappedDefinitionRows = definitionRows
    .filter((row) => !row.isMapped)
    .sort((left, right) => left.definition.name.localeCompare(right.definition.name));

  const mechanismRows = bootstrap.mechanisms
    .map<MechanismMappingRow>((mechanism) => {
      const instanceIds = mechanismInstanceIds.get(mechanism.id) ?? new Set<string>();
      const definitionIds = mechanismDefinitionIds.get(mechanism.id) ?? new Set<string>();

      const openTaskCount = openTasks.filter((task) =>
        taskLinksToMechanism(task, mechanism.id, instanceIds),
      ).length;
      const riskCount = bootstrap.risks.filter((risk) => {
        if (risk.attachmentType === "mechanism") {
          return risk.attachmentId === mechanism.id;
        }

        if (risk.attachmentType === "part-instance") {
          return instanceIds.has(risk.attachmentId);
        }

        return false;
      }).length;

      const manufacturingOpenCount = openManufacturing.filter((item) => {
        if (manufacturingLinksToInstances(item, instanceIds)) {
          return true;
        }

        return item.partDefinitionId ? definitionIds.has(item.partDefinitionId) : false;
      }).length;

      return {
        definitionCount: definitionIds.size,
        id: mechanism.id,
        instanceCount: instanceIds.size,
        manufacturingOpenCount,
        name: mechanism.name,
        openTaskCount,
        riskCount,
        subsystemName: subsystemsById[mechanism.subsystemId]?.name ?? PART_MAPPING_EMPTY_LABEL,
      };
    })
    .sort((left, right) => {
      const subsystemCompare = left.subsystemName.localeCompare(right.subsystemName);
      if (subsystemCompare !== 0) {
        return subsystemCompare;
      }

      return left.name.localeCompare(right.name);
    });

  const unassignedInstances = bootstrap.partInstances.filter((instance) => !instance.mechanismId).length;

  const summaryCards: PartMappingsSummaryCard[] = [
    { id: "definitions", label: "Part definitions", value: bootstrap.partDefinitions.length },
    { id: "mapped-definitions", label: "Mapped definitions", value: mappedDefinitionRows.length },
    {
      id: "unmapped-definitions",
      label: "Need mapping",
      value: unmappedDefinitionRows.length,
    },
    { id: "instances", label: "Part instances", value: bootstrap.partInstances.length },
    { id: "unassigned-instances", label: "Unassigned instances", value: unassignedInstances },
    {
      id: "mechanisms-with-parts",
      label: "Mechanisms with parts",
      value: mechanismRows.filter((row) => row.instanceCount > 0).length,
    },
  ];

  return {
    mappedDefinitionRows,
    mechanismRows,
    summaryCards,
    unmappedDefinitionRows,
  };
}
