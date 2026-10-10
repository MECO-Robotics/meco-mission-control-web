import { useMemo, useState } from "react";
import { Filter } from "lucide-react";

import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import {
  CompactFilterMenu,
  compactFilterDropdownMenuItem,
} from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import { buildTopbarAddMenuActions, makeAddMenuAction } from "@/features/workspace/shared/topbar";
import { WorkspaceTopbarAddMenu } from "@/features/workspace/shared/ui";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { BootstrapPayload } from "@/types/bootstrap";
import { OverviewListSection } from "./OverviewListSection";
import { buildHomeViewModel } from "./overviewViewModel";

interface HomeViewProps {
  bootstrap: BootstrapPayload;
  openCreateQaReportModal: () => void;
  openCreateTaskModal: () => void;
  onOpenTask: (taskId: string) => void;
  today?: Date;
  onOpenSchedule?: (milestoneId: string) => void;
}

export function HomeView({ bootstrap, onOpenTask, onOpenSchedule, openCreateQaReportModal, openCreateTaskModal, today = new Date() }: HomeViewProps) {
  const [search, setSearch] = useState("");
  const [contentFilter, setContentFilter] = useState<FilterSelection>([]);
  const model = useMemo(
    () => buildHomeViewModel(bootstrap, today),
    [bootstrap, today],
  );
  const normalizedSearch = search.trim().toLowerCase();
  const matchesSearch = (item: { title: string; meta: string }) =>
    normalizedSearch.length === 0 || `${item.title} ${item.meta}`.toLowerCase().includes(normalizedSearch);
  const showTasks = contentFilter.length === 0 || contentFilter.includes("tasks");
  const showMilestones = contentFilter.length === 0 || contentFilter.includes("milestones");
  const priorityTasks = showTasks ? model.priorityTasks.filter(matchesSearch) : [];
  const upcomingMilestones = showMilestones ? model.upcomingMilestones.filter(matchesSearch) : [];

  return (
    <section className={`panel dense-panel overview-shell home-view ${WORKSPACE_PANEL_CLASS}`}>
      <TopbarResponsiveSearch
          actions={
            <CompactFilterMenu
              activeCount={contentFilter.length}
              ariaLabel="Filter dashboard content"
              buttonLabel="Content"
              icon={<Filter aria-hidden="true" size={14} />}
              iconOnly
              items={[
                compactFilterDropdownMenuItem({
                  allLabel: "All dashboard content",
                  ariaLabel: "Filter dashboard content",
                  icon: <Filter aria-hidden="true" size={14} />,
                  label: "Sections",
                  onChange: setContentFilter,
                  options: [
                    { id: "tasks", name: "Priority work" },
                    { id: "milestones", name: "Agenda" },
                  ],
                  value: contentFilter,
                }),
              ]}
            />
          }
          ariaLabel="Search dashboard"
          compactPlaceholder="Search"
          onChange={setSearch}
          placeholder="Search dashboard..."
          value={search}
      />
      <WorkspaceTopbarAddMenu
        actions={buildTopbarAddMenuActions(
          makeAddMenuAction("Add task", openCreateTaskModal),
          makeAddMenuAction("Add milestone", () => window.dispatchEvent(new Event("mission-control:open-milestone"))),
          makeAddMenuAction("Add QA report", openCreateQaReportModal),
        )}
        ariaLabel="Add dashboard item"
        title="Add to dashboard"
      />
      <div className="overview-section-grid">
        <OverviewListSection
          emptyLabel="No near-term task deadlines."
          items={priorityTasks}
          onOpenTask={onOpenTask}
          title="Priority work"
        />
        <OverviewListSection
          emptyLabel="No upcoming milestones."
          items={upcomingMilestones}
          onOpenItem={onOpenSchedule}
          title="Agenda"
        />
      </div>
    </section>
  );
}
