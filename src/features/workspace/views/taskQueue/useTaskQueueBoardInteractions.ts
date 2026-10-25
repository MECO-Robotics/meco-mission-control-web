import { useEffect } from "react";
import type { RefObject } from "react";

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
