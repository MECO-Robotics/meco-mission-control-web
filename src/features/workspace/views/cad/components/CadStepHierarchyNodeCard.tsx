import { useEffect, useState } from "react";

import type {
  CadHierarchyNode,
  CadHierarchyReviewDecision,
  CadHierarchyTargetKind,
} from "../model/cadStepTypes";
import { targetKindRequiresTarget } from "../model/cadStepMappingRules";
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

interface CadStepHierarchyNodeCardProps {
  node: CadHierarchyNode;
  onConfirm: (decision: CadHierarchyReviewDecision) => void;
  targets: CadHierarchyTargets;
  targetKind: CadHierarchyTargetKind;
}

function DecisionControls({
  node,
  onConfirm,
  targets,
  targetKind,
}: CadStepHierarchyNodeCardProps) {
  const classificationOptions: Array<{ value: CadHierarchyTargetKind; label: string }> = [
    ...(targetKind === "SUBSYSTEM" || targetKind === "PART_DEFINITION"
      ? [{
          value: targetKind,
          label: targetKind === "SUBSYSTEM" ? "Subsystem" : "Existing part definition",
        }]
      : [
          { value: "MECHANISM" as const, label: "Mechanism" },
          { value: "COMPONENT_ASSEMBLY" as const, label: "Component assembly" },
          { value: "SUBSYSTEM" as const, label: "Nested subsystem" },
        ]),
    { value: "REFERENCE_GEOMETRY" as const, label: "Reference geometry" },
    { value: "IGNORE" as const, label: "Ignore" },
    { value: "UNMAPPED" as const, label: "Needs review" },
  ];
  const [draft, setDraft] = useState(() => buildDecisionDraft(node, targetKind));
  const {
    id,
    resolvedComponentAssemblyId,
    resolvedMechanismId,
    resolvedPartDefinitionId,
    resolvedSubsystemId,
  } = node;
  const options = hierarchyTargetOptions(draft.targetKind, targets);
  const isConfirmDisabled = targetKindRequiresTarget(draft.targetKind) && !draft.targetId;

  useEffect(() => {
    setDraft({
      parentMechanismId: resolvedMechanismId ?? "",
      parentSubsystemId: resolvedSubsystemId ?? "",
      targetId:
        targetKind === "SUBSYSTEM"
          ? resolvedSubsystemId ?? ""
          : targetKind === "MECHANISM"
            ? resolvedMechanismId ?? ""
            : targetKind === "PART_DEFINITION"
              ? resolvedPartDefinitionId ?? ""
              : "",
      targetKind,
    });
  }, [
    id,
    resolvedComponentAssemblyId,
    resolvedMechanismId,
    resolvedPartDefinitionId,
    resolvedSubsystemId,
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
        className="secondary-action compact-action"
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
}: CadStepHierarchyNodeCardProps) {
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
