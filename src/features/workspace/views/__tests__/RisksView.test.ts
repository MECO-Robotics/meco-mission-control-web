import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RisksView } from "../RisksView";
import { createBootstrap } from "./riskViewTestFixtures";

it("keeps one shared risk search and scopes risk records to the active person", () => {
  const markup = renderToStaticMarkup(React.createElement(RisksView, {
    activePersonFilter: ["member-1"], bootstrap: createBootstrap(),
    onCreateRisk: jest.fn(), onDeleteRisk: jest.fn(), onUpdateRisk: jest.fn(),
  }));
  expect(markup).toContain("Member one risk");
  expect(markup).not.toContain("Member two risk");
  expect(markup.match(/aria-label="Search risks"/g)).toHaveLength(1);
  expect(markup).not.toContain("Build Health:");
  expect(markup).not.toContain("Plan vs Actual");
});
