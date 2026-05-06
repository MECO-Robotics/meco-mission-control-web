import { useState } from "react";

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { buildEmptyPurchasePayload } from "@/lib/appUtils/payloadBuilders";
import type { PurchaseItemPayload } from "@/types/payloads";
import type { PurchaseModalMode } from "@/features/workspace/shared/model/workspaceModalModes";

export function useAppWorkspaceUiStatePurchase() {
  const [purchaseModalMode, setPurchaseModalMode] = useState<PurchaseModalMode>(null);
  const [activePurchaseId, setActivePurchaseId] = useState<string | null>(null);
  const [purchaseDraft, setPurchaseDraft] = useState<PurchaseItemPayload>(
    buildEmptyPurchasePayload(EMPTY_BOOTSTRAP),
  );
  const [purchaseFinalCost, setPurchaseFinalCost] = useState("");
  const [isSavingPurchase, setIsSavingPurchase] = useState(false);

  return {
    activePurchaseId,
    isSavingPurchase,
    purchaseDraft,
    purchaseFinalCost,
    purchaseModalMode,
    setActivePurchaseId,
    setIsSavingPurchase,
    setPurchaseDraft,
    setPurchaseFinalCost,
    setPurchaseModalMode,
  };
}
