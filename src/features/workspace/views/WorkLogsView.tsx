import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskRecord } from "@/types/recordsExecution";
import type { WorklogsViewTab } from "@/lib/workspaceNavigation";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { MembersById, SubsystemsById } from "@/features/workspace/shared/model/workspaceTypes";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";

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
      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2>{view === "activity" ? "Activity" : view === "summary" ? "Work log summary" : "Work logs"}</h2>
        </div>

        {view === "logs" ? (
          <WorkLogsToolbar
            bootstrap={bootstrap}
            openCreateWorkLogModal={openCreateWorkLogModal}
            search={workLogsView.search}
            setSearch={workLogsView.setSearch}
            setSortMode={workLogsView.setSortMode}
            setSubsystemFilter={workLogsView.setSubsystemFilter}
            sortMode={workLogsView.sortMode}
            sortOptions={workLogsView.sortOptions}
            subsystemFilter={workLogsView.subsystemFilter}
          />
        ) : null}
      </div>

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
          bootstrap={bootstrap}
          membersById={membersById}
          openEditTaskModal={openEditTaskModal}
          subsystemsById={subsystemsById}
          taskById={workLogsView.taskById}
          workLogFilterMotionClass={workLogsView.workLogFilterMotionClass}
          workLogPagination={workLogsView.workLogPagination}
          workLogs={workLogsView.workLogs}
          setSubsystemFilter={workLogsView.setSubsystemFilter}
          subsystemFilter={workLogsView.subsystemFilter}
        />
      )}
    </section>
  );
}
