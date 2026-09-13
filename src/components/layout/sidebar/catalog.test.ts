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
        requires: ["season"],
      },
    ])).toHaveLength(1);
  });

  it.each([
    ["a non-array", {}],
    ["an item without required strings", [{ target: {} }]],
    ["an item without a target", [{ id: "home", label: "Dashboard", section: "work", icon: "home" }]],
    ["an item with an unknown requirement", [{ id: "home", label: "Dashboard", section: "work", icon: "home", target: { tab: "home" }, requires: ["unknown"] }]],
  ])("rejects %s", (_description, value) => {
    expect(() => validateSidebarCatalog(value)).toThrow();
  });
});
