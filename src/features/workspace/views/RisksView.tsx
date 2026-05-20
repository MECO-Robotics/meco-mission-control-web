import { useMemo, useState } from "react";

import { AppTopbarSlotPortal } from "@/components/layout/AppTopbarSlotPortal";
import type { RiskManagementViewTab } from "@/lib/workspaceNavigation";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { RiskPayload } from "@/types/payloads";
import type { TaskRecord } from "@/types/recordsExecution";
import { WorkspaceFloatingAddButton } from "@/features/workspace/shared/ui";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import { EditableHoverIndicator } from "@/features/workspace/shared/table/workspaceTableChrome";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import { KanbanColumns } from "@/features/workspace/views/kanban/KanbanColumns";
import { KanbanScrollFrame } from "@/features/workspace/views/kanban/KanbanScrollFrame";
import { AttentionView } from "@/features/workspace/views/attention/AttentionView";

import { RiskEditorModal } from "./RiskEditorModal";
import { RiskDetailsModal } from "./RiskDetailsModal";
import { RiskFilterToolbar } from "./RiskFilterToolbar";
import { RiskMetricsSection } from "./RiskMetricsSection";
import {
  RISK_SEVERITY_ORDER,
  formatRiskSeverity,
  getRiskSeverityPillClassName,
  useRisksViewModel,
} from "./riskViewModel";
import {
  buildRiskAttachmentLookups,
  getRiskMechanismLabel,
  getRiskProjectLabel,
  getRiskWorkflowLabel,
  getWorkflowChipStyle,
} from "./riskViewData/riskAttachmentResolvers";
import { TaskPriorityBadge } from "./taskQueue/taskQueueKanbanCardMeta";
import type { ScopeMetricRow } from "./RiskMetrics";

interface RisksViewProps {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  isAllProjectsView: boolean;
  onCreateRisk: (payload: RiskPayload) => Promise<void>;
  onDeleteRisk: (riskId: string) => Promise<void>;
  openTaskDetailModal?: (task: TaskRecord) => void;
  onUpdateRisk: (riskId: string, payload: RiskPayload) => Promise<void>;
  view: RiskManagementViewTab;
}

function filterMetricRows(rows: ScopeMetricRow[], search: string) {
  const normalizedSearch = search.trim().toLowerCase();
  if (normalizedSearch.length === 0) {
    return rows;
  }

  return rows.filter((row) =>
    [row.name, row.subtitle, row.ownerLabel, row.mostSevereReason]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearch),
  );
}

export function RisksView({
  activePersonFilter,
  bootstrap,
  isAllProjectsView,
  onCreateRisk,
  onDeleteRisk,
  openTaskDetailModal,
  onUpdateRisk,
  view,
}: RisksViewProps) {
  const [metricsSearch, setMetricsSearch] = useState("");
  const viewModel = useRisksViewModel({
    activePersonFilter,
    bootstrap,
    onCreateRisk,
    onDeleteRisk,
    onUpdateRisk,
  });
  const attachmentLookups = useMemo(() => buildRiskAttachmentLookups(bootstrap), [bootstrap]);
  const filteredSubsystemMetrics = useMemo(
    () => filterMetricRows(viewModel.subsystemMetrics, metricsSearch),
    [metricsSearch, viewModel.subsystemMetrics],
  );
  const filteredMechanismMetrics = useMemo(
    () => filterMetricRows(viewModel.mechanismMetrics, metricsSearch),
    [metricsSearch, viewModel.mechanismMetrics],
  );

  return (
    <section className={`panel dense-panel subsystem-manager-shell ${WORKSPACE_PANEL_CLASS}`}>
      {view === "attention" ? (
        <AttentionView
          activePersonFilter={activePersonFilter}
          bootstrap={bootstrap}
          onOpenRisk={(riskId) => {
            const targetRisk = bootstrap.risks.find((risk) => risk.id === riskId);
            if (targetRisk) {
              viewModel.openRiskDetails(targetRisk);
            }
          }}
          onOpenTask={(taskId) => {
            const task = attachmentLookups.tasksById[taskId];
            if (task && openTaskDetailModal) {
              openTaskDetailModal(task);
            }
          }}
        />
      ) : null}

      {view === "metrics" ? (
        <>
          <AppTopbarSlotPortal slot="controls">
            <div className="panel-actions filter-toolbar risk-metrics-toolbar">
              <TopbarResponsiveSearch
                ariaLabel="Search metrics"
                compactPlaceholder="Search"
                onChange={setMetricsSearch}
                placeholder="Search metrics..."
                value={metricsSearch}
              />
            </div>
          </AppTopbarSlotPortal>

          <RiskMetricsSection
            blockerBreakdown={viewModel.blockerBreakdown}
            buildHealthActions={viewModel.buildHealthActions}
            buildHealthReasons={viewModel.buildHealthReasons}
            buildHealthStatus={viewModel.buildHealthStatus}
            expectedProgressRate={viewModel.expectedProgressRate}
            activeMechanismCount={viewModel.activeMechanismCount}
            activeSubsystemCount={viewModel.activeSubsystemCount}
            completedTaskCount={viewModel.completedTaskCount}
            hoursLoggedRate={viewModel.hoursLoggedRate}
            clampedCompletionWidth={viewModel.clampedCompletionWidth}
            loggedHours={viewModel.loggedHours}
            logsThisWeekHours={viewModel.logsThisWeekHours}
            lowStockMaterials={viewModel.lowStockMaterials}
            mechanismMetrics={filteredMechanismMetrics}
            mentorActionRequiredCount={viewModel.mentorActionRequiredCount}
            oldestBlockerAgeDays={viewModel.oldestBlockerAgeDays}
            oldestQaWaitingAgeDays={viewModel.oldestQaWaitingAgeDays}
            ownerlessTaskCount={viewModel.ownerlessTaskCount}
            pendingPurchaseCount={viewModel.pendingPurchaseCount}
            planStatus={viewModel.planStatus}
            plannedHours={viewModel.plannedHours}
            qaPassCount={viewModel.qaPassCount}
            qaWaitingCount={viewModel.qaWaitingCount}
            remainingPlannedHours={viewModel.remainingPlannedHours}
            scopedTaskCount={viewModel.totalTaskCount}
            staleSubsystemCount={viewModel.staleSubsystemCount}
            staleTaskCount={viewModel.staleTaskCount}
            staleTaskThresholdDays={viewModel.staleTaskThresholdDays}
            staleTaskUnavailableCount={viewModel.staleTaskUnavailableCount}
            studentRevisionRequiredCount={viewModel.studentRevisionRequiredCount}
            subsystemMetrics={filteredSubsystemMetrics}
            supplySignals={viewModel.supplySignals}
            taskCompletionRate={viewModel.taskCompletionRate}
            taskCompletionWidth={viewModel.taskCompletionWidth}
            totalMechanismCount={viewModel.totalMechanismCount}
            totalSubsystemCount={viewModel.totalSubsystemCount}
            untouchedMechanismCount={viewModel.untouchedMechanismCount}
            unresolvedBlockerCount={viewModel.unresolvedBlockerCount}
          />
        </>
      ) : null}

      {view === "kanban" ? (
        <>
          <AppTopbarSlotPortal slot="controls">
            <RiskFilterToolbar
              onSearchChange={viewModel.setSearch}
              onSeverityFilterChange={viewModel.setSeverityFilter}
              onSortFieldChange={viewModel.setSortField}
              onSortOrderChange={viewModel.setSortOrder}
              onSourceFilterChange={viewModel.setSourceFilter}
              search={viewModel.search}
              severityFilter={viewModel.severityFilter}
              sortField={viewModel.sortField}
              sortOrder={viewModel.sortOrder}
              sourceFilter={viewModel.sourceFilter}
            />
          </AppTopbarSlotPortal>

          <WorkspaceFloatingAddButton
            ariaLabel="Add risk"
            onClick={viewModel.openCreateEditor}
            title="Add risk"
          />

          <KanbanScrollFrame motionClassName={viewModel.riskFilterMotionClass}>
            {viewModel.filteredRows.length > 0 ? (
              <KanbanColumns
                boardClassName="risk-board"
                columnBodyClassName="task-queue-board-column-body"
                columnClassName="task-queue-board-column"
                columnCountClassName="task-queue-board-column-count"
                columnEmptyClassName="task-queue-board-column-empty"
                columnHeaderClassName="task-queue-board-column-header"
                columns={RISK_SEVERITY_ORDER.map((severity) => ({
                  state: severity,
                  count: viewModel.risksBySeverity[severity].length,
                  header: (
                    <span className={getRiskSeverityPillClassName(severity)}>
                      <span aria-hidden="true" className="task-queue-board-column-header-icon">
                        <TaskPriorityBadge priority={severity} />
                      </span>
                      <span className="task-queue-board-column-header-label">
                        {formatRiskSeverity(severity)}
                      </span>
                    </span>
                  ),
                }))}
                emptyLabel="No risks"
                itemsByState={viewModel.risksBySeverity}
                renderItem={(risk) => {
                  const projectLabel = getRiskProjectLabel(risk, attachmentLookups);
                  const workflowLabel = getRiskWorkflowLabel(risk, attachmentLookups);
                  const mechanismLabel = getRiskMechanismLabel(risk, attachmentLookups);

                  return (
                    <button
                      className="task-queue-board-card editable-hover-target editable-hover-target-row"
                      key={risk.id}
                      onClick={() => viewModel.openRiskDetails(risk)}
                      type="button"
                    >
                      <div className="task-queue-board-card-header">
                        <strong>{risk.title}</strong>
                      </div>
                      <small className="task-queue-board-card-summary task-queue-board-card-summary-task">
                        {risk.detail}
                      </small>
                      <div className="task-queue-board-card-meta">
                        {isAllProjectsView ? (
                          <>
                            <span
                              className="task-queue-board-card-context-chip task-queue-board-card-context-chip-due-style"
                              title={projectLabel}
                            >
                              {projectLabel}
                            </span>
                            <span
                              className="task-queue-board-card-context-chip task-queue-board-card-context-chip-due-style"
                              title={workflowLabel}
                              style={getWorkflowChipStyle(risk, attachmentLookups)}
                            >
                              {workflowLabel}
                            </span>
                          </>
                        ) : (
                          <>
                            <span
                              className="task-queue-board-card-context-chip task-queue-board-card-context-chip-due-style"
                              title={workflowLabel}
                              style={getWorkflowChipStyle(risk, attachmentLookups)}
                            >
                              {workflowLabel}
                            </span>
                            {mechanismLabel ? (
                              <span
                                className="task-queue-board-card-context-chip"
                                title={`Mechanism: ${mechanismLabel}`}
                              >
                                {mechanismLabel}
                              </span>
                            ) : null}
                          </>
                        )}
                      </div>
                      <EditableHoverIndicator className="task-queue-board-card-hover" />
                    </button>
                  );
                }}
              />
            ) : (
              <p className="empty-state">No risks match the current filters.</p>
            )}
          </KanbanScrollFrame>
        </>
      ) : null}

      <RiskEditorModal
        attachmentOptions={viewModel.attachmentOptions}
        draft={viewModel.draft}
        editorError={viewModel.editorError}
        editorMode={viewModel.editorMode === "detail" ? null : viewModel.editorMode}
        getAttachmentOptionsForType={viewModel.getAttachmentOptionsForType}
        getSourceOptionsForType={viewModel.getSourceOptionsForType}
        isDeleting={viewModel.isDeleting}
        isSaving={viewModel.isSaving}
        mitigationTaskOptions={viewModel.mitigationTaskOptions}
        onClose={viewModel.closeEditor}
        onDelete={() => void viewModel.handleDeleteRisk()}
        onSave={() => void viewModel.handleSaveRisk()}
        setDraft={viewModel.setDraft}
        sourceOptions={viewModel.sourceOptions}
      />
      {viewModel.editorMode === "detail" && viewModel.activeRisk ? (
        <RiskDetailsModal
          activeRisk={viewModel.activeRisk}
          getAttachmentLabel={viewModel.getAttachmentLabel}
          getMitigationLabel={viewModel.getMitigationLabel}
          getSourceLabel={viewModel.getSourceLabel}
          onClose={viewModel.closeEditor}
          onEditRisk={() => viewModel.openEditEditor(viewModel.activeRisk!)}
        />
      ) : null}
    </section>
  );
}
