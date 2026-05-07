import { Suspense } from "react";

import type { AppWorkspaceShellModalLayerController } from "@/app/hooks/useAppWorkspaceController";
import { InteractiveTutorialOverlay } from "@/app/interactiveTutorial/InteractiveTutorialOverlay";

import { WorkspaceModalHost } from "@/app/shell/workspaceShell";

export function AppWorkspaceShellModalLayer({
  controller,
}: {
  controller: AppWorkspaceShellModalLayerController;
}) {
  const c = controller;

  return (
    <>
      {c.interactiveTutorialOverlayProps ? (
        <InteractiveTutorialOverlay {...c.interactiveTutorialOverlayProps} />
      ) : null}

      {c.isWorkspaceModalOpen ? (
        <Suspense fallback={null}>
          <WorkspaceModalHost
            activeArtifactId={c.activeArtifactId}
            activePartDefinitionId={c.activePartDefinitionId}
            activeMaterialId={c.activeMaterialId}
            activeMechanismId={c.activeMechanismId}
            activeWorkstreamId={c.activeWorkstreamId}
            activeSubsystemId={c.activeSubsystemId}
            activeTask={c.activeTask}
            activeTimelineTaskDetail={c.activeTimelineTaskDetail}
            bootstrap={c.scopedBootstrap}
            closeManufacturingModal={c.closeManufacturingModal}
            closeArtifactModal={c.closeArtifactModal}
            closeMaterialModal={c.closeMaterialModal}
            closeMechanismModal={c.closeMechanismModal}
            closePartInstanceModal={c.closePartInstanceModal}
            closePartDefinitionModal={c.closePartDefinitionModal}
            closePurchaseModal={c.closePurchaseModal}
            closeQaReportModal={c.closeQaReportModal}
            closeMilestoneReportModal={c.closeMilestoneReportModal}
            closeTimelineTaskDetailsModal={c.closeTimelineTaskDetailsModal}
            closeWorkLogModal={c.closeWorkLogModal}
            closeSubsystemModal={c.closeSubsystemModal}
            closeTaskModal={c.closeTaskModal}
            closeWorkstreamModal={c.closeWorkstreamModal}
            onTaskEditCanceled={c.notifyTaskEditCanceled}
            requestPhotoUpload={c.requestPhotoUpload}
            disciplinesById={c.disciplinesById}
            milestonesById={c.milestonesById}
            handleDeleteMaterial={c.handleDeleteMaterial}
            handleDeleteArtifact={c.handleDeleteArtifact}
            handleToggleArtifactArchived={c.handleToggleArtifactArchived}
            handleDeletePartDefinition={c.handleDeletePartDefinition}
            handleDeleteMechanism={c.handleDeleteMechanism}
            handleTogglePartDefinitionArchived={c.handleTogglePartDefinitionArchived}
            handleToggleSubsystemArchived={c.handleToggleSubsystemArchived}
            handleToggleMechanismArchived={c.handleToggleMechanismArchived}
            handleToggleWorkstreamArchived={c.handleToggleWorkstreamArchived}
            handleDeleteTask={c.handleDeleteTask}
            handlePartInstanceSubmit={c.handlePartInstanceSubmit}
            handleMechanismSubmit={c.handleMechanismSubmit}
            handleManufacturingSubmit={c.handleManufacturingSubmit}
            handleMaterialSubmit={c.handleMaterialSubmit}
            handlePartDefinitionSubmit={c.handlePartDefinitionSubmit}
            handleArtifactSubmit={c.handleArtifactSubmit}
            handlePurchaseSubmit={c.handlePurchaseSubmit}
            handleQaReportSubmit={c.handleQaReportSubmit}
            handleMilestoneReportSubmit={c.handleMilestoneReportSubmit}
            handleWorkLogSubmit={c.handleWorkLogSubmit}
            handleSubsystemSubmit={c.handleSubsystemSubmit}
            handleTaskSubmit={c.handleTaskSubmit}
            handleResolveTaskBlocker={c.handleResolveTaskBlocker}
            handleWorkstreamSubmit={c.handleWorkstreamSubmit}
            isDeletingMaterial={c.isDeletingMaterial}
            isDeletingArtifact={c.isDeletingArtifact}
            isDeletingPartDefinition={c.isDeletingPartDefinition}
            isDeletingMechanism={c.isDeletingMechanism}
            isDeletingTask={c.isDeletingTask}
            isSavingManufacturing={c.isSavingManufacturing}
            isSavingArtifact={c.isSavingArtifact}
            isSavingMaterial={c.isSavingMaterial}
            isSavingPartDefinition={c.isSavingPartDefinition}
            isSavingPartInstance={c.isSavingPartInstance}
            isSavingMechanism={c.isSavingMechanism}
            isSavingPurchase={c.isSavingPurchase}
            isSavingQaReport={c.isSavingQaReport}
            isSavingMilestoneReport={c.isSavingMilestoneReport}
            isSavingWorkLog={c.isSavingWorkLog}
            isSavingSubsystem={c.isSavingSubsystem}
            isSavingTask={c.isSavingTask}
            isSavingWorkstream={c.isSavingWorkstream}
            artifactDraft={c.artifactDraft}
            artifactModalMode={c.artifactModalMode}
            manufacturingDraft={c.manufacturingDraft}
            manufacturingModalMode={c.manufacturingModalMode}
            materialDraft={c.materialDraft}
            materialModalMode={c.materialModalMode}
            mechanismsById={c.mechanismsById}
            mentors={c.mentors}
            mechanismDraft={c.mechanismDraft}
            mechanismModalMode={c.mechanismModalMode}
            partInstanceDraft={c.partInstanceDraft}
            partInstanceModalMode={c.partInstanceModalMode}
            partDefinitionDraft={c.partDefinitionDraft}
            partDefinitionModalMode={c.partDefinitionModalMode}
            partDefinitionsById={c.partDefinitionsById}
            partInstancesById={c.partInstancesById}
            purchaseDraft={c.purchaseDraft}
            purchaseFinalCost={c.purchaseFinalCost}
            purchaseModalMode={c.purchaseModalMode}
            qaReportDraft={c.qaReportDraft}
            qaReportModalMode={c.qaReportModalMode}
            milestoneReportDraft={c.milestoneReportDraft}
            milestoneReportFindings={c.milestoneReportFindings}
            milestoneReportModalMode={c.milestoneReportModalMode}
            workLogDraft={c.workLogDraft}
            workLogModalMode={c.workLogModalMode}
            workstreamDraft={c.workstreamDraft}
            workstreamModalMode={c.workstreamModalMode}
            setArtifactDraft={c.setArtifactDraft}
            setMechanismDraft={c.setMechanismDraft}
            setManufacturingDraft={c.setManufacturingDraft}
            setMaterialDraft={c.setMaterialDraft}
            setPartInstanceDraft={c.setPartInstanceDraft}
            setPartDefinitionDraft={c.setPartDefinitionDraft}
            setPurchaseDraft={c.setPurchaseDraft}
            setPurchaseFinalCost={c.setPurchaseFinalCost}
            setQaReportDraft={c.setQaReportDraft}
            setMilestoneReportDraft={c.setMilestoneReportDraft}
            setMilestoneReportFindings={c.setMilestoneReportFindings}
            setWorkLogDraft={c.setWorkLogDraft}
            setWorkstreamDraft={c.setWorkstreamDraft}
            setSubsystemDraft={c.setSubsystemDraft}
            setSubsystemDraftRisks={c.setSubsystemDraftRisks}
            setTaskDraft={c.setTaskDraft}
            showTimelineCreateToggleInTaskModal={c.showTimelineCreateToggleInTaskModal}
            onSwitchTaskCreateToMilestone={c.switchTaskCreateToMilestone}
            onOpenTaskEditFromTimelineDetails={c.openEditTaskModal}
            openTaskDetailsModal={c.openTimelineTaskDetailsModal}
            students={c.students}
            subsystemDraft={c.subsystemDraft}
            subsystemDraftRisks={c.subsystemDraftRisks}
            subsystemModalMode={c.subsystemModalMode}
            taskDraft={c.taskDraft}
            taskModalMode={c.taskModalMode}
          />
        </Suspense>
      ) : null}
    </>
  );
}
