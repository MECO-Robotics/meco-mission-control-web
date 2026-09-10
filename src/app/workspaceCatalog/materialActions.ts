import { useCallback, useState } from "react";

import { buildEmptyMaterialPayload } from "@/lib/appUtils/payloadBuilders";
import { materialToPayload } from "@/lib/appUtils/payloadConversions";
import { toErrorMessage } from "@/lib/appUtils/common";
import { createMaterialRecord, deleteMaterialRecord, updateMaterialRecord } from "@/lib/auth/records/inventory";
import type { MaterialPayload } from "@/types/payloads";
import type { MaterialRecord } from "@/types/recordsInventory";

export function useMaterialEditor({
  handleUnauthorized,
  loadWorkspace,
  setDataMessage,
}: {
  handleUnauthorized: () => void;
  loadWorkspace: () => Promise<void>;
  setDataMessage: (message: string | null) => void;
}) {
  const [materialModalMode, setMaterialModalMode] = useState<"create" | "edit" | null>(null);
  const [activeMaterialId, setActiveMaterialId] = useState<string | null>(null);
  const [materialDraft, setMaterialDraft] = useState<MaterialPayload>(buildEmptyMaterialPayload);
  const [isSavingMaterial, setIsSavingMaterial] = useState(false);
  const [isDeletingMaterial, setIsDeletingMaterial] = useState(false);
  const openCreateMaterialModal = useCallback(() => {
    setActiveMaterialId(null);
    setMaterialDraft(buildEmptyMaterialPayload());
    setMaterialModalMode("create");
  }, []);

  const openEditMaterialModal = useCallback((item: MaterialRecord) => {
    setActiveMaterialId(item.id);
    setMaterialDraft(materialToPayload(item));
    setMaterialModalMode("edit");
  }, []);

  const closeMaterialModal = useCallback(() => {
    setMaterialModalMode(null);
    setActiveMaterialId(null);
  }, []);

  const handleMaterialSubmit = useCallback(async (milestone: React.FormEvent<HTMLFormElement>) => {
    milestone.preventDefault();
    setIsSavingMaterial(true);
    setDataMessage(null);

    try {
      const payload: MaterialPayload =
        materialModalMode === "create"
          ? {
              ...materialDraft,
              reorderPoint: Math.floor(materialDraft.onHandQuantity / 2),
            }
          : materialDraft;

      if (materialModalMode === "create") {
        await createMaterialRecord(payload, handleUnauthorized);
      } else if (materialModalMode === "edit" && activeMaterialId) {
        await updateMaterialRecord(activeMaterialId, payload, handleUnauthorized);
      }

      await loadWorkspace();
      closeMaterialModal();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsSavingMaterial(false);
    }
  }, [activeMaterialId, closeMaterialModal, handleUnauthorized, loadWorkspace, materialDraft, materialModalMode, setDataMessage]);

  const handleDeleteMaterial = useCallback(async (materialId: string) => {
    setIsDeletingMaterial(true);
    setDataMessage(null);

    try {
      await deleteMaterialRecord(materialId, handleUnauthorized);
      if (activeMaterialId === materialId) {
        closeMaterialModal();
      }
      await loadWorkspace();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsDeletingMaterial(false);
    }
  }, [activeMaterialId, closeMaterialModal, handleUnauthorized, loadWorkspace, setDataMessage]);

  return {
    materialModalMode, activeMaterialId, materialDraft, setMaterialDraft, isSavingMaterial, isDeletingMaterial,
    closeMaterialModal,
    handleDeleteMaterial,
    handleMaterialSubmit,
    openCreateMaterialModal,
    openEditMaterialModal,
  };
}
