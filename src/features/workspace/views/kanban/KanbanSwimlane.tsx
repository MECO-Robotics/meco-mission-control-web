import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

export function KanbanSwimlane({ header, children }: { header: ReactNode; children: ReactNode }) {
  return (
    <details className="kanban-swimlane" open>
      <summary className="kanban-swimlane-label">
        <ChevronRight aria-hidden="true" className="kanban-swimlane-chevron" size={14} />
        {header}
      </summary>
      {children}
    </details>
  );
}
