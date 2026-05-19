import type { BootstrapPayload } from "@/types/bootstrap";
import type { PartDefinitionPayload, PartInstancePayload } from "@/types/payloads";

export type PartMappingChangeKind =
  | "new-part"
  | "new-iteration"
  | "new-instance"
  | "deleted-instance"
  | "archived-part";

export type PartMappingDecision = "approved" | "denied";

export interface PartMappingBaseChange {
  id: string;
  kind: PartMappingChangeKind;
  title: string;
  detail: string;
  subsystemName: string;
  mechanismName: string;
  decision: PartMappingDecision;
}

export interface PartMappingCreatePartChange extends PartMappingBaseChange {
  kind: "new-part";
  payload: PartDefinitionPayload;
}

export interface PartMappingUpdatePartChange extends PartMappingBaseChange {
  kind: "new-iteration";
  partDefinitionId: string;
  payload: Partial<PartDefinitionPayload>;
}

export interface PartMappingCreateInstanceChange extends PartMappingBaseChange {
  kind: "new-instance";
  payload: PartInstancePayload;
}

export interface PartMappingDeleteInstanceChange extends PartMappingBaseChange {
  kind: "deleted-instance";
  partInstanceId: string;
}

export interface PartMappingArchivePartChange extends PartMappingBaseChange {
  kind: "archived-part";
  partDefinitionId: string;
  payload: Partial<PartDefinitionPayload>;
}

export type PartMappingChange =
  | PartMappingCreatePartChange
  | PartMappingUpdatePartChange
  | PartMappingCreateInstanceChange
  | PartMappingDeleteInstanceChange
  | PartMappingArchivePartChange;

export interface PartMappingSyncSource {
  assemblyNodes: Array<{
    id: string;
    name: string;
    parentAssemblyNodeId: string | null;
    subsystemId: string | null;
    mechanismId: string | null;
  }>;
  partDefinitions: Array<{
    id: string;
    name: string;
    partNumber: string | null;
    configuration: string | null;
    material: string | null;
    missionControlExternalKey: string | null;
  }>;
  partInstances: Array<{
    id: string;
    cadPartDefinitionId: string | null;
    parentAssemblyNodeId: string | null;
    partId: string | null;
    instancePath: string;
    quantity: number;
    suppressed: boolean | null;
  }>;
}

export interface BuildPartMappingChangesOptions {
  bootstrap: BootstrapPayload;
  source: PartMappingSyncSource;
  selectedSeasonId: string | null;
}
