import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { RiskPayload } from "@/types/payloads";
import type { RiskRecord } from "@/types/recordsReporting";

import { buildRiskViewScopeData } from "./riskViewData/riskViewDataScope";
import { buildRiskViewLookups } from "./riskViewData/riskViewDataLookups";
import { sanitizeRiskPayload, toRiskPayload } from "./riskViewData/riskViewDataPayload";

type RiskEditorMode = "detail" | "edit" | null;

interface UseRisksViewModelArgs {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  onDeleteRisk: (riskId: string) => Promise<void>;
  onUpdateRisk: (riskId: string, payload: RiskPayload) => Promise<void>;
}

export function useRisksViewModel({
  activePersonFilter,
  bootstrap,
  onDeleteRisk,
  onUpdateRisk,
}: UseRisksViewModelArgs) {
  const editorSession = useRef({ pending: false });
  useEffect(() => () => {
    editorSession.current = { pending: false };
  }, []);

  const [editorMode, setEditorMode] = useState<RiskEditorMode>(null);
  const [activeRiskId, setActiveRiskId] = useState<string | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const viewData = useMemo(() => {
    const { pools, metrics } = buildRiskViewScopeData({ activePersonFilter, bootstrap });
    return { metrics, ...buildRiskViewLookups({ bootstrap, scope: pools }) };
  }, [activePersonFilter, bootstrap]);

  const [draft, setDraft] = useState<RiskPayload>({
    title: "",
    detail: "",
    severity: "medium",
    sourceType: "qa-report",
    sourceId: "",
    attachmentType: "project",
    attachmentId: "",
    mitigationTaskId: null,
  });

  const sourceOptions = viewData.sourceOptionsForType(draft.sourceType);
  const attachmentOptions = viewData.attachmentOptionsForType(draft.attachmentType);
  const activeRisk = useMemo(
    () => bootstrap.risks.find((risk) => risk.id === activeRiskId) ?? null,
    [activeRiskId, bootstrap.risks],
  );

  const closeEditor = useCallback(() => {
    editorSession.current = { pending: false };
    setEditorMode(null);
    setActiveRiskId(null);
    setEditorError(null);
    setIsSaving(false);
    setIsDeleting(false);
  }, []);

  const openRiskDetails = useCallback((risk: RiskRecord) => {
    closeEditor();
    setDraft(toRiskPayload(risk));
    setActiveRiskId(risk.id);
    setEditorMode("detail");
  }, [closeEditor]);

  const openEditEditor = useCallback((risk: RiskRecord) => {
    closeEditor();
    setDraft(toRiskPayload(risk));
    setActiveRiskId(risk.id);
    setEditorMode("edit");
  }, [closeEditor]);

  useEffect(() => {
    if (!editorMode) {
      return;
    }

    if (!sourceOptions.some((option) => option.id === draft.sourceId)) {
      setDraft((current) => ({
        ...current,
        sourceId: sourceOptions[0]?.id ?? "",
      }));
    }
  }, [draft.sourceId, editorMode, sourceOptions]);

  useEffect(() => {
    if (!editorMode) {
      return;
    }

    if (!attachmentOptions.some((option) => option.id === draft.attachmentId)) {
      setDraft((current) => ({
        ...current,
        attachmentId: attachmentOptions[0]?.id ?? "",
      }));
    }
  }, [attachmentOptions, draft.attachmentId, editorMode]);

  const handleSaveRisk = useCallback(async () => {
    const session = editorSession.current;
    if (session.pending || editorMode !== "edit" || !activeRiskId) return;
    const payload = sanitizeRiskPayload(draft);

    if (payload.title.length < 2) {
      setEditorError("Please provide a risk title.");
      return;
    }

    if (payload.detail.length < 2) {
      setEditorError("Please provide risk details.");
      return;
    }

    if (!payload.sourceId) {
      setEditorError("Please choose a real source.");
      return;
    }

    if (!payload.attachmentId) {
      setEditorError("Please choose a real attachment target.");
      return;
    }

    setEditorError(null);
    session.pending = true;
    setIsSaving(true);
    try {
      await onUpdateRisk(activeRiskId, payload);
      if (editorSession.current === session) closeEditor();
    } catch (error) {
      if (editorSession.current === session) {
        setEditorError(error instanceof Error ? error.message : "Couldn't save this risk.");
      }
    } finally {
      if (editorSession.current === session) {
        session.pending = false;
        setIsSaving(false);
      }
    }
  }, [activeRiskId, closeEditor, draft, editorMode, onUpdateRisk]);

  const handleDeleteRisk = useCallback(async () => {
    const session = editorSession.current;
    if (session.pending || !activeRiskId) return;

    setEditorError(null);
    session.pending = true;
    setIsDeleting(true);
    try {
      await onDeleteRisk(activeRiskId);
      if (editorSession.current === session) closeEditor();
    } catch (error) {
      if (editorSession.current === session) {
        setEditorError(error instanceof Error ? error.message : "Couldn't delete this risk.");
      }
    } finally {
      if (editorSession.current === session) {
        session.pending = false;
        setIsDeleting(false);
      }
    }
  }, [activeRiskId, closeEditor, onDeleteRisk]);

  return {
    activeRisk,
    ...viewData,
    attachmentOptions,
    closeEditor,
    draft,
    editorError,
    editorMode,
    getAttachmentOptionsForType: viewData.attachmentOptionsForType,
    getSourceOptionsForType: viewData.sourceOptionsForType,
    handleDeleteRisk,
    handleSaveRisk,
    isDeleting,
    isSaving,
    openRiskDetails,
    openEditEditor,
    setDraft,
    sourceOptions,
  };
}
