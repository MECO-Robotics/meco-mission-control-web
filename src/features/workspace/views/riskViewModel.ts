import { useCallback, useEffect, useMemo, useState } from "react";

import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { useFilterChangeMotionClass } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { useWorkspacePagination } from "@/features/workspace/shared/table/workspaceTableChrome";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { RiskPayload } from "@/types/payloads";
import type { RiskRecord } from "@/types/recordsReporting";

import {
  ATTACHMENT_TYPE_LABELS,
  RISK_SEVERITY_ORDER,
  SEVERITY_RANK,
  buildDefaultRiskPayload,
  buildRisksViewData,
  formatRiskSeverity,
  getRiskSeverityPillClassName,
  sanitizeRiskPayload,
  toRiskPayload,
  type RiskSourceFilter,
  type RiskSeverityFilter,
  type RiskViewData,
  type SelectOption,
} from "./riskViewData";

export type { RiskSourceFilter, RiskSeverityFilter, RiskViewData, SelectOption };
export {
  ATTACHMENT_TYPE_LABELS,
  RISK_SEVERITY_ORDER,
  SEVERITY_RANK,
  formatRiskSeverity,
  getRiskSeverityPillClassName,
};

export type RiskEditorMode = "create" | "detail" | "edit" | null;

interface UseRisksViewModelArgs {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  onCreateRisk: (payload: RiskPayload) => Promise<void>;
  onDeleteRisk: (riskId: string) => Promise<void>;
  onUpdateRisk: (riskId: string, payload: RiskPayload) => Promise<void>;
}

export function useRisksViewModel({
  activePersonFilter,
  bootstrap,
  onCreateRisk,
  onDeleteRisk,
  onUpdateRisk,
}: UseRisksViewModelArgs) {
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<RiskSeverityFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<RiskSourceFilter>("all");
  const [editorMode, setEditorMode] = useState<RiskEditorMode>(null);
  const [activeRiskId, setActiveRiskId] = useState<string | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const viewData = useMemo(
    () =>
      buildRisksViewData({
        activePersonFilter,
        bootstrap,
        search,
        severityFilter,
        sourceFilter,
      }),
    [activePersonFilter, bootstrap, search, severityFilter, sourceFilter],
  );

  const [draft, setDraft] = useState<RiskPayload>(() =>
    buildDefaultRiskPayload(
      bootstrap,
      viewData.qaSourceOptions,
      viewData.testSourceOptions,
      viewData.projectAttachmentOptions,
    ),
  );

  const sourceOptions = viewData.sourceOptionsForType(draft.sourceType);
  const attachmentOptions = viewData.attachmentOptionsForType(draft.attachmentType);
  const activeRisk = useMemo(
    () => bootstrap.risks.find((risk) => risk.id === activeRiskId) ?? null,
    [activeRiskId, bootstrap.risks],
  );

  const openCreateEditor = useCallback(() => {
    setDraft(
      buildDefaultRiskPayload(
        bootstrap,
        viewData.qaSourceOptions,
        viewData.testSourceOptions,
        viewData.projectAttachmentOptions,
      ),
    );
    setActiveRiskId(null);
    setEditorError(null);
    setEditorMode("create");
  }, [bootstrap, viewData.qaSourceOptions, viewData.testSourceOptions, viewData.projectAttachmentOptions]);

  const openRiskDetails = useCallback((risk: RiskRecord) => {
    setDraft(toRiskPayload(risk));
    setActiveRiskId(risk.id);
    setEditorError(null);
    setEditorMode("detail");
  }, []);

  const openEditEditor = useCallback((risk: RiskRecord) => {
    setDraft(toRiskPayload(risk));
    setActiveRiskId(risk.id);
    setEditorError(null);
    setEditorMode("edit");
  }, []);

  const closeEditor = useCallback(() => {
    setEditorMode(null);
    setActiveRiskId(null);
    setEditorError(null);
    setIsSaving(false);
    setIsDeleting(false);
  }, []);

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
    setIsSaving(true);
    try {
      if (editorMode === "create") {
        await onCreateRisk(payload);
      } else if (editorMode === "edit" && activeRiskId) {
        await onUpdateRisk(activeRiskId, payload);
      }
      closeEditor();
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : "Couldn't save this risk.");
    } finally {
      setIsSaving(false);
    }
  }, [activeRiskId, closeEditor, draft, editorMode, onCreateRisk, onUpdateRisk]);

  const handleDeleteRisk = useCallback(async () => {
    if (!activeRiskId) {
      return;
    }

    setEditorError(null);
    setIsDeleting(true);
    try {
      await onDeleteRisk(activeRiskId);
      closeEditor();
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : "Couldn't delete this risk.");
    } finally {
      setIsDeleting(false);
    }
  }, [activeRiskId, closeEditor, onDeleteRisk]);

  const pagination = useWorkspacePagination(viewData.filteredRows);
  const riskFilterMotionClass = useFilterChangeMotionClass([
    search,
    severityFilter,
    sourceFilter,
  ]);

  return {
    activeRisk,
    ...viewData,
    activeRiskId,
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
    openCreateEditor,
    openRiskDetails,
    openEditEditor,
    pagination,
    riskFilterMotionClass,
    search,
    setDraft,
    setSearch,
    setSeverityFilter,
    setSourceFilter,
    severityFilter,
    sourceFilter,
    sourceOptions,
    totalTaskCount: viewData.scopedTaskCount,
  };
}
