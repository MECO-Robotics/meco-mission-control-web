import type { Dispatch, SetStateAction } from "react";

import type { AppWorkspaceDerived } from "@/app/hooks/useAppWorkspaceDerived";
import type { AppWorkspaceState } from "@/app/hooks/useAppWorkspaceState";
import type { BootstrapPayload } from "@/types";
import type {
  ArtifactModalMode,
  EventReportModalMode,
  ManufacturingModalMode,
  MaterialModalMode,
  MechanismModalMode,
  PartDefinitionModalMode,
  PartInstanceModalMode,
  PurchaseModalMode,
  QaReportModalMode,
  SubsystemModalMode,
  TaskModalMode,
  WorkLogModalMode,
  WorkstreamModalMode,
} from "@/features/workspace/shared";
import type { ArtifactPayload, ManufacturingItemPayload, MaterialPayload, MechanismPayload, PartDefinitionPayload, PartInstancePayload, PurchaseItemPayload, SubsystemPayload, TaskPayload, QaReportPayload, WorkLogPayload, WorkstreamPayload } from "@/types";

export type AppWorkspaceLoaderModel = AppWorkspaceState & AppWorkspaceDerived;
export type SelectMemberHandler = (memberId: string | null, payload: BootstrapPayload) => void;
export type UnauthorizedHandler = () => void;

export type WorkspaceReconciliationState = AppWorkspaceState & {
  activeArtifactId: string | null;
  activeMechanismId: string | null;
  activeMaterialId: string | null;
  activePartDefinitionId: string | null;
  activePartInstanceId: string | null;
  activePurchaseId: string | null;
  activeSubsystemId: string | null;
  activeTaskId: string | null;
  activeWorkstreamId: string | null;
  artifactDraft: ArtifactPayload;
  artifactModalMode: ArtifactModalMode;
  eventReportModalMode: EventReportModalMode;
  manufacturingDraft: ManufacturingItemPayload;
  manufacturingModalMode: ManufacturingModalMode;
  materialDraft: MaterialPayload;
  materialModalMode: MaterialModalMode;
  mechanismDraft: MechanismPayload;
  mechanismModalMode: MechanismModalMode;
  partDefinitionDraft: PartDefinitionPayload;
  partDefinitionModalMode: PartDefinitionModalMode;
  partInstanceDraft: PartInstancePayload;
  partInstanceModalMode: PartInstanceModalMode;
  purchaseDraft: PurchaseItemPayload;
  purchaseFinalCost: string;
  purchaseModalMode: PurchaseModalMode;
  qaReportDraft: QaReportPayload;
  qaReportModalMode: QaReportModalMode;
  subsystemDraft: SubsystemPayload;
  subsystemDraftRisks: string;
  subsystemModalMode: SubsystemModalMode;
  taskDraft: TaskPayload;
  taskModalMode: TaskModalMode;
  workLogDraft: WorkLogPayload;
  workLogModalMode: WorkLogModalMode;
  workstreamDraft: WorkstreamPayload;
  workstreamModalMode: WorkstreamModalMode;
  setActiveArtifactId: Dispatch<SetStateAction<string | null>>;
  setActiveMechanismId: Dispatch<SetStateAction<string | null>>;
  setActiveMaterialId: Dispatch<SetStateAction<string | null>>;
  setActivePartDefinitionId: Dispatch<SetStateAction<string | null>>;
  setActivePartInstanceId: Dispatch<SetStateAction<string | null>>;
  setActivePurchaseId: Dispatch<SetStateAction<string | null>>;
  setActiveSubsystemId: Dispatch<SetStateAction<string | null>>;
  setActiveTaskId: Dispatch<SetStateAction<string | null>>;
  setActiveWorkstreamId: Dispatch<SetStateAction<string | null>>;
  setArtifactDraft: Dispatch<SetStateAction<ArtifactPayload>>;
  setArtifactModalMode: Dispatch<SetStateAction<ArtifactModalMode>>;
  setEventReportModalMode: Dispatch<SetStateAction<EventReportModalMode>>;
  setManufacturingDraft: Dispatch<SetStateAction<ManufacturingItemPayload>>;
  setManufacturingModalMode: Dispatch<SetStateAction<ManufacturingModalMode>>;
  setMaterialDraft: Dispatch<SetStateAction<MaterialPayload>>;
  setMaterialModalMode: Dispatch<SetStateAction<MaterialModalMode>>;
  setMechanismDraft: Dispatch<SetStateAction<MechanismPayload>>;
  setMechanismModalMode: Dispatch<SetStateAction<MechanismModalMode>>;
  setPartDefinitionDraft: Dispatch<SetStateAction<PartDefinitionPayload>>;
  setPartDefinitionModalMode: Dispatch<SetStateAction<PartDefinitionModalMode>>;
  setPartInstanceDraft: Dispatch<SetStateAction<PartInstancePayload>>;
  setPartInstanceModalMode: Dispatch<SetStateAction<PartInstanceModalMode>>;
  setPurchaseDraft: Dispatch<SetStateAction<PurchaseItemPayload>>;
  setPurchaseFinalCost: Dispatch<SetStateAction<string>>;
  setPurchaseModalMode: Dispatch<SetStateAction<PurchaseModalMode>>;
  setQaReportDraft: Dispatch<SetStateAction<QaReportPayload>>;
  setQaReportModalMode: Dispatch<SetStateAction<QaReportModalMode>>;
  setSubsystemDraft: Dispatch<SetStateAction<SubsystemPayload>>;
  setSubsystemDraftRisks: Dispatch<SetStateAction<string>>;
  setSubsystemModalMode: Dispatch<SetStateAction<SubsystemModalMode>>;
  setTaskDraft: Dispatch<SetStateAction<TaskPayload>>;
  setTaskModalMode: Dispatch<SetStateAction<TaskModalMode>>;
  setWorkLogDraft: Dispatch<SetStateAction<WorkLogPayload>>;
  setWorkLogModalMode: Dispatch<SetStateAction<WorkLogModalMode>>;
  setWorkstreamDraft: Dispatch<SetStateAction<WorkstreamPayload>>;
  setWorkstreamModalMode: Dispatch<SetStateAction<WorkstreamModalMode>>;
};
