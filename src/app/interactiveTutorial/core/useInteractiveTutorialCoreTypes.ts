import type { Dispatch, SetStateAction } from "react";

import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type {
  InventoryViewTab,
  TaskViewTab,
  ViewTab,
  WorklogsViewTab,
} from "@/lib/workspaceNavigation";
import type { BootstrapPayload } from "@/types/bootstrap";

export interface UseInteractiveTutorialOptions {
  activeTab: ViewTab;
  taskView: TaskViewTab;
  worklogsView: WorklogsViewTab;
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
  setWorklogsView: Dispatch<SetStateAction<WorklogsViewTab>>;
  setInventoryView: Dispatch<SetStateAction<InventoryViewTab>>;
  setSelectedSeasonId: Dispatch<SetStateAction<string | null>>;
  setSelectedProjectId: Dispatch<SetStateAction<string | null>>;
  setActivePersonFilter: Dispatch<SetStateAction<FilterSelection>>;
  setBootstrap: Dispatch<SetStateAction<BootstrapPayload>>;
  setDataMessage: Dispatch<SetStateAction<string | null>>;
  activeTimelineTaskDetailId: string | null;
  taskModalMode: import("@/features/workspace/shared/model/workspaceModalModes").TaskModalMode;
  activeTaskId: string | null;
  materialModalMode: import("@/features/workspace/shared/model/workspaceModalModes").MaterialModalMode;
  activeMaterialId: string | null;
  subsystemModalMode: import("@/features/workspace/shared/model/workspaceModalModes").SubsystemModalMode;
  activeSubsystemId: string | null;
  mechanismModalMode: import("@/features/workspace/shared/model/workspaceModalModes").MechanismModalMode;
  activeMechanismId: string | null;
  workstreamModalMode: import("@/features/workspace/shared/model/workspaceModalModes").WorkstreamModalMode;
  activeWorkstreamId: string | null;
}
