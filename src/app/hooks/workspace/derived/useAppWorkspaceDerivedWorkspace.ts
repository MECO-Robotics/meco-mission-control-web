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
    isSidebarOverlay,
    setActiveTab,
    setTabSwitchDirection,
    workLogModalMode,
    qaReportModalMode,
    milestoneReportModalMode,

    isAddSeasonPopupOpen,
    robotProjectModalMode,
    toggleSidebar,
  } = state;

  const workspaceData = useWorkspaceDerivedData({
    bootstrap: selection.scopedBootstrap,
    isAllProjectsView: selection.isAllProjectsView,
    selectedProjectType: selection.selectedProjectType,
  });

  const isWorkspaceModalOpen = Boolean(
    workLogModalMode ||
      qaReportModalMode ||
      milestoneReportModalMode ||

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
      const currentIndex = workspaceData.navigationItems.findIndex((item) => item.value === activeTab);
      const nextIndex = workspaceData.navigationItems.findIndex((item) => item.value === tab);

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
    ...workspaceData,
    handleSidebarTabSelect,
    isWorkspaceModalOpen,
    closeSidebarOverlay,
  };
}

export type AppWorkspaceDerivedWorkspace = ReturnType<
  typeof useAppWorkspaceDerivedWorkspace
>;
