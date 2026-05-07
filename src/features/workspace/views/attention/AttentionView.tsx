import { useMemo } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import { AttentionSummaryCards } from "./AttentionSummaryCards";
import { AttentionTriageList } from "./AttentionTriageList";
import { buildAttentionViewModel } from "./attentionViewModel";

interface AttentionViewProps {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  onOpenRisk: (riskId: string) => void;
  onOpenTask: (taskId: string) => void;
}

export function AttentionView({
  activePersonFilter,
  bootstrap,
  onOpenRisk,
  onOpenTask,
}: AttentionViewProps) {
  const viewModel = useMemo(
    () =>
      buildAttentionViewModel({
        activePersonFilter,
        bootstrap,
      }),
    [activePersonFilter, bootstrap],
  );

  return (
    <section className={`panel dense-panel attention-view-shell ${WORKSPACE_PANEL_CLASS}`}>
      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2>Attention</h2>
        </div>
      </div>

      <AttentionSummaryCards cards={viewModel.summaryCards} />
      <AttentionTriageList
        groups={viewModel.triageGroups}
        onOpenRisk={onOpenRisk}
        onOpenTask={onOpenTask}
      />
    </section>
  );
}
