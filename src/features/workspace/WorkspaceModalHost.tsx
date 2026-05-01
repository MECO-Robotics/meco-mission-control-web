import type { Dispatch, FormEvent, SetStateAction } from "react";

import {
  ArtifactEditorModal,
  EventReportEditorModal,
  ManufacturingEditorModal,
  MaterialEditorModal,
  MechanismEditorModal,
  PartDefinitionEditorModal,
  PartInstanceEditorModal,
  PurchaseEditorModal,
  QaReportEditorModal,
  TaskDetailsModal,
  SubsystemEditorModal,
  TaskEditorModal,
  WorkLogEditorModal,
  WorkstreamEditorModal,
} from "./WorkspaceModals";
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
  TestResultPayload,
  QaReportPayload,
  WorkLogPayload,
  WorkstreamPayload,
} from "@/types";

interface WorkspaceModalHostProps {
  activeArtifactId: string | null;
  activePartDefinitionId: string | null;
  activeMaterialId: string | null;
  activeMechanismId: string | null;
  activeWorkstreamId: string | null;
  activeSubsystemId: string | null;
  activeTask: TaskRecord | null;
  activeTimelineTaskDetail: TaskRecord | null;
  bootstrap: BootstrapPayload;
  closeManufacturingModal: () => void;
  closeArtifactModal: () => void;
  closeMaterialModal: () => void;
  closeMechanismModal: () => void;
  closePartInstanceModal: () => void;
  closePartDefinitionModal: () => void;
  closePurchaseModal: () => void;
  closeQaReportModal: () => void;
  closeEventReportModal: () => void;
  closeTimelineTaskDetailsModal: () => void;
  closeWorkLogModal: () => void;
  closeSubsystemModal: () => void;
  closeTaskModal: () => void;
  closeWorkstreamModal: () => void;
  requestPhotoUpload: (projectId: string, file: File) => Promise<string>;
  disciplinesById: Record<string, BootstrapPayload["disciplines"][number]>;
  eventsById: Record<string, BootstrapPayload["events"][number]>;
  handleDeleteMaterial: (materialId: string) => Promise<void>;
  handleDeleteArtifact: (artifactId: string) => Promise<void>;
  handleToggleArtifactArchived: (artifactId: string) => Promise<void>;
  handleDeletePartDefinition: (partDefinitionId: string) => Promise<void>;
  handleDeleteMechanism: (mechanismId: string) => Promise<void>;
  handleTogglePartDefinitionArchived: (partDefinitionId: string) => Promise<void>;
  handleToggleSubsystemArchived: (subsystemId: string) => Promise<void>;
  handleToggleMechanismArchived: (mechanismId: string) => Promise<void>;
  handleToggleWorkstreamArchived: (workstreamId: string) => Promise<void>;
  handleDeleteTask: (taskId: string) => Promise<void>;
  handleResolveTaskBlocker: (blockerId: string) => Promise<void>;
  handlePartInstanceSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleManufacturingSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleMaterialSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleMechanismSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handlePartDefinitionSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleArtifactSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handlePurchaseSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleQaReportSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleEventReportSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleWorkLogSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleSubsystemSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleTaskSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleWorkstreamSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onOpenTaskEditFromTimelineDetails: (task: TaskRecord) => void;
  openTaskDetailsModal: (task: TaskRecord) => void;
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
  isSavingQaReport: boolean;
  isSavingEventReport: boolean;
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
  qaReportDraft: QaReportPayload;
  qaReportModalMode: QaReportModalMode;
  eventReportDraft: TestResultPayload;
  eventReportFindings: string;
  eventReportModalMode: EventReportModalMode;
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
  setQaReportDraft: Dispatch<SetStateAction<QaReportPayload>>;
  setEventReportDraft: Dispatch<SetStateAction<TestResultPayload>>;
  setEventReportFindings: (value: string) => void;
  setWorkLogDraft: Dispatch<SetStateAction<WorkLogPayload>>;
  setWorkstreamDraft: Dispatch<SetStateAction<WorkstreamPayload>>;
  setSubsystemDraft: Dispatch<SetStateAction<SubsystemPayload>>;
  setSubsystemDraftRisks: (value: string) => void;
  setTaskDraft: Dispatch<SetStateAction<TaskPayload>>;
  showTimelineCreateToggleInTaskModal: boolean;
  onSwitchTaskCreateToMilestone: () => void;
  students: BootstrapPayload["members"];
  subsystemDraft: SubsystemPayload;
  subsystemDraftRisks: string;
  subsystemModalMode: SubsystemModalMode;
  taskDraft: TaskPayload;
  taskModalMode: TaskModalMode;
}

export function WorkspaceModalHost({
  activeArtifactId,
  activePartDefinitionId,
  activeMaterialId,
  activeMechanismId,
  activeWorkstreamId,
  activeSubsystemId,
  activeTask,
  activeTimelineTaskDetail,
  bootstrap,
  closeManufacturingModal,
  closeArtifactModal,
  closeMaterialModal,
  closeMechanismModal,
  closePartInstanceModal,
  closePartDefinitionModal,
  closePurchaseModal,
  closeQaReportModal,
  closeEventReportModal,
  closeTimelineTaskDetailsModal,
  closeWorkLogModal,
  closeSubsystemModal,
  closeTaskModal,
  closeWorkstreamModal,
  requestPhotoUpload,
  disciplinesById,
  eventsById,
  handleDeleteMaterial,
  handleDeleteArtifact,
  handleToggleArtifactArchived,
  handleDeletePartDefinition,
  handleDeleteMechanism,
  handleTogglePartDefinitionArchived,
  handleToggleSubsystemArchived,
  handleToggleMechanismArchived,
  handleToggleWorkstreamArchived,
  handleDeleteTask,
  handleResolveTaskBlocker,
  handlePartInstanceSubmit,
  handleManufacturingSubmit,
  handleMaterialSubmit,
  handleMechanismSubmit,
  handlePartDefinitionSubmit,
  handleArtifactSubmit,
  handlePurchaseSubmit,
  handleQaReportSubmit,
  handleEventReportSubmit,
  handleWorkLogSubmit,
  handleSubsystemSubmit,
  handleTaskSubmit,
  handleWorkstreamSubmit,
  onOpenTaskEditFromTimelineDetails,
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
  isSavingQaReport,
  isSavingEventReport,
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
  qaReportDraft,
  qaReportModalMode,
  eventReportDraft,
  eventReportFindings,
  eventReportModalMode,
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
  setQaReportDraft,
  setEventReportDraft,
  setEventReportFindings,
  setWorkLogDraft,
  setWorkstreamDraft,
  setSubsystemDraft,
  setSubsystemDraftRisks,
  setTaskDraft,
  showTimelineCreateToggleInTaskModal,
  onSwitchTaskCreateToMilestone,
  students,
  subsystemDraft,
  subsystemDraftRisks,
  subsystemModalMode,
  taskDraft,
  taskModalMode,
}: WorkspaceModalHostProps) {
  return (
    <>
      {activeTimelineTaskDetail ? (
        <TaskDetailsModal
          activeTask={activeTimelineTaskDetail}
          bootstrap={bootstrap}
          closeTaskDetailsModal={closeTimelineTaskDetailsModal}
          onEditTask={onOpenTaskEditFromTimelineDetails}
          onResolveTaskBlocker={handleResolveTaskBlocker}
        />
      ) : null}

      {artifactModalMode ? (
        <ArtifactEditorModal
          activeArtifactId={activeArtifactId}
          artifactDraft={artifactDraft}
          artifactModalMode={artifactModalMode}
          bootstrap={bootstrap}
          closeArtifactModal={closeArtifactModal}
          handleArtifactSubmit={handleArtifactSubmit}
          handleDeleteArtifact={handleDeleteArtifact}
          handleToggleArtifactArchived={handleToggleArtifactArchived}
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
          handleToggleSubsystemArchived={handleToggleSubsystemArchived}
          handleSubsystemSubmit={handleSubsystemSubmit}
          isSavingSubsystem={isSavingSubsystem}
          requestPhotoUpload={requestPhotoUpload}
          subsystemDraft={subsystemDraft}
          subsystemDraftRisks={subsystemDraftRisks}
          subsystemModalMode={subsystemModalMode}
          setSubsystemDraft={setSubsystemDraft}
          setSubsystemDraftRisks={setSubsystemDraftRisks}
        />
      ) : null}

      {workstreamModalMode ? (
        <WorkstreamEditorModal
          activeWorkstreamId={activeWorkstreamId}
          bootstrap={bootstrap}
          closeWorkstreamModal={closeWorkstreamModal}
          handleToggleWorkstreamArchived={handleToggleWorkstreamArchived}
          handleWorkstreamSubmit={handleWorkstreamSubmit}
          isSavingWorkstream={isSavingWorkstream}
          setWorkstreamDraft={setWorkstreamDraft}
          workstreamDraft={workstreamDraft}
          workstreamModalMode={workstreamModalMode}
        />
      ) : null}

      {mechanismModalMode ? (
        <MechanismEditorModal
          activeMechanismId={activeMechanismId}
          bootstrap={bootstrap}
          closeMechanismModal={closeMechanismModal}
          handleDeleteMechanism={handleDeleteMechanism}
          handleToggleMechanismArchived={handleToggleMechanismArchived}
          handleMechanismSubmit={handleMechanismSubmit}
          isDeletingMechanism={isDeletingMechanism}
          isSavingMechanism={isSavingMechanism}
          requestPhotoUpload={requestPhotoUpload}
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
          requestPhotoUpload={requestPhotoUpload}
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
          handleResolveTaskBlocker={handleResolveTaskBlocker}
          handleTaskSubmit={handleTaskSubmit}
          isDeletingTask={isDeletingTask}
          isSavingTask={isSavingTask}
          mechanismsById={mechanismsById}
          mentors={mentors}
          partDefinitionsById={partDefinitionsById}
          partInstancesById={partInstancesById}
          requestPhotoUpload={requestPhotoUpload}
          setTaskDraft={setTaskDraft}
          showCreateTypeToggle={showTimelineCreateToggleInTaskModal}
          onSwitchCreateTypeToMilestone={onSwitchTaskCreateToMilestone}
          students={students}
          taskDraft={taskDraft}
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
          requestPhotoUpload={requestPhotoUpload}
          setWorkLogDraft={setWorkLogDraft}
          workLogDraft={workLogDraft}
        />
      ) : null}

      {qaReportModalMode ? (
        <QaReportEditorModal
          bootstrap={bootstrap}
          closeQaReportModal={closeQaReportModal}
          handleQaReportSubmit={handleQaReportSubmit}
          isSavingQaReport={isSavingQaReport}
          requestPhotoUpload={requestPhotoUpload}
          qaReportDraft={qaReportDraft}
          setQaReportDraft={setQaReportDraft}
        />
      ) : null}

      {eventReportModalMode ? (
        <EventReportEditorModal
          bootstrap={bootstrap}
          closeEventReportModal={closeEventReportModal}
          eventReportDraft={eventReportDraft}
          eventReportFindings={eventReportFindings}
          handleEventReportSubmit={handleEventReportSubmit}
          isSavingEventReport={isSavingEventReport}
          requestPhotoUpload={requestPhotoUpload}
          setEventReportDraft={setEventReportDraft}
          setEventReportFindings={setEventReportFindings}
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
          handleTogglePartDefinitionArchived={handleTogglePartDefinitionArchived}
          handlePartDefinitionSubmit={handlePartDefinitionSubmit}
          isDeletingPartDefinition={isDeletingPartDefinition}
          isSavingPartDefinition={isSavingPartDefinition}
          requestPhotoUpload={requestPhotoUpload}
          partDefinitionDraft={partDefinitionDraft}
          partDefinitionModalMode={partDefinitionModalMode}
          setPartDefinitionDraft={setPartDefinitionDraft}
        />
      ) : null}
    </>
  );
}
