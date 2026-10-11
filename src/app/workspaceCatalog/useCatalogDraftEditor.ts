import { useCallback, useEffect, useRef, useState } from "react";

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
  const acceptedCreateId = useRef<string | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const [draft, setDraft] = useState<TPayload>(() => makeInitialDraft());

  const openCreate = useCallback((...args: TCreateArgs) => {
    acceptedCreateId.current = null;
    resetOperation();
    setActiveRecordId(null);
    setDraft(makeCreateDraft(...args));
    setModalMode("create");
  }, [makeCreateDraft, resetOperation]);

  const openEdit = useCallback((record: TRecord) => {
    acceptedCreateId.current = null;
    resetOperation();
    setActiveRecordId(record.id);
    setDraft(toDraft(record));
    setModalMode("edit");
  }, [resetOperation, toDraft]);

  const close = useCallback(() => {
    acceptedCreateId.current = null;
    resetOperation();
    setModalMode(null);
    setActiveRecordId(null);
  }, [resetOperation]);

  useEffect(() => close(), [close, selectedProjectId, selectedSeasonId]);

  const acknowledgeCreate = useCallback((id: string) => {
    acceptedCreateId.current = id;
    setActiveRecordId(id);
    setModalMode("edit");
  }, []);

  useEffect(() => {
    if (records.some((record) => record.id === acceptedCreateId.current)) acceptedCreateId.current = null;
    if (bootstrapIsEmpty || (modalMode === "edit" && acceptedCreateId.current !== activeRecordId && !records.some((record) => record.id === activeRecordId))) {
      close();
    }
  }, [activeRecordId, bootstrapIsEmpty, close, modalMode, records]);

  return { acknowledgeCreate, activeRecordId, close, draft, modalMode, openCreate, openEdit, setDraft };
}
