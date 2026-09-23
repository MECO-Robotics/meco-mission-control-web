import { renderToStaticMarkup } from "react-dom/server";
import type { ComponentProps } from "react";

import { SidebarItem, type SidebarItemConfig } from "../SidebarItem";

const config: SidebarItemConfig = {
  id: "resources-parts",
  label: "Parts",
  section: "resources",
  target: { tab: "inventory", inventoryView: "parts" },
  icon: "Package",
  isEnabled: true,
  isDisabled: false,
};

const renderItem = (overrides: Partial<ComponentProps<typeof SidebarItem>> = {}) =>
  renderToStaticMarkup(
    <SidebarItem
      config={config}
      isActive={false}
      activeViewId=""
      isCollapsed={false}
      onSelect={jest.fn()}
      onDisabledSelect={jest.fn()}
      {...overrides}
    />,
  );

describe("SidebarItem", () => {
  it("renders the navigation item contract", () => {
    const markup = renderItem({ isActive: true, activeViewId: config.id });

    expect(markup).toContain('aria-label="Parts"');
    expect(markup).toContain('aria-current="page"');
    expect(markup).toContain('data-active="true"');
    expect(markup).toContain('data-active-view="resources-parts"');
    expect(markup).toContain('data-tutorial-target="sidebar-view-resources-parts"');
    expect(markup).toContain('class="sidebar-nav-item-label"');
    expect(markup).toContain(">Parts</span>");
    expect(markup).toContain("lucide-package");
  });

  it("keeps collapsed rollout state and disabled metadata local to the item", () => {
    const markup = renderItem({
      config: { ...config, isEnabled: false, isDisabled: true },
      isCollapsed: true,
    });

    expect(markup).toContain('title="Parts"');
    expect(markup).toContain('data-enabled="false"');
    expect(markup).toContain('data-robot-disabled="true"');
    expect(markup).toContain('aria-disabled="true"');
    expect(markup).not.toContain('class="sidebar-nav-item-label"');
    expect(markup).toContain('class="sidebar-nav-item-rollout" data-visible="false"');
  });
});
