/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { ArtifactInventoryView } from "@/features/workspace/views/ArtifactInventoryView";
import { MaterialsView } from "@/features/workspace/views/MaterialsView";
import { PartsView } from "@/features/workspace/views/PartsView";
import { PurchasesView } from "@/features/workspace/views/PurchasesView";
import { WorkflowView } from "@/features/workspace/views/WorkflowView";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

describe("workspace purpose empty states", () => {
  it("explains empty materials and offers the create action", () => {
    const markup = renderToStaticMarkup(
      React.createElement(MaterialsView, {
        bootstrap: EMPTY_BOOTSTRAP,
        openCreateMaterialModal: jest.fn(),
        openEditMaterialModal: jest.fn(),
      }),
    );

    expect(markup).toContain("Manage consumable and raw material inventory here");
    expect(markup).toContain("No stock, vendor, location, or reorder threshold records");
    expect(markup).toContain("Add material");
    expect(markup).not.toContain("No materials match the current filters.");
  });

  it("explains empty purchase requests and offers the create action", () => {
    const markup = renderToStaticMarkup(
      React.createElement(PurchasesView, {
        activePersonFilter: [],
        bootstrap: EMPTY_BOOTSTRAP,
        membersById: {},
        openCreatePurchaseModal: jest.fn(),
        openEditPurchaseModal: jest.fn(),
        subsystemsById: {},
      }),
    );

    expect(markup).toContain("Track requested parts and materials here");
    expect(markup).toContain("has not captured any parts, tools, or materials");
    expect(markup).toContain("Add purchase");
    expect(markup).not.toContain("No purchase requests match the current filters.");
  });

  it("explains empty document inventory and offers the create action", () => {
    const markup = renderToStaticMarkup(
      React.createElement(ArtifactInventoryView, {
        artifacts: [],
        bootstrap: EMPTY_BOOTSTRAP,
        createKind: "document",
        kinds: ["document"],
        openCreateArtifactModal: jest.fn(),
        openEditArtifactModal: jest.fn(),
        title: "Documents",
      }),
    );

    expect(markup).toContain("Documents collect project files and handoffs here");
    expect(markup).toContain("has not linked any documents");
    expect(markup).toContain("Add document");
    expect(markup).not.toContain("No documents artifacts match the current filters.");
  });

  it("explains empty workflows and offers the create action", () => {
    const markup = renderToStaticMarkup(
      React.createElement(WorkflowView, {
        artifacts: [],
        bootstrap: EMPTY_BOOTSTRAP,
        membersById: {},
        openCreateWorkstreamModal: jest.fn(),
        openEditWorkstreamModal: jest.fn(),
      }),
    );

    expect(markup).toContain("Organize project workstreams here");
    expect(markup).toContain("No workflow lanes have been created");
    expect(markup).toContain("Add workflow");
    expect(markup).not.toContain("No workflows match the current search.");
  });

  it("distinguishes archived-only workflows from truly empty workflows", () => {
    const markup = renderToStaticMarkup(
      React.createElement(WorkflowView, {
        artifacts: [],
        bootstrap: {
          ...EMPTY_BOOTSTRAP,
          workstreams: [
            {
              id: "workflow-archived",
              projectId: "project-1",
              name: "Archived workflow",
              description: "",
              isArchived: true,
            },
          ],
        },
        membersById: {},
        openCreateWorkstreamModal: jest.fn(),
        openEditWorkstreamModal: jest.fn(),
      }),
    );

    expect(markup).toContain("Archived workflows are hidden");
    expect(markup).toContain("Turn on Show archived");
    expect(markup).not.toContain("workspace-empty-state-action");
  });

  it("explains the empty consolidated parts catalog", () => {
    const markup = renderToStaticMarkup(
      React.createElement(PartsView, {
        bootstrap: EMPTY_BOOTSTRAP,
        mechanismsById: {},
        openCreatePartDefinitionModal: jest.fn(),
        openEditPartDefinitionModal: jest.fn(),
        partDefinitionsById: {},
        subsystemsById: {},
      }),
    );

    expect(markup).toContain("Catalog reusable part definitions here");
    expect(markup).toContain("No reusable parts have been defined");
    expect(markup).toContain("Add part definition");
    expect(markup).not.toContain("No part definitions match the current search.");
    expect(markup).not.toContain("No part instances match the current filters.");
  });

  it("distinguishes archived-only artifacts from truly empty artifacts", () => {
    const markup = renderToStaticMarkup(
      React.createElement(ArtifactInventoryView, {
        artifacts: [
          {
            id: "artifact-archived",
            projectId: "project-1",
            workstreamId: null,
            kind: "document",
            title: "Archived document",
            summary: "",
            status: "draft",
            link: "",
            isArchived: true,
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        ],
        bootstrap: EMPTY_BOOTSTRAP,
        createKind: "document",
        kinds: ["document"],
        openCreateArtifactModal: jest.fn(),
        openEditArtifactModal: jest.fn(),
        title: "Documents",
      }),
    );

    expect(markup).toContain("Archived documents are hidden");
    expect(markup).toContain("Turn on Show archived");
    expect(markup).not.toContain("workspace-empty-state-action");
  });

  it("distinguishes archived-only part definitions from truly empty definitions", () => {
    const markup = renderToStaticMarkup(
      React.createElement(PartsView, {
        bootstrap: {
          ...EMPTY_BOOTSTRAP,
          partDefinitions: [
            {
              id: "part-archived",
              seasonId: "season-1",
              name: "Archived part",
              partNumber: "ARCH-1",
              revision: "A",
              iteration: 1,
              isArchived: true,
              type: "COTS",
              source: "vendor",
              materialId: null,
              description: "",
            },
          ],
        },
        mechanismsById: {},
        openCreatePartDefinitionModal: jest.fn(),
        openEditPartDefinitionModal: jest.fn(),
        partDefinitionsById: {},
        subsystemsById: {},
      }),
    );

    expect(markup).toContain("Archived part definitions are hidden");
    expect(markup).toContain("Turn on Show archived");
    expect(markup).not.toContain("workspace-empty-state-action");
  });
});
