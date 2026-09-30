import { useCallback, useEffect, useState } from "react";

interface CatalogDraftEditorArgs<
  TRecord extends { id: string },
  TPayload,
  TCreateArgs extends unknown[],
> {
  bootstrapIsEmpty: boolean;
  makeCreateDraft: (...args: TCreateArgs) => TPayload;
  makeInitialDraft: () => TPayload;
  records: readonly TRecord[];
  resetOperation: () => void;
  selectedProjectId: string | null;
  selectedSeasonId: string | null;
  toDraft: (record: TRecord) => TPayload;
}

export function useCatalogDraftEditor<
  TRecord extends { id: string },
  TPayload,
  TCreateArgs extends unknown[],
>({
  bootstrapIsEmpty,
  makeCreateDraft,
  makeInitialDraft,
  records,
  resetOperation,
  selectedProjectId,
  selectedSeasonId,
  toDraft,
}: CatalogDraftEditorArgs<TRecord, TPayload, TCreateArgs>) {
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const [draft, setDraft] = useState<TPayload>(() => makeInitialDraft());

  const openCreate = useCallback((...args: TCreateArgs) => {
    resetOperation();
    setActiveRecordId(null);
    setDraft(makeCreateDraft(...args));
    setModalMode("create");
  }, [makeCreateDraft, resetOperation]);

  const openEdit = useCallback((record: TRecord) => {
    resetOperation();
    setActiveRecordId(record.id);
    setDraft(toDraft(record));
    setModalMode("edit");
  }, [resetOperation, toDraft]);

  const close = useCallback(() => {
    resetOperation();
    setModalMode(null);
    setActiveRecordId(null);
  }, [resetOperation]);

  useEffect(() => close(), [close, selectedProjectId, selectedSeasonId]);

  useEffect(() => {
    if (bootstrapIsEmpty || (modalMode === "edit" && !records.some((record) => record.id === activeRecordId))) {
      close();
    }
  }, [activeRecordId, bootstrapIsEmpty, close, modalMode, records]);

  return { activeRecordId, close, draft, modalMode, openCreate, openEdit, setDraft };
}
