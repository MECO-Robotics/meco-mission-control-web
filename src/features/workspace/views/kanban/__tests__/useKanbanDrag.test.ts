/// <reference types="jest" />

import { readFileSync } from "node:fs";

import {
  canStartKanbanPointerFallbackDrag,
  isKanbanPointerFallbackInteractiveTarget,
} from "../useKanbanDrag";

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

  it("does not arm fallback dragging from nested interactive controls", () => {
    const interactiveTarget = {};
    const currentTarget = {
      contains: jest.fn((target) => target === interactiveTarget),
    } as unknown as HTMLElement;
    const closest = jest.fn(() => interactiveTarget);
    const target = {
      closest,
    } as unknown as EventTarget;

    expect(isKanbanPointerFallbackInteractiveTarget({ currentTarget, target })).toBe(true);
    expect(closest).toHaveBeenCalledWith(
      'a[href], button, input, select, textarea, summary, [role="button"], [role="link"], [contenteditable="true"], [data-kanban-drag-ignore="true"]',
    );
  });

  it("allows fallback dragging from the card surface", () => {
    const currentTarget = {
      contains: jest.fn(),
    } as unknown as HTMLElement;

    expect(
      isKanbanPointerFallbackInteractiveTarget({
        currentTarget,
        target: currentTarget,
      }),
    ).toBe(false);
  });
});
