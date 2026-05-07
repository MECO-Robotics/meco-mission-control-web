import { useEffect, useMemo } from "react";

import { useWorkspaceDerivedData } from "@/features/workspace/useWorkspaceDerivedData";
import type { AppWorkspaceState } from "@/app/hooks/useAppWorkspaceState";
import type {
  AppWorkspaceDerivedSelection,
} from "@/app/hooks/workspace/derived/useAppWorkspaceDerivedSelection";
import type { ViewTab } from "@/lib/workspaceNavigation";

export function useAppWorkspaceDerivedWorkspace(
  state: AppWorkspaceState,
  selection: AppWorkspaceDerivedSelection,
) {
  const {
    activeTab,
    activeTimelineTaskDetailId,
    isSidebarOverlay,
    setActiveTab,
    setActiveTimelineTaskDetailId,
    setTabSwitchDirection,
    taskModalMode,
    workLogModalMode,
    qaReportModalMode,
    milestoneReportModalMode,
    purchaseModalMode,
    manufacturingModalMode,
    materialModalMode,
    partDefinitionModalMode,
    partInstanceModalMode,
    subsystemModalMode,
    mechanismModalMode,
    artifactModalMode,
    workstreamModalMode,
    isAddSeasonPopupOpen,
    robotProjectModalMode,
    toggleSidebar,
  } = state;

  const {
    activeTask,
    cncItems,
    disciplinesById,
    milestonesById,
    externalMembers,
    fabricationItems,
    mechanismsById,
    mentors,
    membersById,
    navigationItems,
    partDefinitionsById,
    partInstancesById,
    printItems,
    rosterMentors,
    students,
    subsystemsById,
  } = useWorkspaceDerivedData({
    activeTaskId: state.activeTaskId,
    bootstrap: selection.scopedBootstrap,
    isAllProjectsView: selection.isAllProjectsView,
    selectedProjectType: selection.selectedProjectType,
  });

  const activeTimelineTaskDetail = useMemo(
    () =>
      activeTimelineTaskDetailId
        ? selection.scopedBootstrap.tasks.find((task) => task.id === activeTimelineTaskDetailId) ??
          null
        : null,
    [activeTimelineTaskDetailId, selection.scopedBootstrap.tasks],
  );

  const visibleTabs = useMemo(
    () => new Set<ViewTab>(navigationItems.map((item) => item.value)),
    [navigationItems],
  );

  useEffect(() => {
    if (!visibleTabs.has(activeTab)) {
      setActiveTab("tasks");
    }
  }, [activeTab, setActiveTab, visibleTabs]);

  useEffect(() => {
    if (!activeTimelineTaskDetailId) {
      return;
    }

    if (
      !selection.scopedBootstrap.tasks.some((task) => task.id === activeTimelineTaskDetailId)
    ) {
      setActiveTimelineTaskDetailId(null);
    }
  }, [
    activeTimelineTaskDetailId,
    selection.scopedBootstrap.tasks,
    setActiveTimelineTaskDetailId,
  ]);

  const isWorkspaceModalOpen = Boolean(
    activeTimelineTaskDetailId ||
      taskModalMode ||
      workLogModalMode ||
      qaReportModalMode ||
      milestoneReportModalMode ||
      purchaseModalMode ||
      manufacturingModalMode ||
      materialModalMode ||
      partDefinitionModalMode ||
      partInstanceModalMode ||
      subsystemModalMode ||
      mechanismModalMode ||
      artifactModalMode ||
      workstreamModalMode ||
      isAddSeasonPopupOpen ||
      robotProjectModalMode,
  );

  const closeSidebarOverlay = () => {
    if (isSidebarOverlay) {
      toggleSidebar();
    }
  };

  const handleSidebarTabSelect = (
    tab: ViewTab,
    options?: { keepSidebarOpen?: boolean },
  ) => {
    if (tab !== activeTab) {
      const currentIndex = navigationItems.findIndex((item) => item.value === activeTab);
      const nextIndex = navigationItems.findIndex((item) => item.value === tab);

      if (currentIndex >= 0 && nextIndex >= 0) {
        setTabSwitchDirection(nextIndex > currentIndex ? "down" : "up");
      }

      setActiveTab(tab);
    }

    if (!options?.keepSidebarOpen) {
      closeSidebarOverlay();
    }
  };

  return {
    activeTask,
    activeTimelineTaskDetail,
    cncItems,
    disciplinesById,
    milestonesById,
    externalMembers,
    fabricationItems,
    handleSidebarTabSelect,
    isWorkspaceModalOpen,
    mechanismsById,
    mentors,
    membersById,
    navigationItems,
    partDefinitionsById,
    partInstancesById,
    printItems,
    rosterMentors,
    students,
    subsystemsById,
    closeSidebarOverlay,
  };
}

export type AppWorkspaceDerivedWorkspace = ReturnType<
  typeof useAppWorkspaceDerivedWorkspace
>;
