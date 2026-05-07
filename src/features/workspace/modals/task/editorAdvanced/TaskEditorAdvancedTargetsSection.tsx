import { formatIterationVersion } from "@/lib/appUtils/common";
import type { BootstrapPayload } from "@/types/bootstrap";

interface TaskEditorAdvancedTargetsSectionProps {
  getMechanismLabel: (mechanism: BootstrapPayload["mechanisms"][number]) => string;
  getPartInstanceLabel: (partInstance: BootstrapPayload["partInstances"][number]) => string;
  getSubsystemLabel: (subsystem: BootstrapPayload["subsystems"][number]) => string;
  projectMechanisms: BootstrapPayload["mechanisms"];
  projectPartInstances: BootstrapPayload["partInstances"];
  primaryTargetNameOptions: string[];
  selectedMechanismIds: string[];
  selectedPartInstanceIds: string[];
  selectedPrimaryTarget: BootstrapPayload["subsystems"][number] | null;
  selectedPrimaryTargetId: string;
  selectedPrimaryTargetIterations: BootstrapPayload["subsystems"];
  selectedPrimaryTargetName: string;
  selectedScopeChips: Array<{ key: string; label: string }>;
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>;
  targetFallback: string;
  targetGroupLabel: string;
  toggleTarget: (kind: "mechanism" | "part-instance", id: string) => void;
  updatePrimaryTarget: (subsystemId: string) => void;
  updatePrimaryTargetName: (subsystemName: string) => void;
}

function renderTargetOption(
  toggleTarget: (kind: "mechanism" | "part-instance", id: string) => void,
  kind: "mechanism" | "part-instance",
  id: string,
  label: string,
  detail: string | null,
  checked: boolean,
) {
  return (
    <label className={`task-target-option${checked ? " is-selected" : ""}`} key={`${kind}-${id}`}>
      <input checked={checked} onChange={() => toggleTarget(kind, id)} type="checkbox" />
      <span className="task-target-option-copy">
        <span>{label}</span>
        {detail ? <small>{detail}</small> : null}
      </span>
    </label>
  );
}

export function TaskEditorAdvancedTargetsSection({
  getMechanismLabel,
  getPartInstanceLabel,
  getSubsystemLabel,
  projectMechanisms,
  projectPartInstances,
  primaryTargetNameOptions,
  selectedMechanismIds,
  selectedPartInstanceIds,
  selectedPrimaryTarget,
  selectedPrimaryTargetId,
  selectedPrimaryTargetIterations,
  selectedPrimaryTargetName,
  selectedScopeChips,
  subsystemsById,
  targetFallback,
  targetGroupLabel,
  toggleTarget,
  updatePrimaryTarget,
  updatePrimaryTargetName,
}: TaskEditorAdvancedTargetsSectionProps) {
  return (
    <div className="field modal-wide task-target-picker">
      <span style={{ color: "var(--text-title)" }}>Targets</span>
      <label className="task-target-primary">
        <span>{targetGroupLabel === "Subsystems" ? "Subsystem" : "Workstream"}</span>
        <select
          onChange={(milestone) => updatePrimaryTargetName(milestone.target.value)}
          required
          style={{
            background: "var(--bg-row-alt)",
            color: "var(--text-title)",
            border: "1px solid var(--border-base)",
          }}
          value={selectedPrimaryTargetName}
        >
          <option value="" disabled>
            {targetFallback}
          </option>
          {primaryTargetNameOptions.map((subsystemName) => (
            <option key={subsystemName} value={subsystemName}>
              {subsystemName}
            </option>
          ))}
        </select>
      </label>
      <label className="task-target-primary">
        <span>Iteration</span>
        <select
          onChange={(milestone) => updatePrimaryTarget(milestone.target.value)}
          required
          style={{
            background: "var(--bg-row-alt)",
            color: "var(--text-title)",
            border: "1px solid var(--border-base)",
          }}
          value={selectedPrimaryTargetId}
        >
          <option value="" disabled>
            Select iteration
          </option>
          {selectedPrimaryTargetIterations.map((subsystem) => (
            <option key={subsystem.id} value={subsystem.id}>
              {formatIterationVersion(subsystem.iteration)}
            </option>
          ))}
        </select>
      </label>
      <div className="task-target-selected" aria-live="polite">
        {selectedPrimaryTarget ? (
          <span className="task-target-chip">{getSubsystemLabel(selectedPrimaryTarget)}</span>
        ) : null}
        {selectedScopeChips.length > 0 ? (
          selectedScopeChips.map((chip) => (
            <span className="task-target-chip" key={chip.key}>
              {chip.label}
            </span>
          ))
        ) : (
          <span className="task-target-empty">All mechanisms and part instances</span>
        )}
      </div>
      <div className="task-target-grid">
        <div className="task-target-group">
          <span className="task-target-group-title">Mechanisms</span>
          {projectMechanisms.map((mechanism) =>
            renderTargetOption(
              toggleTarget,
              "mechanism",
              mechanism.id,
              getMechanismLabel(mechanism),
              subsystemsById[mechanism.subsystemId]
                ? getSubsystemLabel(subsystemsById[mechanism.subsystemId])
                : null,
              selectedMechanismIds.includes(mechanism.id),
            ),
          )}
        </div>
        <div className="task-target-group">
          <span className="task-target-group-title">Part instances</span>
          {projectPartInstances.map((partInstance) =>
            {
              const mechanism = partInstance.mechanismId
                ? projectMechanisms.find((candidate) => candidate.id === partInstance.mechanismId) ?? null
                : null;

              return renderTargetOption(
                toggleTarget,
                "part-instance",
                partInstance.id,
                getPartInstanceLabel(partInstance),
                [
                  partInstance.subsystemId && subsystemsById[partInstance.subsystemId]
                    ? getSubsystemLabel(subsystemsById[partInstance.subsystemId])
                    : null,
                  mechanism ? getMechanismLabel(mechanism) : null,
                ]
                  .filter(Boolean)
                  .join(" / ") || null,
                selectedPartInstanceIds.includes(partInstance.id),
              );
            },
          )}
        </div>
      </div>
    </div>
  );
}
