import { useCallback, useMemo, useState } from "react";

import { AppTopbarSlotPortal } from "@/components/layout/AppTopbarSlotPortal";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
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
  const [searchFilter, setSearchFilter] = useState("");
  const viewModel = useMemo(
    () =>
      buildAttentionViewModel({
        activePersonFilter,
        bootstrap,
      }),
    [activePersonFilter, bootstrap],
  );
  const filteredActionNowItems = useMemo(() => {
    const normalizedSearch = searchFilter.trim().toLowerCase();
    if (normalizedSearch.length === 0) {
      return viewModel.actionNowItems;
    }

    return viewModel.actionNowItems.filter((item) =>
      [
        item.title,
        item.whyNow,
        item.nextAction,
        item.ownerLabel,
        item.statusLabel,
        item.severityLabel,
        item.contextLabel,
        item.sourceType,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [searchFilter, viewModel.actionNowItems]);
  const filteredTriageGroups = useMemo(() => {
    const normalizedSearch = searchFilter.trim().toLowerCase();
    if (normalizedSearch.length === 0) {
      return viewModel.triageGroups;
    }

    return viewModel.triageGroups.map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        [
          group.title,
          item.title,
          item.subtitle,
          item.ownerLabel,
          item.statusLabel,
          item.severityLabel,
          item.contextLabel,
          item.kind,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch),
      ),
    }));
  }, [searchFilter, viewModel.triageGroups]);
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
      <AppTopbarSlotPortal slot="controls">
        <div className="panel-actions filter-toolbar attention-toolbar">
          <TopbarResponsiveSearch
            ariaLabel="Search action required"
            compactPlaceholder="Search"
            onChange={setSearchFilter}
            placeholder="Search action required..."
            value={searchFilter}
          />
        </div>
      </AppTopbarSlotPortal>

      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2>Action Required</h2>
          <small>Operational triage for immediate intervention</small>
        </div>
      </div>

      <AttentionSummaryCards groups={viewModel.summaryGroups} onSelectCard={jumpToSection} />
      <AttentionNeedsActionNowList
        items={filteredActionNowItems}
        onOpenRisk={onOpenRisk}
        onOpenTask={onOpenTask}
      />
      <AttentionTriageList
        groups={filteredTriageGroups}
        onOpenRisk={onOpenRisk}
        onOpenTask={onOpenTask}
      />
    </section>
  );
}
