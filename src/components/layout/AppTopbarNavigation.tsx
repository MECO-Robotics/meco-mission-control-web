import {
  type InventoryViewTab,
  type ManufacturingViewTab,
  type NavigationTarget,
  NAVIGATION_SECTION_LABELS,
  NAVIGATION_SUB_ITEMS_BY_SECTION,
  type ReportsViewTab,
  type RosterViewTab,
  type RiskManagementViewTab,
  type TaskViewTab,
  type ViewTab,
  type WorklogsViewTab,
  getActiveNavigationSubItemId,
  getNavigationSectionFromSubItem,
} from "@/lib/workspaceNavigation";

function TopbarTabs<T extends string>({
  activeValue,
  ariaLabel,
  onChange,
  options,
  tutorialPrefix,
}: {
  activeValue: T;
  ariaLabel: string;
  onChange: (nextValue: T) => void;
  options: ReadonlyArray<{ value: T; label: string }>;
  tutorialPrefix?: string;
}) {
  return (
    <div
      className="tabbar workspace-section-tabs app-topbar-section-tabs"
      aria-label={ariaLabel}
      role="group"
    >
      {options.map((option) => {
        const isActive = activeValue === option.value;

        return (
          <button
            key={option.value}
            aria-pressed={isActive}
            className="tab"
            data-active={isActive ? "true" : "false"}
            data-tutorial-target={
              tutorialPrefix ? `${tutorialPrefix}-${option.value}` : undefined
            }
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

interface AppTopbarNavigationProps {
  activeTab: ViewTab;
  inventoryView: InventoryViewTab;
  isAllProjectsView: boolean;
  isNonRobotProject: boolean;
  onSelectTarget: (target: NavigationTarget) => void;
  manufacturingView: ManufacturingViewTab;
  reportsView: ReportsViewTab;
  rosterView: RosterViewTab;
  riskManagementView: RiskManagementViewTab;
  taskView: TaskViewTab;
  worklogsView: WorklogsViewTab;
}

export function AppTopbarNavigation({
  activeTab,
  inventoryView,
  isAllProjectsView,
  isNonRobotProject,
  onSelectTarget,
  manufacturingView,
  reportsView,
  rosterView,
  riskManagementView,
  taskView,
  worklogsView,
}: AppTopbarNavigationProps) {
  const activeSubItemId = getActiveNavigationSubItemId({
    activeTab,
    inventoryView,
    manufacturingView,
    rosterView,
    reportsView,
    riskManagementView,
    taskView,
    worklogsView,
  });
  const activeSection = getNavigationSectionFromSubItem(activeSubItemId);
  const showManufacturingOption = !isAllProjectsView && !isNonRobotProject;
  const sectionOptions = NAVIGATION_SUB_ITEMS_BY_SECTION[activeSection].filter(
    (subItem) => {
      if (subItem.id === "readiness-subsystems") {
        return !isAllProjectsView;
      }

      if (subItem.id === "config-robot-model") {
        return !isAllProjectsView && !isNonRobotProject;
      }

      if (subItem.id === "config-part-mappings") {
        return !isNonRobotProject;
      }

      if (subItem.id === "tasks-manufacturing") {
        return showManufacturingOption;
      }

      if (subItem.id === "inventory-parts") {
        return !isNonRobotProject;
      }

      return true;
    },
  );
  const optionById = new Map(sectionOptions.map((option) => [option.id, option]));
  const activeOptionId = optionById.has(activeSubItemId)
    ? activeSubItemId
    : sectionOptions[0]?.id;

  const options = sectionOptions.map((option) => ({
    value: option.id,
    label: option.label,
  }));

  return (
    <>
      <span className="app-topbar-page-label">
        {NAVIGATION_SECTION_LABELS[activeSection]}
      </span>
      {activeOptionId ? (
        <TopbarTabs
          activeValue={activeOptionId}
          ariaLabel={`${NAVIGATION_SECTION_LABELS[activeSection]} views`}
          onChange={(nextValue) => {
            const nextOption = optionById.get(nextValue);
            if (nextOption) {
              onSelectTarget(nextOption.target);
            }
          }}
          options={options}
          tutorialPrefix={`${activeSection}-view`}
        />
      ) : null}
    </>
  );
}
