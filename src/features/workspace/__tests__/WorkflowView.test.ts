/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { WorkflowView } from "@/features/workspace/views/WorkflowView";
import type { BootstrapPayload } from "@/types/bootstrap";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

function createBootstrap(): BootstrapPayload {
  return {
    ...EMPTY_BOOTSTRAP,
    projects: [
      {
        id: "project-1",
        seasonId: "season-1",
        name: "Operations",
        projectType: "operations",
        description: "",
        status: "active",
      },
    ],
    workstreams: [
      {
        id: "workflow-1",
        projectId: "project-1",
        name: "Media",
        color: "#E76F51",
        description: "Media workflow",
      },
    ],
  };
}

describe("WorkflowView", () => {
  it("renders an add workflow action in the manager toolbar", () => {
    const markup = renderToStaticMarkup(
      React.createElement(WorkflowView, {
        artifacts: [],
        bootstrap: createBootstrap(),
        membersById: {},
        openCreateWorkstreamModal: jest.fn(),
        openEditWorkstreamModal: jest.fn(),
      }),
    );

    expect(markup).toContain("Add workflow");
    expect(markup).toContain('aria-label="Add workflow"');
  });

  it("surfaces workflow color metadata in the rendered row", () => {
    const markup = renderToStaticMarkup(
      React.createElement(WorkflowView, {
        artifacts: [],
        bootstrap: createBootstrap(),
        membersById: {},
        openCreateWorkstreamModal: jest.fn(),
        openEditWorkstreamModal: jest.fn(),
      }),
    );

    expect(markup).toContain('data-workspace-color="#E76F51"');
  });
});
