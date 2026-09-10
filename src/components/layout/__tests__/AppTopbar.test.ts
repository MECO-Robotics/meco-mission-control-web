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
    isDarkMode?: boolean;
    isSidebarCollapsed?: boolean;
  } = {},
) {
  return renderToStaticMarkup(
    React.createElement(AppTopbar, {
      activeViewLabel: options.activeViewLabel ?? "Timeline",
      isDarkMode: options.isDarkMode ?? false,
      isSidebarCollapsed: options.isSidebarCollapsed ?? false,
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

  it("keeps profile and refresh controls out of the topbar", () => {
    const markup = renderTopbar();

    expect(markup).not.toContain("profile-menu");
    expect(markup).not.toContain('aria-label="Refresh workspace"');
  });

  it("provides page-owned controls without a nonfunctional global search", () => {
    const markup = renderTopbar();
    expect(markup).toContain('id="workspace-topbar-slot-controls"');
    expect(markup).not.toContain('aria-label="Search workspace"');
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

  it("keeps the title visible when the topbar compacts", () => {
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
