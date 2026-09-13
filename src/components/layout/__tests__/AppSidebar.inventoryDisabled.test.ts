import { renderSidebar } from "./AppSidebar.testUtils";

describe("destination availability", () => {
  it("disables Parts when the season has no projects", () => {
    expect(renderSidebar([], "home")).toMatch(/<button(?=[^>]*data-tutorial-target="sidebar-view-resources-parts")(?=[^>]*disabled="")[^>]*>/);
  });
});
