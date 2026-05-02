import type { BootstrapPayload, TaskRecord } from "@/types";
import type { WorklogsViewTab } from "@/lib/workspaceNavigation";
import type { FilterSelection, MembersById, SubsystemsById } from "@/features/workspace/shared";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared";

import { useWorkLogsViewState } from "./workLogs/workLogsViewState";
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
          <h2>{view === "summary" ? "Work log summary" : "Work logs"}</h2>
          <p className="section-copy filter-copy">
            {view === "summary"
              ? "Snapshot of logged execution against planned effort."
              : activePersonFilter.length === 0
                ? "All logged work tied back to tasks."
                : `Only logs involving ${workLogsView.activePersonFilterLabel}.`}
          </p>
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

      {view === "summary" ? (
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
