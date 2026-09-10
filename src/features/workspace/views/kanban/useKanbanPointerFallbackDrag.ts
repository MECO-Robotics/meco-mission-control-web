import { useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from "react";

import {
  POINTER_DRAG_THRESHOLD_PX,
  type KanbanDragLookupEntry,
} from "./kanbanDragUtils";

type ActiveKanbanDrag<TState extends string, TItem> = KanbanDragLookupEntry<TState, TItem>;

export interface PendingKanbanPointerDrag<TState extends string, TItem>
  extends ActiveKanbanDrag<TState, TItem> {
  isDragging: boolean;
  startX: number;
  startY: number;
}

interface UseKanbanPointerFallbackDragOptions<TState extends string, TItem> {
  canDropDraggedItem: (drag: ActiveKanbanDrag<TState, TItem> | null, targetState: TState) => boolean;
  clearDimmedDragSource: () => void;
  dragEnabled: boolean;
  getDropStateAtPoint: (clientX: number, clientY: number) => TState | null;
  onItemDrop?: (item: TItem, targetState: TState, sourceState: TState) => void | Promise<void>;
  pendingPointerDragRef: MutableRefObject<PendingKanbanPointerDrag<TState, TItem> | null>;
  setActiveDrag: Dispatch<SetStateAction<ActiveKanbanDrag<TState, TItem> | null>>;
  setDimmedDragItemId: Dispatch<SetStateAction<string | null>>;
  setHoveredDropState: Dispatch<SetStateAction<TState | null>>;
  suppressClickRef: MutableRefObject<boolean>;
}

export function useKanbanPointerFallbackDrag<TState extends string, TItem>({
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
}: UseKanbanPointerFallbackDragOptions<TState, TItem>) {
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
  }, [
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
  ]);
}
