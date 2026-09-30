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
  riskCount: number;
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
  riskCount: number;
  linkedWorkLogs: RobotConfigurationDrilldownLinkModel[];
  record: SubsystemRecord;
}

export interface RobotConfigurationViewModel {
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
    includesId(task.subsystemIds, subsystemId) ||
    task.mechanismIds.some((mechanismId) => mechanismIds.has(mechanismId)) ||
    task.partInstanceIds.some((partInstanceId) => partInstanceIds.has(partInstanceId))
  );
}

function riskTargetsSubsystem(
  risk: BootstrapPayload["risks"][number],
  mechanismIds: ReadonlySet<string>,
  partInstanceIds: ReadonlySet<string>,
) {
  return (risk.relatedTargets ?? []).some((ref) =>
    (ref.kind === "mechanism" && mechanismIds.has(ref.id)) ||
    (ref.kind === "part-instance" && partInstanceIds.has(ref.id)),
  );
}

function sortLinks(left: RobotConfigurationDrilldownLinkModel, right: RobotConfigurationDrilldownLinkModel) {
  return left.label.localeCompare(right.label);
}

function buildPartModel(
  partInstance: BootstrapPayload["partInstances"][number],
  partDefinitionsById: ReadonlyMap<string, BootstrapPayload["partDefinitions"][number]>,
  risks: BootstrapPayload["risks"],
): RobotConfigurationPartModel {
  return {
    cadSource: resolveCadSourceIndicator(partInstance, partDefinitionsById.get(partInstance.partDefinitionId)),
    id: partInstance.id,
    name: partDefinitionsById.get(partInstance.partDefinitionId)?.name ?? "Unnamed part",
    quantity: 1,
    riskCount: risks.filter((risk) => risk.relatedTargets.some((ref) => ref.kind === "part-instance" && ref.id === partInstance.id)).length,
    record: partInstance,
  };
}

export function buildRobotConfigurationViewModel(
  bootstrap: BootstrapPayload,
  search = "",
): RobotConfigurationViewModel {
  const partInstancesByMechanismId = bootstrap.partInstances.reduce<Record<string, BootstrapPayload["partInstances"]>>(
    (result, partInstance) => {
      if (!partInstance.intendedMechanismId) {
        return result;
      }

      result[partInstance.intendedMechanismId] = result[partInstance.intendedMechanismId] ?? [];
      result[partInstance.intendedMechanismId].push(partInstance);
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
          .map((partInstance) => buildPartModel(partInstance, partDefinitionsById, bootstrap.risks))
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
            partInstance.intendedSubsystemId === subsystem.id &&
            (!partInstance.intendedMechanismId || mechanismIds.has(partInstance.intendedMechanismId)),
        )
        .map((partInstance) => buildPartModel(partInstance, partDefinitionsById, bootstrap.risks))
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
      const linkedRisks = bootstrap.risks.filter((risk) =>
        riskTargetsSubsystem(risk, mechanismIds, partInstanceIds),
      ).map((risk) => ({ id: risk.id, label: risk.title, meta: risk.severity }))
        .sort(sortLinks);

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
        linkedRisks,
        riskCount: linkedRisks.length,
        linkedWorkLogs: bootstrap.workLogs
          .filter((workLog) => linkedTaskIds.has(workLog.taskId))
          .map<RobotConfigurationDrilldownLinkModel>((workLog) => ({
            id: workLog.id,
            label: workLog.notes || workLog.date,
            meta: `${workLog.hours}h / ${workLog.date}`,
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
    subsystems,
  };
}
