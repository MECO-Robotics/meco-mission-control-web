/// <reference types="jest" />

import { useEffect } from "react";
import { useKanbanPointerFallbackDrag, type PendingKanbanPointerDrag } from "../useKanbanPointerFallbackDrag";
jest.mock("react", () => ({ ...jest.requireActual("react"), useEffect: jest.fn() }));

import {
  canStartKanbanPointerFallbackDrag,
  isKanbanPointerFallbackInteractiveTarget,
} from "../kanbanDragUtils";

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
    const previousWindow = globalThis.window;
    const handlers = new Map<string, (event: PointerEvent) => void>();
    Object.defineProperty(globalThis, "window", { configurable: true, value: {
      addEventListener: (name: string, handler: (event: PointerEvent) => void) => handlers.set(name, handler),
      removeEventListener: (name: string) => handlers.delete(name),
      setTimeout: (callback: () => void) => callback(),
    } });
    let unmount: (() => void) | undefined;
    jest.mocked(useEffect).mockImplementation((effect) => { unmount = effect() as (() => void); });
    const pending = { current: { id: "a", item: "task", sourceState: "ready", isDragging: false, startX: 0, startY: 0 } as PendingKanbanPointerDrag<string, string> | null };
    const onDrop = jest.fn();
    const setActive = jest.fn();
    const setHovered = jest.fn();
    const clearDimmed = jest.fn();
    const suppress = { current: false };
    try {
      useKanbanPointerFallbackDrag({ canDropDraggedItem: () => true, clearDimmedDragSource: clearDimmed,
        dragEnabled: true, getDropStateAtPoint: () => "done", onItemDrop: onDrop,
        pendingPointerDragRef: pending, setActiveDrag: setActive, setDimmedDragItemId: jest.fn(),
        setHoveredDropState: setHovered, suppressClickRef: suppress });
      handlers.get("pointermove")!({ clientX: 50, clientY: 50 } as PointerEvent);
      expect(pending.current?.isDragging).toBe(true);
      handlers.get("pointercancel")!({} as PointerEvent);
      expect(onDrop).not.toHaveBeenCalled();
      expect(pending.current).toBeNull();
      expect(setActive).toHaveBeenLastCalledWith(null);
      expect(setHovered).toHaveBeenLastCalledWith(null);
      expect(clearDimmed).toHaveBeenCalledTimes(1);
      expect(suppress.current).toBe(false);
      unmount?.();
      expect(handlers.size).toBe(0);
    } finally {
      Object.defineProperty(globalThis, "window", { configurable: true, value: previousWindow });
    }
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
