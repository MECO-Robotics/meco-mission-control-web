/// <reference types="jest" />

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import type { BootstrapPayload } from "@/types/bootstrap";
import { TaskDetailsBlockersSectionView } from "../TaskDetailsBlockersSectionView";

function createBootstrap(): BootstrapPayload {
  return {
    ...EMPTY_BOOTSTRAP,
    taskBlockers: [
      {
        id: "blocker-1",
        blockedTaskId: "task-1",
        blockerType: "broken-part",
        blockerId: null,
        description: "Intake plate cracked during fit check",
        severity: "high",
        status: "open",
        createdByMemberId: null,
        createdAt: "2026-05-01T00:00:00.000Z",
        resolvedAt: null,
      },
    ],
  };
}

describe("TaskDetailsBlockersSectionView", () => {
  it("renders blocker taxonomy labels with blocker details", () => {
    const markup = renderToStaticMarkup(
      React.createElement(TaskDetailsBlockersSectionView, {
        activeTaskId: "task-1",
        bootstrap: createBootstrap(),
        canInlineEdit: false,
        onResolveTaskBlocker: jest.fn(),
      }),
    );

    expect(markup).toContain("Broken part");
    expect(markup).toContain("Intake plate cracked during fit check");
  });
});
