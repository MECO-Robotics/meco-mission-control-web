import type { InteractiveTutorialStep, InteractiveTutorialStepId } from "../interactiveTutorialTypes";

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

export function isInteractiveTutorialDropdownStep(step: InteractiveTutorialStep | null) {
  return Boolean(step && DROPDOWN_STEP_IDS.has(step.id));
}

export function isInteractiveTutorialSearchStep(step: InteractiveTutorialStep | null) {
  return Boolean(step && SEARCH_STEP_IDS.has(step.id));
}

export function isInteractiveTutorialCreationStep(step: InteractiveTutorialStep | null) {
  return Boolean(step && CREATION_STEP_IDS.has(step.id));
}
