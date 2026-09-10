import { renderSidebar } from "./AppSidebar.testUtils";

describe("flat sidebar navigation", () => {
  it("shows every destination under noninteractive headings", () => {
    const markup = renderSidebar([], "tasks", { taskView: "calendar" });
    expect(markup).toContain("sidebar-quick-action-home");
    expect(markup).toContain("sidebar-section-heading");
    expect(markup).toContain("sidebar-nav-item-icon");
    expect(markup).not.toContain("sidebar-section-chevron");
    for (const label of ["Tasks", "Schedule", "Robot", "Parts", "People"]) expect(markup).toContain(`>${label}</span>`);
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
  it("keeps unavailable Resources subitems visible and openable", () => {
    const markup = renderSidebar([], "inventory");
    expect(markup).toContain('data-enabled="false"');
    expect(markup).not.toContain('data-enabled="false" disabled=""');
    expect(markup).toContain(">Parts</span>");
  });

  it("places Robot in the Work section", () => {
    const markup = renderSidebar([], "tasks");
    const workStart = markup.indexOf('data-tutorial-target="sidebar-tab-work"');
    const robotIndex = markup.indexOf(">Robot</span>");
    const resourcesStart = markup.indexOf('data-tutorial-target="sidebar-tab-resources"');

    expect(robotIndex).toBeGreaterThan(workStart);
    expect(robotIndex).toBeLessThan(resourcesStart);
    expect(markup).not.toContain(">Structure</span>");
  });

  it("does not grey out unavailable destinations", () => {
    const sidebarCss = require("node:fs").readFileSync("src/app/styles/shell/sidebar/sidebar-navigation.css", "utf8");
    expect(sidebarCss).not.toContain("opacity: 0.48");
  });
});
