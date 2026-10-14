import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { RiskPayload } from "@/types/payloads";
import type { RiskRecord } from "@/types/recordsReporting";

import { buildRiskViewScopeData } from "./riskViewData/riskViewDataScope";
import { buildRiskViewLookups } from "./riskViewData/riskViewDataLookups";
import { sanitizeRiskPatch, sanitizeRiskPayload, toRiskPayload } from "./riskViewData/riskViewDataPayload";

type RiskEditorMode = "detail" | "edit" | "create" | null;

interface UseRisksViewModelArgs {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  onDeleteRisk: (riskId: string) => Promise<void>;
  onCreateRisk: (payload: RiskPayload) => Promise<void>;
  onUpdateRisk: (riskId: string, payload: Partial<RiskPayload>) => Promise<void>;
}

export function useRisksViewModel({
  activePersonFilter,
  bootstrap,
  onDeleteRisk,
  onCreateRisk,
  onUpdateRisk,
}: UseRisksViewModelArgs) {
  const editorSession = useRef({ pending: false });
  const editingRiskId = useRef<string | null>(null);
  const writeSession = useRef({ pending: new Set<string>() });
  const [pendingRiskIds, setPendingRiskIds] = useState<ReadonlySet<string>>(new Set());
  const [riskErrors, setRiskErrors] = useState<Readonly<Record<string, string>>>({});
  useEffect(() => () => {
    editorSession.current = { pending: false };
    writeSession.current = { pending: new Set() };
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
    projectId: bootstrap.projects[0]?.id ?? "",
    title: "",
    detail: "",
    category: "other",
    severity: "medium",
    status: "open",
    blocksWork: false,
    source: { kind: "manual" },
    relatedTargets: [],
    mitigationTaskId: null,
    ownerGroupId: null,
        ownerMemberId: null,
        mitigationDueDate: null,
  });
  const activeRisk = useMemo(
    () => bootstrap.risks.find((risk) => risk.id === activeRiskId) ?? null,
    [activeRiskId, bootstrap.risks],
  );

  const closeEditor = useCallback(() => {
    editorSession.current = { pending: false };
    editingRiskId.current = null;
    setEditorMode(null);
    setActiveRiskId(null);
    setEditorError(null);
    setIsSaving(false);
    setIsDeleting(false);
  }, []);

  const openRiskDetails = useCallback((risk: RiskRecord) => {
    if (writeSession.current.pending.has(risk.id)) return;
    closeEditor();
    editingRiskId.current = risk.id;
    setDraft(toRiskPayload(risk));
    setActiveRiskId(risk.id);
    setEditorMode("detail");
  }, [closeEditor]);

  const openEditEditor = useCallback((risk: RiskRecord) => {
    if (writeSession.current.pending.has(risk.id)) return;
    closeEditor();
    editingRiskId.current = risk.id;
    setDraft(toRiskPayload(risk));
    setActiveRiskId(risk.id);
    setEditorMode("edit");
  }, [closeEditor]);

  const openCreateEditor = useCallback(() => {
    closeEditor();
    setDraft({ projectId: bootstrap.projects[0]?.id ?? "", title: "", detail: "", category: "other", severity: "medium", status: "open", blocksWork: false, source: { kind: "manual" }, relatedTargets: [], mitigationTaskId: null, ownerGroupId: null, ownerMemberId: null, mitigationDueDate: null });
    setEditorMode("create");
  }, [bootstrap.projects, closeEditor]);

  const beginRiskWrite = useCallback((riskId: string) => {
    const session = writeSession.current;
    if (session.pending.has(riskId)) return null;
    session.pending.add(riskId);
    setPendingRiskIds(new Set(session.pending));
    return () => {
      session.pending.delete(riskId);
      if (writeSession.current === session) setPendingRiskIds(new Set(session.pending));
    };
  }, []);

  const handleSaveRisk = useCallback(async () => {
    const session = editorSession.current;
    if (session.pending || (editorMode !== "edit" && editorMode !== "create") || (editorMode === "edit" && !activeRiskId)) return;
    const payload = sanitizeRiskPayload(draft);

    if (payload.title.length < 2) {
      setEditorError("Please provide a risk title.");
      return;
    }

    if (payload.detail.length < 2) {
      setEditorError("Please provide risk details.");
      return;
    }

    const release = editorMode === "edit" ? beginRiskWrite(activeRiskId!) : undefined;
    if (release === null) return;
    setEditorError(null);
    session.pending = true;
    setIsSaving(true);
    try {
      if (editorMode === "create") await onCreateRisk(payload);
      else await onUpdateRisk(activeRiskId!, payload);
      if (editorSession.current === session) closeEditor();
    } catch (error) {
      if (editorSession.current === session) {
        setEditorError(error instanceof Error ? error.message : "Couldn't save this risk.");
      }
    } finally {
      release?.();
      if (editorSession.current === session) {
        session.pending = false;
        setIsSaving(false);
      }
    }
  }, [activeRiskId, beginRiskWrite, closeEditor, draft, editorMode, onCreateRisk, onUpdateRisk]);

  const handleDeleteRisk = useCallback(async () => {
    const session = editorSession.current;
    if (session.pending || !activeRiskId) return;

    const release = beginRiskWrite(activeRiskId);
    if (!release) return;
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
      release();
      if (editorSession.current === session) {
        session.pending = false;
        setIsDeleting(false);
      }
    }
  }, [activeRiskId, beginRiskWrite, closeEditor, onDeleteRisk]);

  const handleQuickUpdateRisk = useCallback(async (riskId: string, patch: Partial<RiskPayload>) => {
    const session = writeSession.current;
    if (session.pending.has(riskId) || editingRiskId.current === riskId || !bootstrap.risks.some((risk) => risk.id === riskId)) return;
    const release = beginRiskWrite(riskId);
    if (!release) return;
    setRiskErrors((errors) => {
      const next = { ...errors };
      delete next[riskId];
      return next;
    });
    try {
      await onUpdateRisk(riskId, sanitizeRiskPatch(patch));
    } catch (error) {
      if (writeSession.current === session) setRiskErrors((errors) => ({ ...errors, [riskId]: error instanceof Error ? error.message : "Couldn't update this risk." }));
    } finally {
      release();
    }
  }, [beginRiskWrite, bootstrap.risks, onUpdateRisk]);

  return {
    activeRisk,
    ...viewData,
    closeEditor,
    draft,
    editorError,
    editorMode,
    handleDeleteRisk,
    handleSaveRisk,
    handleQuickUpdateRisk,
    pendingRiskIds,
    riskErrors,
    isDeleting,
    isSaving,
    openRiskDetails,
    openEditEditor,
    openCreateEditor,
    setDraft,
  };
}
