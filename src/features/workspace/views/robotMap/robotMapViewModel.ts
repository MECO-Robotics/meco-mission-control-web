import type { BootstrapPayload } from "@/types/bootstrap";
import type { SubsystemRecord } from "@/types/recordsOrganization";
import type { SubsystemLayoutFields } from "@/lib/appUtils/subsystemLayout";

import { resolveCadSourceIndicator, type CadSourceIndicatorModel } from "./cadSourceIndicator";
import { resolveSubsystemLayout } from "./robotMapLayout";

export interface RobotConfigurationPartModel {
  cadSource: CadSourceIndicatorModel;
  id: string;
  name: string;
  quantity: number;
  definitionPhotoUrl?: string;
  record: BootstrapPayload["partInstances"][number];
}

export interface RobotConfigurationDrilldownLinkModel {
  id: string;
  label: string;
  meta: string;
}

export interface RobotConfigurationMechanismModel {
  cadSource: CadSourceIndicatorModel;
  id: string;
  name: string;
  description: string;
  partCount: number;
  parts: RobotConfigurationPartModel[];
  record: BootstrapPayload["mechanisms"][number];
}

export interface RobotConfigurationSubsystemModel {
  cadSource: CadSourceIndicatorModel;
  id: string;
  description: string;
  isArchived: boolean;
  layout: SubsystemLayoutFields;
  mechanismCount: number;
  mechanisms: RobotConfigurationMechanismModel[];
  name: string;
  partCount: number;
  linkedMechanisms: RobotConfigurationDrilldownLinkModel[];
  linkedParts: RobotConfigurationDrilldownLinkModel[];
  linkedTasks: RobotConfigurationDrilldownLinkModel[];
  linkedRisks: RobotConfigurationDrilldownLinkModel[];
  linkedWorkLogs: RobotConfigurationDrilldownLinkModel[];
  linkedManufacturingItems: RobotConfigurationDrilldownLinkModel[];
  record: SubsystemRecord;
}

export interface RobotConfigurationViewModel {
  subsystemCount: number;
  mechanismCount: number;
  partCount: number;
  subsystems: RobotConfigurationSubsystemModel[];
}

function sortSubsystemsByLayout(left: RobotConfigurationSubsystemModel, right: RobotConfigurationSubsystemModel) {
  const leftSortOrder = left.layout.sortOrder ?? Number.POSITIVE_INFINITY;
  const rightSortOrder = right.layout.sortOrder ?? Number.POSITIVE_INFINITY;

  if (leftSortOrder !== rightSortOrder) {
    return leftSortOrder - rightSortOrder;
  }

  return left.name.localeCompare(right.name);
}

function includesId(values: readonly string[] | undefined, id: string) {
  return values?.includes(id) ?? false;
}

function taskTargetsSubsystem(
  task: BootstrapPayload["tasks"][number],
  subsystemId: string,
  mechanismIds: ReadonlySet<string>,
  partInstanceIds: ReadonlySet<string>,
) {
  return (
    task.subsystemId === subsystemId ||
    includesId(task.subsystemIds, subsystemId) ||
    (task.mechanismId ? mechanismIds.has(task.mechanismId) : false) ||
    task.mechanismIds.some((mechanismId) => mechanismIds.has(mechanismId)) ||
    (task.partInstanceId ? partInstanceIds.has(task.partInstanceId) : false) ||
    task.partInstanceIds.some((partInstanceId) => partInstanceIds.has(partInstanceId))
  );
}

function riskTargetsSubsystem(
  risk: BootstrapPayload["risks"][number],
  mechanismIds: ReadonlySet<string>,
  partInstanceIds: ReadonlySet<string>,
) {
  if (risk.attachmentType === "mechanism") {
    return mechanismIds.has(risk.attachmentId);
  }

  if (risk.attachmentType === "part-instance") {
    return partInstanceIds.has(risk.attachmentId);
  }

  return false;
}

function manufacturingTargetsSubsystem(
  item: BootstrapPayload["manufacturingItems"][number],
  subsystemId: string,
  partInstanceIds: ReadonlySet<string>,
) {
  return (
    item.subsystemId === subsystemId ||
    (item.partInstanceId ? partInstanceIds.has(item.partInstanceId) : false) ||
    item.partInstanceIds.some((partInstanceId) => partInstanceIds.has(partInstanceId))
  );
}

function sortLinks(left: RobotConfigurationDrilldownLinkModel, right: RobotConfigurationDrilldownLinkModel) {
  return left.label.localeCompare(right.label);
}

function buildPartModel(
  partInstance: BootstrapPayload["partInstances"][number],
  partDefinitionsById: ReadonlyMap<string, BootstrapPayload["partDefinitions"][number]>,
): RobotConfigurationPartModel {
  return {
    cadSource: resolveCadSourceIndicator(partInstance, partDefinitionsById.get(partInstance.partDefinitionId)),
    id: partInstance.id,
    name: partInstance.name,
    quantity: Math.max(1, partInstance.quantity),
    definitionPhotoUrl: partDefinitionsById.get(partInstance.partDefinitionId)?.photoUrl,
    record: partInstance,
  };
}

export function buildRobotConfigurationViewModel(
  bootstrap: BootstrapPayload,
  search = "",
): RobotConfigurationViewModel {
  const partInstancesByMechanismId = bootstrap.partInstances.reduce<Record<string, BootstrapPayload["partInstances"]>>(
    (result, partInstance) => {
      if (!partInstance.mechanismId) {
        return result;
      }

      result[partInstance.mechanismId] = result[partInstance.mechanismId] ?? [];
      result[partInstance.mechanismId].push(partInstance);
      return result;
    },
    {},
  );

  const mechanismsBySubsystemId = bootstrap.mechanisms.reduce<Record<string, BootstrapPayload["mechanisms"]>>(
    (result, mechanism) => {
      result[mechanism.subsystemId] = result[mechanism.subsystemId] ?? [];
      result[mechanism.subsystemId].push(mechanism);
      return result;
    },
    {},
  );
  const partDefinitionsById = new Map(bootstrap.partDefinitions.map((partDefinition) => [partDefinition.id, partDefinition]));

  const normalizedSearch = search.trim().toLowerCase();

  const subsystems = bootstrap.subsystems
    .map<RobotConfigurationSubsystemModel>((subsystem) => {
      const subsystemMechanisms = (mechanismsBySubsystemId[subsystem.id] ?? [])
        .filter((mechanism) => !mechanism.isArchived)
        .sort((left, right) => left.name.localeCompare(right.name));
      const mechanisms = subsystemMechanisms.map<RobotConfigurationMechanismModel>((mechanism) => {
        const parts = (partInstancesByMechanismId[mechanism.id] ?? [])
          .map((partInstance) => buildPartModel(partInstance, partDefinitionsById))
          .sort((left, right) => left.name.localeCompare(right.name));

        return {
          cadSource: resolveCadSourceIndicator(mechanism),
          id: mechanism.id,
          name: mechanism.name,
          description: mechanism.description,
          partCount: parts.reduce((total, part) => total + part.quantity, 0),
          parts,
          record: mechanism,
        };
      });
      const mechanismIds = new Set(mechanisms.map((mechanism) => mechanism.id));
      const linkedPartsById = new Map(
        mechanisms.flatMap((mechanism) => mechanism.parts).map((part) => [part.id, part] as const),
      );
      bootstrap.partInstances
        .filter(
          (partInstance) =>
            partInstance.subsystemId === subsystem.id &&
            (!partInstance.mechanismId || mechanismIds.has(partInstance.mechanismId)),
        )
        .map((partInstance) => buildPartModel(partInstance, partDefinitionsById))
        .forEach((part) => linkedPartsById.set(part.id, part));
      const linkedParts = [...linkedPartsById.values()].sort((left, right) => left.name.localeCompare(right.name));
      const partInstanceIds = new Set(linkedParts.map((part) => part.id));
      const linkedTasks = bootstrap.tasks
        .filter((task) => taskTargetsSubsystem(task, subsystem.id, mechanismIds, partInstanceIds))
        .map<RobotConfigurationDrilldownLinkModel>((task) => ({
          id: task.id,
          label: task.title,
          meta: `${task.status} / ${task.priority}`,
        }))
        .sort(sortLinks);
      const linkedTaskIds = new Set(linkedTasks.map((task) => task.id));
      const linkedManufacturingIdsFromTasks = new Set(
        bootstrap.tasks
          .filter((task) => linkedTaskIds.has(task.id))
          .flatMap((task) => task.linkedManufacturingIds),
      );

      return {
        cadSource: resolveCadSourceIndicator(subsystem),
        id: subsystem.id,
        description: subsystem.description,
        isArchived: subsystem.isArchived ?? false,
        layout: resolveSubsystemLayout(subsystem),
        mechanismCount: mechanisms.length,
        mechanisms,
        name: subsystem.name,
        partCount: linkedParts.reduce((total, part) => total + part.quantity, 0),
        linkedMechanisms: mechanisms
          .map<RobotConfigurationDrilldownLinkModel>((mechanism) => ({
            id: mechanism.id,
            label: mechanism.name,
            meta: `${mechanism.partCount} parts`,
          }))
          .sort(sortLinks),
        linkedParts: linkedParts
          .map<RobotConfigurationDrilldownLinkModel>((part) => ({
            id: part.id,
            label: part.name,
            meta: `${part.quantity} needed`,
          }))
          .sort(sortLinks),
        linkedTasks,
        linkedRisks: bootstrap.risks
          .filter((risk) => riskTargetsSubsystem(risk, mechanismIds, partInstanceIds))
          .map<RobotConfigurationDrilldownLinkModel>((risk) => ({
            id: risk.id,
            label: risk.title,
            meta: risk.severity,
          }))
          .sort(sortLinks),
        linkedWorkLogs: bootstrap.workLogs
          .filter((workLog) => linkedTaskIds.has(workLog.taskId))
          .map<RobotConfigurationDrilldownLinkModel>((workLog) => ({
            id: workLog.id,
            label: workLog.notes || workLog.date,
            meta: `${workLog.hours}h / ${workLog.date}`,
          }))
          .sort(sortLinks),
        linkedManufacturingItems: bootstrap.manufacturingItems
          .filter(
            (item) =>
              manufacturingTargetsSubsystem(item, subsystem.id, partInstanceIds) ||
              linkedManufacturingIdsFromTasks.has(item.id),
          )
          .map<RobotConfigurationDrilldownLinkModel>((item) => ({
            id: item.id,
            label: item.title,
            meta: `${item.process} / ${item.status}`,
          }))
          .sort(sortLinks),
        record: subsystem,
      };
    })
    .filter((subsystem) => {
      if (normalizedSearch.length === 0) {
        return true;
      }

      const mechanismText = subsystem.mechanisms
        .map((mechanism) => `${mechanism.name} ${mechanism.description}`)
        .join(" ");
      const partsText = subsystem.mechanisms
        .flatMap((mechanism) => mechanism.parts)
        .map((part) => part.name)
        .join(" ");
      const linkedPartsText = subsystem.linkedParts.map((part) => part.label).join(" ");

      return `${subsystem.name} ${subsystem.description} ${mechanismText} ${partsText} ${linkedPartsText}`
        .toLowerCase()
        .includes(normalizedSearch);
    })
    .sort(sortSubsystemsByLayout);

  return {
    subsystemCount: subsystems.length,
    mechanismCount: subsystems.reduce((total, subsystem) => total + subsystem.mechanismCount, 0),
    partCount: subsystems.reduce((total, subsystem) => total + subsystem.partCount, 0),
    subsystems,
  };
}
