import { renderSidebar } from "./AppSidebar.testUtils";

describe("flat sidebar navigation", () => {
  it("shows every destination under noninteractive headings", () => {
    const markup = renderSidebar([], "tasks", { taskView: "calendar" });
    expect(markup).toContain("sidebar-quick-action-home");
    expect(markup).toContain("sidebar-section-heading");
    expect(markup).toContain("sidebar-nav-item-icon");
    expect(markup).not.toContain("sidebar-section-chevron");
    for (const label of ["Tasks", "Schedule", "Activity", "Parts", "People"]) expect(markup).toContain(`>${label}</span>`);
    expect(markup).not.toContain(">Risks</span>");
    expect(markup).not.toContain("workspace-primary-navigation");
  });
  it("keeps destinations directly accessible when folded", () => {
    const markup = renderSidebar([], "tasks", { isCollapsed: true });
    expect(markup).not.toContain("sidebar-subtab-list");
    expect(markup).toContain('aria-label="Expand sidebar"');
    expect(markup).toContain('aria-label="Tasks"');
    expect(markup).toContain('aria-label="Parts"');
    expect(markup).not.toContain("sidebar-section-heading");
  });
  it("keeps unavailable Resources subitems visible and disabled", () => {
    const markup = renderSidebar([], "inventory");
    expect(markup).toContain('data-enabled="false" disabled=""');
    expect(markup).toContain(">Parts</span>");
  });

  it("does not grey out unavailable destinations", () => {
    const sidebarCss = require("node:fs").readFileSync("src/app/styles/shell/sidebar/sidebar.part3.css", "utf8");
    expect(sidebarCss).not.toContain("opacity: 0.48");
  });
});
