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
    materialEditor: ReturnType<typeof useMaterialEditor>;
    interactiveTutorialChapters: ReturnType<typeof useInteractiveTutorial>["chapterStartOptions"];
  };

export function useAppWorkspaceModel(state: AppWorkspaceState): AppWorkspaceModel {
  const derived = useAppWorkspaceDerived(state);
  const loader = useAppWorkspaceLoader(state, {
    ...state,
    ...derived,
  });
  const { loadWorkspace } = loader;
  const materialEditor = useMaterialEditor({ handleUnauthorized: loader.handleUnauthorized, loadWorkspace, setDataMessage: state.setDataMessage });
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
    activeTimelineTaskDetailId: state.activeTimelineTaskDetailId,
    taskModalMode: state.taskModalMode,
    activeTaskId: state.activeTaskId,
    materialModalMode: materialEditor.materialModalMode,
    activeMaterialId: materialEditor.activeMaterialId,
    subsystemModalMode: state.subsystemModalMode,
    activeSubsystemId: state.activeSubsystemId,
    mechanismModalMode: state.mechanismModalMode,
    activeMechanismId: state.activeMechanismId,
    manufacturingModalMode: state.manufacturingModalMode,
    activeManufacturingId: state.activeManufacturingId,
    workstreamModalMode: state.workstreamModalMode,
    activeWorkstreamId: state.activeWorkstreamId,
  });

  return {
    ...state,
    ...derived,
    ...loader,
    materialEditor,
    ...interactiveTutorial,
    interactiveTutorialChapters: interactiveTutorial.chapterStartOptions,
    isWorkspaceModalOpen: derived.isWorkspaceModalOpen || materialEditor.materialModalMode !== null || interactiveTutorial.isInteractiveTutorialActive,
  };
}
