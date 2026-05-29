import { useCallback, useMemo, useState } from "react";

import { AppTopbarSlotPortal } from "@/components/layout/AppTopbarSlotPortal";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { CompactFilterMenu } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import { AttentionNeedsActionNowList } from "./AttentionNeedsActionNowList";
import { AttentionSummaryCards } from "./AttentionSummaryCards";
import { AttentionTriageList } from "./AttentionTriageList";
import {
  buildAttentionViewModel,
  type AttentionNowItem,
  type AttentionTriageItem,
} from "./attentionViewModel";

type AttentionSourceFilter = "all" | "risk" | "task" | "manufacturing" | "purchase" | "quality";

const ATTENTION_SOURCE_FILTER_OPTIONS: { label: string; value: AttentionSourceFilter }[] = [
  { label: "All signals", value: "all" },
  { label: "Risks", value: "risk" },
  { label: "Tasks", value: "task" },
  { label: "Manufacturing", value: "manufacturing" },
  { label: "Purchases", value: "purchase" },
  { label: "QA / reports", value: "quality" },
];

interface AttentionViewProps {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  onOpenRisk: (riskId: string) => void;
  onOpenTask: (taskId: string) => void;
}

function actionItemMatchesSourceFilter(item: AttentionNowItem, sourceFilter: AttentionSourceFilter) {
  if (sourceFilter === "all") {
    return true;
  }
  if (sourceFilter === "quality") {
    return item.sourceType === "qa";
  }
  return item.sourceType === sourceFilter;
}

function triageItemMatchesSourceFilter(item: AttentionTriageItem, sourceFilter: AttentionSourceFilter) {
  if (sourceFilter === "all") {
    return true;
  }
  if (sourceFilter === "quality") {
    return item.kind === "report";
  }
  return item.kind === sourceFilter;
}

export function AttentionView({
  activePersonFilter,
  bootstrap,
  onOpenRisk,
  onOpenTask,
}: AttentionViewProps) {
  const [searchFilter, setSearchFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState<AttentionSourceFilter>("all");
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
    const sourceFilteredItems = viewModel.actionNowItems.filter((item) =>
      actionItemMatchesSourceFilter(item, sourceFilter),
    );

    if (normalizedSearch.length === 0) {
      return sourceFilteredItems;
    }

    return sourceFilteredItems.filter((item) =>
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
  }, [searchFilter, sourceFilter, viewModel.actionNowItems]);
  const filteredTriageGroups = useMemo(() => {
    const normalizedSearch = searchFilter.trim().toLowerCase();

    return viewModel.triageGroups.map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        triageItemMatchesSourceFilter(item, sourceFilter) &&
        (normalizedSearch.length === 0 ||
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
            .includes(normalizedSearch)),
      ),
    }));
  }, [searchFilter, sourceFilter, viewModel.triageGroups]);
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
            actionCount={1}
            actions={
              <CompactFilterMenu
                activeCount={sourceFilter === "all" ? 0 : 1}
                ariaLabel="Action required filters"
                buttonLabel="Filters"
                className="attention-filter-menu"
                items={[
                  {
                    label: "Signal",
                    content: (
                      <select
                        aria-label="Filter action required by signal"
                        className="task-queue-sort-menu-select"
                        onChange={(event) => setSourceFilter(event.target.value as AttentionSourceFilter)}
                        value={sourceFilter}
                      >
                        {ATTENTION_SOURCE_FILTER_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ),
                  },
                ]}
              />
            }
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
