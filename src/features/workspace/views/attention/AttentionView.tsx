import { useCallback, useMemo } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import { AttentionNeedsActionNowList } from "./AttentionNeedsActionNowList";
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
  const jumpToSection = useCallback((sectionId: string) => {
    if (typeof document === "undefined") {
      return;
    }

    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return (
    <section className={`panel dense-panel attention-view-shell ${WORKSPACE_PANEL_CLASS}`}>
      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2>Action Required</h2>
          <small>Operational triage for immediate intervention</small>
        </div>
      </div>

      <AttentionSummaryCards groups={viewModel.summaryGroups} onSelectCard={jumpToSection} />
      <AttentionNeedsActionNowList
        items={viewModel.actionNowItems}
        onOpenRisk={onOpenRisk}
        onOpenTask={onOpenTask}
      />
      <AttentionTriageList
        groups={viewModel.triageGroups}
        onOpenRisk={onOpenRisk}
        onOpenTask={onOpenTask}
      />
    </section>
  );
}
