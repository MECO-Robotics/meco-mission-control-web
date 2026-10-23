import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import {
  applyCadHierarchyReview,
  applyCadSnapshotMappings,
  fetchCadSnapshots,
  fetchCadStepImportRuns,
  finalizeCadSnapshot,
  uploadCadStepFile,
} from "../api/cadStepApi";
import {
  findCadImportRun,
  findCadSnapshot,
  findLatestSuccessfulStepImportRun,
} from "./cadStepWorkflowDerivations";
import { useCadSnapshotDetails } from "./useCadSnapshotDetails";
import { loadBundledMainAssembly } from "../viewer/loadBundledCadFile";
import type {
  CadHierarchyReviewDecision,
  CadStepImportRunRecord,
  CadStepMappingRecord,
  CadStepMappingRuleMatchStrategy,
  CadStepSnapshotRecord
} from "../model/cadStepTypes";

function getCadWorkflowErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/prisma\.\w+\.\w+\(\)|invocation in \/|can't reach database server/i.test(message)) {
    return "CAD service is unavailable. Check that the local database is running, then try again.";
  }
  return message;
}

export function useCadStepWorkflow({
  projectId,
  seasonId,
}: {
  projectId?: string | null;
  seasonId?: string | null;
}) {
  const [stepFile, setStepFile] = useState<File | null>(null);
  const [stepLabel, setStepLabel] = useState("MECO 2026 Main Assembly");
  const [cadSnapshots, setCadSnapshots] = useState<CadStepSnapshotRecord[]>([]);
  const [cadImportRuns, setCadImportRuns] = useState<CadStepImportRunRecord[]>([]);
  const [selectedCadSnapshotId, setSelectedCadSnapshotId] = useState("");
  const [groupRepeatedInstances, setGroupRepeatedInstances] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [isUploadingStep, setIsUploadingStep] = useState(false);
  const [isSavingMapping, setIsSavingMapping] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const selectedCadSnapshotIdRef = useRef("");
  const snapshotListRequestRef = useRef(0);
  const uploadRequestRef = useRef(0);
  const groupRepeatedInstancesRef = useRef(groupRepeatedInstances);
  const latestCadSnapshotScopeRef = useRef({ projectId, seasonId });
  latestCadSnapshotScopeRef.current = { projectId, seasonId };

  useEffect(() => {
    const isSeedRobotScope = projectId === "project-robot-2026" && (!seasonId || seasonId === "season-2026-meco");
    if (!isSeedRobotScope) {
      setStepFile(null);
      return;
    }
    let isActive = true;
    void loadBundledMainAssembly().then((file) => {
      if (isActive) setStepFile((current) => current ?? file);
    }).catch((error: unknown) => {
      if (isActive) setMessage(error instanceof Error ? error.message : String(error));
    });
    return () => { isActive = false; };
  }, [projectId, seasonId]);

  const selectCadSnapshot = useCallback((snapshotId: string) => {
    selectedCadSnapshotIdRef.current = snapshotId;
    setSelectedCadSnapshotId(snapshotId);
  }, []);

  useEffect(() => {
    groupRepeatedInstancesRef.current = groupRepeatedInstances;
  }, [groupRepeatedInstances]);
  const {
    clearCadSnapshotDetails,
    hierarchyReview,
    loadCadSnapshotDetails,
    partMatchProposals,
    stepDiff,
    stepMappings,
    stepSummary,
    stepTree,
    stepWarnings,
  } = useCadSnapshotDetails({
    groupRepeatedInstancesRef,
    selectedCadSnapshotIdRef,
  });

  const selectedCadSnapshot = useMemo(
    () => findCadSnapshot(cadSnapshots, selectedCadSnapshotId),
    [cadSnapshots, selectedCadSnapshotId],
  );
  const selectedCadImportRun = useMemo(
    () => findCadImportRun(cadImportRuns, selectedCadSnapshot),
    [cadImportRuns, selectedCadSnapshot],
  );
  const latestCadImportRun = useMemo(
    () => findLatestSuccessfulStepImportRun(cadImportRuns),
    [cadImportRuns],
  );

  const isCurrentScope = useCallback((requestedProjectId?: string | null, requestedSeasonId?: string | null) => (
    latestCadSnapshotScopeRef.current.projectId === requestedProjectId
    && latestCadSnapshotScopeRef.current.seasonId === requestedSeasonId
  ), []);

  const isCurrentUpload = useCallback((
    requestId: number,
    requestedProjectId?: string | null,
    requestedSeasonId?: string | null,
  ) => uploadRequestRef.current === requestId && isCurrentScope(requestedProjectId, requestedSeasonId), [isCurrentScope]);

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
      clearCadSnapshotDetails();
    }
    return true;
  }, [
    clearCadSnapshotDetails,
    isCurrentScope,
    loadCadSnapshotDetails,
    projectId,
    seasonId,
    selectCadSnapshot,
  ]);

  const handleCadSnapshotDetailsError = useCallback((snapshotId: string, error: unknown) => {
    if (selectedCadSnapshotIdRef.current === snapshotId) {
      setMessage(getCadWorkflowErrorMessage(error));
    }
  }, []);

  useEffect(() => {
    let isActive = true;
    void loadCadSnapshots().catch((error) => {
      if (isActive) {
        setMessage(getCadWorkflowErrorMessage(error));
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
        setMessage(getCadWorkflowErrorMessage(error));
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
    ruleMatchStrategy?: CadStepMappingRuleMatchStrategy;
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
          ruleMatchStrategy: input.ruleMatchStrategy,
        }],
      });
      const didLoadSelectedSnapshot = await loadCadSnapshotDetails(selectedCadSnapshotId);
      if (didLoadSelectedSnapshot) {
        setMessage(input.applyToFuture ? "Mapping confirmed and saved for future STEP imports." : "Mapping confirmed for this snapshot.");
      }
    } catch (error) {
      setMessage(getCadWorkflowErrorMessage(error));
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
      setMessage(getCadWorkflowErrorMessage(error));
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
      setMessage(getCadWorkflowErrorMessage(error));
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
