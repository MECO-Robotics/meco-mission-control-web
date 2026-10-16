import { useRef, useState } from "react";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import { buildSingleAddMenuAction } from "@/features/workspace/shared/topbar";
import { WorkspaceTopbarAddMenu } from "@/features/workspace/shared/ui";
import { CadPartViewer } from "./viewer/CadPartViewer";
import type { MechanismRecord, SubsystemRecord } from "@/types/recordsOrganization";
import type { PartDefinitionRecord } from "@/types/recordsInventory";
import { CadOnshapeIntegrationSection } from "./components/CadOnshapeIntegrationSection";
import { getScopedDocumentRefs, resolveSelectedDocumentRefId } from "./model/onshapeIntegrationState";
import { CadStepReviewPanels } from "./components/CadStepReviewPanels";
import { CadStepSnapshotSelector } from "./components/CadStepSnapshotSelector";
import { CadStepUploadPanel } from "./components/CadStepUploadPanel";
import { useCadStepWorkflow } from "./hooks/useCadStepWorkflow";
import "./cadIntegration.css";
import "./cadIntegrationData.css";
import "./cadSnapshotDiff.css";
import "./cadSnapshotDiffTree.css";
import "./cadStepDiagnostics.css";
import "./cadStepHierarchy.css";
import "./cadStepPreviewDiff.css";
import "./cadStepTree.css";
import "./cadStepWorkflow.css";

export { getScopedDocumentRefs, resolveSelectedDocumentRefId };

export function CadIntegrationView({
  mechanisms = [],
  partDefinitions = [],
  onSavePartImage,
  projectId,
  seasonId,
  subsystems = [],
}: {
  mechanisms?: MechanismRecord[];
  partDefinitions?: PartDefinitionRecord[];
  onSavePartImage?: (partId: string, revision: string, imageUrl: string) => Promise<void>;
  projectId?: string | null;
  seasonId?: string | null;
  subsystems?: SubsystemRecord[];
}) {
  const cadWorkflow = useCadStepWorkflow({ projectId, seasonId });
  const [search, setSearch] = useState("");
  const stepFileInputRef = useRef<HTMLInputElement>(null);
  const searchTerm = search.trim().toLowerCase();
  const matchingRecords = <T extends { name: string; description?: string | null }>(records: T[]) =>
    searchTerm ? records.filter((record) => `${record.name} ${record.description ?? ""}`.toLowerCase().includes(searchTerm)) : records;
  const matchingPartDefinitions = searchTerm
    ? partDefinitions.filter((part) => `${part.name} ${part.partNumber} ${part.description ?? ""}`.toLowerCase().includes(searchTerm))
    : partDefinitions;

  return (
    <section className="panel dense-panel cad-integration-shell">
      <TopbarResponsiveSearch ariaLabel="Search CAD records" onChange={setSearch} placeholder="Search CAD records…" value={search} />
      <WorkspaceTopbarAddMenu actions={buildSingleAddMenuAction({ label: "Choose STEP file", onSelect: () => stepFileInputRef.current?.click() })} ariaLabel="Add CAD import" title="Add CAD import" />

      {cadWorkflow.message ? <div className="cad-message" role="status">{cadWorkflow.message}</div> : null}

      <CadStepSnapshotSelector
        onSnapshotChange={cadWorkflow.handleSnapshotChange}
        selectedSnapshotId={cadWorkflow.selectedCadSnapshotId}
        snapshots={cadWorkflow.cadSnapshots}
      />

      <CadStepUploadPanel
        fileName={cadWorkflow.stepFile?.name ?? ""}
        fileInputRef={stepFileInputRef}
        isUploading={cadWorkflow.isUploadingStep}
        label={cadWorkflow.stepLabel}
        onFileChange={cadWorkflow.setStepFile}
        onLabelChange={cadWorkflow.setStepLabel}
        onSubmit={cadWorkflow.handleStepUpload}
      />

      <CadPartViewer file={cadWorkflow.stepFile} partDefinitions={matchingPartDefinitions} onSavePartImage={onSavePartImage} search={search} />

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
        targets={{ subsystems: matchingRecords(subsystems), mechanisms: matchingRecords(mechanisms), partDefinitions: matchingPartDefinitions }}
        tree={cadWorkflow.stepTree}
        warnings={cadWorkflow.stepWarnings}
      />

      <CadOnshapeIntegrationSection projectId={projectId} seasonId={seasonId} />
    </section>
  );
}
