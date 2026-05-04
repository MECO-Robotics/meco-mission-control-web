/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import AppErrorBoundary from "../AppErrorBoundary";

describe("AppErrorBoundary", () => {
  it("returns the fallback toast after an error", () => {
    const boundary = new AppErrorBoundary({
      children: React.createElement("div", null, "ok"),
    });

    Object.assign(boundary, { state: { hasError: true } });

    const markup = renderToStaticMarkup(boundary.render());

    expect(markup).toContain("Something went wrong");
    expect(markup).toContain("Please refresh the page and try again.");
  });

  it("marks the boundary as errored", () => {
    expect(AppErrorBoundary.getDerivedStateFromError()).toEqual({
      hasError: true,
    });
  });
});
