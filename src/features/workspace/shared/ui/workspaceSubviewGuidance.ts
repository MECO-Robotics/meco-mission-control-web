import type {
  InventoryViewTab,
  ManufacturingViewTab,
  TaskViewTab,
  WorklogsViewTab,
} from "@/lib/workspaceNavigation";

export type WorkspaceSubviewTab =
  | TaskViewTab
  | WorklogsViewTab
  | ManufacturingViewTab
  | InventoryViewTab
  | "documents"
  | "reports"
  | "subsystems"
  | "workflow"
  | "risk-management"
  | "roster"
  | "help";

export const SUBVIEW_INTERACTION_GUIDANCE: Record<WorkspaceSubviewTab, string> = {
  timeline:
    "Use the person and date-range filters above to focus the schedule, click a date number to add or edit milestones for that day, collapse or expand subsystem rows with the arrows, click a task row to highlight it, and click the task label or bar to open details.",
  milestones:
    "Use search and filters to narrow milestones, click a row to edit details, and use Add to create new milestone milestones tied to relevant subsystems when needed.",
  queue:
    "Use search and filters to narrow the list, click a column header to sort, and hover any row to reveal the pencil cue before clicking the row to open its task details. Use Add to create a new task.",
  logs:
    "Search the log entries, filter by subsystem, add new work logs from the toolbar, and click a row to open the linked task details. The selected roster person stays in sync with the global workspace filter.",
  summary:
    "Use this dashboard to review total work-log volume, compare planned hours versus logged hours, and spot top contributors and most active tasks at a glance.",
  reports:
    "Use this page to launch QA and Milestone Result forms. Pick the report type you need, then open the matching modal to capture the task review or milestone findings.",
  cnc:
    "Search and filter CNC jobs by subsystem, requester, material, or status, then hover a row to reveal the pencil cue before clicking the row to update that job. Use Add to enter a new CNC request tied to a catalog part.",
  prints:
    "Search and filter 3D print jobs by subsystem, requester, material, or status, then hover a row to reveal the pencil cue before clicking the row to update that job. Use Add to enter a new print request tied to a catalog part.",
  fabrication:
    "Search and filter fabrication jobs by subsystem, requester, material, or status, then hover a row to reveal the pencil cue before clicking the row to update that job. Use Add to enter a new freeform fabrication request.",
  materials:
    "Use the search and stock filters to find inventory quickly, then hover a row to reveal the pencil cue before clicking the row to update quantities, vendors, locations, or notes. Use Add to track a new material.",
  documents:
    "Use search to find project artifacts quickly, hover a row to reveal the pencil cue, and click the row to update linked document details.",
  parts:
    "Search and filter the catalog from the toolbar, hover a part definition to reveal the pencil cue, and click the row to edit it. Use the edit modal to update or delete the part definition. Review matching part instances below for subsystem and mechanism ownership.",
  purchases:
    "Search or filter requests by subsystem, requester, status, vendor, or approval, then hover a row to reveal the pencil cue before clicking the row to review or update it. Use Add to log a new request against a real part from the Parts tab.",
  subsystems:
    "Search and filter subsystem ownership and mechanism coverage, click a subsystem row to expand its mechanisms underneath, hover the pencil on the right to edit the subsystem, and use the add controls to create or update subsystems, mechanisms, and mechanism-owned part instances.",
  workflow:
    "Search and filter workflow ownership, click a row to expand details, and use add or edit controls to keep non-technical workstreams current.",
  "risk-management":
    "Use the top-bar subtabs to switch between Risks and Metrics. In Risks, search and filter to triage records, click a row to edit details or mitigation ownership, and use Add to log a new risk with a real source and attachment target.",
  roster:
    "Use the plus buttons to add people to each group, click a name to select them, and hover a member to reveal the pencil affordance for editing or deleting them from the popup.",
  help:
    "Use this page as a quick reference for how to navigate tabs, manage scoped project data, and follow the common add/edit workflows used across the workspace.",
};
