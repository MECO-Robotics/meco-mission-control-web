import type { BootstrapPayload } from "@/types/bootstrap";
import type {
  InventoryViewTab,
  ManufacturingViewTab,
  ReportsViewTab,
  RiskManagementViewTab,
  TaskViewTab,
  ViewTab,
  WorklogsViewTab,
} from "@/lib/workspaceNavigation";

export type InteractiveTutorialChapterId = "planning" | "operations" | "outreach";

export type InteractiveTutorialStepId =
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

export interface InteractiveTutorialStep {
  id: InteractiveTutorialStepId;
  title: string;
  instruction: string;
  selector: string;
}

export interface InteractiveTutorialChapter {
  id: InteractiveTutorialChapterId;
  title: string;
  summary: string;
  preferredProjectType: "robot" | "outreach";
  steps: InteractiveTutorialStep[];
}

export interface InteractiveTutorialReturnState {
  activeTab: ViewTab;
  taskView: TaskViewTab;
  riskManagementView: RiskManagementViewTab;
  worklogsView: WorklogsViewTab;
  reportsView: ReportsViewTab;
  manufacturingView: ManufacturingViewTab;
  inventoryView: InventoryViewTab;
  selectedSeasonId: string | null;
  selectedProjectId: string | null;
}

export interface InteractiveTutorialCreationCounts {
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

export interface InteractiveTutorialChapterOption {
  id: string;
  title: string;
  summary: string;
  completed?: boolean;
}

export interface InteractiveTutorialOverlayProps {
  chapterTitle: string;
  completedChapterTitle: string;
  currentStep: InteractiveTutorialStep | null;
  hasNextChapter: boolean;
  isCreationStep: boolean;
  isTargetReady: boolean;
  onClose: () => void;
  onContinue: () => void;
  projectName: string | null;
  seasonName: string | null;
  spotlightRect:
    | {
        top: number;
        left: number;
        width: number;
        height: number;
      }
    | null;
  stepCount: number;
  stepError: string | null;
  stepNumber: number;
}

export interface InteractiveTutorialStepCompletionContext {
  bootstrap: BootstrapPayload;
  tutorialProjectId: string | null;
  tutorialSeasonId: string | null;
  baselineCounts: InteractiveTutorialCreationCounts | null;
  activeTimelineTaskDetailId: string | null;
  taskModalMode: "create" | "edit" | null;
  activeTaskId: string | null;
  materialModalMode: "create" | "edit" | null;
  activeMaterialId: string | null;
  subsystemModalMode: "create" | "edit" | null;
  activeSubsystemId: string | null;
  mechanismModalMode: "create" | "edit" | null;
  activeMechanismId: string | null;
  manufacturingModalMode: "create" | "edit" | null;
  activeManufacturingId: string | null;
  workstreamModalMode: "create" | "edit" | null;
  activeWorkstreamId: string | null;
  stepBaselineLabel: string | null;
}
