import { useMemo } from "react";

import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import type { BootstrapPayload } from "@/types/bootstrap";
import { OverviewListSection } from "./OverviewListSection";
import { OverviewMetricGrid } from "./OverviewMetricGrid";
import { buildTodayViewModel } from "./overviewViewModel";

interface TodayViewProps {
  bootstrap: BootstrapPayload;
  onOpenTask: (taskId: string) => void;
  today?: Date;
}

export function TodayView({ bootstrap, onOpenTask, today = new Date() }: TodayViewProps) {
  const model = useMemo(
    () => buildTodayViewModel(bootstrap, today),
    [bootstrap, today],
  );

  return (
    <section className={`panel dense-panel overview-shell today-view ${WORKSPACE_PANEL_CLASS}`}>
      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2>Today</h2>
        </div>
      </div>

      <OverviewMetricGrid metrics={model.summary} />

      <div className="overview-section-grid">
        <OverviewListSection
          emptyLabel="No tasks due today or overdue."
          items={model.dailyActions}
          onOpenTask={onOpenTask}
          title="Daily action items"
        />
        <OverviewListSection
          emptyLabel="No deadlines in the next three days."
          items={model.verySoonDeadlines}
          onOpenTask={onOpenTask}
          title="Very soon deadlines"
        />
        <OverviewListSection
          emptyLabel="No high-risk or blocked items."
          items={model.issues}
          onOpenTask={onOpenTask}
          title="Issues"
        />
      </div>
    </section>
  );
}
