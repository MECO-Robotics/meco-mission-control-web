import type { RiskManagementViewTab } from "@/lib/workspaceNavigation";
import type { BootstrapPayload, RiskPayload } from "@/types";
import { EditableHoverIndicator, type FilterSelection } from "@/features/workspace/shared";
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
