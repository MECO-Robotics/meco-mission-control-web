import { renderSidebar } from "./AppSidebar.testUtils";

describe("original sidebar with consolidated destinations", () => {
  it("uses the original Home shortcut and inline section subitems", () => {
    const markup = renderSidebar([], "tasks", { taskView: "calendar" });
    expect(markup).toContain("sidebar-quick-action-home");
    expect(markup).toContain("sidebar-subtab-list");
    expect(markup).toContain("sidebar-subtab-icon");
    expect(markup).toContain("sidebar-section-chevron is-expanded");
    for (const label of ["Tasks", "Schedule", "Risks", "Activity"]) expect(markup).toContain(`>${label}</span>`);
    expect(markup).not.toContain("workspace-primary-navigation");
  });
  it("uses compact icons without inline subitems when folded", () => {
    const markup = renderSidebar([], "tasks", { isCollapsed: true });
    expect(markup).not.toContain("sidebar-subtab-list");
    expect(markup).toContain('aria-label="Expand sidebar"');
    expect(markup).toContain('data-tutorial-target="sidebar-tab-work"');
  });
  it("keeps unavailable Resources subitems visible and disabled", () => {
    const markup = renderSidebar([], "inventory");
    expect(markup).toContain('data-enabled="false" disabled=""');
    expect(markup).toContain(">Parts</span>");
  });
});
