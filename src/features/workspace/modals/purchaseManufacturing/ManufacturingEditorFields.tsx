import type { Dispatch, SetStateAction } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { ManufacturingItemPayload } from "@/types/payloads";
import { inferManufacturingDraftFromPartSelection } from "@/lib/appUtils/manufacturing";

import { ManufacturingPartInstancesSection } from "./ManufacturingPartInstancesSection";
import { useManufacturingEditorState } from "./useManufacturingEditorState";

interface ManufacturingEditorFieldsProps {
  bootstrap: BootstrapPayload;
  manufacturingDraft: ManufacturingItemPayload;
  manufacturingModalMode: "create" | "edit";
  setManufacturingDraft: Dispatch<SetStateAction<ManufacturingItemPayload>>;
}

export function ManufacturingEditorFields({
  bootstrap,
  manufacturingDraft,
  manufacturingModalMode,
  setManufacturingDraft,
}: ManufacturingEditorFieldsProps) {
  const {
    filteredPartInstances,
    getPartInstanceSubtitle,
    materialOptions,
    selectedPartDefinition,
    selectedPartInstanceIds,
  } = useManufacturingEditorState(bootstrap, manufacturingDraft);

  return (
    <>
      <label className="field modal-wide">
        <span style={{ color: "var(--text-title)" }}>Part definition</span>
        <select
          onChange={(milestone) => {
            const partDefinitionId = milestone.target.value;

            setManufacturingDraft((current) =>
              inferManufacturingDraftFromPartSelection(
                bootstrap,
                current,
                partDefinitionId,
              ),
            );
          }}
          required
          style={{ background: "var(--bg-row-alt)", border: "1px solid var(--border-base)", color: "var(--text-title)" }}
          value={manufacturingDraft.partDefinitionId ?? ""}
        >
          <option value="">Select a real part from the Parts tab...</option>
          {bootstrap.partDefinitions.map((partDefinition) => (
            <option key={partDefinition.id} value={partDefinition.id}>
              {partDefinition.partNumber} - {partDefinition.name} (Rev {partDefinition.revision})
            </option>
          ))}
        </select>
        <small style={{ color: "var(--text-copy)" }}>
          {selectedPartDefinition
            ? `${selectedPartDefinition.name} will be used as the job title.`
            : "Choose the catalog part before selecting the instances being made."}
        </small>
      </label>
      <ManufacturingPartInstancesSection
        filteredPartInstances={filteredPartInstances}
        getPartInstanceSubtitle={getPartInstanceSubtitle}
        selectedPartDefinition={selectedPartDefinition}
        selectedPartInstanceIds={selectedPartInstanceIds}
        setManufacturingDraft={setManufacturingDraft}
        bootstrap={bootstrap}
      />
      <label className="field">
        <span style={{ color: "var(--text-title)" }}>Requester</span>
        <select
          onChange={(milestone) =>
            setManufacturingDraft((current) => ({
              ...current,
              requestedById: milestone.target.value || null,
            }))
          }
          style={{ background: "var(--bg-row-alt)", border: "1px solid var(--border-base)", color: "var(--text-title)" }}
          value={manufacturingDraft.requestedById ?? ""}
        >
          <option value="">Unassigned</option>
          {bootstrap.members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span style={{ color: "var(--text-title)" }}>Due date</span>
        <input
          onChange={(milestone) =>
            setManufacturingDraft((current) => ({
              ...current,
              dueDate: milestone.target.value,
            }))
          }
          style={{ background: "var(--bg-row-alt)", border: "1px solid var(--border-base)", color: "var(--text-title)" }}
          type="date"
          value={manufacturingDraft.dueDate}
        />
      </label>
      <label className="field">
        <span style={{ color: "var(--text-title)" }}>Material</span>
        <select
          onChange={(milestone) => {
            const selectedId = milestone.target.value;
            const material = bootstrap.materials.find((item) => item.id === selectedId);
            setManufacturingDraft((current) => ({
              ...current,
              materialId: material?.id ?? null,
              material: material?.name ?? selectedId,
            }));
          }}
          required
          style={{ background: "var(--bg-row-alt)", border: "1px solid var(--border-base)", color: "var(--text-title)" }}
          value={manufacturingDraft.materialId ?? manufacturingDraft.material}
        >
          <option value="">Select material...</option>
          {materialOptions.map((material) => (
            <option key={material.id} value={material.id}>
              {material.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span style={{ color: "var(--text-title)" }}>Quantity</span>
        <input
          min="1"
          onChange={(milestone) =>
            setManufacturingDraft((current) => ({
              ...current,
              quantity: Number(milestone.target.value),
            }))
          }
          style={{ background: "var(--bg-row-alt)", border: "1px solid var(--border-base)", color: "var(--text-title)" }}
          type="number"
          value={manufacturingDraft.quantity}
        />
      </label>
      <label className="field">
        <span style={{ color: "var(--text-title)" }}>Status</span>
        <select
          onChange={(milestone) =>
            setManufacturingDraft((current) => ({
              ...current,
              status: milestone.target.value as ManufacturingItemPayload["status"],
            }))
          }
          style={{ background: "var(--bg-row-alt)", border: "1px solid var(--border-base)", color: "var(--text-title)" }}
          value={manufacturingDraft.status}
        >
          <option value="requested">Requested</option>
          <option value="approved">Approved</option>
          <option value="in-progress">In progress</option>
          <option value="qa">QA</option>
          <option value="complete">Complete</option>
        </select>
      </label>
      <label className="field">
        <span style={{ color: "var(--text-title)" }}>Batch label</span>
        <input
          onChange={(milestone) =>
            setManufacturingDraft((current) => ({
              ...current,
              batchLabel: milestone.target.value,
            }))
          }
          placeholder="Optional"
          style={{ background: "var(--bg-row-alt)", border: "1px solid var(--border-base)", color: "var(--text-title)" }}
          value={manufacturingDraft.batchLabel ?? ""}
        />
      </label>
      {manufacturingDraft.process === "cnc" ? (
        <div className="checkbox-row modal-wide">
          <label className="checkbox-field">
            <input
              checked={manufacturingDraft.inHouse}
              onChange={(milestone) =>
                setManufacturingDraft((current) => ({
                  ...current,
                  inHouse: milestone.target.checked,
                }))
              }
              type="checkbox"
            />
            <span style={{ color: "var(--text-title)" }}>In-house</span>
          </label>
        </div>
      ) : null}
      {manufacturingModalMode === "edit" ? (
        <div className="checkbox-row modal-wide">
          <label className="checkbox-field">
            <input
              checked={manufacturingDraft.mentorReviewed}
              onChange={(milestone) =>
                setManufacturingDraft((current) => ({
                  ...current,
                  mentorReviewed: milestone.target.checked,
                }))
              }
              type="checkbox"
            />
            <span style={{ color: "var(--text-title)" }}>Mentor reviewed</span>
          </label>
        </div>
      ) : null}
    </>
  );
}
