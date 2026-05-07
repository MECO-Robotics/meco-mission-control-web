import { useState } from "react";

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { buildEmptyManufacturingPayload } from "@/lib/appUtils/manufacturing";
import type { ManufacturingItemPayload } from "@/types/payloads";
import type { ManufacturingModalMode } from "@/features/workspace/shared/model/workspaceModalModes";

export function useAppWorkspaceUiStateManufacturing() {
  const [manufacturingModalMode, setManufacturingModalMode] =
    useState<ManufacturingModalMode>(null);
  const [activeManufacturingId, setActiveManufacturingId] = useState<string | null>(
    null,
  );
  const [manufacturingDraft, setManufacturingDraft] =
    useState<ManufacturingItemPayload>(
      buildEmptyManufacturingPayload(EMPTY_BOOTSTRAP, "cnc"),
    );
  const [isSavingManufacturing, setIsSavingManufacturing] = useState(false);

  return {
    activeManufacturingId,
    isSavingManufacturing,
    manufacturingDraft,
    manufacturingModalMode,
    setActiveManufacturingId,
    setIsSavingManufacturing,
    setManufacturingDraft,
    setManufacturingModalMode,
  };
}
