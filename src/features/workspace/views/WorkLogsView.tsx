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
import { WorkspaceSortMenu } from "@/features/workspace/shared/filters/WorkspaceSortMenu";
import { buildSingleAddMenuAction } from "@/features/workspace/shared/topbar";
import { WorkspaceTopbarAddMenu } from "@/features/workspace/shared/ui";
import { useRememberedViewState } from "@/features/workspace/shared/navigation/WorkspaceViewMemory";

interface WorkLogsViewProps {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  membersById: MembersById;
  openCreateQaReportModal: () => void;
  openCreateMilestoneReportModal: () => void;
  openCreateWorkLogModal: () => void;
  openEditTaskModal: (task: TaskRecord) => void;
  onOpenSchedule?: (milestoneId: string) => void;
  subsystemsById: SubsystemsById;
  view: WorklogsViewTab;
}
export function WorkLogsView({ activePersonFilter, bootstrap, membersById, openCreateMilestoneReportModal, openCreateQaReportModal, openCreateWorkLogModal, openEditTaskModal, onOpenSchedule, subsystemsById, view }: WorkLogsViewProps) {
  const state = useWorkLogsViewState({ activePersonFilter, bootstrap, membersById, subsystemsById });
  const [reportSort, setReportSort] = useRememberedViewState("history.sort", "recent");
  const [reportSortDirection, setReportSortDirection] = useRememberedViewState<"asc" | "desc">("history.sortDirection", "desc");
  const reports = bootstrap.reports.filter((report) => (view === "qa" ? report.reportType === "qa" : report.reportType !== "qa") && (activePersonFilter.length === 0 || [report.requestedById, report.mentorId, ...report.participantIds].some((id) => id && activePersonFilter.includes(id))) && [report.summary, report.notes, report.result, report.status, ...report.targetRefs.map((ref) => ref.kind === "task" ? state.taskById[ref.id]?.title ?? "" : "")].join(" ").toLowerCase().includes(state.search.toLowerCase())).sort((a, b) => reportSort === "title" ? a.summary.localeCompare(b.summary) * (reportSortDirection === "asc" ? 1 : -1) : a.createdAt.localeCompare(b.createdAt) * (reportSortDirection === "asc" ? 1 : -1));
  return <section className={`panel dense-panel ${WORKSPACE_PANEL_CLASS}`}>
    <AppTopbarSlotPortal slot="controls"><div className="panel-actions filter-toolbar">
      {view === "logs" ? <WorkLogsToolbar bootstrap={bootstrap} renderMode="topbar" search={state.search} setSearch={state.setSearch} setSortMode={state.setSortMode} setSubsystemFilter={state.setSubsystemFilter} sortMode={state.sortMode} sortOptions={state.sortOptions} subsystemFilter={state.subsystemFilter} /> : view === "activity" ? <WorkLogsActivityToolbar activityGroupMode={state.activityGroupMode} activitySortMode={state.activitySortMode} activitySortDirection={state.activitySortDirection} search={state.search} setActivityGroupMode={state.setActivityGroupMode} setActivitySortMode={state.setActivitySortMode} setActivitySortDirection={state.setActivitySortDirection} setSearch={state.setSearch} /> : <TopbarResponsiveSearch actions={<WorkspaceSortMenu direction={reportSortDirection} field={reportSort} label="history" onDirectionChange={setReportSortDirection} onFieldChange={setReportSort} options={[{ label: "Date", value: "recent" }, { label: "Title", value: "title" }]} />} ariaLabel="Search report history" compactPlaceholder="Search" onChange={state.setSearch} placeholder="Search report history…" value={state.search} />}
    </div></AppTopbarSlotPortal>
    {view === "qa" ? <WorkspaceTopbarAddMenu actions={buildSingleAddMenuAction({ label: "Add QA report", onSelect: openCreateQaReportModal })} ariaLabel="Add QA report" title="Add QA report" /> : view === "results" ? <WorkspaceTopbarAddMenu actions={buildSingleAddMenuAction({ label: "Add milestone report", onSelect: openCreateMilestoneReportModal })} ariaLabel="Add milestone report" title="Add milestone report" /> : <WorkspaceTopbarAddMenu actions={buildSingleAddMenuAction({ label: "Log work", onSelect: openCreateWorkLogModal })} ariaLabel="Log work" title="Log work" />}
    {view === "logs" ? <>
      <p className="workspace-inline-summary">{state.summary.totalLogs} logs · {state.summary.loggedHours.toFixed(1)} hours · {state.summary.activeContributorCount} contributors · {state.summary.remainingHours.toFixed(1)} planned hours remaining</p>
      <WorkLogsTableSection membersById={membersById} openEditTaskModal={openEditTaskModal} subsystemsById={subsystemsById} taskById={state.taskById} workLogFilterMotionClass={state.workLogFilterMotionClass} workLogPagination={state.workLogPagination} workLogs={state.workLogs} />
    </> : view === "activity" ? <WorkLogsActivitySection actions={state.activityActions} activityGroupMode={state.activityGroupMode} activityPagination={state.activityPagination} description="Changes across the current workspace." membersById={membersById} openEditTaskModal={openEditTaskModal} subsystemsById={subsystemsById} taskById={state.taskById} /> : <ReportHistoryList reports={reports} bootstrap={bootstrap} onOpenTask={id => { const task = state.taskById[id]; if (task) openEditTaskModal(task); }} onOpenMilestone={onOpenSchedule} />}
  </section>;
}
