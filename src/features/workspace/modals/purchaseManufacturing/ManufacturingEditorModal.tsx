import type { Dispatch, FormEvent, SetStateAction } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { ManufacturingItemPayload } from "@/types/payloads";

import { ManufacturingEditorFields } from "./ManufacturingEditorFields";

export interface ManufacturingEditorModalProps {
  bootstrap: BootstrapPayload;
  closeManufacturingModal: () => void;
  handleManufacturingSubmit: (milestone: FormEvent<HTMLFormElement>) => void;
  isSavingManufacturing: boolean;
  manufacturingDraft: ManufacturingItemPayload;
  manufacturingModalMode: "create" | "edit";
  setManufacturingDraft: Dispatch<SetStateAction<ManufacturingItemPayload>>;
}

export function ManufacturingEditorModal(props: ManufacturingEditorModalProps) {
  const { closeManufacturingModal, handleManufacturingSubmit, isSavingManufacturing, manufacturingDraft, manufacturingModalMode } = props;

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
              Manufacturing editor
            </p>
            <h2 style={{ color: "var(--text-title)" }}>
              {manufacturingModalMode === "create"
                ? manufacturingDraft.process === "cnc"
                  ? "Add CNC job"
                  : manufacturingDraft.process === "3d-print"
                    ? "Add 3D print job"
                    : "Add fabrication job"
                : "Edit manufacturing job"}
            </h2>
          </div>
          <button
            className="icon-button"
            onClick={closeManufacturingModal}
            type="button"
            style={{ background: "transparent", color: "var(--text-copy)" }}
          >
            Close
          </button>
        </div>
        <form className="modal-form" onSubmit={handleManufacturingSubmit} style={{ color: "var(--text-copy)" }}>
          <ManufacturingEditorFields {...props} />
          <div className="modal-actions modal-wide">
            <button
              className="secondary-action"
              onClick={closeManufacturingModal}
              type="button"
              style={{ background: "var(--bg-row-alt)", border: "1px solid var(--border-base)", color: "var(--text-title)" }}
            >
              Cancel
            </button>
            <button className="primary-action" disabled={isSavingManufacturing} type="submit">
              {isSavingManufacturing ? "Saving..." : manufacturingModalMode === "create" ? "Add job" : "Save changes"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
