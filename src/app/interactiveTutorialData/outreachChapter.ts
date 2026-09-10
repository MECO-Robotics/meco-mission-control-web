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
    instruction: "Open Resources from the navigation.",
    selector: '[data-tutorial-target="sidebar-tab-resources"]',
  },
  {
    id: "outreach-workflow-view",
    title: "Open Workflow",
    instruction: "Choose Structure to view the outreach workflow.",
    selector: '[aria-label="View"]',
  },
  {
    id: "workflow-edit",
    title: "Edit a workflow row",
    instruction: "Click a workflow row to open the edit modal.",
    selector: '[data-tutorial-target="edit-workflow-row"]',
  },
  {
    id: "inventory-tab",
    title: "Open Resources",
    instruction: "Open Resources from the sidebar.",
    selector: '[data-tutorial-target="sidebar-tab-resources"]',
  },
  {
    id: "inventory-materials",
    title: "Open Documents",
    instruction: "Choose Documents from the view selector.",
    selector: '[aria-label="View"]',
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
