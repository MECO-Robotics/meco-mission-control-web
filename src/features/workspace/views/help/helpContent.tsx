import { type ReactNode } from "react";

export interface HelpSection {
  title: string;
  items: string[];
}

export interface HelpTutorialStep {
  title: string;
  summary: string;
  actions: string[];
  cue: string;
}

export interface InteractiveTutorialChapter {
  id: string;
  title: string;
  summary: string;
  completed?: boolean;
}

export const HELP_SECTIONS: HelpSection[] = [
  {
    title: "Start with scope",
    items: [
      "Before editing anything, check the **season selector** in the profile menu and the **active project** in the sidebar.",
      "Pick **All projects** only for planning sweeps; switch back to a single project before data entry.",
      "If a list looks empty, first confirm you are in the expected **season and project scope**.",
      "Timeline, Kanban, and Milestones are **project-aware**, so scope mistakes show up there first.",
    ],
  },
  {
    title: "Know what each tab is for",
    items: [
      "Tasks is where scheduling and execution stay aligned: Timeline for dates, Kanban for active work, and Milestones for checkpoints.",
      "Manufacturing only appears in **robot projects**, split into CNC, prints, and fabrication queues.",
      "Reports is always available and groups the **QA** and **Event Result** forms in one sidebar page.",
      "Inventory changes by project type: **robot projects use Materials and Parts, non-robot projects use Documents**.",
      "Workflow replaces Subsystems for non-robot projects, but the ownership flow stays the same.",
      "Roster and Help are **always available** no matter which project is selected.",
    ],
  },
  {
    title: "Use the edit flow consistently",
    items: [
      "Create from the Add button in the current view, then come back by clicking the row or card to edit.",
      "The **hover pencil is a cue only**; the row or card itself is the actual click target.",
      "Keep updates and deletes **inside the edit modal** so changes are made in one place.",
      "If an **Add button is disabled**, you are usually missing season or project scope.",
      "Apply ownership and status changes before date changes to keep queue and timeline views in sync.",
    ],
  },
  {
    title: "Filter without losing context",
    items: [
      "Start with search when you know a task name, part number, vendor, or owner.",
      "Layer dropdown filters after search; stacking too many at once can hide expected rows.",
      "Use roster person filtering to trace one contributor across task and inventory surfaces.",
      "After someone else edits data, **use refresh** before assuming your filter is wrong.",
      "Status chips and row badges are the fastest way to spot blocked or stale work.",
    ],
  },
  {
    title: "Roster and permission checks",
    items: [
      "Students, Mentors, and External access are separate on purpose; keep assignments in the right group.",
      "Clicking a roster member sets a person filter in views that support person-scoped data.",
      "Maintain **email, role, and elevated lead/core mentor access** from the roster edit popups.",
      "If ownership choices look wrong in another tab, verify the roster record first.",
    ],
  },
  {
    title: "Sign-in and session behavior",
    items: [
      "Available sign-in methods come from **server config**: Google, email-code, or local dev bypass.",
      "Google auth requires **localhost or HTTPS** with matching allowed origins in Google Cloud.",
      "Email-code login only works with a **valid team address** and the active one-time code.",
      "When a session expires, **sign in again and refresh once** before retrying failed edits.",
    ],
  },
  {
    title: "Fast troubleshooting pass",
    items: [
      "**No data:** verify season, project, and person filter in that order.",
      "**Save failed:** refresh workspace data and retry once before making more edits.",
      "**Cannot sign in:** check backend status and auth config before changing browser settings.",
      "**Filters feel stuck:** clear search and dropdowns, then switch tabs once to reset local view state.",
    ],
  },
];

export const HELP_TUTORIAL_STEPS: HelpTutorialStep[] = [
  {
    title: "Set season and project first",
    summary:
      "Every reliable workflow starts with correct scope. Confirm season and project before creating or editing records.",
    actions: [
      "Open the profile menu and confirm the active season.",
      "Set project scope in the sidebar (Robot, Outreach, Operations, or All projects).",
      "Switch out of All projects before entering detailed task or inventory data.",
    ],
    cue: "Wrong scope is the most common reason data looks missing.",
  },
  {
    title: "Read the shell and subtabs",
    summary:
      "The sidebar picks the area; some areas use subtabs in the top bar, while Reports keeps its launchers on the page.",
    actions: [
      "Open Tasks and move through Timeline, Kanban, and Milestones.",
      "Open Reports to launch QA and Event Result forms from one place in the sidebar.",
      "Switch projects and watch Inventory move between Materials/Parts and Documents.",
      "Check footer notes at the bottom of each view for local interaction hints.",
    ],
    cue: "If a control seems missing, you are often in the wrong subtab, not the wrong tab.",
  },
  {
    title: "Create, then edit in place",
    summary:
      "The core loop is consistent: Add from the toolbar, then return by clicking rows or cards to edit.",
    actions: [
      "Create a new item from the Add button in the active view.",
      "Hover for the pencil cue, then click the row/card itself.",
      "Apply edits and deletes from the edit modal to keep record history consistent.",
    ],
    cue: "Disabled Add buttons usually mean missing scope, not missing permissions.",
  },
  {
    title: "Filter deliberately",
    summary: "Use filters in order so you do not accidentally hide expected items.",
    actions: [
      "Search first when you know a title, owner, vendor, or material.",
      "Then add dropdown filters for status, subsystem, requester, or approval.",
      "Use roster person filtering when tracing one person across multiple tabs.",
    ],
    cue: "Empty list after filtering usually means filters are too specific, not missing data.",
  },
  {
    title: "Use roster as a control surface",
    summary:
      "Roster is not just reference data; it controls assignment quality and person-based filtering.",
    actions: [
      "Keep Students, Mentors, and External access in the correct buckets.",
      "Click a roster member to apply person filtering where supported.",
      "Maintain email, role, and elevated lead/core mentor status from roster popups.",
    ],
    cue: "If assignment dropdowns look wrong, fix the roster record before editing tasks.",
  },
  {
    title: "Recover from stale state quickly",
    summary:
      "When behavior feels off, reset the smallest likely cause before making more edits.",
    actions: [
      "Clear search/filters and switch tabs once if a list appears stuck.",
      "Use refresh after another user or device updates shared records.",
      "If save fails, refresh and retry once before changing more fields.",
    ],
    cue: "Scope, filters, and stale cache explain most confusing states in this app.",
  },
];

export function renderHelpItem(item: string): ReactNode {
  const parts = item.split("**");
  if (parts.length === 1) {
    return item;
  }

  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <strong key={`strong-${index}`}>{part}</strong>
    ) : (
      <span key={`text-${index}`}>{part}</span>
    ),
  );
}
