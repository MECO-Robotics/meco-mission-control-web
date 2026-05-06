import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { PartInstancePayload } from "@/types/payloads";
import { PhotoUploadField } from "@/features/workspace/shared/media/PhotoUploadField";

interface PartInstanceEditorModalProps {
  bootstrap: BootstrapPayload;
  closePartInstanceModal: () => void;
  handlePartInstanceSubmit: (milestone: FormEvent<HTMLFormElement>) => void;
  isSavingPartInstance: boolean;
  requestPhotoUpload: (projectId: string, file: File) => Promise<string>;
  partDefinitionDraftsById: Record<string, BootstrapPayload["partDefinitions"][number]>;
  partInstanceDraft: PartInstancePayload;
  partInstanceModalMode: "create" | "edit";
  setPartInstanceDraft: Dispatch<SetStateAction<PartInstancePayload>>;
}

export function PartInstanceEditorModal({
  bootstrap,
  closePartInstanceModal,
  handlePartInstanceSubmit,
  isSavingPartInstance,
  requestPhotoUpload,
  partDefinitionDraftsById,
  partInstanceDraft,
  partInstanceModalMode,
  setPartInstanceDraft,
}: PartInstanceEditorModalProps) {
  const filteredMechanisms = bootstrap.mechanisms.filter(
    (mechanism) => mechanism.subsystemId === partInstanceDraft.subsystemId,
  );
  const partInstancePhotoProjectId =
    bootstrap.subsystems.find((subsystem) => subsystem.id === partInstanceDraft.subsystemId)
      ?.projectId ?? bootstrap.projects[0]?.id ?? null;

  return (
    <div className="modal-scrim" role="presentation" style={{ zIndex: 2000 }}>
      <section
        aria-modal="true"
        className="modal-card"
        role="dialog"
        style={{ background: "var(--bg-panel)", border: "1px solid var(--border-base)" }}
      >
        <div className="panel-header compact-header">
          <div>
            <p className="eyebrow" style={{ color: "var(--meco-blue)" }}>
              Part instance editor
            </p>
            <h2 style={{ color: "var(--text-title)" }}>
              {partInstanceModalMode === "create" ? "Add part instance" : "Edit part instance"}
            </h2>
          </div>
          <button
            className="icon-button"
            onClick={closePartInstanceModal}
            type="button"
            style={{ color: "var(--text-copy)", background: "transparent" }}
          >
            Close
          </button>
        </div>
        <form
          className="modal-form"
          onSubmit={handlePartInstanceSubmit}
          style={{ color: "var(--text-copy)" }}
        >
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Name</span>
            <input
              onChange={(milestone) =>
                setPartInstanceDraft((current) => ({ ...current, name: milestone.target.value }))
              }
              placeholder={
                partDefinitionDraftsById[partInstanceDraft.partDefinitionId]?.name ??
                "Installed part name"
              }
              required
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={partInstanceDraft.name}
            />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Part definition</span>
            <select
              onChange={(milestone) =>
                setPartInstanceDraft((current) => ({
                  ...current,
                  partDefinitionId: milestone.target.value,
                }))
              }
              required
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={partInstanceDraft.partDefinitionId}
            >
              {bootstrap.partDefinitions.map((partDefinition) => (
                <option key={partDefinition.id} value={partDefinition.id}>
                  {partDefinition.partNumber} - {partDefinition.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Subsystem</span>
            <select
              onChange={(milestone) =>
                setPartInstanceDraft((current) => {
                  const subsystemId = milestone.target.value;
                  const nextMechanisms = bootstrap.mechanisms.filter(
                    (mechanism) => mechanism.subsystemId === subsystemId,
                  );

                  return {
                    ...current,
                    subsystemId,
                    mechanismId: nextMechanisms[0]?.id ?? null,
                  };
                })
              }
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={partInstanceDraft.subsystemId}
            >
              {bootstrap.subsystems.map((subsystem) => (
                <option key={subsystem.id} value={subsystem.id}>
                  {subsystem.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Mechanism</span>
            <select
              onChange={(milestone) =>
                setPartInstanceDraft((current) => {
                  const mechanismId = milestone.target.value || null;
                  const selectedMechanism = mechanismId
                    ? bootstrap.mechanisms.find((mechanism) => mechanism.id === mechanismId) ?? null
                    : null;

                  return {
                    ...current,
                    subsystemId: selectedMechanism?.subsystemId ?? current.subsystemId,
                    mechanismId,
                  };
                })
              }
              required
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={partInstanceDraft.mechanismId ?? ""}
            >
              {filteredMechanisms.map((mechanism) => (
                <option key={mechanism.id} value={mechanism.id}>
                  {mechanism.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Quantity</span>
            <input
              min="1"
              onChange={(milestone) =>
                setPartInstanceDraft((current) => ({
                  ...current,
                  quantity: Number(milestone.target.value),
                }))
              }
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              type="number"
              value={partInstanceDraft.quantity}
            />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Status</span>
            <select
              onChange={(milestone) =>
                setPartInstanceDraft((current) => ({
                  ...current,
                  status: milestone.target.value as PartInstancePayload["status"],
                }))
              }
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={partInstanceDraft.status}
            >
              <option value="not ready">Not ready</option>
              <option value="blocked">Blocked</option>
              <option value="qa">QA</option>
              <option value="ready">Ready</option>
            </select>
          </label>
          <div className="checkbox-row modal-wide">
            <label className="checkbox-field">
              <input
                checked={partInstanceDraft.trackIndividually}
                onChange={(milestone) =>
                  setPartInstanceDraft((current) => ({
                    ...current,
                    trackIndividually: milestone.target.checked,
                  }))
                }
                type="checkbox"
              />
              <span style={{ color: "var(--text-title)" }}>
                Track each physical part separately
              </span>
            </label>
          </div>
          <PhotoUploadField
            currentUrl={partInstanceDraft.photoUrl}
            label="Part photo"
            onChange={(value) =>
              setPartInstanceDraft((current) => ({ ...current, photoUrl: value }))
            }
            onUpload={async (file) => {
              if (!partInstancePhotoProjectId) {
                throw new Error("No project is available for photo upload.");
              }

              return requestPhotoUpload(partInstancePhotoProjectId, file);
            }}
          />
          <div className="modal-actions modal-wide">
            <button
              className="secondary-action"
              onClick={closePartInstanceModal}
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              type="button"
            >
              Cancel
            </button>
            <button className="primary-action" disabled={isSavingPartInstance} type="submit">
              {isSavingPartInstance
                ? "Saving..."
                : partInstanceModalMode === "create"
                  ? "Add instance"
                  : "Save changes"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
