import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";

export function PartMappingsPlaceholderView() {
  return (
    <section className={`panel dense-panel ${WORKSPACE_PANEL_CLASS}`}>
      <div className="empty-state">
        <strong>Parts map placeholder</strong>
        <p className="section-copy">
          Part-to-system mapping workflows and relationship tools will be added here.
        </p>
      </div>
    </section>
  );
}
