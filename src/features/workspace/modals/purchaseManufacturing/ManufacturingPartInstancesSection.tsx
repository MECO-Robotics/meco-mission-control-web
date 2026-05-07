import type { Dispatch, SetStateAction } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { ManufacturingItemPayload } from "@/types/payloads";
import { toggleManufacturingDraftPartInstanceSelection } from "@/lib/appUtils/manufacturing";

interface ManufacturingPartInstancesSectionProps {
  bootstrap: BootstrapPayload;
  filteredPartInstances: BootstrapPayload["partInstances"];
  getPartInstanceSubtitle: (partInstance: BootstrapPayload["partInstances"][number]) => string;
  selectedPartDefinition: { name: string } | null;
  selectedPartInstanceIds: string[];
  setManufacturingDraft: Dispatch<SetStateAction<ManufacturingItemPayload>>;
}

export function ManufacturingPartInstancesSection({
  bootstrap,
  filteredPartInstances,
  getPartInstanceSubtitle,
  selectedPartDefinition,
  selectedPartInstanceIds,
  setManufacturingDraft,
}: ManufacturingPartInstancesSectionProps) {
  const togglePartInstance = (partInstanceId: string) => {
    setManufacturingDraft((current) =>
      toggleManufacturingDraftPartInstanceSelection(bootstrap, current, partInstanceId),
    );
  };

  return (
    <div className="field modal-wide task-target-picker">
      <span style={{ color: "var(--text-title)" }}>Part instances</span>
      <div className="task-target-group">
        <span className="task-target-group-title">Instances being made</span>
        {filteredPartInstances.length > 0 ? (
          filteredPartInstances.map((partInstance) => {
            const isSelected = selectedPartInstanceIds.includes(partInstance.id);

            return (
              <label
                className={`task-target-option${isSelected ? " is-selected" : ""}`}
                key={partInstance.id}
              >
                <input
                  checked={isSelected}
                  onChange={() => togglePartInstance(partInstance.id)}
                  type="checkbox"
                />
                <span className="task-target-option-copy">
                  <span>{partInstance.name}</span>
                  <small>{getPartInstanceSubtitle(partInstance)}</small>
                </span>
              </label>
            );
          })
        ) : (
          <span className="task-target-empty">
            {selectedPartDefinition
              ? "No part instances exist for this part definition yet."
              : "Choose a part definition first."}
          </span>
        )}
      </div>
    </div>
  );
}
