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
import { filterTestResultsForHistory } from "./workLogs/workLogsViewStateData";
import { WorkLogsActivitySection } from "./workLogs/WorkLogsActivitySection";
import { WorkLogsActivityToolbar } from "./workLogs/WorkLogsActivityToolbar";
import { WorkLogsTableSection } from "./workLogs/WorkLogsTableSection";
import { WorkLogsToolbar } from "./workLogs/WorkLogsToolbar";
import { ResultsReportList } from "./workLogs/ResultsReportList";
import { TestFindingRetestList } from "./workLogs/TestFindingRetestList";
import { WorkspaceSortMenu } from "@/features/workspace/shared/filters/WorkspaceSortMenu";
import { WorkspaceTopbarAddMenu } from "@/features/workspace/shared/ui";
import { useRememberedViewState } from "@/features/workspace/shared/navigation/WorkspaceViewMemory";
import { WorkspaceTopbarControls, buildSingleAddMenuAction, buildTopbarAddMenuActions, makeAddMenuAction } from "@/features/workspace/shared/topbar";

type HistoryReport = BootstrapPayload["reports"][number];

function effectiveReportDate(report: HistoryReport) {
  return report.reportType === "qa" && report.status === "reviewed"
    ? report.reviewedAt ?? report.createdAt
    : report.createdAt;
}

export function compareRecentReports(left: HistoryReport, right: HistoryReport, direction: "asc" | "desc") {
  const factor = direction === "desc" ? -1 : 1;
  const dateOrder = effectiveReportDate(left).localeCompare(effectiveReportDate(right));
  return dateOrder * factor || left.summary.localeCompare(right.summary);
}

interface WorkLogsViewProps {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  canReviewFindings?: boolean;
  canCreateQaReport?: boolean;
  localActorMemberId?: string | null;
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
export function WorkLogsView({ activePersonFilter, bootstrap, canReviewFindings, canCreateQaReport = true, localActorMemberId, operationScope = "local-anonymous", viewScope = "", selectedSeasonId = null, selectedProjectId = null, handleUnauthorized, loadWorkspace, setDataMessage, membersById, openCreateMilestoneReportModal, openCreateQaReportModal, openCreateWorkLogModal, openEditTaskModal, onOpenSchedule, subsystemsById, view }: WorkLogsViewProps) {
  const state = useWorkLogsViewState({ activePersonFilter, bootstrap, membersById, subsystemsById });
  const readFinding = useCallback((findingId: string, sourceType: "qa" | "test") => fetchFindingForRetest(findingId, sourceType, selectedSeasonId, selectedProjectId, handleUnauthorized), [handleUnauthorized, selectedProjectId, selectedSeasonId]);
  const [reportSort, setReportSort] = useRememberedViewState("history.sort", "recent");
  const [reportSortDirection, setReportSortDirection] = useRememberedViewState<"asc" | "desc">("history.sortDirection", "desc");
  const reports = bootstrap.reports.filter((report) => {
    const matchesPerson = activePersonFilter.length === 0 || [report.requestedById, report.mentorId, ...report.participantIds]
      .some((id) => id && activePersonFilter.includes(id));
    const targets = report.targetRefs.map((ref) => ref.kind === "task"
      ? state.taskById[ref.id]?.title ?? ""
      : ref.kind === "milestone"
        ? bootstrap.milestones.find((milestone) => milestone.id === ref.id)?.title ?? ""
        : ref.id);
    return matchesPerson && [report.summary, report.notes, report.result, report.status, ...targets]
      .join(" ").toLowerCase().includes(state.search.toLowerCase());
  }).sort((a, b) => reportSort === "title"
    ? a.summary.localeCompare(b.summary) * (reportSortDirection === "asc" ? 1 : -1)
    : compareRecentReports(a, b, reportSortDirection));
  const testResults = filterTestResultsForHistory(bootstrap.testResults, activePersonFilter, state.search, state.taskById);
  const addReportLabel = canCreateQaReport ? "Add report" : "Add milestone report";
  return <section className={`panel dense-panel ${WORKSPACE_PANEL_CLASS}`}>
    <AppTopbarSlotPortal slot="controls"><WorkspaceTopbarControls>
      {view === "logs" ? <WorkLogsToolbar bootstrap={bootstrap} renderMode="topbar" search={state.search} setSearch={state.setSearch} setSortMode={state.setSortMode} setSubsystemFilter={state.setSubsystemFilter} sortMode={state.sortMode} sortOptions={state.sortOptions} subsystemFilter={state.subsystemFilter} /> : view === "activity" ? <WorkLogsActivityToolbar activitySortMode={state.activitySortMode} activitySortDirection={state.activitySortDirection} search={state.search} setActivitySortMode={state.setActivitySortMode} setActivitySortDirection={state.setActivitySortDirection} setSearch={state.setSearch} /> : <TopbarResponsiveSearch actions={<WorkspaceSortMenu direction={reportSortDirection} field={reportSort} label="results" onDirectionChange={setReportSortDirection} onFieldChange={setReportSort} options={[{ label: "Recent", value: "recent" }, { label: "Title", value: "title" }]} />} ariaLabel="Search results" compactPlaceholder="Search" onChange={state.setSearch} placeholder="Search results…" value={state.search} />}
      {view === "reports" ? <WorkspaceTopbarAddMenu actions={canCreateQaReport
        ? buildTopbarAddMenuActions(
          makeAddMenuAction("Add QA report", openCreateQaReportModal),
          makeAddMenuAction("Add milestone report", openCreateMilestoneReportModal),
        )
        : buildSingleAddMenuAction({ label: "Add milestone report", onSelect: openCreateMilestoneReportModal })} ariaLabel={addReportLabel} title={addReportLabel} /> : view === "logs" ? <WorkspaceTopbarAddMenu actions={buildSingleAddMenuAction({ label: "Log work", onSelect: openCreateWorkLogModal })} ariaLabel="Log work" title="Log work" /> : null}
    </WorkspaceTopbarControls></AppTopbarSlotPortal>
    {view === "logs" ? <>
      <WorkLogsTableSection membersById={membersById} openEditTaskModal={openEditTaskModal} subsystemsById={subsystemsById} taskById={state.taskById} workLogFilterMotionClass={state.workLogFilterMotionClass} workLogPagination={state.workLogPagination} workLogs={state.workLogs} />
    </> : view === "activity" ? <WorkLogsActivitySection actions={state.activityActions} activityPagination={state.activityPagination} membersById={membersById} openEditTaskModal={openEditTaskModal} subsystemsById={subsystemsById} taskById={state.taskById} /> : <><ResultsReportList reports={reports} bootstrap={bootstrap} canReviewFindings={canReviewFindings} localActorMemberId={localActorMemberId} operationScope={operationScope} viewScope={viewScope} handleUnauthorized={handleUnauthorized} loadWorkspace={loadWorkspace} setDataMessage={setDataMessage} readFinding={readFinding} onOpenTask={id => { const task = state.taskById[id]; if (task) openEditTaskModal(task); }} onOpenMilestone={onOpenSchedule} /><TestFindingRetestList bootstrap={bootstrap} testResults={testResults} canReview={Boolean(canReviewFindings)} handleUnauthorized={handleUnauthorized} localActorMemberId={localActorMemberId} operationScope={operationScope} viewScope={viewScope} loadWorkspace={loadWorkspace} setDataMessage={setDataMessage} readFinding={readFinding} /></>}
  </section>;
}
