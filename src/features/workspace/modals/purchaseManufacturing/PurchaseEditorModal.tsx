import type { Dispatch, FormEvent, SetStateAction } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { PurchaseItemPayload } from "@/types/payloads";

import { PurchaseEditorFields } from "./PurchaseEditorFields";

export interface PurchaseEditorModalProps {
  bootstrap: BootstrapPayload;
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
              Purchase editor
            </p>
            <h2 style={{ color: "var(--text-title)" }}>
              {purchaseModalMode === "create" ? "Add purchase" : "Edit purchase"}
            </h2>
          </div>
          <button
            className="icon-button"
            onClick={closePurchaseModal}
            type="button"
            style={{ background: "transparent", color: "var(--text-copy)" }}
          >
            Close
          </button>
        </div>
        <form className="modal-form" onSubmit={handlePurchaseSubmit} style={{ color: "var(--text-copy)" }}>
          <PurchaseEditorFields {...props} />
          <div className="modal-actions modal-wide">
            <button
              className="secondary-action"
              onClick={closePurchaseModal}
              type="button"
              style={{ background: "var(--bg-row-alt)", border: "1px solid var(--border-base)", color: "var(--text-title)" }}
            >
              Cancel
            </button>
            <button className="primary-action" disabled={isSavingPurchase} type="submit">
              {isSavingPurchase ? "Saving..." : purchaseModalMode === "create" ? "Add purchase" : "Save changes"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
