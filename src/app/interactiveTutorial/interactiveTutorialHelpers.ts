import type { BootstrapPayload } from "@/types";

import { isMemberActiveInSeason } from "@/lib/appUtils";
import type {
  InteractiveTutorialCreationCounts,
  InteractiveTutorialStep,
  InteractiveTutorialStepCompletionContext,
  InteractiveTutorialStepId,
} from "./interactiveTutorialTypes";

const DROPDOWN_STEP_IDS = new Set<InteractiveTutorialStepId>([
  "season",
  "project-robot",
  "project-outreach",
]);

const SEARCH_STEP_IDS = new Set<InteractiveTutorialStepId>([
  "part-search",
  "milestone-search",
  "manufacturing-search",
]);

const CREATION_STEP_IDS = new Set<InteractiveTutorialStepId>([
  "create-task",
  "create-worklog",
  "create-material",
  "create-part",
  "create-purchase",
  "create-milestone",
  "create-subsystem",
  "create-mechanism",
  "add-part-to-mechanism",
  "create-student",
  "create-cnc-job",
  "create-print-job",
  "complete-print-job",
  "create-fabrication-job",
  "create-document",
]);

const CREATION_COUNT_KEY_BY_STEP_ID: Partial<Record<InteractiveTutorialStepId, keyof InteractiveTutorialCreationCounts>> =
  {
    "create-task": "tasks",
    "create-worklog": "workLogs",
    "create-material": "materials",
    "create-part": "partDefinitions",
    "create-purchase": "purchaseItems",
    "create-milestone": "milestones",
    "create-subsystem": "subsystems",
    "create-mechanism": "mechanisms",
    "add-part-to-mechanism": "partInstances",
    "create-student": "students",
    "create-cnc-job": "cncJobs",
    "create-print-job": "printJobs",
    "complete-print-job": "completedPrintJobs",
    "create-fabrication-job": "fabricationJobs",
    "create-document": "documents",
  };

export function isInteractiveTutorialDropdownStep(step: InteractiveTutorialStep | null) {
  return Boolean(step && DROPDOWN_STEP_IDS.has(step.id));
}

export function isInteractiveTutorialSearchStep(step: InteractiveTutorialStep | null) {
  return Boolean(step && SEARCH_STEP_IDS.has(step.id));
}

export function isInteractiveTutorialCreationStep(step: InteractiveTutorialStep | null) {
  return Boolean(step && CREATION_STEP_IDS.has(step.id));
}

export function getInteractiveTutorialCreationCounts(
  payload: BootstrapPayload,
  tutorialProjectId: string | null,
  tutorialSeasonId: string | null,
): InteractiveTutorialCreationCounts {
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
        (member) => member.role === "student" && isMemberActiveInSeason(member, tutorialSeasonId),
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
}

export function isInteractiveTutorialCreateStepModalInteraction(
  step: InteractiveTutorialStep,
  node: Node,
) {
  if (!isInteractiveTutorialCreationStep(step)) {
    return false;
  }

  const element = node instanceof Element ? node : node.parentElement;
  return Boolean(element?.closest(".modal-card"));
}

export function hasInteractiveTutorialAlternativeOption(
  step: InteractiveTutorialStep,
  target: HTMLSelectElement,
  expectedValue: string | null,
) {
  if (!expectedValue || !isInteractiveTutorialDropdownStep(step)) {
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
}

export function isInteractiveTutorialStepComplete(
  step: InteractiveTutorialStep,
  context: InteractiveTutorialStepCompletionContext,
) {
  if (isInteractiveTutorialCreationStep(step)) {
    if (!context.baselineCounts) {
      return false;
    }

    const currentCounts = getInteractiveTutorialCreationCounts(
      context.bootstrap,
      context.tutorialProjectId,
      context.tutorialSeasonId,
    );
    const key = CREATION_COUNT_KEY_BY_STEP_ID[step.id];
    return key ? currentCounts[key] > context.baselineCounts[key] : false;
  }

  const target = document.querySelector<HTMLElement>(step.selector);
  if (!target) {
    return false;
  }

  if (step.id === "season") {
    return (
      target instanceof HTMLSelectElement &&
      typeof context.tutorialSeasonId === "string" &&
      target.value === context.tutorialSeasonId
    );
  }

  if (step.id === "project-robot" || step.id === "project-outreach") {
    return (
      target instanceof HTMLSelectElement &&
      typeof context.tutorialProjectId === "string" &&
      target.value === context.tutorialProjectId
    );
  }

  if (step.id === "timeline-week-view") {
    return target instanceof HTMLSelectElement && target.value === "week";
  }

  if (step.id === "timeline-shift-period") {
    const currentLabel =
      target.parentElement?.querySelector<HTMLElement>(".timeline-period-label")?.textContent?.trim() ??
      "";
    if (currentLabel.length === 0) {
      return false;
    }
    return currentLabel !== context.stepBaselineLabel;
  }

  if (step.id === "timeline-open-task") {
    return context.activeTimelineTaskDetailId !== null;
  }

  if (step.id === "timeline-edit-task" || step.id === "queue-edit-task") {
    return context.taskModalMode === "edit" && context.activeTaskId !== null;
  }

  if (step.id === "queue-filter" || step.id === "material-filter" || step.id === "purchase-sort") {
    return Boolean(target.querySelector(".toolbar-filter-dropdown.is-active"));
  }

  if (step.id === "part-search" || step.id === "milestone-search" || step.id === "manufacturing-search") {
    const input =
      target.querySelector<HTMLInputElement>("input[type='text']") ??
      target.querySelector<HTMLInputElement>("input");
    return Boolean(input?.value.trim());
  }

  if (step.id === "milestone-edit") {
    return Boolean(document.querySelector('[data-tutorial-target="milestone-edit-modal"]'));
  }

  if (step.id === "material-edit") {
    return context.materialModalMode === "edit" && context.activeMaterialId !== null;
  }

  if (step.id === "edit-subsystem") {
    return context.subsystemModalMode === "edit" && context.activeSubsystemId !== null;
  }

  if (step.id === "edit-mechanism") {
    return context.mechanismModalMode === "edit" && context.activeMechanismId !== null;
  }

  if (step.id === "inspect-cnc-job" || step.id === "inspect-fabrication-job") {
    return context.manufacturingModalMode === "edit" && context.activeManufacturingId !== null;
  }

  if (step.id === "workflow-edit") {
    return context.workstreamModalMode === "edit" && context.activeWorkstreamId !== null;
  }

  return target.getAttribute("data-active") === "true";
}

export function getInteractiveTutorialStepError(
  step: InteractiveTutorialStep,
  context: {
    tutorialSeasonId: string | null;
    tutorialProjectId: string | null;
    tutorialSeasonName: string | null;
    tutorialProjectName: string | null;
  },
) {
  switch (step.id) {
    case "season":
      if (!context.tutorialSeasonId) {
        return "Tutorial season is unavailable. End tutorial and reload the page.";
      }
      return `Select ${context.tutorialSeasonName ?? "Tutorial season"} to complete this step.`;
    case "project-robot":
    case "project-outreach":
      if (!context.tutorialProjectId) {
        return "Tutorial project is unavailable. End tutorial and reload the page.";
      }
      return `Select ${context.tutorialProjectName ?? "the tutorial project"} to continue.`;
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
      return "Apply at least one Kanban filter to continue.";
    case "queue-edit-task":
      return "Open any Kanban task row in edit mode to continue.";
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
      return "Add a part instance to the mechanism to continue.";
    case "create-student":
      return "Create and save one student to continue.";
    case "create-cnc-job":
      return "Create and save one CNC job to continue.";
    case "inspect-cnc-job":
      return "Open a CNC job in edit mode to continue.";
    case "create-print-job":
      return "Create and save one 3D print job to continue.";
    case "complete-print-job":
      return "Mark one 3D print job complete to continue.";
    case "manufacturing-search":
      return "Type in the manufacturing search input to continue.";
    case "create-fabrication-job":
      return "Create and save one fabrication job to continue.";
    case "inspect-fabrication-job":
      return "Open a fabrication job in edit mode to continue.";
    case "workflow-edit":
      return "Open workflow edit mode to continue.";
    case "create-document":
      return "Create and save one document to continue.";
    default:
      return targetCopyForStep(step.id);
  }
}

function targetCopyForStep(stepId: InteractiveTutorialStepId) {
  if (stepId === "tasks-tab" || stepId === "task-timeline" || stepId === "task-queue" || stepId === "task-milestones") {
    return "Use the highlighted control to continue.";
  }
  return "Use the highlighted control to continue.";
}
