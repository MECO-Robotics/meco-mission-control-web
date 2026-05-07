import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";

export function TaskRobotMapPlaceholderView() {
  return (
    <section className={`panel dense-panel ${WORKSPACE_PANEL_CLASS}`}>
      <div className="empty-state">
        <strong>Robot map placeholder</strong>
        <p className="section-copy">
          Robot mapping and system layout controls will be added here.
        </p>
      </div>
    </section>
  );
}
