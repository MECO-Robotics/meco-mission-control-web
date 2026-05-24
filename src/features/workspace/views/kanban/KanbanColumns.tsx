import { cloneElement, isValidElement, type CSSProperties, type ReactNode } from "react";

import {
  useKanbanDrag,
  type KanbanItemDragProps,
} from "@/features/workspace/views/kanban/useKanbanDrag";

export interface KanbanColumnDefinition<TState extends string> {
  state: TState;
  header: ReactNode;
  count: number;
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
            className={columnClassName}
            data-kanban-drop-column={drag.dragEnabled ? column.state : undefined}
            key={column.state}
            onClick={onColumnBodyClick ? () => onColumnBodyClick(column.state) : undefined}
            onClickCapture={onColumnBodyClick ? drag.handleSuppressedClick : undefined}
            onKeyDown={
              onColumnBodyClick
                ? (milestone) => {
                    if (milestone.key !== "Enter" && milestone.key !== " ") {
                      return;
                    }

                    milestone.preventDefault();
                    onColumnBodyClick(column.state);
                  }
                : undefined
            }
            role={onColumnBodyClick ? "button" : undefined}
            tabIndex={onColumnBodyClick ? 0 : undefined}
          >
            <div className={columnHeaderClassName}>
              {column.header}
              <span className={columnCountClassName}>{column.count}</span>
            </div>
            <div
              className={`${columnBodyClassName}${
                drag.hoveredDropState === column.state ? " is-kanban-drop-target" : ""
              }`}
              {...columnDropProps}
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
            </div>
          </section>
        );
      })}
    </div>
  );
}
