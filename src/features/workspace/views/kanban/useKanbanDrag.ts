import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type DragEventHandler,
  type MouseEventHandler,
  type PointerEventHandler,
} from "react";

import type { KanbanColumnDefinition } from "./KanbanColumns";
import {
  KANBAN_DRAG_DATA_TYPE,
  buildKanbanDragLookup,
  canStartKanbanPointerFallbackDrag,
  getKanbanDragDataItem,
  getKanbanDropStateAtPoint,
  isKanbanPointerFallbackInteractiveTarget,
  type KanbanDragLookupEntry,
} from "./kanbanDragUtils";
import { useKanbanNativeDragPreview } from "./useKanbanNativeDragPreview";
import {
  useKanbanPointerFallbackDrag,
  type PendingKanbanPointerDrag,
} from "./useKanbanPointerFallbackDrag";

type ActiveKanbanDrag<TState extends string, TItem> = KanbanDragLookupEntry<TState, TItem>;

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
  const [hoveredDropState, setHoveredDropState] = useState<TState | null>(null);
  const pendingPointerDragRef = useRef<PendingKanbanPointerDrag<TState, TItem> | null>(null);
  const suppressClickRef = useRef(false);
  const dragEnabled = Boolean(getItemId && onItemDrop);
  const itemsById = useMemo(
    () => buildKanbanDragLookup(columns, getItemId, itemsByState),
    [columns, getItemId, itemsByState],
  );
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

    return getKanbanDragDataItem(milestone.dataTransfer, itemsById);
  };
  const getDropStateAtPoint = useCallback(
    (clientX: number, clientY: number) => getKanbanDropStateAtPoint<TState>(clientX, clientY),
    [],
  );
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
  const {
    clearDimmedDragSource,
    clearNativeDragImage,
    dimmedDragItemId,
    dimSourceAfterNativeDragPreview,
    setDimmedDragItemId,
    setOpaqueNativeDragImage,
  } = useKanbanNativeDragPreview();

  useKanbanPointerFallbackDrag({
    canDropDraggedItem,
    clearDimmedDragSource,
    dragEnabled,
    getDropStateAtPoint,
    onItemDrop,
    pendingPointerDragRef,
    setActiveDrag,
    setDimmedDragItemId,
    setHoveredDropState,
    suppressClickRef,
  });

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
