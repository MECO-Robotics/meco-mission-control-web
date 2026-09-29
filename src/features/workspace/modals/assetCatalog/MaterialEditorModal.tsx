import { EditorModalShell } from "@/features/workspace/modals/EditorModalShell";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { MaterialPayload } from "@/types/payloads";
import type { BootstrapPayload } from "@/types/bootstrap";
import { PhotoUploadField } from "@/features/workspace/shared/media/PhotoUploadField";

interface MaterialEditorModalProps {
  closeMaterialModal: () => void;
  handleDeleteMaterial: (id: string) => void;
  handleMaterialSubmit: (milestone: FormEvent<HTMLFormElement>) => void;
  isDeletingMaterial: boolean;
  isSavingMaterial: boolean;
  materialDraft: MaterialPayload;
  materialModalMode: "create" | "edit" | null;
  activeMaterialId: string | null;
  setMaterialDraft: Dispatch<SetStateAction<MaterialPayload>>;
  bootstrap: BootstrapPayload;
  requestPhotoUpload: (projectId: string, file: File) => Promise<string>;
}

export function MaterialEditorModal({
  closeMaterialModal,
  handleDeleteMaterial,
  handleMaterialSubmit,
  isDeletingMaterial,
  isSavingMaterial,
  materialDraft,
  materialModalMode,
  activeMaterialId,
  setMaterialDraft,
  bootstrap,
  requestPhotoUpload,
}: MaterialEditorModalProps) {
  if (!materialModalMode) return null;
  const updateDraft = <K extends keyof MaterialPayload>(field: K, value: MaterialPayload[K]) =>
    setMaterialDraft((current) => ({ ...current, [field]: value }));

  return (
    <EditorModalShell
      dialogLabel="Material editor"
      eyebrowLabel="Material editor"
      title={materialModalMode === "create" ? "Add material" : "Edit material"}
      onClose={closeMaterialModal}
      onSubmit={handleMaterialSubmit}
    >
      <label className="field modal-wide">
        <span style={{ color: "var(--text-title)" }}>Name</span>
        <input
          onChange={(event) => updateDraft("name", event.target.value)}
          required
          value={materialDraft.name}
        />
      </label>
      <label className="field">
        <span style={{ color: "var(--text-title)" }}>Category</span>
        <select
          onChange={(event) => updateDraft("category", event.target.value as MaterialPayload["category"])}
          value={materialDraft.category}
        >
          <option value="metal">Metal</option>
          <option value="plastic">Plastic</option>
          <option value="filament">Filament</option>
          <option value="electronics">Electronics</option>
          <option value="hardware">Hardware</option>
          <option value="consumable">Consumable</option>
          <option value="other">Other</option>
        </select>
      </label>
      <label className="field">
        <span style={{ color: "var(--text-title)" }}>On hand</span>
        <input
          min="0"
          onChange={(event) => {
            const onHandQuantity = Number(event.target.value);
            setMaterialDraft((current) => ({
              ...current,
              onHandQuantity,
              reorderPoint:
                materialModalMode === "create"
                  ? Math.floor(onHandQuantity / 2)
                  : current.reorderPoint,
            }));
          }}
          type="number"
          value={materialDraft.onHandQuantity}
        />
      </label>
      <label className="field">
        <span style={{ color: "var(--text-title)" }}>Reorder point</span>
        <input
          disabled={materialModalMode === "create"}
          min="0"
          onChange={(event) => updateDraft("reorderPoint", Number(event.target.value))}
          type="number"
          value={materialDraft.reorderPoint}
        />
        {materialModalMode === "create" ? (
          <small style={{ color: "var(--text-copy)" }}>
            Auto-set to 50% of on-hand quantity while adding.
          </small>
        ) : null}
      </label>
      <label className="field">
        <span style={{ color: "var(--text-title)" }}>Location</span>
        <input
          onChange={(event) => updateDraft("location", event.target.value)}
          value={materialDraft.location}
        />
      </label>
      <label className="field">
        <span style={{ color: "var(--text-title)" }}>Vendor</span>
        <input
          onChange={(event) => updateDraft("vendor", event.target.value)}
          value={materialDraft.vendor}
        />
      </label>
      <label className="field modal-wide">
        <span style={{ color: "var(--text-title)" }}>Notes</span>
        <textarea
          onChange={(event) => updateDraft("notes", event.target.value)}
          rows={3}
          value={materialDraft.notes}
        />
      </label>
      <PhotoUploadField
        currentUrl={materialDraft.photoUrl ?? ""}
        label="Material photo"
        onChange={(value) => setMaterialDraft((current) => ({ ...current, photoUrl: value }))}
        onUpload={(file) => {
          const projectId = bootstrap.projects[0]?.id;
          if (!projectId) return Promise.reject(new Error("No project is available for photo upload."));
          return requestPhotoUpload(projectId, file);
        }}
      />
      <div className="modal-actions modal-wide">
        {materialModalMode === "edit" && activeMaterialId ? (
          <button
            className="danger-action"
            disabled={isDeletingMaterial || isSavingMaterial}
            onClick={() => handleDeleteMaterial(activeMaterialId)}
            type="button"
          >
            {isDeletingMaterial ? "Deleting..." : "Delete material"}
          </button>
        ) : null}
        <button
          className="secondary-action"
          onClick={closeMaterialModal}
          type="button"
        >
          Cancel
        </button>
        <button className="primary-action" disabled={isSavingMaterial} type="submit">
          {isSavingMaterial ? "Saving..." : materialModalMode === "create" ? "Add material" : "Save changes"}
        </button>
      </div>
    </EditorModalShell>
  );
}
