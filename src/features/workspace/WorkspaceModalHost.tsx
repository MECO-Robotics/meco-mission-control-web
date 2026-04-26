import type { Dispatch, FormEvent, SetStateAction } from "react";

import {
  ArtifactEditorModal,
  ManufacturingEditorModal,
  MaterialEditorModal,
  MechanismEditorModal,
  PartDefinitionEditorModal,
  PartInstanceEditorModal,
  PurchaseEditorModal,
  SubsystemEditorModal,
  TaskEditorModal,
  WorkLogEditorModal,
  WorkstreamEditorModal,
} from "@/features/workspace";
import type {
  ArtifactModalMode,
  ManufacturingModalMode,
  MaterialModalMode,
  MechanismModalMode,
  PartDefinitionModalMode,
  PartInstanceModalMode,
  PurchaseModalMode,
  SubsystemModalMode,
  TaskModalMode,
  WorkLogModalMode,
  WorkstreamModalMode,
} from "@/features/workspace/shared";
import type {
  ArtifactPayload,
  BootstrapPayload,
  ManufacturingItemPayload,
  MaterialPayload,
  MechanismPayload,
  PartDefinitionPayload,
  PartInstancePayload,
  PurchaseItemPayload,
  SubsystemPayload,
  TaskPayload,
  TaskRecord,
  WorkLogPayload,
  WorkstreamPayload,
} from "@/types";

interface WorkspaceModalHostProps {
  activeArtifactId: string | null;
  activePartDefinitionId: string | null;
  activeMaterialId: string | null;
  activeMechanismId: string | null;
  activeSubsystemId: string | null;
  activeTask: TaskRecord | null;
  bootstrap: BootstrapPayload;
  closeManufacturingModal: () => void;
  closeArtifactModal: () => void;
  closeMaterialModal: () => void;
  closeMechanismModal: () => void;
  closePartInstanceModal: () => void;
  closePartDefinitionModal: () => void;
  closePurchaseModal: () => void;
  closeWorkLogModal: () => void;
  closeSubsystemModal: () => void;
  closeTaskModal: () => void;
  closeWorkstreamModal: () => void;
  disciplinesById: Record<string, BootstrapPayload["disciplines"][number]>;
  eventsById: Record<string, BootstrapPayload["events"][number]>;
  handleDeleteMaterial: (materialId: string) => Promise<void>;
  handleDeleteArtifact: (artifactId: string) => Promise<void>;
  handleDeletePartDefinition: (partDefinitionId: string) => Promise<void>;
  handleDeleteMechanism: (mechanismId: string) => Promise<void>;
  handleDeleteTask: (taskId: string) => Promise<void>;
  handlePartInstanceSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleManufacturingSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleMaterialSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleMechanismSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handlePartDefinitionSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleArtifactSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handlePurchaseSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleWorkLogSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleSubsystemSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleTaskSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleWorkstreamSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  isDeletingMaterial: boolean;
  isDeletingArtifact: boolean;
  isDeletingPartDefinition: boolean;
  isDeletingMechanism: boolean;
  isDeletingTask: boolean;
  isSavingManufacturing: boolean;
  isSavingArtifact: boolean;
  isSavingMaterial: boolean;
  isSavingPartDefinition: boolean;
  isSavingPartInstance: boolean;
  isSavingMechanism: boolean;
  isSavingPurchase: boolean;
  isSavingWorkLog: boolean;
  isSavingSubsystem: boolean;
  isSavingTask: boolean;
  isSavingWorkstream: boolean;
  artifactDraft: ArtifactPayload;
  artifactModalMode: ArtifactModalMode;
  manufacturingDraft: ManufacturingItemPayload;
  manufacturingModalMode: ManufacturingModalMode;
  materialDraft: MaterialPayload;
  materialModalMode: MaterialModalMode;
  mechanismDraft: MechanismPayload;
  mechanismModalMode: MechanismModalMode;
  mechanismsById: Record<string, BootstrapPayload["mechanisms"][number]>;
  mentors: BootstrapPayload["members"];
  partInstanceDraft: PartInstancePayload;
  partInstanceModalMode: PartInstanceModalMode;
  partDefinitionDraft: PartDefinitionPayload;
  partDefinitionModalMode: PartDefinitionModalMode;
  partDefinitionsById: Record<string, BootstrapPayload["partDefinitions"][number]>;
  partInstancesById: Record<string, BootstrapPayload["partInstances"][number]>;
  purchaseDraft: PurchaseItemPayload;
  purchaseFinalCost: string;
  purchaseModalMode: PurchaseModalMode;
  workLogDraft: WorkLogPayload;
  workLogModalMode: WorkLogModalMode;
  workstreamDraft: WorkstreamPayload;
  workstreamModalMode: WorkstreamModalMode;
  setArtifactDraft: Dispatch<SetStateAction<ArtifactPayload>>;
  setManufacturingDraft: Dispatch<SetStateAction<ManufacturingItemPayload>>;
  setMaterialDraft: Dispatch<SetStateAction<MaterialPayload>>;
  setMechanismDraft: Dispatch<SetStateAction<MechanismPayload>>;
  setPartInstanceDraft: Dispatch<SetStateAction<PartInstancePayload>>;
  setPartDefinitionDraft: Dispatch<SetStateAction<PartDefinitionPayload>>;
  setPurchaseDraft: Dispatch<SetStateAction<PurchaseItemPayload>>;
  setPurchaseFinalCost: (value: string) => void;
  setWorkLogDraft: Dispatch<SetStateAction<WorkLogPayload>>;
  setWorkstreamDraft: Dispatch<SetStateAction<WorkstreamPayload>>;
  setSubsystemDraft: Dispatch<SetStateAction<SubsystemPayload>>;
  setSubsystemDraftRisks: (value: string) => void;
  setTaskDraft: Dispatch<SetStateAction<TaskPayload>>;
  setTaskDraftBlockers: (value: string) => void;
  showTimelineCreateToggleInTaskModal: boolean;
  onSwitchTaskCreateToMilestone: () => void;
  students: BootstrapPayload["members"];
  subsystemDraft: SubsystemPayload;
  subsystemDraftRisks: string;
  subsystemModalMode: SubsystemModalMode;
  taskDraft: TaskPayload;
  taskDraftBlockers: string;
  taskModalMode: TaskModalMode;
}

export function WorkspaceModalHost({
  activeArtifactId,
  activePartDefinitionId,
  activeMaterialId,
  activeMechanismId,
  activeSubsystemId,
  activeTask,
  bootstrap,
  closeManufacturingModal,
  closeArtifactModal,
  closeMaterialModal,
  closeMechanismModal,
  closePartInstanceModal,
  closePartDefinitionModal,
  closePurchaseModal,
  closeWorkLogModal,
  closeSubsystemModal,
  closeTaskModal,
  closeWorkstreamModal,
  disciplinesById,
  eventsById,
  handleDeleteMaterial,
  handleDeleteArtifact,
  handleDeletePartDefinition,
  handleDeleteMechanism,
  handleDeleteTask,
  handlePartInstanceSubmit,
  handleManufacturingSubmit,
  handleMaterialSubmit,
  handleMechanismSubmit,
  handlePartDefinitionSubmit,
  handleArtifactSubmit,
  handlePurchaseSubmit,
  handleWorkLogSubmit,
  handleSubsystemSubmit,
  handleTaskSubmit,
  handleWorkstreamSubmit,
  isDeletingMaterial,
  isDeletingArtifact,
  isDeletingPartDefinition,
  isDeletingMechanism,
  isDeletingTask,
  isSavingManufacturing,
  isSavingArtifact,
  isSavingMaterial,
  isSavingPartDefinition,
  isSavingPartInstance,
  isSavingMechanism,
  isSavingPurchase,
  isSavingWorkLog,
  isSavingSubsystem,
  isSavingTask,
  isSavingWorkstream,
  artifactDraft,
  artifactModalMode,
  manufacturingDraft,
  manufacturingModalMode,
  materialDraft,
  materialModalMode,
  mechanismDraft,
  mechanismModalMode,
  mechanismsById,
  mentors,
  partInstanceDraft,
  partInstanceModalMode,
  partDefinitionDraft,
  partDefinitionModalMode,
  partDefinitionsById,
  partInstancesById,
  purchaseDraft,
  purchaseFinalCost,
  purchaseModalMode,
  workLogDraft,
  workLogModalMode,
  workstreamDraft,
  workstreamModalMode,
  setArtifactDraft,
  setManufacturingDraft,
  setMaterialDraft,
  setMechanismDraft,
  setPartInstanceDraft,
  setPartDefinitionDraft,
  setPurchaseDraft,
  setPurchaseFinalCost,
  setWorkLogDraft,
  setWorkstreamDraft,
  setSubsystemDraft,
  setSubsystemDraftRisks,
  setTaskDraft,
  setTaskDraftBlockers,
  showTimelineCreateToggleInTaskModal,
  onSwitchTaskCreateToMilestone,
  students,
  subsystemDraft,
  subsystemDraftRisks,
  subsystemModalMode,
  taskDraft,
  taskDraftBlockers,
  taskModalMode,
}: WorkspaceModalHostProps) {
  return (
    <>
      {artifactModalMode ? (
        <ArtifactEditorModal
          activeArtifactId={activeArtifactId}
          artifactDraft={artifactDraft}
          artifactModalMode={artifactModalMode}
          bootstrap={bootstrap}
          closeArtifactModal={closeArtifactModal}
          handleArtifactSubmit={handleArtifactSubmit}
          handleDeleteArtifact={handleDeleteArtifact}
          isDeletingArtifact={isDeletingArtifact}
          isSavingArtifact={isSavingArtifact}
          setArtifactDraft={setArtifactDraft}
        />
      ) : null}

      {subsystemModalMode ? (
        <SubsystemEditorModal
          activeSubsystemId={activeSubsystemId}
          bootstrap={bootstrap}
          closeSubsystemModal={closeSubsystemModal}
          handleSubsystemSubmit={handleSubsystemSubmit}
          isSavingSubsystem={isSavingSubsystem}
          subsystemDraft={subsystemDraft}
          subsystemDraftRisks={subsystemDraftRisks}
          subsystemModalMode={subsystemModalMode}
          setSubsystemDraft={setSubsystemDraft}
          setSubsystemDraftRisks={setSubsystemDraftRisks}
        />
      ) : null}

      {workstreamModalMode ? (
        <WorkstreamEditorModal
          bootstrap={bootstrap}
          closeWorkstreamModal={closeWorkstreamModal}
          handleWorkstreamSubmit={handleWorkstreamSubmit}
          isSavingWorkstream={isSavingWorkstream}
          setWorkstreamDraft={setWorkstreamDraft}
          workstreamDraft={workstreamDraft}
        />
      ) : null}

      {mechanismModalMode ? (
        <MechanismEditorModal
          activeMechanismId={activeMechanismId}
          bootstrap={bootstrap}
          closeMechanismModal={closeMechanismModal}
          handleDeleteMechanism={handleDeleteMechanism}
          handleMechanismSubmit={handleMechanismSubmit}
          isDeletingMechanism={isDeletingMechanism}
          isSavingMechanism={isSavingMechanism}
          mechanismDraft={mechanismDraft}
          mechanismModalMode={mechanismModalMode}
          setMechanismDraft={setMechanismDraft}
        />
      ) : null}

      {partInstanceModalMode ? (
        <PartInstanceEditorModal
          bootstrap={bootstrap}
          closePartInstanceModal={closePartInstanceModal}
          handlePartInstanceSubmit={handlePartInstanceSubmit}
          isSavingPartInstance={isSavingPartInstance}
          partDefinitionDraftsById={partDefinitionsById}
          partInstanceDraft={partInstanceDraft}
          partInstanceModalMode={partInstanceModalMode}
          setPartInstanceDraft={setPartInstanceDraft}
        />
      ) : null}

      {taskModalMode ? (
        <TaskEditorModal
          activeTask={activeTask}
          bootstrap={bootstrap}
          closeTaskModal={closeTaskModal}
          disciplinesById={disciplinesById}
          eventsById={eventsById}
          handleDeleteTask={handleDeleteTask}
          handleTaskSubmit={handleTaskSubmit}
          isDeletingTask={isDeletingTask}
          isSavingTask={isSavingTask}
          mechanismsById={mechanismsById}
          mentors={mentors}
          partDefinitionsById={partDefinitionsById}
          partInstancesById={partInstancesById}
          setTaskDraft={setTaskDraft}
          setTaskDraftBlockers={setTaskDraftBlockers}
          showCreateTypeToggle={showTimelineCreateToggleInTaskModal}
          onSwitchCreateTypeToMilestone={onSwitchTaskCreateToMilestone}
          students={students}
          taskDraft={taskDraft}
          taskDraftBlockers={taskDraftBlockers}
          taskModalMode={taskModalMode}
        />
      ) : null}

      {purchaseModalMode ? (
        <PurchaseEditorModal
          bootstrap={bootstrap}
          closePurchaseModal={closePurchaseModal}
          handlePurchaseSubmit={handlePurchaseSubmit}
          isSavingPurchase={isSavingPurchase}
          purchaseDraft={purchaseDraft}
          purchaseFinalCost={purchaseFinalCost}
          purchaseModalMode={purchaseModalMode}
          setPurchaseDraft={setPurchaseDraft}
          setPurchaseFinalCost={setPurchaseFinalCost}
        />
      ) : null}

      {workLogModalMode ? (
        <WorkLogEditorModal
          bootstrap={bootstrap}
          closeWorkLogModal={closeWorkLogModal}
          handleWorkLogSubmit={handleWorkLogSubmit}
          isSavingWorkLog={isSavingWorkLog}
          setWorkLogDraft={setWorkLogDraft}
          workLogDraft={workLogDraft}
        />
      ) : null}

      {manufacturingModalMode ? (
        <ManufacturingEditorModal
          bootstrap={bootstrap}
          closeManufacturingModal={closeManufacturingModal}
          handleManufacturingSubmit={handleManufacturingSubmit}
          isSavingManufacturing={isSavingManufacturing}
          manufacturingDraft={manufacturingDraft}
          manufacturingModalMode={manufacturingModalMode}
          setManufacturingDraft={setManufacturingDraft}
        />
      ) : null}

      {materialModalMode ? (
        <MaterialEditorModal
          activeMaterialId={activeMaterialId}
          closeMaterialModal={closeMaterialModal}
          handleDeleteMaterial={handleDeleteMaterial}
          handleMaterialSubmit={handleMaterialSubmit}
          isDeletingMaterial={isDeletingMaterial}
          isSavingMaterial={isSavingMaterial}
          materialDraft={materialDraft}
          materialModalMode={materialModalMode}
          setMaterialDraft={setMaterialDraft}
        />
      ) : null}

      {partDefinitionModalMode ? (
        <PartDefinitionEditorModal
          activePartDefinitionId={activePartDefinitionId}
          bootstrap={bootstrap}
          closePartDefinitionModal={closePartDefinitionModal}
          handleDeletePartDefinition={handleDeletePartDefinition}
          handlePartDefinitionSubmit={handlePartDefinitionSubmit}
          isDeletingPartDefinition={isDeletingPartDefinition}
          isSavingPartDefinition={isSavingPartDefinition}
          partDefinitionDraft={partDefinitionDraft}
          partDefinitionModalMode={partDefinitionModalMode}
          setPartDefinitionDraft={setPartDefinitionDraft}
        />
      ) : null}
    </>
  );
}




