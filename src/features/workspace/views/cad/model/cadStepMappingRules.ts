import type { CadStepMappingRecord } from "./cadIntegrationTypes";

type TargetKind = CadStepMappingRecord["targetKind"];

export type CarryForwardRuleMode =
  | "snapshot"
  | "exact"
  | "normalized"
  | "manual"
  | "ignore"
  | "split_merge_deferred";

export const carryForwardRuleModes: Array<{
  description: string;
  label: string;
  value: CarryForwardRuleMode;
}> = [
  { value: "snapshot", label: "This snapshot only", description: "Do not save a carry-forward rule." },
  { value: "exact", label: "Exact name match", description: "Reuse this target when the next STEP item name is identical." },
  { value: "normalized", label: "Normalized name match", description: "Reuse this target after trimming case, spaces, and common separators." },
  { value: "manual", label: "Manual override", description: "Save this reviewer-selected target for future imports." },
  { value: "ignore", label: "Ignore this item", description: "Carry forward an ignore decision for this STEP item." },
  { value: "split_merge_deferred", label: "Split/merge deferred", description: "Unsupported for automatic rules; leave a review note for now." },
];

export const targetKinds: Array<{ label: string; value: TargetKind }> = [
  { value: "SUBSYSTEM", label: "Existing subsystem" },
  { value: "MECHANISM", label: "Existing mechanism" },
  { value: "PART_DEFINITION", label: "Existing part definition" },
  { value: "IGNORE", label: "Ignore" },
  { value: "REFERENCE_GEOMETRY", label: "Reference geometry" },
  { value: "UNMAPPED", label: "Unmapped" },
];

export function ruleOrigin(mapping: CadStepMappingRecord) {
  if (mapping.rule) {
    return "existing rule";
  }
  if (mapping.confidence === "MANUAL") {
    return "manual override";
  }
  return mapping.status === "CONFIRMED" ? "this snapshot only" : "new suggestion";
}

export function defaultCarryForwardRuleMode(mapping: CadStepMappingRecord): CarryForwardRuleMode {
  if (mapping.targetKind === "IGNORE") {
    return mapping.rule || mapping.status === "CONFIRMED" ? "ignore" : "snapshot";
  }
  if (mapping.rule) {
    return "exact";
  }
  if (mapping.confidence === "MANUAL") {
    return "manual";
  }
  return "snapshot";
}

export function carryForwardRuleModeDescription(mode: CarryForwardRuleMode) {
  return carryForwardRuleModes.find((ruleMode) => ruleMode.value === mode)?.description ?? "";
}

export function carryForwardRuleModeLabel(mode: CarryForwardRuleMode) {
  return carryForwardRuleModes.find((ruleMode) => ruleMode.value === mode)?.label ?? mode;
}

export function defaultTargetKind(mapping: CadStepMappingRecord): TargetKind {
  return mapping.targetKind === "UNMAPPED" ? targetKindForSource(mapping) : mapping.targetKind;
}

export function targetKindForSource(mapping: CadStepMappingRecord): TargetKind {
  if (mapping.sourceKind === "PART_DEFINITION" || mapping.sourceKind === "PART_INSTANCE") {
    return "PART_DEFINITION";
  }
  return "SUBSYSTEM";
}

export function targetKindRequiresTarget(kind: TargetKind) {
  return kind === "SUBSYSTEM" || kind === "MECHANISM" || kind === "PART_DEFINITION";
}

export function repeatedInstanceQuantity(mapping: CadStepMappingRecord) {
  return mapping.quantity ?? mapping.sourceIds?.length ?? 1;
}

export function targetKindForRuleMode(ruleMode: CarryForwardRuleMode, targetKind: TargetKind): TargetKind {
  return ruleMode === "ignore" ? "IGNORE" : targetKind;
}

export function ruleModeAppliesToFuture(ruleMode: CarryForwardRuleMode) {
  return ruleMode !== "snapshot" && ruleMode !== "split_merge_deferred";
}
