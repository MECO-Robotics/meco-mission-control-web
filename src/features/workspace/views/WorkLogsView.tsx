import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskRecord } from "@/types/recordsExecution";
import type { WorklogsViewTab } from "@/lib/workspaceNavigation";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { MembersById, SubsystemsById } from "@/features/workspace/shared/model/workspaceTypes";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import { AppTopbarSlotPortal } from "@/components/layout/AppTopbarSlotPortal";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import { WorkspaceFloatingAddButton } from "@/features/workspace/shared/ui";

import { useWorkLogsViewState } from "./workLogs/workLogsViewState";
import { WorkLogsActivitySection } from "./workLogs/WorkLogsActivitySection";
import { WorkLogsSummarySection } from "./workLogs/WorkLogsSummarySection";
import { WorkLogsTableSection } from "./workLogs/WorkLogsTableSection";
import { WorkLogsToolbar } from "./workLogs/WorkLogsToolbar";

interface WorkLogsViewProps {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  membersById: MembersById;
  openCreateWorkLogModal: () => void;
  openEditTaskModal: (task: TaskRecord) => void;
  subsystemsById: SubsystemsById;
  view: WorklogsViewTab;
}

export function WorkLogsView({
  activePersonFilter,
  bootstrap,
  membersById,
  openCreateWorkLogModal,
  openEditTaskModal,
  subsystemsById,
  view,
}: WorkLogsViewProps) {
  const workLogsView = useWorkLogsViewState({
    activePersonFilter,
    bootstrap,
    membersById,
    subsystemsById,
  });

  return (
    <section className={`panel dense-panel ${WORKSPACE_PANEL_CLASS}`}>
      <AppTopbarSlotPortal slot="controls">
        {view === "logs" ? (
          <WorkLogsToolbar
            bootstrap={bootstrap}
            renderMode="topbar"
            search={workLogsView.search}
            setSearch={workLogsView.setSearch}
            setSortMode={workLogsView.setSortMode}
            setSubsystemFilter={workLogsView.setSubsystemFilter}
            sortMode={workLogsView.sortMode}
            sortOptions={workLogsView.sortOptions}
            subsystemFilter={workLogsView.subsystemFilter}
          />
        ) : (
          <div className="panel-actions filter-toolbar worklog-toolbar worklog-toolbar-topbar">
            <TopbarResponsiveSearch
              ariaLabel={view === "activity" ? "Search activity" : "Search work log summary"}
              compactPlaceholder="Search"
              onChange={workLogsView.setSearch}
              placeholder={view === "activity" ? "Search activity..." : "Search summary..."}
              value={workLogsView.search}
            />
          </div>
        )}
      </AppTopbarSlotPortal>

      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2>{view === "activity" ? "Activity" : view === "summary" ? "Work log summary" : "Work logs"}</h2>
        </div>
      </div>

      {view === "logs" ? (
        <WorkspaceFloatingAddButton
          ariaLabel="Add work log"
          onClick={openCreateWorkLogModal}
          title="Add work log"
          tutorialTarget="create-worklog-button"
        />
      ) : null}

      {view === "activity" ? (
        <WorkLogsActivitySection
          actions={workLogsView.activityActions}
          activityPagination={workLogsView.activityPagination}
          membersById={membersById}
          openEditTaskModal={openEditTaskModal}
          subsystemsById={subsystemsById}
          taskById={workLogsView.taskById}
        />
      ) : view === "summary" ? (
        <WorkLogsSummarySection
          onOpenTask={openEditTaskModal}
          summary={workLogsView.summary}
          taskById={workLogsView.taskById}
        />
      ) : (
        <WorkLogsTableSection
          membersById={membersById}
          openEditTaskModal={openEditTaskModal}
          subsystemsById={subsystemsById}
          taskById={workLogsView.taskById}
          workLogFilterMotionClass={workLogsView.workLogFilterMotionClass}
          workLogPagination={workLogsView.workLogPagination}
          workLogs={workLogsView.workLogs}
        />
      )}
    </section>
  );
}
