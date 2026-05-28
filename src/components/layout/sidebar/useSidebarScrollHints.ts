import { type RefObject, useEffect, useRef, useState } from "react";

const SCROLL_EDGE_THRESHOLD = 4;

interface SidebarScrollHints {
  hasBottomHint: boolean;
  hasTopHint: boolean;
  sidebarScrollRef: RefObject<HTMLElement | null>;
}

export function useSidebarScrollHints(): SidebarScrollHints {
  const sidebarScrollRef = useRef<HTMLElement | null>(null);
  const [hints, setHints] = useState({ hasBottomHint: false, hasTopHint: false });

  useEffect(() => {
    const element = sidebarScrollRef.current;
    if (!element) {
      return;
    }

    let frameId: number | null = null;

    const updateHints = () => {
      frameId = null;
      const hiddenHeight = element.scrollHeight - element.clientHeight;
      const hasTopHint = element.scrollTop > SCROLL_EDGE_THRESHOLD;
      const hasBottomHint = hiddenHeight - element.scrollTop > SCROLL_EDGE_THRESHOLD;

      setHints((current) => {
        if (current.hasTopHint === hasTopHint && current.hasBottomHint === hasBottomHint) {
          return current;
        }

        return { hasBottomHint, hasTopHint };
      });
    };

    const scheduleUpdate = () => {
      if (frameId !== null) {
        return;
      }

      frameId = window.requestAnimationFrame(updateHints);
    };

    updateHints();
    element.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    const resizeObserver = typeof ResizeObserver === "function" ? new ResizeObserver(scheduleUpdate) : null;
    const mutationObserver = typeof MutationObserver === "function"
      ? new MutationObserver(scheduleUpdate)
      : null;

    resizeObserver?.observe(element);
    mutationObserver?.observe(element, {
      attributes: true,
      childList: true,
      subtree: true,
    });

    return () => {
      element.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();

      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  return {
    hasBottomHint: hints.hasBottomHint,
    hasTopHint: hints.hasTopHint,
    sidebarScrollRef,
  };
}
