import type { ReactNode } from "react";

export function KanbanProjectGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section aria-label={label} className="kanban-project-group">
      <h3 className="kanban-project-label"><span>{label}</span></h3>
      <div className="kanban-project-lanes">{children}</div>
    </section>
  );
}
