import { useCallback } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import { fetchFindingForRetest } from "@/lib/auth/bootstrap";
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
import { QaReportList } from "./workLogs/QaReportList";
import { TestFindingRetestList } from "./workLogs/TestFindingRetestList";
import { WorkspaceSortMenu } from "@/features/workspace/shared/filters/WorkspaceSortMenu";
import { WorkspaceTopbarAddMenu } from "@/features/workspace/shared/ui";
import { useRememberedViewState } from "@/features/workspace/shared/navigation/WorkspaceViewMemory";
import { WorkspaceTopbarControls, buildSingleAddMenuAction } from "@/features/workspace/shared/topbar";

type HistoryReport = BootstrapPayload["reports"][number];

function qaReviewSortGroup(report: HistoryReport) {
  if (report.status !== "reviewed") return 2;
  return typeof report.reviewOrder === "number" ? 0 : 1;
}

export function compareQaRecentReports(left: HistoryReport, right: HistoryReport, direction: "asc" | "desc") {
  const leftGroup = qaReviewSortGroup(left);
  const rightGroup = qaReviewSortGroup(right);
  if (leftGroup !== rightGroup) return leftGroup - rightGroup;

  const factor = direction === "desc" ? -1 : 1;
  const leftValue = leftGroup === 0 ? left.reviewOrder! : leftGroup === 1 ? left.reviewedAt ?? left.createdAt : left.createdAt;
  const rightValue = rightGroup === 0 ? right.reviewOrder! : rightGroup === 1 ? right.reviewedAt ?? right.createdAt : right.createdAt;
  const comparison = typeof leftValue === "number" && typeof rightValue === "number"
    ? leftValue - rightValue
    : String(leftValue).localeCompare(String(rightValue));
  return comparison * factor || left.summary.localeCompare(right.summary);
}

interface WorkLogsViewProps {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  canReviewFindings?: boolean;
  canCreateQaReport?: boolean;
  operationScope?: string;
  viewScope?: string;
  selectedSeasonId?: string | null;
  selectedProjectId?: string | null;
  handleUnauthorized?: () => void;
  loadWorkspace?: () => Promise<unknown>;
  setDataMessage?: (message: string | null) => void;
  membersById: MembersById;
  openCreateQaReportModal: () => void;
  openCreateMilestoneReportModal: () => void;
  openCreateWorkLogModal: () => void;
  openEditTaskModal: (task: TaskRecord) => void;
  onOpenSchedule?: (milestoneId: string) => void;
  subsystemsById: SubsystemsById;
  view: WorklogsViewTab;
}
export function WorkLogsView({ activePersonFilter, bootstrap, canReviewFindings, canCreateQaReport = true, operationScope = "local-anonymous", viewScope = "", selectedSeasonId = null, selectedProjectId = null, handleUnauthorized, loadWorkspace, setDataMessage, membersById, openCreateMilestoneReportModal, openCreateQaReportModal, openCreateWorkLogModal, openEditTaskModal, onOpenSchedule, subsystemsById, view }: WorkLogsViewProps) {
  const state = useWorkLogsViewState({ activePersonFilter, bootstrap, membersById, subsystemsById });
  const readFinding = useCallback((findingId: string, sourceType: "qa" | "test") => fetchFindingForRetest(findingId, sourceType, selectedSeasonId, selectedProjectId, handleUnauthorized), [handleUnauthorized, selectedProjectId, selectedSeasonId]);
  const [reportSort, setReportSort] = useRememberedViewState("history.sort", "recent");
  const [reportSortDirection, setReportSortDirection] = useRememberedViewState<"asc" | "desc">("history.sortDirection", "desc");
  const reports = bootstrap.reports.filter((report) => (view === "qa" ? report.reportType === "qa" : report.reportType !== "qa") && (activePersonFilter.length === 0 || [report.requestedById, report.mentorId, ...report.participantIds].some((id) => id && activePersonFilter.includes(id))) && [report.summary, report.notes, report.result, report.status, ...report.targetRefs.map((ref) => ref.kind === "task" ? state.taskById[ref.id]?.title ?? "" : "")].join(" ").toLowerCase().includes(state.search.toLowerCase())).sort((a, b) => reportSort === "title"
    ? a.summary.localeCompare(b.summary) * (reportSortDirection === "asc" ? 1 : -1)
    : view === "qa"
      ? compareQaRecentReports(a, b, reportSortDirection)
      : a.createdAt.localeCompare(b.createdAt) * (reportSortDirection === "asc" ? 1 : -1));
  return <section className={`panel dense-panel ${WORKSPACE_PANEL_CLASS}`}>
    <AppTopbarSlotPortal slot="controls"><WorkspaceTopbarControls>
      {view === "logs" ? <WorkLogsToolbar bootstrap={bootstrap} renderMode="topbar" search={state.search} setSearch={state.setSearch} setSortMode={state.setSortMode} setSubsystemFilter={state.setSubsystemFilter} sortMode={state.sortMode} sortOptions={state.sortOptions} subsystemFilter={state.subsystemFilter} /> : view === "activity" ? <WorkLogsActivityToolbar activitySortMode={state.activitySortMode} activitySortDirection={state.activitySortDirection} search={state.search} setActivitySortMode={state.setActivitySortMode} setActivitySortDirection={state.setActivitySortDirection} setSearch={state.setSearch} /> : <TopbarResponsiveSearch actions={<WorkspaceSortMenu direction={reportSortDirection} field={reportSort} label="history" onDirectionChange={setReportSortDirection} onFieldChange={setReportSort} options={[{ label: view === "qa" ? "Recent review" : "Date", value: "recent" }, { label: "Title", value: "title" }]} />} ariaLabel="Search report history" compactPlaceholder="Search" onChange={state.setSearch} placeholder="Search report history…" value={state.search} />}
      {view === "qa" && canCreateQaReport ? <WorkspaceTopbarAddMenu actions={buildSingleAddMenuAction({ label: "Add QA report", onSelect: openCreateQaReportModal })} ariaLabel="Add QA report" title="Add QA report" /> : view === "results" ? <WorkspaceTopbarAddMenu actions={buildSingleAddMenuAction({ label: "Add milestone report", onSelect: openCreateMilestoneReportModal })} ariaLabel="Add milestone report" title="Add milestone report" /> : view === "logs" ? <WorkspaceTopbarAddMenu actions={buildSingleAddMenuAction({ label: "Log work", onSelect: openCreateWorkLogModal })} ariaLabel="Log work" title="Log work" /> : null}
    </WorkspaceTopbarControls></AppTopbarSlotPortal>
    {view === "logs" ? <>
      <WorkLogsTableSection membersById={membersById} openEditTaskModal={openEditTaskModal} subsystemsById={subsystemsById} taskById={state.taskById} workLogFilterMotionClass={state.workLogFilterMotionClass} workLogPagination={state.workLogPagination} workLogs={state.workLogs} />
    </> : view === "activity" ? <WorkLogsActivitySection actions={state.activityActions} activityPagination={state.activityPagination} membersById={membersById} openEditTaskModal={openEditTaskModal} subsystemsById={subsystemsById} taskById={state.taskById} /> : view === "qa" ? <QaReportList reports={reports} bootstrap={bootstrap} canReviewFindings={canReviewFindings} operationScope={operationScope} viewScope={viewScope} handleUnauthorized={handleUnauthorized} loadWorkspace={loadWorkspace} setDataMessage={setDataMessage} readFinding={readFinding} onOpenTask={id => { const task = state.taskById[id]; if (task) openEditTaskModal(task); }} onOpenMilestone={onOpenSchedule} /> : <><ReportHistoryList reports={reports} bootstrap={bootstrap} onOpenTask={id => { const task = state.taskById[id]; if (task) openEditTaskModal(task); }} onOpenMilestone={onOpenSchedule} /><TestFindingRetestList bootstrap={bootstrap} canReview={Boolean(canReviewFindings)} handleUnauthorized={handleUnauthorized} operationScope={operationScope} viewScope={viewScope} loadWorkspace={loadWorkspace} setDataMessage={setDataMessage} readFinding={readFinding} /></>}
  </section>;
}
