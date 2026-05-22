import type { OverviewListItem } from "./overviewViewModel";

interface OverviewListSectionProps {
  emptyLabel: string;
  items: OverviewListItem[];
  onOpenTask?: (taskId: string) => void;
  title: string;
}

export function OverviewListSection({
  emptyLabel,
  items,
  onOpenTask,
  title,
}: OverviewListSectionProps) {
  return (
    <section className="panel-subsection overview-list-section">
      <div className="roster-section-header">
        <div className="roster-section-title">
          <h3>{title}</h3>
        </div>
        <span className="pill status-pill status-pill-neutral">{items.length}</span>
      </div>

      {items.length === 0 ? (
        <p className="empty-state">{emptyLabel}</p>
      ) : (
        <div className="overview-list">
          {items.map((item) => {
            const canOpenTask = Boolean(item.taskId && onOpenTask);
            const content = (
              <>
                <span className="overview-list-item-title">{item.title}</span>
                <small>{item.meta}</small>
              </>
            );

            return canOpenTask ? (
              <button
                className="overview-list-item"
                data-tone={item.tone ?? "neutral"}
                key={item.id}
                onClick={() => onOpenTask?.(item.taskId ?? "")}
                type="button"
              >
                {content}
              </button>
            ) : (
              <article
                className="overview-list-item"
                data-tone={item.tone ?? "neutral"}
                key={item.id}
              >
                {content}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
