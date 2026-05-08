import {
  useCallback,
  useMemo,
  type MouseEvent as ReactMouseEvent,
} from "react";

import {
  type InventoryViewTab,
  type NavigationSection,
  type NavigationSubItemId,
  type NavigationTarget,
  NAVIGATION_SECTION_ORDER,
  NAVIGATION_SUB_ITEMS,
  NAVIGATION_SUB_ITEMS_BY_SECTION,
  getActiveNavigationSubItemId,
  getNavigationSectionFromSubItem,
  type ReportsViewTab,
  type RosterViewTab,
  type RiskManagementViewTab,
  type TaskViewTab,
  type ViewTab,
  type WorklogsViewTab,
} from "@/lib/workspaceNavigation";
import type { ProjectRecord } from "@/types/recordsOrganization";
import { IconChevronLeft, IconChevronRight } from "@/components/shared/Icons";

import { AppSidebarPopups, ADD_ROBOT_PROJECT_VALUE } from "./AppSidebarPopups";
import { AppSidebarProjectFooter } from "./AppSidebarProjectFooter";
import { AppSidebarSections, type SidebarSubItemModel } from "./AppSidebarSections";
import { useAppSidebarPopupState } from "./useAppSidebarPopupState";

interface AppSidebarProps {
  activeTab: ViewTab;
  items: import("@/lib/workspaceNavigation").NavigationItem[];
  onSelectTarget: (target: NavigationTarget, options?: { keepSidebarOpen?: boolean }) => void;
  isCollapsed: boolean;
  toggleSidebar: () => void;
  projects: ProjectRecord[];
  selectedProjectId: string | null;
  inventoryView: InventoryViewTab;
  reportsView: ReportsViewTab;
  rosterView: RosterViewTab;
  riskManagementView: RiskManagementViewTab;
  taskView: TaskViewTab;
  worklogsView: WorklogsViewTab;
  onSelectProject: (projectId: string | null) => void;
  onCreateRobot: () => void;
  onEditSelectedRobot: () => void;
}

export function AppSidebar({
  activeTab,
  items,
  onSelectTarget,
  isCollapsed,
  toggleSidebar,
  projects,
  selectedProjectId,
  inventoryView,
  reportsView,
  rosterView,
  riskManagementView,
  taskView,
  worklogsView,
  onSelectProject,
  onCreateRobot,
  onEditSelectedRobot,
}: AppSidebarProps) {
  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? null;
  const isRobotProject = selectedProject?.projectType === "robot";
  const canEditSelectedRobot = selectedProject?.projectType === "robot";
  const selectedProjectLabel = selectedProject?.name ?? "All projects";

  const visibleTabs = useMemo(() => new Set(items.map((item) => item.value)), [items]);

  const activeSubItemId = getActiveNavigationSubItemId({
    activeTab,
    inventoryView,
    manufacturingView: "cnc",
    rosterView,
    reportsView,
    riskManagementView,
    taskView,
    worklogsView,
  });
  const activeSection = activeSubItemId
    ? getNavigationSectionFromSubItem(activeSubItemId)
    : "dashboard";

  const {
    compactPopupRef,
    compactPopupSection,
    compactPopupTop,
    expandedSection,
    isProjectPopupOpen,
    projectPopupRef,
    projectPopupTop,
    projectTriggerRef,
    setCompactPopupSection,
    setCompactPopupTop,
    setExpandedSection,
    setIsProjectPopupOpen,
    setProjectPopupTop,
    sidebarShellRef,
  } = useAppSidebarPopupState({ activeSection, isCollapsed });

  const isSubItemEnabled = useCallback(
    (subItemId: NavigationSubItemId) => {
      const subItem = NAVIGATION_SUB_ITEMS.find((item) => item.id === subItemId);
      if (subItem && !visibleTabs.has(subItem.target.tab)) {
        return false;
      }

      if (subItemId === "config-robot-model") {
        return isRobotProject;
      }

      if (subItemId === "inventory-parts") {
        return isRobotProject;
      }

      return true;
    },
    [isRobotProject, visibleTabs],
  );

  const getSectionSubItems = useCallback(
    (section: NavigationSection): SidebarSubItemModel[] =>
      NAVIGATION_SUB_ITEMS_BY_SECTION[section].map((subItem) => ({
        ...subItem,
        isEnabled: isSubItemEnabled(subItem.id),
      })),
    [isSubItemEnabled],
  );

  const sectionModels = useMemo(
    () =>
      NAVIGATION_SECTION_ORDER.map((section) => {
        const subItems = getSectionSubItems(section);
        return {
          section,
          subItems,
          isEnabled: subItems.some((subItem) => subItem.isEnabled),
        };
      }),
    [getSectionSubItems],
  );

  const handleSectionClick = (section: NavigationSection, event: ReactMouseEvent<HTMLButtonElement>) => {
    const subItems = getSectionSubItems(section);
    const firstEnabledSubItem = subItems.find((subItem) => subItem.isEnabled);

    if (isCollapsed) {
      const shellRect = sidebarShellRef.current?.getBoundingClientRect();
      const targetRect = event.currentTarget.getBoundingClientRect();
      const popupTop = shellRect ? targetRect.top - shellRect.top : 0;
      setCompactPopupTop(popupTop);
      setIsProjectPopupOpen(false);
      setCompactPopupSection((current) => (current === section ? null : section));
      return;
    }

    setExpandedSection(section);

    if (firstEnabledSubItem) {
      onSelectTarget(firstEnabledSubItem.target, { keepSidebarOpen: true });
    }
  };

  const handleSubItemSelect = (target: NavigationTarget, isEnabled: boolean) => {
    if (!isEnabled) {
      return;
    }

    onSelectTarget(target);
    setCompactPopupSection(null);
  };

  const handleProjectTriggerClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    const shellRect = sidebarShellRef.current?.getBoundingClientRect();
    const targetRect = event.currentTarget.getBoundingClientRect();
    const popupTop = shellRect ? targetRect.top - shellRect.top : 0;
    setProjectPopupTop(popupTop);

    if (isCollapsed) {
      setCompactPopupSection(null);
    }

    setIsProjectPopupOpen((current) => !current);
  };

  const handleProjectOptionSelect = (value: string) => {
    if (value === ADD_ROBOT_PROJECT_VALUE) {
      onCreateRobot();
    } else {
      onSelectProject(value || null);
    }

    setIsProjectPopupOpen(false);
  };

  const handleHelpSelect = () => {
    setCompactPopupSection(null);
    setIsProjectPopupOpen(false);
    onSelectTarget({ tab: "help" }, { keepSidebarOpen: true });
  };

  return (
    <div className="sidebar-shell" data-collapsed={isCollapsed ? "true" : "false"} ref={sidebarShellRef}>
      <nav aria-label="Workspace views" className="sidebar" data-collapsed={isCollapsed ? "true" : "false"}>
        <button
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="tab"
          onClick={toggleSidebar}
          title="Toggle sidebar"
          type="button"
        >
          <span className="sidebar-tab-main">
            <span aria-hidden="true" className="sidebar-tab-icon">
              {isCollapsed ? <IconChevronRight /> : <IconChevronLeft />}
            </span>
            {!isCollapsed ? <span className="sidebar-tab-label">Collapse sidebar</span> : null}
          </span>
        </button>

        <AppSidebarSections
          activeSection={activeSection}
          activeSubItemId={activeSubItemId}
          expandedSection={expandedSection}
          isCollapsed={isCollapsed}
          onSectionClick={handleSectionClick}
          onSubItemSelect={handleSubItemSelect}
          sectionModels={sectionModels}
        />

        <AppSidebarProjectFooter
          activeTab={activeTab}
          canEditSelectedRobot={canEditSelectedRobot}
          isCollapsed={isCollapsed}
          isProjectPopupOpen={isProjectPopupOpen}
          onEditSelectedRobot={onEditSelectedRobot}
          onHelpSelect={handleHelpSelect}
          onProjectTriggerClick={handleProjectTriggerClick}
          projectTriggerRef={projectTriggerRef}
          selectedProject={selectedProject}
          selectedProjectLabel={selectedProjectLabel}
        />
      </nav>
      <AppSidebarPopups
        activeSubItemId={activeSubItemId}
        compactPopupRef={compactPopupRef}
        compactPopupSection={compactPopupSection}
        compactPopupTop={compactPopupTop}
        getSectionSubItems={getSectionSubItems}
        isCollapsed={isCollapsed}
        isProjectPopupOpen={isProjectPopupOpen}
        onSelectProjectOption={handleProjectOptionSelect}
        onSubItemSelect={handleSubItemSelect}
        projectPopupRef={projectPopupRef}
        projectPopupTop={projectPopupTop}
        projects={projects}
        selectedProjectId={selectedProjectId}
      />
    </div>
  );
}
