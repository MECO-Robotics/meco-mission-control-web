import type { RiskManagementViewTab } from "@/lib/workspaceNavigation";
import type { BootstrapPayload, RiskPayload } from "@/types";
import {
  EditableHoverIndicator,
  type FilterSelection,
  PaginationControls,
  TableCell,
} from "@/features/workspace/shared";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared";
import { KanbanColumns } from "@/features/workspace/views/kanban/KanbanColumns";

import { RiskEditorModal } from "./RiskEditorModal";
import { RiskFilterToolbar } from "./RiskFilterToolbar";
import { RiskMetricsSection } from "./RiskMetricsSection";
import {
  ATTACHMENT_TYPE_LABELS,
  RISK_SEVERITY_ORDER,
  formatRiskSeverity,
  getRiskSeverityPillClassName,
  useRisksViewModel,
} from "./riskViewModel";

interface RisksViewProps {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  onCreateRisk: (payload: RiskPayload) => Promise<void>;
  onDeleteRisk: (riskId: string) => Promise<void>;
  onUpdateRisk: (riskId: string, payload: RiskPayload) => Promise<void>;
  view: RiskManagementViewTab;
}

export function RisksView({
  activePersonFilter,
  bootstrap,
  onCreateRisk,
  onDeleteRisk,
  onUpdateRisk,
  view,
}: RisksViewProps) {
  const viewModel = useRisksViewModel({
    activePersonFilter,
    bootstrap,
    onCreateRisk,
    onDeleteRisk,
    onUpdateRisk,
  });

  return (
    <section className={`panel dense-panel subsystem-manager-shell ${WORKSPACE_PANEL_CLASS}`}>
      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2 style={{ color: "var(--text-title)" }}>
            {view === "metrics" ? "Operations metrics" : "Risk management"}
          </h2>
          <p className="section-copy filter-copy" style={{ color: "var(--text-copy)" }}>
            {view === "metrics"
              ? "Track planning, triage, subsystem health, and mechanism health from one view."
              : "Track active risk exposure, evidence source, and mitigation ownership in one place."}
          </p>
        </div>
      </div>

      {view === "metrics" ? (
        <RiskMetricsSection
          activeMechanismCount={viewModel.activeMechanismCount}
          activeSubsystemCount={viewModel.activeSubsystemCount}
          attendanceHours={viewModel.attendanceHours}
          blockerCount={viewModel.blockerCount}
          clampedCompletionWidth={viewModel.clampedCompletionWidth}
          completionRate={viewModel.completionRate}
          completedTaskCount={viewModel.completedTaskCount}
          deliveredPurchases={viewModel.deliveredPurchases}
          loggedHours={viewModel.loggedHours}
          lowStockMaterials={viewModel.lowStockMaterials}
          maxMetricHours={viewModel.maxMetricHours}
          mechanismMetrics={viewModel.mechanismMetrics}
          plannedHours={viewModel.plannedHours}
          qaPassCount={viewModel.qaPassCount}
          scopedTaskCount={viewModel.totalTaskCount}
          subsystemMetrics={viewModel.subsystemMetrics}
          supplySignals={viewModel.supplySignals}
          totalMechanismCount={viewModel.totalMechanismCount}
          totalSubsystemCount={viewModel.totalSubsystemCount}
          waitingForQaCount={viewModel.waitingForQaCount}
        />
      ) : null}

      {view === "kanban" ? (
        <>
          <RiskFilterToolbar
            onAddRisk={viewModel.openCreateEditor}
            onSearchChange={viewModel.setSearch}
            onSeverityFilterChange={viewModel.setSeverityFilter}
            onSourceFilterChange={viewModel.setSourceFilter}
            search={viewModel.search}
            severityFilter={viewModel.severityFilter}
            sourceFilter={viewModel.sourceFilter}
          />

          <div className={"task-queue-board-shell-frame " + viewModel.riskFilterMotionClass}>
            <div className="table-shell task-queue-board-shell">
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
                        {formatRiskSeverity(severity)}
                      </span>
                    ),
                  }))}
                  emptyLabel="No risks"
                  itemsByState={viewModel.risksBySeverity}
                  renderItem={(risk) => {
                    const mitigationLabel = viewModel.getMitigationLabel(risk);
                    const sourceLabel = viewModel.getSourceLabel(risk);
                    const attachmentLabel = `${ATTACHMENT_TYPE_LABELS[risk.attachmentType]}: ${viewModel.getAttachmentLabel(risk)}`;

                    return (
                      <button
                        className="task-queue-board-card editable-hover-target editable-hover-target-row"
                        key={risk.id}
                        onClick={() => viewModel.openEditEditor(risk)}
                        type="button"
                      >
                        <div className="task-queue-board-card-header">
                          <strong>{risk.title}</strong>
                        </div>
                        <small className="task-queue-board-card-summary">{risk.detail}</small>
                        <div className="task-queue-board-card-meta">
                          <span className="task-queue-board-card-context-chip" title={attachmentLabel}>
                            {attachmentLabel}
                          </span>
                          <span
                            className="task-queue-board-card-context-chip"
                            title={"Mitigation: " + mitigationLabel}
                          >
                            {mitigationLabel}
                          </span>
                          <span className="task-queue-board-card-context-chip" title={sourceLabel}>
                            {sourceLabel}
                          </span>
                        </div>
                        <EditableHoverIndicator className="task-queue-board-card-hover" />
                      </button>
                    );
                  }}
                />
              ) : (
                <p className="empty-state">No risks match the current filters.</p>
              )}
            </div>
          </div>
        </>
      ) : null}

      {view === "risks" ? (
        <>
          <RiskFilterToolbar
            onAddRisk={viewModel.openCreateEditor}
            onSearchChange={viewModel.setSearch}
            onSeverityFilterChange={viewModel.setSeverityFilter}
            onSourceFilterChange={viewModel.setSourceFilter}
            search={viewModel.search}
            severityFilter={viewModel.severityFilter}
            sourceFilter={viewModel.sourceFilter}
          />

          <div className={`table-shell subsystem-manager-list-shell ${viewModel.riskFilterMotionClass}`}>
            <div
              className="ops-table ops-table-header subsystem-manager-table-header"
              style={{
                gridTemplateColumns: "minmax(220px, 2fr) 0.8fr 1.2fr 1.2fr 1fr",
                borderBottom: "1px solid var(--border-base)",
                color: "var(--text-copy)",
              }}
            >
              <span style={{ textAlign: "left" }}>Risk</span>
              <span>Severity</span>
              <span>Source</span>
              <span>Attachment</span>
              <span>Mitigation</span>
            </div>

            {viewModel.pagination.pageItems.map((risk) => (
              <div
                className="ops-table ops-row subsystem-manager-row editable-row-clickable editable-hover-target editable-hover-target-row"
                key={risk.id}
                onClick={() => viewModel.openEditEditor(risk)}
                onKeyDown={(milestone) => {
                  if (milestone.target !== milestone.currentTarget) {
                    return;
                  }

                  if (milestone.key === "Enter" || milestone.key === " ") {
                    milestone.preventDefault();
                    viewModel.openEditEditor(risk);
                  }
                }}
                role="button"
                tabIndex={0}
                style={{
                  gridTemplateColumns: "minmax(220px, 2fr) 0.8fr 1.2fr 1.2fr 1fr",
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--border-base)",
                  color: "var(--text-copy)",
                  background: "var(--row-bg, var(--bg-row-alt))",
                }}
              >
                <TableCell label="Risk">
                  <strong style={{ color: "var(--text-title)" }}>{risk.title}</strong>
                  <small>{risk.detail}</small>
                </TableCell>
                <TableCell label="Severity" valueClassName="table-cell-pill">
                  {risk.severity}
                </TableCell>
                <TableCell label="Source">{viewModel.getSourceLabel(risk)}</TableCell>
                <TableCell label="Attachment">
                  <strong style={{ color: "var(--text-title)" }}>
                    {ATTACHMENT_TYPE_LABELS[risk.attachmentType]}
                  </strong>
                  <small>{viewModel.getAttachmentLabel(risk)}</small>
                </TableCell>
                <TableCell label="Mitigation">{viewModel.getMitigationLabel(risk)}</TableCell>
                <EditableHoverIndicator />
              </div>
            ))}

            {viewModel.filteredRows.length === 0 ? (
              <p className="empty-state">No risks match the current filters.</p>
            ) : null}
          </div>

          <PaginationControls
            label="Risk table"
            onPageChange={viewModel.pagination.setPage}
            onPageSizeChange={viewModel.pagination.setPageSize}
            page={viewModel.pagination.page}
            pageSize={viewModel.pagination.pageSize}
            pageSizeOptions={viewModel.pagination.pageSizeOptions}
            rangeEnd={viewModel.pagination.rangeEnd}
            rangeStart={viewModel.pagination.rangeStart}
            totalItems={viewModel.pagination.totalItems}
            totalPages={viewModel.pagination.totalPages}
          />
        </>
      ) : null}

      <RiskEditorModal
        attachmentOptions={viewModel.attachmentOptions}
        draft={viewModel.draft}
        editorError={viewModel.editorError}
        editorMode={viewModel.editorMode}
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
    </section>
  );
}

