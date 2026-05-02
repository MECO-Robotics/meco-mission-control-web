import type { BootstrapPayload, MechanismRecord, SubsystemRecord } from "@/types";
import type { MembersById } from "@/features/workspace/shared";

export interface SubsystemsViewProps {
  bootstrap: BootstrapPayload;
  membersById: MembersById;
  openCreateMechanismModal: (subsystemId?: string) => void;
  openCreatePartInstanceModal: (mechanism: BootstrapPayload["mechanisms"][number]) => void;
  openCreateSubsystemModal: () => void;
  openEditMechanismModal: (mechanism: MechanismRecord) => void;
  openEditPartInstanceModal: (partInstance: BootstrapPayload["partInstances"][number]) => void;
  openEditSubsystemModal: (subsystem: SubsystemRecord) => void;
}

export interface SubsystemCounts {
  mechanisms: number;
  parts: number;
  tasks: number;
  openTasks: number;
}

export type SubsystemCountsById = Record<string, SubsystemCounts>;
