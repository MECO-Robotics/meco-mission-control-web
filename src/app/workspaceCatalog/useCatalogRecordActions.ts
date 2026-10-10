import { useCallback } from "react";
import { toErrorMessage } from "@/lib/appUtils/common";

type CatalogRecord = { id: string; isArchived?: boolean | null };

export function useCatalogRecordActions<TRecord extends CatalogRecord>({
  activeRecordId,
  beginOperation,
  closeEditor,
  deleteRecord,
  handleUnauthorized,
  records,
  setDataMessage,
  updateRecord,
}: {
  activeRecordId: string | null;
  beginOperation: (kind?: "save" | "delete") => {
    isCurrent: () => boolean;
    refresh: () => Promise<boolean>;
    finish: () => void;
  } | null;
  closeEditor?: () => void;
  deleteRecord?: (id: string, onUnauthorized: () => void) => Promise<unknown>;
  handleUnauthorized: () => void;
  records: readonly TRecord[];
  setDataMessage: (message: string | null) => void;
  updateRecord?: (id: string, patch: { isArchived: boolean }, onUnauthorized: () => void) => Promise<unknown>;
}) {
  const run = useCallback(async (
    request: () => Promise<unknown>,
    afterRefresh?: () => void,
    kind?: "save" | "delete",
  ) => {
    const operation = beginOperation(kind);
    if (!operation) return;
    setDataMessage(null);
    try {
      await request();
      await operation.refresh();
      if (operation.isCurrent()) afterRefresh?.();
    } catch (error) {
      if (operation.isCurrent()) setDataMessage(toErrorMessage(error));
    } finally {
      operation.finish();
    }
  }, [beginOperation, setDataMessage]);

  const handleDelete = useCallback((id: string) => {
    if (!deleteRecord) return Promise.resolve();
    return run(
      () => deleteRecord(id, handleUnauthorized),
      () => { if (activeRecordId === id) closeEditor?.(); },
      "delete",
    );
  }, [activeRecordId, closeEditor, deleteRecord, handleUnauthorized, run]);

  const handleToggleArchived = useCallback((id: string) => {
    const record = records.find((item) => item.id === id);
    if (!record || !updateRecord) return Promise.resolve();
    return run(() => updateRecord(id, { isArchived: !(record.isArchived ?? false) }, handleUnauthorized));
  }, [handleUnauthorized, records, run, updateRecord]);

  return { handleDelete, handleToggleArchived };
}
