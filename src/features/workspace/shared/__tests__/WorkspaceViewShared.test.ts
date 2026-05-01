/// <reference types="jest" />

import {
  filterSelectionIncludes,
  filterSelectionIntersects,
  getPortalMenuPosition,
  pruneFilterSelection,
} from "@/features/workspace/shared";

describe("WorkspaceViewShared filters", () => {
  it("treats an empty selection as the all option", () => {
    expect(filterSelectionIncludes([], "subsystem-1")).toBe(true);
    expect(filterSelectionIntersects([], ["subsystem-1"])).toBe(true);
  });

  it("prunes stale selections when dropdown options change", () => {
    expect(
      pruneFilterSelection(
        ["old-subsystem", "current-subsystem"],
        [{ id: "current-subsystem", name: "Current subsystem" }],
      ),
    ).toEqual(["current-subsystem"]);
  });

  it("places auto portal menus below when there is room", () => {
    expect(
      getPortalMenuPosition({
        buttonRect: { bottom: 120, right: 260, top: 90 },
        menuHeight: 160,
        menuWidth: 200,
        placement: "auto",
        viewportHeight: 500,
        viewportWidth: 800,
      }),
    ).toEqual({ left: 60, top: 126 });
  });

  it("places auto portal menus above near the viewport bottom", () => {
    expect(
      getPortalMenuPosition({
        buttonRect: { bottom: 470, right: 260, top: 440 },
        menuHeight: 160,
        menuWidth: 200,
        placement: "auto",
        viewportHeight: 500,
        viewportWidth: 800,
      }),
    ).toEqual({ left: 60, top: 274 });
  });
});
