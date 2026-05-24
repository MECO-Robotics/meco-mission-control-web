import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type DragEventHandler,
  type MouseEventHandler,
  type PointerEventHandler,
} from "react";

import type { KanbanColumnDefinition } from "./KanbanColumns";

interface ActiveKanbanDrag<TState extends string, TItem> {
  id: string;
  item: TItem;
  sourceState: TState;
}

interface PendingKanbanPointerDrag<TState extends string, TItem>
  extends ActiveKanbanDrag<TState, TItem> {
  isDragging: boolean;
  startX: number;
  startY: number;
}

export interface KanbanItemDragProps {
  className?: string;
  draggable?: boolean;
  onClickCapture?: MouseEventHandler<HTMLElement>;
  onDragEnd?: DragEventHandler<HTMLElement>;
  onDragStart?: DragEventHandler<HTMLElement>;
  onPointerDown?: PointerEventHandler<HTMLElement>;
  [key: `data-${string}`]: string | undefined;
}

interface UseKanbanDragOptions<TState extends string, TItem> {
  canDropItem?: (item: TItem, targetState: TState, sourceState: TState) => boolean;
  canDropState?: (targetState: TState) => boolean;
  columns: readonly KanbanColumnDefinition<TState>[];
  getItemDragLabel?: (item: TItem) => string;
  getItemId?: (item: TItem) => string;
  itemsByState: Record<TState, readonly TItem[]>;
  onItemDrop?: (item: TItem, targetState: TState, sourceState: TState) => void | Promise<void>;
}

const KANBAN_DRAG_DATA_TYPE = "application/x-meco-kanban-item";
const KANBAN_POINTER_INTERACTIVE_SELECTOR =
  'a[href], button, input, select, textarea, summary, [role="button"], [role="link"], [contenteditable="true"], [data-kanban-drag-ignore="true"]';
const POINTER_DRAG_THRESHOLD_PX = 8;

interface KanbanPointerFallbackStart {
  button: number;
  pointerType: string;
}

interface KanbanPointerFallbackTarget {
  currentTarget: HTMLElement;
  target: EventTarget | null;
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

export function useKanbanDrag<TState extends string, TItem>({
  canDropItem,
  canDropState,
  columns,
  getItemDragLabel,
  getItemId,
  itemsByState,
  onItemDrop,
}: UseKanbanDragOptions<TState, TItem>) {
  const [activeDrag, setActiveDrag] = useState<ActiveKanbanDrag<TState, TItem> | null>(null);
  const [dimmedDragItemId, setDimmedDragItemId] = useState<string | null>(null);
  const dimmedDragFrameRef = useRef<number | null>(null);
  const nativeDragImageRef = useRef<HTMLElement | null>(null);
  const [hoveredDropState, setHoveredDropState] = useState<TState | null>(null);
  const pendingPointerDragRef = useRef<PendingKanbanPointerDrag<TState, TItem> | null>(null);
  const suppressClickRef = useRef(false);
  const dragEnabled = Boolean(getItemId && onItemDrop);
  const itemsById = useMemo(() => {
    const lookup = new Map<string, ActiveKanbanDrag<TState, TItem>>();
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
  }, [columns, getItemId, itemsByState]);
  const isDropStateEnabled = useCallback(
    (targetState: TState) => dragEnabled && (canDropState ? canDropState(targetState) : true),
    [canDropState, dragEnabled],
  );
  const canDropDraggedItem = useCallback(
    (drag: ActiveKanbanDrag<TState, TItem> | null, targetState: TState) => {
      if (!drag || !isDropStateEnabled(targetState) || drag.sourceState === targetState) {
        return false;
      }

      return canDropItem ? canDropItem(drag.item, targetState, drag.sourceState) : true;
    },
    [canDropItem, isDropStateEnabled],
  );
  const findDragItem = (milestone: DragEvent, fallback: ActiveKanbanDrag<TState, TItem> | null) => {
    if (fallback) {
      return fallback;
    }

    const itemId = milestone.dataTransfer.getData(KANBAN_DRAG_DATA_TYPE);
    return itemId ? itemsById.get(itemId) ?? null : null;
  };
  const getDropStateAtPoint = useCallback((clientX: number, clientY: number) => {
    if (typeof document === "undefined") {
      return null;
    }

    const target = document
      .elementFromPoint(clientX, clientY)
      ?.closest("[data-kanban-drop-state]") as HTMLElement | null;
    const state = target?.getAttribute("data-kanban-drop-state");
    return state ? (state as TState) : null;
  }, []);
  const handleSuppressedClick: MouseEventHandler<HTMLElement> = (milestone) => {
    if (!suppressClickRef.current) {
      return;
    }

    milestone.preventDefault();
    milestone.stopPropagation();
  };
  const clearPendingPointerDrag = () => {
    pendingPointerDragRef.current = null;
  };
  const clearDimmedDragSource = useCallback(() => {
    if (
      typeof window !== "undefined" &&
      dimmedDragFrameRef.current !== null &&
      typeof window.cancelAnimationFrame === "function"
    ) {
      window.cancelAnimationFrame(dimmedDragFrameRef.current);
    }

    dimmedDragFrameRef.current = null;
    setDimmedDragItemId(null);
  }, []);
  const clearNativeDragImage = useCallback(() => {
    nativeDragImageRef.current?.remove();
    nativeDragImageRef.current = null;
  }, []);
  const dimSourceAfterNativeDragPreview = useCallback((itemId: string) => {
    if (typeof window === "undefined" || typeof window.requestAnimationFrame !== "function") {
      setDimmedDragItemId(itemId);
      return;
    }

    if (
      dimmedDragFrameRef.current !== null &&
      typeof window.cancelAnimationFrame === "function"
    ) {
      window.cancelAnimationFrame(dimmedDragFrameRef.current);
    }

    dimmedDragFrameRef.current = window.requestAnimationFrame(() => {
      dimmedDragFrameRef.current = null;
      setDimmedDragItemId(itemId);
    });
  }, []);
  const setOpaqueNativeDragImage = useCallback(
    (milestone: DragEvent<HTMLElement>) => {
      if (typeof document === "undefined") {
        return;
      }

      clearNativeDragImage();

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
      nativeDragImageRef.current = dragImage;
      milestone.dataTransfer.setDragImage(
        dragImage,
        Math.max(0, Math.min(sourceBounds.width, milestone.clientX - sourceBounds.left)),
        Math.max(0, Math.min(sourceBounds.height, milestone.clientY - sourceBounds.top)),
      );
    },
    [clearNativeDragImage],
  );

  useEffect(() => clearNativeDragImage, [clearNativeDragImage]);

  useEffect(() => {
    if (!dragEnabled) {
      return undefined;
    }

    const clearPointerDrag = (wasDragging: boolean) => {
      pendingPointerDragRef.current = null;
      setActiveDrag(null);
      clearDimmedDragSource();
      setHoveredDropState(null);
      if (wasDragging) {
        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 0);
      } else {
        suppressClickRef.current = false;
      }
    };
    const handlePointerMove = (event: PointerEvent) => {
      const pendingDrag = pendingPointerDragRef.current;
      if (!pendingDrag) {
        return;
      }

      const distance = Math.hypot(
        event.clientX - pendingDrag.startX,
        event.clientY - pendingDrag.startY,
      );
      if (!pendingDrag.isDragging && distance < POINTER_DRAG_THRESHOLD_PX) {
        return;
      }

      if (!pendingDrag.isDragging) {
        pendingDrag.isDragging = true;
        suppressClickRef.current = true;
        setActiveDrag({
          id: pendingDrag.id,
          item: pendingDrag.item,
          sourceState: pendingDrag.sourceState,
        });
        setDimmedDragItemId(pendingDrag.id);
      }

      const targetState = getDropStateAtPoint(event.clientX, event.clientY);
      setHoveredDropState(
        targetState && canDropDraggedItem(pendingDrag, targetState) ? targetState : null,
      );
    };
    const handlePointerUp = (event: PointerEvent) => {
      const pendingDrag = pendingPointerDragRef.current;
      if (!pendingDrag) {
        return;
      }

      const wasDragging = pendingDrag.isDragging;
      const targetState = getDropStateAtPoint(event.clientX, event.clientY);
      if (wasDragging) {
        event.preventDefault();
        event.stopPropagation();
      }

      clearPointerDrag(wasDragging);
      if (wasDragging && targetState && canDropDraggedItem(pendingDrag, targetState) && onItemDrop) {
        void onItemDrop(pendingDrag.item, targetState, pendingDrag.sourceState);
      }
    };
    const handlePointerCancel = (event: PointerEvent) => {
      void event;
      const pendingDrag = pendingPointerDragRef.current;
      if (!pendingDrag) {
        return;
      }

      clearPointerDrag(pendingDrag.isDragging);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
    };
  }, [canDropDraggedItem, clearDimmedDragSource, dragEnabled, getDropStateAtPoint, onItemDrop]);

  const getColumnDropProps = (targetState: TState) => ({
    "data-kanban-drop-enabled": dragEnabled ? String(isDropStateEnabled(targetState)) : undefined,
    "data-kanban-drop-state": dragEnabled ? targetState : undefined,
    onDragEnter: dragEnabled
      ? (milestone: DragEvent<HTMLElement>) => {
          const drag = findDragItem(milestone, activeDrag);
          if (!canDropDraggedItem(drag, targetState)) {
            return;
          }

          milestone.preventDefault();
          setHoveredDropState(targetState);
        }
      : undefined,
    onDragLeave: dragEnabled
      ? (milestone: DragEvent<HTMLElement>) => {
          if (milestone.currentTarget.contains(milestone.relatedTarget as Node | null)) {
            return;
          }

          setHoveredDropState((current) => (current === targetState ? null : current));
        }
      : undefined,
    onDragOver: dragEnabled
      ? (milestone: DragEvent<HTMLElement>) => {
          const drag = findDragItem(milestone, activeDrag);
          if (!canDropDraggedItem(drag, targetState)) {
            return;
          }

          milestone.preventDefault();
          milestone.dataTransfer.dropEffect = "move";
        }
      : undefined,
    onDrop: dragEnabled
      ? (milestone: DragEvent<HTMLElement>) => {
          const drag = findDragItem(milestone, activeDrag);
          clearPendingPointerDrag();
          clearDimmedDragSource();
          clearNativeDragImage();
          setHoveredDropState(null);
          setActiveDrag(null);
          if (!drag || !canDropDraggedItem(drag, targetState) || !onItemDrop) {
            return;
          }

          milestone.preventDefault();
          milestone.stopPropagation();
          void onItemDrop(drag.item, targetState, drag.sourceState);
        }
      : undefined,
  });

  const getItemDragProps = (
    item: TItem,
    sourceState: TState,
    itemDragEnabled: boolean,
  ): KanbanItemDragProps | undefined => {
    if (!dragEnabled || !getItemId) {
      return undefined;
    }

    const itemId = getItemId(item);
    const handleDragEnd = () => {
      clearPendingPointerDrag();
      clearDimmedDragSource();
      clearNativeDragImage();
      setActiveDrag(null);
      setHoveredDropState(null);
    };
    const handleDragStart: DragEventHandler<HTMLElement> = (milestone) => {
      clearPendingPointerDrag();
      milestone.stopPropagation();
      milestone.dataTransfer.effectAllowed = "move";
      milestone.dataTransfer.setData(KANBAN_DRAG_DATA_TYPE, itemId);
      milestone.dataTransfer.setData("text/plain", getItemDragLabel?.(item) ?? itemId);
      setOpaqueNativeDragImage(milestone);
      setActiveDrag({ id: itemId, item, sourceState });
      dimSourceAfterNativeDragPreview(itemId);
    };
    const handlePointerDown: PointerEventHandler<HTMLElement> = (milestone) => {
      if (
        !itemDragEnabled ||
        !canStartKanbanPointerFallbackDrag(milestone) ||
        isKanbanPointerFallbackInteractiveTarget(milestone)
      ) {
        return;
      }

      pendingPointerDragRef.current = {
        id: itemId,
        isDragging: false,
        item,
        sourceState,
        startX: milestone.clientX,
        startY: milestone.clientY,
      };
      suppressClickRef.current = false;
    };

    return {
      className: `kanban-draggable-card${
        dimmedDragItemId === itemId ? " is-kanban-drag-source-active" : ""
      }`,
      "data-kanban-drag-source": sourceState,
      "data-kanban-item-id": itemId,
      "data-kanban-item-label": getItemDragLabel?.(item),
      draggable: itemDragEnabled,
      onClickCapture: handleSuppressedClick,
      onDragEnd: handleDragEnd,
      onDragStart: itemDragEnabled ? handleDragStart : undefined,
      onPointerDown: itemDragEnabled ? handlePointerDown : undefined,
    };
  };

  return {
    dragEnabled,
    getColumnDropProps,
    getItemDragProps,
    handleSuppressedClick,
    hoveredDropState,
    isDropStateEnabled,
  };
}
