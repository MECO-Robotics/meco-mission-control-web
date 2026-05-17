import { useMemo } from "react";

import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import type { BootstrapPayload } from "@/types/bootstrap";
import { OverviewListSection } from "./OverviewListSection";
import { OverviewMetricGrid } from "./OverviewMetricGrid";
import { buildHomeViewModel } from "./overviewViewModel";

interface HomeViewProps {
  bootstrap: BootstrapPayload;
  onOpenTask: (taskId: string) => void;
  today?: Date;
}

export function HomeView({ bootstrap, onOpenTask, today = new Date() }: HomeViewProps) {
  const model = useMemo(
    () => buildHomeViewModel(bootstrap, today),
    [bootstrap, today],
  );

  return (
    <section className={`panel dense-panel overview-shell home-view ${WORKSPACE_PANEL_CLASS}`}>
      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2>Home</h2>
        </div>
      </div>

      <OverviewMetricGrid metrics={model.metrics} />

      <div className="overview-section-grid">
        <OverviewListSection
          emptyLabel="No near-term task deadlines."
          items={model.priorityTasks}
          onOpenTask={onOpenTask}
          title="Priority work"
        />
        <OverviewListSection
          emptyLabel="No upcoming milestones."
          items={model.upcomingMilestones}
          title="Upcoming milestones"
        />
        <OverviewListSection
          emptyLabel="No high-risk issues."
          items={model.issues}
          onOpenTask={onOpenTask}
          title="Issues"
        />
      </div>
    </section>
  );
}
