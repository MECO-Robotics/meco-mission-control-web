import type {
  CadHierarchyReview,
  CadPartMatchProposal,
  CadStepDiff,
  CadStepMappingRecord,
  CadStepWarningRecord,
} from "./cadIntegrationTypes";
import {
  addedAssemblyItems,
  addedPartItems,
  issueItems,
  mappingChangeItem,
  mappingReviewItems,
  movedItems,
  partMatchItems,
  removedAssemblyItems,
  removedPartItems,
  uniqueItems,
  unmappedItems,
  walkHierarchy,
  warningItems,
} from "./cadStepPreviewDiffItems";
import type { CadStepPreviewDiffGroup } from "./cadStepPreviewDiffTypes";

export function buildCadStepPreviewDiffViewModel({
  diff,
  hierarchyReview,
  mappings,
  partMatchProposals,
  warnings,
}: {
  diff: CadStepDiff | null;
  hierarchyReview: CadHierarchyReview | null;
  mappings: CadStepMappingRecord[];
  partMatchProposals: CadPartMatchProposal[];
  warnings: CadStepWarningRecord[];
}): CadStepPreviewDiffGroup[] {
  if (!diff) {
    return [
      { id: "new", title: "New subsystems, mechanisms, and parts", empty: "No STEP diff response is available yet.", items: [] },
      { id: "renamed", title: "Renamed or unmatched parts", empty: "No STEP diff response is available yet.", items: [] },
      { id: "removed", title: "Removed or unmapped items", empty: "No STEP diff response is available yet.", items: [] },
      { id: "warnings", title: "Confidence warnings", empty: "No STEP diff response is available yet.", items: [] },
    ];
  }

  const newItems = uniqueItems([
    ...addedAssemblyItems(diff),
    ...addedPartItems(diff),
    ...walkHierarchy(hierarchyReview?.root ?? null),
  ]);
  const renamedOrUnmatchedItems = uniqueItems([
    ...diff.mappingChanges.map(mappingChangeItem),
    ...movedItems(diff),
    ...mappingReviewItems(mappings),
    ...partMatchItems(partMatchProposals),
  ]);
  const removedOrUnmappedItems = uniqueItems([
    ...removedAssemblyItems(diff),
    ...removedPartItems(diff),
    ...unmappedItems(mappings),
  ]);
  const confidenceWarnings = uniqueItems([
    ...warningItems([...diff.warnings, ...warnings]),
    ...issueItems(hierarchyReview?.unresolved ?? [], "unresolved"),
    ...issueItems(hierarchyReview?.warnings ?? [], "hierarchy-warning"),
  ]);

  return [
    { id: "new", title: "New subsystems, mechanisms, and parts", empty: "No new CAD-derived items detected.", items: newItems },
    { id: "renamed", title: "Renamed or unmatched parts", empty: "No renamed or unmatched parts detected.", items: renamedOrUnmatchedItems },
    { id: "removed", title: "Removed or unmapped items", empty: "No removed or unmapped items detected.", items: removedOrUnmappedItems },
    { id: "warnings", title: "Confidence warnings", empty: "No confidence warnings for this preview.", items: confidenceWarnings },
  ];
}
