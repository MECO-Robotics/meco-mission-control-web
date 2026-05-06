import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MechanismEditorModal } from "@/features/workspace/modals/structure/MechanismEditorModal";
import { PartDefinitionEditorModal } from "@/features/workspace/modals/assetCatalog/PartDefinitionEditorModal";
import { WorkstreamEditorModal } from "@/features/workspace/modals/assetCatalog/WorkstreamEditorModal";
import { SubsystemEditorModal } from "@/features/workspace/modals/structure/SubsystemEditorModal";
import { createBootstrap } from "./support/WorkspaceModals.test.shared";

export function renderIterationEditors(mode: "create" | "edit") {
  const bootstrap = createBootstrap();
  const noop = jest.fn();
  const requestPhotoUpload = jest.fn(async () => "https://cdn.example.test/uploaded.png");

  return [
    renderToStaticMarkup(
      React.createElement(PartDefinitionEditorModal, {
        activePartDefinitionId: mode === "edit" ? "part-definition-1" : null,
        bootstrap,
        closePartDefinitionModal: noop,
        handleDeletePartDefinition: noop,
        handleTogglePartDefinitionArchived: noop,
        handlePartDefinitionSubmit: noop,
        isDeletingPartDefinition: false,
        isSavingPartDefinition: false,
        requestPhotoUpload,
        partDefinitionDraft: {
          name: "Bearing Block",
          partNumber: "BB-001",
          revision: "A",
          iteration: 1,
          isHardware: false,
          type: "custom",
          source: "Onshape",
          materialId: null,
          description: "",
          photoUrl: "",
        },
        partDefinitionModalMode: mode,
        setPartDefinitionDraft: noop,
      }),
    ),
    renderToStaticMarkup(
      React.createElement(SubsystemEditorModal, {
        activeSubsystemId: mode === "edit" ? "subsystem-1" : null,
        bootstrap,
        closeSubsystemModal: noop,
        handleToggleSubsystemArchived: noop,
        handleSubsystemSubmit: noop,
        isSavingSubsystem: false,
        requestPhotoUpload,
        subsystemDraft: {
          projectId: "project-1",
          name: "Drive",
          color: "#4F86C6",
          description: "Drive subsystem",
          photoUrl: "",
          iteration: 1,
          parentSubsystemId: null,
          responsibleEngineerId: null,
          mentorIds: [],
          risks: [],
        },
        subsystemDraftRisks: "",
        subsystemModalMode: mode,
        setSubsystemDraft: noop,
        setSubsystemDraftRisks: noop,
      }),
    ),
    renderToStaticMarkup(
      React.createElement(MechanismEditorModal, {
        activeMechanismId: mode === "edit" ? "mechanism-1" : null,
        bootstrap,
        closeMechanismModal: noop,
        handleDeleteMechanism: noop,
        handleToggleMechanismArchived: noop,
        handleMechanismSubmit: noop,
        isDeletingMechanism: false,
        isSavingMechanism: false,
        requestPhotoUpload,
        mechanismDraft: {
          subsystemId: "subsystem-1",
          name: "Gearbox",
          description: "Drive gearbox",
          googleSheetsUrl: "",
          photoUrl: "",
          iteration: 1,
        },
        mechanismModalMode: mode,
        setMechanismDraft: noop,
      }),
    ),
  ].join("");
}

export function renderWorkstreamModal(mode: "create" | "edit") {
  const bootstrap = createBootstrap();
  const noop = jest.fn();

  return renderToStaticMarkup(
    React.createElement(WorkstreamEditorModal, {
      activeWorkstreamId: mode === "edit" ? "workstream-1" : null,
      bootstrap,
      closeWorkstreamModal: noop,
      handleToggleWorkstreamArchived: noop,
      handleWorkstreamSubmit: noop,
      isSavingWorkstream: false,
      setWorkstreamDraft: noop,
      workstreamDraft: {
        projectId: "project-1",
        name: "Operations",
        color: "#E76F51",
        description: "Operations workflow",
        isArchived: false,
      },
      workstreamModalMode: mode,
    }),
  );
}
