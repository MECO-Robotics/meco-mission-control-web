import { type Dispatch, type SetStateAction } from "react";

import {
  BASE_SECTION_LABELS,
  MANUFACTURING_VIEW_OPTIONS,
  NON_ROBOT_INVENTORY_VIEW_OPTIONS,
  REPORTS_VIEW_OPTIONS,
  RISK_MANAGEMENT_VIEW_OPTIONS,
  ROBOT_INVENTORY_VIEW_OPTIONS,
  TASK_VIEW_OPTIONS,
  WORKLOG_VIEW_OPTIONS,
  type InventoryViewTab,
  type ManufacturingViewTab,
  type ReportsViewTab,
  type RiskManagementViewTab,
  type TaskViewTab,
  type ViewOption,
  type ViewTab,
  type WorklogsViewTab,
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
  onChange: Dispatch<SetStateAction<T>>;
  options: readonly ViewOption<T>[];
  tutorialPrefix?: string;
}) {
  return (
    <div className="tabbar workspace-section-tabs app-topbar-section-tabs" aria-label={ariaLabel} role="group">
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
  isNonRobotProject: boolean;
  manufacturingView: ManufacturingViewTab;
  reportsView: ReportsViewTab;
  riskManagementView: RiskManagementViewTab;
  setInventoryView: Dispatch<SetStateAction<InventoryViewTab>>;
  setManufacturingView: Dispatch<SetStateAction<ManufacturingViewTab>>;
  setReportsView: Dispatch<SetStateAction<ReportsViewTab>>;
  setRiskManagementView: Dispatch<SetStateAction<RiskManagementViewTab>>;
  setTaskView: Dispatch<SetStateAction<TaskViewTab>>;
  setWorklogsView: Dispatch<SetStateAction<WorklogsViewTab>>;
  subsystemsLabel: string;
  taskView: TaskViewTab;
  worklogsView: WorklogsViewTab;
}

export function AppTopbarNavigation({
  activeTab,
  inventoryView,
  isNonRobotProject,
  manufacturingView,
  reportsView,
  riskManagementView,
  setInventoryView,
  setManufacturingView,
  setReportsView,
  setRiskManagementView,
  setTaskView,
  setWorklogsView,
  subsystemsLabel,
  taskView,
  worklogsView,
}: AppTopbarNavigationProps) {
  const effectiveInventoryView =
    isNonRobotProject && inventoryView === "parts" ? "materials" : inventoryView;

  switch (activeTab) {
    case "tasks":
      return (
        <>
          <span className="app-topbar-page-label">{BASE_SECTION_LABELS.tasks}</span>
          <TopbarTabs
            activeValue={taskView}
            ariaLabel="Task views"
            onChange={setTaskView}
            options={TASK_VIEW_OPTIONS}
            tutorialPrefix="task-view"
          />
        </>
      );
    case "risk-management":
      return (
        <>
          <span className="app-topbar-page-label">{BASE_SECTION_LABELS["risk-management"]}</span>
          <TopbarTabs
            activeValue={riskManagementView}
            ariaLabel="Risk management views"
            onChange={setRiskManagementView}
            options={RISK_MANAGEMENT_VIEW_OPTIONS}
            tutorialPrefix="risk-management-view"
          />
        </>
      );
    case "worklogs":
      return (
        <>
          <span className="app-topbar-page-label">{BASE_SECTION_LABELS.worklogs}</span>
          <TopbarTabs
            activeValue={worklogsView}
            ariaLabel="Work log views"
            onChange={setWorklogsView}
            options={WORKLOG_VIEW_OPTIONS}
            tutorialPrefix="worklogs-view"
          />
        </>
      );
    case "reports":
      return (
        <>
          <span className="app-topbar-page-label">{BASE_SECTION_LABELS.reports}</span>
          <TopbarTabs
            activeValue={reportsView}
            ariaLabel="Report views"
            onChange={setReportsView}
            options={REPORTS_VIEW_OPTIONS}
            tutorialPrefix="reports-view"
          />
        </>
      );
    case "manufacturing":
      return (
        <>
          <span className="app-topbar-page-label">{BASE_SECTION_LABELS.manufacturing}</span>
          <TopbarTabs
            activeValue={manufacturingView}
            ariaLabel="Manufacturing views"
            onChange={setManufacturingView}
            options={MANUFACTURING_VIEW_OPTIONS}
            tutorialPrefix="manufacturing-view"
          />
        </>
      );
    case "inventory":
      return (
        <>
          <span className="app-topbar-page-label">{BASE_SECTION_LABELS.inventory}</span>
          <TopbarTabs
            activeValue={effectiveInventoryView}
            ariaLabel="Inventory views"
            onChange={setInventoryView}
            options={
              isNonRobotProject
                ? NON_ROBOT_INVENTORY_VIEW_OPTIONS
                : ROBOT_INVENTORY_VIEW_OPTIONS
            }
            tutorialPrefix="inventory-view"
          />
        </>
      );
    default:
      return (
        <span className="app-topbar-page-label">
          {activeTab === "subsystems" ? subsystemsLabel : BASE_SECTION_LABELS[activeTab]}
        </span>
      );
  }
}
