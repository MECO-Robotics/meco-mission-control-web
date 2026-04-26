/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared";
import { WorkflowView } from "@/features/workspace/views/WorkflowView";
import type { BootstrapPayload } from "@/types";

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
      }),
    );

    expect(markup).toContain("Add workflow");
    expect(markup).toContain('aria-label="Add workflow"');
  });
});
