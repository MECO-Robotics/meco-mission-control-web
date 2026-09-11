import { renderSidebar } from "./AppSidebar.testUtils";

describe("destination availability", () => {
  it("keeps Parts openable when the season has no projects", () => {
    expect(renderSidebar([], "home")).toMatch(/<button(?=[^>]*data-tutorial-target="sidebar-view-resources-parts")(?![^>]*disabled)[^>]*>/);
  });
});
