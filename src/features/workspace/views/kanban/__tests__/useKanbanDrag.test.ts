/// <reference types="jest" />

import { canStartKanbanPointerFallbackDrag } from "../useKanbanDrag";

describe("canStartKanbanPointerFallbackDrag", () => {
  it("does not start fallback dragging for touch gestures", () => {
    expect(canStartKanbanPointerFallbackDrag({ button: 0, pointerType: "touch" })).toBe(false);
  });

  it("allows only left mouse and pen fallback dragging", () => {
    expect(canStartKanbanPointerFallbackDrag({ button: 0, pointerType: "mouse" })).toBe(true);
    expect(canStartKanbanPointerFallbackDrag({ button: 1, pointerType: "mouse" })).toBe(false);
    expect(canStartKanbanPointerFallbackDrag({ button: 0, pointerType: "pen" })).toBe(true);
    expect(canStartKanbanPointerFallbackDrag({ button: 0, pointerType: "" })).toBe(false);
  });
});
