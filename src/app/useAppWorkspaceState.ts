// @ts-nocheck
import { useEffect, useRef, useState } from "react";

import "@/app/App.css";
import { useAppAuth } from "@/app/useAppAuth";
import { useAppShell } from "@/app/useAppShell";
import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/bootstrapDefaults";
import type { FilterSelection } from "@/features/workspace";
import type {
  ArtifactModalMode,
  EventReportModalMode,
  ManufacturingModalMode,
  MaterialModalMode,
  MechanismModalMode,
  PartDefinitionModalMode,
  PartInstanceModalMode,
  PurchaseModalMode,
  QaReportModalMode,
  SubsystemModalMode,
  TaskModalMode,
  WorkLogModalMode,
  WorkstreamModalMode,
} from "@/features/workspace";
import type {
  InventoryViewTab,
  ManufacturingViewTab,
  RiskManagementViewTab,
  ReportsViewTab,
  TaskViewTab,
  ViewTab,
  WorklogsViewTab,
} from "@/lib/workspaceNavigation";
import type {
  ArtifactPayload,
  BootstrapPayload,
  ManufacturingItemPayload,
  MaterialPayload,
  MechanismPayload,
  MemberPayload,
  PartDefinitionPayload,
  PartInstancePayload,
  PurchaseItemPayload,
  QaReportPayload,
  SubsystemPayload,
  TaskPayload,
  TestResultPayload,
  WorkLogPayload,
  WorkstreamPayload,
} from "@/types";
import {
  buildEmptyArtifactPayload,
  buildEmptyMechanismPayload,
  buildEmptyManufacturingPayload,
  buildEmptyMaterialPayload,
  buildEmptyPartDefinitionPayload,
  buildEmptyPartInstancePayload,
  buildEmptyPurchasePayload,
  buildEmptyQaReportPayload,
  buildEmptyWorkLogPayload,
  buildEmptyTestResultPayload,
  buildEmptySubsystemPayload,
  buildEmptyTaskPayload,
  buildEmptyWorkstreamPayload,
} from "@/lib/appUtils";

export type AppWorkspaceState = ReturnType<typeof useAppWorkspaceState>;

const BROWSER_ZOOM_SHORTCUT_KEYS = new Set(["+", "=", "-", "0", "add", "subtract"]);

function isBrowserZoomShortcut(event: KeyboardEvent) {
  if (!(event.ctrlKey || event.metaKey)) {
    return false;
  }

  const normalizedKey = event.key.toLowerCase();
  return BROWSER_ZOOM_SHORTCUT_KEYS.has(normalizedKey);
}

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
  const [bootstrap, setBootstrap] = useState<BootstrapPayload>(EMPTY_BOOTSTRAP);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataMessage, setDataMessage] = useState<string | null>(null);
  const [taskEditNotice, setTaskEditNotice] = useState<string | null>(null);

  const {
    isDarkMode,
    isSidebarCollapsed,
    isSidebarOverlay,
    pageShellStyle,
    toggleDarkMode,
    toggleSidebar,
  } = useAppShell();

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const rootStyle = document.documentElement.style;
    const themeVariables = Object.entries(pageShellStyle).filter(
      ([name, value]) => name.startsWith("--") && typeof value === "string",
    );

    themeVariables.forEach(([name, value]) => {
      rootStyle.setProperty(name, value);
    });
    document.documentElement.classList.toggle("dark-mode", isDarkMode);

    return () => {
      themeVariables.forEach(([name]) => {
        rootStyle.removeProperty(name);
      });
      document.documentElement.classList.remove("dark-mode");
    };
  }, [isDarkMode, pageShellStyle]);

  const [taskModalMode, setTaskModalMode] = useState<TaskModalMode>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activeTimelineTaskDetailId, setActiveTimelineTaskDetailId] = useState<string | null>(
    null,
  );
  const [taskDraft, setTaskDraft] = useState<TaskPayload>(
    buildEmptyTaskPayload(EMPTY_BOOTSTRAP),
  );
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [isDeletingTask, setIsDeletingTask] = useState(false);
  const [showTimelineCreateToggleInTaskModal, setShowTimelineCreateToggleInTaskModal] =
    useState(false);
  const [timelineMilestoneCreateSignal, setTimelineMilestoneCreateSignal] = useState(0);
  const suppressNextAutoWorkspaceLoadRef = useRef(false);

  const [workLogModalMode, setWorkLogModalMode] = useState<WorkLogModalMode>(null);
  const [workLogDraft, setWorkLogDraft] = useState<WorkLogPayload>(
    buildEmptyWorkLogPayload(EMPTY_BOOTSTRAP),
  );
  const [isSavingWorkLog, setIsSavingWorkLog] = useState(false);
  const [qaReportModalMode, setQaReportModalMode] = useState<QaReportModalMode>(null);
  const [qaReportDraft, setQaReportDraft] = useState<QaReportPayload>(
    buildEmptyQaReportPayload(EMPTY_BOOTSTRAP),
  );
  const [isSavingQaReport, setIsSavingQaReport] = useState(false);
  const [eventReportModalMode, setEventReportModalMode] = useState<EventReportModalMode>(null);
  const [eventReportDraft, setEventReportDraft] = useState<TestResultPayload>(
    buildEmptyTestResultPayload(EMPTY_BOOTSTRAP),
  );
  const [eventReportFindings, setEventReportFindings] = useState("");
  const [isSavingEventReport, setIsSavingEventReport] = useState(false);

  const [purchaseModalMode, setPurchaseModalMode] =
    useState<PurchaseModalMode>(null);
  const [activePurchaseId, setActivePurchaseId] = useState<string | null>(null);
  const [purchaseDraft, setPurchaseDraft] = useState<PurchaseItemPayload>(
    buildEmptyPurchasePayload(EMPTY_BOOTSTRAP),
  );
  const [purchaseFinalCost, setPurchaseFinalCost] = useState("");
  const [isSavingPurchase, setIsSavingPurchase] = useState(false);

  const [manufacturingModalMode, setManufacturingModalMode] =
    useState<ManufacturingModalMode>(null);
  const [activeManufacturingId, setActiveManufacturingId] = useState<string | null>(
    null,
  );
  const [manufacturingDraft, setManufacturingDraft] =
    useState<ManufacturingItemPayload>(
      buildEmptyManufacturingPayload(EMPTY_BOOTSTRAP, "cnc"),
    );
  const [isSavingManufacturing, setIsSavingManufacturing] = useState(false);

  const [materialModalMode, setMaterialModalMode] = useState<MaterialModalMode>(null);
  const [activeMaterialId, setActiveMaterialId] = useState<string | null>(null);
  const [materialDraft, setMaterialDraft] = useState<MaterialPayload>(
    buildEmptyMaterialPayload(),
  );
  const [isSavingMaterial, setIsSavingMaterial] = useState(false);
  const [isDeletingMaterial, setIsDeletingMaterial] = useState(false);

  const [partDefinitionModalMode, setPartDefinitionModalMode] =
    useState<PartDefinitionModalMode>(null);
  const [activePartDefinitionId, setActivePartDefinitionId] = useState<string | null>(
    null,
  );
  const [partDefinitionDraft, setPartDefinitionDraft] =
    useState<PartDefinitionPayload>(buildEmptyPartDefinitionPayload(EMPTY_BOOTSTRAP));
  const [isSavingPartDefinition, setIsSavingPartDefinition] = useState(false);
  const [isDeletingPartDefinition, setIsDeletingPartDefinition] = useState(false);

  const [artifactModalMode, setArtifactModalMode] =
    useState<ArtifactModalMode>(null);
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null);
  const [artifactDraft, setArtifactDraft] = useState<ArtifactPayload>(
    buildEmptyArtifactPayload(EMPTY_BOOTSTRAP, { kind: "document" }),
  );
  const [isSavingArtifact, setIsSavingArtifact] = useState(false);
  const [isDeletingArtifact, setIsDeletingArtifact] = useState(false);

  const [workstreamModalMode, setWorkstreamModalMode] =
    useState<WorkstreamModalMode>(null);
  const [activeWorkstreamId, setActiveWorkstreamId] = useState<string | null>(null);
  const [workstreamDraft, setWorkstreamDraft] = useState<WorkstreamPayload>(
    buildEmptyWorkstreamPayload(EMPTY_BOOTSTRAP),
  );
  const [isSavingWorkstream, setIsSavingWorkstream] = useState(false);

  const [partInstanceModalMode, setPartInstanceModalMode] =
    useState<PartInstanceModalMode>(null);
  const [activePartInstanceId, setActivePartInstanceId] = useState<string | null>(null);
  const [partInstanceDraft, setPartInstanceDraft] = useState<PartInstancePayload>(
    buildEmptyPartInstancePayload(EMPTY_BOOTSTRAP),
  );
  const [isSavingPartInstance, setIsSavingPartInstance] = useState(false);

  const [subsystemModalMode, setSubsystemModalMode] =
    useState<SubsystemModalMode>(null);
  const [activeSubsystemId, setActiveSubsystemId] = useState<string | null>(null);
  const [subsystemDraft, setSubsystemDraft] = useState<SubsystemPayload>(
    buildEmptySubsystemPayload(EMPTY_BOOTSTRAP),
  );
  const [subsystemDraftRisks, setSubsystemDraftRisks] = useState("");
  const [isSavingSubsystem, setIsSavingSubsystem] = useState(false);

  const [mechanismModalMode, setMechanismModalMode] =
    useState<MechanismModalMode>(null);
  const [activeMechanismId, setActiveMechanismId] = useState<string | null>(null);
  const [mechanismDraft, setMechanismDraft] = useState<MechanismPayload>(
    buildEmptyMechanismPayload(EMPTY_BOOTSTRAP),
  );
  const [isSavingMechanism, setIsSavingMechanism] = useState(false);
  const [isDeletingMechanism, setIsDeletingMechanism] = useState(false);

  const [activePersonFilter, setActivePersonFilter] = useState<FilterSelection>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState<MemberPayload>({
    name: "",
    email: "",
    photoUrl: "",
    role: "student",
    elevated: false,
  });
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [isEditPersonOpen, setIsEditPersonOpen] = useState(false);
  const [memberEditDraft, setMemberEditDraft] = useState<MemberPayload | null>(
    null,
  );
  const [isSavingMember, setIsSavingMember] = useState(false);
  const [isDeletingMember, setIsDeletingMember] = useState(false);
  const [isAddSeasonPopupOpen, setIsAddSeasonPopupOpen] = useState(false);
  const [seasonNameDraft, setSeasonNameDraft] = useState("");
  const [isSavingSeason, setIsSavingSeason] = useState(false);
  const [robotProjectModalMode, setRobotProjectModalMode] =
    useState<"create" | "edit" | null>(null);
  const [robotProjectNameDraft, setRobotProjectNameDraft] = useState("");
  const [isSavingRobotProject, setIsSavingRobotProject] = useState(false);

  const { authBooting, authConfig, authMessage, clearAuthMessage, enforcedAuthConfig, expireSession, googleButtonRef, handleSignOut, handleDevBypassSignIn, handleRequestEmailCode, handleVerifyEmailCode, isEmailAuthAvailable, isGoogleAuthAvailable, isSigningIn, sessionUser } =
    useAppAuth({
      isDarkMode,
      resetWorkspace: () => {
        setBootstrap(EMPTY_BOOTSTRAP);
        setActivePersonFilter([]);
        setSelectedSeasonId(null);
        setSelectedProjectId(null);
        setSelectedMemberId(null);
        setMemberEditDraft(null);
        setDataMessage(null);
      },
    });

  useEffect(() => {
    if (!taskEditNotice) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setTaskEditNotice(null);
    }, 4500);

    return () => window.clearTimeout(timeoutId);
  }, [taskEditNotice]);

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) {
        return;
      }

      event.preventDefault();
    };

    const handleGestureStart = (event: Event) => {
      event.preventDefault();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isBrowserZoomShortcut(event)) {
        return;
      }

      event.preventDefault();
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("gesturestart", handleGestureStart, { passive: false } as AddEventListenerOptions);
    window.addEventListener("gesturechange", handleGestureStart, { passive: false } as AddEventListenerOptions);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("gesturestart", handleGestureStart);
      window.removeEventListener("gesturechange", handleGestureStart);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!isSidebarOverlay) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        toggleSidebar();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isSidebarOverlay, toggleSidebar]);

  useEffect(() => {
    if (!isAddSeasonPopupOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsAddSeasonPopupOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isAddSeasonPopupOpen]);

  useEffect(() => {
    if (!robotProjectModalMode) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setRobotProjectModalMode(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [robotProjectModalMode]);

  return {
    activeArtifactId,
    activeMechanismId,
    activePersonFilter,
    activePartDefinitionId,
    activePartInstanceId,
    activePurchaseId,
    activeSubsystemId,
    activeTab,
    activeTaskId,
    activeTimelineTaskDetailId,
    activeWorkstreamId,
    artifactDraft,
    artifactModalMode,
    authBooting,
    authConfig,
    authMessage,
    bootstrap,
    clearAuthMessage,
    dataMessage,
    expireSession,
    eventReportDraft,
    eventReportFindings,
    eventReportModalMode,
    manufacturingModalMode,
    activeManufacturingId,
    googleButtonRef,
    handleDevBypassSignIn,
    handleRequestEmailCode,
    handleSignOut,
    handleVerifyEmailCode,
    inventoryView,
    isAddPersonOpen,
    isAddSeasonPopupOpen,
    isDarkMode,
    isDeletingArtifact,
    isDeletingMaterial,
    isDeletingMechanism,
    isDeletingMember,
    isDeletingPartDefinition,
    isDeletingTask,
    isEditPersonOpen,
    isEmailAuthAvailable,
    isGoogleAuthAvailable,
    isLoadingData,
    isSavingArtifact,
    isSavingEventReport,
    isSavingManufacturing,
    isSavingMaterial,
    isSavingMechanism,
    isSavingMember,
    isSavingPartDefinition,
    isSavingPartInstance,
    isSavingPurchase,
    isSavingQaReport,
    isSavingRobotProject,
    isSavingSeason,
    isSavingSubsystem,
    isSavingTask,
    isSavingWorkLog,
    isSavingWorkstream,
    isSigningIn,
    isSidebarCollapsed,
    isSidebarOverlay,
    materialModalMode,
    activeMaterialId,
    manufacturingDraft,
    manufacturingView,
    materialDraft,
    mechanismDraft,
    mechanismModalMode,
    memberEditDraft,
    memberForm,
    pageShellStyle,
    partDefinitionModalMode,
    partDefinitionDraft,
    partInstanceModalMode,
    partInstanceDraft,
    purchaseDraft,
    purchaseFinalCost,
    purchaseModalMode,
    qaReportDraft,
    qaReportModalMode,
    reportsView,
    riskManagementView,
    robotProjectModalMode,
    robotProjectNameDraft,
    seasonNameDraft,
    selectedMemberId,
    selectedProjectId,
    selectedSeasonId,
    setActiveArtifactId,
    setActiveManufacturingId,
    setActiveMechanismId,
    setActivePersonFilter,
    setActiveMaterialId,
    setActivePartDefinitionId,
    setActivePartInstanceId,
    setActivePurchaseId,
    setActiveSubsystemId,
    setActiveTab,
    setActiveTaskId,
    setActiveTimelineTaskDetailId,
    setActiveWorkstreamId,
    setArtifactDraft,
    setArtifactModalMode,
    setBootstrap,
    setDataMessage,
    setEventReportDraft,
    setEventReportFindings,
    setEventReportModalMode,
    setInventoryView,
    setIsAddPersonOpen,
    setIsAddSeasonPopupOpen,
    setIsDeletingArtifact,
    setIsDeletingMaterial,
    setIsDeletingMechanism,
    setIsDeletingMember,
    setIsDeletingPartDefinition,
    setIsDeletingTask,
    setIsEditPersonOpen,
    setIsLoadingData,
    setIsSavingArtifact,
    setIsSavingEventReport,
    setIsSavingManufacturing,
    setIsSavingMaterial,
    setIsSavingMechanism,
    setIsSavingMember,
    setIsSavingPartDefinition,
    setIsSavingPartInstance,
    setIsSavingPurchase,
    setIsSavingQaReport,
    setIsSavingRobotProject,
    setIsSavingSeason,
    setIsSavingSubsystem,
    setIsSavingTask,
    setIsSavingWorkLog,
    setIsSavingWorkstream,
    setManufacturingView,
    setManufacturingDraft,
    setManufacturingModalMode,
    setMaterialDraft,
    setMaterialModalMode,
    setMechanismDraft,
    setMechanismModalMode,
    setMemberEditDraft,
    setMemberForm,
    setPartDefinitionDraft,
    setPartDefinitionModalMode,
    setPartInstanceDraft,
    setPartInstanceModalMode,
    setPurchaseDraft,
    setPurchaseFinalCost,
    setPurchaseModalMode,
    setQaReportDraft,
    setQaReportModalMode,
    setReportsView,
    setRiskManagementView,
    setRobotProjectModalMode,
    setRobotProjectNameDraft,
    setSeasonNameDraft,
    setSelectedMemberId,
    setSelectedProjectId,
    setSelectedSeasonId,
    setShowTimelineCreateToggleInTaskModal,
    setSubsystemDraft,
    setSubsystemDraftRisks,
    setSubsystemModalMode,
    setTabSwitchDirection,
    setTaskDraft,
    setTaskEditNotice,
    setTaskModalMode,
    setTaskView,
    setTimelineMilestoneCreateSignal,
    setWorkLogDraft,
    setWorkLogModalMode,
    setWorklogsView,
    setWorkstreamDraft,
    setWorkstreamModalMode,
    showTimelineCreateToggleInTaskModal,
    sessionUser,
    subsystemDraft,
    subsystemDraftRisks,
    subsystemModalMode,
    tabSwitchDirection,
    taskDraft,
    taskEditNotice,
    taskModalMode,
    taskView,
    timelineMilestoneCreateSignal,
    toggleDarkMode,
    toggleSidebar,
    workLogDraft,
    workLogModalMode,
    worklogsView,
    workstreamDraft,
    workstreamModalMode,
    suppressNextAutoWorkspaceLoadRef,
    enforcedAuthConfig,
  };
}
