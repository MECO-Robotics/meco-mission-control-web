import { useEffect, useRef, useState, type DragEvent, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface KanbanColumnScrollAreaProps {
  children: ReactNode;
  className: string;
  label: string;
  dropProps: {
    "data-kanban-drop-enabled"?: string;
    "data-kanban-drop-state"?: string;
    onDragEnter?: (event: DragEvent<HTMLDivElement>) => void;
    onDragLeave?: (event: DragEvent<HTMLDivElement>) => void;
    onDragOver?: (event: DragEvent<HTMLDivElement>) => void;
    onDrop?: (event: DragEvent<HTMLDivElement>) => void;
  };
}

export function KanbanColumnScrollArea({
  children,
  className,
  label,
  dropProps,
}: KanbanColumnScrollAreaProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState({ canScrollUp: false, canScrollDown: false });

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;

    const updateScrollState = () => {
      const maxScrollTop = Math.max(0, body.scrollHeight - body.clientHeight);
      const canScrollUp = body.scrollTop > 2;
      const canScrollDown = maxScrollTop - body.scrollTop > 2;

      setScrollState((current) =>
        current.canScrollUp === canScrollUp && current.canScrollDown === canScrollDown
          ? current
          : { canScrollUp, canScrollDown },
      );
    };

    let frame: number | undefined;
    const scheduleUpdate = () => {
      if (frame !== undefined) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = undefined;
        updateScrollState();
      });
    };
    const resizeObserver =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(scheduleUpdate);
    const mutationObserver =
      typeof MutationObserver === "undefined" ? null : new MutationObserver(scheduleUpdate);

    resizeObserver?.observe(body);
    mutationObserver?.observe(body, { childList: true, characterData: true, subtree: true });
    body.addEventListener("scroll", scheduleUpdate, { passive: true });
    updateScrollState();

    return () => {
      if (frame !== undefined) cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      body.removeEventListener("scroll", scheduleUpdate);
    };
  }, []);

  const scroll = (direction: "up" | "down") => {
    const body = bodyRef.current;
    if (!body) return;

    body.scrollBy({
      top: (direction === "up" ? -1 : 1) * Math.max(body.clientHeight * 0.8, 120),
      behavior:
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
    });
  };

  return (
    <div
      className="task-queue-board-column-scroll-frame"
    >
      <div
        className={[
          className,
          scrollState.canScrollUp && "has-scroll-fade-up",
          scrollState.canScrollDown && "has-scroll-fade-down",
        ]
          .filter(Boolean)
          .join(" ")}
        ref={bodyRef}
        {...dropProps}
      >
        {children}
      </div>
      {scrollState.canScrollUp || scrollState.canScrollDown ? (
        <div className="task-queue-board-column-scroll-controls">
          {scrollState.canScrollUp ? (
            <button
              aria-label={`Scroll ${label} up`}
              className="task-queue-board-column-scroll-button"
              onClick={(event) => {
                event.stopPropagation();
                scroll("up");
              }}
              type="button"
            >
              <ChevronUp aria-hidden="true" size={16} />
            </button>
          ) : <span />}
          {scrollState.canScrollDown ? (
            <button
              aria-label={`Scroll ${label} down`}
              className="task-queue-board-column-scroll-button"
              onClick={(event) => {
                event.stopPropagation();
                scroll("down");
              }}
              type="button"
            >
              <ChevronDown aria-hidden="true" size={16} />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
