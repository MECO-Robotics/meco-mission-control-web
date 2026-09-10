import { AppTopbarSlotPortal } from "@/components/layout/AppTopbarSlotPortal";
import { WorkspaceFloatingAddButton } from "@/features/workspace/shared/ui";
import { EditableHoverIndicator } from "@/features/workspace/shared/table/workspaceTableChrome";
import type { BootstrapPayload } from "@/types/bootstrap";

import { KanbanColumns } from "../kanban/KanbanColumns";
import { KanbanScrollFrame } from "../kanban/KanbanScrollFrame";
import { RiskFilterToolbar } from "../RiskFilterToolbar";
import {
  buildRiskAttachmentLookups,
  getRiskMechanismLabel,
  getRiskProjectLabel,
  getRiskWorkflowLabel,
  getWorkflowChipStyle,
} from "../riskViewData/riskAttachmentResolvers";
import {
  RISK_SEVERITY_ORDER,
  formatRiskSeverity,
  getRiskSeverityPillClassName,
  type useRisksViewModel,
} from "../riskViewModel";
import { TaskPriorityBadge } from "../taskQueue/taskQueueKanbanCardMeta";

type RiskRecord = BootstrapPayload["risks"][number];
type RiskSeverity = RiskRecord["severity"];

interface RiskKanbanPanelProps {
  attachmentLookups: ReturnType<typeof buildRiskAttachmentLookups>;
  isAllProjectsView: boolean;
  onRiskSeverityDrop: (risk: RiskRecord, severity: RiskSeverity) => void;
  pendingRiskSeverityDropIds: ReadonlySet<string>;
  viewModel: ReturnType<typeof useRisksViewModel>;
}

export function RiskKanbanPanel({
  attachmentLookups,
  isAllProjectsView,
  onRiskSeverityDrop,
  pendingRiskSeverityDropIds,
  viewModel,
}: RiskKanbanPanelProps) {
  return (
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
            canDragItem={(risk) => !pendingRiskSeverityDropIds.has(risk.id)}
            canDropItem={(risk, severity) =>
              risk.severity !== severity && !pendingRiskSeverityDropIds.has(risk.id)
            }
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
            getItemDragLabel={(risk) => risk.title}
            getItemId={(risk) => risk.id}
            itemsByState={viewModel.risksBySeverity}
            onItemDrop={onRiskSeverityDrop}
            renderItem={(risk, _severity, dragProps) => {
              const projectLabel = getRiskProjectLabel(risk, attachmentLookups);
              const workflowLabel = getRiskWorkflowLabel(risk, attachmentLookups);
              const mechanismLabel = getRiskMechanismLabel(risk, attachmentLookups);
              const { className: dragClassName, ...dragRootProps } = dragProps ?? {};

              return (
                <button
                  {...dragRootProps}
                  className={`task-queue-board-card editable-hover-target editable-hover-target-row${
                    dragClassName ? ` ${dragClassName}` : ""
                  }`}
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
  );
}
