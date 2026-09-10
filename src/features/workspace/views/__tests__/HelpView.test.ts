/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { HelpView } from "@/features/workspace/views/HelpView";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

describe("HelpView", () => {
  it("documents practical workspace scope, tab behavior, and roster guidance", () => {
    const html = renderToStaticMarkup(React.createElement(HelpView));

    expect(html).toContain("Find your work");
    expect(html).toContain("Work → Tasks");
    expect(html).toContain("Work → Schedule");
    expect(html).toContain("Resources and structure");
    expect(html).toContain("Team");
  });

  it("offers a tutorial launch point inside help", () => {
    const html = renderToStaticMarkup(React.createElement(HelpView));

    expect(html).toContain("Start tutorial");
    expect(html).toContain('data-tutorial-launch="help"');
  });

  it("renders guided tutorial content when launched", () => {
    const html = renderToStaticMarkup(
      React.createElement(HelpView, { tutorialInitiallyOpen: true }),
    );

    expect(html).toContain("Guided workspace tutorial");
    expect(html).toContain("Step 1 of 5");
    expect(html).toContain("Choose your workspace");
    expect(html).toContain("Next step");
    expect(html).toContain("Close tutorial");
  });

  it("renders a completion state when the tutorial is finished", () => {
    const html = renderToStaticMarkup(
      React.createElement(HelpView, {
        tutorialInitiallyComplete: true,
        tutorialInitiallyOpen: true,
      }),
    );

    expect(html).toContain('data-tutorial-state="complete"');
    expect(html).toContain("Tutorial complete");
    expect(html).toContain("You are ready to run the workspace loop");
    expect(html).toContain("Review last step");
    expect(html).toContain("Start again");
  });
});
