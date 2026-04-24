import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import "@/app/App.css";
import { AuthStatusScreen, SignInScreen } from "@/features/auth";
import { AppSidebar } from "@/components/layout";
import { AppTopbar } from "@/components/layout";
import { WorkspaceContent } from "@/features/workspace";
import type {
  InventoryViewTab,
  ManufacturingViewTab,
  TaskViewTab,
  ViewTab,
} from "@/features/workspace";
import {
  artifactToPayload,
  buildEmptyArtifactPayload,
  buildEmptyMechanismPayload,
  buildEmptyManufacturingPayload,
  buildEmptyMaterialPayload,
  buildEmptyPartDefinitionPayload,
  buildEmptyPartInstancePayload,
  buildEmptyPurchasePayload,
  buildEmptyWorkLogPayload,
  buildEmptySubsystemPayload,
  buildEmptyTaskPayload,
  joinList,
  mechanismToPayload,
  manufacturingToPayload,
  materialToPayload,
  partDefinitionToPayload,
  partInstanceToPayload,
  purchaseToPayload,
  splitList,
  subsystemToPayload,
  taskToPayload,
  toErrorMessage,
} from "@/lib/appUtils";
import {
  createArtifactRecord,
  createManufacturingItemRecord,
  createMaterialRecord,
  createMemberRecord,
  createSeasonRecord,
  createMechanismRecord,
  createWorkLogRecord,
  createSubsystemRecord,
  createEventRecord,
  createPartDefinitionRecord,
  createPartInstanceRecord,
  createPurchaseItemRecord,
  createTask,
  deleteEventRecord,
  deleteMaterialRecord,
  deleteMemberRecord,
  deleteMechanismRecord,
  deletePartDefinitionRecord,
  deleteArtifactRecord,
  fetchBootstrap,
  updateManufacturingItemRecord,
  updateMaterialRecord,
  updateMemberRecord,
  updateMechanismRecord,
  updateSubsystemRecord,
  updatePartDefinitionRecord,
  updatePartInstanceRecord,
  updatePurchaseItemRecord,
  updateTaskRecord,
  updateArtifactRecord,
  updateEventRecord,
} from "@/lib/auth";
import type {
  ArtifactKind,
  ArtifactPayload,
  ArtifactRecord,
  BootstrapPayload,
  EventPayload,
  ManufacturingItemPayload,
  ManufacturingItemRecord,
  MaterialPayload,
  MaterialRecord,
  MechanismPayload,
  MechanismRecord,
  MemberPayload,
  PartDefinitionPayload,
  PartDefinitionRecord,
  PartInstancePayload,
  PartInstanceRecord,
  PurchaseItemPayload,
  PurchaseItemRecord,
  SubsystemPayload,
  SubsystemRecord,
  TaskPayload,
  TaskRecord,
  WorkLogPayload,
} from "@/types";
import { EMPTY_BOOTSTRAP } from "@/features/workspace";
import type {
  ArtifactModalMode,
  ManufacturingModalMode,
  MaterialModalMode,
  MechanismModalMode,
  PartDefinitionModalMode,
  PartInstanceModalMode,
  PurchaseModalMode,
  SubsystemModalMode,
  TaskModalMode,
  WorkLogModalMode,
} from "@/features/workspace";
import { useAppAuth } from "@/app/useAppAuth";
import { useAppShell } from "@/app/useAppShell";
import { useWorkspaceDerivedData } from "@/features/workspace";
import { WorkspaceModalHost } from "@/features/workspace";

function scopeBootstrapBySelection(
  payload: BootstrapPayload,
  selectedSeasonId: string | null,
  selectedProjectId: string | null,
): BootstrapPayload {
  const seasonScopedProjects = selectedSeasonId
    ? payload.projects.filter((project) => project.seasonId === selectedSeasonId)
    : payload.projects;
  const selectedProjectIsValid =
    selectedProjectId !== null &&
    seasonScopedProjects.some((project) => project.id === selectedProjectId);
  const activeProjectIds = new Set(
    (selectedProjectIsValid
      ? seasonScopedProjects.filter((project) => project.id === selectedProjectId)
      : seasonScopedProjects
    ).map((project) => project.id),
  );
  const scopedSeasons = selectedSeasonId
    ? payload.seasons.filter((season) => season.id === selectedSeasonId)
    : payload.seasons;
  const scopedProjects = seasonScopedProjects.filter((project) =>
    activeProjectIds.has(project.id),
  );
  const scopedWorkstreams = payload.workstreams.filter((workstream) =>
    activeProjectIds.has(workstream.projectId),
  );
  const scopedSubsystems = payload.subsystems.filter((subsystem) =>
    activeProjectIds.has(subsystem.projectId),
  );
  const scopedSubsystemIds = new Set(scopedSubsystems.map((subsystem) => subsystem.id));
  const scopedMechanisms = payload.mechanisms.filter((mechanism) =>
    scopedSubsystemIds.has(mechanism.subsystemId),
  );
  const scopedMechanismIds = new Set(scopedMechanisms.map((mechanism) => mechanism.id));
  const scopedPartInstances = payload.partInstances.filter(
    (partInstance) =>
      scopedSubsystemIds.has(partInstance.subsystemId) &&
      (!partInstance.mechanismId || scopedMechanismIds.has(partInstance.mechanismId)),
  );
  const scopedPurchaseItems = payload.purchaseItems.filter((item) =>
    scopedSubsystemIds.has(item.subsystemId),
  );
  const scopedManufacturingItems = payload.manufacturingItems.filter((item) =>
    scopedSubsystemIds.has(item.subsystemId),
  );
  const scopedEvents = payload.events.filter(
    (event) =>
      event.relatedSubsystemIds.length === 0 ||
      event.relatedSubsystemIds.some((subsystemId) => scopedSubsystemIds.has(subsystemId)),
  );
  const scopedWorkstreamIds = new Set(scopedWorkstreams.map((workstream) => workstream.id));
  const scopedTasks = payload.tasks.filter(
    (task) =>
      activeProjectIds.has(task.projectId) && scopedSubsystemIds.has(task.subsystemId),
  );
  const scopedTaskIds = new Set(scopedTasks.map((task) => task.id));
  const scopedWorkLogs = payload.workLogs.filter((workLog) => scopedTaskIds.has(workLog.taskId));
  const scopedQaReports = payload.qaReports.filter((report) => scopedTaskIds.has(report.taskId));
  const scopedQaReportIds = new Set(scopedQaReports.map((report) => report.id));
  const scopedRisks = payload.risks.filter((risk) => {
    if (risk.attachmentType === "project" && !activeProjectIds.has(risk.attachmentId)) {
      return false;
    }

    if (
      risk.attachmentType === "workstream" &&
      !scopedWorkstreamIds.has(risk.attachmentId)
    ) {
      return false;
    }

    if (risk.mitigationTaskId && !scopedTaskIds.has(risk.mitigationTaskId)) {
      return false;
    }

    if (risk.sourceType === "qa-report" && !scopedQaReportIds.has(risk.sourceId)) {
      return false;
    }

    return true;
  });
  const scopedMembers = selectedSeasonId
    ? payload.members.filter((member) => member.seasonId === selectedSeasonId)
    : payload.members;

  return {
    ...payload,
    seasons: scopedSeasons,
    projects: scopedProjects,
    workstreams: scopedWorkstreams,
    subsystems: scopedSubsystems,
    mechanisms: scopedMechanisms,
    partInstances: scopedPartInstances,
    purchaseItems: scopedPurchaseItems,
    manufacturingItems: scopedManufacturingItems,
    events: scopedEvents,
    members: scopedMembers,
    tasks: scopedTasks,
    workLogs: scopedWorkLogs,
    qaReports: scopedQaReports,
    risks: scopedRisks,
  };
}

function isElevatedMemberRole(role: MemberPayload["role"]): boolean {
  return role === "lead" || role === "admin";
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ViewTab>("tasks");
  const [tabSwitchDirection, setTabSwitchDirection] = useState<"up" | "down">("down");
  const [taskView, setTaskView] = useState<TaskViewTab>("timeline");
  const [manufacturingView, setManufacturingView] =
    useState<ManufacturingViewTab>("cnc");
  const [inventoryView, setInventoryView] = useState<InventoryViewTab>("materials");
  const [bootstrap, setBootstrap] = useState<BootstrapPayload>(EMPTY_BOOTSTRAP);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataMessage, setDataMessage] = useState<string | null>(null);

  const {
    isDarkMode,
    isSidebarCollapsed,
    isSidebarOverlay,
    pageShellStyle,
    toggleDarkMode,
    toggleSidebar,
  } = useAppShell();

  const {
    authBooting,
    authConfig,
    authMessage,
    clearAuthMessage,
    enforcedAuthConfig,
    expireSession,
    googleButtonRef,
    handleSignOut,
    handleDevBypassSignIn,
    handleRequestEmailCode,
    handleVerifyEmailCode,
    isEmailAuthAvailable,
    isGoogleAuthAvailable,
    isLocalGoogleDevHost,
    isLocalGoogleOverrideActive,
    isSigningIn,
    sessionUser,
  } = useAppAuth({
    resetWorkspace: () => {
      setBootstrap(EMPTY_BOOTSTRAP);
    },
  });

  const [taskModalMode, setTaskModalMode] = useState<TaskModalMode>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [taskDraft, setTaskDraft] = useState<TaskPayload>(
    buildEmptyTaskPayload(EMPTY_BOOTSTRAP),
  );
  const [taskDraftBlockers, setTaskDraftBlockers] = useState("");
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [showTimelineCreateToggleInTaskModal, setShowTimelineCreateToggleInTaskModal] =
    useState(false);
  const [timelineMilestoneCreateSignal, setTimelineMilestoneCreateSignal] = useState(0);
  const suppressNextAutoWorkspaceLoadRef = useRef(false);

  const [workLogModalMode, setWorkLogModalMode] = useState<WorkLogModalMode>(null);
  const [workLogDraft, setWorkLogDraft] = useState<WorkLogPayload>(
    buildEmptyWorkLogPayload(EMPTY_BOOTSTRAP),
  );
  const [isSavingWorkLog, setIsSavingWorkLog] = useState(false);

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

  const [activePersonFilter, setActivePersonFilter] = useState<string>("all");
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState<MemberPayload>({
    name: "",
    email: "",
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
  const projectsInSelectedSeason = useMemo(() => {
    if (!selectedSeasonId) {
      return bootstrap.projects;
    }

    return bootstrap.projects.filter((project) => project.seasonId === selectedSeasonId);
  }, [bootstrap.projects, selectedSeasonId]);
  const scopedBootstrap = useMemo(
    () => scopeBootstrapBySelection(bootstrap, selectedSeasonId, selectedProjectId),
    [bootstrap, selectedProjectId, selectedSeasonId],
  );
  const selectedProject = useMemo(
    () =>
      projectsInSelectedSeason.find((project) => project.id === selectedProjectId) ?? null,
    [projectsInSelectedSeason, selectedProjectId],
  );
  const selectedProjectType = selectedProject?.projectType ?? null;
  const isAllProjectsView = selectedProjectId === null;
  const isNonRobotProject =
    selectedProjectType !== null && selectedProjectType !== "robot";
  const subsystemsLabel = isNonRobotProject ? "Workflow" : "Subsystems";
  const scopedArtifacts = useMemo(() => {
    const activeProjectIds = new Set(
      scopedBootstrap.projects.map((project) => project.id),
    );
    return bootstrap.artifacts.filter((artifact) =>
      activeProjectIds.has(artifact.projectId),
    );
  }, [bootstrap.artifacts, scopedBootstrap.projects]);

  useEffect(() => {
    if (bootstrap.seasons.length === 0) {
      if (selectedSeasonId !== null) {
        setSelectedSeasonId(null);
      }
      return;
    }

    if (!selectedSeasonId || !bootstrap.seasons.some((season) => season.id === selectedSeasonId)) {
      setSelectedSeasonId(bootstrap.seasons[0].id);
    }
  }, [bootstrap.seasons, selectedSeasonId]);

  useEffect(() => {
    if (projectsInSelectedSeason.length === 0) {
      if (selectedProjectId !== null) {
        setSelectedProjectId(null);
      }
      return;
    }

    if (
      selectedProjectId &&
      !projectsInSelectedSeason.some((project) => project.id === selectedProjectId)
    ) {
      setSelectedProjectId(null);
    }
  }, [projectsInSelectedSeason, selectedProjectId]);

  const {
    activeTask,
    cncItems,
    disciplinesById,
    eventsById,
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
    activeTaskId,
    bootstrap: scopedBootstrap,
    isAllProjectsView,
    selectedProjectType,
  });

  const visibleTabs = useMemo(
    () => new Set<ViewTab>(navigationItems.map((item) => item.value)),
    [navigationItems],
  );

  useEffect(() => {
    if (!visibleTabs.has(activeTab)) {
      setActiveTab("tasks");
    }
  }, [activeTab, visibleTabs]);

  const handleUnauthorized = useCallback(() => {
    expireSession("Your session expired. Please sign in again.");
    setDataMessage("Your session expired. Please sign in again.");
  }, [expireSession]);

  const clearDataMessage = useCallback(() => {
    setDataMessage(null);
  }, []);

  const selectMember = useCallback((memberId: string | null, payload: BootstrapPayload) => {
    const member = payload.members.find((candidate) => candidate.id === memberId) ?? null;
    setSelectedMemberId(member?.id ?? null);
    setMemberEditDraft(
      member
        ? {
          name: member.name,
          email: member.email,
          role: member.role,
          elevated: member.elevated,
        }
        : null,
    );
  }, []);

  const loadWorkspace = useCallback(async () => {
    setIsLoadingData(true);
    setDataMessage(null);

    try {
      const payload = await fetchBootstrap(
        activePersonFilter === "all" ? null : activePersonFilter,
        handleUnauthorized,
      );
      const scopedPayload = scopeBootstrapBySelection(
        payload,
        selectedSeasonId,
        selectedProjectId,
      );
      const nextArtifacts = payload.artifacts;
      const nextMemberId =
        selectedMemberId &&
        scopedPayload.members.some((member) => member.id === selectedMemberId)
          ? selectedMemberId
          : scopedPayload.members[0]?.id ?? null;

      startTransition(() => {
        setBootstrap(payload);
      });

      if (
        activePersonFilter !== "all" &&
        !scopedPayload.members.some((member) => member.id === activePersonFilter)
      ) {
        setActivePersonFilter("all");
      }

      selectMember(nextMemberId, scopedPayload);

      if (taskModalMode === "create") {
        setTaskDraft(buildEmptyTaskPayload(scopedPayload));
        setTaskDraftBlockers("");
      }

      if (taskModalMode === "edit" && activeTaskId) {
        const nextTask = payload.tasks.find((task) => task.id === activeTaskId);
        if (nextTask) {
          setTaskDraft(taskToPayload(nextTask));
          setTaskDraftBlockers(joinList(nextTask.blockers));
        } else {
          setTaskModalMode(null);
          setActiveTaskId(null);
        }
      }

      if (purchaseModalMode === "create") {
        setPurchaseDraft(buildEmptyPurchasePayload(payload));
        setPurchaseFinalCost("");
      }

      if (purchaseModalMode === "edit" && activePurchaseId) {
        const nextItem = payload.purchaseItems.find((item) => item.id === activePurchaseId);
        if (nextItem) {
          setPurchaseDraft(purchaseToPayload(nextItem));
          setPurchaseFinalCost(
            typeof nextItem.finalCost === "number" ? String(nextItem.finalCost) : "",
          );
        } else {
          setPurchaseModalMode(null);
          setActivePurchaseId(null);
        }
      }

      if (manufacturingModalMode === "create") {
        setManufacturingDraft((current) =>
          buildEmptyManufacturingPayload(payload, current.process),
        );
      }

      if (manufacturingModalMode === "edit" && activeManufacturingId) {
        const nextItem = payload.manufacturingItems.find(
          (item) => item.id === activeManufacturingId,
        );
        if (nextItem) {
          setManufacturingDraft(manufacturingToPayload(nextItem));
        } else {
          setManufacturingModalMode(null);
          setActiveManufacturingId(null);
        }
      }

      if (materialModalMode === "create") {
        setMaterialDraft(buildEmptyMaterialPayload());
      }

      if (materialModalMode === "edit" && activeMaterialId) {
        const nextItem = payload.materials.find((item) => item.id === activeMaterialId);
        if (nextItem) {
          setMaterialDraft(materialToPayload(nextItem));
        } else {
          setMaterialModalMode(null);
          setActiveMaterialId(null);
        }
      }

      if (partDefinitionModalMode === "create") {
        setPartDefinitionDraft(buildEmptyPartDefinitionPayload(payload));
      }

      if (partDefinitionModalMode === "edit" && activePartDefinitionId) {
        const nextItem = payload.partDefinitions.find(
          (item) => item.id === activePartDefinitionId,
        );
        if (nextItem) {
          setPartDefinitionDraft(partDefinitionToPayload(nextItem));
        } else {
          setPartDefinitionModalMode(null);
          setActivePartDefinitionId(null);
        }
      }

      if (artifactModalMode === "create") {
        setArtifactDraft(
          buildEmptyArtifactPayload(
            scopedPayload,
            {
              projectId: selectedProjectId ?? undefined,
              kind: artifactDraft.kind,
            },
          ),
        );
      }

      if (artifactModalMode === "edit" && activeArtifactId) {
        const nextArtifact = nextArtifacts.find(
          (artifact) => artifact.id === activeArtifactId,
        );
        if (nextArtifact) {
          setArtifactDraft(artifactToPayload(nextArtifact));
        } else {
          setArtifactModalMode(null);
          setActiveArtifactId(null);
        }
      }

      if (partInstanceModalMode === "create") {
        setPartInstanceDraft((current) =>
          buildEmptyPartInstancePayload(payload, {
            subsystemId: current.subsystemId,
            mechanismId: current.mechanismId ?? undefined,
            partDefinitionId: current.partDefinitionId || undefined,
          }),
        );
      }

      if (partInstanceModalMode === "edit" && activePartInstanceId) {
        const nextItem = payload.partInstances.find(
          (item) => item.id === activePartInstanceId,
        );
        if (nextItem) {
          setPartInstanceDraft(partInstanceToPayload(nextItem));
        } else {
          setPartInstanceModalMode(null);
          setActivePartInstanceId(null);
        }
      }

      if (subsystemModalMode === "create") {
        setSubsystemDraft(buildEmptySubsystemPayload(scopedPayload));
        setSubsystemDraftRisks("");
      }

      if (subsystemModalMode === "edit" && activeSubsystemId) {
        const nextSubsystem = scopedPayload.subsystems.find(
          (subsystem) => subsystem.id === activeSubsystemId,
        );
        if (nextSubsystem) {
          setSubsystemDraft(subsystemToPayload(nextSubsystem));
          setSubsystemDraftRisks(joinList(nextSubsystem.risks));
        } else {
          setSubsystemModalMode(null);
          setActiveSubsystemId(null);
        }
      }

      if (mechanismModalMode === "create") {
        setMechanismDraft((current) =>
          buildEmptyMechanismPayload(payload, current.subsystemId),
        );
      }

      if (mechanismModalMode === "edit" && activeMechanismId) {
        const nextMechanism = scopedPayload.mechanisms.find(
          (mechanism) => mechanism.id === activeMechanismId,
        );
        if (nextMechanism) {
          setMechanismDraft(mechanismToPayload(nextMechanism));
        } else {
          setMechanismModalMode(null);
          setActiveMechanismId(null);
        }
      }

    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsLoadingData(false);
    }
  }, [
    activeArtifactId,
    activeManufacturingId,
    activeMaterialId,
    activePartDefinitionId,
    activePartInstanceId,
    activePersonFilter,
    activePurchaseId,
    activeTaskId,
    activeSubsystemId,
    activeMechanismId,
    artifactDraft.kind,
    artifactModalMode,
    handleUnauthorized,
    mechanismModalMode,
    manufacturingModalMode,
    materialModalMode,
    partDefinitionModalMode,
    partInstanceModalMode,
    purchaseModalMode,
    selectedMemberId,
    selectedProjectId,
    selectedSeasonId,
    selectMember,
    subsystemModalMode,
    taskModalMode,
  ]);

  const openCreateTaskModal = () => {
    suppressNextAutoWorkspaceLoadRef.current = true;
    setShowTimelineCreateToggleInTaskModal(false);
    setActiveTaskId(null);
    setTaskDraft(buildEmptyTaskPayload(scopedBootstrap));
    setTaskDraftBlockers("");
    setTaskModalMode("create");
  };

  const openCreateTaskModalFromTimeline = () => {
    suppressNextAutoWorkspaceLoadRef.current = true;
    setShowTimelineCreateToggleInTaskModal(true);
    setActiveTaskId(null);
    setTaskDraft(buildEmptyTaskPayload(scopedBootstrap));
    setTaskDraftBlockers("");
    setTaskModalMode("create");
  };

  const openEditTaskModal = (task: TaskRecord) => {
    suppressNextAutoWorkspaceLoadRef.current = true;
    setShowTimelineCreateToggleInTaskModal(false);
    setActiveTaskId(task.id);
    setTaskDraft(taskToPayload(task));
    setTaskDraftBlockers(joinList(task.blockers));
    setTaskModalMode("edit");
  };

  const closeTaskModal = () => {
    suppressNextAutoWorkspaceLoadRef.current = true;
    setShowTimelineCreateToggleInTaskModal(false);
    setTaskModalMode(null);
    setActiveTaskId(null);
  };

  const switchTaskCreateToMilestone = () => {
    suppressNextAutoWorkspaceLoadRef.current = true;
    closeTaskModal();
    setTimelineMilestoneCreateSignal((current) => current + 1);
  };

  const openCreateWorkLogModal = () => {
    setWorkLogDraft(
      buildEmptyWorkLogPayload(
        scopedBootstrap,
        activePersonFilter === "all" ? null : activePersonFilter,
      ),
    );
    setWorkLogModalMode("create");
  };

  const closeWorkLogModal = () => {
    setWorkLogModalMode(null);
  };

  const openCreatePurchaseModal = () => {
    setActivePurchaseId(null);
    setPurchaseDraft(buildEmptyPurchasePayload(bootstrap));
    setPurchaseFinalCost("");
    setPurchaseModalMode("create");
  };

  const openEditPurchaseModal = (item: PurchaseItemRecord) => {
    setActivePurchaseId(item.id);
    setPurchaseDraft(purchaseToPayload(item));
    setPurchaseFinalCost(typeof item.finalCost === "number" ? String(item.finalCost) : "");
    setPurchaseModalMode("edit");
  };

  const closePurchaseModal = () => {
    setPurchaseModalMode(null);
    setActivePurchaseId(null);
  };

  const openCreateManufacturingModal = (
    process: ManufacturingItemPayload["process"],
  ) => {
    setActiveManufacturingId(null);
    setManufacturingDraft(buildEmptyManufacturingPayload(bootstrap, process));
    setManufacturingModalMode("create");
  };

  const openEditManufacturingModal = (item: ManufacturingItemRecord) => {
    setActiveManufacturingId(item.id);
    setManufacturingDraft(manufacturingToPayload(item));
    setManufacturingModalMode("edit");
  };

  const closeManufacturingModal = () => {
    setManufacturingModalMode(null);
    setActiveManufacturingId(null);
  };

  const openCreateMaterialModal = () => {
    setActiveMaterialId(null);
    setMaterialDraft(buildEmptyMaterialPayload());
    setMaterialModalMode("create");
  };

  const openEditMaterialModal = (item: MaterialRecord) => {
    setActiveMaterialId(item.id);
    setMaterialDraft(materialToPayload(item));
    setMaterialModalMode("edit");
  };

  const closeMaterialModal = () => {
    setMaterialModalMode(null);
    setActiveMaterialId(null);
  };

  const openCreateArtifactModal = (kind: ArtifactKind) => {
    setActiveArtifactId(null);
    setArtifactDraft(
      buildEmptyArtifactPayload(scopedBootstrap, {
        projectId: selectedProjectId ?? undefined,
        kind,
      }),
    );
    setArtifactModalMode("create");
  };

  const openEditArtifactModal = (artifact: ArtifactRecord) => {
    setActiveArtifactId(artifact.id);
    setArtifactDraft(artifactToPayload(artifact));
    setArtifactModalMode("edit");
  };

  const closeArtifactModal = () => {
    setArtifactModalMode(null);
    setActiveArtifactId(null);
  };

  const openCreatePartDefinitionModal = () => {
    setActivePartDefinitionId(null);
    setPartDefinitionDraft(buildEmptyPartDefinitionPayload(bootstrap));
    setPartDefinitionModalMode("create");
  };

  const openEditPartDefinitionModal = (item: PartDefinitionRecord) => {
    setActivePartDefinitionId(item.id);
    setPartDefinitionDraft(partDefinitionToPayload(item));
    setPartDefinitionModalMode("edit");
  };

  const closePartDefinitionModal = () => {
    setPartDefinitionModalMode(null);
    setActivePartDefinitionId(null);
  };

  const openCreatePartInstanceModal = (mechanism: MechanismRecord) => {
    setActivePartInstanceId(null);
    setPartInstanceDraft(
      buildEmptyPartInstancePayload(bootstrap, {
        subsystemId: mechanism.subsystemId,
        mechanismId: mechanism.id,
      }),
    );
    setPartInstanceModalMode("create");
  };

  const openEditPartInstanceModal = (partInstance: PartInstanceRecord) => {
    setActivePartInstanceId(partInstance.id);
    setPartInstanceDraft(partInstanceToPayload(partInstance));
    setPartInstanceModalMode("edit");
  };

  const closePartInstanceModal = () => {
    setPartInstanceModalMode(null);
    setActivePartInstanceId(null);
  };

  const openCreateSubsystemModal = () => {
    setActiveSubsystemId(null);
    setSubsystemDraft(buildEmptySubsystemPayload(scopedBootstrap));
    setSubsystemDraftRisks("");
    setSubsystemModalMode("create");
  };

  const openEditSubsystemModal = (subsystem: SubsystemRecord) => {
    setActiveSubsystemId(subsystem.id);
    setSubsystemDraft(subsystemToPayload(subsystem));
    setSubsystemDraftRisks(joinList(subsystem.risks));
    setSubsystemModalMode("edit");
  };

  const closeSubsystemModal = () => {
    setSubsystemModalMode(null);
    setActiveSubsystemId(null);
  };

  const openCreateMechanismModal = (subsystemId?: string) => {
    setActiveMechanismId(null);
    setMechanismDraft(buildEmptyMechanismPayload(bootstrap, subsystemId));
    setMechanismModalMode("create");
  };

  const openEditMechanismModal = (mechanism: MechanismRecord) => {
    setActiveMechanismId(mechanism.id);
    setMechanismDraft(mechanismToPayload(mechanism));
    setMechanismModalMode("edit");
  };

  const closeMechanismModal = () => {
    setMechanismModalMode(null);
    setActiveMechanismId(null);
  };

  useEffect(() => {
    if (authBooting) {
      return;
    }

    if (authConfig?.enabled && !sessionUser) {
      return;
    }

    if (suppressNextAutoWorkspaceLoadRef.current) {
      suppressNextAutoWorkspaceLoadRef.current = false;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void loadWorkspace();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [authBooting, authConfig?.enabled, loadWorkspace, sessionUser]);

  const handleTaskSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingTask(true);
    setDataMessage(null);

    try {
      const payload: TaskPayload = {
        ...taskDraft,
        blockers: splitList(taskDraftBlockers),
      };

      if (taskModalMode === "create") {
        await createTask(payload, handleUnauthorized);
      } else if (taskModalMode === "edit" && activeTaskId) {
        await updateTaskRecord(activeTaskId, payload, handleUnauthorized);
      }

      await loadWorkspace();
      closeTaskModal();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsSavingTask(false);
    }
  };

  const handleTimelineEventSave = useCallback(
    async (mode: "create" | "edit", eventId: string | null, payload: EventPayload) => {
      if (mode === "create") {
        await createEventRecord(payload, handleUnauthorized);
      } else if (eventId) {
        await updateEventRecord(eventId, payload, handleUnauthorized);
      }

      await loadWorkspace();
    },
    [handleUnauthorized, loadWorkspace],
  );

  const handleTimelineEventDelete = useCallback(
    async (eventId: string) => {
      await deleteEventRecord(eventId, handleUnauthorized);
      await loadWorkspace();
    },
    [handleUnauthorized, loadWorkspace],
  );

  const handleWorkLogSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingWorkLog(true);
    setDataMessage(null);

    try {
      const taskExists = bootstrap.tasks.some(
        (task) => task.id === workLogDraft.taskId,
      );
      if (!taskExists) {
        setDataMessage("Please choose a real task before saving the work log.");
        return;
      }

      const participantIds = Array.from(
        new Set(
          workLogDraft.participantIds.filter((participantId) =>
            bootstrap.members.some((member) => member.id === participantId),
          ),
        ),
      );
      if (participantIds.length === 0) {
        setDataMessage("Please choose at least one participant before saving the work log.");
        return;
      }

      const payload: WorkLogPayload = {
        ...workLogDraft,
        notes: workLogDraft.notes.trim(),
        participantIds,
      };

      await createWorkLogRecord(payload, handleUnauthorized);
      await loadWorkspace();
      closeWorkLogModal();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsSavingWorkLog(false);
    }
  };

  const handlePurchaseSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setIsSavingPurchase(true);
    setDataMessage(null);

    try {
      const selectedPartDefinition = bootstrap.partDefinitions.find(
        (partDefinition) => partDefinition.id === purchaseDraft.partDefinitionId,
      );

      if (!selectedPartDefinition) {
        setDataMessage("Please choose a real part from the Parts tab before saving the purchase.");
        return;
      }

      const payload: PurchaseItemPayload = {
        ...purchaseDraft,
        title: selectedPartDefinition.name,
        finalCost:
          purchaseFinalCost.trim().length > 0 ? Number(purchaseFinalCost) : undefined,
      };

      if (purchaseModalMode === "create") {
        await createPurchaseItemRecord(payload, handleUnauthorized);
      } else if (purchaseModalMode === "edit" && activePurchaseId) {
        await updatePurchaseItemRecord(activePurchaseId, payload, handleUnauthorized);
      }

      await loadWorkspace();
      closePurchaseModal();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsSavingPurchase(false);
    }
  };

  const handleManufacturingSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setIsSavingManufacturing(true);
    setDataMessage(null);

    try {
      const selectedPartDefinition = manufacturingDraft.partDefinitionId
        ? bootstrap.partDefinitions.find(
            (partDefinition) => partDefinition.id === manufacturingDraft.partDefinitionId,
          )
        : null;

      if (manufacturingDraft.process !== "fabrication" && !selectedPartDefinition) {
        setDataMessage(
          "Please choose a real part from the Parts tab before saving the CNC or 3D print job.",
        );
        return;
      }

      const payload: ManufacturingItemPayload = {
        ...manufacturingDraft,
        title:
          manufacturingDraft.process === "fabrication"
            ? manufacturingDraft.title
            : selectedPartDefinition?.name ?? manufacturingDraft.title,
        batchLabel: manufacturingDraft.batchLabel?.trim() || undefined,
      };

      if (manufacturingModalMode === "create") {
        await createManufacturingItemRecord(payload, handleUnauthorized);
      } else if (manufacturingModalMode === "edit" && activeManufacturingId) {
        await updateManufacturingItemRecord(
          activeManufacturingId,
          payload,
          handleUnauthorized,
        );
      }

      await loadWorkspace();
      closeManufacturingModal();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsSavingManufacturing(false);
    }
  };

  const handleMaterialSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingMaterial(true);
    setDataMessage(null);

    try {
      if (materialModalMode === "create") {
        await createMaterialRecord(materialDraft, handleUnauthorized);
      } else if (materialModalMode === "edit" && activeMaterialId) {
        await updateMaterialRecord(activeMaterialId, materialDraft, handleUnauthorized);
      }

      await loadWorkspace();
      closeMaterialModal();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsSavingMaterial(false);
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    setIsDeletingMaterial(true);
    setDataMessage(null);

    try {
      await deleteMaterialRecord(materialId, handleUnauthorized);
      if (activeMaterialId === materialId) {
        closeMaterialModal();
      }
      await loadWorkspace();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsDeletingMaterial(false);
    }
  };

  const handleArtifactSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingArtifact(true);
    setDataMessage(null);

    try {
      const payload: ArtifactPayload = {
        ...artifactDraft,
        title: artifactDraft.title.trim(),
        summary: artifactDraft.summary.trim(),
        link: artifactDraft.link.trim(),
      };
      if (!payload.projectId) {
        setDataMessage("Pick a project before saving an artifact.");
        return;
      }

      if (artifactModalMode === "create") {
        await createArtifactRecord(payload, handleUnauthorized);
      } else if (artifactModalMode === "edit" && activeArtifactId) {
        await updateArtifactRecord(activeArtifactId, payload, handleUnauthorized);
      }

      await loadWorkspace();
      closeArtifactModal();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsSavingArtifact(false);
    }
  };

  const handleDeleteArtifact = async (artifactId: string) => {
    setIsDeletingArtifact(true);
    setDataMessage(null);

    try {
      await deleteArtifactRecord(artifactId, handleUnauthorized);
      if (activeArtifactId === artifactId) {
        closeArtifactModal();
      }
      await loadWorkspace();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsDeletingArtifact(false);
    }
  };

  const handlePartDefinitionSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setIsSavingPartDefinition(true);
    setDataMessage(null);

    try {
      if (partDefinitionModalMode === "create") {
        await createPartDefinitionRecord(partDefinitionDraft, handleUnauthorized);
      } else if (partDefinitionModalMode === "edit" && activePartDefinitionId) {
        await updatePartDefinitionRecord(
          activePartDefinitionId,
          partDefinitionDraft,
          handleUnauthorized,
        );
      }

      await loadWorkspace();
      closePartDefinitionModal();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsSavingPartDefinition(false);
    }
  };

  const handleDeletePartDefinition = async (partDefinitionId: string) => {
    setIsDeletingPartDefinition(true);
    setDataMessage(null);

    try {
      await deletePartDefinitionRecord(partDefinitionId, handleUnauthorized);
      if (activePartDefinitionId === partDefinitionId) {
        closePartDefinitionModal();
      }
      await loadWorkspace();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsDeletingPartDefinition(false);
    }
  };

  const handlePartInstanceSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setIsSavingPartInstance(true);
    setDataMessage(null);

    try {
      const selectedPartDefinition = bootstrap.partDefinitions.find(
        (partDefinition) => partDefinition.id === partInstanceDraft.partDefinitionId,
      );

      if (!selectedPartDefinition) {
        setDataMessage("Please choose a real part from the Parts tab before saving the part instance.");
        return;
      }

      if (!partInstanceDraft.mechanismId) {
        setDataMessage("Please choose a mechanism before saving the part instance.");
        return;
      }

      const payload: PartInstancePayload = {
        ...partInstanceDraft,
        name: partInstanceDraft.name.trim(),
      };

      if (partInstanceModalMode === "create") {
        await createPartInstanceRecord(payload, handleUnauthorized);
      } else if (partInstanceModalMode === "edit" && activePartInstanceId) {
        await updatePartInstanceRecord(
          activePartInstanceId,
          payload,
          handleUnauthorized,
        );
      }

      await loadWorkspace();
      closePartInstanceModal();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsSavingPartInstance(false);
    }
  };

  const handleSubsystemSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (subsystemModalMode === "create" && !selectedProjectId) {
      setDataMessage("Pick a project before adding a subsystem.");
      return;
    }

    setIsSavingSubsystem(true);
    setDataMessage(null);

    try {
      const payload: SubsystemPayload = {
        ...subsystemDraft,
        projectId: selectedProjectId ?? subsystemDraft.projectId,
        risks: splitList(subsystemDraftRisks),
      };

      if (subsystemModalMode === "create") {
        await createSubsystemRecord(payload, handleUnauthorized);
      } else if (subsystemModalMode === "edit" && activeSubsystemId) {
        await updateSubsystemRecord(activeSubsystemId, payload, handleUnauthorized);
      }

      await loadWorkspace();
      closeSubsystemModal();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsSavingSubsystem(false);
    }
  };

  const handleMechanismSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingMechanism(true);
    setDataMessage(null);

    try {
      if (mechanismModalMode === "create") {
        await createMechanismRecord(mechanismDraft, handleUnauthorized);
      } else if (mechanismModalMode === "edit" && activeMechanismId) {
        await updateMechanismRecord(activeMechanismId, mechanismDraft, handleUnauthorized);
      }

      await loadWorkspace();
      closeMechanismModal();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsSavingMechanism(false);
    }
  };

  const handleDeleteMechanism = async (mechanismId: string) => {
    setIsDeletingMechanism(true);
    setDataMessage(null);

    try {
      await deleteMechanismRecord(mechanismId, handleUnauthorized);
      if (activeMechanismId === mechanismId) {
        closeMechanismModal();
      }
      await loadWorkspace();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsDeletingMechanism(false);
    }
  };

  const handleCreateSeason = () => {
    setDataMessage(null);
    setSeasonNameDraft("");
    setIsAddSeasonPopupOpen(true);
  };

  const closeCreateSeasonPopup = useCallback(() => {
    if (isSavingSeason) {
      return;
    }

    setIsAddSeasonPopupOpen(false);
    setSeasonNameDraft("");
  }, [isSavingSeason]);

  const handleCreateSeasonSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const seasonName = seasonNameDraft.trim();
    if (seasonName.length < 2) {
      setDataMessage("Season names need at least 2 characters.");
      return;
    }

    setIsSavingSeason(true);
    setDataMessage(null);

    try {
      const season = await createSeasonRecord(
        {
          name: seasonName,
        },
        handleUnauthorized,
      );
      await loadWorkspace();
      setSelectedSeasonId(season.id);
      setSelectedProjectId(null);
      setIsAddSeasonPopupOpen(false);
      setSeasonNameDraft("");
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsSavingSeason(false);
    }
  };

  const handleCreateMember = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedSeasonId) {
      setDataMessage("Pick a season before adding a roster member.");
      return;
    }

    setIsSavingMember(true);
    setDataMessage(null);

    try {
      const normalizedRole = memberForm.role;
      await createMemberRecord(
        {
          name: memberForm.name.trim(),
          email: memberForm.email.trim(),
          role: normalizedRole,
          elevated: isElevatedMemberRole(normalizedRole),
          seasonId: selectedSeasonId,
        },
        handleUnauthorized,
      );
      setMemberForm({ name: "", email: "", role: "student", elevated: false });
      setIsAddPersonOpen(false);
      await loadWorkspace();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsSavingMember(false);
    }
  };

  const handleUpdateMember = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedMemberId || !memberEditDraft) {
      return;
    }

    setIsSavingMember(true);
    setDataMessage(null);

    try {
      const normalizedRole = memberEditDraft.role;
      await updateMemberRecord(
        selectedMemberId,
        {
          name: memberEditDraft.name.trim(),
          email: memberEditDraft.email.trim(),
          role: normalizedRole,
          elevated: isElevatedMemberRole(normalizedRole),
        },
        handleUnauthorized,
      );
      setIsEditPersonOpen(false);
      await loadWorkspace();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsSavingMember(false);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!memberId) {
      return;
    }

    setIsDeletingMember(true);
    setDataMessage(null);

    try {
      await deleteMemberRecord(memberId, handleUnauthorized);
      if (activePersonFilter === memberId) {
        setActivePersonFilter("all");
      }
      if (selectedMemberId === memberId) {
        setSelectedMemberId(null);
        setMemberEditDraft(null);
        setIsEditPersonOpen(false);
      }
      await loadWorkspace();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsDeletingMember(false);
    }
  };

  const closeSidebarOverlay = useCallback(() => {
    if (isSidebarOverlay) {
      toggleSidebar();
    }
  }, [isSidebarOverlay, toggleSidebar]);

  const handleSidebarTabSelect = useCallback(
    (tab: ViewTab) => {
      if (tab !== activeTab) {
        const currentIndex = navigationItems.findIndex((item) => item.value === activeTab);
        const nextIndex = navigationItems.findIndex((item) => item.value === tab);

        if (currentIndex >= 0 && nextIndex >= 0) {
          setTabSwitchDirection(nextIndex > currentIndex ? "down" : "up");
        }

        setActiveTab(tab);
      }
      closeSidebarOverlay();
    },
    [activeTab, closeSidebarOverlay, navigationItems],
  );

  useEffect(() => {
    if (!isSidebarOverlay) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeSidebarOverlay();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeSidebarOverlay, isSidebarOverlay]);

  useEffect(() => {
    if (!isAddSeasonPopupOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeCreateSeasonPopup();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeCreateSeasonPopup, isAddSeasonPopupOpen]);

  const disablePanelAnimations = Boolean(
    taskModalMode ||
      workLogModalMode ||
      purchaseModalMode ||
      manufacturingModalMode ||
      materialModalMode ||
      partDefinitionModalMode ||
      partInstanceModalMode ||
      subsystemModalMode ||
      mechanismModalMode ||
      artifactModalMode ||
      isAddSeasonPopupOpen,
  );

  if (authBooting) {
    return (
      <AuthStatusScreen
        body="Checking the server-side auth configuration before the workspace opens."
        title="Loading sign-in rules for MECO Robotics."
      />
    );
  }

  if (!authConfig) {
    return (
      <AuthStatusScreen
        body="The app could not confirm the server-side sign-in rules, so access is paused until the API is reachable again."
        message={authMessage}
        title="Couldn&apos;t load the authentication configuration."
      />
    );
  }

  if (enforcedAuthConfig && !sessionUser) {
      return (
      <SignInScreen
        authMessage={authMessage}
        clearAuthMessage={clearAuthMessage}
        hasEmailSignIn={isEmailAuthAvailable}
        hasGoogleSignIn={isGoogleAuthAvailable}
        googleButtonRef={googleButtonRef}
        isLocalGoogleDevHost={isLocalGoogleDevHost}
        isLocalGoogleOverrideActive={isLocalGoogleOverrideActive}
        isSigningIn={isSigningIn}
        onRequestEmailCode={handleRequestEmailCode}
        onVerifyEmailCode={handleVerifyEmailCode}
        onDevBypassSignIn={handleDevBypassSignIn}
        signInConfig={enforcedAuthConfig}
      />
    );
  }

  return (
    <main
      className={`page-shell ${isDarkMode ? "dark-mode" : ""} ${isSidebarCollapsed ? "is-sidebar-collapsed" : ""} ${isSidebarOverlay ? "is-sidebar-overlay" : ""}`}
      style={pageShellStyle}
    >
      <AppTopbar
        activeTab={activeTab}
        handleSignOut={handleSignOut}
        inventoryView={inventoryView}
        isLoadingData={isLoadingData}
        loadWorkspace={loadWorkspace}
        manufacturingView={manufacturingView}
        sessionUser={sessionUser}
        isNonRobotProject={isNonRobotProject}
        setInventoryView={setInventoryView}
        setManufacturingView={setManufacturingView}
        setTaskView={setTaskView}
        taskView={taskView}
        projects={projectsInSelectedSeason}
        selectedProjectId={selectedProjectId}
        subsystemsLabel={subsystemsLabel}
        onSelectProject={setSelectedProjectId}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        toggleSidebar={toggleSidebar}
        isSidebarCollapsed={isSidebarCollapsed}
      />

      <AppSidebar
        activeTab={activeTab}
        items={navigationItems}
        onSelectTab={handleSidebarTabSelect}
        isCollapsed={isSidebarCollapsed}
        seasons={bootstrap.seasons}
        selectedSeasonId={selectedSeasonId}
        onSelectSeason={setSelectedSeasonId}
        onCreateSeason={handleCreateSeason}
      />

      {isAddSeasonPopupOpen ? (
        <div
          className="modal-scrim"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeCreateSeasonPopup();
            }
          }}
          role="presentation"
        >
          <section aria-modal="true" className="modal-card roster-edit-modal" role="dialog">
            <div className="panel-header compact-header">
              <div className="queue-section-header">
                <h3>Add season</h3>
                <p className="section-copy">
                  Create a new season and switch the workspace to it.
                </p>
              </div>
              <button className="icon-button" onClick={closeCreateSeasonPopup} type="button">
                Close
              </button>
            </div>
            <form className="modal-form" onSubmit={handleCreateSeasonSubmit}>
              <label className="field modal-wide">
                <span>Name</span>
                <input
                  autoFocus
                  minLength={2}
                  onChange={(event) => setSeasonNameDraft(event.target.value)}
                  placeholder="2027 Season"
                  required
                  value={seasonNameDraft}
                />
              </label>
              <div className="modal-actions modal-wide">
                <button
                  className="secondary-action"
                  onClick={closeCreateSeasonPopup}
                  type="button"
                >
                  Cancel
                </button>
                <button className="primary-action" disabled={isSavingSeason} type="submit">
                  {isSavingSeason ? "Saving..." : "Add season"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {isSidebarOverlay ? (
        <>
          <button
            aria-label="Close sidebar"
            className="sidebar-overlay-scrim"
            onClick={closeSidebarOverlay}
            type="button"
          />
          <button
            aria-hidden="true"
            className="sidebar-overlay-topbar-scrim"
            onClick={closeSidebarOverlay}
            tabIndex={-1}
            type="button"
          />
        </>
      ) : null}

      <WorkspaceContent
        activePersonFilter={activePersonFilter}
        activeTab={activeTab}
        tabSwitchDirection={tabSwitchDirection}
        artifacts={scopedArtifacts}
        bootstrap={scopedBootstrap}
        cncItems={cncItems}
        dataMessage={dataMessage}
        fabricationItems={fabricationItems}
        handleCreateMember={handleCreateMember}
        handleDeleteMember={handleDeleteMember}
        handleTimelineEventDelete={handleTimelineEventDelete}
        handleTimelineEventSave={handleTimelineEventSave}
        handleUpdateMember={handleUpdateMember}
        isAddPersonOpen={isAddPersonOpen}
        isDeletingMember={isDeletingMember}
        isEditPersonOpen={isEditPersonOpen}
        isLoadingData={isLoadingData}
        isAllProjectsView={isAllProjectsView}
        isNonRobotProject={isNonRobotProject}
        isSavingMember={isSavingMember}
        memberEditDraft={memberEditDraft}
        memberForm={memberForm}
        membersById={membersById}
        openCreateManufacturingModal={openCreateManufacturingModal}
        openCreateArtifactModal={openCreateArtifactModal}
        openCreateMaterialModal={openCreateMaterialModal}
        openCreateMechanismModal={openCreateMechanismModal}
        openCreatePartInstanceModal={openCreatePartInstanceModal}
        openCreateSubsystemModal={openCreateSubsystemModal}
        openCreatePartDefinitionModal={openCreatePartDefinitionModal}
        openCreatePurchaseModal={openCreatePurchaseModal}
        openCreateTaskModal={openCreateTaskModal}
        openCreateTaskModalFromTimeline={openCreateTaskModalFromTimeline}
        openCreateWorkLogModal={openCreateWorkLogModal}
        openEditManufacturingModal={openEditManufacturingModal}
        openEditArtifactModal={openEditArtifactModal}
        openEditMaterialModal={openEditMaterialModal}
        openEditMechanismModal={openEditMechanismModal}
        openEditPartInstanceModal={openEditPartInstanceModal}
        openEditSubsystemModal={openEditSubsystemModal}
        openEditPartDefinitionModal={openEditPartDefinitionModal}
        openEditPurchaseModal={openEditPurchaseModal}
        openEditTaskModal={openEditTaskModal}
        printItems={printItems}
        rosterMentors={rosterMentors}
        manufacturingView={manufacturingView}
        inventoryView={inventoryView}
        taskView={taskView}
        selectMember={selectMember}
        selectedMemberId={selectedMemberId}
        setIsAddPersonOpen={setIsAddPersonOpen}
        setIsEditPersonOpen={setIsEditPersonOpen}
        setMemberEditDraft={setMemberEditDraft}
        setMemberForm={setMemberForm}
        setActivePersonFilter={setActivePersonFilter}
        students={students}
        disciplinesById={disciplinesById}
        eventsById={eventsById}
        mechanismsById={mechanismsById}
        partDefinitionsById={partDefinitionsById}
        partInstancesById={partInstancesById}
        subsystemsById={subsystemsById}
        timelineMilestoneCreateSignal={timelineMilestoneCreateSignal}
        disablePanelAnimations={disablePanelAnimations}
        onDismissDataMessage={clearDataMessage}
      />

      <WorkspaceModalHost
        activeArtifactId={activeArtifactId}
        activePartDefinitionId={activePartDefinitionId}
        activeMaterialId={activeMaterialId}
        activeMechanismId={activeMechanismId}
        activeSubsystemId={activeSubsystemId}
        activeTask={activeTask}
        bootstrap={scopedBootstrap}
        closeManufacturingModal={closeManufacturingModal}
        closeArtifactModal={closeArtifactModal}
        closeMaterialModal={closeMaterialModal}
        closeMechanismModal={closeMechanismModal}
        closePartInstanceModal={closePartInstanceModal}
        closePartDefinitionModal={closePartDefinitionModal}
        closePurchaseModal={closePurchaseModal}
        closeWorkLogModal={closeWorkLogModal}
        closeSubsystemModal={closeSubsystemModal}
        closeTaskModal={closeTaskModal}
        disciplinesById={disciplinesById}
        eventsById={eventsById}
        handleDeleteMaterial={handleDeleteMaterial}
        handleDeleteArtifact={handleDeleteArtifact}
        handleDeletePartDefinition={handleDeletePartDefinition}
        handleDeleteMechanism={handleDeleteMechanism}
        handlePartInstanceSubmit={handlePartInstanceSubmit}
        handleMechanismSubmit={handleMechanismSubmit}
        handleManufacturingSubmit={handleManufacturingSubmit}
        handleMaterialSubmit={handleMaterialSubmit}
        handlePartDefinitionSubmit={handlePartDefinitionSubmit}
        handleArtifactSubmit={handleArtifactSubmit}
        handlePurchaseSubmit={handlePurchaseSubmit}
        handleWorkLogSubmit={handleWorkLogSubmit}
        handleSubsystemSubmit={handleSubsystemSubmit}
        handleTaskSubmit={handleTaskSubmit}
        isDeletingMaterial={isDeletingMaterial}
        isDeletingArtifact={isDeletingArtifact}
        isDeletingPartDefinition={isDeletingPartDefinition}
        isDeletingMechanism={isDeletingMechanism}
        isSavingManufacturing={isSavingManufacturing}
        isSavingArtifact={isSavingArtifact}
        isSavingMaterial={isSavingMaterial}
        isSavingPartDefinition={isSavingPartDefinition}
        isSavingPartInstance={isSavingPartInstance}
        isSavingMechanism={isSavingMechanism}
        isSavingPurchase={isSavingPurchase}
        isSavingWorkLog={isSavingWorkLog}
        isSavingSubsystem={isSavingSubsystem}
        isSavingTask={isSavingTask}
        artifactDraft={artifactDraft}
        artifactModalMode={artifactModalMode}
        manufacturingDraft={manufacturingDraft}
        manufacturingModalMode={manufacturingModalMode}
        materialDraft={materialDraft}
        materialModalMode={materialModalMode}
        mechanismsById={mechanismsById}
        mentors={mentors}
        mechanismDraft={mechanismDraft}
        mechanismModalMode={mechanismModalMode}
        partInstanceDraft={partInstanceDraft}
        partInstanceModalMode={partInstanceModalMode}
        partDefinitionDraft={partDefinitionDraft}
        partDefinitionModalMode={partDefinitionModalMode}
        partDefinitionsById={partDefinitionsById}
        partInstancesById={partInstancesById}
        purchaseDraft={purchaseDraft}
        purchaseFinalCost={purchaseFinalCost}
        purchaseModalMode={purchaseModalMode}
        workLogDraft={workLogDraft}
        workLogModalMode={workLogModalMode}
        setArtifactDraft={setArtifactDraft}
        setMechanismDraft={setMechanismDraft}
        setManufacturingDraft={setManufacturingDraft}
        setMaterialDraft={setMaterialDraft}
        setPartInstanceDraft={setPartInstanceDraft}
        setPartDefinitionDraft={setPartDefinitionDraft}
        setPurchaseDraft={setPurchaseDraft}
        setPurchaseFinalCost={setPurchaseFinalCost}
        setWorkLogDraft={setWorkLogDraft}
        setSubsystemDraft={setSubsystemDraft}
        setSubsystemDraftRisks={setSubsystemDraftRisks}
        setTaskDraft={setTaskDraft}
        setTaskDraftBlockers={setTaskDraftBlockers}
        showTimelineCreateToggleInTaskModal={showTimelineCreateToggleInTaskModal}
        onSwitchTaskCreateToMilestone={switchTaskCreateToMilestone}
        students={students}
        subsystemDraft={subsystemDraft}
        subsystemDraftRisks={subsystemDraftRisks}
        subsystemModalMode={subsystemModalMode}
        taskDraft={taskDraft}
        taskDraftBlockers={taskDraftBlockers}
        taskModalMode={taskModalMode}
      />
    </main>
  );
}




