import type {
  InteractiveTutorialChapter,
  InteractiveTutorialStep,
} from "@/app/interactiveTutorial/interactiveTutorialTypes";

const planningSteps = [
  {
    id: "season",
    title: "Select the fake tutorial season",
    instruction: "Open the project / season selector, choose Season, then select Tutorial Season.",
    selector: '.sidebar-scope-trigger',
  },
  {
    id: "project-robot",
    title: "Select the tutorial robot project",
    instruction: "Open the project / season selector, choose Project, then select Tutorial Robot 2026.",
    selector: '.sidebar-scope-trigger',
  },
  {
    id: "tasks-tab",
    title: "Open Tasks",
    instruction: "Open Work from the navigation.",
    selector: '[data-tutorial-target="sidebar-tab-work"]',
  },
  {
    id: "task-timeline",
    title: "Switch to Timeline",
    instruction: "Choose Schedule from the view selector, then choose Timeline.",
    selector: '[aria-label="View"]',
  },
  {
    id: "timeline-week-view",
    title: "Switch month to week",
    instruction: "Change the timeline interval to Week.",
    selector: '[data-tutorial-target="timeline-interval-select"]',
  },
  {
    id: "timeline-shift-period",
    title: "Move to a different period",
    instruction: "Use the highlighted period button once.",
    selector: '[data-tutorial-target="timeline-period-next-button"]',
  },
  {
    id: "timeline-open-task",
    title: "Open a timeline task",
    instruction: "Click a task bar or task label on the timeline.",
    selector: '[data-tutorial-target="timeline-task-bar"]',
  },
  {
    id: "timeline-edit-task",
    title: "Edit the selected timeline task",
    instruction: "From the task details popup, click Edit task.",
    selector: '[data-tutorial-target="timeline-edit-task-button"]',
  },
  {
    id: "task-queue",
    title: "Switch to Kanban",
    instruction: "Choose Tasks from the view selector.",
    selector: '[aria-label="View"]',
  },
  {
    id: "create-task",
    title: "Create a task",
    instruction: "Use Add and save one new task.",
    selector: '[data-tutorial-target="create-task-button"]',
  },
  {
    id: "queue-filter",
    title: "Use Kanban filters",
    instruction: "Apply at least one Kanban filter.",
    selector: '.task-queue-toolbar',
  },
  {
    id: "queue-edit-task",
    title: "Edit a Kanban task",
    instruction: "Click any task row in Kanban to open edit mode.",
    selector: '[data-tutorial-target="edit-task-row"]',
  },
  {
    id: "readiness-tab",
    title: "Open Work",
    instruction: "Open Work from the navigation.",
    selector: '[data-tutorial-target="sidebar-tab-work"]',
  },
  {
    id: "task-milestones",
    title: "Switch to Agenda",
    instruction: "Choose Schedule from the view selector, then Agenda.",
    selector: '[aria-label="View"]',
  },
  {
    id: "create-milestone",
    title: "Create a milestone",
    instruction: "Use Add and save one new milestone.",
    selector: '[data-tutorial-target="create-milestone-button"]',
  },
  {
    id: "milestone-search",
    title: "Search milestones",
    instruction: "Type in the milestone search box.",
    selector: '[data-tutorial-target="milestone-search-input"]',
  },
  {
    id: "milestone-edit",
    title: "Open milestone details",
    instruction: "Click a milestone row to open the details popup.",
    selector: '[data-tutorial-target="edit-milestone-row"]',
  },
  {
    id: "worklogs-tab",
    title: "Open Work logs",
    instruction: "Open Work from the navigation.",
    selector: '[data-tutorial-target="sidebar-tab-work"]',
  },
  {
    id: "reports-worklogs",
    title: "Open Work logs",
    instruction: "Choose Activity from the view selector, then Work logs.",
    selector: '[aria-label="View"]',
  },
  {
    id: "create-worklog",
    title: "Create a work log on a task",
    instruction: "Use Add and save one work log tied to a task.",
    selector: '[data-tutorial-target="create-worklog-button"]',
  },
] satisfies InteractiveTutorialStep[];

export const planningChapter = {
  id: "planning",
  title: "Chapter 1: Tasks and Timeline",
  summary: "Fake season scope, task workflow, milestones, and work logs.",
  preferredProjectType: "robot",
  steps: planningSteps,
} satisfies InteractiveTutorialChapter;
