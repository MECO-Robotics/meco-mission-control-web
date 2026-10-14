import { useEffect, useState } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { RiskPayload } from "@/types/payloads";
import type { TaskRecord } from "@/types/recordsExecution";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";

import { RiskEditorModal } from "./RiskEditorModal";
import { RiskDetailsModal } from "./RiskDetailsModal";
import { RiskMetricsSection } from "./RiskMetricsSection";
import { riskAuditActions } from "./riskViewData/riskAuditActions";
import { useRisksViewModel } from "./riskViewModel";
import { RiskTriageQueue } from "./risks/RiskTriageQueue";

interface RisksViewProps {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  onDeleteRisk: (riskId: string) => Promise<void>;
  onCreateRisk: (payload: RiskPayload) => Promise<void>;
  openTaskDetailModal?: (task: TaskRecord) => void;
  onUpdateRisk: (riskId: string, payload: Partial<RiskPayload>) => Promise<void>;
  onOpenSchedule?: (milestoneId: string) => void;
  selectedRiskId?: string | null;
}

export function RisksView({
  activePersonFilter,
  bootstrap,
  onDeleteRisk,
  onCreateRisk,
  openTaskDetailModal,
  onUpdateRisk,
  onOpenSchedule,
  selectedRiskId,
}: RisksViewProps) {
  const [healthOpen, setHealthOpen] = useState(false);
  const viewModel = useRisksViewModel({
    activePersonFilter,
    bootstrap,
    onDeleteRisk,
    onCreateRisk,
    onUpdateRisk,
  });
  const openRiskDetails = viewModel.openRiskDetails;
  useEffect(() => {
    const risk = selectedRiskId ? bootstrap.risks.find((item) => item.id === selectedRiskId) : undefined;
    if (risk) openRiskDetails(risk);
  }, [bootstrap.risks, openRiskDetails, selectedRiskId]);
  return (
    <section className={`panel dense-panel subsystem-manager-shell ${WORKSPACE_PANEL_CLASS}`}>
      <RiskTriageQueue
        activePersonFilter={activePersonFilter}
        bootstrap={bootstrap}
        onCreateRisk={viewModel.openCreateEditor}
        onOpenRisk={viewModel.openRiskDetails}
        onUpdateRisk={viewModel.handleQuickUpdateRisk}
        pendingRiskIds={viewModel.pendingRiskIds}
        riskErrors={viewModel.riskErrors}
        editingRiskId={viewModel.editorMode === "edit" ? viewModel.activeRisk?.id ?? null : null}
        onOpenTask={(taskId) => {
          const task = bootstrap.tasks.find((item) => item.id === taskId);
          if (task && openTaskDetailModal) {
            openTaskDetailModal(task);
          }
        }}
      />
      <details className="workspace-disclosure" onToggle={(event) => setHealthOpen(event.currentTarget.open)}>
        <summary>Project health</summary>
        {healthOpen ? <RiskMetricsSection {...viewModel.metrics} /> : null}
      </details>

      <RiskEditorModal
        draft={viewModel.draft}
        editorError={viewModel.editorError}
        editorMode={viewModel.editorMode === "detail" ? null : viewModel.editorMode}
        isDeleting={viewModel.isDeleting}
        isSaving={viewModel.isSaving}
        mitigationTaskOptions={viewModel.mitigationTaskOptions}
        targetOptions={viewModel.targetOptions}
        responsibleGroupOptions={viewModel.responsibleGroupOptions}
        ownerOptions={bootstrap.members.map((member) => ({ id: member.id, name: member.name }))}
        onClose={viewModel.closeEditor}
        onDelete={() => void viewModel.handleDeleteRisk()}
        onSave={() => void viewModel.handleSaveRisk()}
        setDraft={viewModel.setDraft}
      />
      {viewModel.editorMode === "detail" && viewModel.activeRisk ? (
        <RiskDetailsModal
          activeRisk={viewModel.activeRisk}
          auditActions={riskAuditActions(bootstrap.actions, viewModel.activeRisk)}
          getTargetLabel={viewModel.getTargetLabel}
          getMitigationLabel={viewModel.getMitigationLabel}
          getSourceLabel={viewModel.getSourceLabel}
          ownerLabel={bootstrap.members.find((member) => member.id === viewModel.activeRisk?.ownerMemberId)?.name ?? "Unassigned"}
          onClose={viewModel.closeEditor}
          onEditRisk={() => viewModel.openEditEditor(viewModel.activeRisk!)}
          onOpenSchedule={(milestoneId) => { viewModel.closeEditor(); onOpenSchedule?.(milestoneId); }}
        />
      ) : null}
    </section>
  );
}
