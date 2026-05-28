import { useEffect, useState } from "react";

import type {
  CadHierarchyNode,
  CadHierarchyReviewDecision,
  CadHierarchyTargetKind,
} from "../model/cadIntegrationTypes";
import {
  compactHierarchyLabel,
  hierarchyStatusTone,
  hierarchySummaryLine,
  hierarchyTargetOptions,
  readHierarchyTargetId,
  type CadHierarchyTargets,
} from "./CadStepHierarchyReviewUtils";

function buildDecisionDraft(node: CadHierarchyNode, targetKind: CadHierarchyTargetKind) {
  return {
    parentMechanismId: node.resolvedMechanismId ?? "",
    parentSubsystemId: node.resolvedSubsystemId ?? "",
    targetId: readHierarchyTargetId(node, targetKind),
    targetKind,
  };
}

function targetKindRequiresTarget(targetKind: CadHierarchyTargetKind) {
  return targetKind === "SUBSYSTEM" || targetKind === "MECHANISM" || targetKind === "PART_DEFINITION";
}

function DecisionControls({
  node,
  onConfirm,
  targets,
  targetKind,
}: {
  node: CadHierarchyNode;
  onConfirm: (decision: CadHierarchyReviewDecision) => void;
  targets: CadHierarchyTargets;
  targetKind: CadHierarchyTargetKind;
}) {
  const classificationOptions: Array<{ value: CadHierarchyTargetKind; label: string }> =
    targetKind === "SUBSYSTEM"
      ? [
          { value: "SUBSYSTEM", label: "Subsystem" },
          { value: "REFERENCE_GEOMETRY", label: "Reference geometry" },
          { value: "IGNORE", label: "Ignore" },
          { value: "UNMAPPED", label: "Needs review" },
        ]
      : targetKind === "PART_DEFINITION"
        ? [
            { value: "PART_DEFINITION", label: "Existing part definition" },
            { value: "REFERENCE_GEOMETRY", label: "Reference geometry" },
            { value: "IGNORE", label: "Ignore" },
            { value: "UNMAPPED", label: "Needs review" },
          ]
        : [
            { value: "MECHANISM", label: "Mechanism" },
            { value: "COMPONENT_ASSEMBLY", label: "Component assembly" },
            { value: "SUBSYSTEM", label: "Nested subsystem" },
            { value: "REFERENCE_GEOMETRY", label: "Reference geometry" },
            { value: "IGNORE", label: "Ignore" },
            { value: "UNMAPPED", label: "Needs review" },
          ];
  const [draft, setDraft] = useState(() => buildDecisionDraft(node, targetKind));
  const options = hierarchyTargetOptions(draft.targetKind, targets);
  const isConfirmDisabled = targetKindRequiresTarget(draft.targetKind) && !draft.targetId;

  useEffect(() => {
    setDraft(buildDecisionDraft(node, targetKind));
  }, [
    node.id,
    node.resolvedComponentAssemblyId,
    node.resolvedMechanismId,
    node.resolvedPartDefinitionId,
    node.resolvedSubsystemId,
    targetKind,
  ]);

  return (
    <div className="cad-hierarchy-decision">
      <label>
        <span>Classification</span>
        <select
          onChange={(event) => setDraft({ ...draft, targetId: "", targetKind: event.target.value as CadHierarchyTargetKind })}
          value={draft.targetKind}
        >
          {classificationOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
      {draft.targetKind === "MECHANISM" || draft.targetKind === "COMPONENT_ASSEMBLY" ? (
        <label>
          <span>Parent subsystem</span>
          <select onChange={(event) => setDraft({ ...draft, parentSubsystemId: event.target.value })} value={draft.parentSubsystemId}>
            <option value="">Select subsystem</option>
            {targets.subsystems.map((subsystem) => <option key={subsystem.id} value={subsystem.id}>{subsystem.name}</option>)}
          </select>
        </label>
      ) : null}
      {draft.targetKind === "COMPONENT_ASSEMBLY" ? (
        <label>
          <span>Parent mechanism</span>
          <select onChange={(event) => setDraft({ ...draft, parentMechanismId: event.target.value })} value={draft.parentMechanismId}>
            <option value="">Select mechanism</option>
            {targets.mechanisms.map((mechanism) => <option key={mechanism.id} value={mechanism.id}>{mechanism.name}</option>)}
          </select>
        </label>
      ) : null}
      {draft.targetKind === "COMPONENT_ASSEMBLY" ? (
        <small className="cad-hierarchy-help">
          Use component assembly for buildable subassemblies inside a mechanism, such as roller assemblies, bearing blocks, shaft stacks, pulley stacks.
        </small>
      ) : null}
      {options.length ? (
        <label>
          <span>
            {draft.targetKind === "MECHANISM"
              ? "Existing mechanism"
              : draft.targetKind === "PART_DEFINITION"
                ? "Existing part definition"
                : draft.targetKind === "COMPONENT_ASSEMBLY"
                  ? "Component assembly"
                  : "Existing subsystem"}
          </span>
          <select onChange={(event) => setDraft({ ...draft, targetId: event.target.value })} value={draft.targetId}>
            <option value="">Select target</option>
            {options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
          </select>
        </label>
      ) : null}
      <button
        className="secondary-button compact-action"
        disabled={isConfirmDisabled}
        onClick={() => onConfirm({
          nodeId: node.id,
          sourceId: node.sourceId,
          parentMechanismId: draft.parentMechanismId || null,
          parentSubsystemId: draft.parentSubsystemId || null,
          sourceKind: node.sourceKind,
          status: "CONFIRMED",
          targetId: draft.targetId || null,
          targetKind: draft.targetKind,
        })}
        type="button"
      >
        Confirm
      </button>
    </div>
  );
}

export function CadStepHierarchyNodeCard({
  node,
  onConfirm,
  targets,
  targetKind,
}: {
  node: CadHierarchyNode;
  onConfirm: (decision: CadHierarchyReviewDecision) => void;
  targets: CadHierarchyTargets;
  targetKind: CadHierarchyTargetKind;
}) {
  return (
    <article className="cad-hierarchy-node" data-status={hierarchyStatusTone(node)}>
      <div>
        <strong>{node.name}</strong>
        <span>{compactHierarchyLabel(node.inferredType)} - {compactHierarchyLabel(node.status)} - {compactHierarchyLabel(node.confidence)}</span>
        <code>{node.instancePath}</code>
      </div>
      <p>{hierarchySummaryLine(node)}</p>
      <DecisionControls node={node} onConfirm={onConfirm} targets={targets} targetKind={targetKind} />
    </article>
  );
}
