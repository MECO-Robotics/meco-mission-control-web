import { useCallback } from "react";

import { buildEmptySubsystemPayload } from "@/lib/appUtils/payloadBuilders";
import { splitList, toErrorMessage } from "@/lib/appUtils/common";
import { subsystemToPayload } from "@/lib/appUtils/payloadConversions";
import { normalizeSubsystemLayoutFields, type SubsystemLayoutFields } from "@/lib/appUtils/subsystemLayout";
import { createSubsystemRecord, updateSubsystemRecord } from "@/lib/auth/records/structure";
import type { AppWorkspaceModel } from "../hooks/useAppWorkspaceModel";
import type { SubsystemPayload } from "@/types/payloads";
import type { SubsystemRecord } from "@/types/recordsOrganization";

export type SubsystemActions = ReturnType<typeof useSubsystemActions>;

export function useSubsystemActions(model: AppWorkspaceModel) {
  const openCreateSubsystemModal = useCallback(() => {
    model.setActiveSubsystemId(null);
    model.setSubsystemDraft(buildEmptySubsystemPayload(model.scopedBootstrap));
    model.setSubsystemDraftRisks("");
    model.setSubsystemModalMode("create");
  }, [model]);

  const openEditSubsystemModal = useCallback((subsystem: SubsystemRecord) => {
    model.setActiveSubsystemId(subsystem.id);
    model.setSubsystemDraft(subsystemToPayload(subsystem));
    model.setSubsystemDraftRisks(subsystem.risks.join("\n"));
    model.setSubsystemModalMode("edit");
  }, [model]);

  const closeSubsystemModal = useCallback(() => {
    model.setSubsystemModalMode(null);
    model.setActiveSubsystemId(null);
  }, [model]);

  const handleSubsystemSubmit = useCallback(async (milestone: React.FormEvent<HTMLFormElement>) => {
    milestone.preventDefault();
    if (model.subsystemModalMode === "create" && !model.selectedProjectId) {
      model.setDataMessage("Pick a project before adding a subsystem.");
      return;
    }

    model.setIsSavingSubsystem(true);
    model.setDataMessage(null);

    try {
      const payload: SubsystemPayload = {
        ...model.subsystemDraft,
        projectId: model.selectedProjectId ?? model.subsystemDraft.projectId,
        risks: splitList(model.subsystemDraftRisks),
      };

      if (model.subsystemModalMode === "create") {
        await createSubsystemRecord(payload, model.handleUnauthorized);
      } else if (model.subsystemModalMode === "edit" && model.activeSubsystemId) {
        await updateSubsystemRecord(model.activeSubsystemId, payload, model.handleUnauthorized);
      }

      await model.loadWorkspace();
      closeSubsystemModal();
    } catch (error) {
      model.setDataMessage(toErrorMessage(error));
    } finally {
      model.setIsSavingSubsystem(false);
    }
  }, [closeSubsystemModal, model]);

  const handleToggleSubsystemArchived = useCallback(async (subsystemId: string) => {
    const currentSubsystem = model.bootstrap.subsystems.find(
      (subsystem) => subsystem.id === subsystemId,
    );
    if (!currentSubsystem) {
      return;
    }

    model.setIsSavingSubsystem(true);
    model.setDataMessage(null);

    try {
      await updateSubsystemRecord(
        subsystemId,
        { isArchived: !currentSubsystem.isArchived },
        model.handleUnauthorized,
      );
      await model.loadWorkspace();
    } catch (error) {
      model.setDataMessage(toErrorMessage(error));
    } finally {
      model.setIsSavingSubsystem(false);
    }
  }, [model]);

  const updateSubsystemConfiguration = useCallback(async (
    subsystemId: string,
    patch: Partial<
      Pick<
        SubsystemPayload,
        "name" | "description" | "layoutX" | "layoutY" | "layoutZone" | "layoutView" | "sortOrder"
      >
    >,
  ) => {
    const previousSubsystem = model.bootstrap.subsystems.find((subsystem) => subsystem.id === subsystemId);
    if (!previousSubsystem) {
      return false;
    }

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

    model.setBootstrap((current) => ({
      ...current,
      subsystems: current.subsystems.map((subsystem) =>
        subsystem.id === subsystemId
          ? { ...subsystem, ...payload }
          : subsystem,
      ),
    }));

    try {
      const updatedSubsystem = await updateSubsystemRecord(
        subsystemId,
        payload,
        model.handleUnauthorized,
      );

      model.setBootstrap((current) => ({
        ...current,
        subsystems: current.subsystems.map((subsystem) =>
          subsystem.id === subsystemId ? { ...subsystem, ...updatedSubsystem } : subsystem,
        ),
      }));
      return true;
    } catch (error) {
      model.setBootstrap((current) => ({
        ...current,
        subsystems: current.subsystems.map((subsystem) =>
          subsystem.id === subsystemId ? previousSubsystem : subsystem,
        ),
      }));
      model.setDataMessage(toErrorMessage(error));
      return false;
    }
  }, [model]);

  const saveSubsystemLayout = useCallback(async (
    subsystemId: string,
    layout: SubsystemLayoutFields,
  ) => updateSubsystemConfiguration(subsystemId, layout), [updateSubsystemConfiguration]);

  return {
    closeSubsystemModal,
    handleSubsystemSubmit,
    handleToggleSubsystemArchived,
    openCreateSubsystemModal,
    openEditSubsystemModal,
    saveSubsystemLayout,
    updateSubsystemConfiguration,
  };
}
