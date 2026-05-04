import type { BootstrapPayload, MilestoneRecord, MilestoneRequirementRecord } from "@/types";
import {
  getMilestoneRequirementTasks,
  getMilestoneRequirementsForMilestone,
  getMilestoneTaskBoardState,
  getMilestoneTaskBoardStateLabel,
} from "@/features/workspace/shared/milestones";
import { getStatusPillClassName } from "@/features/workspace/shared/model";

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

  const targetLabel =
    requirement.targetType === "project"
      ? "Project"
      : requirement.targetType === "workflow"
        ? "Workflow"
        : requirement.targetType === "artifact"
          ? "Artifact"
          : requirement.targetType === "subsystem"
            ? "Subsystem"
            : requirement.targetType === "mechanism"
              ? "Mechanism"
              : requirement.targetType === "part-instance"
                ? "Part instance"
                : requirement.targetType;

  return targetName ? `${targetLabel}: ${targetName}` : `${targetLabel}: ${requirement.targetId}`;
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
    return `Workflow state ${requirement.conditionValue}`;
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
  const requirementStateLabel = getMilestoneTaskBoardStateLabel(requirementState);
  const requirementTargetLabel = getMilestoneRequirementTargetLabel(requirement, bootstrap);
  const requirementConditionLabel = getMilestoneRequirementConditionLabel(requirement);

  return (
    <article
      style={{
        display: "grid",
        gap: "0.35rem",
        padding: "0.75rem",
        border: "1px solid var(--border-base)",
        borderRadius: "12px",
        background: "var(--bg-row-alt)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <strong style={{ color: "var(--text-title)" }}>{requirementTargetLabel}</strong>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", justifyContent: "flex-end" }}>
          <span
            className={
              requirement.required
                ? "pill status-pill status-pill-success"
                : "pill status-pill status-pill-neutral"
            }
          >
            {requirement.required ? "Required" : "Optional"}
          </span>
          <span className={getStatusPillClassName(requirementState)}>{requirementStateLabel}</span>
        </div>
      </div>
      <small style={{ color: "var(--text-copy)" }}>
        {requirementConditionLabel}
        {requirement.notes ? ` - ${requirement.notes}` : ""}
      </small>
    </article>
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
  const milestoneRequirements = activeMilestone
    ? getMilestoneRequirementsForMilestone(activeMilestone, bootstrap)
    : [];

  return milestoneModalMode !== "create" && activeMilestone ? (
    <div className="field modal-wide">
      <span style={{ color: "var(--text-title)" }}>Readiness</span>
      {milestoneRequirements.length > 0 ? (
        <div style={{ display: "grid", gap: "0.75rem", marginTop: "0.5rem" }}>
          {milestoneRequirements.map((requirement) => (
            <MilestoneRequirementCard key={requirement.id} bootstrap={bootstrap} requirement={requirement} />
          ))}
        </div>
      ) : (
        <p style={{ margin: "0.25rem 0 0", color: "var(--text-copy)" }}>
          No milestone requirements defined.
        </p>
      )}
    </div>
  ) : null;
}
