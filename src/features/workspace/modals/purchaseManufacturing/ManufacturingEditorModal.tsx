import type { Dispatch, FormEvent, SetStateAction } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { ManufacturingItemPayload } from "@/types/payloads";

import { EditorModalShell } from "../EditorModalShell";
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
    <EditorModalShell
      dialogLabel="Manufacturing editor"
      eyebrowLabel="Manufacturing editor"
      onClose={closeManufacturingModal}
      onSubmit={handleManufacturingSubmit}
      title={manufacturingModalMode === "create"
        ? manufacturingDraft.process === "cnc"
          ? "Add CNC job"
          : manufacturingDraft.process === "3d-print"
            ? "Add 3D print job"
            : "Add fabrication job"
        : "Edit manufacturing job"}
    >
      <ManufacturingEditorFields {...props} />
      <div className="modal-actions modal-wide">
        <button
          className="secondary-action"
          onClick={closeManufacturingModal}
          type="button"
        >
          Cancel
        </button>
        <button className="primary-action" disabled={isSavingManufacturing} type="submit">
          {isSavingManufacturing ? "Saving..." : manufacturingModalMode === "create" ? "Add job" : "Save changes"}
        </button>
      </div>
    </EditorModalShell>
  );
}
