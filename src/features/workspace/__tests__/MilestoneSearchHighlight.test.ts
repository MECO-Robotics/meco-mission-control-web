/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { buildMilestoneSearchHighlightSegments, MilestoneSearchHighlight } from "@/features/workspace/views/milestones/MilestoneSearchHighlight";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

describe("milestone search highlighting", () => {
  it("highlights milestone search keywords without changing the visible text", () => {
    expect(buildMilestoneSearchHighlightSegments("Robot robot readiness", "robot")).toEqual([
      { highlighted: true, text: "Robot" },
      { highlighted: false, text: " " },
      { highlighted: true, text: "robot" },
      { highlighted: false, text: " readiness" },
    ]);

    const markup = renderToStaticMarkup(
      React.createElement(MilestoneSearchHighlight, {
        searchFilter: "robot",
        text: "Robot checkpoint",
      }),
    );

    expect(markup).toContain('<mark class="milestone-search-highlight">Robot</mark>');
    expect(markup).toContain(" checkpoint");
  });
});
