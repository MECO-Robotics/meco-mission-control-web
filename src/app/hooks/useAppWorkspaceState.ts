import { useRef, useState } from "react";

import "@/app/App.css";
import { useAppAuth } from "@/app/hooks/useAppAuth";
import { useAppShell } from "@/app/hooks/useAppShell";
import { useAppWorkspaceGlobalEffects } from "@/app/hooks/workspace/derived/useAppWorkspaceGlobalEffects";
import { useAppWorkspaceUiState } from "@/app/hooks/useAppWorkspaceUiState";
import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import type { WorkspaceEditToastNotice } from "@/features/workspace/workspaceEditToastNotice";
import {
  appendWorkspaceToast,
  removeWorkspaceToast,
  type WorkspaceToastNotice,
} from "@/features/workspace/workspaceToastQueue";
import type {
  InventoryViewTab,
  ManufacturingViewTab,
  RosterViewTab,
  RiskManagementViewTab,
  ReportsViewTab,
  TaskViewTab,
  ViewTab,
  WorklogsViewTab,
} from "@/lib/workspaceNavigation";
import type { BootstrapPayload } from "@/types/bootstrap";

export type AppWorkspaceState = ReturnType<typeof useAppWorkspaceState>;

export function useAppWorkspaceState() {
  const [activeTab, setActiveTab] = useState<ViewTab>("tasks");
  const [tabSwitchDirection, setTabSwitchDirection] = useState<"up" | "down">("down");
  const [taskView, setTaskView] = useState<TaskViewTab>("timeline");
  const [riskManagementView, setRiskManagementView] =
    useState<RiskManagementViewTab>("kanban");
  const [worklogsView, setWorklogsView] = useState<WorklogsViewTab>("logs");
  const [reportsView, setReportsView] = useState<ReportsViewTab>("qa");
  const [manufacturingView, setManufacturingView] =
    useState<ManufacturingViewTab>("cnc");
  const [inventoryView, setInventoryView] = useState<InventoryViewTab>("materials");
  const [rosterView, setRosterView] = useState<RosterViewTab>("directory");
  const [bootstrap, setBootstrap] = useState<BootstrapPayload>(EMPTY_BOOTSTRAP);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataMessage, setDataMessage] = useState<string | null>(null);
  const [taskEditNotices, setTaskEditNotices] = useState<WorkspaceToastNotice[]>([]);
  const nextTaskEditNoticeIdRef = useRef(0);

  const {
    isDarkMode,
    isSidebarCollapsed,
    isSidebarOverlay,
    pageShellStyle,
    toggleDarkMode,
    toggleSidebar,
  } = useAppShell();
  const workspaceUiState = useAppWorkspaceUiState();
  const suppressNextAutoWorkspaceLoadRef = useRef(false);
  const suppressNextAutoWorkspaceLoad = () => {
    suppressNextAutoWorkspaceLoadRef.current = true;
  };

  const enqueueTaskEditNotice = (notice: WorkspaceEditToastNotice) => {
    const id = `task-edit-notice-${nextTaskEditNoticeIdRef.current++}`;
    setTaskEditNotices((current) => appendWorkspaceToast(current, { id, ...notice }));
  };

  const dismissTaskEditNotice = (noticeId: string) => {
    setTaskEditNotices((current) => removeWorkspaceToast(current, noticeId));
  };

  const clearTaskEditNotices = () => {
    setTaskEditNotices([]);
  };

  const { authBooting, authConfig, authMessage, clearAuthMessage, enforcedAuthConfig, expireSession, googleButtonRef, handleSignOut, handleDevBypassSignIn, handleRequestEmailCode, handleVerifyEmailCode, isEmailAuthAvailable, isGoogleAuthAvailable, isSigningIn, sessionUser } =
    useAppAuth({
      isDarkMode,
      resetWorkspace: () => {
        setBootstrap(EMPTY_BOOTSTRAP);
        workspaceUiState.setActivePersonFilter([]);
        workspaceUiState.setSelectedSeasonId(null);
        workspaceUiState.setSelectedProjectId(null);
        workspaceUiState.setSelectedMemberId(null);
        workspaceUiState.setMemberEditDraft(null);
        setDataMessage(null);
        clearTaskEditNotices();
      },
    });

  useAppWorkspaceGlobalEffects({
    isDarkMode,
    pageShellStyle,
    isSidebarOverlay,
    toggleSidebar,
    setDataMessage,
    isAddSeasonPopupOpen: workspaceUiState.isAddSeasonPopupOpen,
    setIsAddSeasonPopupOpen: workspaceUiState.setIsAddSeasonPopupOpen,
    robotProjectModalMode: workspaceUiState.robotProjectModalMode,
    setRobotProjectModalMode: workspaceUiState.setRobotProjectModalMode,
  });

  return {
    ...workspaceUiState,
    activeTab,
    authBooting,
    authConfig,
    authMessage,
    bootstrap,
    clearAuthMessage,
    dataMessage,
    expireSession,
    googleButtonRef,
    handleDevBypassSignIn,
    handleRequestEmailCode,
    handleSignOut,
    handleVerifyEmailCode,
    inventoryView,
    isDarkMode,
    isEmailAuthAvailable,
    isGoogleAuthAvailable,
    isLoadingData,
    isSigningIn,
    isSidebarCollapsed,
    isSidebarOverlay,
    manufacturingView,
    pageShellStyle,
    reportsView,
    rosterView,
    riskManagementView,
    setActiveTab,
    setBootstrap,
    setDataMessage,
    setInventoryView,
    setIsLoadingData,
    setManufacturingView,
    setRosterView,
    setReportsView,
    setRiskManagementView,
    setTabSwitchDirection,
    enqueueTaskEditNotice,
    dismissTaskEditNotice,
    setTaskView,
    setWorklogsView,
    sessionUser,
    tabSwitchDirection,
    taskEditNotices,
    taskView,
    toggleDarkMode,
    toggleSidebar,
    worklogsView,
    suppressNextAutoWorkspaceLoadRef,
    suppressNextAutoWorkspaceLoad,
    enforcedAuthConfig,
    clearTaskEditNotices,
  };
}
