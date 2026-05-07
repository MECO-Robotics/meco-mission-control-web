import type { Dispatch, SetStateAction } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { PurchaseItemPayload } from "@/types/payloads";

interface PurchaseEditorFieldsProps {
  bootstrap: BootstrapPayload;
  purchaseDraft: PurchaseItemPayload;
  purchaseFinalCost: string;
  setPurchaseDraft: Dispatch<SetStateAction<PurchaseItemPayload>>;
  setPurchaseFinalCost: (value: string) => void;
}

export function PurchaseEditorFields({
  bootstrap,
  purchaseDraft,
  purchaseFinalCost,
  setPurchaseDraft,
  setPurchaseFinalCost,
}: PurchaseEditorFieldsProps) {
  const selectedPartDefinition = bootstrap.partDefinitions.find(
    (partDefinition) => partDefinition.id === purchaseDraft.partDefinitionId,
  );

  return (
    <>
      <label className="field modal-wide">
        <span style={{ color: "var(--text-title)" }}>Part</span>
        <select
          onChange={(milestone) => {
            const partDefinitionId = milestone.target.value;
            const partDefinition = bootstrap.partDefinitions.find(
              (candidate) => candidate.id === partDefinitionId,
            );

            setPurchaseDraft((current) => ({
              ...current,
              partDefinitionId,
              title: partDefinition?.name ?? current.title,
            }));
          }}
          required
          style={{ background: "var(--bg-row-alt)", border: "1px solid var(--border-base)", color: "var(--text-title)" }}
          value={purchaseDraft.partDefinitionId ?? ""}
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
            ? `Stored as ${selectedPartDefinition.name}.`
            : "Purchases can only be logged against a real part from the catalog."}
        </small>
      </label>
      <label className="field">
        <span style={{ color: "var(--text-title)" }}>Subsystem</span>
        <select
          onChange={(milestone) =>
            setPurchaseDraft((current) => ({
              ...current,
              subsystemId: milestone.target.value,
            }))
          }
          style={{ background: "var(--bg-row-alt)", border: "1px solid var(--border-base)", color: "var(--text-title)" }}
          value={purchaseDraft.subsystemId}
        >
          {bootstrap.subsystems.map((subsystem) => (
            <option key={subsystem.id} value={subsystem.id}>
              {subsystem.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span style={{ color: "var(--text-title)" }}>Requester</span>
        <select
          onChange={(milestone) =>
            setPurchaseDraft((current) => ({
              ...current,
              requestedById: milestone.target.value || null,
            }))
          }
          style={{ background: "var(--bg-row-alt)", border: "1px solid var(--border-base)", color: "var(--text-title)" }}
          value={purchaseDraft.requestedById ?? ""}
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
        <span style={{ color: "var(--text-title)" }}>Vendor</span>
        <input
          onChange={(milestone) =>
            setPurchaseDraft((current) => ({
              ...current,
              vendor: milestone.target.value,
            }))
          }
          required
          style={{ background: "var(--bg-row-alt)", border: "1px solid var(--border-base)", color: "var(--text-title)" }}
          value={purchaseDraft.vendor}
        />
      </label>
      <label className="field">
        <span style={{ color: "var(--text-title)" }}>Link label</span>
        <input
          onChange={(milestone) =>
            setPurchaseDraft((current) => ({
              ...current,
              linkLabel: milestone.target.value,
            }))
          }
          required
          style={{ background: "var(--bg-row-alt)", border: "1px solid var(--border-base)", color: "var(--text-title)" }}
          value={purchaseDraft.linkLabel}
        />
      </label>
      <label className="field">
        <span style={{ color: "var(--text-title)" }}>Quantity</span>
        <input
          min="1"
          onChange={(milestone) =>
            setPurchaseDraft((current) => ({
              ...current,
              quantity: Number(milestone.target.value),
            }))
          }
          style={{ background: "var(--bg-row-alt)", border: "1px solid var(--border-base)", color: "var(--text-title)" }}
          type="number"
          value={purchaseDraft.quantity}
        />
      </label>
      <label className="field">
        <span style={{ color: "var(--text-title)" }}>Status</span>
        <select
          onChange={(milestone) =>
            setPurchaseDraft((current) => ({
              ...current,
              status: milestone.target.value as PurchaseItemPayload["status"],
            }))
          }
          style={{ background: "var(--bg-row-alt)", border: "1px solid var(--border-base)", color: "var(--text-title)" }}
          value={purchaseDraft.status}
        >
          <option value="requested">Requested</option>
          <option value="approved">Approved</option>
          <option value="purchased">Purchased</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
        </select>
      </label>
      <label className="field">
        <span style={{ color: "var(--text-title)" }}>Estimated cost</span>
        <input
          min="0"
          onChange={(milestone) =>
            setPurchaseDraft((current) => ({
              ...current,
              estimatedCost: Number(milestone.target.value),
            }))
          }
          style={{ background: "var(--bg-row-alt)", border: "1px solid var(--border-base)", color: "var(--text-title)" }}
          type="number"
          value={purchaseDraft.estimatedCost}
        />
      </label>
      <label className="field">
        <span style={{ color: "var(--text-title)" }}>Final cost</span>
        <input
          min="0"
          onChange={(milestone) => setPurchaseFinalCost(milestone.target.value)}
          placeholder="Optional"
          style={{ background: "var(--bg-row-alt)", border: "1px solid var(--border-base)", color: "var(--text-title)" }}
          type="number"
          value={purchaseFinalCost}
        />
      </label>
      <div className="checkbox-row modal-wide">
        <label className="checkbox-field">
          <input
            checked={purchaseDraft.approvedByMentor}
            onChange={(milestone) =>
              setPurchaseDraft((current) => ({
                ...current,
                approvedByMentor: milestone.target.checked,
              }))
            }
            type="checkbox"
          />
          <span style={{ color: "var(--text-title)" }}>Mentor approved</span>
        </label>
      </div>
    </>
  );
}
