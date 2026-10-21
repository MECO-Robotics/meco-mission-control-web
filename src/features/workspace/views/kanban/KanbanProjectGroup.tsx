import { useId, useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export function KanbanProjectGroup({ label, children }: { label: string; children: ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const lanesId = useId();
  const Chevron = isExpanded ? ChevronDown : ChevronRight;

  return (
    <section aria-label={label} className="kanban-project-group">
      <h3 className="kanban-project-label">
        <button
          aria-controls={lanesId}
          aria-expanded={isExpanded}
          className="kanban-project-toggle"
          onClick={() => setIsExpanded((current) => !current)}
          type="button"
        >
          <span><Chevron aria-hidden="true" size={14} />{label}</span>
        </button>
      </h3>
      <div className="kanban-project-lanes" hidden={!isExpanded} id={lanesId}>{children}</div>
    </section>
  );
}
