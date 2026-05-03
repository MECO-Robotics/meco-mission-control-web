import type {
  InteractiveTutorialChapter,
  InteractiveTutorialStep,
} from "@/app/interactiveTutorial/interactiveTutorialTypes";

const planningSteps = [
  {
    id: "season",
    title: "Select the fake tutorial season",
    instruction: "Use the season dropdown and choose the fake tutorial season.",
    selector: '[data-tutorial-target="season-select"]',
  },
  {
    id: "project-robot",
    title: "Select the tutorial robot project",
    instruction: "Use the project dropdown and select Tutorial Robot 2026.",
    selector: '[data-tutorial-target="project-select"]',
  },
  {
    id: "tasks-tab",
    title: "Open Tasks",
    instruction: "Open the Tasks page from the sidebar.",
    selector: '[data-tutorial-target="sidebar-tab-tasks"]',
  },
  {
    id: "task-timeline",
    title: "Switch to Timeline",
    instruction: "In Tasks, switch to Timeline.",
    selector: '[data-tutorial-target="task-view-timeline"]',
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
    instruction: "Switch the Tasks subtab from Timeline to Kanban.",
    selector: '[data-tutorial-target="task-view-queue"]',
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
    selector: '[data-tutorial-target="task-queue-filter-control"]',
  },
  {
    id: "queue-edit-task",
    title: "Edit a Kanban task",
    instruction: "Click any task row in Kanban to open edit mode.",
    selector: '[data-tutorial-target="edit-task-row"]',
  },
  {
    id: "task-milestones",
    title: "Switch to Milestones",
    instruction: "Switch the Tasks subtab to Milestones.",
    selector: '[data-tutorial-target="task-view-milestones"]',
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
    title: "Edit a milestone",
    instruction: "Click a milestone row to open the edit modal.",
    selector: '[data-tutorial-target="edit-milestone-row"]',
  },
  {
    id: "worklogs-tab",
    title: "Open Work logs",
    instruction: "Open Work logs from the sidebar.",
    selector: '[data-tutorial-target="sidebar-tab-worklogs"]',
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
