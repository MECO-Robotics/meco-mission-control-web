import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { PartDefinitionPayload } from "@/types/payloads";
import { buildIterationOptions, formatIterationVersion } from "@/lib/appUtils/common";
import { PhotoUploadField } from "@/features/workspace/shared/media/PhotoUploadField";

interface PartDefinitionEditorModalProps {
  bootstrap: BootstrapPayload;
  activePartDefinitionId: string | null;
  closePartDefinitionModal: () => void;
  handleDeletePartDefinition: (id: string) => void;
  handleTogglePartDefinitionArchived: (id: string) => void;
  handlePartDefinitionSubmit: (milestone: FormEvent<HTMLFormElement>) => void;
  isDeletingPartDefinition: boolean;
  isSavingPartDefinition: boolean;
  requestPhotoUpload: (projectId: string, file: File) => Promise<string>;
  partDefinitionDraft: PartDefinitionPayload;
  partDefinitionModalMode: "create" | "edit";
  setPartDefinitionDraft: Dispatch<SetStateAction<PartDefinitionPayload>>;
}

const modalCardStyle = {
  background: "var(--bg-panel)",
  border: "1px solid var(--border-base)",
} as const;

const fieldInputStyle = {
  background: "var(--bg-row-alt)",
  color: "var(--text-title)",
  border: "1px solid var(--border-base)",
} as const;

const checkboxLabelStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.5rem",
  color: "var(--text-title)",
} as const;

const cancelButtonStyle = {
  ...fieldInputStyle,
} as const;

export function PartDefinitionEditorModal({
  bootstrap,
  activePartDefinitionId,
  closePartDefinitionModal,
  handleDeletePartDefinition,
  handleTogglePartDefinitionArchived,
  handlePartDefinitionSubmit,
  isDeletingPartDefinition,
  isSavingPartDefinition,
  requestPhotoUpload,
  partDefinitionDraft,
  partDefinitionModalMode,
  setPartDefinitionDraft,
}: PartDefinitionEditorModalProps) {
  const partDefinitionIterationOptions = buildIterationOptions(
    bootstrap.partDefinitions.map((partDefinition) => partDefinition.iteration),
    partDefinitionDraft.iteration,
  );
  const partDefinitionPhotoProjectId = bootstrap.projects[0]?.id ?? null;

  return (
    <div className="modal-scrim" role="presentation" style={{ zIndex: 2000 }}>
      <section
        aria-modal="true"
        className="modal-card"
        role="dialog"
        style={modalCardStyle}
      >
        <div className="panel-header compact-header">
          <div>
            <p className="eyebrow" style={{ color: "var(--meco-blue)" }}>
              Part definition editor
            </p>
            <h2 style={{ color: "var(--text-title)" }}>
              {partDefinitionModalMode === "create"
                ? "Add part definition"
                : "Edit part definition"}
            </h2>
          </div>
          <button
            className="icon-button"
            onClick={closePartDefinitionModal}
            type="button"
            style={{ color: "var(--text-copy)", background: "transparent" }}
          >
            Close
          </button>
        </div>
        <form
          className="modal-form"
          onSubmit={handlePartDefinitionSubmit}
          style={{ color: "var(--text-copy)" }}
        >
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Name</span>
            <input
              onChange={(milestone) =>
                setPartDefinitionDraft((current) => ({ ...current, name: milestone.target.value }))
              }
              required
              style={fieldInputStyle}
              value={partDefinitionDraft.name}
            />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Part number</span>
            <input
              onChange={(milestone) =>
                setPartDefinitionDraft((current) => ({
                  ...current,
                  partNumber: milestone.target.value,
                }))
              }
              required
              style={fieldInputStyle}
              value={partDefinitionDraft.partNumber}
            />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Revision</span>
            <input
              onChange={(milestone) =>
                setPartDefinitionDraft((current) => ({ ...current, revision: milestone.target.value }))
              }
              required
              style={fieldInputStyle}
              value={partDefinitionDraft.revision}
            />
          </label>
          {partDefinitionModalMode === "edit" ? (
            <label className="field">
              <span style={{ color: "var(--text-title)" }}>Iteration</span>
              <select
                onChange={(milestone) =>
                  setPartDefinitionDraft((current) => ({
                    ...current,
                    iteration: Number(milestone.target.value),
                  }))
                }
                style={fieldInputStyle}
                value={partDefinitionDraft.iteration ?? 1}
              >
                {partDefinitionIterationOptions.map((iteration) => (
                  <option key={iteration} value={iteration}>
                    {formatIterationVersion(iteration)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Type</span>
            <input
              onChange={(milestone) =>
                setPartDefinitionDraft((current) => ({ ...current, type: milestone.target.value }))
              }
              required
              style={fieldInputStyle}
              value={partDefinitionDraft.type}
            />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Source</span>
            <input
              onChange={(milestone) =>
                setPartDefinitionDraft((current) => ({ ...current, source: milestone.target.value }))
              }
              style={fieldInputStyle}
              value={partDefinitionDraft.source}
            />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Part type</span>
            <div>
              <span
                style={checkboxLabelStyle}
              >
                <input
                  checked={partDefinitionDraft.isHardware}
                  onChange={(milestone) =>
                    setPartDefinitionDraft((current) => ({
                      ...current,
                      isHardware: milestone.target.checked,
                    }))
                  }
                  type="checkbox"
                />
                Hardware part
              </span>
            </div>
          </label>
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Default material</span>
            <select
              onChange={(milestone) =>
                setPartDefinitionDraft((current) => ({
                  ...current,
                  materialId: milestone.target.value || null,
                }))
              }
              style={fieldInputStyle}
              value={partDefinitionDraft.materialId ?? ""}
            >
              <option value="">No material</option>
              {bootstrap.materials.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Description</span>
            <textarea
              onChange={(milestone) =>
                setPartDefinitionDraft((current) => ({
                  ...current,
                  description: milestone.target.value,
                }))
              }
              rows={3}
              style={fieldInputStyle}
              value={partDefinitionDraft.description}
            />
          </label>
          <PhotoUploadField
            currentUrl={partDefinitionDraft.photoUrl}
            label="Part photo"
            onChange={(value) =>
              setPartDefinitionDraft((current) => ({ ...current, photoUrl: value }))
            }
            onUpload={async (file) => {
              if (!partDefinitionPhotoProjectId) {
                throw new Error("No project is available for photo upload.");
              }

              return requestPhotoUpload(partDefinitionPhotoProjectId, file);
            }}
          />
          <div className="modal-actions modal-wide">
            {partDefinitionModalMode === "edit" && activePartDefinitionId ? (
              <button
                className={partDefinitionDraft.isArchived ? "secondary-action" : "danger-action"}
                disabled={isDeletingPartDefinition || isSavingPartDefinition}
                onClick={() => handleTogglePartDefinitionArchived(activePartDefinitionId)}
                type="button"
              >
                {partDefinitionDraft.isArchived
                  ? "Restore part definition"
                  : "Archive part definition"}
              </button>
            ) : null}
            {partDefinitionModalMode === "edit" && activePartDefinitionId ? (
              <button
                className="danger-action"
                disabled={isDeletingPartDefinition || isSavingPartDefinition}
                onClick={() => handleDeletePartDefinition(activePartDefinitionId)}
                type="button"
              >
                {isDeletingPartDefinition ? "Deleting..." : "Delete part definition"}
              </button>
            ) : null}
            <button
              className="secondary-action"
              onClick={closePartDefinitionModal}
              style={cancelButtonStyle}
              type="button"
            >
              Cancel
            </button>
            <button
              className="primary-action"
              disabled={isSavingPartDefinition || isDeletingPartDefinition}
              type="submit"
            >
              {isSavingPartDefinition
                ? "Saving..."
                : partDefinitionModalMode === "create"
                  ? "Add part"
                  : "Save changes"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
