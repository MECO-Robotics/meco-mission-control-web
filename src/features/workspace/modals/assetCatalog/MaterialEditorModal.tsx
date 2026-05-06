import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { MaterialPayload } from "@/types/payloads";

interface MaterialEditorModalProps {
  closeMaterialModal: () => void;
  handleDeleteMaterial: (id: string) => void;
  handleMaterialSubmit: (milestone: FormEvent<HTMLFormElement>) => void;
  isDeletingMaterial: boolean;
  isSavingMaterial: boolean;
  materialDraft: MaterialPayload;
  materialModalMode: "create" | "edit";
  activeMaterialId: string | null;
  setMaterialDraft: Dispatch<SetStateAction<MaterialPayload>>;
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
}: MaterialEditorModalProps) {
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
              Material editor
            </p>
            <h2 style={{ color: "var(--text-title)" }}>
              {materialModalMode === "create" ? "Add material" : "Edit material"}
            </h2>
          </div>
          <button
            className="icon-button"
            onClick={closeMaterialModal}
            type="button"
            style={{ color: "var(--text-copy)", background: "transparent" }}
          >
            Close
          </button>
        </div>
        <form
          className="modal-form"
          onSubmit={handleMaterialSubmit}
          style={{ color: "var(--text-copy)" }}
        >
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Name</span>
            <input
              onChange={(milestone) =>
                setMaterialDraft((current) => ({ ...current, name: milestone.target.value }))
              }
              required
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={materialDraft.name}
            />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Category</span>
            <select
              onChange={(milestone) =>
                setMaterialDraft((current) => ({
                  ...current,
                  category: milestone.target.value as MaterialPayload["category"],
                }))
              }
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
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
              onChange={(milestone) => {
                const onHandQuantity = Number(milestone.target.value);
                setMaterialDraft((current) => ({
                  ...current,
                  onHandQuantity,
                  reorderPoint:
                    materialModalMode === "create"
                      ? Math.floor(onHandQuantity / 2)
                      : current.reorderPoint,
                }));
              }}
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
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
              onChange={(milestone) =>
                setMaterialDraft((current) => ({
                  ...current,
                  reorderPoint: Number(milestone.target.value),
                }))
              }
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
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
              onChange={(milestone) =>
                setMaterialDraft((current) => ({ ...current, location: milestone.target.value }))
              }
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={materialDraft.location}
            />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Vendor</span>
            <input
              onChange={(milestone) =>
                setMaterialDraft((current) => ({ ...current, vendor: milestone.target.value }))
              }
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={materialDraft.vendor}
            />
          </label>
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Notes</span>
            <textarea
              onChange={(milestone) =>
                setMaterialDraft((current) => ({ ...current, notes: milestone.target.value }))
              }
              rows={3}
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={materialDraft.notes}
            />
          </label>
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
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              type="button"
            >
              Cancel
            </button>
            <button className="primary-action" disabled={isSavingMaterial} type="submit">
              {isSavingMaterial ? "Saving..." : materialModalMode === "create" ? "Add material" : "Save changes"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
