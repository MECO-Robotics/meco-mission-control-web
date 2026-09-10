import { renderSidebar } from "./AppSidebar.testUtils";
describe("primary area availability", () => {
  it("disables Resources when the season has no projects", () => {
    expect(renderSidebar([], "home")).toMatch(/<button(?=[^>]*aria-label="Resources")(?=[^>]*disabled="")[^>]*>/);
  });
});
