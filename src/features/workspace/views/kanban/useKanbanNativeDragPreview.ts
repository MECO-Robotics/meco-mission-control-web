import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";

import { createOpaqueKanbanNativeDragImage } from "./kanbanDragUtils";

export function useKanbanNativeDragPreview() {
  const [dimmedDragItemId, setDimmedDragItemId] = useState<string | null>(null);
  const dimmedDragFrameRef = useRef<number | null>(null);
  const nativeDragImageRef = useRef<HTMLElement | null>(null);

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
    (event: DragEvent<HTMLElement>) => {
      clearNativeDragImage();
      nativeDragImageRef.current = createOpaqueKanbanNativeDragImage(event);
    },
    [clearNativeDragImage],
  );

  useEffect(() => clearNativeDragImage, [clearNativeDragImage]);

  return {
    clearDimmedDragSource,
    clearNativeDragImage,
    dimmedDragItemId,
    dimSourceAfterNativeDragPreview,
    setDimmedDragItemId,
    setOpaqueNativeDragImage,
  };
}
