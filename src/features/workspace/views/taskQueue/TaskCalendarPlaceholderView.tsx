import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";

export function TaskCalendarPlaceholderView() {
  return (
    <section className={`panel dense-panel ${WORKSPACE_PANEL_CLASS}`}>
      <div className="empty-state">
        <strong>Calendar placeholder</strong>
        <p className="section-copy">
          Calendar scheduling and date-grid views for tasks and milestones will be added here.
        </p>
      </div>
    </section>
  );
}
