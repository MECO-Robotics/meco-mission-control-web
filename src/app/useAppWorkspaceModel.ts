// @ts-nocheck
import { useAppWorkspaceDerived } from "@/app/useAppWorkspaceDerived";
import { useAppWorkspaceLoader } from "@/app/useAppWorkspaceLoader";
import { useInteractiveTutorial } from "@/app/interactiveTutorial/useInteractiveTutorial";
import type { AppWorkspaceDerived } from "@/app/useAppWorkspaceDerived";
import type { AppWorkspaceLoader } from "@/app/useAppWorkspaceLoader";
import type { AppWorkspaceState } from "@/app/useAppWorkspaceState";

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
