import { useEffect } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";

import { TASK_QUEUE_LAZY_LOAD_BATCH_SIZE } from "./taskQueueKanbanBoardState";

type ZoomBoard = (direction: 1 | -1) => void;

export function useTaskQueueBoardZoomInput(
  boardShellRef: RefObject<HTMLDivElement | null>,
  zoomBoard: ZoomBoard,
) {
  useEffect(() => {
    const shell = boardShellRef.current;
    if (!shell) {
      return;
    }

    const handleWheel = (milestone: WheelEvent) => {
      if (!(milestone.ctrlKey || milestone.metaKey) || milestone.deltaY === 0) {
        return;
      }

      milestone.preventDefault();
      zoomBoard(milestone.deltaY > 0 ? -1 : 1);
    };

    const gestureScale = { current: 1 };

    const handleGestureStart = (milestone: Event) => {
      milestone.preventDefault();
      const gesture = milestone as Event & { scale?: number };
      gestureScale.current = gesture.scale ?? 1;
    };

    const handleGestureChange = (milestone: Event) => {
      milestone.preventDefault();
      const gesture = milestone as Event & { scale?: number };
      const nextScale = gesture.scale ?? 1;
      if (Math.abs(nextScale - gestureScale.current) < 0.08) {
        return;
      }

      zoomBoard(nextScale > gestureScale.current ? 1 : -1);
      gestureScale.current = nextScale;
    };

    shell.addEventListener("wheel", handleWheel, { passive: false });
    shell.addEventListener("gesturestart", handleGestureStart, { passive: false } as AddEventListenerOptions);
    shell.addEventListener("gesturechange", handleGestureChange, {
      passive: false,
    } as AddEventListenerOptions);

    return () => {
      shell.removeEventListener("wheel", handleWheel);
      shell.removeEventListener("gesturestart", handleGestureStart);
      shell.removeEventListener("gesturechange", handleGestureChange);
    };
  }, [boardShellRef, zoomBoard]);
}

export function useTaskQueueBoardLazyLoading({
  isFocused,
  loadMoreRef,
  processedTaskCount,
  boardShellRef,
  setVisibleTaskCount,
  visibleTaskCount,
}: {
  isFocused: boolean;
  loadMoreRef: RefObject<HTMLDivElement | null>;
  processedTaskCount: number;
  boardShellRef: RefObject<HTMLDivElement | null>;
  setVisibleTaskCount: Dispatch<SetStateAction<number>>;
  visibleTaskCount: number;
}) {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      isFocused ||
      visibleTaskCount >= processedTaskCount
    ) {
      return;
    }

    const shell = boardShellRef.current;
    const sentinel = loadMoreRef.current;
    if (!shell || !sentinel) {
      return;
    }

    const loadMore = () => {
      setVisibleTaskCount((current) =>
        Math.min(current + TASK_QUEUE_LAZY_LOAD_BATCH_SIZE, processedTaskCount),
      );
    };

    const maybePrefetchMore = () => {
      const sentinelRect = sentinel.getBoundingClientRect();
      if (sentinelRect.top <= window.innerHeight + 240) {
        loadMore();
      }
    };

    const handleColumnScroll = (event: Event) => {
      const columnBody = event.target;
      if (
        columnBody instanceof HTMLElement &&
        columnBody.classList.contains("task-queue-board-column-body") &&
        columnBody.scrollTop + columnBody.clientHeight >= columnBody.scrollHeight - 240
      ) {
        loadMore();
      }
    };

    let rafId: number | undefined;
    const handleScroll = () => {
      if (rafId !== undefined) {
        return;
      }

      rafId = window.requestAnimationFrame(() => {
        rafId = undefined;
        maybePrefetchMore();
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    shell.addEventListener("scroll", handleColumnScroll, true);

    return () => {
      if (rafId !== undefined) {
        window.cancelAnimationFrame(rafId);
      }

      window.removeEventListener("scroll", handleScroll);
      shell.removeEventListener("scroll", handleColumnScroll, true);
    };
  }, [
    boardShellRef,
    isFocused,
    loadMoreRef,
    processedTaskCount,
    setVisibleTaskCount,
    visibleTaskCount,
  ]);
}
