import { useEffect, useRef } from "react";
import { useAppWorkspaceDerived } from "@/app/hooks/useAppWorkspaceDerived";
import { useAppWorkspaceLoader } from "@/app/hooks/useAppWorkspaceLoader";
import { useInteractiveTutorial } from "@/app/interactiveTutorial/useInteractiveTutorial";
import { PUBLIC_DEMO_SEASON_ID } from "@/app/publicDemoAccess";
import type { AppWorkspaceDerived } from "@/app/hooks/useAppWorkspaceDerived";
import type { AppWorkspaceLoader } from "@/app/hooks/useAppWorkspaceLoader";
import type { AppWorkspaceState } from "@/app/hooks/useAppWorkspaceState";

export type AppWorkspaceModel = AppWorkspaceState &
  AppWorkspaceDerived &
  AppWorkspaceLoader &
  ReturnType<typeof useInteractiveTutorial> & {
    interactiveTutorialChapters: ReturnType<typeof useInteractiveTutorial>["chapterStartOptions"];
  };

export function useAppWorkspaceModel(state: AppWorkspaceState): AppWorkspaceModel {
  const derived = useAppWorkspaceDerived(state);
  const loader = useAppWorkspaceLoader(state, {
    ...state,
    ...derived,
  });
  const { loadWorkspace } = loader;
  const autoLoadedWorkspaceKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (state.authBooting) {
      return;
    }

    if (state.enforcedAuthConfig && !state.sessionUser && !state.isPublicDemoSession) {
      autoLoadedWorkspaceKeyRef.current = null;
      return;
    }

    const autoLoadKey = state.isPublicDemoSession
      ? `public-demo:${PUBLIC_DEMO_SEASON_ID}`
      : state.sessionUser
        ? `session:${state.sessionUser.accountId}`
        : "local";

    if (autoLoadedWorkspaceKeyRef.current === autoLoadKey) {
      return;
    }

    autoLoadedWorkspaceKeyRef.current = autoLoadKey;
    if (state.isPublicDemoSession) {
      state.setSelectedSeasonId(PUBLIC_DEMO_SEASON_ID);
      state.setSelectedProjectId(null);
      void loadWorkspace({ seasonId: PUBLIC_DEMO_SEASON_ID, projectId: null, personId: null });
      return;
    }

    void loadWorkspace();
  }, [
    loadWorkspace,
    state.authBooting,
    state.enforcedAuthConfig,
    state.isPublicDemoSession,
    state.sessionUser,
    state.setSelectedProjectId,
    state.setSelectedSeasonId,
  ]);

  const interactiveTutorial = useInteractiveTutorial({
    activeTab: state.activeTab,
    taskView: state.taskView,
    riskManagementView: state.riskManagementView,
    worklogsView: state.worklogsView,
    reportsView: state.reportsView,
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
    setReportsView: state.setReportsView,
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
    materialModalMode: state.materialModalMode,
    activeMaterialId: state.activeMaterialId,
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
    ...interactiveTutorial,
    interactiveTutorialChapters: interactiveTutorial.chapterStartOptions,
    isWorkspaceModalOpen: derived.isWorkspaceModalOpen || interactiveTutorial.isInteractiveTutorialActive,
  };
}
