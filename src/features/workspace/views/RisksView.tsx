import { useMemo, useRef, useState } from "react";

import type { RiskManagementViewTab } from "@/lib/workspaceNavigation";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { RiskPayload } from "@/types/payloads";
import type { TaskRecord } from "@/types/recordsExecution";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import { AttentionView } from "@/features/workspace/views/attention/AttentionView";

import { RiskEditorModal } from "./RiskEditorModal";
import { RiskDetailsModal } from "./RiskDetailsModal";
import { RiskKanbanPanel } from "./risks/RiskKanbanPanel";
import { RiskMetricsPanel } from "./risks/RiskMetricsPanel";
import { riskAuditActions } from "./riskViewData/riskAuditActions";
import { toRiskPayload, useRisksViewModel } from "./riskViewModel";
import { buildRiskAttachmentLookups } from "./riskViewData/riskAttachmentResolvers";
import { filterMetricRows } from "./risks/riskMetricsRows";

interface RisksViewProps {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  isAllProjectsView: boolean;
  onCreateRisk: (payload: RiskPayload) => Promise<void>;
  onDeleteRisk: (riskId: string) => Promise<void>;
  openTaskDetailModal?: (task: TaskRecord) => void;
  onUpdateRisk: (riskId: string, payload: RiskPayload) => Promise<void>;
  view: RiskManagementViewTab;
  includeHealth?: boolean;
  onOpenSource?: (source: string, id: string) => void;
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
  includeHealth = false,
  onOpenSource,
}: RisksViewProps) {
  const [healthOpen, setHealthOpen] = useState(false);
  const [metricsSearch, setMetricsSearch] = useState("");
  const pendingRiskSeverityDropIdsRef = useRef<Set<string>>(new Set());
  const [pendingRiskSeverityDropIds, setPendingRiskSeverityDropIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
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

  const setRiskSeverityDropPending = (riskId: string, isPending: boolean) => {
    const nextPendingIds = new Set(pendingRiskSeverityDropIdsRef.current);
    if (isPending) {
      nextPendingIds.add(riskId);
    } else {
      nextPendingIds.delete(riskId);
    }

    pendingRiskSeverityDropIdsRef.current = nextPendingIds;
    setPendingRiskSeverityDropIds(nextPendingIds);
  };

  const runRiskSeverityDrop = async (
    risk: BootstrapPayload["risks"][number],
    severity: BootstrapPayload["risks"][number]["severity"],
  ) => {
    if (pendingRiskSeverityDropIdsRef.current.has(risk.id)) {
      return;
    }

    setRiskSeverityDropPending(risk.id, true);
    try {
      await onUpdateRisk(risk.id, {
        ...toRiskPayload(risk),
        severity,
      }).catch(() => undefined);
    } finally {
      setRiskSeverityDropPending(risk.id, false);
    }
  };

  return (
    <section className={`panel dense-panel subsystem-manager-shell ${WORKSPACE_PANEL_CLASS}`}>
      {view === "attention" ? (
        <AttentionView
          activePersonFilter={activePersonFilter}
          bootstrap={bootstrap}
          onOpenSource={onOpenSource}
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

      {includeHealth ? <details className="workspace-disclosure" onToggle={event => setHealthOpen(event.currentTarget.open)}><summary>Project health</summary>{healthOpen ? <RiskMetricsPanel mechanismMetrics={filteredMechanismMetrics} metricsSearch={metricsSearch} onMetricsSearchChange={setMetricsSearch} subsystemMetrics={filteredSubsystemMetrics} viewModel={viewModel} embedded /> : null}</details> : null}
      {view === "metrics" ? (
        <RiskMetricsPanel
          mechanismMetrics={filteredMechanismMetrics}
          metricsSearch={metricsSearch}
          onMetricsSearchChange={setMetricsSearch}
          subsystemMetrics={filteredSubsystemMetrics}
          viewModel={viewModel}
        />
      ) : null}

      {view === "kanban" ? (
        <RiskKanbanPanel
          attachmentLookups={attachmentLookups}
          isAllProjectsView={isAllProjectsView}
          onRiskSeverityDrop={runRiskSeverityDrop}
          pendingRiskSeverityDropIds={pendingRiskSeverityDropIds}
          viewModel={viewModel}
        />
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
          auditActions={riskAuditActions(bootstrap.actions, viewModel.activeRisk)}
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
