import type { Dispatch, FormEvent, SetStateAction } from "react";

import {
  ManufacturingEditorModal,
  MaterialEditorModal,
  MechanismEditorModal,
  PartDefinitionEditorModal,
  PartInstanceEditorModal,
  PurchaseEditorModal,
  SubsystemEditorModal,
  TaskEditorModal,
  WorkLogEditorModal,
} from "./WorkspaceModals";
import type {
  ManufacturingModalMode,
  MaterialModalMode,
  MechanismModalMode,
  PartDefinitionModalMode,
  PartInstanceModalMode,
  PurchaseModalMode,
  SubsystemModalMode,
  TaskModalMode,
  WorkLogModalMode,
} from "./shared/workspaceModalModes";
import type {
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
} from "../../types";

interface WorkspaceModalHostProps {
  activePartDefinitionId: string | null;
  activeMaterialId: string | null;
  activeMechanismId: string | null;
  activeSubsystemId: string | null;
  activeTask: TaskRecord | null;
  bootstrap: BootstrapPayload;
  closeManufacturingModal: () => void;
  closeMaterialModal: () => void;
  closeMechanismModal: () => void;
  closePartInstanceModal: () => void;
  closePartDefinitionModal: () => void;
  closePurchaseModal: () => void;
  closeWorkLogModal: () => void;
  closeSubsystemModal: () => void;
  closeTaskModal: () => void;
  disciplinesById: Record<string, BootstrapPayload["disciplines"][number]>;
  eventsById: Record<string, BootstrapPayload["events"][number]>;
  handleDeleteMaterial: (materialId: string) => Promise<void>;
  handleDeletePartDefinition: (partDefinitionId: string) => Promise<void>;
  handleDeleteMechanism: (mechanismId: string) => Promise<void>;
  handlePartInstanceSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleManufacturingSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleMaterialSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleMechanismSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handlePartDefinitionSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handlePurchaseSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleWorkLogSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleSubsystemSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleTaskSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  isDeletingMaterial: boolean;
  isDeletingPartDefinition: boolean;
  isDeletingMechanism: boolean;
  isSavingManufacturing: boolean;
  isSavingMaterial: boolean;
  isSavingPartDefinition: boolean;
  isSavingPartInstance: boolean;
  isSavingMechanism: boolean;
  isSavingPurchase: boolean;
  isSavingWorkLog: boolean;
  isSavingSubsystem: boolean;
  isSavingTask: boolean;
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
  requirementsById: Record<string, BootstrapPayload["requirements"][number]>;
  setManufacturingDraft: Dispatch<SetStateAction<ManufacturingItemPayload>>;
  setMaterialDraft: Dispatch<SetStateAction<MaterialPayload>>;
  setMechanismDraft: Dispatch<SetStateAction<MechanismPayload>>;
  setPartInstanceDraft: Dispatch<SetStateAction<PartInstancePayload>>;
  setPartDefinitionDraft: Dispatch<SetStateAction<PartDefinitionPayload>>;
  setPurchaseDraft: Dispatch<SetStateAction<PurchaseItemPayload>>;
  setPurchaseFinalCost: (value: string) => void;
  setWorkLogDraft: Dispatch<SetStateAction<WorkLogPayload>>;
  setSubsystemDraft: Dispatch<SetStateAction<SubsystemPayload>>;
  setSubsystemDraftRisks: (value: string) => void;
  setTaskDraft: Dispatch<SetStateAction<TaskPayload>>;
  setTaskDraftBlockers: (value: string) => void;
  students: BootstrapPayload["members"];
  subsystemDraft: SubsystemPayload;
  subsystemDraftRisks: string;
  subsystemModalMode: SubsystemModalMode;
  taskDraft: TaskPayload;
  taskDraftBlockers: string;
  taskModalMode: TaskModalMode;
}

export function WorkspaceModalHost({
  activePartDefinitionId,
  activeMaterialId,
  activeMechanismId,
  activeSubsystemId,
  activeTask,
  bootstrap,
  closeManufacturingModal,
  closeMaterialModal,
  closeMechanismModal,
  closePartInstanceModal,
  closePartDefinitionModal,
  closePurchaseModal,
  closeWorkLogModal,
  closeSubsystemModal,
  closeTaskModal,
  disciplinesById,
  eventsById,
  handleDeleteMaterial,
  handleDeletePartDefinition,
  handleDeleteMechanism,
  handlePartInstanceSubmit,
  handleManufacturingSubmit,
  handleMaterialSubmit,
  handleMechanismSubmit,
  handlePartDefinitionSubmit,
  handlePurchaseSubmit,
  handleWorkLogSubmit,
  handleSubsystemSubmit,
  handleTaskSubmit,
  isDeletingMaterial,
  isDeletingPartDefinition,
  isDeletingMechanism,
  isSavingManufacturing,
  isSavingMaterial,
  isSavingPartDefinition,
  isSavingPartInstance,
  isSavingMechanism,
  isSavingPurchase,
  isSavingWorkLog,
  isSavingSubsystem,
  isSavingTask,
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
  requirementsById,
  setManufacturingDraft,
  setMaterialDraft,
  setMechanismDraft,
  setPartInstanceDraft,
  setPartDefinitionDraft,
  setPurchaseDraft,
  setPurchaseFinalCost,
  setWorkLogDraft,
  setSubsystemDraft,
  setSubsystemDraftRisks,
  setTaskDraft,
  setTaskDraftBlockers,
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
          handleTaskSubmit={handleTaskSubmit}
          isSavingTask={isSavingTask}
          mechanismsById={mechanismsById}
          mentors={mentors}
          partDefinitionsById={partDefinitionsById}
          partInstancesById={partInstancesById}
          requirementsById={requirementsById}
          setTaskDraft={setTaskDraft}
          setTaskDraftBlockers={setTaskDraftBlockers}
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
