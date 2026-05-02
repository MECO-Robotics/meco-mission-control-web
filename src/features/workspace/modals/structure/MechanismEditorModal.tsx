import type { Dispatch, FormEvent, SetStateAction } from "react";

import type { BootstrapPayload, MechanismPayload } from "@/types";
import { buildIterationOptions, formatIterationVersion } from "@/lib/appUtils";
import { PhotoUploadField } from "@/features/workspace/shared/media";

import { StructureModalShell } from "./StructureModalShell";

interface MechanismEditorModalProps {
  activeMechanismId: string | null;
  bootstrap: BootstrapPayload;
  closeMechanismModal: () => void;
  handleDeleteMechanism: (mechanismId: string) => void;
  handleToggleMechanismArchived: (mechanismId: string) => void;
  handleMechanismSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isDeletingMechanism: boolean;
  isSavingMechanism: boolean;
  requestPhotoUpload: (projectId: string, file: File) => Promise<string>;
  mechanismDraft: MechanismPayload;
  mechanismModalMode: "create" | "edit";
  setMechanismDraft: Dispatch<SetStateAction<MechanismPayload>>;
}

const fieldStyle = {
  background: "var(--bg-row-alt)",
  border: "1px solid var(--border-base)",
  color: "var(--text-title)",
} as const;

const labelStyle = {
  color: "var(--text-title)",
} as const;

export function MechanismEditorModal({
  activeMechanismId,
  bootstrap,
  closeMechanismModal,
  handleDeleteMechanism,
  handleToggleMechanismArchived,
  handleMechanismSubmit,
  isDeletingMechanism,
  isSavingMechanism,
  requestPhotoUpload,
  mechanismDraft,
  mechanismModalMode,
  setMechanismDraft,
}: MechanismEditorModalProps) {
  const mechanismIterationOptions = buildIterationOptions(
    bootstrap.mechanisms
      .filter((mechanism) => mechanism.subsystemId === mechanismDraft.subsystemId)
      .map((mechanism) => mechanism.iteration),
    mechanismDraft.iteration,
  );
  const mechanismPhotoProjectId =
    bootstrap.subsystems.find((subsystem) => subsystem.id === mechanismDraft.subsystemId)
      ?.projectId ?? bootstrap.projects[0]?.id ?? null;

  return (
    <StructureModalShell
      eyebrowLabel="Mechanism editor"
      onClose={closeMechanismModal}
      onSubmit={handleMechanismSubmit}
      title={mechanismModalMode === "create" ? "Add mechanism" : "Edit mechanism"}
    >
      <label className="field">
        <span style={labelStyle}>Subsystem</span>
        <select
          onChange={(event) =>
            setMechanismDraft((current) => ({
              ...current,
              subsystemId: event.target.value,
            }))
          }
          style={fieldStyle}
          value={mechanismDraft.subsystemId}
        >
          {bootstrap.subsystems.map((subsystem) => (
            <option key={subsystem.id} value={subsystem.id}>
              {subsystem.name}
            </option>
          ))}
        </select>
      </label>

      {mechanismModalMode === "edit" ? (
        <label className="field">
          <span style={labelStyle}>Iteration</span>
          <select
            onChange={(event) =>
              setMechanismDraft((current) => ({
                ...current,
                iteration: Number(event.target.value),
              }))
            }
            style={fieldStyle}
            value={mechanismDraft.iteration ?? 1}
          >
            {mechanismIterationOptions.map((iteration) => (
              <option key={iteration} value={iteration}>
                {formatIterationVersion(iteration)}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label className="field modal-wide">
        <span style={labelStyle}>Name</span>
        <input
          onChange={(event) =>
            setMechanismDraft((current) => ({
              ...current,
              name: event.target.value,
            }))
          }
          required
          style={fieldStyle}
          value={mechanismDraft.name}
        />
      </label>

      <label className="field modal-wide">
        <span style={labelStyle}>Description</span>
        <textarea
          onChange={(event) =>
            setMechanismDraft((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
          required
          rows={3}
          style={fieldStyle}
          value={mechanismDraft.description}
        />
      </label>

      <PhotoUploadField
        currentUrl={mechanismDraft.photoUrl}
        label="Mechanism photo"
        onChange={(value) => setMechanismDraft((current) => ({ ...current, photoUrl: value }))}
        onUpload={async (file) => {
          if (!mechanismPhotoProjectId) {
            throw new Error("No project is available for photo upload.");
          }

          return requestPhotoUpload(mechanismPhotoProjectId, file);
        }}
      />

      <div className="modal-actions modal-wide">
        {mechanismModalMode === "edit" && activeMechanismId ? (
          <button
            className={mechanismDraft.isArchived ? "secondary-action" : "danger-action"}
            disabled={isDeletingMechanism || isSavingMechanism}
            onClick={() => handleToggleMechanismArchived(activeMechanismId)}
            type="button"
          >
            {mechanismDraft.isArchived ? "Restore mechanism" : "Archive mechanism"}
          </button>
        ) : null}
        {mechanismModalMode === "edit" && activeMechanismId ? (
          <button
            className="danger-action"
            disabled={isDeletingMechanism || isSavingMechanism}
            onClick={() => handleDeleteMechanism(activeMechanismId)}
            type="button"
          >
            {isDeletingMechanism ? "Deleting..." : "Delete mechanism"}
          </button>
        ) : null}
        <button
          className="secondary-action"
          onClick={closeMechanismModal}
          type="button"
          style={{
            background: "var(--bg-row-alt)",
            color: "var(--text-title)",
            border: "1px solid var(--border-base)",
          }}
        >
          Cancel
        </button>
        <button className="primary-action" disabled={isSavingMechanism} type="submit">
          {isSavingMechanism
            ? "Saving..."
            : mechanismModalMode === "create"
              ? "Add mechanism"
              : "Save changes"}
        </button>
      </div>
    </StructureModalShell>
  );
}
