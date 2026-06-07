import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskRecord } from "@/types/recordsExecution";
import type { WorklogsViewTab } from "@/lib/workspaceNavigation";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { MembersById, SubsystemsById } from "@/features/workspace/shared/model/workspaceTypes";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import { AppTopbarSlotPortal } from "@/components/layout/AppTopbarSlotPortal";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import { WorkspaceTopbarControls, buildSingleAddMenuAction } from "@/features/workspace/shared/topbar";
import { WorkspaceTopbarAddMenu } from "@/features/workspace/shared/ui";

import { useWorkLogsViewState } from "./workLogs/workLogsViewState";
import { WorkLogsActiveBoardSection } from "./workLogs/WorkLogsActiveBoardSection";
import { WorkLogsActivitySection } from "./workLogs/WorkLogsActivitySection";
import { WorkLogsActivityToolbar } from "./workLogs/WorkLogsActivityToolbar";
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
  const isActivityView = view === "activity";
  const isActiveBoardView = view === "kanban";
  const activityBoardCopy = "Recent workspace activity across the current workspace scope.";
  const topbarSearchLabel = isActiveBoardView
    ? "Search active worklog board"
    : "Search work log summary";
  const topbarSearchPlaceholder = isActiveBoardView ? "Search board..." : "Search summary...";

  return (
    <section className={`panel dense-panel ${WORKSPACE_PANEL_CLASS}`}>
      <AppTopbarSlotPortal slot="controls">
        <WorkspaceTopbarControls
          className="worklog-toolbar worklog-toolbar-topbar"
          children={
            view === "logs" ? (
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
            ) : isActivityView ? (
              <WorkLogsActivityToolbar
                activityGroupMode={workLogsView.activityGroupMode}
                search={workLogsView.search}
                setActivityGroupMode={workLogsView.setActivityGroupMode}
                setSearch={workLogsView.setSearch}
              />
            ) : (
              <TopbarResponsiveSearch
                ariaLabel={topbarSearchLabel}
                compactPlaceholder="Search"
                onChange={workLogsView.setSearch}
                placeholder={topbarSearchPlaceholder}
                value={workLogsView.search}
              />
            )
          }
          addMenu={
            view === "logs" ? (
              <WorkspaceTopbarAddMenu
                actions={buildSingleAddMenuAction({
                  label: "Add work log",
                  onSelect: openCreateWorkLogModal,
                })}
                ariaLabel="Add work log"
                title="Add work log"
                tutorialTarget="create-worklog-button"
              />
            ) : null
          }
        />
      </AppTopbarSlotPortal>

      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2>
            {isActiveBoardView
              ? "Active worklog board"
              : isActivityView
                ? "Activity"
                : view === "summary"
                  ? "Work log summary"
                  : "Work logs"}
          </h2>
        </div>
      </div>

      {isActivityView ? (
        <WorkLogsActivitySection
          actions={workLogsView.activityActions}
          activityGroupMode={workLogsView.activityGroupMode}
          activityPagination={workLogsView.activityPagination}
          description={activityBoardCopy}
          membersById={membersById}
          openEditTaskModal={openEditTaskModal}
          subsystemsById={subsystemsById}
          taskById={workLogsView.taskById}
        />
      ) : isActiveBoardView ? (
        <WorkLogsActiveBoardSection
          board={workLogsView.activeBoard}
          openEditTaskModal={openEditTaskModal}
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
