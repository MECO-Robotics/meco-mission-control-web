import { useCallback, useRef, useState, type MutableRefObject } from "react";

import {
  fetchCadHierarchyReview,
  fetchCadPartMatchProposals,
  fetchCadSnapshotDiff,
  fetchCadSnapshotMappings,
  fetchCadSnapshotSummary,
  fetchCadSnapshotTree,
} from "../api/cadStepApi";
import { isMissingCadHierarchyReviewRoute, isMissingCadOptionalRoute } from "../cadOptionalRoutes";
import type {
  CadHierarchyReview,
  CadPartMatchProposal,
  CadStepDiff,
  CadStepImportSummary,
  CadStepMappingRecord,
  CadStepTreeNode,
  CadStepWarningRecord,
} from "../model/cadIntegrationTypes";

interface UseCadSnapshotDetailsArgs {
  groupRepeatedInstancesRef: MutableRefObject<boolean>;
  selectedCadSnapshotIdRef: MutableRefObject<string>;
}

export function useCadSnapshotDetails({
  groupRepeatedInstancesRef,
  selectedCadSnapshotIdRef,
}: UseCadSnapshotDetailsArgs) {
  const [stepSummary, setStepSummary] = useState<CadStepImportSummary | null>(null);
  const [stepTree, setStepTree] = useState<CadStepTreeNode[]>([]);
  const [stepMappings, setStepMappings] = useState<CadStepMappingRecord[]>([]);
  const [hierarchyReview, setHierarchyReview] = useState<CadHierarchyReview | null>(null);
  const [partMatchProposals, setPartMatchProposals] = useState<CadPartMatchProposal[]>([]);
  const [stepWarnings, setStepWarnings] = useState<CadStepWarningRecord[]>([]);
  const [stepDiff, setStepDiff] = useState<CadStepDiff | null>(null);
  const snapshotDetailsRequestRef = useRef(0);

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

  const loadCadSnapshotDetails = useCallback(
    async (snapshotId: string, options?: { groupRepeatedInstances?: boolean }) => {
      const requestId = snapshotDetailsRequestRef.current + 1;
      snapshotDetailsRequestRef.current = requestId;
      const shouldGroupInstances =
        options?.groupRepeatedInstances ?? groupRepeatedInstancesRef.current;
      const [
        summaryResponse,
        treeResponse,
        mappingsResponse,
        hierarchyResponse,
        proposalsResponse,
        diffResponse,
      ] = await Promise.all([
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
      if (
        snapshotDetailsRequestRef.current !== requestId ||
        selectedCadSnapshotIdRef.current !== snapshotId
      ) {
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
    },
    [groupRepeatedInstancesRef, selectedCadSnapshotIdRef],
  );

  return {
    clearCadSnapshotDetails,
    hierarchyReview,
    loadCadSnapshotDetails,
    partMatchProposals,
    stepDiff,
    stepMappings,
    stepSummary,
    stepTree,
    stepWarnings,
  };
}
