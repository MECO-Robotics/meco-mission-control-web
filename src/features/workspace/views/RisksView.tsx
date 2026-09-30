import { useState } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { RiskPayload } from "@/types/payloads";
import type { TaskRecord } from "@/types/recordsExecution";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import { AttentionView } from "@/features/workspace/views/attention/AttentionView";

import { RiskEditorModal } from "./RiskEditorModal";
import { RiskDetailsModal } from "./RiskDetailsModal";
import { RiskMetricsSection } from "./RiskMetricsSection";
import { riskAuditActions } from "./riskViewData/riskAuditActions";
import { useRisksViewModel } from "./riskViewModel";

interface RisksViewProps {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  onDeleteRisk: (riskId: string) => Promise<void>;
  openTaskDetailModal?: (task: TaskRecord) => void;
  onUpdateRisk: (riskId: string, payload: RiskPayload) => Promise<void>;
  onOpenSource?: (source: string, id: string) => void;
}

export function RisksView({
  activePersonFilter,
  bootstrap,
  onDeleteRisk,
  openTaskDetailModal,
  onUpdateRisk,
  onOpenSource,
}: RisksViewProps) {
  const [healthOpen, setHealthOpen] = useState(false);
  const viewModel = useRisksViewModel({
    activePersonFilter,
    bootstrap,
    onDeleteRisk,
    onUpdateRisk,
  });
  return (
    <section className={`panel dense-panel subsystem-manager-shell ${WORKSPACE_PANEL_CLASS}`}>
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
          onClose={viewModel.closeEditor}
          onEditRisk={() => viewModel.openEditEditor(viewModel.activeRisk!)}
        />
      ) : null}
    </section>
  );
}
