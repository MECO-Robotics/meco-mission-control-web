/// <reference types="jest" />

import * as React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";

jest.mock("@/lib/branding", () => ({
  MECO_COMPACT_TEAM_LOGO_SIZE: 48,
  MECO_COMPACT_TEAM_LOGO_SRC: "/team-logo.png",
  MECO_MAIN_LOGO_HEIGHT: 40,
  MECO_MAIN_LOGO_LIGHT_SRC: "/logo-light.png",
  MECO_MAIN_LOGO_WHITE_SRC: "/logo-white.png",
  MECO_MAIN_LOGO_WIDTH: 120,
}));

import { AppTopbar } from "@/components/layout/AppTopbar";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

function renderTopbar(
  options: {
    isActiveViewFavorite?: boolean;
    isDarkMode?: boolean;
    isSidebarCollapsed?: boolean;
    onToggleActiveViewFavorite?: (() => void) | null;
  } = {},
) {
  return renderToStaticMarkup(
    React.createElement(AppTopbar, {
      activeViewLabel: "Timeline",
      isActiveViewFavorite: options.isActiveViewFavorite ?? false,
      isDarkMode: options.isDarkMode ?? false,
      isSidebarCollapsed: options.isSidebarCollapsed ?? false,
      onToggleActiveViewFavorite: options.onToggleActiveViewFavorite ?? jest.fn(),
    }),
  );
}

function readTopbarShellCss() {
  return readFileSync(join(process.cwd(), "src/app/styles/shell/chrome/topbar-shell.css"), "utf8");
}

describe("AppTopbar", () => {
  it("uses the full logo when the sidebar is unfolded", () => {
    const markup = renderTopbar();

    expect(markup).toContain('alt="MECO main logo"');
    expect(markup).toContain('data-logo-variant="full"');
    expect(markup).toContain('height="40"');
    expect(markup).toContain('width="120"');
    expect(markup).toContain('src="/logo-light.png"');
  });

  it("uses the compact team logo when the sidebar is folded", () => {
    const markup = renderTopbar({ isSidebarCollapsed: true });

    expect(markup).toContain('alt="MECO compact team logo"');
    expect(markup).toContain('data-logo-variant="compact"');
    expect(markup).toContain('height="48"');
    expect(markup).toContain('width="48"');
    expect(markup).toContain('src="/team-logo.png"');
  });

  it("renders a favorite star directly before the active view title", () => {
    const markup = renderTopbar();

    expect(markup).toMatch(
      /<button(?=[^>]*class="[^"]*app-topbar-favorite-button)(?=[^>]*aria-label="Add Timeline to favorites")(?=[^>]*aria-pressed="false")[^>]*>[\s\S]*?<\/button><h1>Timeline<\/h1>/,
    );
  });

  it("keeps profile and refresh controls out of the topbar", () => {
    const markup = renderTopbar();

    expect(markup).not.toContain("profile-menu");
    expect(markup).not.toContain('aria-label="Refresh workspace"');
  });

  it("caps the default topbar search width", () => {
    const topbarShellCss = readTopbarShellCss();

    expect(topbarShellCss).toMatch(/\.app-topbar-search\s*\{[^}]*max-width:\s*44rem;/);
  });
});
