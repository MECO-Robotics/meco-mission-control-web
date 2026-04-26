/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared";
import { MilestonesView } from "@/features/workspace/views/MilestonesView";
import type { BootstrapPayload } from "@/types";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

function createBootstrap(): BootstrapPayload {
  return {
    ...EMPTY_BOOTSTRAP,
    projects: [
      {
        id: "project-1",
        seasonId: "season-1",
        name: "Robot",
        projectType: "robot",
        description: "",
        status: "active",
      },
    ],
    events: [
      {
        id: "event-1",
        title: "Regional",
        type: "competition",
        startDateTime: "2026-03-10T14:00:00.000Z",
        endDateTime: null,
        isExternal: true,
        description: "Competition readiness checkpoint",
        projectIds: ["project-1"],
        relatedSubsystemIds: [],
      },
    ],
  };
}

describe("MilestonesView", () => {
  it("renders type chips with dark-mode-safe palette variables", () => {
    const markup = renderToStaticMarkup(
      React.createElement(MilestonesView, {
        bootstrap: createBootstrap(),
        isAllProjectsView: false,
        onDeleteTimelineEvent: jest.fn(),
        onSaveTimelineEvent: jest.fn(),
        subsystemsById: {},
      }),
    );

    expect(markup).toContain("milestone-type-pill");
    expect(markup).toContain("--milestone-type-chip-bg-dark");
    expect(markup).toContain("--milestone-type-chip-text-dark");
    expect(markup).not.toContain("color:#1f3f7a");
  });
});
