import { useMemo } from "react";

import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import { buildAttentionQueue, type AttentionQueueRow } from "@/features/workspace/views/attention/attentionQueue";
import { buildAttentionViewModel } from "@/features/workspace/views/attention/attentionViewModel";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { formatMilestoneDateTime, formatMilestoneReadinessLabel, formatMilestoneStatusLabel } from "@/features/workspace/views/milestones/milestonesViewUtils";
import type { BootstrapPayload } from "@/types/bootstrap";
import { HomeActionRequired } from "./HomeActionRequired";
import { HomeTaskStatusDistribution } from "./HomeTaskStatusDistribution";
import { buildHomeViewModel } from "./overviewViewModel";

interface HomeViewProps {
  activePersonFilter?: FilterSelection;
  bootstrap: BootstrapPayload;
  onOpenActionItem: (item: AttentionQueueRow) => void;
  onOpenAllActions: () => void;
  onOpenTask: (taskId: string) => void;
  onOpenSchedule: (milestoneId: string) => void;
  projectId?: string | null;
  scopeLabel?: string;
  today?: Date;
}

export function HomeView({
  activePersonFilter = [],
  bootstrap,
  onOpenActionItem,
  onOpenAllActions,
  onOpenTask,
  onOpenSchedule,
  projectId = null,
  scopeLabel = "All projects",
  today = new Date(),
}: HomeViewProps) {
  const model = useMemo(
    () => buildHomeViewModel({ activePersonFilter, bootstrap, projectId, today }),
    [activePersonFilter, bootstrap, projectId, today],
  );
  const actionItems = useMemo(
    () => buildAttentionQueue(buildAttentionViewModel({ activePersonFilter, bootstrap, projectId, today })),
    [activePersonFilter, bootstrap, projectId, today],
  );

  return (
    <section className={`panel dense-panel overview-shell home-view ${WORKSPACE_PANEL_CLASS}`}>
      <div className="home-dashboard-lead-grid">
        <HomeActionRequired
          items={actionItems}
          onOpenItem={onOpenActionItem}
          onOpenAll={onOpenAllActions}
          scopeLabel={scopeLabel}
        />
        <section className="home-milestone-timeline" aria-labelledby="home-milestones-title">
          <div className="workspace-section-heading">
            <h2 id="home-milestones-title">Upcoming milestones</h2>
            <span>{model.upcomingMilestones.length} shown · {scopeLabel}</span>
          </div>
          {model.upcomingMilestones.length ? (
            <ol className="home-milestone-list">
              {model.upcomingMilestones.map((milestone) => (
                <li key={milestone.id}>
                  <span className="home-milestone-marker" aria-hidden="true" />
                  <button className="home-milestone-event" onClick={() => onOpenSchedule(milestone.id)} type="button">
                    <strong>{milestone.title}</strong>
                    <span>
                      <time dateTime={milestone.startAt}>{formatMilestoneDateTime(milestone.startAt)}</time>
                      <span className="home-milestone-state">{formatMilestoneStatusLabel(milestone.status) ?? "Status unknown"}</span>
                      <span className="home-milestone-readiness" data-readiness={milestone.readinessStatus ?? "unknown"}>
                        {formatMilestoneReadinessLabel(milestone.readinessStatus)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <p className="empty-state">No upcoming milestones in this scope.</p>
          )}
        </section>
      </div>
      <HomeTaskStatusDistribution tasksByStatus={model.tasksByStatus} onOpenTask={onOpenTask} />
    </section>
  );
}
