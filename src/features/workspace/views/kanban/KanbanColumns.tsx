import {
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type ReactNode,
} from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import {
  useKanbanDrag,
  type KanbanItemDragProps,
} from "@/features/workspace/views/kanban/useKanbanDrag";

export interface KanbanColumnDefinition<TState extends string> {
  state: TState;
  header: ReactNode;
  count: number;
}

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

function KanbanColumnScrollArea({
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

interface KanbanColumnsProps<TState extends string, TItem> {
  boardClassName: string;
  canDragItem?: (item: TItem, sourceState: TState) => boolean;
  canDropItem?: (item: TItem, targetState: TState, sourceState: TState) => boolean;
  canDropState?: (targetState: TState) => boolean;
  columnBodyClassName: string;
  columnClassName: string;
  columnEmptyClassName: string;
  columnHeaderClassName: string;
  columnCountClassName: string;
  columns: readonly KanbanColumnDefinition<TState>[];
  emptyLabel: string;
  getItemDragLabel?: (item: TItem) => string;
  getItemId?: (item: TItem) => string;
  itemsByState: Record<TState, readonly TItem[]>;
  renderItem: (item: TItem, state: TState, dragProps?: KanbanItemDragProps) => ReactNode;
  onColumnBodyClick?: (state: TState) => void;
  onItemDrop?: (item: TItem, targetState: TState, sourceState: TState) => void | Promise<void>;
  style?: CSSProperties;
}

export function KanbanColumns<TState extends string, TItem>({
  boardClassName,
  canDragItem,
  canDropItem,
  canDropState,
  columnBodyClassName,
  columnClassName,
  columnEmptyClassName,
  columnHeaderClassName,
  columnCountClassName,
  columns,
  emptyLabel,
  getItemDragLabel,
  getItemId,
  itemsByState,
  renderItem,
  onColumnBodyClick,
  onItemDrop,
  style,
}: KanbanColumnsProps<TState, TItem>) {
  const drag = useKanbanDrag({
    canDropItem,
    canDropState,
    columns,
    getItemDragLabel,
    getItemId,
    itemsByState,
    onItemDrop,
  });

  return (
    <div className={boardClassName} style={style}>
      {columns.map((column) => {
        const items = itemsByState[column.state];
        const columnDropProps = drag.getColumnDropProps(column.state);

        return (
          <section
            className={`${columnClassName} kanban-status-column`}
            data-kanban-drop-column={drag.dragEnabled ? column.state : undefined}
            key={column.state}
            onClick={onColumnBodyClick ? () => onColumnBodyClick(column.state) : undefined}
            onClickCapture={onColumnBodyClick ? drag.handleSuppressedClick : undefined}
          >
            <div
              className={columnHeaderClassName}
              onKeyDown={
                onColumnBodyClick
                  ? (milestone) => {
                      if (milestone.key !== "Enter" && milestone.key !== " ") return;
                      milestone.preventDefault();
                      onColumnBodyClick(column.state);
                    }
                  : undefined
              }
              role={onColumnBodyClick ? "button" : undefined}
              tabIndex={onColumnBodyClick ? 0 : undefined}
            >
              {column.header}
              <span className={columnCountClassName}>{column.count}</span>
            </div>
            <KanbanColumnScrollArea
              className={`${columnBodyClassName}${
                drag.hoveredDropState === column.state ? " is-kanban-drop-target" : ""
              }`}
              dropProps={columnDropProps}
              label={column.state}
            >
              {items.length > 0 ? (
                items.map((item) => {
                  const itemId = getItemId?.(item);
                  if (!drag.dragEnabled || !itemId) {
                    return renderItem(item, column.state);
                  }

                  const itemDragEnabled = canDragItem
                    ? canDragItem(item, column.state)
                    : true;
                  const dragProps = drag.getItemDragProps(item, column.state, itemDragEnabled);
                  const renderedItem = renderItem(item, column.state, dragProps);

                  if (
                    dragProps &&
                    isValidElement<KanbanItemDragProps>(renderedItem) &&
                    renderedItem.props["data-kanban-item-id"] === itemId
                  ) {
                    return cloneElement(renderedItem, { key: itemId });
                  }

                  return (
                    <div key={itemId} {...dragProps}>
                      {renderedItem}
                    </div>
                  );
                })
              ) : (
                <p className={columnEmptyClassName}>{emptyLabel}</p>
              )}
            </KanbanColumnScrollArea>
          </section>
        );
      })}
    </div>
  );
}
