/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { WorkLogsView } from "@/features/workspace/views/WorkLogsView";
import type { BootstrapPayload } from "@/types/bootstrap";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

function renderWorkLogsView(
  view: "logs" | "summary",
) {
  const bootstrap: BootstrapPayload = {
    ...EMPTY_BOOTSTRAP,
  };

    return renderToStaticMarkup(
      React.createElement(WorkLogsView, {
        activePersonFilter: [],
        bootstrap,
        membersById: {},
        openCreateWorkLogModal: jest.fn(),
        openEditTaskModal: jest.fn(),
        subsystemsById: {},
        view,
      }),
  );
}

describe("WorkLogsView", () => {
  it("renders the work log summary tab", () => {
    const html = renderWorkLogsView("summary");

    expect(html).toContain("Work log summary");
    expect(html).toContain("Top contributors");
  });
});
