import type { MechanismRecord, PartDefinitionRecord, SubsystemRecord } from "@/types/records";
import type {
  CadHierarchyNode,
  CadHierarchyTargetKind,
} from "../model/cadIntegrationTypes";

export type CadHierarchyStage = "subsystems" | "mechanisms" | "parts" | "final";

export type CadHierarchyTargets = {
  subsystems: SubsystemRecord[];
  mechanisms: MechanismRecord[];
  partDefinitions: PartDefinitionRecord[];
};

export const cadHierarchyStages: Array<{ id: CadHierarchyStage; label: string }> = [
  { id: "subsystems", label: "Subsystems" },
  { id: "mechanisms", label: "Mechanisms/components" },
  { id: "parts", label: "Parts" },
  { id: "final", label: "Final review" },
];

export function flattenHierarchyNodes(node: CadHierarchyNode | null): CadHierarchyNode[] {
  if (!node) {
    return [];
  }
  return [node, ...node.children.flatMap((child) => flattenHierarchyNodes(child))];
}

export function compactHierarchyLabel(value: string) {
  return value.replace(/_/g, " ").toLowerCase();
}

export function hierarchySummaryLine(node: CadHierarchyNode) {
  const summary = node.partSummary;
  if (!summary) {
    return "No grouped part summary yet";
  }
  return `${summary.rawInstanceCount} raw instances, ${summary.groupedPartCount} grouped parts, ${summary.ambiguousMatchCount} ambiguous, ${summary.unresolvedCount} unresolved`;
}

export function hierarchyStatusTone(node: CadHierarchyNode) {
  return node.status === "CONFIRMED" ? "confirmed" : node.status === "NEEDS_REVIEW" ? "needs-review" : "proposed";
}

export function readHierarchyTargetId(node: CadHierarchyNode, kind: CadHierarchyTargetKind) {
  if (kind === "SUBSYSTEM") {
    return node.resolvedSubsystemId ?? "";
  }
  if (kind === "MECHANISM") {
    return node.resolvedMechanismId ?? "";
  }
  if (kind === "PART_DEFINITION") {
    return node.resolvedPartDefinitionId ?? "";
  }
  return "";
}

export function hierarchyTargetOptions(
  kind: CadHierarchyTargetKind,
  targets: CadHierarchyTargets,
) {
  if (kind === "SUBSYSTEM") {
    return targets.subsystems.map((item) => ({ id: item.id, label: item.name }));
  }
  if (kind === "MECHANISM") {
    return targets.mechanisms.map((item) => ({ id: item.id, label: item.name }));
  }
  if (kind === "PART_DEFINITION") {
    return targets.partDefinitions.map((item) => ({ id: item.id, label: `${item.partNumber} - ${item.name}` }));
  }
  return [];
}

export function hierarchyIssueTitle(code: string) {
  return code
    .replace(/^cad[_-]/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
