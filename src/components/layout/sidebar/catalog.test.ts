import { validateSidebarCatalog } from "./catalog";

describe("validateSidebarCatalog", () => {
  it("accepts the sidebar catalog shape", () => {
    expect(validateSidebarCatalog([
      {
        id: "home",
        label: "Dashboard",
        section: "work",
        icon: "layout-dashboard",
        target: { tab: "home" },
      },
    ])).toHaveLength(1);
  });

  it.each([
    ["a non-array", {}],
    ["an item without required strings", [{ target: {} }]],
    ["an item without a target", [{ id: "home", label: "Dashboard", section: "work", icon: "home" }]],
  ])("rejects %s", (_description, value) => {
    expect(() => validateSidebarCatalog(value)).toThrow();
  });
});
