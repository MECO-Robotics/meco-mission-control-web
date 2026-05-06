import { useEffect, useState } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { MilestoneRecord, MilestoneRequirementRecord } from "@/types/recordsExecution";
import { getMilestoneRequirementsForMilestone, getMilestoneRequirementTasks, getMilestoneTaskBoardState, MilestoneTaskStateIcon } from "@/features/workspace/shared/milestones/milestoneTaskState";

function getMilestoneRequirementTargetLabel(
  requirement: MilestoneRequirementRecord,
  bootstrap: BootstrapPayload,
) {
  const project = bootstrap.projects.find((item) => item.id === requirement.targetId);
  const workstream = bootstrap.workstreams.find((item) => item.id === requirement.targetId);
  const artifact = bootstrap.artifacts.find((item) => item.id === requirement.targetId);
  const subsystem = bootstrap.subsystems.find((item) => item.id === requirement.targetId);
  const mechanism = bootstrap.mechanisms.find((item) => item.id === requirement.targetId);
  const partInstance = bootstrap.partInstances.find((item) => item.id === requirement.targetId);

  const targetName =
    requirement.targetType === "project"
      ? project?.name
      : requirement.targetType === "workflow"
        ? workstream?.name
        : requirement.targetType === "artifact"
          ? artifact?.title
          : requirement.targetType === "subsystem"
            ? subsystem?.name
            : requirement.targetType === "mechanism"
              ? mechanism?.name
              : requirement.targetType === "part-instance"
                ? partInstance?.name
                : null;

  return targetName ?? requirement.targetId;
}

function getMilestoneRequirementTargetTypeLabel(requirement: MilestoneRequirementRecord) {
  if (requirement.targetType === "project") {
    return "Project";
  }

  if (requirement.targetType === "workflow") {
    return "Workflow";
  }

  if (requirement.targetType === "artifact") {
    return "Artifact";
  }

  if (requirement.targetType === "subsystem") {
    return "Subsystem";
  }

  if (requirement.targetType === "mechanism") {
    return "Mechanism";
  }

  if (requirement.targetType === "part-instance") {
    return "Part instance";
  }

  return requirement.targetType;
}

function isInScopeValue(raw: string) {
  return raw.trim().toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim() === "in scope";
}

function getMilestoneRequirementConditionLabel(requirement: MilestoneRequirementRecord) {
  if (requirement.conditionType === "iteration") {
    const normalized = requirement.conditionValue.trim().toLowerCase();
    const match = normalized.match(/^iteration\s*(?:([<>]=?|==|=)\s*)?(\d+)$/);

    if (match) {
      const [, operator, value] = match;
      return operator && operator !== "=" && operator !== "==" ? `Iteration ${operator} ${value}` : `Iteration ${value}`;
    }

    return requirement.conditionValue.trim() || "Iteration";
  }

  if (requirement.conditionType === "workflow_state") {
    const normalizedConditionValue = requirement.conditionValue
      .trim()
      .toLowerCase()
      .replace(/[-_]+/g, " ");

    if (isInScopeValue(normalizedConditionValue)) {
      return "";
    }

    return normalizedConditionValue;
  }

  if (isInScopeValue(requirement.conditionValue)) {
    return "";
  }

  return requirement.conditionValue.trim() || "Custom condition";
}

function MilestoneRequirementCard({
  bootstrap,
  requirement,
}: {
  bootstrap: BootstrapPayload;
  requirement: MilestoneRequirementRecord;
}) {
  const requirementTasks = getMilestoneRequirementTasks(requirement, bootstrap);
  const requirementState = getMilestoneTaskBoardState(requirementTasks, bootstrap);
  const requirementTargetLabel = getMilestoneRequirementTargetLabel(requirement, bootstrap);
  const requirementConditionLabel = getMilestoneRequirementConditionLabel(requirement);
  const requirementTargetTypeLabel = getMilestoneRequirementTargetTypeLabel(requirement);

  return (
    <article className="milestone-requirement-item">
      <div className="milestone-requirement-title-row">
        <span className="milestone-requirement-status-icon">
          <MilestoneTaskStateIcon compact state={requirementState} />
        </span>
        <span className="task-detail-copy milestone-requirement-title milestone-requirement-typography">
          {requirementTargetLabel}
        </span>
      </div>
      <div className="milestone-requirement-type-row">
        <span className="task-detail-copy milestone-requirement-type milestone-requirement-typography">
          {requirementTargetTypeLabel}
        </span>
      </div>
      <span className="task-detail-copy milestone-requirement-condition milestone-requirement-typography">
        {requirementConditionLabel
          ? (
            <>
              {requirementConditionLabel}
              {requirement.notes ? " - " : ""}
              {requirement.notes}
            </>
          )
          : (
            requirement.notes ?? ""
          )}
      </span>
    </article>
  );
}

function MilestoneRequirementColumn({
  bootstrap,
  heading,
  isOpen,
  requirements,
  emptyLabel,
  setIsOpen,
}: {
  bootstrap: BootstrapPayload;
  heading: string;
  isOpen: boolean;
  requirements: MilestoneRequirementRecord[];
  emptyLabel: string;
  setIsOpen: (nextOpen: boolean) => void;
}) {
  return (
    <div style={{ display: "grid", gap: "0.5rem", minWidth: 0 }}>
      <label className="field task-detail-row task-detail-collapsible-field">
        <details
          className="task-detail-collapsible"
          open={isOpen}
          onToggle={(event) => setIsOpen(event.currentTarget.open)}
        >
          <summary className="task-detail-collapsible-summary">
            <span className="task-detail-collapsible-summary-main">
              <span className="task-detail-collapsible-icon" aria-hidden="true"></span>
              <span className="task-detail-copy">{heading}</span>
            </span>
          </summary>
          <div
            className="task-detail-collapsible-body"
            style={{
              minHeight: "clamp(6.5rem, 18vh, 11rem)",
              maxHeight: "clamp(6.5rem, 18vh, 11rem)",
            }}
          >
            {requirements.length > 0 ? (
              requirements.map((requirement) => (
                <MilestoneRequirementCard key={requirement.id} bootstrap={bootstrap} requirement={requirement} />
              ))
            ) : (
      <div className="task-details-assigned-empty">{emptyLabel}</div>
            )}
          </div>
        </details>
      </label>
    </div>
  );
}

interface MilestonesMilestoneModalReadinessSectionProps {
  activeMilestone: MilestoneRecord | null;
  bootstrap: BootstrapPayload;
  milestoneModalMode: "create" | "detail" | "edit" | null;
}

export function MilestonesMilestoneModalReadinessSection({
  activeMilestone,
  bootstrap,
  milestoneModalMode,
}: MilestonesMilestoneModalReadinessSectionProps) {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    setIsOpen(true);
  }, [activeMilestone?.id]);

  const milestoneRequirements = activeMilestone
    ? getMilestoneRequirementsForMilestone(activeMilestone, bootstrap)
    : [];
  const optionalRequirements = milestoneRequirements.filter((requirement) => !requirement.required);
  const requiredRequirements = milestoneRequirements.filter((requirement) => requirement.required);
  const [isOptionalOpen, setOptionalOpen] = useState(true);
  const [isRequiredOpen, setRequiredOpen] = useState(true);

  useEffect(() => {
    setOptionalOpen(true);
    setRequiredOpen(true);
  }, [activeMilestone?.id]);

  return milestoneModalMode !== "create" && activeMilestone ? (
    <div className="field modal-wide task-details-milestone-requirements">
      <details className="task-details-section-collapse" open={isOpen} onToggle={(event) => setIsOpen(event.currentTarget.open)}>
        <summary className="task-details-section-title task-details-section-summary task-details-section-summary-no-arrow">
          <span>Requirements</span>
        </summary>
        <div
          style={{
            display: "grid",
            gap: "0.75rem",
            marginTop: "0.5rem",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          }}
        >
          <MilestoneRequirementColumn
            bootstrap={bootstrap}
            heading="Optional"
            requirements={optionalRequirements}
            emptyLabel="No optional requirements."
            isOpen={isOptionalOpen}
            setIsOpen={setOptionalOpen}
          />
          <MilestoneRequirementColumn
            bootstrap={bootstrap}
            heading="Required"
            requirements={requiredRequirements}
            emptyLabel="No required requirements."
            isOpen={isRequiredOpen}
            setIsOpen={setRequiredOpen}
          />
        </div>
      </details>
    </div>
  ) : null;
}
