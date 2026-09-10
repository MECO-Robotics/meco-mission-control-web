import { useMemo } from "react";

import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import type { BootstrapPayload } from "@/types/bootstrap";
import { OverviewListSection } from "./OverviewListSection";
import { buildHomeViewModel } from "./overviewViewModel";

interface HomeViewProps {
  bootstrap: BootstrapPayload;
  onOpenTask: (taskId: string) => void;
  today?: Date;
  onOpenSchedule?: (milestoneId: string) => void;
}

export function HomeView({ bootstrap, onOpenTask, onOpenSchedule, today = new Date() }: HomeViewProps) {
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
          onOpenItem={onOpenSchedule}
          title="Upcoming milestones"
        />
      </div>
    </section>
  );
}
