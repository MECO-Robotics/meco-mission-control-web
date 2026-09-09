import type {
  InteractiveTutorialChapter,
  InteractiveTutorialStep,
} from "@/app/interactiveTutorial/interactiveTutorialTypes";

const outreachSteps = [
  {
    id: "project-outreach",
    title: "Switch project to Outreach",
    instruction: "Open the project / season selector, choose Project, then select the tutorial Outreach project.",
    selector: '.sidebar-scope-trigger',
  },
  {
    id: "workflow-tab",
    title: "Open Workflow",
    instruction: "Open Readiness from the sidebar in Outreach mode.",
    selector: '[data-tutorial-target="sidebar-tab-readiness"]',
  },
  {
    id: "outreach-workflow-view",
    title: "Open Workflow",
    instruction: "Choose Subsystems to view the outreach workflow.",
    selector: '[data-tutorial-target="readiness-view-readiness-subsystems"]',
  },
  {
    id: "workflow-edit",
    title: "Edit a workflow row",
    instruction: "Click a workflow row to open the edit modal.",
    selector: '[data-tutorial-target="edit-workflow-row"]',
  },
  {
    id: "inventory-tab",
    title: "Open Inventory",
    instruction: "Open Inventory from the sidebar.",
    selector: '[data-tutorial-target="sidebar-tab-inventory"]',
  },
  {
    id: "inventory-materials",
    title: "Open Documents",
    instruction: "Switch Inventory to Documents.",
    selector: '[data-tutorial-target="inventory-view-inventory-materials"]',
  },
  {
    id: "create-document",
    title: "Add a dummy document",
    instruction: "Use Add and save one document artifact.",
    selector: '[data-tutorial-target="create-document-button"]',
  },
  {
    id: "help-tab",
    title: "Finish on Help",
    instruction: "Open Help to complete the tutorial.",
    selector: 'button[aria-label="Help"]',
  },
] satisfies InteractiveTutorialStep[];

export const outreachChapter = {
  id: "outreach",
  title: "Chapter 3: Outreach Workflow",
  summary: "Switch to Outreach, edit workflow, and add a document.",
  preferredProjectType: "outreach",
  steps: outreachSteps,
} satisfies InteractiveTutorialChapter;
