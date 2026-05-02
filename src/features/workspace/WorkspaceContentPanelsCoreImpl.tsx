import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";

import type {
  ArtifactKind,
  ArtifactRecord,
  BootstrapPayload,
  EventPayload,
  ManufacturingItemRecord,
  MaterialRecord,
  MemberPayload,
  PartDefinitionRecord,
  PurchaseItemRecord,
  RiskPayload,
  TaskRecord,
} from "@/types";
import type {
  InventoryViewTab,
  ManufacturingViewTab,
  ReportsViewTab,
  RiskManagementViewTab,
  TaskViewTab,
  ViewTab,
  WorklogsViewTab,
} from "@/lib/workspaceNavigation";
import type { FilterSelection } from "@/features/workspace/shared";
import { WorkspaceContentPanelsView } from "./WorkspaceContentPanelsView";

type SwipeDirection = "left" | "right" | null;
type TabSwitchDirection = "up" | "down";

function getSwipeDirection<T extends string>(
  previousView: T,
  currentView: T,
  viewOrder: readonly T[],
): SwipeDirection {
  if (previousView === currentView) {
    return null;
  }

  const previousIndex = viewOrder.indexOf(previousView);
  const currentIndex = viewOrder.indexOf(currentView);

  if (previousIndex < 0 || currentIndex < 0) {
    return null;
  }

  return currentIndex > previousIndex ? "left" : "right";
}

export interface WorkspaceContentPanelsProps {
  activePersonFilter: FilterSelection;
  activeTab: ViewTab;
  tabSwitchDirection: TabSwitchDirection;
  allMembers: BootstrapPayload["members"];
  artifacts: ArtifactRecord[];
  bootstrap: BootstrapPayload;
  cncItems: ManufacturingItemRecord[];
  disciplinesById: Record<string, BootstrapPayload["disciplines"][number]>;
  externalMembers: BootstrapPayload["members"];
  fabricationItems: ManufacturingItemRecord[];
  handleCreateMember: (event: React.FormEvent<HTMLFormElement>) => void;
  handleReactivateMemberForSeason: (memberId: string) => Promise<void>;
  handleDeleteMember: (id: string) => void;
  handleTimelineEventDelete: (eventId: string) => Promise<void>;
  handleTimelineEventSave: (
    mode: "create" | "edit",
    eventId: string | null,
    payload: EventPayload,
  ) => Promise<void>;
  handleUpdateMember: (event: React.FormEvent<HTMLFormElement>) => void;
  isAddPersonOpen: boolean;
  isDeletingMember: boolean;
  isEditPersonOpen: boolean;
  isLoadingData: boolean;
  isAllProjectsView: boolean;
  isNonRobotProject: boolean;
  isSavingMember: boolean;
  memberEditDraft: MemberPayload | null;
  memberForm: MemberPayload;
  membersById: Record<string, BootstrapPayload["members"][number]>;
  mechanismsById: Record<string, BootstrapPayload["mechanisms"][number]>;
  openCreateManufacturingModal: (process: "cnc" | "3d-print" | "fabrication") => void;
  openCreateArtifactModal: (kind: ArtifactKind) => void;
  openCreateMaterialModal: () => void;
  openCreateMechanismModal: (subsystemId?: string) => void;
  openCreatePartInstanceModal: (mechanism: BootstrapPayload["mechanisms"][number]) => void;
  openCreateSubsystemModal: () => void;
  openCreatePartDefinitionModal: () => void;
  openCreatePurchaseModal: () => void;
  openCreateTaskModal: () => void;
  openCreateTaskModalFromTimeline: () => void;
  openCreateWorkLogModal: () => void;
  openCreateQaReportModal: () => void;
  openCreateEventReportModal: () => void;
  openCreateWorkstreamModal: () => void;
  openEditWorkstreamModal: (workstream: BootstrapPayload["workstreams"][number]) => void;
  onCreateRisk: (payload: RiskPayload) => Promise<void>;
  onDeleteRisk: (riskId: string) => Promise<void>;
  onCncQuickStatusChange: (
    item: ManufacturingItemRecord,
    status: ManufacturingItemRecord["status"],
  ) => Promise<void>;
  openEditManufacturingModal: (item: ManufacturingItemRecord) => void;
  openEditArtifactModal: (artifact: ArtifactRecord) => void;
  openEditMaterialModal: (item: MaterialRecord) => void;
  openEditMechanismModal: (mechanism: BootstrapPayload["mechanisms"][number]) => void;
  openEditPartInstanceModal: (partInstance: BootstrapPayload["partInstances"][number]) => void;
  openEditSubsystemModal: (subsystem: BootstrapPayload["subsystems"][number]) => void;
  openEditPartDefinitionModal: (item: PartDefinitionRecord) => void;
  openEditPurchaseModal: (item: PurchaseItemRecord) => void;
  openTimelineTaskDetailsModal: (task: TaskRecord) => void;
  onUpdateRisk: (riskId: string, payload: RiskPayload) => Promise<void>;
  partDefinitionsById: Record<string, BootstrapPayload["partDefinitions"][number]>;
  printItems: ManufacturingItemRecord[];
  rosterMentors: BootstrapPayload["members"];
  showCncMentorQuickActions: boolean;
  manufacturingView: ManufacturingViewTab;
  inventoryView: InventoryViewTab;
  riskManagementView: RiskManagementViewTab;
  reportsView: ReportsViewTab;
  taskView: TaskViewTab;
  worklogsView: WorklogsViewTab;
  selectMember: (id: string | null, payload: BootstrapPayload) => void;
  selectedSeasonId: string | null;
  selectedMemberId: string | null;
  selectedProject: BootstrapPayload["projects"][number] | null;
  requestMemberPhotoUpload: (file: File) => Promise<string>;
  setActivePersonFilter: (value: FilterSelection) => void;
  setIsAddPersonOpen: (open: boolean) => void;
  setIsEditPersonOpen: (open: boolean) => void;
  setMemberEditDraft: Dispatch<SetStateAction<MemberPayload | null>>;
  setMemberForm: Dispatch<SetStateAction<MemberPayload>>;
  students: BootstrapPayload["members"];
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>;
  timelineMilestoneCreateSignal: number;
  disablePanelAnimations?: boolean;
  onStartInteractiveTutorial?: () => void;
  onStartInteractiveTutorialChapter?: (chapterId: string) => void;
  interactiveTutorialChapters?: Array<{
    id: string;
    title: string;
    summary: string;
    completed?: boolean;
  }>;
  isInteractiveTutorialActive?: boolean;
  onDismissDataMessage: () => void;
  onDismissTaskEditNotice: () => void;
  dataMessage: string | null;
  taskEditNotice: string | null;
}

export function WorkspaceContentPanels({
  activeTab,
  inventoryView,
  isNonRobotProject,
  manufacturingView,
  reportsView,
  taskView,
  ...props
}: WorkspaceContentPanelsProps) {
  const effectiveInventoryView =
    isNonRobotProject && inventoryView === "parts" ? "materials" : inventoryView;
  const previousTaskViewRef = useRef(taskView);
  const previousReportsViewRef = useRef(reportsView);
  const previousManufacturingViewRef = useRef(manufacturingView);
  const previousInventoryViewRef = useRef(effectiveInventoryView);

  const taskSwipeDirection = getSwipeDirection(previousTaskViewRef.current, taskView, [
    "timeline",
    "queue",
    "milestones",
  ]);
  const reportsSwipeDirection = getSwipeDirection(previousReportsViewRef.current, reportsView, [
    "qa",
    "event-results",
  ]);
  const manufacturingSwipeDirection = getSwipeDirection(
    previousManufacturingViewRef.current,
    manufacturingView,
    ["cnc", "prints", "fabrication"],
  );
  const inventorySwipeDirection = getSwipeDirection(
    previousInventoryViewRef.current,
    effectiveInventoryView,
    ["materials", "parts", "purchases"],
  );

  useEffect(() => {
    previousTaskViewRef.current = taskView;
  }, [taskView]);
  useEffect(() => {
    previousReportsViewRef.current = reportsView;
  }, [reportsView]);
  useEffect(() => {
    previousManufacturingViewRef.current = manufacturingView;
  }, [manufacturingView]);
  useEffect(() => {
    previousInventoryViewRef.current = effectiveInventoryView;
  }, [effectiveInventoryView]);

  return (
    <WorkspaceContentPanelsView
      {...props}
      activeTab={activeTab}
      effectiveInventoryView={effectiveInventoryView}
      inventorySwipeDirection={inventorySwipeDirection}
      manufacturingSwipeDirection={manufacturingSwipeDirection}
      reportsSwipeDirection={reportsSwipeDirection}
      taskSwipeDirection={taskSwipeDirection}
      taskView={taskView}
      manufacturingView={manufacturingView}
      reportsView={reportsView}
      inventoryView={inventoryView}
      isNonRobotProject={isNonRobotProject}
    />
  );
}
