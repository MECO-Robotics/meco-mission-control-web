import { useState } from "react";

import type { MechanismRecord, PartDefinitionRecord, SubsystemRecord } from "@/types/records";
import type { CadStepMappingRecord } from "../model/cadIntegrationTypes";

type TargetKind = CadStepMappingRecord["targetKind"];

export interface CadStepMappingConfirmInput {
  mappingId?: string;
  sourceKind?: CadStepMappingRecord["sourceKind"];
  sourceIds?: string[];
  targetKind: TargetKind;
  targetId: string | null;
  applyToFuture: boolean;
}

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
  const [drafts, setDrafts] = useState<Record<string, { targetKind: TargetKind; targetId: string; scope: string }>>({});
  const readDraft = (mapping: CadStepMappingRecord) => drafts[mapping.id] ?? {
    targetKind: defaultTargetKind(mapping),
    targetId: mapping.targetId ?? "",
    scope: "snapshot",
  };

  return (
    <section className="cad-card">
      <div className="cad-section-heading cad-mapping-heading">
        <div>
          <span className="cad-eyebrow">Mapping review</span>
          <h3>Detected items</h3>
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
            <tr><th>Detected item</th><th>Type</th><th>Quantity</th><th>Parent assembly</th><th>Suggested target</th><th>Confidence</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {mappings.length ? mappings.map((mapping) => {
              const draft = readDraft(mapping);
              const options = targetOptions(draft.targetKind, targets);
              const instanceQuantity = repeatedInstanceQuantity(mapping);
              const isGroupedRow = mapping.kind === "part_instance_group" || instanceQuantity > 1;
              const sourceIds = isGroupedRow ? mapping.sourceIds ?? [mapping.sourceId] : undefined;
              const isConfirmBlocked = targetKindRequiresTarget(draft.targetKind) && !draft.targetId;
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
                      value={draft.targetKind}
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
                  <td>{mapping.confidence.toLowerCase()}</td>
                  <td>{mapping.status.replace(/_/g, " ").toLowerCase()}</td>
                  <td>
                    <select
                      value={draft.scope}
                      onChange={(event) => setDrafts({
                        ...drafts,
                        [mapping.id]: { ...draft, scope: event.target.value },
                      })}
                    >
                      <option value="snapshot">This snapshot only</option>
                      {usesPlaceholderParser ? null : <option value="future">This snapshot and future imports</option>}
                    </select>
                    <div className="cad-row-actions">
                      <button
                        className="secondary-button compact-action"
                        disabled={isSavingMapping || usesPlaceholderParser || isConfirmBlocked}
                        onClick={() => onConfirmMapping({
                          mappingId: isGroupedRow ? undefined : mapping.id,
                          sourceKind: isGroupedRow ? mapping.sourceKind : undefined,
                          sourceIds,
                          targetKind: draft.targetKind,
                          targetId: draft.targetId || null,
                          applyToFuture: !usesPlaceholderParser && draft.scope === "future",
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
                          applyToFuture: !usesPlaceholderParser && draft.scope === "future",
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
                          applyToFuture: !usesPlaceholderParser && draft.scope === "future",
                        })}
                        type="button"
                      >
                        Reference
                      </button>
                    </div>
                    {isConfirmBlocked ? <small>Select a target before confirming.</small> : null}
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
