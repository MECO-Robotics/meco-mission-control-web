import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

import type { MechanismRecord, PartDefinitionRecord, SubsystemRecord } from "@/types/records";
import {
  applyCadHierarchyReview,
  applyCadSnapshotMappings,
  fetchCadHierarchyReview,
  fetchCadPartMatchProposals,
  fetchCadSnapshotDiff,
  fetchCadSnapshotMappings,
  fetchCadSnapshots,
  fetchCadSnapshotSummary,
  fetchCadSnapshotTree,
  fetchCadStepImportRuns,
  finalizeCadSnapshot,
  uploadCadStepFile,
} from "./api/cadStepApi";
import { CadStepReviewPanels } from "./components/CadStepReviewPanels";
import { CadStepUploadPanel } from "./components/CadStepUploadPanel";
import { isMissingCadHierarchyReviewRoute, isMissingCadOptionalRoute } from "./cadOptionalRoutes";
import type {
  CadHierarchyReview,
  CadHierarchyReviewDecision,
  CadPartMatchProposal,
  CadStepDiff,
  CadStepImportRunRecord,
  CadStepImportSummary,
  CadStepMappingRecord,
  CadStepSnapshotRecord,
  CadStepTreeNode,
  CadStepWarningRecord,
} from "./model/cadIntegrationTypes";
import "./cadIntegration.css";
import "./cadIntegrationData.css";
import "./cadStepDiagnostics.css";
import "./cadStepHierarchy.css";
import "./cadStepTree.css";
import "./cadStepWorkflow.css";

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
  const [stepFile, setStepFile] = useState<File | null>(null);
  const [stepLabel, setStepLabel] = useState("Robot STEP iteration");
  const [cadSnapshots, setCadSnapshots] = useState<CadStepSnapshotRecord[]>([]);
  const [cadImportRuns, setCadImportRuns] = useState<CadStepImportRunRecord[]>([]);
  const [selectedCadSnapshotId, setSelectedCadSnapshotId] = useState("");
  const [stepSummary, setStepSummary] = useState<CadStepImportSummary | null>(null);
  const [stepTree, setStepTree] = useState<CadStepTreeNode[]>([]);
  const [stepMappings, setStepMappings] = useState<CadStepMappingRecord[]>([]);
  const [hierarchyReview, setHierarchyReview] = useState<CadHierarchyReview | null>(null);
  const [partMatchProposals, setPartMatchProposals] = useState<CadPartMatchProposal[]>([]);
  const [stepWarnings, setStepWarnings] = useState<CadStepWarningRecord[]>([]);
  const [stepDiff, setStepDiff] = useState<CadStepDiff | null>(null);
  const [groupRepeatedInstances, setGroupRepeatedInstances] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [isUploadingStep, setIsUploadingStep] = useState(false);
  const [isSavingMapping, setIsSavingMapping] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const selectedCadSnapshotIdRef = useRef("");
  const snapshotListRequestRef = useRef(0);
  const snapshotDetailsRequestRef = useRef(0);
  const groupRepeatedInstancesRef = useRef(groupRepeatedInstances);
  const latestCadSnapshotScopeRef = useRef({ projectId, seasonId });
  latestCadSnapshotScopeRef.current = { projectId, seasonId };

  const selectCadSnapshot = useCallback((snapshotId: string) => {
    selectedCadSnapshotIdRef.current = snapshotId;
    setSelectedCadSnapshotId(snapshotId);
  }, []);

  useEffect(() => {
    groupRepeatedInstancesRef.current = groupRepeatedInstances;
  }, [groupRepeatedInstances]);

  const selectedCadSnapshot = cadSnapshots.find((snapshot) => snapshot.id === selectedCadSnapshotId) ?? null;
  const selectedCadImportRun = selectedCadSnapshot
    ? cadImportRuns.find((run) => run.id === selectedCadSnapshot.importRunId) ?? null
    : null;
  const latestCadImportRun = cadImportRuns
    .filter((run) => run.source === "STEP_UPLOAD" && run.status !== "FAILED" && run.status !== "CANCELED")
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))[0] ?? null;

  const loadCadSnapshotDetails = useCallback(async (snapshotId: string, options?: { groupRepeatedInstances?: boolean }) => {
    const requestId = snapshotDetailsRequestRef.current + 1;
    snapshotDetailsRequestRef.current = requestId;
    const shouldGroupInstances = options?.groupRepeatedInstances ?? groupRepeatedInstancesRef.current;
    const [summaryResponse, treeResponse, mappingsResponse, hierarchyResponse, proposalsResponse, diffResponse] = await Promise.all([
      fetchCadSnapshotSummary(snapshotId),
      fetchCadSnapshotTree(snapshotId, { groupInstances: shouldGroupInstances }),
      fetchCadSnapshotMappings(snapshotId, { groupInstances: shouldGroupInstances }),
      fetchCadHierarchyReview(snapshotId).catch((error) => {
        if (isMissingCadHierarchyReviewRoute(error)) {
          return null;
        }
        throw error;
      }),
      fetchCadPartMatchProposals(snapshotId).catch((error) => {
        if (isMissingCadOptionalRoute(error, "/part-match-proposals")) {
          return null;
        }
        throw error;
      }),
      fetchCadSnapshotDiff(snapshotId).catch((error) => {
        if (isMissingCadOptionalRoute(error, "/diff")) {
          return null;
        }
        throw error;
      }),
    ]);
    if (snapshotDetailsRequestRef.current !== requestId || selectedCadSnapshotIdRef.current !== snapshotId) {
      return false;
    }
    setStepSummary(summaryResponse.summary);
    setStepTree(treeResponse.rootNodes);
    setStepMappings(mappingsResponse.items);
    setHierarchyReview(hierarchyResponse);
    setPartMatchProposals(proposalsResponse?.items ?? hierarchyResponse?.partMatchProposals ?? []);
    setStepWarnings(diffResponse?.warnings ?? []);
    setStepDiff(diffResponse);
    return true;
  }, []);

  const loadCadSnapshots = useCallback(async (preferredSnapshotId?: string) => {
    const requestId = snapshotListRequestRef.current + 1;
    snapshotListRequestRef.current = requestId;
    const requestedProjectId = projectId;
    const requestedSeasonId = seasonId;
    const [snapshotsResponse, importRunsResponse] = await Promise.all([
      fetchCadSnapshots({ projectId, seasonId }),
      fetchCadStepImportRuns({ projectId, seasonId }),
    ]);
    if (
      snapshotListRequestRef.current !== requestId
      || latestCadSnapshotScopeRef.current.projectId !== requestedProjectId
      || latestCadSnapshotScopeRef.current.seasonId !== requestedSeasonId
    ) {
      return;
    }
    setCadSnapshots(snapshotsResponse.items);
    setCadImportRuns(importRunsResponse.items);
    const nextSnapshotId = preferredSnapshotId || snapshotsResponse.items[0]?.id || "";
    selectCadSnapshot(nextSnapshotId);
    if (nextSnapshotId) {
      await loadCadSnapshotDetails(nextSnapshotId);
    } else {
      snapshotDetailsRequestRef.current += 1;
      setStepSummary(null);
      setStepTree([]);
      setStepMappings([]);
      setHierarchyReview(null);
      setPartMatchProposals([]);
      setStepWarnings([]);
      setStepDiff(null);
    }
  }, [loadCadSnapshotDetails, projectId, seasonId, selectCadSnapshot]);

  useEffect(() => {
    let isActive = true;
    void loadCadSnapshots().catch((error) => {
      if (isActive) {
        setMessage(error instanceof Error ? error.message : String(error));
      }
    });
    return () => {
      isActive = false;
    };
  }, [loadCadSnapshots]);

  const handleStepUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!stepFile) {
      setMessage("Select a .step or .stp file first.");
      return;
    }

    setIsUploadingStep(true);
    setMessage(null);
    try {
      const response = await uploadCadStepFile({
        file: stepFile,
        label: stepLabel,
        projectId,
        seasonId,
      });
      await loadCadSnapshots(response.snapshot.id);
      setCadImportRuns((current) => [response.importRun, ...current.filter((run) => run.id !== response.importRun.id)]);
      setCadSnapshots((current) => [response.snapshot, ...current.filter((snapshot) => snapshot.id !== response.snapshot.id)]);
      selectCadSnapshot(response.snapshot.id);
      setMessage(
        `STEP import ready for review: ${response.summary.assemblyCount} assemblies, ${response.summary.partDefinitionCount} part definitions, ${response.summary.warningCount} warnings.`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsUploadingStep(false);
    }
  };

  const handleConfirmMapping = async (input: {
    mappingId?: string;
    sourceKind?: CadStepMappingRecord["sourceKind"];
    sourceIds?: string[];
    targetKind: CadStepMappingRecord["targetKind"];
    targetId: string | null;
    applyToFuture: boolean;
  }) => {
    if (!selectedCadSnapshotId) {
      return;
    }
    setIsSavingMapping(true);
    setMessage(null);
    try {
      await applyCadSnapshotMappings(selectedCadSnapshotId, {
        updates: [{
          mappingId: input.mappingId,
          sourceKind: input.sourceKind,
          sourceIds: input.sourceIds,
          targetKind: input.targetKind,
          targetId: input.targetId,
          confidence: "MANUAL",
          status: "CONFIRMED",
          applyToFuture: input.applyToFuture,
        }],
      });
      const didLoadSelectedSnapshot = await loadCadSnapshotDetails(selectedCadSnapshotId);
      if (didLoadSelectedSnapshot) {
        setMessage(input.applyToFuture ? "Mapping confirmed and saved for future STEP imports." : "Mapping confirmed for this snapshot.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSavingMapping(false);
    }
  };

  const handleConfirmHierarchyDecision = async (decision: CadHierarchyReviewDecision) => {
    if (!selectedCadSnapshotId) {
      return;
    }
    setIsSavingMapping(true);
    setMessage(null);
    try {
      await applyCadHierarchyReview(selectedCadSnapshotId, { decisions: [decision] });
      const didLoadSelectedSnapshot = await loadCadSnapshotDetails(selectedCadSnapshotId);
      if (didLoadSelectedSnapshot) {
        setMessage("Hierarchy decision applied.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSavingMapping(false);
    }
  };

  const handleGroupRepeatedInstancesChange = (value: boolean) => {
    groupRepeatedInstancesRef.current = value;
    setGroupRepeatedInstances(value);
    if (selectedCadSnapshotId) {
      void loadCadSnapshotDetails(selectedCadSnapshotId, { groupRepeatedInstances: value });
    }
  };

  const handleFinalize = async (allowUnresolved: boolean) => {
    if (!selectedCadSnapshotId) {
      return;
    }
    setIsFinalizing(true);
    setMessage(null);
    try {
      await finalizeCadSnapshot(selectedCadSnapshotId, { allowUnresolved });
      await loadCadSnapshots(selectedCadSnapshotId);
      setMessage("CAD snapshot finalized.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <section className="panel dense-panel cad-integration-shell">
      <div className="panel-header compact-header cad-header">
        <div className="queue-section-header">
          <h2>STEP import</h2>
          <p className="section-copy">
            Upload STEP exports, review detected structure, and carry confirmed mappings forward across iterations.
          </p>
        </div>
        <div className="cad-header-meta">
          <span>STEP load workflow</span>
          <span>{selectedCadSnapshot ? `Last import ${new Date(selectedCadSnapshot.createdAt).toLocaleString()}` : "No STEP snapshot yet"}</span>
        </div>
      </div>

      {message ? <div className="cad-message" role="status">{message}</div> : null}

      <div className="cad-step-snapshot-bar">
        <label className="cad-field">
          <span>Snapshot</span>
          <select
            onChange={(event) => {
              selectCadSnapshot(event.target.value);
              if (event.target.value) {
                void loadCadSnapshotDetails(event.target.value);
              } else {
                snapshotDetailsRequestRef.current += 1;
                setStepSummary(null);
                setStepTree([]);
                setStepMappings([]);
                setHierarchyReview(null);
                setPartMatchProposals([]);
                setStepWarnings([]);
                setStepDiff(null);
              }
            }}
            value={selectedCadSnapshotId}
          >
            <option value="">No STEP snapshot selected</option>
            {cadSnapshots.map((snapshot) => (
              <option key={snapshot.id} value={snapshot.id}>{snapshot.label}</option>
            ))}
          </select>
        </label>
      </div>

      <CadStepUploadPanel
        fileName={stepFile?.name ?? ""}
        isUploading={isUploadingStep}
        label={stepLabel}
        onFileChange={setStepFile}
        onLabelChange={setStepLabel}
        onSubmit={handleStepUpload}
      />

      <CadStepReviewPanels
        diff={stepDiff}
        groupRepeatedInstances={groupRepeatedInstances}
        hierarchyReview={hierarchyReview}
        isFinalizing={isFinalizing}
        isSavingMapping={isSavingMapping}
        mappings={stepMappings}
        onConfirmHierarchyDecision={handleConfirmHierarchyDecision}
        onConfirmMapping={handleConfirmMapping}
        onFinalize={handleFinalize}
        onGroupRepeatedInstancesChange={handleGroupRepeatedInstancesChange}
        partMatchProposals={partMatchProposals}
        importRun={selectedCadImportRun}
        latestImportRunId={latestCadImportRun?.id ?? null}
        snapshot={selectedCadSnapshot}
        summary={stepSummary}
        targets={{ subsystems, mechanisms, partDefinitions }}
        tree={stepTree}
        warnings={stepWarnings}
      />
    </section>
  );
}
