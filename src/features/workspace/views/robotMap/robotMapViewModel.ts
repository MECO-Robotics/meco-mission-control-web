import type { BootstrapPayload } from "@/types/bootstrap";
import type { SubsystemRecord } from "@/types/recordsOrganization";
import type { SubsystemLayoutFields } from "@/lib/appUtils/subsystemLayout";

import { resolveSubsystemLayout } from "./robotMapLayout";

export interface RobotConfigurationPartModel {
  id: string;
  name: string;
  quantity: number;
  record: BootstrapPayload["partInstances"][number];
}

export interface RobotConfigurationMechanismModel {
  id: string;
  name: string;
  description: string;
  partCount: number;
  parts: RobotConfigurationPartModel[];
  record: BootstrapPayload["mechanisms"][number];
}

export interface RobotConfigurationSubsystemModel {
  id: string;
  description: string;
  isArchived: boolean;
  layout: SubsystemLayoutFields;
  mechanismCount: number;
  mechanisms: RobotConfigurationMechanismModel[];
  name: string;
  partCount: number;
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

  const normalizedSearch = search.trim().toLowerCase();

  const subsystems = bootstrap.subsystems
    .map<RobotConfigurationSubsystemModel>((subsystem) => {
      const subsystemMechanisms = (mechanismsBySubsystemId[subsystem.id] ?? [])
        .filter((mechanism) => !mechanism.isArchived)
        .sort((left, right) => left.name.localeCompare(right.name));
      const mechanisms = subsystemMechanisms.map<RobotConfigurationMechanismModel>((mechanism) => {
        const parts = (partInstancesByMechanismId[mechanism.id] ?? [])
          .map<RobotConfigurationPartModel>((partInstance) => ({
            id: partInstance.id,
            name: partInstance.name,
            quantity: Math.max(1, partInstance.quantity),
            record: partInstance,
          }))
          .sort((left, right) => left.name.localeCompare(right.name));

        return {
          id: mechanism.id,
          name: mechanism.name,
          description: mechanism.description,
          partCount: parts.reduce((total, part) => total + part.quantity, 0),
          parts,
          record: mechanism,
        };
      });

      return {
        id: subsystem.id,
        description: subsystem.description,
        isArchived: subsystem.isArchived ?? false,
        layout: resolveSubsystemLayout(subsystem),
        mechanismCount: mechanisms.length,
        mechanisms,
        name: subsystem.name,
        partCount: mechanisms.reduce((total, mechanism) => total + mechanism.partCount, 0),
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

      return `${subsystem.name} ${subsystem.description} ${mechanismText} ${partsText}`
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
