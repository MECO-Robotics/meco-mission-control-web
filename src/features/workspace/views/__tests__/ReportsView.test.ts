/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared";
import { ReportsView } from "@/features/workspace/views";
import type { BootstrapPayload } from "@/types";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

function renderReportsView() {
  const bootstrap: BootstrapPayload = {
    ...EMPTY_BOOTSTRAP,
  };

  return renderToStaticMarkup(
    React.createElement(ReportsView, {
      bootstrap,
      openCreateEventReportModal: jest.fn(),
      openCreateQaReportModal: jest.fn(),
    }),
  );
}

describe("ReportsView", () => {
  it("renders launchers for QA and Event Result reports", () => {
    const html = renderReportsView();

    expect(html).toContain("Reports");
    expect(html).toContain("QA report");
    expect(html).toContain("Event Result");
    expect(html).toContain("Add QA report");
    expect(html).toContain("Add event result");
  });
});
