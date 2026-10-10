/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { HomeView } from "../HomeView";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

describe("HomeView topbar", () => {
  it("provides dashboard search and a dashboard-specific add menu", () => {
    const markup = renderToStaticMarkup(
      React.createElement(HomeView, {
        bootstrap: EMPTY_BOOTSTRAP,
        onOpenTask: jest.fn(),
        openCreateQaReportModal: jest.fn(),
        openCreateTaskModal: jest.fn(),
      }),
    );

    expect(markup).toContain('aria-label="Search dashboard"');
    expect(markup).toContain('aria-label="Filter dashboard content"');
    expect(markup).toContain('aria-label="Add dashboard item"');
    expect(markup).toContain('aria-haspopup="menu"');
    expect(markup).toContain("Add to dashboard");
  });
});
