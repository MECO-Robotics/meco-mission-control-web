import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared";

const HELP_SECTIONS: Array<{ title: string; items: string[] }> = [
  {
    title: "Navigate the workspace",
    items: [
      "Use the sidebar tabs to switch between planning, inventory, manufacturing, roster, and help.",
      "Use the season selector in the sidebar and the project selector in the top bar to scope what you are viewing.",
      "Use the top bar subtabs when available (for example Timeline, Queue, Milestones) to drill into each area.",
      "Use All projects in the top bar when you need a cross-project planning view.",
      "Use a specific project when you need detailed workflow, inventory, and manufacturing context.",
    ],
  },
  {
    title: "Understand tab behavior",
    items: [
      "Tasks always include Timeline, Queue, and Milestones for planning and execution.",
      "Manufacturing appears only when a robot project is selected.",
      "Inventory changes by project type: robot projects show Materials, Parts, and Purchases, while non-robot projects show Documents and Purchases.",
      "Subsystems is relabeled as Workflow for non-robot projects.",
      "Roster and Help stay available in all project scopes.",
    ],
  },
  {
    title: "Create and edit records",
    items: [
      "Use Add buttons in each tab to create new entries.",
      "Click a row or card to edit it, and look for the pencil hover cue as a visual indicator.",
      "Use the edit dialog for updates and destructive actions so changes stay in one place.",
      "If a create action is disabled, check that a project or season is selected first.",
      "Use edit modals to update status and ownership fields before changing schedule dates.",
    ],
  },
  {
    title: "Filter and review data",
    items: [
      "Use search and filter controls in the toolbar to narrow results quickly.",
      "Use the refresh button in the top-right corner after external updates.",
      "Use the timeline and milestone tools to track deadlines and dependencies by subsystem.",
      "Use person filtering to focus on one or more members or switch back to all contributors.",
      "Review status chips and counts in each view to spot blocked or overdue work.",
    ],
  },
  {
    title: "Authentication and access",
    items: [
      "The sign-in screen is driven by server configuration and may show Google, email-code, or local dev access options.",
      "Google sign-in requires localhost or HTTPS and a matching authorized origin in Google Cloud.",
      "Email-code sign-in requires a valid team address and the one-time code from your inbox.",
      "If your session expires, sign in again and refresh the workspace to reload scoped data.",
    ],
  },
  {
    title: "Quick troubleshooting",
    items: [
      "If data looks missing, verify the selected season and project scope first.",
      "If actions fail to save, refresh the workspace and retry once before editing more records.",
      "If you cannot sign in, check backend availability and auth configuration.",
      "If filters seem stuck, clear search/filter inputs and switch tabs once to reset view state.",
    ],
  },
];

export function HelpView() {
  return (
    <section className={`panel dense-panel ${WORKSPACE_PANEL_CLASS}`}>
      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2>Help documentation</h2>
          <p className="section-copy">
            Detailed reference for navigation, editing, auth, and troubleshooting workflows.
          </p>
        </div>
      </div>

      <div className="panel-subsection">
        {HELP_SECTIONS.map((section) => (
          <article key={section.title} style={{ marginBottom: "1rem" }}>
            <h3 style={{ marginBottom: "0.4rem" }}>{section.title}</h3>
            <ul style={{ margin: 0, paddingLeft: "1.1rem", color: "var(--text-copy)" }}>
              {section.items.map((item) => (
                <li key={item} style={{ marginBottom: "0.35rem" }}>
                  {item}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
