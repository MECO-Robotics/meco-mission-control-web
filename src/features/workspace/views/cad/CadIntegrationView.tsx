import type { MechanismRecord, PartDefinitionRecord, SubsystemRecord } from "@/types/records";
import {
  CadOnshapeIntegrationSection,
  getScopedDocumentRefs,
  resolveSelectedDocumentRefId,
} from "./components/CadOnshapeIntegrationSection";
import { CadStepImportHeader } from "./components/CadStepImportHeader";
import { CadStepReviewPanels } from "./components/CadStepReviewPanels";
import { CadStepSnapshotSelector } from "./components/CadStepSnapshotSelector";
import { CadStepUploadPanel } from "./components/CadStepUploadPanel";
import { useCadStepWorkflow } from "./hooks/useCadStepWorkflow";
import "./cadIntegration.css";
import "./cadIntegrationData.css";
import "./cadStepDiagnostics.css";
import "./cadStepHierarchy.css";
import "./cadStepTree.css";
import "./cadStepWorkflow.css";

export { getScopedDocumentRefs, resolveSelectedDocumentRefId };

export function CadIntegrationView({
  mechanisms = [],
  partDefinitions = [],
  projectId,
  seasonId,
  subsystems = [],
}: {
  mechanisms?: MechanismRecord[];
  partDefinitions?: PartDefinitionRecord[];
  projectId?: string | null;
  seasonId?: string | null;
  subsystems?: SubsystemRecord[];
}) {
  const cadWorkflow = useCadStepWorkflow({ projectId, seasonId });

  return (
    <section className="panel dense-panel cad-integration-shell">
      <CadStepImportHeader selectedSnapshot={cadWorkflow.selectedCadSnapshot} />

      {cadWorkflow.message ? <div className="cad-message" role="status">{cadWorkflow.message}</div> : null}

      <CadStepSnapshotSelector
        onSnapshotChange={cadWorkflow.handleSnapshotChange}
        selectedSnapshotId={cadWorkflow.selectedCadSnapshotId}
        snapshots={cadWorkflow.cadSnapshots}
      />

      <CadStepUploadPanel
        fileName={cadWorkflow.stepFile?.name ?? ""}
        isUploading={cadWorkflow.isUploadingStep}
        label={cadWorkflow.stepLabel}
        onFileChange={cadWorkflow.setStepFile}
        onLabelChange={cadWorkflow.setStepLabel}
        onSubmit={cadWorkflow.handleStepUpload}
      />

      <CadStepReviewPanels
        diff={cadWorkflow.stepDiff}
        groupRepeatedInstances={cadWorkflow.groupRepeatedInstances}
        hierarchyReview={cadWorkflow.hierarchyReview}
        isFinalizing={cadWorkflow.isFinalizing}
        isSavingMapping={cadWorkflow.isSavingMapping}
        mappings={cadWorkflow.stepMappings}
        onConfirmHierarchyDecision={cadWorkflow.handleConfirmHierarchyDecision}
        onConfirmMapping={cadWorkflow.handleConfirmMapping}
        onFinalize={cadWorkflow.handleFinalize}
        onGroupRepeatedInstancesChange={cadWorkflow.handleGroupRepeatedInstancesChange}
        partMatchProposals={cadWorkflow.partMatchProposals}
        importRun={cadWorkflow.selectedCadImportRun}
        latestImportRunId={cadWorkflow.latestCadImportRun?.id ?? null}
        snapshot={cadWorkflow.selectedCadSnapshot}
        summary={cadWorkflow.stepSummary}
        targets={{ subsystems, mechanisms, partDefinitions }}
        tree={cadWorkflow.stepTree}
        warnings={cadWorkflow.stepWarnings}
      />

      <CadOnshapeIntegrationSection projectId={projectId} seasonId={seasonId} />
    </section>
  );
}
