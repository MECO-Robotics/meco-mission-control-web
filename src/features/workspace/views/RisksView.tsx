import { useEffect, useRef } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { RiskPayload } from "@/types/payloads";
import type { TaskRecord } from "@/types/recordsExecution";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";

import { RiskEditorModal } from "./RiskEditorModal";
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
  onOpenRecord?: (kind: string, id: string) => void;
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
  onOpenRecord,
  selectedRiskId,
}: RisksViewProps) {
  const viewModel = useRisksViewModel({
    activePersonFilter,
    bootstrap,
    onDeleteRisk,
    onCreateRisk,
    onUpdateRisk,
  });
  const openRiskDetails = viewModel.openRiskDetails;
  const openedRiskLink = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedRiskId) { openedRiskLink.current = null; return; }
    if (openedRiskLink.current === selectedRiskId || viewModel.pendingRiskIds.has(selectedRiskId)) return;
    const risk = selectedRiskId ? bootstrap.risks.find((item) => item.id === selectedRiskId) : undefined;
    if (risk) { openRiskDetails(risk); openedRiskLink.current = selectedRiskId; }
  }, [bootstrap.risks, openRiskDetails, selectedRiskId, viewModel.pendingRiskIds]);
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
        selectedRisk={viewModel.editorMode === "detail" ? viewModel.activeRisk : null}
        onCloseRisk={viewModel.closeEditor}
        onEditRisk={viewModel.openEditEditor}
        onOpenRecord={(kind, id) => {
          if (kind === "task" || kind === "manufacturing-details") {
            const task = bootstrap.tasks.find((item) => item.id === id);
            if (task) openTaskDetailModal?.(task);
          } else if (kind === "risk") {
            const risk = bootstrap.risks.find((item) => item.id === id);
            if (risk) viewModel.openRiskDetails(risk);
          } else if (kind === "milestone") { viewModel.closeEditor(); onOpenSchedule?.(id); }
          else onOpenRecord?.(kind, id);
        }}
      />

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
    </section>
  );
}
