import { useTaskEditor } from "@/app/hooks/workspace/task/useTaskEditor";
import { useWorkspaceEventActions } from "@/app/hooks/workspace/task/useWorkspaceEventActions";
import { useManufacturingActions } from "@/app/workspaceCatalog/manufacturingActions";
import { usePurchaseActions } from "@/app/workspaceCatalog/purchaseActions";
import { useMechanismActions } from "@/app/workspaceCatalog/mechanismActions";
import { useSubsystemActions } from "@/app/workspaceCatalog/subsystemActions";
import { usePartInstanceActions } from "@/app/workspaceCatalog/partInstanceActions";
import { usePartDefinitionActions } from "@/app/workspaceCatalog/partDefinitionActions";
import { useWorkstreamActions } from "@/app/workspaceCatalog/workstreamActions";
import { useArtifactActions } from "@/app/workspaceCatalog/artifactActions";
import { enterLocalDemo } from "@/lib/localWorkspace/session";
import { useMaterialEditor } from "@/app/workspaceCatalog/materialActions";
import { useEffect, useRef } from "react";
import { useAppWorkspaceDerived } from "@/app/hooks/useAppWorkspaceDerived";
import { useAppWorkspaceLoader } from "@/app/hooks/useAppWorkspaceLoader";
import { useInteractiveTutorial } from "@/app/interactiveTutorial/useInteractiveTutorial";
import {
  PUBLIC_DEMO_SEASON_ID,
  shouldAutoLoadPublicDemoWorkspace,
  shouldResetAuthenticatedPublicDemoSeasonScope,
} from "@/app/publicDemoAccess";
import type { AppWorkspaceDerived } from "@/app/hooks/useAppWorkspaceDerived";
import type { AppWorkspaceLoader } from "@/app/hooks/useAppWorkspaceLoader";
import type { AppWorkspaceState } from "@/app/hooks/useAppWorkspaceState";

export type AppWorkspaceModel = AppWorkspaceState &
  AppWorkspaceDerived &
  AppWorkspaceLoader &
  ReturnType<typeof useInteractiveTutorial> & {
    taskEditor: ReturnType<typeof useTaskEditor>;
    eventActions: ReturnType<typeof useWorkspaceEventActions>;
    artifactEditor: ReturnType<typeof useArtifactActions>;
    workstreamEditor: ReturnType<typeof useWorkstreamActions>;
    partDefinitionEditor: ReturnType<typeof usePartDefinitionActions>;
    partInstanceEditor: ReturnType<typeof usePartInstanceActions>;
    subsystemEditor: ReturnType<typeof useSubsystemActions>;
    mechanismEditor: ReturnType<typeof useMechanismActions>;
    purchaseEditor: ReturnType<typeof usePurchaseActions>;
    manufacturingEditor: ReturnType<typeof useManufacturingActions>;
    materialEditor: ReturnType<typeof useMaterialEditor>;
    interactiveTutorialChapters: ReturnType<typeof useInteractiveTutorial>["chapterStartOptions"];
  };

export function useAppWorkspaceModel(state: AppWorkspaceState): AppWorkspaceModel {
  const derived = useAppWorkspaceDerived(state);
  const loader = useAppWorkspaceLoader(state);
  const { loadWorkspace } = loader;
  const taskEditor = useTaskEditor({
    bootstrap: state.bootstrap,
    scopedBootstrap: derived.scopedBootstrap,
    selectedProjectId: state.selectedProjectId,
    selectedSeasonId: state.selectedSeasonId,
    setBootstrap: state.setBootstrap,
    handleUnauthorized: loader.handleUnauthorized,
    loadWorkspace,
    setDataMessage: state.setDataMessage,
    enqueueTaskEditNotice: state.enqueueTaskEditNotice,
  });
  const eventActions = useWorkspaceEventActions({ handleUnauthorized: loader.handleUnauthorized, loadWorkspace });
  const materialEditor = useMaterialEditor({
    bootstrap: state.bootstrap, selectedProjectId: state.selectedProjectId, selectedSeasonId: state.selectedSeasonId,
    handleUnauthorized: loader.handleUnauthorized, loadWorkspace, setDataMessage: state.setDataMessage,
  });
  const artifactEditor = useArtifactActions({
    bootstrap: state.bootstrap,
    handleUnauthorized: loader.handleUnauthorized,
    loadWorkspace: loader.loadWorkspace,
    scopedBootstrap: derived.scopedBootstrap,
    selectedProjectId: state.selectedProjectId,
    setDataMessage: state.setDataMessage,
    selectedSeasonId: state.selectedSeasonId
  });
  const workstreamEditor = useWorkstreamActions({
    bootstrap: state.bootstrap,
    handleUnauthorized: loader.handleUnauthorized,
    loadWorkspace: loader.loadWorkspace,
    scopedBootstrap: derived.scopedBootstrap,
    selectedProjectId: state.selectedProjectId,
    setDataMessage: state.setDataMessage,
    selectedSeasonId: state.selectedSeasonId
  });
  const partDefinitionEditor = usePartDefinitionActions({
    bootstrap: state.bootstrap,
    handleUnauthorized: loader.handleUnauthorized,
    loadWorkspace: loader.loadWorkspace,
    selectedSeasonId: state.selectedSeasonId,
    setBootstrap: state.setBootstrap,
    setDataMessage: state.setDataMessage,
    selectedProjectId: state.selectedProjectId
  });
  const partInstanceEditor = usePartInstanceActions({
    bootstrap: state.bootstrap,
    handleUnauthorized: loader.handleUnauthorized,
    loadWorkspace: loader.loadWorkspace,
    setBootstrap: state.setBootstrap,
    setDataMessage: state.setDataMessage,
    selectedProjectId: state.selectedProjectId,
    selectedSeasonId: state.selectedSeasonId
  });
  const subsystemEditor = useSubsystemActions({
    bootstrap: state.bootstrap,
    handleUnauthorized: loader.handleUnauthorized,
    loadWorkspace: loader.loadWorkspace,
    scopedBootstrap: derived.scopedBootstrap,
    selectedProjectId: state.selectedProjectId,
    setBootstrap: state.setBootstrap,
    setDataMessage: state.setDataMessage,
    selectedSeasonId: state.selectedSeasonId
  });
  const mechanismEditor = useMechanismActions({
    bootstrap: state.bootstrap,
    handleUnauthorized: loader.handleUnauthorized,
    loadWorkspace: loader.loadWorkspace,
    scopedBootstrap: derived.scopedBootstrap,
    setDataMessage: state.setDataMessage,
    selectedProjectId: state.selectedProjectId,
    selectedSeasonId: state.selectedSeasonId
  });
  const purchaseEditor = usePurchaseActions({
    bootstrap: state.bootstrap, selectedProjectId: state.selectedProjectId, selectedSeasonId: state.selectedSeasonId,
    handleUnauthorized: loader.handleUnauthorized, loadWorkspace, setDataMessage: state.setDataMessage,
  });
  const manufacturingEditor = useManufacturingActions({
    bootstrap: state.bootstrap, selectedProjectId: state.selectedProjectId, selectedSeasonId: state.selectedSeasonId,
    handleUnauthorized: loader.handleUnauthorized, loadWorkspace, setDataMessage: state.setDataMessage,
    signedInMemberId: derived.signedInMember?.id ?? null,
  });
  const autoLoadedWorkspaceKeyRef = useRef<string | null>(null);
  const {
    authBooting,
    enforcedAuthConfig,
    isPublicDemoSession,
    isSignInScreenRequested,
    selectedSeasonId,
    sessionUser,
    setSelectedProjectId,
    setSelectedSeasonId,
  } = state;

  useEffect(() => {
    if (authBooting) {
      return;
    }

    if (enforcedAuthConfig && !sessionUser && !isPublicDemoSession) {
      autoLoadedWorkspaceKeyRef.current = null;
      return;
    }

    if (
      isPublicDemoSession &&
      !shouldAutoLoadPublicDemoWorkspace({
        isPublicDemoSession,
        isSignInScreenRequested,
      })
    ) {
      autoLoadedWorkspaceKeyRef.current = null;
      return;
    }

    const autoLoadKey = isPublicDemoSession
      ? `public-demo:${PUBLIC_DEMO_SEASON_ID}`
      : sessionUser
        ? `session:${sessionUser.accountId}`
        : "local";

    if (autoLoadedWorkspaceKeyRef.current === autoLoadKey) {
      return;
    }

    autoLoadedWorkspaceKeyRef.current = autoLoadKey;
    if (isPublicDemoSession) {
      enterLocalDemo();
      setSelectedSeasonId(PUBLIC_DEMO_SEASON_ID);
      setSelectedProjectId(null);
      void loadWorkspace({ seasonId: PUBLIC_DEMO_SEASON_ID, projectId: null, personId: null });
      return;
    }

    if (
      shouldResetAuthenticatedPublicDemoSeasonScope({
        selectedSeasonId,
        sessionUser,
      })
    ) {
      setSelectedSeasonId(null);
      setSelectedProjectId(null);
      void loadWorkspace({ seasonId: null, projectId: null, personId: null });
      return;
    }

    void loadWorkspace();
  }, [
    authBooting,
    enforcedAuthConfig,
    isPublicDemoSession,
    isSignInScreenRequested,
    loadWorkspace,
    selectedSeasonId,
    sessionUser,
    setSelectedProjectId,
    setSelectedSeasonId,
  ]);

  const interactiveTutorial = useInteractiveTutorial({
    activeTab: state.activeTab,
    taskView: state.taskView,
    riskManagementView: state.riskManagementView,
    worklogsView: state.worklogsView,
    manufacturingView: state.manufacturingView,
    inventoryView: state.inventoryView,
    selectedSeasonId: state.selectedSeasonId,
    selectedProjectId: state.selectedProjectId,
    bootstrap: state.bootstrap,
    isSidebarCollapsed: state.isSidebarCollapsed,
    toggleSidebar: state.toggleSidebar,
    closeSidebarOverlay: derived.closeSidebarOverlay,
    handleUnauthorized: loader.handleUnauthorized,
    setActiveTab: state.setActiveTab,
    setTaskView: state.setTaskView,
    setRiskManagementView: state.setRiskManagementView,
    setWorklogsView: state.setWorklogsView,
    setManufacturingView: state.setManufacturingView,
    setInventoryView: state.setInventoryView,
    setSelectedSeasonId: state.setSelectedSeasonId,
    setSelectedProjectId: state.setSelectedProjectId,
    setActivePersonFilter: state.setActivePersonFilter,
    setBootstrap: state.setBootstrap,
    setDataMessage: state.setDataMessage,
    activeTimelineTaskDetailId: taskEditor.activeTimelineTaskDetailId,
    taskModalMode: taskEditor.taskModalMode,
    activeTaskId: taskEditor.activeTaskId,
    materialModalMode: materialEditor.materialModalMode,
    activeMaterialId: materialEditor.activeMaterialId,
    subsystemModalMode: subsystemEditor.subsystemModalMode,
    activeSubsystemId: subsystemEditor.activeSubsystemId,
    mechanismModalMode: mechanismEditor.mechanismModalMode,
    activeMechanismId: mechanismEditor.activeMechanismId,
    manufacturingModalMode: manufacturingEditor.manufacturingModalMode,
    activeManufacturingId: manufacturingEditor.activeManufacturingId,
    workstreamModalMode: workstreamEditor.workstreamModalMode,
    activeWorkstreamId: workstreamEditor.activeWorkstreamId,
  });

  return {
    ...state,
    ...derived,
    ...loader,
    taskEditor,
    eventActions,
    artifactEditor,
    workstreamEditor,
    partDefinitionEditor,
    partInstanceEditor,
    subsystemEditor,
    mechanismEditor,
    purchaseEditor,
    manufacturingEditor,
    materialEditor,
    ...interactiveTutorial,
    interactiveTutorialChapters: interactiveTutorial.chapterStartOptions,
    isWorkspaceModalOpen: derived.isWorkspaceModalOpen || interactiveTutorial.isInteractiveTutorialActive || Boolean(
      taskEditor.taskModalMode || taskEditor.activeTimelineTaskDetailId ||
      purchaseEditor.purchaseModalMode || manufacturingEditor.manufacturingModalMode ||
      artifactEditor.artifactModalMode || workstreamEditor.workstreamModalMode ||
      partDefinitionEditor.partDefinitionModalMode || partInstanceEditor.partInstanceModalMode ||
      subsystemEditor.subsystemModalMode || mechanismEditor.mechanismModalMode || materialEditor.materialModalMode
    ),
  };
}
