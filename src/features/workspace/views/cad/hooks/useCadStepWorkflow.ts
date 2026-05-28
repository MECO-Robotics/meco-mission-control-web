import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

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
} from "../api/cadStepApi";
import { isMissingCadHierarchyReviewRoute, isMissingCadOptionalRoute } from "../cadOptionalRoutes";
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
} from "../model/cadIntegrationTypes";

export function useCadStepWorkflow({
  projectId,
  seasonId,
}: {
  projectId?: string | null;
  seasonId?: string | null;
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
  const uploadRequestRef = useRef(0);
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

  const isCurrentScope = useCallback((requestedProjectId?: string | null, requestedSeasonId?: string | null) => (
    latestCadSnapshotScopeRef.current.projectId === requestedProjectId
    && latestCadSnapshotScopeRef.current.seasonId === requestedSeasonId
  ), []);

  const isCurrentUpload = useCallback((
    requestId: number,
    requestedProjectId?: string | null,
    requestedSeasonId?: string | null,
  ) => uploadRequestRef.current === requestId && isCurrentScope(requestedProjectId, requestedSeasonId), [isCurrentScope]);

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
    if (snapshotListRequestRef.current !== requestId || !isCurrentScope(requestedProjectId, requestedSeasonId)) {
      return false;
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
    return true;
  }, [isCurrentScope, loadCadSnapshotDetails, projectId, seasonId, selectCadSnapshot]);

  const clearCadSnapshotDetails = useCallback(() => {
    snapshotDetailsRequestRef.current += 1;
    setStepSummary(null);
    setStepTree([]);
    setStepMappings([]);
    setHierarchyReview(null);
    setPartMatchProposals([]);
    setStepWarnings([]);
    setStepDiff(null);
  }, []);

  const handleCadSnapshotDetailsError = useCallback((snapshotId: string, error: unknown) => {
    if (selectedCadSnapshotIdRef.current === snapshotId) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }, []);

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

    const requestId = uploadRequestRef.current + 1;
    uploadRequestRef.current = requestId;
    const requestedProjectId = projectId;
    const requestedSeasonId = seasonId;
    setIsUploadingStep(true);
    setMessage(null);
    try {
      const response = await uploadCadStepFile({
        file: stepFile,
        label: stepLabel,
        projectId,
        seasonId,
      });
      const didLoadSnapshots = await loadCadSnapshots(response.snapshot.id);
      if (!didLoadSnapshots || !isCurrentUpload(requestId, requestedProjectId, requestedSeasonId)) {
        return;
      }
      setCadImportRuns((current) => [response.importRun, ...current.filter((run) => run.id !== response.importRun.id)]);
      setCadSnapshots((current) => [response.snapshot, ...current.filter((snapshot) => snapshot.id !== response.snapshot.id)]);
      selectCadSnapshot(response.snapshot.id);
      setMessage(
        `STEP import ready for review: ${response.summary.assemblyCount} assemblies, ${response.summary.partDefinitionCount} part definitions, ${response.summary.warningCount} warnings.`,
      );
    } catch (error) {
      if (isCurrentUpload(requestId, requestedProjectId, requestedSeasonId)) {
        setMessage(error instanceof Error ? error.message : String(error));
      }
    } finally {
      if (uploadRequestRef.current === requestId) {
        setIsUploadingStep(false);
      }
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
      setMessage(null);
      void loadCadSnapshotDetails(selectedCadSnapshotId, { groupRepeatedInstances: value }).catch((error) => {
        handleCadSnapshotDetailsError(selectedCadSnapshotId, error);
      });
    }
  };

  const handleSnapshotChange = (snapshotId: string) => {
    selectCadSnapshot(snapshotId);
    if (snapshotId) {
      setMessage(null);
      void loadCadSnapshotDetails(snapshotId).catch((error) => {
        handleCadSnapshotDetailsError(snapshotId, error);
      });
    } else {
      clearCadSnapshotDetails();
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

  return {
    cadSnapshots, groupRepeatedInstances, hierarchyReview, latestCadImportRun, message, partMatchProposals,
    selectedCadImportRun, selectedCadSnapshot, selectedCadSnapshotId, stepDiff, stepFile, stepLabel,
    stepMappings, stepSummary, stepTree, stepWarnings,
    isFinalizing, isSavingMapping, isUploadingStep,
    setStepFile, setStepLabel,
    handleConfirmHierarchyDecision, handleConfirmMapping, handleFinalize, handleGroupRepeatedInstancesChange,
    handleSnapshotChange, handleStepUpload,
  };
}
