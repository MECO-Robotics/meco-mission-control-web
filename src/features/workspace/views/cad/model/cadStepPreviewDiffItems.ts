import type {
  CadHierarchyIssue,
  CadHierarchyNode,
  CadPartMatchProposal,
  CadStepDiff,
  CadStepMappingRecord,
  CadStepWarningRecord,
} from "./cadIntegrationTypes";
import type { CadStepPreviewDiffItem } from "./cadStepPreviewDiffTypes";

const classificationLabels: Record<string, string> = {
  SUBSYSTEM: "New subsystem",
  MECHANISM: "New mechanism",
};

export function uniqueItems(items: CadStepPreviewDiffItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
}

function assemblyKind(name: string) {
  const normalized = name.trim().toLowerCase();
  if (normalized.startsWith("sub ") || normalized.startsWith("sub-") || normalized.startsWith("subsystem")) {
    return "New subsystem";
  }
  if (normalized.startsWith("mech ") || normalized.startsWith("mech-") || normalized.startsWith("mechanism")) {
    return "New mechanism";
  }
  return "New assembly";
}

export function addedAssemblyItems(diff: CadStepDiff) {
  return diff.addedAssemblies.map((assembly) => ({
    id: `added-assembly-${assembly.id}`,
    title: assembly.name,
    detail: `${assemblyKind(assembly.name)} at ${assembly.instancePath || "root"}.`,
    tone: "added" as const,
  }));
}

export function addedPartItems(diff: CadStepDiff) {
  return diff.addedParts.map((part) => ({
    id: `added-part-${part.id}`,
    title: part.partNumber ? `${part.partNumber} - ${part.name}` : part.name,
    detail: "New STEP part definition detected.",
    tone: "added" as const,
  }));
}

export function walkHierarchy(node: CadHierarchyNode | null, items: CadStepPreviewDiffItem[] = []) {
  if (!node) {
    return items;
  }
  const label = node.proposedClassification ? classificationLabels[node.proposedClassification] : null;
  if (label && node.status !== "CONFIRMED") {
    items.push({
      id: `hierarchy-${node.id}`,
      title: node.name,
      detail: `${label} candidate at ${node.instancePath || "root"} with ${String(node.confidence).toLowerCase()} confidence.`,
      tone: node.confidence === "LOW" ? "warning" : "added",
    });
  }
  node.children.forEach((child) => walkHierarchy(child, items));
  return items;
}

function valueFromRecord(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return null;
}

export function mappingChangeItem(record: Record<string, unknown>, index: number): CadStepPreviewDiffItem {
  const current = valueFromRecord(record, ["currentName", "newName", "sourceName", "name", "partName"]) ?? `Mapping change ${index + 1}`;
  const previous = valueFromRecord(record, ["previousName", "oldName", "previousSourceName"]);
  const detail = previous && previous !== current
    ? `Renamed or remapped from ${previous}.`
    : "Mapping target changed since the previous STEP snapshot.";
  return { id: `mapping-change-${index}`, title: current, detail, tone: "changed" };
}

export function mappingReviewItems(mappings: CadStepMappingRecord[]) {
  return mappings
    .filter((mapping) => (
      mapping.status === "NEEDS_REVIEW"
      || mapping.confidence === "LOW"
      || mapping.hasMixedMappings
    ) && mapping.targetKind !== "UNMAPPED")
    .map((mapping) => ({
      id: `mapping-${mapping.id}`,
      title: mapping.sourceName,
      detail: `${mapping.sourceKind.replace(/_/g, " ").toLowerCase()} needs mapping review; confidence is ${mapping.confidence.toLowerCase()}.`,
      tone: "warning" as const,
    }));
}

export function movedItems(diff: CadStepDiff) {
  return [
    ...diff.movedAssemblies.map((assembly, index) => ({
      id: `moved-assembly-${assembly.name}-${index}`,
      title: assembly.name,
      detail: `Assembly moved from ${assembly.previousParentSourceId ?? "root"} to ${assembly.currentParentSourceId ?? "root"}.`,
      tone: "changed" as const,
    })),
    ...diff.movedPartInstances.map((instance) => ({
      id: `moved-part-instance-${instance.sourceId}`,
      title: instance.sourceId,
      detail: `Part instance moved from ${instance.previousParentAssemblyName ?? "root"} to ${instance.currentParentAssemblyName ?? "root"}.`,
      tone: "changed" as const,
    })),
  ];
}

export function partMatchItems(proposals: CadPartMatchProposal[]) {
  return proposals
    .filter((proposal) => ["AMBIGUOUS", "NO_MATCH", "SUGGESTED"].includes(String(proposal.status)))
    .map((proposal) => ({
      id: `proposal-${proposal.id}`,
      title: proposal.sourcePartName,
      detail: proposal.status === "NO_MATCH"
        ? "No matching Mission Control part was found."
        : `${proposal.candidates.length} possible part matches require review.`,
      tone: "warning" as const,
    }));
}

export function issueItems(issues: CadHierarchyIssue[], prefix: string) {
  return issues.map((issue, index) => ({
    id: `${prefix}-${issue.sourceId ?? issue.code}-${index}`,
    title: issue.title ?? issue.code,
    detail: issue.message,
    tone: "warning" as const,
  }));
}

export function warningItems(warnings: CadStepWarningRecord[]) {
  return warnings
    .filter((warning) => warning.severity !== "INFO")
    .map((warning) => ({
      id: `warning-${warning.id}`,
      title: warning.title,
      detail: `${warning.message} (${warning.code})`,
      tone: "warning" as const,
    }));
}

export function removedAssemblyItems(diff: CadStepDiff) {
  return diff.removedAssemblies.map((assembly) => ({
    id: `removed-assembly-${assembly.id}`,
    title: assembly.name,
    detail: `Removed assembly from ${assembly.instancePath || "root"}.`,
    tone: "removed" as const,
  }));
}

export function removedPartItems(diff: CadStepDiff) {
  return diff.removedParts.map((part) => ({
    id: `removed-part-${part.id}`,
    title: part.partNumber ? `${part.partNumber} - ${part.name}` : part.name,
    detail: "Removed STEP part definition.",
    tone: "removed" as const,
  }));
}

export function unmappedItems(mappings: CadStepMappingRecord[]) {
  return mappings.filter((mapping) => mapping.targetKind === "UNMAPPED").map((mapping) => ({
    id: `unmapped-${mapping.id}`,
    title: mapping.sourceName,
    detail: "Unmapped item will not finalize cleanly until reviewed.",
    tone: "warning" as const,
  }));
}
