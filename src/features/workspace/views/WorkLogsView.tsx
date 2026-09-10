import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskRecord } from "@/types/recordsExecution";
import type { WorklogsViewTab } from "@/lib/workspaceNavigation";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { MembersById, SubsystemsById } from "@/features/workspace/shared/model/workspaceTypes";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import { AppTopbarSlotPortal } from "@/components/layout/AppTopbarSlotPortal";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import { useWorkLogsViewState } from "./workLogs/workLogsViewState";
import { WorkLogsActivitySection } from "./workLogs/WorkLogsActivitySection";
import { WorkLogsActivityToolbar } from "./workLogs/WorkLogsActivityToolbar";
import { WorkLogsTableSection } from "./workLogs/WorkLogsTableSection";
import { WorkLogsToolbar } from "./workLogs/WorkLogsToolbar";
import { ReportHistoryList } from "./workLogs/ReportHistoryList";

interface WorkLogsViewProps {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  membersById: MembersById;
  openCreateWorkLogModal: () => void;
  openEditTaskModal: (task: TaskRecord) => void;
  onOpenSchedule?: (milestoneId: string) => void;
  subsystemsById: SubsystemsById;
  view: WorklogsViewTab;
  onViewChange: (view: WorklogsViewTab) => void;
}
export function WorkLogsView({ activePersonFilter, bootstrap, membersById, openCreateWorkLogModal, openEditTaskModal, onOpenSchedule, subsystemsById, view, onViewChange }: WorkLogsViewProps) {
  const state = useWorkLogsViewState({ activePersonFilter, bootstrap, membersById, subsystemsById });
  const reports = bootstrap.reports.filter(report => (view === "qa" ? report.reportType === "QA" : report.reportType !== "QA") && (activePersonFilter.length === 0 || [report.createdByMemberId, report.mentorId, ...(report.participantIds ?? [])].some(id => id && activePersonFilter.includes(id))) && [report.title, report.summary, report.notes, report.result, report.status, report.taskId ? state.taskById[report.taskId]?.title : ""].join(" ").toLowerCase().includes(state.search.toLowerCase())).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return <section className={`panel dense-panel ${WORKSPACE_PANEL_CLASS}`}>
    <AppTopbarSlotPortal slot="controls"><div className="panel-actions filter-toolbar">
      {view === "logs" ? <WorkLogsToolbar bootstrap={bootstrap} renderMode="topbar" search={state.search} setSearch={state.setSearch} setSortMode={state.setSortMode} setSubsystemFilter={state.setSubsystemFilter} sortMode={state.sortMode} sortOptions={state.sortOptions} subsystemFilter={state.subsystemFilter} /> : view === "activity" ? <WorkLogsActivityToolbar activityGroupMode={state.activityGroupMode} search={state.search} setActivityGroupMode={state.setActivityGroupMode} setSearch={state.setSearch} /> : <TopbarResponsiveSearch ariaLabel="Search report history" compactPlaceholder="Search" onChange={state.setSearch} placeholder="Search report history…" value={state.search} />}
    </div></AppTopbarSlotPortal>
    <div className="workspace-presentation-controls">
      <label>History <select aria-label="Activity type" value={view} onChange={event => onViewChange(event.target.value as WorklogsViewTab)}><option value="logs">Work logs</option><option value="activity">Changes</option><option value="qa">QA results</option><option value="results">Milestone results</option></select></label>
      {view === "logs" ? <button className="primary-action" onClick={() => openCreateWorkLogModal()} type="button">Log work</button> : null}
    </div>
    {view === "logs" ? <>
      <p className="workspace-inline-summary">{state.summary.totalLogs} logs · {state.summary.loggedHours.toFixed(1)} hours · {state.summary.activeContributorCount} contributors · {state.summary.remainingHours.toFixed(1)} planned hours remaining</p>
      <WorkLogsTableSection membersById={membersById} openEditTaskModal={openEditTaskModal} subsystemsById={subsystemsById} taskById={state.taskById} workLogFilterMotionClass={state.workLogFilterMotionClass} workLogPagination={state.workLogPagination} workLogs={state.workLogs} />
    </> : view === "activity" ? <WorkLogsActivitySection actions={state.activityActions} activityGroupMode={state.activityGroupMode} activityPagination={state.activityPagination} description="Changes across the current workspace." membersById={membersById} openEditTaskModal={openEditTaskModal} subsystemsById={subsystemsById} taskById={state.taskById} /> : <ReportHistoryList reports={reports} bootstrap={bootstrap} onOpenTask={id => { const task = state.taskById[id]; if (task) openEditTaskModal(task); }} onOpenMilestone={onOpenSchedule} />}
  </section>;
}
