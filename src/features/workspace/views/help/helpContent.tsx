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
  { title: "Find your work", items: ["**Home** brings priority work, upcoming milestones, and needs attention together. Filter attention to **Needs review** for approvals and follow-up.", "**Work → Tasks** is the execution queue. Use My work, Blocked, or Waiting for QA; open a task to update it, log work, or submit QA.", "**Work → Schedule** has Calendar, Timeline, and Agenda presentations. Milestone readiness and results stay with the milestone.", "**Work → Activity** contains searchable work logs, changes, QA results, and milestone results. **Risks** keeps the complete risk register."] },
  { title: "Resources and structure", items: ["**Resources** groups Materials, Parts, Purchases, Manufacturing, and Structure for robot projects.", "Manufacturing uses a **Process** filter for CNC, 3D print, and fabrication. Approval and QA steps remain with each job.", "Open a part definition to inspect or edit its installed instances. Use **Needs mapping** to find unallocated definitions.", "**Structure** owns robot subsystems and mechanisms; open **Import CAD** from there for STEP and Onshape workflows.", "Non-robot projects use **Documents** and workflow **Structure**, with clear labels for the selected project."] },
  { title: "People and attendance", items: ["**Team → People** combines membership, presence, assignment status, and workload. Here today and Available now are different filters.", "Open a person to maintain their details and use **Assign work** to start a task for them. Use the separate person filter to scope workspace views.", "**Team → Attendance** shows attendance history and planned versus actual availability. Role restrictions still apply to edits and approvals."] },
  { title: "Scope and navigation", items: ["Check the **season and project selector** before entering data. Robot-only views require a robot project.", "Choose a primary area, then use its labeled **View** selector. No page requires a swipe or hover to find it.", "Use Back to return to the previous destination. Optional favorite views appear in the view selector.", "If a collection looks empty, check project, person, and local filters before adding duplicate records."] },
  { title: "Local demo and tutorials", items: ["Demo edits stay in this browser tab and are **never synced**, including after sign-in.", "Reload keeps demo edits. **Reset demo** restores examples; closing the tab ends its local storage lifetime.", "Tutorials use a separate local copy. Ending or reloading a tutorial discards its edits and restores your previous workspace.", "STEP processing and Onshape connections need a signed-in workspace. Robot maps, parts, and materials can be edited locally."] },
  { title: "Editing and account", items: ["Open a row or card for details. Short create and submit actions use dialogs; larger details retain their surrounding context.", "Save or cancel before leaving an edit. If a save fails, keep your draft and follow the error message before retrying.", "Account controls contain theme, refresh, and sign-in or sign-out. If your session expires, sign in again before retrying a write."] },
];

export const HELP_TUTORIAL_STEPS: HelpTutorialStep[] = [
  { title: "Choose your workspace", summary: "Confirm season and project before entering data.", actions: ["Open the project and season selector.", "Choose a robot or non-robot project."], cue: "Scope determines which resources are available." },
  { title: "Find and update work", summary: "Work opens directly to Tasks.", actions: ["Choose Work, then Tasks.", "Open a task and inspect its status, blockers, and logs.", "Choose Schedule and switch between Calendar, Timeline, and Agenda."], cue: "Views have visible labels; filters narrow their contents." },
  { title: "Review and record results", summary: "Reports belong to the work they describe.", actions: ["Use Waiting for QA in Tasks.", "Submit QA from a task detail.", "Record a result from milestone details.", "Find past records under Work → Activity."], cue: "Creation starts with the correct task or milestone selected." },
  { title: "Manage resources", summary: "Inventory and robot structure have one home.", actions: ["Open Resources and choose Parts or Manufacturing.", "Inspect a part and its installed instances.", "Open Structure to work with subsystems and mechanisms."], cue: "CNC, 3D print, and fabrication are process filters." },
  { title: "Assign people", summary: "Team combines presence, load, and membership.", actions: ["Choose Team → People.", "Compare Here today with Available now.", "Assign work to a teammate or inspect Attendance."], cue: "Presence does not necessarily mean spare capacity." },
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
