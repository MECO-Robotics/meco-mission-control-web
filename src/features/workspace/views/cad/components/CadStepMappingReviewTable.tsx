import { useState } from "react";

import type { MechanismRecord, PartDefinitionRecord, SubsystemRecord } from "@/types/records";
import type { CadStepMappingRecord } from "../model/cadIntegrationTypes";

type TargetKind = CadStepMappingRecord["targetKind"];
type CarryForwardRuleMode = "snapshot" | "exact" | "normalized" | "manual" | "ignore" | "split_merge_deferred";

export interface CadStepMappingConfirmInput {
  mappingId?: string;
  sourceKind?: CadStepMappingRecord["sourceKind"];
  sourceIds?: string[];
  targetKind: TargetKind;
  targetId: string | null;
  applyToFuture: boolean;
}

const carryForwardRuleModes: Array<{ value: CarryForwardRuleMode; label: string; description: string }> = [
  { value: "snapshot", label: "This snapshot only", description: "Do not save a carry-forward rule." },
  { value: "exact", label: "Exact name match", description: "Reuse this target when the next STEP item name is identical." },
  { value: "normalized", label: "Normalized name match", description: "Reuse this target after trimming case, spaces, and common separators." },
  { value: "manual", label: "Manual override", description: "Save this reviewer-selected target for future imports." },
  { value: "ignore", label: "Ignore this item", description: "Carry forward an ignore decision for this STEP item." },
  { value: "split_merge_deferred", label: "Split/merge deferred", description: "Unsupported for automatic rules; leave a review note for now." },
];

const targetKinds: Array<{ value: TargetKind; label: string }> = [
  { value: "SUBSYSTEM", label: "Existing subsystem" },
  { value: "MECHANISM", label: "Existing mechanism" },
  { value: "PART_DEFINITION", label: "Existing part definition" },
  { value: "IGNORE", label: "Ignore" },
  { value: "REFERENCE_GEOMETRY", label: "Reference geometry" },
  { value: "UNMAPPED", label: "Unmapped" },
];

function targetOptions(
  kind: TargetKind,
  targets: { subsystems: SubsystemRecord[]; mechanisms: MechanismRecord[]; partDefinitions: PartDefinitionRecord[] },
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

function ruleOrigin(mapping: CadStepMappingRecord) {
  if (mapping.rule) {
    return "existing rule";
  }
  if (mapping.confidence === "MANUAL") {
    return "manual override";
  }
  return mapping.status === "CONFIRMED" ? "this snapshot only" : "new suggestion";
}

function defaultCarryForwardRuleMode(mapping: CadStepMappingRecord): CarryForwardRuleMode {
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

function carryForwardRuleModeDescription(mode: CarryForwardRuleMode) {
  return carryForwardRuleModes.find((ruleMode) => ruleMode.value === mode)?.description ?? "";
}

function carryForwardRuleModeLabel(mode: CarryForwardRuleMode) {
  return carryForwardRuleModes.find((ruleMode) => ruleMode.value === mode)?.label ?? mode;
}

function defaultTargetKind(mapping: CadStepMappingRecord): TargetKind {
  if (mapping.targetKind !== "UNMAPPED") {
    return mapping.targetKind;
  }
  if (mapping.sourceKind === "PART_DEFINITION" || mapping.sourceKind === "PART_INSTANCE") {
    return "PART_DEFINITION";
  }
  return "SUBSYSTEM";
}

function targetKindRequiresTarget(kind: TargetKind) {
  return kind === "SUBSYSTEM" || kind === "MECHANISM" || kind === "PART_DEFINITION";
}

function repeatedInstanceQuantity(mapping: CadStepMappingRecord) {
  return mapping.quantity ?? mapping.sourceIds?.length ?? 1;
}

function targetKindForRuleMode(ruleMode: CarryForwardRuleMode, targetKind: TargetKind): TargetKind {
  if (ruleMode === "ignore") {
    return "IGNORE";
  }
  return targetKind;
}

function ruleModeAppliesToFuture(ruleMode: CarryForwardRuleMode) {
  return ruleMode !== "snapshot" && ruleMode !== "split_merge_deferred";
}

export function CadStepMappingReviewTable({
  groupRepeatedInstances,
  isSavingMapping,
  mappings,
  onConfirmMapping,
  onGroupRepeatedInstancesChange,
  targets,
  usesPlaceholderParser,
}: {
  groupRepeatedInstances: boolean;
  isSavingMapping: boolean;
  mappings: CadStepMappingRecord[];
  onConfirmMapping: (input: CadStepMappingConfirmInput) => void;
  onGroupRepeatedInstancesChange: (value: boolean) => void;
  targets: { subsystems: SubsystemRecord[]; mechanisms: MechanismRecord[]; partDefinitions: PartDefinitionRecord[] };
  usesPlaceholderParser: boolean;
}) {
  const [drafts, setDrafts] = useState<Record<string, { targetKind: TargetKind; targetId: string; ruleMode: CarryForwardRuleMode }>>({});
  const readDraft = (mapping: CadStepMappingRecord) => drafts[mapping.id] ?? {
    targetKind: defaultTargetKind(mapping),
    targetId: mapping.targetId ?? "",
    ruleMode: defaultCarryForwardRuleMode(mapping),
  };

  return (
    <section className="cad-card">
      <div className="cad-section-heading cad-mapping-heading">
        <div>
          <span className="cad-eyebrow">Mapping review</span>
          <h3>Detected items</h3>
          <p className="cad-mapping-choice">Split/merge mapping rules are represented as a deferred state until multi-source carry-forward rules are supported.</p>
        </div>
        <label className="cad-group-toggle">
          <input
            checked={groupRepeatedInstances}
            onChange={(event) => onGroupRepeatedInstancesChange(event.target.checked)}
            type="checkbox"
          />
          <span>Group repeated instances</span>
        </label>
      </div>
      <div className="cad-table-wrap">
        <table className="cad-table cad-mapping-table">
          <thead>
            <tr><th>Detected item</th><th>Type</th><th>Quantity</th><th>Parent assembly</th><th>Suggested target</th><th>Carry-forward rule</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {mappings.length ? mappings.map((mapping) => {
              const draft = readDraft(mapping);
              const effectiveTargetKind = targetKindForRuleMode(draft.ruleMode, draft.targetKind);
              const options = targetOptions(effectiveTargetKind, targets);
              const instanceQuantity = repeatedInstanceQuantity(mapping);
              const isGroupedRow = mapping.kind === "part_instance_group" || instanceQuantity > 1;
              const sourceIds = isGroupedRow ? mapping.sourceIds ?? [mapping.sourceId] : undefined;
              const isSplitMergeDeferred = draft.ruleMode === "split_merge_deferred";
              const isConfirmBlocked = isSplitMergeDeferred || (targetKindRequiresTarget(effectiveTargetKind) && !draft.targetId);
              const ruleDescription = carryForwardRuleModeDescription(draft.ruleMode);
              return (
                <tr data-status={mapping.status} key={mapping.id}>
                  <td>
                    <strong>{mapping.sourceName}</strong>
                    <small>{ruleOrigin(mapping)}</small>
                    {mapping.hasMixedMappings ? <span className="cad-warning-badge">Mixed mappings</span> : null}
                    {mapping.warning ? <small>{mapping.warning}</small> : null}
                  </td>
                  <td>{mapping.sourceKind.replace(/_/g, " ").toLowerCase()}</td>
                  <td>{isGroupedRow ? <span className="cad-quantity-pill">{"\u00d7"}{instanceQuantity}</span> : "1"}</td>
                  <td>{mapping.parentAssemblyName ?? "None"}</td>
                  <td>
                    <select
                      disabled={draft.ruleMode === "ignore" || isSplitMergeDeferred}
                      value={effectiveTargetKind}
                      onChange={(event) => setDrafts({
                        ...drafts,
                        [mapping.id]: { ...draft, targetKind: event.target.value as TargetKind, targetId: "" },
                      })}
                    >
                      {targetKinds.map((kind) => <option key={kind.value} value={kind.value}>{kind.label}</option>)}
                    </select>
                    {options.length ? (
                      <select
                        value={draft.targetId}
                        onChange={(event) => setDrafts({
                          ...drafts,
                          [mapping.id]: { ...draft, targetId: event.target.value },
                        })}
                      >
                        <option value="">Select target</option>
                        {options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                      </select>
                    ) : null}
                  </td>
                  <td>
                    <select
                      value={draft.ruleMode}
                      onChange={(event) => {
                        const ruleMode = event.target.value as CarryForwardRuleMode;
                        setDrafts({
                          ...drafts,
                          [mapping.id]: {
                            ...draft,
                            ruleMode,
                            targetKind: ruleMode === "ignore" ? "IGNORE" : draft.targetKind,
                            targetId: ruleMode === "ignore" || ruleMode === "split_merge_deferred" ? "" : draft.targetId,
                          },
                        });
                      }}
                    >
                      {carryForwardRuleModes.map((ruleMode) => (
                        <option
                          disabled={usesPlaceholderParser && ruleMode.value !== "snapshot"}
                          key={ruleMode.value}
                          value={ruleMode.value}
                        >
                          {ruleMode.label}
                        </option>
                      ))}
                    </select>
                    <small>{ruleDescription}</small>
                    <small>Current: {carryForwardRuleModeLabel(defaultCarryForwardRuleMode(mapping))}; confidence {mapping.confidence.toLowerCase()}</small>
                  </td>
                  <td>{mapping.status.replace(/_/g, " ").toLowerCase()}</td>
                  <td>
                    <p className="cad-mapping-choice">
                      {effectiveTargetKind === "IGNORE"
                        ? "Review choice: ignore item."
                        : `Review choice: ${carryForwardRuleModeLabel(draft.ruleMode)}${ruleModeAppliesToFuture(draft.ruleMode) ? " for future imports" : " before finalize"}.`}
                    </p>
                    <div className="cad-row-actions">
                      <button
                        className="secondary-button compact-action"
                        disabled={isSavingMapping || usesPlaceholderParser || isConfirmBlocked}
                        onClick={() => onConfirmMapping({
                          mappingId: isGroupedRow ? undefined : mapping.id,
                          sourceKind: isGroupedRow ? mapping.sourceKind : undefined,
                          sourceIds,
                          targetKind: effectiveTargetKind,
                          targetId: effectiveTargetKind === "IGNORE" ? null : draft.targetId || null,
                          applyToFuture: !usesPlaceholderParser && ruleModeAppliesToFuture(draft.ruleMode),
                        })}
                        type="button"
                      >
                        Confirm
                      </button>
                      <button
                        className="ghost-button compact-action"
                        disabled={isSavingMapping || usesPlaceholderParser}
                        onClick={() => onConfirmMapping({
                          mappingId: isGroupedRow ? undefined : mapping.id,
                          sourceKind: isGroupedRow ? mapping.sourceKind : undefined,
                          sourceIds,
                          targetKind: "IGNORE",
                          targetId: null,
                          applyToFuture: !usesPlaceholderParser && ruleModeAppliesToFuture(draft.ruleMode),
                        })}
                        type="button"
                      >
                        Ignore
                      </button>
                      <button
                        className="ghost-button compact-action"
                        disabled={isSavingMapping || usesPlaceholderParser}
                        onClick={() => onConfirmMapping({
                          mappingId: isGroupedRow ? undefined : mapping.id,
                          sourceKind: isGroupedRow ? mapping.sourceKind : undefined,
                          sourceIds,
                          targetKind: "REFERENCE_GEOMETRY",
                          targetId: null,
                          applyToFuture: !usesPlaceholderParser && ruleModeAppliesToFuture(draft.ruleMode),
                        })}
                        type="button"
                      >
                        Reference
                      </button>
                    </div>
                    {isConfirmBlocked ? <small>Select a target before confirming.</small> : null}
                    {isSplitMergeDeferred ? <small>Split/merge carry-forward is deferred until the platform supports multi-source rules.</small> : null}
                    {isGroupedRow ? <small>Applies to {instanceQuantity} repeated instances</small> : null}
                  </td>
                </tr>
              );
            }) : <tr><td colSpan={8}>No mappings yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
