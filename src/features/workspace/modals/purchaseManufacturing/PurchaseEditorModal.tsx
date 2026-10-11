import type { Dispatch, FormEvent, SetStateAction } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { PurchaseItemPayload } from "@/types/payloads";

import { EditorModalShell } from "../EditorModalShell";
import { PurchaseEditorFields } from "./PurchaseEditorFields";

export interface PurchaseEditorModalProps {
  bootstrap: BootstrapPayload;
  activePurchaseId: string | null;
  closePurchaseModal: () => void;
  handlePurchaseSubmit: (milestone: FormEvent<HTMLFormElement>) => void;
  isSavingPurchase: boolean;
  purchaseDraft: PurchaseItemPayload;
  purchaseFinalCost: string;
  purchaseModalMode: "create" | "edit";
  setPurchaseDraft: Dispatch<SetStateAction<PurchaseItemPayload>>;
  setPurchaseFinalCost: (value: string) => void;
}

export function PurchaseEditorModal(props: PurchaseEditorModalProps) {
  const { closePurchaseModal, handlePurchaseSubmit, isSavingPurchase, purchaseModalMode } = props;

  return (
    <EditorModalShell
      dialogLabel="Purchase editor"
      eyebrowLabel="Purchase editor"
      onClose={closePurchaseModal}
      onSubmit={handlePurchaseSubmit}
      title={purchaseModalMode === "create" ? "Add purchase" : "Edit purchase"}
    >
      <PurchaseEditorFields {...props} />
      <div className="modal-actions modal-wide">
        <button
          className="secondary-action"
          onClick={closePurchaseModal}
          type="button"
        >
          Cancel
        </button>
        <button className="primary-action" disabled={isSavingPurchase} type="submit">
          {isSavingPurchase ? "Saving..." : purchaseModalMode === "create" ? "Add purchase" : "Save changes"}
        </button>
      </div>
    </EditorModalShell>
  );
}
