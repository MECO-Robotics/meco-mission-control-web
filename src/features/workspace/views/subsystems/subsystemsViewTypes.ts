import type { BootstrapPayload } from "@/types/bootstrap";
import type { MechanismRecord, SubsystemRecord } from "@/types/recordsOrganization";
import type { MembersById } from "@/features/workspace/shared/model/workspaceTypes";

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
