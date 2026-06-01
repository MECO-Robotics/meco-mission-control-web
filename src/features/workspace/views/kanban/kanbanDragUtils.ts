import type { DragEvent } from "react";

export const KANBAN_DRAG_DATA_TYPE = "application/x-meco-kanban-item";
export const POINTER_DRAG_THRESHOLD_PX = 8;

const KANBAN_POINTER_INTERACTIVE_SELECTOR =
  'a[href], button, input, select, textarea, summary, [role="button"], [role="link"], [contenteditable="true"], [data-kanban-drag-ignore="true"]';

interface KanbanPointerFallbackStart {
  button: number;
  pointerType: string;
}

interface KanbanPointerFallbackTarget {
  currentTarget: HTMLElement;
  target: EventTarget | null;
}

export interface KanbanDragLookupEntry<TState extends string, TItem> {
  id: string;
  item: TItem;
  sourceState: TState;
}

export function canStartKanbanPointerFallbackDrag({
  button,
  pointerType,
}: KanbanPointerFallbackStart) {
  if (pointerType === "touch") {
    return false;
  }

  if (pointerType === "mouse") {
    return button === 0;
  }

  return pointerType === "pen";
}

export function isKanbanPointerFallbackInteractiveTarget({
  currentTarget,
  target,
}: KanbanPointerFallbackTarget) {
  if (!target || target === currentTarget) {
    return false;
  }

  const closestTarget = target as EventTarget & {
    closest?: (selector: string) => Element | null;
  };
  const interactiveTarget =
    typeof closestTarget.closest === "function"
      ? closestTarget.closest(KANBAN_POINTER_INTERACTIVE_SELECTOR)
      : null;

  return Boolean(
    interactiveTarget &&
      interactiveTarget !== currentTarget &&
      currentTarget.contains(interactiveTarget),
  );
}

export function getKanbanDropStateAtPoint<TState extends string>(
  clientX: number,
  clientY: number,
) {
  if (typeof document === "undefined") {
    return null;
  }

  const target = document
    .elementFromPoint(clientX, clientY)
    ?.closest("[data-kanban-drop-state]") as HTMLElement | null;
  const state = target?.getAttribute("data-kanban-drop-state");
  return state ? (state as TState) : null;
}

export function buildKanbanDragLookup<TState extends string, TItem>(
  columns: readonly { state: TState }[],
  getItemId: ((item: TItem) => string) | undefined,
  itemsByState: Record<TState, readonly TItem[]>,
) {
  const lookup = new Map<string, KanbanDragLookupEntry<TState, TItem>>();
  if (!getItemId) {
    return lookup;
  }

  columns.forEach((column) => {
    itemsByState[column.state].forEach((item) => {
      const id = getItemId(item);
      lookup.set(id, { id, item, sourceState: column.state });
    });
  });

  return lookup;
}

export function getKanbanDragDataItem<TState extends string, TItem>(
  dataTransfer: DataTransfer,
  itemsById: ReadonlyMap<string, KanbanDragLookupEntry<TState, TItem>>,
) {
  const itemId = dataTransfer.getData(KANBAN_DRAG_DATA_TYPE);
  return itemId ? itemsById.get(itemId) ?? null : null;
}

export function createOpaqueKanbanNativeDragImage(milestone: DragEvent<HTMLElement>) {
  if (typeof document === "undefined") {
    return null;
  }

  const source = milestone.currentTarget;
  const sourceBounds = source.getBoundingClientRect();
  const dragImage = source.cloneNode(true) as HTMLElement;
  dragImage.classList.remove("is-kanban-drag-source-active");
  dragImage.setAttribute("aria-hidden", "true");
  Object.assign(dragImage.style, {
    boxSizing: "border-box",
    height: `${sourceBounds.height}px`,
    left: "-10000px",
    opacity: "1",
    pointerEvents: "none",
    position: "fixed",
    top: "-10000px",
    transform: "none",
    width: `${sourceBounds.width}px`,
    zIndex: "-1",
  });

  document.body.appendChild(dragImage);
  milestone.dataTransfer.setDragImage(
    dragImage,
    Math.max(0, Math.min(sourceBounds.width, milestone.clientX - sourceBounds.left)),
    Math.max(0, Math.min(sourceBounds.height, milestone.clientY - sourceBounds.top)),
  );
  return dragImage;
}
