import { useCallback, useEffect, useRef, useState } from "react";

import "@/app/App.css";
import { useAppAuth } from "@/app/hooks/useAppAuth";
import { useAppShell } from "@/app/hooks/useAppShell";
import { isPublicDemoSeasonAccess } from "@/app/publicDemoAccess";
import { useAppWorkspaceGlobalEffects } from "@/app/hooks/workspace/derived/useAppWorkspaceGlobalEffects";
import { useAppWorkspaceUiState } from "@/app/hooks/useAppWorkspaceUiState";
import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import type { WorkspaceEditToastNotice } from "@/features/workspace/workspaceEditToastNotice";
import {
  appendWorkspaceToastHistory,
  appendWorkspaceToast,
  removeWorkspaceToast,
  type WorkspaceToastDismissReason,
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
  const [activeTab, setActiveTab] = useState<ViewTab>("home");
  const [tabSwitchDirection, setTabSwitchDirection] = useState<"up" | "down">("down");
  const [taskView, setTaskView] = useState<TaskViewTab>("timeline");
  const [riskManagementView, setRiskManagementView] =
    useState<RiskManagementViewTab>("kanban");
  const [worklogsView, setWorklogsView] = useState<WorklogsViewTab>("logs");
  const [reportsView, setReportsView] = useState<ReportsViewTab>("qa");
  const [manufacturingView, setManufacturingView] =
    useState<ManufacturingViewTab>("all");
  const [inventoryView, setInventoryView] = useState<InventoryViewTab>("materials");
  const [rosterView, setRosterView] = useState<RosterViewTab>("directory");
  const [bootstrap, setBootstrap] = useState<BootstrapPayload>(EMPTY_BOOTSTRAP);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataMessage, setDataMessage] = useState<string | null>(null);
  const [isSignInScreenRequested, setIsSignInScreenRequested] = useState(false);
  const [taskEditNotices, setTaskEditNotices] = useState<WorkspaceToastNotice[]>([]);
  const [notificationHistory, setNotificationHistory] = useState<WorkspaceToastNotice[]>([]);
  const [isNotificationQueueOpen, setIsNotificationQueueOpen] = useState(false);
  const lastRecordedDataMessageRef = useRef<string | null>(null);
  const nextDataMessageNoticeIdRef = useRef(0);
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

  const enqueueNotificationHistory = useCallback((notice: WorkspaceToastNotice) => {
    setNotificationHistory((current) => appendWorkspaceToastHistory(current, notice));
  }, []);

  useEffect(() => {
    if (!dataMessage) {
      lastRecordedDataMessageRef.current = null;
      return;
    }

    if (lastRecordedDataMessageRef.current === dataMessage) {
      return;
    }

    lastRecordedDataMessageRef.current = dataMessage;
    enqueueNotificationHistory({
      id: `workspace-data-message-${nextDataMessageNoticeIdRef.current++}`,
      message: dataMessage,
      title: "Error",
      tone: "error",
    });
  }, [dataMessage, enqueueNotificationHistory]);

  const enqueueTaskEditNotice = (notice: WorkspaceEditToastNotice) => {
    const id = `task-edit-notice-${nextTaskEditNoticeIdRef.current++}`;
    const toastNotice = { id, ...notice };
    setTaskEditNotices((current) => appendWorkspaceToast(current, toastNotice));
    enqueueNotificationHistory(toastNotice);
  };

  const dismissTaskEditNotice = (
    noticeId: string,
    reason: WorkspaceToastDismissReason = "auto",
  ) => {
    setTaskEditNotices((current) => removeWorkspaceToast(current, noticeId));
    if (reason === "manual") {
      setNotificationHistory((current) => removeWorkspaceToast(current, noticeId));
    }
  };

  const dismissNotificationHistoryItem = (noticeId: string) => {
    setNotificationHistory((current) => removeWorkspaceToast(current, noticeId));
  };

  const toggleNotificationQueue = () => {
    setIsNotificationQueueOpen((current) => !current);
  };

  const clearTaskEditNotices = () => {
    setTaskEditNotices([]);
  };

  const handleSessionExpired = useCallback(() => {
    setIsSignInScreenRequested(true);
  }, []);

  const { authBooting, authConfig, authMessage, clearAuthMessage, enforcedAuthConfig, expireSession, googleButtonRef, handleSignOut, handleDevBypassSignIn, handleRequestEmailCode, handleVerifyEmailCode, isEmailAuthAvailable, isGoogleAuthAvailable, isSigningIn, sessionUser } =
    useAppAuth({
      isDarkMode,
      onSessionExpired: handleSessionExpired,
      resetWorkspace: () => {
        setBootstrap(EMPTY_BOOTSTRAP);
        workspaceUiState.setActivePersonFilter([]);
        workspaceUiState.setIsUnmatchedMyViewActive(false);
        workspaceUiState.setSelectedSeasonId(null);
        workspaceUiState.setSelectedProjectId(null);
        workspaceUiState.setSelectedMemberId(null);
        workspaceUiState.setMemberEditDraft(null);
        setDataMessage(null);
        clearTaskEditNotices();
        setNotificationHistory([]);
        setIsNotificationQueueOpen(false);
      },
    });
  const isPublicDemoSession = isPublicDemoSeasonAccess({
    enforcedAuthConfig,
    selectedSeasonId: workspaceUiState.selectedSeasonId,
    sessionUser,
  });

  useEffect(() => {
    if (sessionUser) {
      setIsSignInScreenRequested(false);
    }
  }, [sessionUser]);

  const requestSignIn = () => {
    clearAuthMessage();
    setIsSignInScreenRequested(true);
  };

  const returnToPublicDemo = () => {
    clearAuthMessage();
    setIsSignInScreenRequested(false);
  };

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
    dismissNotificationHistoryItem,
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
    isSignInScreenRequested,
    isNotificationQueueOpen,
    isPublicDemoSession,
    isSigningIn,
    isSidebarCollapsed,
    isSidebarOverlay,
    manufacturingView,
    pageShellStyle,
    requestSignIn,
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
    toggleNotificationQueue,
    toggleSidebar,
    worklogsView,
    suppressNextAutoWorkspaceLoadRef,
    suppressNextAutoWorkspaceLoad,
    returnToPublicDemo,
    enforcedAuthConfig,
    clearTaskEditNotices,
    notificationHistory,
  };
}
