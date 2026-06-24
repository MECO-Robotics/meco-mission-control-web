/// <reference types="jest" />

import * as React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";

jest.mock("@/lib/branding", () => ({
  MECO_COMPACT_TEAM_LOGO_HEIGHT: 50,
  MECO_COMPACT_TEAM_LOGO_SRC: "/team-logo.png",
  MECO_COMPACT_TEAM_LOGO_WIDTH: 48,
  MECO_COMPACT_TEAM_LOGO_WHITE_SRC: "/team-logo-white.png",
  MECO_MAIN_LOGO_HEIGHT: 40,
  MECO_MAIN_LOGO_LIGHT_SRC: "/logo-light.png",
  MECO_MAIN_LOGO_WHITE_SRC: "/logo-white.png",
  MECO_MAIN_LOGO_WIDTH: 120,
}));

import { AppTopbar } from "@/components/layout/AppTopbar";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

function renderTopbar(
  options: {
    activeViewLabel?: string;
    isActiveViewFavorite?: boolean;
    isDarkMode?: boolean;
    isSidebarCollapsed?: boolean;
    onToggleActiveViewFavorite?: (() => void) | null;
  } = {},
) {
  const favoriteToggle = Object.prototype.hasOwnProperty.call(options, "onToggleActiveViewFavorite")
    ? (options.onToggleActiveViewFavorite ?? null)
    : jest.fn();

  return renderToStaticMarkup(
    React.createElement(AppTopbar, {
      activeViewLabel: options.activeViewLabel ?? "Timeline",
      isActiveViewFavorite: options.isActiveViewFavorite ?? false,
      isDarkMode: options.isDarkMode ?? false,
      isSidebarCollapsed: options.isSidebarCollapsed ?? false,
      onToggleActiveViewFavorite: favoriteToggle,
    }),
  );
}

function readTopbarShellCss() {
  return readFileSync(join(process.cwd(), "src/app/styles/shell/chrome/topbar-shell.css"), "utf8");
}

function readTopbarSearchCss() {
  return readFileSync(join(process.cwd(), "src/app/styles/shell/chrome/topbar-search.css"), "utf8");
}

function readTopbarResponsiveSearchCss() {
  return readFileSync(join(process.cwd(), "src/app/styles/shell/workspace/topbar-responsive-search.css"), "utf8");
}

function readTopbarShellControlsCss() {
  return readFileSync(join(process.cwd(), "src/app/styles/shell/chrome/topbar-shell-controls.css"), "utf8");
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
    expect(markup).toContain('height="50"');
    expect(markup).toContain('width="48"');
    expect(markup).toContain('src="/team-logo.png"');
  });

  it("uses the white compact team logo when the folded sidebar is in dark mode", () => {
    const markup = renderTopbar({ isDarkMode: true, isSidebarCollapsed: true });

    expect(markup).toContain('alt="MECO compact team logo"');
    expect(markup).toContain('data-logo-variant="compact"');
    expect(markup).toContain('src="/team-logo-white.png"');
  });

  it("renders a favorite star directly before the active view title", () => {
    const markup = renderTopbar();

    expect(markup).toMatch(
      /<button(?=[^>]*class="[^"]*app-topbar-favorite-button)(?=[^>]*aria-label="Add Timeline to favorites")(?=[^>]*aria-pressed="false")[^>]*>[\s\S]*?<\/button><h1>Timeline<\/h1>/,
    );
  });

  it("greys the favorite star when the active view cannot be favorited", () => {
    const markup = renderTopbar({ onToggleActiveViewFavorite: null });
    const topbarShellCss = readTopbarShellCss();

    expect(markup).toMatch(
      /<button(?=[^>]*class="[^"]*app-topbar-favorite-button)(?=[^>]*aria-label="Timeline cannot be favorited")(?=[^>]*data-enabled="false")(?=[^>]*disabled="")[^>]*>/,
    );
    expect(markup).toContain("lucide-star-off");
    expect(topbarShellCss).toMatch(
      /\.app-topbar-favorite-button:disabled,[\s\S]*\.app-topbar-favorite-button:disabled:focus-visible\s*\{[^}]*color:\s*rgba\(100, 116, 139, 0\.7\);[^}]*cursor:\s*default;[^}]*opacity:\s*1;/,
    );
    expect(topbarShellCss).toMatch(
      /\.page-shell\.dark-mode \.app-topbar-favorite-button:disabled,[\s\S]*\.page-shell\.dark-mode \.app-topbar-favorite-button:disabled:focus-visible\s*\{[^}]*color:\s*rgba\(148, 163, 184, 0\.58\);/,
    );
  });

  it("renders the Home favorite star as unavailable and greyed out", () => {
    const markup = renderTopbar({
      activeViewLabel: "Home",
      onToggleActiveViewFavorite: null,
    });

    expect(markup).toMatch(
      /<button(?=[^>]*class="[^"]*app-topbar-favorite-button)(?=[^>]*aria-label="Home cannot be favorited")(?=[^>]*aria-pressed="false")(?=[^>]*data-active="false")(?=[^>]*data-enabled="false")(?=[^>]*disabled="")[^>]*>[\s\S]*?<h1>Home<\/h1>/,
    );
    expect(markup).toContain("lucide-star-off");
  });

  it("keeps profile and refresh controls out of the topbar", () => {
    const markup = renderTopbar();

    expect(markup).not.toContain("profile-menu");
    expect(markup).not.toContain('aria-label="Refresh workspace"');
  });

  it("uses the shared compact toolbar search styling for the default topbar search", () => {
    const markup = renderTopbar();
    const topbarSearchCss = readTopbarSearchCss();

    expect(markup).toContain('class="app-topbar-search toolbar-filter toolbar-filter-compact toolbar-search"');
    expect(markup).toContain('class="toolbar-filter-icon app-topbar-search-icon"');
    expect(markup).toContain('class="toolbar-search-input app-topbar-search-input"');
    expect(topbarSearchCss).toMatch(/\.app-topbar-search-slot\s*\{[^}]*justify-content:\s*flex-end;/);
  });

  it("lets the topbar title area grow instead of hard-clamping its width", () => {
    const topbarShellCss = readTopbarShellCss();

    expect(topbarShellCss).toMatch(/\.app-topbar-left\s*\{[^}]*max-width:\s*none;[^}]*flex:\s*0 0 auto;/);
    expect(topbarShellCss).not.toMatch(/max-width:\s*clamp\(8rem,\s*17vw,\s*15rem\)/);
  });

  it("lets the default topbar search fill the available topbar slot", () => {
    const topbarSearchCss = readTopbarSearchCss();

    expect(topbarSearchCss).toMatch(
      /\.app-topbar-search\.toolbar-filter-compact\s*\{[^}]*width:\s*100%;[^}]*max-width:\s*none;/,
    );
  });

  it("keeps the responsive search visible as a bar when it switches to icon mode", () => {
    const topbarSearchCss = readTopbarResponsiveSearchCss();

    expect(topbarSearchCss).toMatch(/\.topbar-responsive-search-full-icon-only\s*\{[^}]*width:\s*100%;[^}]*min-width:\s*0;/);
    expect(topbarSearchCss).toMatch(
      /\.topbar-responsive-search-dynamic\.is-icon-mode \.topbar-responsive-search-full-icon-only \.toolbar-search-input\s*\{[^}]*opacity:\s*0;/,
    );
  });

  it("measures the responsive search against its parent container so icon mode can recover", () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "src/features/workspace/shared/filters/topbarResponsiveSearch/useTopbarResponsiveSearchMode.ts",
      ),
      "utf8",
    );

    expect(source).toContain("const container = element.parentElement;");
    expect(source).toContain("observer.observe(container);");
    expect(source).toContain("const widthToTest = nextSearchWidth?.availableWidthPx ?? container.clientWidth;");
    expect(source).not.toContain("observer.observe(element);");
    expect(source).toContain("getCollisionMeasurement(searchRef, effectivePadding, collisionRoots)");
    expect(source).not.toContain("setSearchWidth(element.clientWidth);");
  });

  it("allows compact topbar controls to scroll sideways when controls overflow", () => {
    const topbarSearchCss = readTopbarSearchCss();
    const topbarShellControlsCss = readTopbarShellControlsCss();

    expect(topbarSearchCss).toMatch(
      /@media\s*\(max-width:\s*880px\)\s*\{[\s\S]*\.app-topbar-search-slot\s*\{[^}]*overflow-x:\s*auto;/,
    );
    expect(topbarShellControlsCss).toMatch(
      /@media\s*\(max-width:\s*880px\)\s*\{[\s\S]*\.app-topbar-controls-host \.filter-toolbar,[\s\S]*\.app-topbar-search-host \.filter-toolbar\s*\{[^}]*min-width:\s*max-content;/,
    );
  });

  it("keeps the favorite icon visible when the topbar compacts the title", () => {
    const topbarShellControlsCss = readTopbarShellControlsCss();

    expect(topbarShellControlsCss).toContain(".app-topbar-view-title h1");
    expect(topbarShellControlsCss).not.toContain(".app-topbar-view-title {\n    display: none;");
  });

  it("adds gradient side hints to compact topbar scroll areas", () => {
    const topbarSearchCss = readTopbarSearchCss();

    expect(topbarSearchCss).toMatch(
      /\.app-topbar-search-slot:has\(\.app-topbar-controls-host:not\(:empty\)\),[\s\S]*\.app-topbar-search-slot:has\(\.app-topbar-search-host:not\(:empty\)\)\s*\{[^}]*--app-topbar-scroll-hint-size:\s*1\.25rem;[^}]*mask-image:\s*linear-gradient\(/,
    );
    expect(topbarSearchCss).toMatch(
      /\.app-topbar-search-slot:has\(\.topbar-responsive-search-compact\.is-open\),[\s\S]*\.app-topbar-search-slot:has\(\.task-queue-filter-menu\.is-open\),[\s\S]*\.app-topbar-search-slot:has\(\.milestones-search-suggestions\)\s*\{[^}]*overflow:\s*visible;[^}]*mask-image:\s*none;/,
    );
  });
});
