type InteractiveTutorialChapterId = "planning" | "operations" | "outreach";

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

interface InteractiveTutorialChapter {
  id: InteractiveTutorialChapterId;
  title: string;
  summary: string;
  preferredProjectType: "robot" | "outreach";
  steps: InteractiveTutorialStep[];
}

const planningSteps: InteractiveTutorialStep[] = [
  {
    id: "season",
    title: "Select the fake tutorial season",
    instruction: "Use the season dropdown and choose Tutorial season (fake sandbox).",
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
];

const operationsSteps: InteractiveTutorialStep[] = [
  {
    id: "roster-tab",
    title: "Open Roster",
    instruction: "Open the Roster page from the sidebar.",
    selector: '[data-tutorial-target="sidebar-tab-roster"]',
  },
  {
    id: "create-student",
    title: "Add a student",
    instruction: "In Students, click + and save a new student.",
    selector: '[data-tutorial-target="create-student-button"]',
  },
  {
    id: "inventory-tab",
    title: "Open Inventory",
    instruction: "Open Inventory from the sidebar.",
    selector: '[data-tutorial-target="sidebar-tab-inventory"]',
  },
  {
    id: "inventory-materials",
    title: "Open Materials",
    instruction: "Switch Inventory to the Materials subtab.",
    selector: '[data-tutorial-target="inventory-view-materials"]',
  },
  {
    id: "create-material",
    title: "Add material",
    instruction: "Use Add and save one material.",
    selector: '[data-tutorial-target="create-material-button"]',
  },
  {
    id: "material-filter",
    title: "Filter materials",
    instruction: "Apply at least one material filter.",
    selector: '[data-tutorial-target="materials-filter-control"]',
  },
  {
    id: "material-edit",
    title: "Edit a material",
    instruction: "Click any material row to open edit mode.",
    selector: '[data-tutorial-target="edit-material-row"]',
  },
  {
    id: "inventory-parts",
    title: "Open Parts",
    instruction: "Switch Inventory to the Parts subtab.",
    selector: '[data-tutorial-target="inventory-view-parts"]',
  },
  {
    id: "create-part",
    title: "Add part definition",
    instruction: "Use Add and save one part definition.",
    selector: '[data-tutorial-target="create-part-button"]',
  },
  {
    id: "part-search",
    title: "Search parts",
    instruction: "Type in the parts search box.",
    selector: '[data-tutorial-target="parts-search-input"]',
  },
  {
    id: "inventory-purchases",
    title: "Open Purchases",
    instruction: "Switch Inventory to the Purchases subtab.",
    selector: '[data-tutorial-target="inventory-view-purchases"]',
  },
  {
    id: "create-purchase",
    title: "Add purchase request",
    instruction: "Use Add and save one purchase request.",
    selector: '[data-tutorial-target="create-purchase-button"]',
  },
  {
    id: "purchase-sort",
    title: "Sort or filter purchases",
    instruction: "Use the Purchases status control.",
    selector: '[data-tutorial-target="purchases-sort-control"]',
  },
  {
    id: "workflow-tab",
    title: "Open Subsystems",
    instruction: "Open Workflow/Subsystems from the sidebar.",
    selector: '[data-tutorial-target="sidebar-tab-subsystems"]',
  },
  {
    id: "create-subsystem",
    title: "Create a subsystem",
    instruction: "Use Add subsystem and save it.",
    selector: '[data-tutorial-target="create-subsystem-button"]',
  },
  {
    id: "edit-subsystem",
    title: "Edit a subsystem",
    instruction: "Click the subsystem edit icon.",
    selector: '[data-tutorial-target="edit-subsystem-button"]',
  },
  {
    id: "create-mechanism",
    title: "Add a mechanism",
    instruction: "Use Add mechanism and save it.",
    selector: '[data-tutorial-target="create-mechanism-button"]',
  },
  {
    id: "edit-mechanism",
    title: "Edit a mechanism",
    instruction: "Click a mechanism edit icon.",
    selector: '[data-tutorial-target="edit-mechanism-button"]',
  },
  {
    id: "add-part-to-mechanism",
    title: "Add a part to a mechanism",
    instruction: "Use the Add part button on a mechanism and save it.",
    selector: '[data-tutorial-target="add-part-to-mechanism-button"]',
  },
  {
    id: "manufacturing-tab",
    title: "Open Manufacturing",
    instruction: "Open Manufacturing from the sidebar.",
    selector: '[data-tutorial-target="sidebar-tab-manufacturing"]',
  },
  {
    id: "manufacturing-cnc",
    title: "Open CNC queue",
    instruction: "Switch Manufacturing to CNC.",
    selector: '[data-tutorial-target="manufacturing-view-cnc"]',
  },
  {
    id: "create-cnc-job",
    title: "Add CNC job",
    instruction: "Use Add and save one CNC job.",
    selector: '[data-tutorial-target="cnc-create-job-button"]',
  },
  {
    id: "inspect-cnc-job",
    title: "Inspect a CNC job",
    instruction: "Click any CNC row to open the job editor.",
    selector: '[data-tutorial-target="cnc-edit-job-row"]',
  },
  {
    id: "manufacturing-prints",
    title: "Open 3D print queue",
    instruction: "Switch Manufacturing to 3D print.",
    selector: '[data-tutorial-target="manufacturing-view-prints"]',
  },
  {
    id: "create-print-job",
    title: "Add 3D print job",
    instruction: "Use Add and save one 3D print job.",
    selector: '[data-tutorial-target="prints-create-job-button"]',
  },
  {
    id: "complete-print-job",
    title: "Complete a 3D print job",
    instruction: "Open a print job and save it with Complete status.",
    selector: '[data-tutorial-target="prints-edit-job-row"]',
  },
  {
    id: "manufacturing-search",
    title: "Search manufacturing queue",
    instruction: "Use the search box in the 3D print queue.",
    selector: '[data-tutorial-target="prints-search-input"]',
  },
  {
    id: "manufacturing-fabrication",
    title: "Open fabrication queue",
    instruction: "Switch Manufacturing to Fabrication.",
    selector: '[data-tutorial-target="manufacturing-view-fabrication"]',
  },
  {
    id: "create-fabrication-job",
    title: "Add fabrication job",
    instruction: "Use Add and save one fabrication job.",
    selector: '[data-tutorial-target="fabrication-create-job-button"]',
  },
  {
    id: "inspect-fabrication-job",
    title: "Inspect a fabrication job",
    instruction: "Click any fabrication row to open the job editor.",
    selector: '[data-tutorial-target="fabrication-edit-job-row"]',
  },
];

const outreachSteps: InteractiveTutorialStep[] = [
  {
    id: "project-outreach",
    title: "Switch project to Outreach",
    instruction: "Use the project dropdown and switch to Outreach.",
    selector: '[data-tutorial-target="project-select"]',
  },
  {
    id: "workflow-tab",
    title: "Open Workflow",
    instruction: "Open Workflow from the sidebar in Outreach mode.",
    selector: '[data-tutorial-target="sidebar-tab-subsystems"]',
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
    selector: '[data-tutorial-target="inventory-view-materials"]',
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
    selector: '[data-tutorial-target="sidebar-tab-help"]',
  },
];

export const INTERACTIVE_TUTORIAL_CHAPTERS: InteractiveTutorialChapter[] = [
  {
    id: "planning",
    title: "Chapter 1: Tasks and Timeline",
    summary: "Fake season scope, task workflow, milestones, and work logs.",
    preferredProjectType: "robot",
    steps: planningSteps,
  },
  {
    id: "operations",
    title: "Chapter 2: Build Operations",
    summary: "Roster, Inventory, Subsystems, and Manufacturing end-to-end.",
    preferredProjectType: "robot",
    steps: operationsSteps,
  },
  {
    id: "outreach",
    title: "Chapter 3: Outreach Workflow",
    summary: "Switch to Outreach, edit workflow, and add a document.",
    preferredProjectType: "outreach",
    steps: outreachSteps,
  },
];
