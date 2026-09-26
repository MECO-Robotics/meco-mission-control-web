import { useCatalogEditorLifecycle } from "./useCatalogEditorLifecycle";
import type { WorkspaceLoader } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspaceTypes";
import { useCallback, useEffect, useRef, useState } from "react";

import { buildEmptySubsystemPayload } from "@/lib/appUtils/payloadBuilders";
import { splitList, toErrorMessage } from "@/lib/appUtils/common";
import { subsystemToPayload } from "@/lib/appUtils/payloadConversions";
import { normalizeSubsystemLayoutFields, type SubsystemLayoutFields } from "@/lib/appUtils/subsystemLayout";
import { createSubsystemRecord, updateSubsystemRecord } from "@/lib/auth/records/structure";
import type { BootstrapPayload } from "@/types/bootstrap";
import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import type { Dispatch, SetStateAction } from "react";
import type { SubsystemPayload } from "@/types/payloads";
import type { SubsystemRecord } from "@/types/recordsOrganization";

export function useSubsystemActions({ bootstrap, handleUnauthorized, loadWorkspace, scopedBootstrap, selectedProjectId, setBootstrap, setDataMessage, selectedSeasonId }: {
  selectedSeasonId: string | null;
  bootstrap: BootstrapPayload;
  handleUnauthorized: () => void;
  loadWorkspace: WorkspaceLoader;
  scopedBootstrap: BootstrapPayload;
  selectedProjectId: string | null;
  setBootstrap: Dispatch<SetStateAction<BootstrapPayload>>;
  setDataMessage: (message: string | null) => void;
}) {
  const [subsystemModalMode, setSubsystemModalMode] =
    useState<"create" | "edit" | null>(null);
  const [activeSubsystemId, setActiveSubsystemId] = useState<string | null>(null);
  const [subsystemDraft, setSubsystemDraft] = useState<SubsystemPayload>(
    buildEmptySubsystemPayload(EMPTY_BOOTSTRAP),
  );
  const [subsystemDraftRisks, setSubsystemDraftRisks] = useState("");
  const { beginOperation, resetEditor, isSaving: isSavingSubsystem } =
    useCatalogEditorLifecycle({ loadWorkspace, selectedProjectId, selectedSeasonId });
  const writeTailBySubsystemIdRef = useRef<Record<string, Promise<unknown>>>({});
  const updateRequestVersionBySubsystemIdRef = useRef<Record<string, number>>({});
  const pendingUpdateCountBySubsystemIdRef = useRef<Record<string, number>>({});
  const persistedSubsystemByIdRef = useRef<Record<string, SubsystemRecord>>({});
  const persistedSubsystemVersionByIdRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const nextSubsystemIds = new Set(bootstrap.subsystems.map((subsystem) => subsystem.id));
    Object.keys(persistedSubsystemByIdRef.current).forEach((subsystemId) => {
      if (!nextSubsystemIds.has(subsystemId)) {
        delete persistedSubsystemByIdRef.current[subsystemId];
        delete persistedSubsystemVersionByIdRef.current[subsystemId];
      }
    });

    bootstrap.subsystems.forEach((subsystem) => {
      if ((pendingUpdateCountBySubsystemIdRef.current[subsystem.id] ?? 0) > 0) {
        return;
      }

      persistedSubsystemByIdRef.current[subsystem.id] = subsystem;
      persistedSubsystemVersionByIdRef.current[subsystem.id] =
        updateRequestVersionBySubsystemIdRef.current[subsystem.id] ?? 0;
    });
  }, [bootstrap.subsystems]);

  const openCreateSubsystemModal = useCallback(() => {
    resetEditor();
    setActiveSubsystemId(null);
    setSubsystemDraft(buildEmptySubsystemPayload(scopedBootstrap));
    setSubsystemDraftRisks("");
    setSubsystemModalMode("create");
  }, [scopedBootstrap, resetEditor]);

  const openEditSubsystemModal = useCallback((subsystem: SubsystemRecord) => {
    resetEditor();
    setActiveSubsystemId(subsystem.id);
    setSubsystemDraft(subsystemToPayload(subsystem));
    setSubsystemDraftRisks(subsystem.risks.join("\n"));
    setSubsystemModalMode("edit");
  }, [resetEditor]);

  const closeSubsystemModal = useCallback(() => {
    resetEditor();
    setSubsystemModalMode(null);
    setActiveSubsystemId(null);
  }, [resetEditor]);

  useEffect(() => closeSubsystemModal(), [closeSubsystemModal, selectedProjectId, selectedSeasonId]);

  useEffect(() => {
    if (bootstrap === EMPTY_BOOTSTRAP || (subsystemModalMode === "edit" && !scopedBootstrap.subsystems.some((item) => item.id === activeSubsystemId))) {
      closeSubsystemModal();
    }
  }, [activeSubsystemId, bootstrap, closeSubsystemModal, subsystemModalMode, scopedBootstrap]);

  const handleSubsystemSubmit = useCallback(async (milestone: React.FormEvent<HTMLFormElement>) => {
    milestone.preventDefault();
    if (subsystemModalMode === "create" && !selectedProjectId) {
      setDataMessage("Pick a project before adding a subsystem.");
      return;
    }

    if (!subsystemModalMode) return;
    const operation = beginOperation();
    if (!operation) return;
    setDataMessage(null);

    try {
      const payload: SubsystemPayload = {
        ...subsystemDraft,
        projectId: selectedProjectId ?? subsystemDraft.projectId,
        risks: splitList(subsystemDraftRisks),
      };

      if (subsystemModalMode === "create") {
        await createSubsystemRecord(payload, handleUnauthorized);
      } else if (subsystemModalMode === "edit" && activeSubsystemId) {
        await updateSubsystemRecord(activeSubsystemId, payload, handleUnauthorized);
      }

      await operation.refresh();
      if (operation.isCurrent()) closeSubsystemModal();
    } catch (error) {
      if (operation.isCurrent()) setDataMessage(toErrorMessage(error));
    } finally {
      operation.finish();
    }
  }, [activeSubsystemId, closeSubsystemModal, handleUnauthorized, selectedProjectId, setDataMessage, subsystemDraft, subsystemDraftRisks, subsystemModalMode, beginOperation]);

  const handleToggleSubsystemArchived = useCallback(async (subsystemId: string) => {
    const currentSubsystem = bootstrap.subsystems.find(
      (subsystem) => subsystem.id === subsystemId,
    );
    if (!currentSubsystem) {
      return;
    }

    const operation = beginOperation();
    if (!operation) return;
    setDataMessage(null);

    try {
      await updateSubsystemRecord(
        subsystemId,
        { isArchived: !currentSubsystem.isArchived },
        handleUnauthorized,
      );
      await operation.refresh();
    } catch (error) {
      if (operation.isCurrent()) setDataMessage(toErrorMessage(error));
    } finally {
      operation.finish();
    }
  }, [bootstrap, handleUnauthorized, setDataMessage, beginOperation]);

  const updateSubsystemConfiguration = useCallback(async (
    subsystemId: string,
    patch: Partial<
      Pick<
        SubsystemPayload,
        "name" | "description" | "layoutX" | "layoutY" | "layoutZone" | "layoutView" | "sortOrder"
      >
    >,
  ) => {
    const previousSubsystem = bootstrap.subsystems.find((subsystem) => subsystem.id === subsystemId);
    if (!previousSubsystem) {
      return false;
    }
    const requestVersion = (updateRequestVersionBySubsystemIdRef.current[subsystemId] ?? 0) + 1;
    updateRequestVersionBySubsystemIdRef.current[subsystemId] = requestVersion;
    pendingUpdateCountBySubsystemIdRef.current[subsystemId] =
      (pendingUpdateCountBySubsystemIdRef.current[subsystemId] ?? 0) + 1;

    const hasLayoutPatch = [
      "layoutX",
      "layoutY",
      "layoutZone",
      "layoutView",
      "sortOrder",
    ].some((key) => key in patch);

    const normalizedLayoutPatch: Partial<SubsystemLayoutFields> = hasLayoutPatch
      ? normalizeSubsystemLayoutFields({ ...previousSubsystem, ...patch })
      : {};

    const payload: Partial<SubsystemPayload> = {};

    if (patch.name !== undefined) {
      payload.name = patch.name.trim();
    }

    if (patch.description !== undefined) {
      payload.description = patch.description.trim();
    }

    if (patch.layoutX !== undefined) {
      payload.layoutX = patch.layoutX;
    }

    if (patch.layoutY !== undefined) {
      payload.layoutY = patch.layoutY;
    }

    if (patch.layoutZone !== undefined) {
      payload.layoutZone = patch.layoutZone;
    }

    if (patch.layoutView !== undefined) {
      payload.layoutView = patch.layoutView;
    }

    if (patch.sortOrder !== undefined) {
      payload.sortOrder = patch.sortOrder;
    }

    Object.assign(payload, normalizedLayoutPatch);

    setBootstrap((current) => ({
      ...current,
      subsystems: current.subsystems.map((subsystem) =>
        subsystem.id === subsystemId
          ? { ...subsystem, ...payload }
          : subsystem,
      ),
    }));

    try {
      const previousWrite = writeTailBySubsystemIdRef.current[subsystemId] ?? Promise.resolve();
      const write = previousWrite.catch(() => undefined).then(() => updateSubsystemRecord(subsystemId, payload, handleUnauthorized));
      writeTailBySubsystemIdRef.current[subsystemId] = write;
      const updatedSubsystem = await write;
      const persistedVersion = persistedSubsystemVersionByIdRef.current[subsystemId] ?? 0;
      const shouldPromotePersistedSnapshot = requestVersion >= persistedVersion;
      if (shouldPromotePersistedSnapshot) {
        persistedSubsystemByIdRef.current[subsystemId] = updatedSubsystem;
        persistedSubsystemVersionByIdRef.current[subsystemId] = requestVersion;
      }

      const latestVersion = updateRequestVersionBySubsystemIdRef.current[subsystemId] ?? 0;
      const pendingCount = pendingUpdateCountBySubsystemIdRef.current[subsystemId] ?? 1;
      const shouldApplyOutOfOrderSuccess = shouldPromotePersistedSnapshot && pendingCount === 1;
      if (latestVersion === requestVersion || shouldApplyOutOfOrderSuccess) {
        setBootstrap((current) => ({
          ...current,
          subsystems: current.subsystems.map((subsystem) =>
            subsystem.id === subsystemId ? { ...subsystem, ...updatedSubsystem } : subsystem,
          ),
        }));
      }
      return true;
    } catch (error) {
      const latestVersion = updateRequestVersionBySubsystemIdRef.current[subsystemId] ?? 0;
      if (latestVersion === requestVersion) {
        const persistedSubsystem = persistedSubsystemByIdRef.current[subsystemId];
        const rollbackSubsystem = persistedSubsystem ? { ...persistedSubsystem } : previousSubsystem;
        setBootstrap((current) => ({
          ...current,
          subsystems: current.subsystems.map((subsystem) =>
            subsystem.id === subsystemId ? rollbackSubsystem : subsystem,
          ),
        }));
        setDataMessage(toErrorMessage(error));
      }
      return false;
    } finally {
      const pendingCount = (pendingUpdateCountBySubsystemIdRef.current[subsystemId] ?? 1) - 1;
      if (pendingCount <= 0) {
        delete pendingUpdateCountBySubsystemIdRef.current[subsystemId];
      } else {
        pendingUpdateCountBySubsystemIdRef.current[subsystemId] = pendingCount;
      }
    }
  }, [bootstrap, handleUnauthorized, setBootstrap, setDataMessage, updateRequestVersionBySubsystemIdRef]);

  const saveSubsystemLayout = useCallback(async (
    subsystemId: string,
    layout: SubsystemLayoutFields,
  ) => updateSubsystemConfiguration(subsystemId, layout), [updateSubsystemConfiguration]);

  return {
    subsystemModalMode,
    activeSubsystemId,
    subsystemDraft,
    subsystemDraftRisks,
    isSavingSubsystem,
    setSubsystemDraft,
    setSubsystemDraftRisks,
    closeSubsystemModal,
    handleSubsystemSubmit,
    handleToggleSubsystemArchived,
    openCreateSubsystemModal,
    openEditSubsystemModal,
    saveSubsystemLayout,
    updateSubsystemConfiguration,
  };
}
