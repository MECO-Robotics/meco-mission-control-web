/// <reference types="jest" />

import { renderSidebar, signedInUser } from "./AppSidebar.testUtils";

describe("AppSidebar profile", () => {
  it("renders a single editable profile button", () => {
    const markup = renderSidebar([], "tasks", { sessionUser: signedInUser });

    expect(markup).toContain('class="sidebar-quick-action-profile"');
    expect(markup).toMatch(
      /<button(?=[^>]*class="[^\"]*app-profile-editor-button)(?=[^>]*aria-label="Edit profile")[^>]*>[\s\S]*profile-avatar[\s\S]*<\/button>/,
    );
    expect(markup).not.toContain("profile-view-switch");
    expect(markup).not.toContain("Switch view");
    expect(markup).not.toContain("profile-view-users-icon");
  });

  it("keeps the local development avatar visible", () => {
    const markup = renderSidebar([], "tasks");

    expect(markup).toContain('aria-label="Local dev profile"');
    expect(markup).toContain("app-topbar-local-avatar");
    expect(markup).toContain(">L</span>");
  });
});
