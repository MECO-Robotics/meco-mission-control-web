/// <reference types="jest" />

import { readFileSync } from "node:fs";

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

  it("clears pointer fallback drags on cancel without committing a drop", () => {
    const source = readFileSync(
      "src/features/workspace/views/kanban/useKanbanDrag.ts",
      "utf8",
    );

    expect(source).toContain("const handlePointerCancel = (event: PointerEvent) => {");
    expect(source).toContain('window.addEventListener("pointercancel", handlePointerCancel);');
    expect(source).toContain('window.removeEventListener("pointercancel", handlePointerCancel);');
    expect(source).not.toContain('window.addEventListener("pointercancel", handlePointerUp);');
  });
});
