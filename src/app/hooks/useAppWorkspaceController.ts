import { useArtifactActions } from "@/app/workspaceCatalog/artifactActions";
import { useManufacturingActions } from "@/app/workspaceCatalog/manufacturingActions";
import { useMechanismActions } from "@/app/workspaceCatalog/mechanismActions";
import { usePartDefinitionActions } from "@/app/workspaceCatalog/partDefinitionActions";
import { usePartInstanceActions } from "@/app/workspaceCatalog/partInstanceActions";
import { usePurchaseActions } from "@/app/workspaceCatalog/purchaseActions";
import { useSubsystemActions } from "@/app/workspaceCatalog/subsystemActions";
import { useWorkstreamActions } from "@/app/workspaceCatalog/workstreamActions";
import { useAppWorkspaceModel } from "@/app/hooks/useAppWorkspaceModel";
import { useAppWorkspaceReportActions } from "@/app/hooks/useAppWorkspaceReportActions";
import { useAppWorkspaceRosterActions } from "@/app/hooks/useAppWorkspaceRosterActions";
import { useAppWorkspaceState } from "@/app/hooks/useAppWorkspaceState";
import { useAppWorkspaceTaskActions } from "@/app/hooks/useAppWorkspaceTaskActions";
export function useAppWorkspaceController() {
  const state = useAppWorkspaceState();
  const model = useAppWorkspaceModel(state);
  const taskActions = useAppWorkspaceTaskActions(model);
  const reportActions = useAppWorkspaceReportActions(model);
  const catalogActions = {
    ...usePurchaseActions({
      activePurchaseId: model.activePurchaseId,
      bootstrap: model.bootstrap,
      handleUnauthorized: model.handleUnauthorized,
      loadWorkspace: model.loadWorkspace,
      purchaseDraft: model.purchaseDraft,
      purchaseFinalCost: model.purchaseFinalCost,
      purchaseModalMode: model.purchaseModalMode,
      setActivePurchaseId: model.setActivePurchaseId,
      setDataMessage: model.setDataMessage,
      setIsSavingPurchase: model.setIsSavingPurchase,
      setPurchaseDraft: model.setPurchaseDraft,
      setPurchaseFinalCost: model.setPurchaseFinalCost,
      setPurchaseModalMode: model.setPurchaseModalMode,
    }),
    ...useManufacturingActions({
      activeManufacturingId: model.activeManufacturingId,
      bootstrap: model.bootstrap,
      handleUnauthorized: model.handleUnauthorized,
      loadWorkspace: model.loadWorkspace,
      manufacturingDraft: model.manufacturingDraft,
      manufacturingModalMode: model.manufacturingModalMode,
      setActiveManufacturingId: model.setActiveManufacturingId,
      setDataMessage: model.setDataMessage,
      setIsSavingManufacturing: model.setIsSavingManufacturing,
      setManufacturingDraft: model.setManufacturingDraft,
      setManufacturingModalMode: model.setManufacturingModalMode,
      signedInMember: model.signedInMember,
    }),
    ...useArtifactActions({
      activeArtifactId: model.activeArtifactId,
      artifactDraft: model.artifactDraft,
      artifactModalMode: model.artifactModalMode,
      bootstrap: model.bootstrap,
      handleUnauthorized: model.handleUnauthorized,
      loadWorkspace: model.loadWorkspace,
      scopedBootstrap: model.scopedBootstrap,
      selectedProjectId: model.selectedProjectId,
      setActiveArtifactId: model.setActiveArtifactId,
      setArtifactDraft: model.setArtifactDraft,
      setArtifactModalMode: model.setArtifactModalMode,
      setDataMessage: model.setDataMessage,
      setIsDeletingArtifact: model.setIsDeletingArtifact,
      setIsSavingArtifact: model.setIsSavingArtifact,
    }),
    ...useWorkstreamActions({
      activeWorkstreamId: model.activeWorkstreamId,
      bootstrap: model.bootstrap,
      handleUnauthorized: model.handleUnauthorized,
      loadWorkspace: model.loadWorkspace,
      scopedBootstrap: model.scopedBootstrap,
      selectedProjectId: model.selectedProjectId,
      setActiveWorkstreamId: model.setActiveWorkstreamId,
      setDataMessage: model.setDataMessage,
      setIsSavingWorkstream: model.setIsSavingWorkstream,
      setWorkstreamDraft: model.setWorkstreamDraft,
      setWorkstreamModalMode: model.setWorkstreamModalMode,
      workstreamDraft: model.workstreamDraft,
      workstreamModalMode: model.workstreamModalMode,
    }),
    ...usePartDefinitionActions({
      activePartDefinitionId: model.activePartDefinitionId,
      bootstrap: model.bootstrap,
      handleUnauthorized: model.handleUnauthorized,
      loadWorkspace: model.loadWorkspace,
      partDefinitionDraft: model.partDefinitionDraft,
      partDefinitionModalMode: model.partDefinitionModalMode,
      selectedSeasonId: model.selectedSeasonId,
      setActivePartDefinitionId: model.setActivePartDefinitionId,
      setBootstrap: model.setBootstrap,
      setDataMessage: model.setDataMessage,
      setIsDeletingPartDefinition: model.setIsDeletingPartDefinition,
      setIsSavingPartDefinition: model.setIsSavingPartDefinition,
      setPartDefinitionDraft: model.setPartDefinitionDraft,
      setPartDefinitionModalMode: model.setPartDefinitionModalMode,
    }),
    ...usePartInstanceActions({
      activePartInstanceId: model.activePartInstanceId,
      bootstrap: model.bootstrap,
      handleUnauthorized: model.handleUnauthorized,
      loadWorkspace: model.loadWorkspace,
      partInstanceDraft: model.partInstanceDraft,
      partInstanceModalMode: model.partInstanceModalMode,
      setActivePartInstanceId: model.setActivePartInstanceId,
      setBootstrap: model.setBootstrap,
      setDataMessage: model.setDataMessage,
      setIsSavingPartInstance: model.setIsSavingPartInstance,
      setPartInstanceDraft: model.setPartInstanceDraft,
      setPartInstanceModalMode: model.setPartInstanceModalMode,
    }),
    ...useSubsystemActions({
      activeSubsystemId: model.activeSubsystemId,
      bootstrap: model.bootstrap,
      handleUnauthorized: model.handleUnauthorized,
      loadWorkspace: model.loadWorkspace,
      scopedBootstrap: model.scopedBootstrap,
      selectedProjectId: model.selectedProjectId,
      setActiveSubsystemId: model.setActiveSubsystemId,
      setBootstrap: model.setBootstrap,
      setDataMessage: model.setDataMessage,
      setIsSavingSubsystem: model.setIsSavingSubsystem,
      setSubsystemDraft: model.setSubsystemDraft,
      setSubsystemDraftRisks: model.setSubsystemDraftRisks,
      setSubsystemModalMode: model.setSubsystemModalMode,
      subsystemDraft: model.subsystemDraft,
      subsystemDraftRisks: model.subsystemDraftRisks,
      subsystemModalMode: model.subsystemModalMode,
    }),
    ...useMechanismActions({
      activeMechanismId: model.activeMechanismId,
      bootstrap: model.bootstrap,
      handleUnauthorized: model.handleUnauthorized,
      loadWorkspace: model.loadWorkspace,
      mechanismDraft: model.mechanismDraft,
      mechanismModalMode: model.mechanismModalMode,
      scopedBootstrap: model.scopedBootstrap,
      setActiveMechanismId: model.setActiveMechanismId,
      setDataMessage: model.setDataMessage,
      setIsDeletingMechanism: model.setIsDeletingMechanism,
      setIsSavingMechanism: model.setIsSavingMechanism,
      setMechanismDraft: model.setMechanismDraft,
      setMechanismModalMode: model.setMechanismModalMode,
    }),
  };
  const rosterActions = useAppWorkspaceRosterActions(model);
  return { auth: model, model, taskActions, reportActions, catalogActions, rosterActions };
}

export type AppWorkspaceController = ReturnType<typeof useAppWorkspaceController>;
