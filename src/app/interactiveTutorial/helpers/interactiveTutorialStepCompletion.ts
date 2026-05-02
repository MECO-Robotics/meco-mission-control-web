import type {
  InteractiveTutorialCreationCounts,
  InteractiveTutorialStep,
  InteractiveTutorialStepCompletionContext,
  InteractiveTutorialStepId,
} from "../interactiveTutorialTypes";

import { getInteractiveTutorialCreationCounts } from "./interactiveTutorialCreationCounts";
import {
  isInteractiveTutorialCreationStep,
  isInteractiveTutorialDropdownStep,
} from "./interactiveTutorialStepGroups";

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
      target.parentElement?.querySelector<HTMLElement>(".timeline-period-label")?.textContent?.trim() ?? "";
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
