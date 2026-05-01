import {
  Suspense,
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import "@/app/App.css";
import { AuthStatusScreen, SignInScreen } from "@/features/auth";
import type { FilterSelection } from "@/features/workspace";
import type {
  InventoryViewTab,
  ManufacturingViewTab,
  RiskManagementViewTab,
  TaskViewTab,
  ViewTab,
  WorklogsViewTab,
} from "@/lib/workspaceNavigation";
import {
  artifactToPayload,
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
  findMemberForSessionUser,
  getMemberActiveSeasonIds,
  isMemberActiveInSeason,
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
  workstreamToPayload,
} from "@/lib/appUtils";
import { localTodayDate } from "@/lib/dateUtils";
import {
  createArtifactRecord,
  createManufacturingItemRecord,
  createMaterialRecord,
  createMemberRecord,
  createProjectRecord,
  createQaReportRecord,
  createRiskRecord,
  createSeasonRecord,
  createMechanismRecord,
  createTestResultRecord,
  createWorkLogRecord,
  createWorkstreamRecord,
  createSubsystemRecord,
  createEventRecord,
  createPartDefinitionRecord,
  createPartInstanceRecord,
  createPurchaseItemRecord,
  createTask,
  createTaskBlockerRecord,
  createTaskDependencyRecord,
  deleteEventRecord,
  deleteRiskRecord,
  deleteMaterialRecord,
  deleteMemberRecord,
  deleteMechanismRecord,
  deletePartDefinitionRecord,
  deleteTaskRecord,
  deleteTaskBlockerRecord,
  deleteArtifactRecord,
  deleteTaskDependencyRecord,
  fetchBootstrap,
  resetInteractiveTutorialSession,
  startInteractiveTutorialSession,
  updateManufacturingItemRecord,
  updateMaterialRecord,
  updateMemberRecord,
  updateMechanismRecord,
  updateProjectRecord,
  updateRiskRecord,
  updateSubsystemRecord,
  updatePartDefinitionRecord,
  updatePartInstanceRecord,
  updatePurchaseItemRecord,
  updateTaskDependencyRecord,
  updateTaskBlockerRecord,
  updateTaskRecord,
  updateArtifactRecord,
  updateEventRecord,
  updateWorkstreamRecord,
  requestImageUpload,
  requestVideoUpload,
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
  ProjectPayload,
  PurchaseItemPayload,
  PurchaseItemRecord,
  QaReportPayload,
  RiskPayload,
  SubsystemPayload,
  SubsystemRecord,
  TaskBlockerSeverity,
  TaskBlockerType,
  TaskPayload,
  TaskRecord,
  TestResultPayload,
  WorkLogPayload,
  WorkstreamPayload,
} from "@/types";
import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/bootstrapDefaults";
import { useWorkspaceDerivedData } from "@/features/workspace/useWorkspaceDerivedData";
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
import { useAppAuth } from "@/app/useAppAuth";
import { useAppShell } from "@/app/useAppShell";
import {
  AppSidebar,
  AppTopbar,
  WorkspaceContent,
  WorkspaceModalHost,
  WorkspaceShellLoading,
} from "@/app/workspaceShell";
import { INTERACTIVE_TUTORIAL_CHAPTERS } from "@/app/interactiveTutorialData";
import {
  getSinglePersonFilterId,
  isElevatedMemberRole,
  scopeBootstrapBySelection,
} from "@/app/workspaceStateUtils";

type InteractiveTutorialChapterId = "planning" | "operations" | "outreach";
const BROWSER_ZOOM_SHORTCUT_KEYS = new Set(["+", "=", "-", "0", "add", "subtract"]);

function isBrowserZoomShortcut(event: KeyboardEvent) {
  if (!(event.ctrlKey || event.metaKey)) {
    return false;
  }

  const normalizedKey = event.key.toLowerCase();
  return BROWSER_ZOOM_SHORTCUT_KEYS.has(normalizedKey);
}

type InteractiveTutorialStepId =
  | "season"
  | "project-robot"
  | "project-outreach"
  | "tasks-tab"
  | "task-timeline"
  | "timeline-week-view"
  | "timeline-shift-period"
  | "timeline-open-task"
  | "timeline-edit-task"
  | "task-queue"
  | "create-task"
  | "queue-filter"
  | "queue-edit-task"
  | "task-milestones"
  | "create-milestone"
  | "milestone-search"
  | "milestone-edit"
  | "worklogs-tab"
  | "create-worklog"
  | "roster-tab"
  | "create-student"
  | "inventory-tab"
  | "inventory-materials"
  | "create-material"
  | "material-filter"
  | "material-edit"
  | "inventory-parts"
  | "create-part"
  | "part-search"
  | "inventory-purchases"
  | "create-purchase"
  | "purchase-sort"
  | "workflow-tab"
  | "create-subsystem"
  | "edit-subsystem"
  | "create-mechanism"
  | "edit-mechanism"
  | "add-part-to-mechanism"
  | "manufacturing-tab"
  | "manufacturing-cnc"
  | "create-cnc-job"
  | "inspect-cnc-job"
  | "manufacturing-prints"
  | "create-print-job"
  | "complete-print-job"
  | "manufacturing-search"
  | "manufacturing-fabrication"
  | "create-fabrication-job"
  | "inspect-fabrication-job"
  | "workflow-edit"
  | "create-document"
  | "help-tab";

interface InteractiveTutorialStep {
  id: InteractiveTutorialStepId;
  title: string;
  instruction: string;
  selector: string;
}

interface InteractiveTutorialReturnState {
  activeTab: ViewTab;
  taskView: TaskViewTab;
  riskManagementView: RiskManagementViewTab;
  worklogsView: WorklogsViewTab;
  manufacturingView: ManufacturingViewTab;
  inventoryView: InventoryViewTab;
  selectedSeasonId: string | null;
  selectedProjectId: string | null;
}

interface InteractiveTutorialCreationCounts {
  tasks: number;
  workLogs: number;
  partDefinitions: number;
  partInstances: number;
  subsystems: number;
  mechanisms: number;
  students: number;
  materials: number;
  purchaseItems: number;
  milestones: number;
  cncJobs: number;
  printJobs: number;
  fabricationJobs: number;
  completedPrintJobs: number;
  documents: number;
}

export default function AppWorkspace() {
  const [activeTab, setActiveTab] = useState<ViewTab>("tasks");
  const [tabSwitchDirection, setTabSwitchDirection] = useState<"up" | "down">("down");
  const [taskView, setTaskView] = useState<TaskViewTab>("timeline");
  const [riskManagementView, setRiskManagementView] =
    useState<RiskManagementViewTab>("risks");
  const [worklogsView, setWorklogsView] = useState<WorklogsViewTab>("logs");
  const [manufacturingView, setManufacturingView] =
    useState<ManufacturingViewTab>("cnc");
  const [inventoryView, setInventoryView] = useState<InventoryViewTab>("materials");
  const [bootstrap, setBootstrap] = useState<BootstrapPayload>(EMPTY_BOOTSTRAP);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataMessage, setDataMessage] = useState<string | null>(null);
  const [interactiveTutorialChapterId, setInteractiveTutorialChapterId] =
    useState<InteractiveTutorialChapterId | null>(null);
  const [interactiveTutorialCompletedChapterId, setInteractiveTutorialCompletedChapterId] =
    useState<InteractiveTutorialChapterId | null>(null);
  const [interactiveTutorialCompletedChapters, setInteractiveTutorialCompletedChapters] =
    useState<InteractiveTutorialChapterId[]>([]);
  const [interactiveTutorialStepIndex, setInteractiveTutorialStepIndex] = useState<number | null>(
    null,
  );
  const [interactiveTutorialReturnState, setInteractiveTutorialReturnState] =
    useState<InteractiveTutorialReturnState | null>(null);
  const [interactiveTutorialSeasonName, setInteractiveTutorialSeasonName] = useState<
    string | null
  >(null);
  const [interactiveTutorialSeasonId, setInteractiveTutorialSeasonId] = useState<string | null>(
    null,
  );
  const [interactiveTutorialProjectId, setInteractiveTutorialProjectId] = useState<string | null>(
    null,
  );
  const [interactiveTutorialProjectName, setInteractiveTutorialProjectName] = useState<
    string | null
  >(null);
  const [interactiveTutorialBootstrapSnapshot, setInteractiveTutorialBootstrapSnapshot] =
    useState<BootstrapPayload | null>(null);
  const [interactiveTutorialBaselineCounts, setInteractiveTutorialBaselineCounts] =
    useState<InteractiveTutorialCreationCounts | null>(null);
  const [interactiveTutorialStepError, setInteractiveTutorialStepError] = useState<string | null>(
    null,
  );
  const [isInteractiveTutorialTargetReady, setIsInteractiveTutorialTargetReady] =
    useState(false);
  const [interactiveTutorialSpotlightRect, setInteractiveTutorialSpotlightRect] =
    useState<{
      top: number;
      left: number;
      width: number;
      height: number;
    } | null>(null);
  const interactiveTutorialCardRef = useRef<HTMLElement | null>(null);
  const interactiveTutorialTargetRef = useRef<HTMLElement | null>(null);
  const interactiveTutorialStepBaselineRef = useRef<string | null>(null);

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
    isSigningIn,
    sessionUser,
  } = useAppAuth({
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
  const signedInMember = useMemo(
    () => findMemberForSessionUser(scopedBootstrap.members, sessionUser),
    [scopedBootstrap.members, sessionUser],
  );
  const isMyViewActive =
    Boolean(signedInMember) &&
    activePersonFilter.length === 1 &&
    activePersonFilter[0] === signedInMember?.id;
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
    externalMembers,
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
  const activeTimelineTaskDetail = useMemo(
    () =>
      activeTimelineTaskDetailId
        ? scopedBootstrap.tasks.find((task) => task.id === activeTimelineTaskDetailId) ?? null
        : null,
    [activeTimelineTaskDetailId, scopedBootstrap.tasks],
  );

  const visibleTabs = useMemo(
    () => new Set<ViewTab>(navigationItems.map((item) => item.value)),
    [navigationItems],
  );
  const interactiveTutorialChapters = useMemo(() => INTERACTIVE_TUTORIAL_CHAPTERS, []);
  const interactiveTutorialChapterOrder = useMemo(
    () => interactiveTutorialChapters.map((chapter) => chapter.id),
    [interactiveTutorialChapters],
  );
  const activeInteractiveTutorialChapter = useMemo(
    () =>
      interactiveTutorialChapterId
        ? interactiveTutorialChapters.find((chapter) => chapter.id === interactiveTutorialChapterId) ??
          null
        : null,
    [interactiveTutorialChapterId, interactiveTutorialChapters],
  );
  const interactiveTutorialSteps = activeInteractiveTutorialChapter?.steps ?? [];
  const isInteractiveTutorialActive =
    interactiveTutorialChapterId !== null || interactiveTutorialCompletedChapterId !== null;
  const currentInteractiveTutorialStep =
    interactiveTutorialStepIndex !== null
      ? interactiveTutorialSteps[interactiveTutorialStepIndex] ?? null
      : null;
  const interactiveTutorialStepNumber =
    interactiveTutorialStepIndex !== null ? interactiveTutorialStepIndex + 1 : 0;
  const interactiveTutorialNextChapterId = useMemo(() => {
    if (!interactiveTutorialCompletedChapterId) {
      return null;
    }

    const currentChapterIndex = interactiveTutorialChapterOrder.indexOf(
      interactiveTutorialCompletedChapterId,
    );
    if (currentChapterIndex < 0) {
      return null;
    }

    return interactiveTutorialChapterOrder[currentChapterIndex + 1] ?? null;
  }, [interactiveTutorialChapterOrder, interactiveTutorialCompletedChapterId]);
  const interactiveTutorialChapterStartOptions = useMemo(
    () =>
      interactiveTutorialChapters.map((chapter) => ({
        id: chapter.id,
        title: chapter.title,
        summary: chapter.summary,
        completed: interactiveTutorialCompletedChapters.includes(chapter.id),
      })),
    [interactiveTutorialChapters, interactiveTutorialCompletedChapters],
  );
  const isInteractiveTutorialDropdownStep = useCallback(
    (step: InteractiveTutorialStep) =>
      step.id === "season" ||
      step.id === "project-robot" ||
      step.id === "project-outreach",
    [],
  );
  const isInteractiveTutorialSearchStep = useCallback(
    (step: InteractiveTutorialStep) =>
      step.id === "part-search" ||
      step.id === "milestone-search" ||
      step.id === "manufacturing-search",
    [],
  );
  const isInteractiveTutorialCreationStep = useCallback(
    (step: InteractiveTutorialStep) =>
      step.id === "create-task" ||
      step.id === "create-worklog" ||
      step.id === "create-material" ||
      step.id === "create-part" ||
      step.id === "create-purchase" ||
      step.id === "create-milestone" ||
      step.id === "create-subsystem" ||
      step.id === "create-mechanism" ||
      step.id === "add-part-to-mechanism" ||
      step.id === "create-student" ||
      step.id === "create-cnc-job" ||
      step.id === "create-print-job" ||
      step.id === "complete-print-job" ||
      step.id === "create-fabrication-job" ||
      step.id === "create-document",
    [],
  );
  const getInteractiveTutorialCreationCounts = useCallback(
    (
      payload: BootstrapPayload,
      tutorialProjectId: string | null,
      tutorialSeasonId: string | null,
    ): InteractiveTutorialCreationCounts => {
      const scopedTasks = tutorialProjectId
        ? payload.tasks.filter((task) => task.projectId === tutorialProjectId)
        : payload.tasks;
      const scopedTaskIds = new Set(scopedTasks.map((task) => task.id));
      const scopedSubsystems = tutorialProjectId
        ? payload.subsystems.filter((subsystem) => subsystem.projectId === tutorialProjectId)
        : payload.subsystems;
      const scopedSubsystemIds = new Set(scopedSubsystems.map((subsystem) => subsystem.id));
      const scopedStudents = tutorialSeasonId
        ? payload.members.filter(
            (member) =>
              member.role === "student" && isMemberActiveInSeason(member, tutorialSeasonId),
          )
        : payload.members.filter((member) => member.role === "student");

      return {
        tasks: scopedTasks.length,
        workLogs: payload.workLogs.filter((workLog) => scopedTaskIds.has(workLog.taskId)).length,
        partDefinitions: payload.partDefinitions.length,
        partInstances: payload.partInstances.filter((partInstance) =>
          scopedSubsystemIds.has(partInstance.subsystemId),
        ).length,
        subsystems: scopedSubsystems.length,
        mechanisms: payload.mechanisms.filter((mechanism) =>
          scopedSubsystemIds.has(mechanism.subsystemId),
        ).length,
        students: scopedStudents.length,
        materials: payload.materials.length,
        purchaseItems: payload.purchaseItems.filter((item) =>
          scopedSubsystemIds.has(item.subsystemId),
        ).length,
        milestones: payload.events.filter((event) =>
          tutorialProjectId ? event.projectIds.includes(tutorialProjectId) : true,
        ).length,
        cncJobs: payload.manufacturingItems.filter(
          (item) =>
            item.process === "cnc" &&
            (scopedSubsystemIds.size === 0 || scopedSubsystemIds.has(item.subsystemId)),
        ).length,
        printJobs: payload.manufacturingItems.filter(
          (item) =>
            item.process === "3d-print" &&
            (scopedSubsystemIds.size === 0 || scopedSubsystemIds.has(item.subsystemId)),
        ).length,
        fabricationJobs: payload.manufacturingItems.filter(
          (item) =>
            item.process === "fabrication" &&
            (scopedSubsystemIds.size === 0 || scopedSubsystemIds.has(item.subsystemId)),
        ).length,
        completedPrintJobs: payload.manufacturingItems.filter(
          (item) =>
            item.process === "3d-print" &&
            item.status === "complete" &&
            (scopedSubsystemIds.size === 0 || scopedSubsystemIds.has(item.subsystemId)),
        ).length,
        documents: payload.artifacts.filter((artifact) =>
          tutorialProjectId ? artifact.projectId === tutorialProjectId : true,
        ).length,
      };
    },
    [],
  );
  const isInteractiveTutorialCreateStepModalInteraction = useCallback(
    (step: InteractiveTutorialStep, node: Node) => {
      if (!isInteractiveTutorialCreationStep(step)) {
        return false;
      }

      const element = node instanceof Element ? node : node.parentElement;
      return Boolean(element?.closest(".modal-card"));
    },
    [isInteractiveTutorialCreationStep],
  );
  const hasInteractiveTutorialAlternativeOption = useCallback(
    (step: InteractiveTutorialStep, target: HTMLSelectElement) => {
      const expectedValue =
        step.id === "season" ? interactiveTutorialSeasonId : interactiveTutorialProjectId;
      if (!expectedValue) {
        return false;
      }

      return Array.from(target.options).some((option) => {
        if (option.disabled) {
          return false;
        }

        const optionValue = option.value.trim();
        if (!optionValue || optionValue === expectedValue) {
          return false;
        }

        const optionLabel = option.textContent?.trim().toLowerCase() ?? "";
        if (optionLabel === "create new season" || optionLabel === "add robot") {
          return false;
        }

        return true;
      });
    },
    [interactiveTutorialProjectId, interactiveTutorialSeasonId],
  );
  const interactiveTutorialSpotlightBounds = interactiveTutorialSpotlightRect
    ? {
      top: Math.max(0, interactiveTutorialSpotlightRect.top),
      left: Math.max(0, interactiveTutorialSpotlightRect.left),
      right: Math.max(
        0,
        interactiveTutorialSpotlightRect.left + interactiveTutorialSpotlightRect.width,
      ),
      bottom: Math.max(
        0,
        interactiveTutorialSpotlightRect.top + interactiveTutorialSpotlightRect.height,
      ),
    }
    : null;
  const isInteractiveTutorialStepComplete = useCallback(
    (step: InteractiveTutorialStep) => {
      if (isInteractiveTutorialCreationStep(step)) {
        if (!interactiveTutorialBaselineCounts) {
          return false;
        }

        const currentCounts = getInteractiveTutorialCreationCounts(
          bootstrap,
          interactiveTutorialProjectId,
          interactiveTutorialSeasonId,
        );
        switch (step.id) {
          case "create-task":
            return currentCounts.tasks > interactiveTutorialBaselineCounts.tasks;
          case "create-worklog":
            return currentCounts.workLogs > interactiveTutorialBaselineCounts.workLogs;
          case "create-material":
            return currentCounts.materials > interactiveTutorialBaselineCounts.materials;
          case "create-part":
            return (
              currentCounts.partDefinitions > interactiveTutorialBaselineCounts.partDefinitions
            );
          case "create-purchase":
            return currentCounts.purchaseItems > interactiveTutorialBaselineCounts.purchaseItems;
          case "create-milestone":
            return currentCounts.milestones > interactiveTutorialBaselineCounts.milestones;
          case "create-subsystem":
            return currentCounts.subsystems > interactiveTutorialBaselineCounts.subsystems;
          case "create-mechanism":
            return currentCounts.mechanisms > interactiveTutorialBaselineCounts.mechanisms;
          case "add-part-to-mechanism":
            return currentCounts.partInstances > interactiveTutorialBaselineCounts.partInstances;
          case "create-student":
            return currentCounts.students > interactiveTutorialBaselineCounts.students;
          case "create-cnc-job":
            return currentCounts.cncJobs > interactiveTutorialBaselineCounts.cncJobs;
          case "create-print-job":
            return currentCounts.printJobs > interactiveTutorialBaselineCounts.printJobs;
          case "complete-print-job":
            return (
              currentCounts.completedPrintJobs >
              interactiveTutorialBaselineCounts.completedPrintJobs
            );
          case "create-fabrication-job":
            return (
              currentCounts.fabricationJobs > interactiveTutorialBaselineCounts.fabricationJobs
            );
          case "create-document":
            return currentCounts.documents > interactiveTutorialBaselineCounts.documents;
          default:
            return false;
        }
      }

      const target = document.querySelector<HTMLElement>(step.selector);
      if (!target) {
        return false;
      }

      switch (step.id) {
        case "season":
          return (
            target instanceof HTMLSelectElement &&
            typeof interactiveTutorialSeasonId === "string" &&
            target.value === interactiveTutorialSeasonId
          );
        case "project-robot":
        case "project-outreach":
          return (
            target instanceof HTMLSelectElement &&
            typeof interactiveTutorialProjectId === "string" &&
            target.value === interactiveTutorialProjectId
          );
        case "timeline-week-view":
          return (
            target instanceof HTMLSelectElement &&
            target.value === "week"
          );
        case "timeline-shift-period": {
          const baselineLabel = interactiveTutorialStepBaselineRef.current ?? "";
          const currentLabel =
            target.parentElement?.querySelector<HTMLElement>(".timeline-period-label")?.textContent?.trim() ??
            "";
          if (currentLabel.length === 0) {
            return false;
          }
          if (baselineLabel.length === 0) {
            interactiveTutorialStepBaselineRef.current = currentLabel;
            return false;
          }
          return currentLabel !== baselineLabel;
        }
        case "timeline-open-task":
          return activeTimelineTaskDetailId !== null;
        case "timeline-edit-task":
        case "queue-edit-task":
          return taskModalMode === "edit" && activeTaskId !== null;
        case "queue-filter":
        case "material-filter":
        case "purchase-sort":
          return Boolean(target.querySelector(".toolbar-filter-dropdown.is-active"));
        case "part-search":
        case "milestone-search":
        case "manufacturing-search": {
          const input =
            target.querySelector<HTMLInputElement>("input[type='text']") ??
            target.querySelector<HTMLInputElement>("input");
          return Boolean(input?.value.trim());
        }
        case "milestone-edit":
          return Boolean(document.querySelector('[data-tutorial-target="milestone-edit-modal"]'));
        case "material-edit":
          return materialModalMode === "edit" && activeMaterialId !== null;
        case "edit-subsystem":
          return subsystemModalMode === "edit" && activeSubsystemId !== null;
        case "edit-mechanism":
          return mechanismModalMode === "edit" && activeMechanismId !== null;
        case "inspect-cnc-job":
        case "inspect-fabrication-job":
          return manufacturingModalMode === "edit" && activeManufacturingId !== null;
        case "workflow-edit":
          return workstreamModalMode === "edit" && activeWorkstreamId !== null;
        default:
          return target.getAttribute("data-active") === "true";
      }
    },
    [
      activeManufacturingId,
      activeMechanismId,
      activeMaterialId,
      activeSubsystemId,
      activeTaskId,
      activeTimelineTaskDetailId,
      bootstrap,
      getInteractiveTutorialCreationCounts,
      interactiveTutorialBaselineCounts,
      interactiveTutorialProjectId,
      interactiveTutorialSeasonId,
      isInteractiveTutorialCreationStep,
      manufacturingModalMode,
      materialModalMode,
      mechanismModalMode,
      subsystemModalMode,
      taskModalMode,
      workstreamModalMode,
      activeWorkstreamId,
    ],
  );
  const getInteractiveTutorialStepError = useCallback(
    (step: InteractiveTutorialStep) => {
      switch (step.id) {
        case "season":
          if (!interactiveTutorialSeasonId) {
            return "Tutorial season is unavailable. End tutorial and reload the page.";
          }
          return `Select ${interactiveTutorialSeasonName ?? "Tutorial season"} to complete this step.`;
        case "project-robot":
        case "project-outreach":
          if (!interactiveTutorialProjectId) {
            return "Tutorial project is unavailable. End tutorial and reload the page.";
          }
          return `Select ${interactiveTutorialProjectName ?? "the tutorial project"} to continue.`;
        case "timeline-week-view":
          return "Switch the timeline interval to Week.";
        case "timeline-shift-period":
          return "Use next or previous period to move the timeline.";
        case "timeline-open-task":
          return "Click a timeline task bar or label to open task details.";
        case "timeline-edit-task":
          return "Click Edit task from the timeline task details popup.";
        case "create-task":
          return "Create and save one new task to continue.";
        case "queue-filter":
          return "Apply at least one Queue filter to continue.";
        case "queue-edit-task":
          return "Open any queue task row in edit mode to continue.";
        case "create-milestone":
          return "Create and save one milestone to continue.";
        case "milestone-search":
          return "Type in the milestone search input to continue.";
        case "milestone-edit":
          return "Open a milestone row in edit mode to continue.";
        case "create-worklog":
          return "Create and save one new work log to continue.";
        case "create-material":
          return "Create and save one material to continue.";
        case "material-filter":
          return "Apply a material filter to continue.";
        case "material-edit":
          return "Open a material row in edit mode to continue.";
        case "create-part":
          return "Create and save one new part definition to continue.";
        case "part-search":
          return "Type in the parts search input to continue.";
        case "create-purchase":
          return "Create and save one purchase request to continue.";
        case "purchase-sort":
          return "Use the Purchases status control to continue.";
        case "create-subsystem":
          return "Create and save one new subsystem to continue.";
        case "edit-subsystem":
          return "Open subsystem edit mode to continue.";
        case "create-mechanism":
          return "Create and save one new mechanism to continue.";
        case "edit-mechanism":
          return "Open mechanism edit mode to continue.";
        case "add-part-to-mechanism":
          return "Add and save a part instance on a mechanism to continue.";
        case "create-student":
          return "Create and save one new student to continue.";
        case "create-cnc-job":
          return "Create and save one CNC job to continue.";
        case "inspect-cnc-job":
          return "Open a CNC row in edit mode to continue.";
        case "create-print-job":
          return "Create and save one 3D print job to continue.";
        case "complete-print-job":
          return "Mark a 3D print job as complete and save it to continue.";
        case "manufacturing-search":
          return "Type in the manufacturing search input to continue.";
        case "create-fabrication-job":
          return "Create and save one fabrication job to continue.";
        case "inspect-fabrication-job":
          return "Open a fabrication row in edit mode to continue.";
        case "workflow-edit":
          return "Open a workflow row in edit mode to continue.";
        case "create-document":
          return "Create and save one document to continue.";
        default:
          return "Complete the highlighted interaction to continue.";
      }
    },
    [
      interactiveTutorialProjectId,
      interactiveTutorialProjectName,
      interactiveTutorialSeasonId,
      interactiveTutorialSeasonName,
    ],
  );

  useEffect(() => {
    if (!visibleTabs.has(activeTab)) {
      setActiveTab("tasks");
    }
  }, [activeTab, visibleTabs]);

  useEffect(() => {
    if (!activeTimelineTaskDetailId) {
      return;
    }

    if (!scopedBootstrap.tasks.some((task) => task.id === activeTimelineTaskDetailId)) {
      setActiveTimelineTaskDetailId(null);
    }
  }, [activeTimelineTaskDetailId, scopedBootstrap.tasks]);

  const handleUnauthorized = useCallback(() => {
    expireSession("Your session expired. Please sign in again.");
    setDataMessage("Your session expired. Please sign in again.");
  }, [expireSession]);
  const requestPhotoUpload = useCallback(
    (projectId: string, file: File) =>
      file.type.startsWith("video/")
        ? requestVideoUpload(projectId, file, handleUnauthorized)
        : requestImageUpload(projectId, file, handleUnauthorized),
    [handleUnauthorized],
  );

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

  const toggleMyView = useCallback(() => {
    if (!signedInMember) {
      return;
    }

    setDataMessage(null);
    setActivePersonFilter((current) =>
      current.length === 1 && current[0] === signedInMember.id
        ? []
        : [signedInMember.id],
    );
  }, [signedInMember]);

  const loadWorkspace = useCallback(async () => {
    setIsLoadingData(true);
    setDataMessage(null);

    try {
      const payload = await fetchBootstrap(
        getSinglePersonFilterId(activePersonFilter),
        selectedSeasonId,
        selectedProjectId,
        handleUnauthorized,
      );
      const scopedPayload = scopeBootstrapBySelection(
        payload,
        selectedSeasonId,
        selectedProjectId,
      );
      const signedInScopedMember = findMemberForSessionUser(
        scopedPayload.members,
        sessionUser,
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

      if (activePersonFilter.length > 0) {
        const scopedMemberIds = new Set(scopedPayload.members.map((member) => member.id));
        const nextPersonFilter = activePersonFilter.filter((memberId) =>
          scopedMemberIds.has(memberId),
        );
        if (nextPersonFilter.length !== activePersonFilter.length) {
          setActivePersonFilter(nextPersonFilter);
        }
      }

      selectMember(nextMemberId, scopedPayload);

      if (taskModalMode === "create") {
        setTaskDraft(buildEmptyTaskPayload(scopedPayload));
      }

      if (taskModalMode === "edit" && activeTaskId) {
        const nextTask = payload.tasks.find((task) => task.id === activeTaskId);
        if (nextTask) {
          setTaskDraft(taskToPayload(nextTask, scopedPayload));
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
          buildEmptyManufacturingPayload(
            payload,
            current.process,
            current.process === "cnc" ? signedInScopedMember?.id ?? null : null,
          ),
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

      if (workstreamModalMode === "create") {
        setWorkstreamDraft(
          buildEmptyWorkstreamPayload(scopedPayload, {
            projectId: selectedProjectId ?? undefined,
          }),
        );
      }

      if (workstreamModalMode === "edit" && activeWorkstreamId) {
        const nextWorkstream = scopedPayload.workstreams.find(
          (workstream) => workstream.id === activeWorkstreamId,
        );
        if (nextWorkstream) {
          setWorkstreamDraft(workstreamToPayload(nextWorkstream));
        } else {
          setWorkstreamModalMode(null);
          setActiveWorkstreamId(null);
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
    activeWorkstreamId,
    artifactDraft.kind,
    artifactModalMode,
    handleUnauthorized,
    mechanismModalMode,
    manufacturingModalMode,
    materialModalMode,
    partDefinitionModalMode,
    partInstanceModalMode,
    purchaseModalMode,
    sessionUser,
    selectedMemberId,
    selectedProjectId,
    selectedSeasonId,
    selectMember,
    subsystemModalMode,
    taskModalMode,
    workstreamModalMode,
  ]);

  const openCreateTaskModal = useCallback(() => {
    suppressNextAutoWorkspaceLoadRef.current = true;
    setShowTimelineCreateToggleInTaskModal(false);
    setActiveTimelineTaskDetailId(null);
    setActiveTaskId(null);
    setTaskDraft(buildEmptyTaskPayload(scopedBootstrap));
    setTaskModalMode("create");
  }, [
    scopedBootstrap,
    setActiveTaskId,
    setActiveTimelineTaskDetailId,
    setShowTimelineCreateToggleInTaskModal,
    setTaskDraft,
    setTaskModalMode,
  ]);

  const openCreateTaskModalFromTimeline = useCallback(() => {
    suppressNextAutoWorkspaceLoadRef.current = true;
    setShowTimelineCreateToggleInTaskModal(true);
    setActiveTimelineTaskDetailId(null);
    setActiveTaskId(null);
    setTaskDraft(buildEmptyTaskPayload(scopedBootstrap));
    setTaskModalMode("create");
  }, [
    scopedBootstrap,
    setActiveTaskId,
    setActiveTimelineTaskDetailId,
    setShowTimelineCreateToggleInTaskModal,
    setTaskDraft,
    setTaskModalMode,
  ]);

  const openEditTaskModal = useCallback((task: TaskRecord) => {
    suppressNextAutoWorkspaceLoadRef.current = true;
    setShowTimelineCreateToggleInTaskModal(false);
    setActiveTimelineTaskDetailId(null);
    setActiveTaskId(task.id);
    setTaskDraft(taskToPayload(task, scopedBootstrap));
    setTaskModalMode("edit");
  }, [
    scopedBootstrap,
    setActiveTaskId,
    setActiveTimelineTaskDetailId,
    setShowTimelineCreateToggleInTaskModal,
    setTaskDraft,
    setTaskModalMode,
  ]);

  const openTimelineTaskDetailsModal = useCallback((task: TaskRecord) => {
    suppressNextAutoWorkspaceLoadRef.current = true;
    setShowTimelineCreateToggleInTaskModal(false);
    setActiveTimelineTaskDetailId(task.id);
  }, [setActiveTimelineTaskDetailId, setShowTimelineCreateToggleInTaskModal]);

  const closeTimelineTaskDetailsModal = useCallback(() => {
    suppressNextAutoWorkspaceLoadRef.current = true;
    setActiveTimelineTaskDetailId(null);
  }, [setActiveTimelineTaskDetailId]);

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
        getSinglePersonFilterId(activePersonFilter),
      ),
    );
    setWorkLogModalMode("create");
  };

  const closeWorkLogModal = () => {
    setWorkLogModalMode(null);
  };

  const openCreateQaReportModal = () => {
    setQaReportDraft(
      buildEmptyQaReportPayload(scopedBootstrap, getSinglePersonFilterId(activePersonFilter)),
    );
    setQaReportModalMode("create");
  };

  const closeQaReportModal = () => {
    setQaReportModalMode(null);
  };

  const openCreateEventReportModal = () => {
    setEventReportDraft(buildEmptyTestResultPayload(scopedBootstrap));
    setEventReportFindings("");
    setEventReportModalMode("create");
  };

  const closeEventReportModal = () => {
    setEventReportModalMode(null);
    setEventReportFindings("");
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
    setManufacturingDraft(
      buildEmptyManufacturingPayload(
        bootstrap,
        process,
        process === "cnc" ? signedInMember?.id ?? null : null,
      ),
    );
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

  const openCreateWorkstreamModal = () => {
    setActiveWorkstreamId(null);
    setWorkstreamDraft(
      buildEmptyWorkstreamPayload(scopedBootstrap, {
        projectId: selectedProjectId ?? undefined,
      }),
    );
    setWorkstreamModalMode("create");
  };

  const openEditWorkstreamModal = (workstream: BootstrapPayload["workstreams"][number]) => {
    setActiveWorkstreamId(workstream.id);
    setWorkstreamDraft(workstreamToPayload(workstream));
    setWorkstreamModalMode("edit");
  };

  const closeWorkstreamModal = () => {
    setWorkstreamModalMode(null);
    setActiveWorkstreamId(null);
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
      const { taskDependencies = [], taskBlockers = [], ...taskDraftWithoutDependencies } = taskDraft;
      const currentTaskId = taskModalMode === "edit" ? activeTaskId : null;
      type NormalizedTaskBlocker = {
        id: string | undefined;
        blockedTaskId: string;
        blockerType: TaskBlockerType;
        blockerId: string | null;
        description: string;
        severity: TaskBlockerSeverity;
      };
      const normalizedTaskBlockers = taskBlockers.reduce<NormalizedTaskBlocker[]>(
        (acc, blocker) => {
          const description = blocker.description.trim();
          const blockerId = blocker.blockerId?.trim() ?? "";
          const requiresTarget = blocker.blockerType !== "external";

          if (description.length === 0 && !requiresTarget) {
            return acc;
          }

          if (requiresTarget && blockerId.length === 0) {
            return acc;
          }

          acc.push({
            id: blocker.id,
            blockedTaskId: activeTaskId ?? "",
            blockerType: blocker.blockerType,
            blockerId: requiresTarget ? blockerId : null,
            description:
              description.length > 0
                ? description
                : blocker.blockerType === "task"
                  ? "Waiting on another task"
                  : blocker.blockerType === "part_instance"
                    ? "Waiting on parts"
                    : blocker.blockerType === "event"
                      ? "Waiting on a milestone"
                      : "Other blocker",
            severity: blocker.severity,
          });

          return acc;
        },
        [],
      );
      const payload: TaskPayload = {
        ...taskDraftWithoutDependencies,
        blockers: normalizedTaskBlockers.map((blocker) => blocker.description),
        workstreamId: null,
        workstreamIds: [],
        subsystemId: taskDraft.subsystemIds[0] ?? taskDraft.subsystemId,
        mechanismId: taskDraft.mechanismIds[0] ?? null,
        partInstanceId: taskDraft.partInstanceIds[0] ?? null,
        assigneeIds: Array.from(
          new Set(
            [...taskDraft.assigneeIds, taskDraft.ownerId].filter(
              (memberId): memberId is string => Boolean(memberId),
            ),
          ),
        ),
      };

      const desiredTaskDependencies = Array.from(
        new Map(
          taskDependencies
            .map((dependency) => ({
              id: dependency.id,
              upstreamTaskId: dependency.upstreamTaskId.trim(),
              dependencyType: dependency.dependencyType,
            }))
            .filter(
              (dependency) =>
                dependency.upstreamTaskId.length > 0 &&
                dependency.upstreamTaskId !== currentTaskId,
            )
            .map((dependency) => [
              `${dependency.upstreamTaskId}:${dependency.dependencyType}`,
              dependency,
            ]),
        ).values(),
      );

      const syncTaskDependencies = async (taskId: string) => {
        const existingDependencies =
          bootstrap.taskDependencies?.filter(
            (dependency) => dependency.downstreamTaskId === taskId,
          ) ?? [];
        const visibleDependencyIds = new Set(
          (scopedBootstrap.taskDependencies ?? [])
            .filter((dependency) => dependency.downstreamTaskId === taskId)
            .map((dependency) => dependency.id),
        );
        const existingDependenciesById = new Map(
          existingDependencies.map((dependency) => [dependency.id, dependency] as const),
        );
        const desiredDependencyIds = new Set(
          desiredTaskDependencies
            .map((dependency) => dependency.id)
            .filter((dependencyId): dependencyId is string => Boolean(dependencyId)),
        );

        for (const dependency of desiredTaskDependencies) {
          if (dependency.id && existingDependenciesById.has(dependency.id)) {
            const existingDependency = existingDependenciesById.get(dependency.id);
            if (
              existingDependency &&
              (existingDependency.upstreamTaskId !== dependency.upstreamTaskId ||
                existingDependency.dependencyType !== dependency.dependencyType)
            ) {
              await updateTaskDependencyRecord(
                dependency.id,
                {
                  upstreamTaskId: dependency.upstreamTaskId,
                  downstreamTaskId: taskId,
                  dependencyType: dependency.dependencyType,
                },
                handleUnauthorized,
              );
            }
            continue;
          }

          await createTaskDependencyRecord(
            {
              upstreamTaskId: dependency.upstreamTaskId,
              downstreamTaskId: taskId,
              dependencyType: dependency.dependencyType,
            },
            handleUnauthorized,
          );
        }

        for (const dependency of existingDependencies) {
          if (
            visibleDependencyIds.has(dependency.id) &&
            !desiredDependencyIds.has(dependency.id)
          ) {
            await deleteTaskDependencyRecord(dependency.id, handleUnauthorized);
          }
        }
      };

      const syncTaskBlockers = async (taskId: string) => {
        const existingBlockers =
          bootstrap.taskBlockers?.filter(
            (blocker) => blocker.blockedTaskId === taskId && blocker.status === "open",
          ) ?? [];
        const visibleBlockerIds = new Set(
          (scopedBootstrap.taskBlockers ?? [])
            .filter((blocker) => blocker.blockedTaskId === taskId && blocker.status === "open")
            .map((blocker) => blocker.id),
        );
        const existingBlockersById = new Map(
          existingBlockers.map((blocker) => [blocker.id, blocker] as const),
        );
        const desiredBlockerIds = new Set(
          normalizedTaskBlockers
            .map((blocker) => blocker.id)
            .filter((blockerId): blockerId is string => Boolean(blockerId)),
        );

        for (const blocker of normalizedTaskBlockers) {
          if (blocker.id && existingBlockersById.has(blocker.id)) {
            const existingBlocker = existingBlockersById.get(blocker.id);
            if (
              existingBlocker &&
              (existingBlocker.blockerType !== blocker.blockerType ||
                existingBlocker.blockerId !== blocker.blockerId ||
                existingBlocker.description !== blocker.description ||
                existingBlocker.severity !== blocker.severity)
            ) {
              await updateTaskBlockerRecord(
                blocker.id,
                {
                  blockedTaskId: taskId,
                  blockerType: blocker.blockerType,
                  blockerId: blocker.blockerId,
                  description: blocker.description,
                  severity: blocker.severity,
                  status: "open",
                },
                handleUnauthorized,
              );
            }
            continue;
          }

          await createTaskBlockerRecord(
            {
              blockedTaskId: taskId,
              blockerType: blocker.blockerType,
              blockerId: blocker.blockerId,
              description: blocker.description,
              severity: blocker.severity,
              status: "open",
              createdByMemberId: signedInMember?.id ?? null,
            },
            handleUnauthorized,
          );
        }

        for (const blocker of existingBlockers) {
          if (visibleBlockerIds.has(blocker.id) && !desiredBlockerIds.has(blocker.id)) {
            await deleteTaskBlockerRecord(blocker.id, handleUnauthorized);
          }
        }
      };

      let savedTask: TaskRecord;
      if (taskModalMode === "create") {
        savedTask = await createTask(payload, handleUnauthorized);
      } else if (taskModalMode === "edit" && activeTaskId) {
        savedTask = await updateTaskRecord(activeTaskId, payload, handleUnauthorized);
      } else {
        savedTask = await createTask(payload, handleUnauthorized);
      }

      await syncTaskDependencies(savedTask.id);
      await syncTaskBlockers(savedTask.id);
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

  const handleDeleteTask = async (taskId: string) => {
    setIsDeletingTask(true);
    setDataMessage(null);

    try {
      await deleteTaskRecord(taskId, handleUnauthorized);
      if (activeTaskId === taskId) {
        closeTaskModal();
      }
      await loadWorkspace();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsDeletingTask(false);
    }
  };

  const handleResolveTaskBlocker = async (blockerId: string) => {
    setDataMessage(null);

    try {
      await updateTaskBlockerRecord(blockerId, { status: "resolved" }, handleUnauthorized);
      await loadWorkspace();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    }
  };

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

  const handleQaReportSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingQaReport(true);
    setDataMessage(null);

    try {
      const taskExists = bootstrap.tasks.some((task) => task.id === qaReportDraft.taskId);
      if (!taskExists) {
        setDataMessage("Please choose a real task before saving the QA report.");
        return;
      }

      const participantIds = Array.from(
        new Set(
          (qaReportDraft.participantIds ?? []).filter((participantId) =>
            bootstrap.members.some((member) => member.id === participantId),
          ),
        ),
      );
      if (participantIds.length === 0) {
        setDataMessage("Please choose at least one participant before saving the QA report.");
        return;
      }

      const task = bootstrap.tasks.find((candidate) => candidate.id === qaReportDraft.taskId) ?? null;
      const reportDate = qaReportDraft.createdAt ?? localTodayDate();
      const payload: QaReportPayload = {
        reportType: "QA",
        projectId: task?.projectId ?? bootstrap.projects[0]?.id ?? "",
        taskId: task?.id ?? "",
        eventId: null,
        workstreamId: task?.workstreamId ?? null,
        createdByMemberId: qaReportDraft.createdByMemberId ?? null,
        result: qaReportDraft.result,
        summary: qaReportDraft.summary.trim(),
        participantIds,
        mentorApproved: qaReportDraft.mentorApproved ?? false,
        notes: qaReportDraft.notes.trim(),
        createdAt: reportDate,
        reviewedAt: qaReportDraft.reviewedAt ?? reportDate,
        title: qaReportDraft.title?.trim(),
        status: qaReportDraft.status,
        findings: qaReportDraft.findings ?? [],
        photoUrl: qaReportDraft.photoUrl ?? "",
      };

      await createQaReportRecord(payload, handleUnauthorized);
      await loadWorkspace();
      closeQaReportModal();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsSavingQaReport(false);
    }
  };

  const handleEventReportSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingEventReport(true);
    setDataMessage(null);

    try {
      const eventExists = bootstrap.events.some((item) => item.id === eventReportDraft.eventId);
      if (!eventExists) {
        setDataMessage("Please choose a real event before saving the event report.");
        return;
      }

      const normalizedTitle = (eventReportDraft.title ?? "").trim();
      if (normalizedTitle.length < 2) {
        setDataMessage("Please provide an event report title before saving.");
        return;
      }

      const findings = Array.from(
        new Set(
          eventReportFindings
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line.length > 0),
        ),
      );

      const event = bootstrap.events.find((candidate) => candidate.id === eventReportDraft.eventId) ?? null;
      const reportDate = eventReportDraft.createdAt ?? localTodayDate();
      const payload: TestResultPayload = {
        reportType: "EventTest",
        projectId: event?.projectIds[0] ?? bootstrap.projects[0]?.id ?? "",
        taskId: null,
        eventId: event?.id ?? "",
        workstreamId: null,
        createdByMemberId: eventReportDraft.createdByMemberId ?? null,
        result: eventReportDraft.result,
        summary: normalizedTitle,
        notes: findings.join("\n"),
        createdAt: reportDate,
        participantIds: eventReportDraft.participantIds ?? [],
        mentorApproved: eventReportDraft.mentorApproved ?? false,
        reviewedAt: eventReportDraft.reviewedAt ?? reportDate,
        title: normalizedTitle,
        status: eventReportDraft.status,
        findings,
        photoUrl: eventReportDraft.photoUrl ?? "",
      };

      await createTestResultRecord(payload, handleUnauthorized);
      await loadWorkspace();
      closeEventReportModal();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsSavingEventReport(false);
    }
  };

  const normalizeRiskPayload = useCallback((payload: RiskPayload): RiskPayload => {
    const mitigationTaskId =
      typeof payload.mitigationTaskId === "string" &&
      payload.mitigationTaskId.trim().length > 0
        ? payload.mitigationTaskId.trim()
        : null;

    return {
      ...payload,
      title: payload.title.trim(),
      detail: payload.detail.trim(),
      sourceId: payload.sourceId.trim(),
      attachmentId: payload.attachmentId.trim(),
      mitigationTaskId,
    };
  }, []);

  const handleCreateRisk = useCallback(
    async (payload: RiskPayload) => {
      setDataMessage(null);

      try {
        await createRiskRecord(normalizeRiskPayload(payload), handleUnauthorized);
        await loadWorkspace();
      } catch (error) {
        const message = toErrorMessage(error);
        setDataMessage(message);
        throw error;
      }
    },
    [handleUnauthorized, loadWorkspace, normalizeRiskPayload],
  );

  const handleUpdateRisk = useCallback(
    async (riskId: string, payload: RiskPayload) => {
      setDataMessage(null);

      try {
        await updateRiskRecord(riskId, normalizeRiskPayload(payload), handleUnauthorized);
        await loadWorkspace();
      } catch (error) {
        const message = toErrorMessage(error);
        setDataMessage(message);
        throw error;
      }
    },
    [handleUnauthorized, loadWorkspace, normalizeRiskPayload],
  );

  const handleDeleteRisk = useCallback(
    async (riskId: string) => {
      setDataMessage(null);

      try {
        await deleteRiskRecord(riskId, handleUnauthorized);
        await loadWorkspace();
      } catch (error) {
        const message = toErrorMessage(error);
        setDataMessage(message);
        throw error;
      }
    },
    [handleUnauthorized, loadWorkspace],
  );

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

      if (!selectedPartDefinition) {
        setDataMessage(
          "Please choose a real part from the Parts tab before saving the manufacturing job.",
        );
        return;
      }

      const selectedPartInstanceIds =
        manufacturingDraft.partInstanceIds.length > 0
          ? manufacturingDraft.partInstanceIds
          : manufacturingDraft.partInstanceId
            ? [manufacturingDraft.partInstanceId]
            : [];
      const selectedPartInstances = selectedPartInstanceIds
        .map((partInstanceId) =>
          bootstrap.partInstances.find((partInstance) => partInstance.id === partInstanceId),
        )
        .filter((partInstance): partInstance is BootstrapPayload["partInstances"][number] => {
          if (!partInstance) {
            return false;
          }

          return (
            !selectedPartDefinition ||
            partInstance.partDefinitionId === selectedPartDefinition.id
          );
        });

      if (selectedPartInstances.length === 0) {
        setDataMessage("Select at least one part instance for this manufacturing job.");
        return;
      }

      const primaryPartInstance = selectedPartInstances[0] ?? null;

      const payload: ManufacturingItemPayload = {
        ...manufacturingDraft,
        subsystemId: primaryPartInstance?.subsystemId ?? manufacturingDraft.subsystemId,
        title: selectedPartDefinition.name,
        partInstanceId: primaryPartInstance?.id ?? null,
        partInstanceIds: selectedPartInstances.map((partInstance) => partInstance.id),
        inHouse: manufacturingDraft.process === "cnc" ? manufacturingDraft.inHouse : false,
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
      const payload: MaterialPayload =
        materialModalMode === "create"
          ? {
              ...materialDraft,
              reorderPoint: Math.floor(materialDraft.onHandQuantity / 2),
            }
          : materialDraft;

      if (materialModalMode === "create") {
        await createMaterialRecord(payload, handleUnauthorized);
      } else if (materialModalMode === "edit" && activeMaterialId) {
        await updateMaterialRecord(activeMaterialId, payload, handleUnauthorized);
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

  const handleCncQuickStatusChange = useCallback(
    async (
      item: ManufacturingItemRecord,
      status: ManufacturingItemRecord["status"],
    ) => {
      if (item.status === status && item.mentorReviewed) {
        return;
      }

      setDataMessage(null);
      try {
        await updateManufacturingItemRecord(
          item.id,
          {
            mentorReviewed: true,
            status,
          },
          handleUnauthorized,
        );
        await loadWorkspace();
      } catch (error) {
        setDataMessage(toErrorMessage(error));
      }
    },
    [handleUnauthorized, loadWorkspace],
  );

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

  const handleToggleArtifactArchived = async (artifactId: string) => {
    const currentArtifact = bootstrap.artifacts.find(
      (artifact) => artifact.id === artifactId,
    );
    if (!currentArtifact) {
      return;
    }

    setIsSavingArtifact(true);
    setDataMessage(null);

    try {
      await updateArtifactRecord(
        artifactId,
        { isArchived: !(currentArtifact.isArchived ?? false) },
        handleUnauthorized,
      );
      await loadWorkspace();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsSavingArtifact(false);
    }
  };

  const handleWorkstreamSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingWorkstream(true);
    setDataMessage(null);

    try {
      const payload: WorkstreamPayload = {
        ...workstreamDraft,
        name: workstreamDraft.name.trim(),
        description: workstreamDraft.description.trim(),
      };
      if (!payload.projectId) {
        setDataMessage("Pick a project before adding a workflow.");
        return;
      }

      if (workstreamModalMode === "create") {
        await createWorkstreamRecord(payload, handleUnauthorized);
      } else if (workstreamModalMode === "edit" && activeWorkstreamId) {
        await updateWorkstreamRecord(activeWorkstreamId, payload, handleUnauthorized);
      }
      await loadWorkspace();
      closeWorkstreamModal();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsSavingWorkstream(false);
    }
  };

  const handleToggleWorkstreamArchived = async (workstreamId: string) => {
    const currentWorkstream = bootstrap.workstreams.find(
      (workstream) => workstream.id === workstreamId,
    );
    if (!currentWorkstream) {
      return;
    }

    setIsSavingWorkstream(true);
    setDataMessage(null);

    try {
      await updateWorkstreamRecord(
        workstreamId,
        { isArchived: !currentWorkstream.isArchived },
        handleUnauthorized,
      );
      await loadWorkspace();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsSavingWorkstream(false);
    }
  };

  const handlePartDefinitionSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (partDefinitionModalMode === "create" && !selectedSeasonId) {
      setDataMessage("Pick a season before adding a part definition.");
      return;
    }

    setIsSavingPartDefinition(true);
    setDataMessage(null);

    try {
      if (partDefinitionModalMode === "create") {
        await createPartDefinitionRecord(
          {
            ...partDefinitionDraft,
            seasonId: selectedSeasonId ?? partDefinitionDraft.seasonId,
            activeSeasonIds: selectedSeasonId
              ? [selectedSeasonId]
              : partDefinitionDraft.activeSeasonIds,
          },
          handleUnauthorized,
        );
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

  const handleTogglePartDefinitionArchived = async (partDefinitionId: string) => {
    const currentPartDefinition = bootstrap.partDefinitions.find(
      (partDefinition) => partDefinition.id === partDefinitionId,
    );
    if (!currentPartDefinition) {
      return;
    }

    setIsSavingPartDefinition(true);
    setDataMessage(null);

    try {
      await updatePartDefinitionRecord(
        partDefinitionId,
        { isArchived: !currentPartDefinition.isArchived },
        handleUnauthorized,
      );
      await loadWorkspace();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsSavingPartDefinition(false);
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

  const handleToggleSubsystemArchived = async (subsystemId: string) => {
    const currentSubsystem = bootstrap.subsystems.find(
      (subsystem) => subsystem.id === subsystemId,
    );
    if (!currentSubsystem) {
      return;
    }

    setIsSavingSubsystem(true);
    setDataMessage(null);

    try {
      await updateSubsystemRecord(
        subsystemId,
        { isArchived: !currentSubsystem.isArchived },
        handleUnauthorized,
      );
      await loadWorkspace();
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

  const handleToggleMechanismArchived = async (mechanismId: string) => {
    const currentMechanism = bootstrap.mechanisms.find(
      (mechanism) => mechanism.id === mechanismId,
    );
    if (!currentMechanism) {
      return;
    }

    setIsSavingMechanism(true);
    setDataMessage(null);

    try {
      await updateMechanismRecord(
        mechanismId,
        { isArchived: !currentMechanism.isArchived },
        handleUnauthorized,
      );
      await loadWorkspace();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsSavingMechanism(false);
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

  const handleCreateRobot = useCallback(() => {
    if (!selectedSeasonId) {
      setDataMessage("Pick a season before adding a robot.");
      return;
    }

    setDataMessage(null);
    setRobotProjectNameDraft("");
    setRobotProjectModalMode("create");
  }, [selectedSeasonId]);

  const handleEditSelectedRobot = useCallback(() => {
    if (selectedProject?.projectType !== "robot") {
      return;
    }

    setDataMessage(null);
    setRobotProjectNameDraft(selectedProject.name);
    setRobotProjectModalMode("edit");
  }, [selectedProject]);

  const closeRobotProjectPopup = useCallback(() => {
    if (isSavingRobotProject) {
      return;
    }

    setRobotProjectModalMode(null);
    setRobotProjectNameDraft("");
  }, [isSavingRobotProject]);

  const handleRobotProjectSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const robotName = robotProjectNameDraft.trim();
    if (robotName.length < 2) {
      setDataMessage("Robot names need at least 2 characters.");
      return;
    }

    if (robotProjectModalMode === "create" && !selectedSeasonId) {
      setDataMessage("Pick a season before adding a robot.");
      return;
    }

    if (robotProjectModalMode === "edit" && selectedProject?.projectType !== "robot") {
      setDataMessage("Select a robot before editing its name.");
      return;
    }

    setIsSavingRobotProject(true);
    setDataMessage(null);

    try {
      if (robotProjectModalMode === "create" && selectedSeasonId) {
        const project = await createProjectRecord(
          {
            seasonId: selectedSeasonId,
            name: robotName,
            projectType: "robot",
            status: "active",
          },
          handleUnauthorized,
        );
        await loadWorkspace();
        setSelectedProjectId(project.id);
      } else if (robotProjectModalMode === "edit" && selectedProject) {
        const payload: ProjectPayload = {
          name: robotName,
        };
        const project = await updateProjectRecord(
          selectedProject.id,
          payload,
          handleUnauthorized,
        );
        await loadWorkspace();
        setSelectedProjectId(project.id);
      }

      setRobotProjectModalMode(null);
      setRobotProjectNameDraft("");
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsSavingRobotProject(false);
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
          activeSeasonIds: [selectedSeasonId],
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
      if (activePersonFilter.includes(memberId)) {
        setActivePersonFilter((current) => current.filter((id) => id !== memberId));
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

  const handleReactivateMemberForSeason = async (memberId: string) => {
    if (!selectedSeasonId) {
      setDataMessage("Pick a season before reactivating a roster member.");
      return;
    }

    const member = bootstrap.members.find((candidate) => candidate.id === memberId);
    if (!member) {
      setDataMessage("Select a valid inactive roster member to reactivate.");
      return;
    }

    const activeSeasonIds = getMemberActiveSeasonIds(member);
    if (activeSeasonIds.includes(selectedSeasonId)) {
      setDataMessage("That person is already active in this season.");
      return;
    }

    setIsSavingMember(true);
    setDataMessage(null);

    try {
      await updateMemberRecord(
        member.id,
        {
          activeSeasonIds: [...activeSeasonIds, selectedSeasonId],
        },
        handleUnauthorized,
      );
      setIsAddPersonOpen(false);
      await loadWorkspace();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsSavingMember(false);
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

  const closeInteractiveTutorial = useCallback(async () => {
    const returnState = interactiveTutorialReturnState;
    const bootstrapSnapshot = interactiveTutorialBootstrapSnapshot;

    if (interactiveTutorialTargetRef.current) {
      interactiveTutorialTargetRef.current = null;
    }

    setInteractiveTutorialStepIndex(null);
    setInteractiveTutorialChapterId(null);
    setInteractiveTutorialCompletedChapterId(null);
    setInteractiveTutorialCompletedChapters([]);
    setIsInteractiveTutorialTargetReady(false);
    setInteractiveTutorialSpotlightRect(null);
    setInteractiveTutorialSeasonName(null);
    setInteractiveTutorialSeasonId(null);
    setInteractiveTutorialProjectId(null);
    setInteractiveTutorialProjectName(null);
    setInteractiveTutorialBootstrapSnapshot(null);
    setInteractiveTutorialBaselineCounts(null);
    setInteractiveTutorialStepError(null);
    interactiveTutorialStepBaselineRef.current = null;

    if (bootstrapSnapshot) {
      startTransition(() => {
        setBootstrap(bootstrapSnapshot);
      });
    }

    if (returnState) {
      setActiveTab(returnState.activeTab);
      setTaskView(returnState.taskView);
      setRiskManagementView(returnState.riskManagementView);
      setWorklogsView(returnState.worklogsView);
      setManufacturingView(returnState.manufacturingView);
      setInventoryView(returnState.inventoryView);
      setSelectedSeasonId(returnState.selectedSeasonId);
      setSelectedProjectId(returnState.selectedProjectId);
    }

    setInteractiveTutorialReturnState(null);
    try {
      await resetInteractiveTutorialSession(handleUnauthorized);
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    }
  }, [
    handleUnauthorized,
    interactiveTutorialBootstrapSnapshot,
    interactiveTutorialReturnState,
  ]);

  const advanceInteractiveTutorial = useCallback(() => {
    if (interactiveTutorialStepIndex === null) {
      return;
    }

    if (interactiveTutorialStepIndex >= interactiveTutorialSteps.length - 1) {
      if (interactiveTutorialChapterId) {
        setInteractiveTutorialCompletedChapterId(interactiveTutorialChapterId);
        setInteractiveTutorialCompletedChapters((current) =>
          current.includes(interactiveTutorialChapterId)
            ? current
            : [...current, interactiveTutorialChapterId],
        );
      }
      setInteractiveTutorialStepIndex(null);
      setInteractiveTutorialStepError(null);
      setInteractiveTutorialSpotlightRect(null);
      setIsInteractiveTutorialTargetReady(false);
      return;
    }

    setInteractiveTutorialStepIndex(interactiveTutorialStepIndex + 1);
  }, [
    interactiveTutorialChapterId,
    interactiveTutorialStepIndex,
    interactiveTutorialSteps.length,
  ]);

  const startInteractiveTutorial = useCallback(async (chapterId: InteractiveTutorialChapterId = "planning") => {
    if (interactiveTutorialStepIndex !== null) {
      return;
    }

    const chapter =
      interactiveTutorialChapters.find((candidate) => candidate.id === chapterId) ??
      interactiveTutorialChapters[0] ??
      null;
    if (!chapter || chapter.steps.length === 0) {
      setDataMessage("Interactive tutorial chapter is unavailable right now.");
      return;
    }

    if (!interactiveTutorialReturnState) {
      setInteractiveTutorialReturnState({
        activeTab,
        taskView,
        riskManagementView,
        worklogsView,
        manufacturingView,
        inventoryView,
        selectedSeasonId,
        selectedProjectId,
      });
    }
    if (!interactiveTutorialBootstrapSnapshot) {
      setInteractiveTutorialBootstrapSnapshot(structuredClone(bootstrap));
    }

    setDataMessage(null);
    try {
      if (!interactiveTutorialReturnState) {
        await startInteractiveTutorialSession(handleUnauthorized);
      }
      await resetInteractiveTutorialSession(handleUnauthorized, "baseline");
    } catch (error) {
      setDataMessage(toErrorMessage(error));
      return;
    }

    let tutorialBootstrap: BootstrapPayload;
    try {
      tutorialBootstrap = await fetchBootstrap(
        undefined,
        undefined,
        undefined,
        handleUnauthorized,
      );
    } catch (error) {
      setDataMessage(toErrorMessage(error));
      return;
    }

    startTransition(() => {
      setBootstrap(tutorialBootstrap);
    });
    setActivePersonFilter([]);

    const tutorialSeason =
      tutorialBootstrap.seasons.find((season) => season.name.toLowerCase() === "tutorial season") ??
      tutorialBootstrap.seasons.find((season) => season.id === "default-season") ??
      tutorialBootstrap.seasons[0] ??
      null;
    const projectsInTutorialSeason = tutorialSeason
      ? tutorialBootstrap.projects.filter((project) => project.seasonId === tutorialSeason.id)
      : [];
    const tutorialProject =
      projectsInTutorialSeason.find((project) => project.projectType === chapter.preferredProjectType) ??
      projectsInTutorialSeason.find((project) => project.projectType === "robot") ??
      projectsInTutorialSeason[0] ??
      tutorialBootstrap.projects.find((project) => project.projectType === chapter.preferredProjectType) ??
      tutorialBootstrap.projects.find((project) => project.projectType === "robot") ??
      tutorialBootstrap.projects[0] ??
      null;
    const tutorialSeasonId = tutorialSeason?.id ?? null;
    const tutorialProjectId = tutorialProject?.id ?? null;

    const nonTutorialSeasonId =
      tutorialBootstrap.seasons.find((season) => season.id !== tutorialSeasonId)?.id ?? null;
    const projectToForceOutreachSwitch =
      projectsInTutorialSeason.find(
        (project) => project.id !== tutorialProjectId && project.projectType === "robot",
      ) ??
      projectsInTutorialSeason.find((project) => project.id !== tutorialProjectId) ??
      null;

    if (tutorialSeasonId) {
      setSelectedSeasonId(
        chapter.id === "planning"
          ? nonTutorialSeasonId ?? tutorialSeasonId
          : tutorialSeasonId,
      );
      setInteractiveTutorialSeasonId(tutorialSeasonId);
      setInteractiveTutorialSeasonName(`${tutorialSeason?.name ?? "Tutorial season"} (fake sandbox)`);
    } else {
      setSelectedSeasonId(null);
      setInteractiveTutorialSeasonId(null);
      setInteractiveTutorialSeasonName("Tutorial season (fake sandbox)");
    }

    if (tutorialProject) {
      if (chapter.id === "planning") {
        setSelectedProjectId(null);
      } else if (chapter.id === "outreach") {
        setSelectedProjectId(projectToForceOutreachSwitch?.id ?? null);
      } else {
        setSelectedProjectId(tutorialProject.id);
      }
      setInteractiveTutorialProjectId(tutorialProject.id);
      setInteractiveTutorialProjectName(tutorialProject.name);
    } else {
      setSelectedProjectId(null);
      setInteractiveTutorialProjectId(null);
      setInteractiveTutorialProjectName(null);
    }

    setInteractiveTutorialBaselineCounts(
      getInteractiveTutorialCreationCounts(
        tutorialBootstrap,
        tutorialProjectId,
        tutorialSeasonId,
      ),
    );
    setInteractiveTutorialCompletedChapterId(null);
    setInteractiveTutorialChapterId(chapter.id);

    setActiveTab("tasks");
    setTaskView("timeline");
    setRiskManagementView("risks");
    setWorklogsView("logs");
    setManufacturingView("cnc");
    setInventoryView("materials");
    setIsInteractiveTutorialTargetReady(false);
    setInteractiveTutorialStepError(null);
    setInteractiveTutorialStepIndex(0);
    interactiveTutorialStepBaselineRef.current = null;

    if (isSidebarCollapsed) {
      toggleSidebar();
    }
    closeSidebarOverlay();
  }, [
    activeTab,
    bootstrap,
    closeSidebarOverlay,
    getInteractiveTutorialCreationCounts,
    handleUnauthorized,
    interactiveTutorialBootstrapSnapshot,
    interactiveTutorialChapters,
    interactiveTutorialReturnState,
    interactiveTutorialStepIndex,
    inventoryView,
    isSidebarCollapsed,
    manufacturingView,
    riskManagementView,
    selectedProjectId,
    selectedSeasonId,
    taskView,
    worklogsView,
    toggleSidebar,
  ]);

  const continueInteractiveTutorialToNextChapter = useCallback(() => {
    if (!interactiveTutorialNextChapterId) {
      void closeInteractiveTutorial();
      return;
    }

    void startInteractiveTutorial(interactiveTutorialNextChapterId);
  }, [closeInteractiveTutorial, interactiveTutorialNextChapterId, startInteractiveTutorial]);

  useEffect(() => {
    if (interactiveTutorialStepIndex === null) {
      return;
    }

    if (interactiveTutorialSteps.length === 0) {
      void closeInteractiveTutorial();
      return;
    }

    if (interactiveTutorialStepIndex >= interactiveTutorialSteps.length) {
      setInteractiveTutorialStepIndex(interactiveTutorialSteps.length - 1);
    }
  }, [
    closeInteractiveTutorial,
    interactiveTutorialStepIndex,
    interactiveTutorialSteps.length,
  ]);

  useEffect(() => {
    if (!currentInteractiveTutorialStep) {
      interactiveTutorialStepBaselineRef.current = null;
      return;
    }

    if (currentInteractiveTutorialStep.id === "timeline-shift-period") {
      const baselineLabel =
        document.querySelector<HTMLElement>(".timeline-period-label")?.textContent?.trim() ?? "";
      interactiveTutorialStepBaselineRef.current = baselineLabel;
      return;
    }

    interactiveTutorialStepBaselineRef.current = null;
  }, [currentInteractiveTutorialStep]);

  useEffect(() => {
    if (interactiveTutorialTargetRef.current) {
      interactiveTutorialTargetRef.current = null;
    }

    setIsInteractiveTutorialTargetReady(false);
    setInteractiveTutorialSpotlightRect(null);
    setInteractiveTutorialStepError(null);

    if (!currentInteractiveTutorialStep) {
      return;
    }

    let frameId: number | null = null;
    let attempts = 0;
    const maxAttempts = 24;
    let resizeObserver: ResizeObserver | null = null;
    const updateSpotlightRect = () => {
      const activeTarget = interactiveTutorialTargetRef.current;
      if (!activeTarget || !activeTarget.isConnected) {
        return;
      }

      const rect = activeTarget.getBoundingClientRect();
      setInteractiveTutorialSpotlightRect({
        top: Math.max(6, rect.top - 6),
        left: Math.max(6, rect.left - 6),
        width: Math.max(20, rect.width + 12),
        height: Math.max(20, rect.height + 12),
      });
    };

    const setHighlightTarget = () => {
      const target = document.querySelector<HTMLElement>(currentInteractiveTutorialStep.selector);

      if (!target) {
        if (attempts < maxAttempts) {
          attempts += 1;
          frameId = window.requestAnimationFrame(setHighlightTarget);
        }
        return;
      }

      target.scrollIntoView({
        behavior: attempts > 0 ? "smooth" : "auto",
        block: "center",
        inline: "nearest",
      });
      interactiveTutorialTargetRef.current = target;

      updateSpotlightRect();
      window.addEventListener("resize", updateSpotlightRect);
      window.addEventListener("scroll", updateSpotlightRect, true);
      if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(() => {
          updateSpotlightRect();
        });
        resizeObserver.observe(target);
      }

      setIsInteractiveTutorialTargetReady(true);
    };

    setHighlightTarget();

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener("resize", updateSpotlightRect);
      window.removeEventListener("scroll", updateSpotlightRect, true);
      if (interactiveTutorialTargetRef.current) {
        interactiveTutorialTargetRef.current = null;
      }
      setIsInteractiveTutorialTargetReady(false);
      setInteractiveTutorialSpotlightRect(null);
    };
  }, [currentInteractiveTutorialStep]);

  useEffect(() => {
    if (!currentInteractiveTutorialStep) {
      return;
    }

    const handleClickCapture = (event: MouseEvent) => {
      const targetNode = event.target as Node | null;
      if (!targetNode) {
        return;
      }

      const isTutorialPanelClick = interactiveTutorialCardRef.current?.contains(targetNode);
      if (isTutorialPanelClick) {
        return;
      }

      const highlightedTarget = interactiveTutorialTargetRef.current;
      const isTargetClick = highlightedTarget?.contains(targetNode);
      const activeStep = currentInteractiveTutorialStep;

      if (!isTargetClick) {
        if (isInteractiveTutorialCreateStepModalInteraction(activeStep, targetNode)) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        return;
      }

      if (isInteractiveTutorialDropdownStep(activeStep)) {
        const isDropdownSelectionComplete = isInteractiveTutorialStepComplete(activeStep);
        if (highlightedTarget instanceof HTMLSelectElement) {
          if (
            isDropdownSelectionComplete &&
            !hasInteractiveTutorialAlternativeOption(activeStep, highlightedTarget)
          ) {
            setInteractiveTutorialStepError(null);
            advanceInteractiveTutorial();
            return;
          }
        }

        if (!isDropdownSelectionComplete) {
          setInteractiveTutorialStepError(getInteractiveTutorialStepError(activeStep));
          return;
        }

        setInteractiveTutorialStepError(null);
        return;
      }

      if (isInteractiveTutorialCreationStep(activeStep)) {
        setInteractiveTutorialStepError(null);
        return;
      }

      window.setTimeout(() => {
        if (isInteractiveTutorialStepComplete(activeStep)) {
          setInteractiveTutorialStepError(null);
          advanceInteractiveTutorial();
          return;
        }

        setInteractiveTutorialStepError(getInteractiveTutorialStepError(activeStep));
      }, 100);
    };

    const handleChangeCapture = (event: Event) => {
      const activeStep = currentInteractiveTutorialStep;
      if (
        !isInteractiveTutorialDropdownStep(activeStep) &&
        activeStep.id !== "timeline-week-view"
      ) {
        return;
      }

      const targetNode = event.target as Node | null;
      if (!targetNode) {
        return;
      }

      const highlightedTarget = interactiveTutorialTargetRef.current;
      const isTargetChange = highlightedTarget?.contains(targetNode);
      if (!isTargetChange) {
        return;
      }

      window.setTimeout(() => {
        if (isInteractiveTutorialStepComplete(activeStep)) {
          setInteractiveTutorialStepError(null);
          advanceInteractiveTutorial();
          return;
        }

        setInteractiveTutorialStepError(getInteractiveTutorialStepError(activeStep));
      }, 0);
    };
    const handleInputCapture = (event: Event) => {
      const activeStep = currentInteractiveTutorialStep;
      if (!isInteractiveTutorialSearchStep(activeStep)) {
        return;
      }

      const targetNode = event.target as Node | null;
      if (!targetNode) {
        return;
      }

      const highlightedTarget = interactiveTutorialTargetRef.current;
      const isTargetInput = highlightedTarget?.contains(targetNode);
      if (!isTargetInput) {
        return;
      }

      window.setTimeout(() => {
        if (isInteractiveTutorialStepComplete(activeStep)) {
          setInteractiveTutorialStepError(null);
          advanceInteractiveTutorial();
          return;
        }

        setInteractiveTutorialStepError(getInteractiveTutorialStepError(activeStep));
      }, 0);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        void closeInteractiveTutorial();
      }
    };

    document.addEventListener("click", handleClickCapture, true);
    document.addEventListener("change", handleChangeCapture, true);
    document.addEventListener("input", handleInputCapture, true);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("click", handleClickCapture, true);
      document.removeEventListener("change", handleChangeCapture, true);
      document.removeEventListener("input", handleInputCapture, true);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    advanceInteractiveTutorial,
    closeInteractiveTutorial,
    currentInteractiveTutorialStep,
    getInteractiveTutorialStepError,
    hasInteractiveTutorialAlternativeOption,
    isInteractiveTutorialCreateStepModalInteraction,
    isInteractiveTutorialCreationStep,
    isInteractiveTutorialDropdownStep,
    isInteractiveTutorialSearchStep,
    isInteractiveTutorialStepComplete,
  ]);

  useEffect(() => {
    if (!currentInteractiveTutorialStep) {
      return;
    }

    if (!isInteractiveTutorialCreationStep(currentInteractiveTutorialStep)) {
      return;
    }

    if (!isInteractiveTutorialStepComplete(currentInteractiveTutorialStep)) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setInteractiveTutorialStepError(null);
      advanceInteractiveTutorial();
    }, 120);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    advanceInteractiveTutorial,
    currentInteractiveTutorialStep,
    isInteractiveTutorialCreationStep,
    isInteractiveTutorialStepComplete,
  ]);

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

  useEffect(() => {
    if (!robotProjectModalMode) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeRobotProjectPopup();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeRobotProjectPopup, robotProjectModalMode]);

  const disablePanelAnimations = Boolean(
    activeTimelineTaskDetailId ||
    taskModalMode ||
      workLogModalMode ||
      qaReportModalMode ||
      eventReportModalMode ||
      purchaseModalMode ||
      manufacturingModalMode ||
      materialModalMode ||
      partDefinitionModalMode ||
      partInstanceModalMode ||
      subsystemModalMode ||
      mechanismModalMode ||
      artifactModalMode ||
      workstreamModalMode ||
      isAddSeasonPopupOpen ||
      robotProjectModalMode ||
      isInteractiveTutorialActive,
  );

  const isWorkspaceModalOpen = Boolean(
    activeTimelineTaskDetailId ||
    taskModalMode ||
      workLogModalMode ||
      qaReportModalMode ||
      eventReportModalMode ||
      purchaseModalMode ||
      manufacturingModalMode ||
      materialModalMode ||
      partDefinitionModalMode ||
      partInstanceModalMode ||
      subsystemModalMode ||
      mechanismModalMode ||
      artifactModalMode ||
      workstreamModalMode,
  );

  if (authBooting) {
    return (
      <AuthStatusScreen
        body="Checking the server-side auth configuration before the workspace opens."
        isDarkMode={isDarkMode}
        shellStyle={isDarkMode ? pageShellStyle : undefined}
        title="Loading sign-in rules for MECO Robotics."
      />
    );
  }

  if (!authConfig) {
    return (
      <AuthStatusScreen
        body="The app could not confirm the server-side sign-in rules, so access is paused until the API is reachable again."
        isDarkMode={isDarkMode}
        message={authMessage}
        shellStyle={isDarkMode ? pageShellStyle : undefined}
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
        isDarkMode={isDarkMode}
        isSigningIn={isSigningIn}
        onRequestEmailCode={handleRequestEmailCode}
        onVerifyEmailCode={handleVerifyEmailCode}
        onDevBypassSignIn={handleDevBypassSignIn}
        shellStyle={isDarkMode ? pageShellStyle : undefined}
        signInConfig={enforcedAuthConfig}
      />
    );
  }

  return (
    <main
      className={`page-shell ${isDarkMode ? "dark-mode" : ""} ${isSidebarCollapsed ? "is-sidebar-collapsed" : ""} ${isSidebarOverlay ? "is-sidebar-overlay" : ""}`}
      style={pageShellStyle}
    >
      <Suspense fallback={<WorkspaceShellLoading />}>
        <AppTopbar
          activeTab={activeTab}
          handleSignOut={handleSignOut}
          inventoryView={inventoryView}
          isLoadingData={isLoadingData}
          loadWorkspace={loadWorkspace}
          manufacturingView={manufacturingView}
          riskManagementView={riskManagementView}
          isMyViewActive={isMyViewActive}
          myViewMemberName={signedInMember?.name ?? null}
          sessionUser={sessionUser}
          isNonRobotProject={isNonRobotProject}
          setInventoryView={setInventoryView}
          setManufacturingView={setManufacturingView}
          setRiskManagementView={setRiskManagementView}
          setTaskView={setTaskView}
          setWorklogsView={setWorklogsView}
          taskView={taskView}
          worklogsView={worklogsView}
          seasons={bootstrap.seasons}
          selectedSeasonId={selectedSeasonId}
          subsystemsLabel={subsystemsLabel}
          onCreateSeason={handleCreateSeason}
          onSelectSeason={setSelectedSeasonId}
          onToggleMyView={toggleMyView}
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
          isSidebarCollapsed={isSidebarCollapsed}
        />

        <AppSidebar
          activeTab={activeTab}
          items={navigationItems}
          onSelectTab={handleSidebarTabSelect}
          isCollapsed={isSidebarCollapsed}
          toggleSidebar={toggleSidebar}
          projects={projectsInSelectedSeason}
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
          onCreateRobot={handleCreateRobot}
          onEditSelectedRobot={handleEditSelectedRobot}
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

        {robotProjectModalMode ? (
          <div
            className="modal-scrim"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                closeRobotProjectPopup();
              }
            }}
            role="presentation"
          >
            <section aria-modal="true" className="modal-card roster-edit-modal" role="dialog">
              <div className="panel-header compact-header">
                <div className="queue-section-header">
                  <h3>
                    {robotProjectModalMode === "create" ? "Add robot" : "Edit robot name"}
                  </h3>
                </div>
                <button className="icon-button" onClick={closeRobotProjectPopup} type="button">
                  Close
                </button>
              </div>
              <form className="modal-form" onSubmit={handleRobotProjectSubmit}>
                <label className="field modal-wide">
                  <span>Name</span>
                  <input
                    autoFocus
                    minLength={2}
                    onChange={(event) => setRobotProjectNameDraft(event.target.value)}
                    placeholder="Practice Bot"
                    required
                    value={robotProjectNameDraft}
                  />
                </label>
                <div className="modal-actions modal-wide">
                  <button
                    className="secondary-action"
                    onClick={closeRobotProjectPopup}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="primary-action"
                    disabled={isSavingRobotProject}
                    type="submit"
                  >
                    {isSavingRobotProject
                      ? "Saving..."
                      : robotProjectModalMode === "create"
                        ? "Add robot"
                        : "Save name"}
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
          allMembers={bootstrap.members}
          artifacts={scopedArtifacts}
          bootstrap={scopedBootstrap}
          cncItems={cncItems}
          dataMessage={dataMessage}
          fabricationItems={fabricationItems}
          handleCreateMember={handleCreateMember}
          handleReactivateMemberForSeason={handleReactivateMemberForSeason}
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
          openCreateQaReportModal={openCreateQaReportModal}
          openCreateEventReportModal={openCreateEventReportModal}
          openCreateWorkstreamModal={openCreateWorkstreamModal}
          openEditWorkstreamModal={openEditWorkstreamModal}
          onCreateRisk={handleCreateRisk}
          onDeleteRisk={handleDeleteRisk}
          onCncQuickStatusChange={handleCncQuickStatusChange}
          openEditManufacturingModal={openEditManufacturingModal}
          openEditArtifactModal={openEditArtifactModal}
          openEditMaterialModal={openEditMaterialModal}
          openEditMechanismModal={openEditMechanismModal}
          openEditPartInstanceModal={openEditPartInstanceModal}
          openEditSubsystemModal={openEditSubsystemModal}
          openEditPartDefinitionModal={openEditPartDefinitionModal}
          openEditPurchaseModal={openEditPurchaseModal}
          openTimelineTaskDetailsModal={openTimelineTaskDetailsModal}
          onUpdateRisk={handleUpdateRisk}
          printItems={printItems}
          rosterMentors={rosterMentors}
          showCncMentorQuickActions={
            signedInMember?.role === "mentor" ||
            signedInMember?.role === "admin" ||
            Boolean(signedInMember?.elevated)
          }
          manufacturingView={manufacturingView}
          inventoryView={inventoryView}
          riskManagementView={riskManagementView}
          taskView={taskView}
          worklogsView={worklogsView}
          selectMember={selectMember}
          selectedSeasonId={selectedSeasonId}
          selectedMemberId={selectedMemberId}
          setIsAddPersonOpen={setIsAddPersonOpen}
          setIsEditPersonOpen={setIsEditPersonOpen}
          setMemberEditDraft={setMemberEditDraft}
          setMemberForm={setMemberForm}
          setActivePersonFilter={setActivePersonFilter}
          students={students}
          disciplinesById={disciplinesById}
          eventsById={eventsById}
          externalMembers={externalMembers}
          mechanismsById={mechanismsById}
          partDefinitionsById={partDefinitionsById}
          partInstancesById={partInstancesById}
          subsystemsById={subsystemsById}
          timelineMilestoneCreateSignal={timelineMilestoneCreateSignal}
          disablePanelAnimations={disablePanelAnimations}
          onDismissDataMessage={clearDataMessage}
          onStartInteractiveTutorial={() => void startInteractiveTutorial("planning")}
          onStartInteractiveTutorialChapter={(chapterId) =>
            void startInteractiveTutorial(chapterId as InteractiveTutorialChapterId)}
          interactiveTutorialChapters={interactiveTutorialChapterStartOptions}
          isInteractiveTutorialActive={isInteractiveTutorialActive}
        />
      </Suspense>

      {currentInteractiveTutorialStep || interactiveTutorialCompletedChapterId ? (
        <aside
          aria-label="Interactive tutorial"
          className="interactive-tutorial-overlay"
          role="dialog"
        >
          {interactiveTutorialSpotlightRect && interactiveTutorialSpotlightBounds ? (
            <>
              <div
                className="interactive-tutorial-dim"
                style={{
                  top: 0,
                  left: 0,
                  right: 0,
                  height: `${interactiveTutorialSpotlightBounds.top}px`,
                }}
              />
              <div
                className="interactive-tutorial-dim"
                style={{
                  top: `${interactiveTutorialSpotlightBounds.top}px`,
                  left: 0,
                  width: `${interactiveTutorialSpotlightBounds.left}px`,
                  height: `${interactiveTutorialSpotlightRect.height}px`,
                }}
              />
              <div
                className="interactive-tutorial-dim"
                style={{
                  top: `${interactiveTutorialSpotlightBounds.top}px`,
                  left: `${interactiveTutorialSpotlightBounds.right}px`,
                  right: 0,
                  height: `${interactiveTutorialSpotlightRect.height}px`,
                }}
              />
              <div
                className="interactive-tutorial-dim"
                style={{
                  top: `${interactiveTutorialSpotlightBounds.bottom}px`,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
              />
              <div
                className="interactive-tutorial-spotlight"
                style={{
                  top: `${interactiveTutorialSpotlightRect.top}px`,
                  left: `${interactiveTutorialSpotlightRect.left}px`,
                  width: `${interactiveTutorialSpotlightRect.width}px`,
                  height: `${interactiveTutorialSpotlightRect.height}px`,
                }}
              />
            </>
          ) : (
            <div className="interactive-tutorial-dim" style={{ inset: 0 }} />
          )}
          <section className="interactive-tutorial-card" ref={interactiveTutorialCardRef}>
            {currentInteractiveTutorialStep ? (
              <>
                <div className="interactive-tutorial-header">
                  <p className="eyebrow">Interactive tutorial</p>
                  <p className="interactive-tutorial-progress">
                    {activeInteractiveTutorialChapter?.title ?? "Tutorial"}: Step {interactiveTutorialStepNumber} of{" "}
                    {interactiveTutorialSteps.length}
                  </p>
                </div>
                <h3>{currentInteractiveTutorialStep.title}</h3>
                <p>{currentInteractiveTutorialStep.instruction}</p>
                <p className="interactive-tutorial-context">
                  Fake tutorial season: {interactiveTutorialSeasonName ?? "Tutorial season"}
                </p>
                {interactiveTutorialProjectName ? (
                  <p className="interactive-tutorial-context">
                    Tutorial project: {interactiveTutorialProjectName}
                  </p>
                ) : null}
                <p className="interactive-tutorial-hint">
                  {isInteractiveTutorialTargetReady
                    ? isInteractiveTutorialCreationStep(currentInteractiveTutorialStep)
                      ? "Use Add, complete the modal, and save to continue."
                      : "Use the highlighted control to continue."
                    : "Waiting for the next highlighted control to appear..."}
                </p>
                {interactiveTutorialStepError ? (
                  <p className="interactive-tutorial-error">{interactiveTutorialStepError}</p>
                ) : null}
                <div className="interactive-tutorial-actions">
                  <button className="secondary-action" onClick={closeInteractiveTutorial} type="button">
                    End tutorial
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="interactive-tutorial-header">
                  <p className="eyebrow">Chapter complete</p>
                  <p className="interactive-tutorial-progress">
                    {interactiveTutorialChapters.find((chapter) => chapter.id === interactiveTutorialCompletedChapterId)
                      ?.title ?? "Tutorial chapter"}
                  </p>
                </div>
                <h3>Continue to the next chapter?</h3>
                <p>
                  This chapter is complete. You can end the tutorial now or continue with the next chapter.
                </p>
                <div className="interactive-tutorial-actions">
                  <button className="secondary-action" onClick={closeInteractiveTutorial} type="button">
                    End tutorial
                  </button>
                  {interactiveTutorialNextChapterId ? (
                    <button
                      className="primary-action"
                      onClick={continueInteractiveTutorialToNextChapter}
                      type="button"
                    >
                      Continue to next chapter
                    </button>
                  ) : (
                    <button className="primary-action" onClick={closeInteractiveTutorial} type="button">
                      Finish tutorial
                    </button>
                  )}
                </div>
              </>
            )}
          </section>
        </aside>
      ) : null}

      {isWorkspaceModalOpen ? (
        <Suspense fallback={null}>
          <WorkspaceModalHost
            activeArtifactId={activeArtifactId}
            activePartDefinitionId={activePartDefinitionId}
            activeMaterialId={activeMaterialId}
            activeMechanismId={activeMechanismId}
            activeWorkstreamId={activeWorkstreamId}
            activeSubsystemId={activeSubsystemId}
            activeTask={activeTask}
            activeTimelineTaskDetail={activeTimelineTaskDetail}
            bootstrap={scopedBootstrap}
            closeManufacturingModal={closeManufacturingModal}
            closeArtifactModal={closeArtifactModal}
            closeMaterialModal={closeMaterialModal}
            closeMechanismModal={closeMechanismModal}
            closePartInstanceModal={closePartInstanceModal}
            closePartDefinitionModal={closePartDefinitionModal}
            closePurchaseModal={closePurchaseModal}
            closeQaReportModal={closeQaReportModal}
            closeEventReportModal={closeEventReportModal}
            closeTimelineTaskDetailsModal={closeTimelineTaskDetailsModal}
            closeWorkLogModal={closeWorkLogModal}
            closeSubsystemModal={closeSubsystemModal}
            closeTaskModal={closeTaskModal}
            closeWorkstreamModal={closeWorkstreamModal}
            requestPhotoUpload={requestPhotoUpload}
            disciplinesById={disciplinesById}
            eventsById={eventsById}
            handleDeleteMaterial={handleDeleteMaterial}
            handleDeleteArtifact={handleDeleteArtifact}
            handleToggleArtifactArchived={handleToggleArtifactArchived}
            handleDeletePartDefinition={handleDeletePartDefinition}
            handleDeleteMechanism={handleDeleteMechanism}
            handleTogglePartDefinitionArchived={handleTogglePartDefinitionArchived}
            handleToggleSubsystemArchived={handleToggleSubsystemArchived}
            handleToggleMechanismArchived={handleToggleMechanismArchived}
            handleToggleWorkstreamArchived={handleToggleWorkstreamArchived}
            handleDeleteTask={handleDeleteTask}
            handlePartInstanceSubmit={handlePartInstanceSubmit}
            handleMechanismSubmit={handleMechanismSubmit}
            handleManufacturingSubmit={handleManufacturingSubmit}
            handleMaterialSubmit={handleMaterialSubmit}
            handlePartDefinitionSubmit={handlePartDefinitionSubmit}
            handleArtifactSubmit={handleArtifactSubmit}
            handlePurchaseSubmit={handlePurchaseSubmit}
            handleQaReportSubmit={handleQaReportSubmit}
            handleEventReportSubmit={handleEventReportSubmit}
            handleWorkLogSubmit={handleWorkLogSubmit}
            handleSubsystemSubmit={handleSubsystemSubmit}
            handleTaskSubmit={handleTaskSubmit}
            handleResolveTaskBlocker={handleResolveTaskBlocker}
            handleWorkstreamSubmit={handleWorkstreamSubmit}
            isDeletingMaterial={isDeletingMaterial}
            isDeletingArtifact={isDeletingArtifact}
            isDeletingPartDefinition={isDeletingPartDefinition}
            isDeletingMechanism={isDeletingMechanism}
            isDeletingTask={isDeletingTask}
            isSavingManufacturing={isSavingManufacturing}
            isSavingArtifact={isSavingArtifact}
            isSavingMaterial={isSavingMaterial}
            isSavingPartDefinition={isSavingPartDefinition}
            isSavingPartInstance={isSavingPartInstance}
            isSavingMechanism={isSavingMechanism}
            isSavingPurchase={isSavingPurchase}
            isSavingQaReport={isSavingQaReport}
            isSavingEventReport={isSavingEventReport}
            isSavingWorkLog={isSavingWorkLog}
            isSavingSubsystem={isSavingSubsystem}
            isSavingTask={isSavingTask}
            isSavingWorkstream={isSavingWorkstream}
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
            qaReportDraft={qaReportDraft}
            qaReportModalMode={qaReportModalMode}
            eventReportDraft={eventReportDraft}
            eventReportFindings={eventReportFindings}
            eventReportModalMode={eventReportModalMode}
            workLogDraft={workLogDraft}
            workLogModalMode={workLogModalMode}
            workstreamDraft={workstreamDraft}
            workstreamModalMode={workstreamModalMode}
            setArtifactDraft={setArtifactDraft}
            setMechanismDraft={setMechanismDraft}
            setManufacturingDraft={setManufacturingDraft}
            setMaterialDraft={setMaterialDraft}
            setPartInstanceDraft={setPartInstanceDraft}
            setPartDefinitionDraft={setPartDefinitionDraft}
            setPurchaseDraft={setPurchaseDraft}
            setPurchaseFinalCost={setPurchaseFinalCost}
            setQaReportDraft={setQaReportDraft}
            setEventReportDraft={setEventReportDraft}
            setEventReportFindings={setEventReportFindings}
            setWorkLogDraft={setWorkLogDraft}
            setWorkstreamDraft={setWorkstreamDraft}
            setSubsystemDraft={setSubsystemDraft}
            setSubsystemDraftRisks={setSubsystemDraftRisks}
            setTaskDraft={setTaskDraft}
            showTimelineCreateToggleInTaskModal={showTimelineCreateToggleInTaskModal}
            onSwitchTaskCreateToMilestone={switchTaskCreateToMilestone}
            onOpenTaskEditFromTimelineDetails={openEditTaskModal}
            openTaskDetailsModal={openTimelineTaskDetailsModal}
            students={students}
            subsystemDraft={subsystemDraft}
            subsystemDraftRisks={subsystemDraftRisks}
            subsystemModalMode={subsystemModalMode}
            taskDraft={taskDraft}
            taskModalMode={taskModalMode}
          />
        </Suspense>
      ) : null}
    </main>
  );
}
