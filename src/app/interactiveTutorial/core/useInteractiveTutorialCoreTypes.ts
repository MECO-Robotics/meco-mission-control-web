import type { Dispatch, SetStateAction } from "react";

import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type {
  InventoryViewTab,
  ManufacturingViewTab,
  ReportsViewTab,
  RiskManagementViewTab,
  TaskViewTab,
  ViewTab,
  WorklogsViewTab,
} from "@/lib/workspaceNavigation";
import type { BootstrapPayload } from "@/types/bootstrap";

export interface UseInteractiveTutorialOptions {
  activeTab: ViewTab;
  taskView: TaskViewTab;
  riskManagementView: RiskManagementViewTab;
  worklogsView: WorklogsViewTab;
  reportsView: ReportsViewTab;
  manufacturingView: ManufacturingViewTab;
  inventoryView: InventoryViewTab;
  selectedSeasonId: string | null;
  selectedProjectId: string | null;
  bootstrap: BootstrapPayload;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  closeSidebarOverlay: () => void;
  handleUnauthorized: () => void;
  setActiveTab: Dispatch<SetStateAction<ViewTab>>;
  setTaskView: Dispatch<SetStateAction<TaskViewTab>>;
  setRiskManagementView: Dispatch<SetStateAction<RiskManagementViewTab>>;
  setWorklogsView: Dispatch<SetStateAction<WorklogsViewTab>>;
  setReportsView: Dispatch<SetStateAction<ReportsViewTab>>;
  setManufacturingView: Dispatch<SetStateAction<ManufacturingViewTab>>;
  setInventoryView: Dispatch<SetStateAction<InventoryViewTab>>;
  setSelectedSeasonId: Dispatch<SetStateAction<string | null>>;
  setSelectedProjectId: Dispatch<SetStateAction<string | null>>;
  setActivePersonFilter: Dispatch<SetStateAction<FilterSelection>>;
  setBootstrap: Dispatch<SetStateAction<BootstrapPayload>>;
  setDataMessage: Dispatch<SetStateAction<string | null>>;
  activeTimelineTaskDetailId: string | null;
  taskModalMode: import("@/features/workspace").TaskModalMode;
  activeTaskId: string | null;
  materialModalMode: import("@/features/workspace").MaterialModalMode;
  activeMaterialId: string | null;
  subsystemModalMode: import("@/features/workspace").SubsystemModalMode;
  activeSubsystemId: string | null;
  mechanismModalMode: import("@/features/workspace").MechanismModalMode;
  activeMechanismId: string | null;
  manufacturingModalMode: import("@/features/workspace").ManufacturingModalMode;
  activeManufacturingId: string | null;
  workstreamModalMode: import("@/features/workspace").WorkstreamModalMode;
  activeWorkstreamId: string | null;
}
