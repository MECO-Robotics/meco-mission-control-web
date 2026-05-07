import { useEffect, useRef, useState, type ReactNode } from "react";

import { IconChevronLeft, IconChevronRight } from "@/components/shared/Icons";

interface KanbanScrollFrameProps {
  children: ReactNode;
  motionClassName?: string;
}

export function KanbanScrollFrame({ children, motionClassName = "" }: KanbanScrollFrameProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState({
    canScrollLeft: false,
    canScrollRight: false,
    hasOverflow: false,
  });

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) {
      setScrollState({
        canScrollLeft: false,
        canScrollRight: false,
        hasOverflow: false,
      });
      return;
    }

    const updateScrollState = () => {
      const maxScrollLeft = Math.max(0, shell.scrollWidth - shell.clientWidth);
      const nextHasOverflow = shell.scrollWidth > shell.clientWidth + 4;
      const nextCanScrollLeft = nextHasOverflow && shell.scrollLeft > 4;
      const nextCanScrollRight = nextHasOverflow && shell.scrollLeft < maxScrollLeft - 4;

      setScrollState((current) =>
        current.hasOverflow === nextHasOverflow &&
        current.canScrollLeft === nextCanScrollLeft &&
        current.canScrollRight === nextCanScrollRight
          ? current
          : {
              canScrollLeft: nextCanScrollLeft,
              canScrollRight: nextCanScrollRight,
              hasOverflow: nextHasOverflow,
            },
      );
    };

    let rafId: number | undefined;
    const scheduleScrollStateUpdate = () => {
      if (rafId !== undefined) {
        return;
      }

      rafId = window.requestAnimationFrame(() => {
        rafId = undefined;
        updateScrollState();
      });
    };

    const resizeObserver =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(scheduleScrollStateUpdate);

    resizeObserver?.observe(shell);
    shell.addEventListener("scroll", scheduleScrollStateUpdate, { passive: true });
    window.addEventListener("resize", scheduleScrollStateUpdate);
    updateScrollState();

    return () => {
      if (rafId !== undefined) {
        window.cancelAnimationFrame(rafId);
      }

      resizeObserver?.disconnect();
      shell.removeEventListener("scroll", scheduleScrollStateUpdate);
      window.removeEventListener("resize", scheduleScrollStateUpdate);
    };
  }, []);

  return (
    <div
      className={`task-queue-board-shell-frame${scrollState.canScrollLeft ? " has-scroll-left" : ""}${scrollState.canScrollRight ? " has-scroll-right" : ""}${scrollState.hasOverflow ? " has-task-queue-board-overflow" : ""} ${motionClassName}`}
    >
      {scrollState.hasOverflow ? (
        <div aria-hidden="true" className="task-queue-board-scroll-hints">
          <div
            className={`task-queue-board-scroll-hint task-queue-board-scroll-hint-left${scrollState.canScrollLeft ? "" : " is-hidden"}`}
          >
            <IconChevronLeft />
            <span aria-hidden="true" className="task-queue-board-scroll-hint-label">
              Scroll
            </span>
          </div>
          <div
            className={`task-queue-board-scroll-hint task-queue-board-scroll-hint-right${scrollState.canScrollRight ? "" : " is-hidden"}`}
          >
            <span aria-hidden="true" className="task-queue-board-scroll-hint-label">
              Scroll
            </span>
            <IconChevronRight />
          </div>
        </div>
      ) : null}
      <div className="table-shell task-queue-board-shell" ref={shellRef}>
        {children}
      </div>
    </div>
  );
}
