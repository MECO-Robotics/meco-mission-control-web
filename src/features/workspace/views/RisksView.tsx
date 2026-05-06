import { useMemo } from "react";

import type { CSSProperties } from "react";
import type { RiskManagementViewTab } from "@/lib/workspaceNavigation";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { RiskPayload } from "@/types/payloads";
import type { RiskRecord } from "@/types/recordsReporting";
import { EditableHoverIndicator } from "@/features/workspace/shared/table/workspaceTableChrome";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import { KanbanColumns } from "@/features/workspace/views/kanban/KanbanColumns";
import { resolveWorkspaceColor } from "@/features/workspace/shared/model/workspaceColors";

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
import { TaskPriorityBadge } from "./taskQueue/taskQueueKanbanCardMeta";

interface RisksViewProps {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  isAllProjectsView: boolean;
  onCreateRisk: (payload: RiskPayload) => Promise<void>;
  onDeleteRisk: (riskId: string) => Promise<void>;
  onUpdateRisk: (riskId: string, payload: RiskPayload) => Promise<void>;
  view: RiskManagementViewTab;
}

export function RisksView({
  activePersonFilter,
  bootstrap,
  isAllProjectsView,
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
  const projectsById = useMemo(
    () => Object.fromEntries(bootstrap.projects.map((project) => [project.id, project] as const)),
    [bootstrap.projects],
  );
  const workstreamsById = useMemo(
    () =>
      Object.fromEntries(bootstrap.workstreams.map((workstream) => [workstream.id, workstream] as const)),
    [bootstrap.workstreams],
  );
  const mechanismsById = useMemo(
    () =>
      Object.fromEntries(bootstrap.mechanisms.map((mechanism) => [mechanism.id, mechanism] as const)),
    [bootstrap.mechanisms],
  );
  const partInstancesById = useMemo(
    () =>
      Object.fromEntries(bootstrap.partInstances.map((partInstance) => [partInstance.id, partInstance] as const)),
    [bootstrap.partInstances],
  );
  const subsystemsById = useMemo(
    () => Object.fromEntries(bootstrap.subsystems.map((subsystem) => [subsystem.id, subsystem] as const)),
    [bootstrap.subsystems],
  );
  const tasksById = useMemo(
    () => Object.fromEntries(bootstrap.tasks.map((task) => [task.id, task] as const)),
    [bootstrap.tasks],
  );
  const reportsById = useMemo(
    () => Object.fromEntries(bootstrap.reports.map((report) => [report.id, report] as const)),
    [bootstrap.reports],
  );

  const getRiskSourceTask = (risk: RiskRecord) => {
    const source = reportsById[risk.sourceId];
    return source?.taskId ? tasksById[source.taskId] : null;
  };

  const getRiskProjectLabel = (risk: RiskRecord) => {
    if (risk.attachmentType === "project") {
      return projectsById[risk.attachmentId]?.name ?? "Unknown project";
    }

    if (risk.attachmentType === "workstream") {
      const workstream = workstreamsById[risk.attachmentId];
      return workstream ? projectsById[workstream.projectId]?.name ?? "Unknown project" : "Unknown project";
    }

    if (risk.attachmentType === "mechanism") {
      const mechanism = mechanismsById[risk.attachmentId];
      const subsystem = mechanism ? subsystemsById[mechanism.subsystemId] : null;
      return subsystem ? projectsById[subsystem.projectId]?.name ?? "Unknown project" : "Unknown project";
    }

    if (risk.attachmentType === "part-instance") {
      const partInstance = partInstancesById[risk.attachmentId];
      const subsystem = partInstance ? subsystemsById[partInstance.subsystemId] : null;
      return subsystem ? projectsById[subsystem.projectId]?.name ?? "Unknown project" : "Unknown project";
    }

    const sourceTask = getRiskSourceTask(risk);
    return sourceTask ? projectsById[sourceTask.projectId]?.name ?? "Unknown project" : "Unknown project";
  };

  const getRiskWorkflowLabel = (risk: RiskRecord) => {
    if (risk.attachmentType === "workstream") {
      return workstreamsById[risk.attachmentId]?.name ?? "Unknown workflow";
    }

    const sourceTask = getRiskSourceTask(risk);
    const workflowId = sourceTask?.workstreamId || sourceTask?.workstreamIds?.[0];
    return workflowId ? workstreamsById[workflowId]?.name ?? "Unknown workflow" : "Unassigned workflow";
  };

  const getRiskWorkflowColor = (risk: RiskRecord) => {
    if (risk.attachmentType === "workstream") {
      const workstream = workstreamsById[risk.attachmentId];
      const workflowId = workstream ? workstream.id : risk.attachmentId;
      return resolveWorkspaceColor(workstream?.color, workflowId);
    }

    const sourceTask = getRiskSourceTask(risk);
    const workflowId = sourceTask?.workstreamId || sourceTask?.workstreamIds?.[0];
    return workflowId && workstreamsById[workflowId]
      ? resolveWorkspaceColor(workstreamsById[workflowId]?.color, workflowId)
      : resolveWorkspaceColor(null, risk.id);
  };

  const getWorkflowChipStyle = (risk: RiskRecord): CSSProperties | undefined => {
    const workflowColor = getRiskWorkflowColor(risk);

    return {
      "--task-queue-board-card-context-accent": workflowColor,
      "--task-queue-board-card-context-bg": `color-mix(in srgb, ${workflowColor} 24%, transparent)`,
      "--task-queue-board-card-context-border": `color-mix(in srgb, ${workflowColor} 54%, transparent)`,
    } as CSSProperties;
  };

  const getRiskMechanismLabel = (risk: RiskRecord) => {
    if (risk.attachmentType === "mechanism") {
      const mechanism = mechanismsById[risk.attachmentId];
      return mechanism ? mechanism.name : null;
    }

    if (risk.attachmentType === "part-instance") {
      const partInstance = partInstancesById[risk.attachmentId];
      if (partInstance?.mechanismId) {
        return mechanismsById[partInstance.mechanismId]?.name ?? null;
      }
    }

    const sourceTask = getRiskSourceTask(risk);
    const mechanismId = sourceTask?.mechanismId || sourceTask?.mechanismIds?.[0];
    return mechanismId ? mechanismsById[mechanismId]?.name ?? null : null;
  };

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
                    const projectLabel = getRiskProjectLabel(risk);
                    const workflowLabel = getRiskWorkflowLabel(risk);
                    const mechanismLabel = getRiskMechanismLabel(risk);

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
                                style={getWorkflowChipStyle(risk)}
                              >
                                {workflowLabel}
                              </span>
                            </>
                          ) : (
                            <>
                              <span
                                className="task-queue-board-card-context-chip task-queue-board-card-context-chip-due-style"
                                title={workflowLabel}
                                style={getWorkflowChipStyle(risk)}
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
            </div>
          </div>
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
